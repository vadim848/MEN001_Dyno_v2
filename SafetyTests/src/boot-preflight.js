import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseSalFile} from './sal-parser.js';
import {inventoryBootSource} from './boot-source-inventory.js';
const workingSal=new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url);
const workingGvl=new URL('../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url);
const manifestFile=new URL('../BOOT_PREFLIGHT_SOURCE_MANIFEST.json',import.meta.url);
const runtimeFile=new URL('./sal-runtime.js',import.meta.url);
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const normalized=bytes=>bytes.toString('utf8').replaceAll('\r\n','\n');
const absolute=file=>path.resolve(file instanceof URL?fileURLToPath(file):file);
const reject=(code,message)=>{const error=new Error(message);error.code=code;throw error;};

// Owns fresh full files. No model/audit/manifest/fallback/phase-seed injection API.
export function preflightWorkingProgram(options={}){
 const report={generatedAt:new Date().toISOString(),status:'ERROR',functionalBootPass:0,
  scope:'Whole source capability inventory only; no functional BOOT execution, phase cuts, seeds or fallback values',
  execution:{performed:false,groupEngineEmulated:false,phaseCuts:[],seededOutputs:[],fallbackValuesSupplied:false}};
 try{
  if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(k=>!['salPath','sgvlPath'].includes(k)))reject('INVALID_FILE_ONLY_INPUT','Only a SAL/SGVL file pair may be supplied; parsed models and copied audit objects are rejected');
  if(Object.hasOwn(options,'salPath')!==Object.hasOwn(options,'sgvlPath'))reject('FILE_PAIR_REQUIRED','Custom SAL and SGVL paths must both be explicit');
  const custom=Object.hasOwn(options,'salPath'),isFilePath=value=>typeof value==='string'?value.trim().length>0:value instanceof URL&&value.protocol==='file:';
  if(custom&&(!isFilePath(options.salPath)||!isFilePath(options.sgvlPath)))reject('FILE_PAIR_REQUIRED','Both custom paths must be nonempty strings or file URLs; null/undefined cannot select defaults');
  const sal=absolute(custom?options.salPath:workingSal),sgvl=absolute(custom?options.sgvlPath:workingGvl);
  const salBytes=fs.readFileSync(sal),sgvlBytes=fs.readFileSync(sgvl),runtimeBytes=fs.readFileSync(runtimeFile);
  const trusted=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  report.capabilityImplementationSha256=Object.fromEntries(['boot-preflight.js','boot-source-inventory.js','sal-parser.js'].map(name=>[name,digest(fs.readFileSync(new URL('./'+name,import.meta.url)))]));
  report.source={sal:{path:sal,rawSha256:digest(salBytes),normalizedSha256:digest(normalized(salBytes))},
   sgvl:{path:sgvl,rawSha256:digest(sgvlBytes),normalizedSha256:digest(normalized(sgvlBytes))},
   runtime:{rawSha256:digest(runtimeBytes),normalizedSha256:digest(normalized(runtimeBytes))},
   normalization:'CRLF→LF only; BOM, attributes, namespaces, declarations, relationships and usage indices retained',acceptedCheckpoint:trusted.acceptedCheckpoint};
  // Explicit matching SGVL is mandatory here, even for relocated test files.
  const model=parseSalFile(sal,{bindingMode:'current',sgvlPath:sgvl});
  if(digest(fs.readFileSync(sal))!==report.source.sal.rawSha256||digest(fs.readFileSync(sgvl))!==report.source.sgvl.rawSha256)reject('SOURCE_CHANGED_DURING_PREFLIGHT','Source files changed while being inventoried');
  report.bindingAudit={status:model.bindingAudit.status,errors:model.bindingAudit.errors,portCount:model.bindingAudit.portCount,
   canonicalWires:model.bindingAudit.edges.length,globalReferences:model.bindingAudit.globalRefs.length};
  const inventory=inventoryBootSource(model,salBytes.toString('utf8'),sgvlBytes.toString('utf8'));
  report.inventory=inventory;report.inventorySha256=digest(JSON.stringify(inventory));
  if(report.inventorySha256!==digest(JSON.stringify(trusted.inventory)))reject('SOURCE_COVERAGE_MISMATCH','Full native inventory differs from the reviewed source: no filtering/masking/writer removal is accepted');
  for(const kind of ['sal','sgvl','runtime'])if(report.source[kind].normalizedSha256!==trusted.normalizedSha256[kind])reject('UNSUPPORTED_SOURCE_REVISION',`${kind} portable source identity differs from the reviewed revision`);
  report.sourceCoverage={status:'MATCH',blocks:inventory.blocks.length,networks:inventory.networks.length,
   inputs:inventory.blocks.reduce((n,b)=>n+b.inputs.length,0),outputs:inventory.blocks.reduce((n,b)=>n+b.outputs.length,0),
   globalWriters:inventory.globalWriters.length,outwardOutputs:inventory.outwardOutputs.length,statefulBlocks:inventory.blocks.filter(b=>b.stateful).length,
   sourceManifestSha256:digest(fs.readFileSync(manifestFile))};
  const n4=inventory.blocks.find(b=>b.path==='//Network4/FBDecouple1');
  const channels=n4.inputs.map((input,index)=>{const output=n4.outputs[index],writers=inventory.globalWriters.filter(w=>w.port===output.path);
   return {input:{path:input.path,id:input.attributes.Id,sources:input.sources,globals:input.globals,aliasTargets:input.aliasTargets},
    output:{path:output.path,id:output.attributes.Id,targets:output.targets},used:!!(writers.length||output.targets.length||output.aliasSources.length),
    writers:writers.map(w=>({...w,readers:inventory.globalReaders.filter(r=>r.variableId===w.variableId)})),nativeUnboundValue:'UNSPECIFIED'};});
  const interfaces=inventory.groupDeclarations.filter(p=>['RunStop','ErrAck'].includes(p.name)).map(p=>({declaration:p,bindings:inventory.groupBindings.filter(v=>v.groupPorts.includes('//'+p.name))}));
  report.status='NOT VERIFIED';
  report.cases=[{id:'BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT',requirements:['BOOT-001','BOOT-002'],status:'NOT VERIFIED',
   code:'UNSUPPORTED_UNBOUND_PROGRAM_INPUT',reason:'Network4 has eight unbound DECOUPLE inputs and seven used phase writers; native unbound values are not established',
   observations:{block:n4.path,channels,unboundInputs:channels.filter(c=>!c.input.sources.length&&!c.input.globals.length&&!c.input.aliasTargets.length).length,usedChannels:channels.filter(c=>c.used).length},
   scope:'Full source inventoried; no Network4 fallback, phase ownership or startup trace executed'},
  {id:'BOOT:UNSUPPORTED_GROUP_LIFECYCLE',requirements:['BOOT-001','BOOT-002','EMG-005','EMG-006'],status:'NOT VERIFIED',
   code:'UNSUPPORTED_GROUP_LIFECYCLE',reason:'RunStop/ErrAck are declared and bound, but the adapter has no group lifecycle/memory/error engine; requested Run and main EStop Restart do not establish group RUN/ErrAck',
   observations:{interfaces,groupEngineModeled:false,groupStateInferred:false,mainEStopRestartIsGroupErrAck:false,nativeErrorStubIsGroupNoFaultProof:false},
   scope:'Software model capability gap; not hardware validation, invalid-project verdict or implemented group emulator'}];
  report.gaps=report.cases.map(c=>({id:c.id,code:c.code,status:c.status,reason:c.reason}));
 }catch(error){
  report.status='ERROR';report.error={code:error.code??'SOURCE_AUDIT_REJECTED',message:error.message};
  report.cases=[{id:'BOOT:SOURCE_REJECTED',requirements:['BOOT-001','BOOT-002'],status:'ERROR',error:report.error.message,code:report.error.code}];
  report.gaps=[];
 }
 return report;
}
