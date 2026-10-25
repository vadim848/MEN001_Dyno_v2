import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {readBindingXml} from '../../../src/sal-binding-validator.js';
import {parseSalFile} from '../../../src/sal-parser.js';
import {inspectNativeSalStructure} from '../../../src/sal-native-structure.js';
const [baseSal,baseGvl,candidateSal,candidateGvl,baseDiagram,candidateDiagram]=process.argv.slice(2);
if(!candidateDiagram)throw Error('Explicit baselineSAL baselineSGVL candidateSAL candidateSGVL baselineDiagram candidateDiagram required');
const ledger=JSON.parse(fs.readFileSync(new URL('../../architect/P0_REBASE_LEDGER.json',import.meta.url)));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const walk=n=>[n,...n.children.flatMap(walk)],read=f=>readBindingXml(fs.readFileSync(f,'utf8'));
const aXml=fs.readFileSync(baseSal,'utf8'),bXml=fs.readFileSync(candidateSal,'utf8'),a=read(baseSal),b=read(candidateSal);
const report={sha256:Object.fromEntries(Object.entries({baseSal,baseGvl,candidateSal,candidateGvl,baseDiagram,candidateDiagram}).map(([k,v])=>[k,hash(v)])),checks:[],errors:[]};
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):x;
const check=(label,actual,expected)=>{const ok=JSON.stringify(stable(actual))===JSON.stringify(stable(expected));report.checks.push({label,status:ok?'PASS':'FAIL',actual,expected});if(!ok)report.errors.push(label);};
check('exact current repaired baseline SAL',hash(baseSal),ledger.source.salSha256);check('exact baseline SGVL',hash(baseGvl),ledger.source.sgvlSha256);check('exact baseline diagram',hash(baseDiagram),ledger.source.diagramSha256);
const na=inspectNativeSalStructure(aXml),nb=inspectNativeSalStructure(bXml);check('native source preflight',na.status,'PASS');check('native candidate preflight',nb.status,'PASS');
if(na.status!=='PASS'||nb.status!=='PASS')throw Error('Native preflight failed before parser');
const ma=parseSalFile(baseSal,{bindingMode:'current',sgvlPath:baseGvl}),mb=parseSalFile(candidateSal,{bindingMode:'current',sgvlPath:candidateGvl});
check('both full typed binding audits',[ma.bindingAudit.status,mb.bindingAudit.status],['PASS','PASS']);
check('candidate full native counts',{...Object.fromEntries(['blocks','ports','variables','wires'].map(k=>[k,nb.counts[k]])),globalRefs:mb.bindingAudit.globalRefs.length},ledger.expectedCounts);
const aa=walk(a),bb=walk(b),bp=new Map(bb.filter(n=>n.attr?.Id).map(n=>[n.attr.Id,n]));
const retiredPaths=new Set(ledger.retired.map(r=>r.path));const retiredIds=new Set(ledger.retired.map(r=>r.id));
const oldBlocks=aa.filter(n=>n.parent?.tag==='networkHasFunctionBlocks'),oldRetired=oldBlocks.filter(n=>retiredIds.has(n.attr.Id));
const retiredPortIds=new Set(oldRetired.flatMap(n=>walk(n).filter(n=>['inPort','outPort'].includes(n.tag)).map(n=>n.attr.Id)));
check('exact13 retired native blocks absent',ledger.retired.filter(r=>bp.has(r.id)).map(r=>r.id),[]);
const portsA=new Map(oldBlocks.flatMap(n=>walk(n).filter(n=>['inPort','outPort','parameterPort'].includes(n.tag))).map(n=>[n.attr.Id,n]));
for(const row of ledger.retainedOrder){const old=oldBlocks.find(n=>{let p=n.parent;while(p&&p.tag!=='Network')p=p.parent;return `//${p?.attr.name}/${n.attr.name}`===row.path});const neo=bp.get(old.attr.Id);check('retained block '+row.path,neo?neo.attr:null,{...old.attr,orderOfExecution:String(row.new)});}
const activation=new Set(['//RndPhysicalCompact/GATE_025/AndIn3','//RndPhysicalCompact/GATE_026/AndIn3','//RndPhysicalCompact/GATE_029/OrIn4','//Network7/FBAnd8/AndIn3','//Network7/FBAnd8/AndIn4']);
const pathFor=n=>{let block=n.parent;while(block&&block.parent?.tag!=='networkHasFunctionBlocks')block=block.parent;let net=block?.parent;while(net&&net.tag!=='Network')net=net.parent;return `//${net?.attr.name}/${block?.attr.name}/${n.attr.name}`;};
for(const [id,node]of portsA){if(retiredPortIds.has(id))continue;const expected={...node.attr};if(activation.has(pathFor(node)))Object.assign(expected,{channelInterface:'Activated',deactivate1:'Break Contact (NC)'});check('retained native port attributes '+id,bp.get(id)?.attr??null,expected);}
const sortAttr=o=>Object.fromEntries(Object.entries(o).sort(([a],[b])=>a.localeCompare(b)));
function canonical(n,transform){let node={tag:n.tag,attr:{...n.attr},text:n.text.trim(),children:[]};if(transform){const result=transform(node,n);if(result===null)return null;node=result??node;}node.attr=sortAttr(node.attr);node.children=n.children.map(c=>canonical(c,transform)).filter(Boolean).sort((x,y)=>JSON.stringify(x).localeCompare(JSON.stringify(y)));return node;}
const aliasMoves=new Map(ledger.wireDelta.aliasReaderMoves.map(x=>[x.oldLogicReader,x.newLogicReader]));
const oldVars=aa.filter(n=>n.tag==='variable'),newVars=bb.filter(n=>n.tag==='variable');check('all75 Symbol IDs and declarations',newVars.map(n=>n.attr.Id).sort(),oldVars.map(n=>n.attr.Id).sort());
for(const v of oldVars){const expected=canonical(v,(out,n)=>{
 if(n.tag==='variableUsagesHasUsages'){const mon=walk(n).find(x=>['inPortMoniker','outPortMoniker'].includes(x.tag));if(mon&&!aliasMoves.has(mon.attr.name)&&retiredPaths.has(mon.attr.name.replace(/\/[^/]+$/,'')))return null;}
 if(aliasMoves.has(n.attr.name))out.attr.name=aliasMoves.get(n.attr.name);return out;
});check('complete native Symbol usages/wrappers/nonprogram '+v.attr.name,canonical(newVars.find(n=>n.attr.Id===v.attr.Id)),expected);}
const portMoves=new Map(ledger.wireDelta.globalWriterMoves.map(x=>[x.originalRefs.find(r=>r.direction==='writer').portId,x.newWriterId]));
for(const x of ledger.wireDelta.globalReaderReplacements){const port=aa.find(n=>n.tag==='inPort'&&retiredPortIds.has(n.attr.Id)&&!portMoves.has(n.attr.Id)&&walk(n).some(c=>c.tag==='fbPortGlobalVariableReference'&&c.attr.variableId===x.variableId));if(!port)throw Error('No exact baseline retired global reader '+x.variable);portMoves.set(port.attr.Id,x.targetId);}
for(const x of ledger.wireDelta.aliasReaderMoves){const port=aa.find(n=>['inPort','outPort'].includes(n.tag)&&pathFor(n)===x.oldLogicReader);if(port)portMoves.set(port.attr.Id,x.newPortId);}
const ga=read(baseGvl).children[0],gb=read(candidateGvl).children[0];
const transformedGvl=canonical(ga,(out,n)=>{if(n===ga)delete out.attr.Crc;if(n.tag==='FbPortUsage'){const id=walk(n).find(x=>x.tag==='ModelElementId')?.text.trim();if(retiredPortIds.has(id)&&!portMoves.has(id))return null;}if(n.tag==='ModelElementId'&&portMoves.has(n.text.trim()))out.text=portMoves.get(n.text.trim());return out;});
check('all SGVL declarations and exact allowed usage substitutions',canonical(gb,(out,n)=>{if(n===gb)delete out.attr.Crc;return out;}),transformedGvl);
check('all root/group configuration attributes except native CRC',Object.fromEntries(Object.entries(b.children[0].attr).filter(([k])=>k!=='Crc')),Object.fromEntries(Object.entries(a.children[0].attr).filter(([k])=>k!=='Crc')));
for(const tag of ['twinSAFEGroupAliasPorts'])check('unchanged group metadata '+tag,canonical(bb.find(n=>n.tag===tag)),canonical(aa.find(n=>n.tag===tag)));
check('all14 network identities and attributes',bb.filter(n=>n.tag==='Network').map(n=>n.attr),aa.filter(n=>n.tag==='Network').map(n=>n.attr));
function refs(nodes,transform){return nodes.filter(n=>n.tag==='fbPortGlobalVariableReference').flatMap(n=>{let p=n;while(p&&!['inPort','outPort'].includes(p.tag))p=p.parent;let id=p.attr.Id;if(transform&&retiredPortIds.has(id)){if(!portMoves.has(id))return[];id=portMoves.get(id);}return[{portId:id,attributes:n.attr}];}).sort((x,y)=>x.attributes.Id.localeCompare(y.attributes.Id));}
check('all206 exact global reference IDs/namespaces/port placements',refs(bb,false),refs(aa,true));
const edges=m=>m.bindingAudit.edges.map(e=>e.from+'>'+e.to).sort();const ea=edges(ma),eb=edges(mb);const removed=new Set(ledger.wireDelta.removedWires.map(e=>e.from+'>'+e.to));
check('exact canonical edge delta',eb,[...ea.filter(e=>!removed.has(e)),...ledger.wireDelta.addedWires.map(e=>e.from+'>'+e.to)].sort());
const removedWireIds=new Set(ledger.wireDelta.removedWires.map(e=>e.id));for(const w of aa.filter(n=>n.tag==='wiredLink'&&!removedWireIds.has(n.attr.Id)))check('retained wire native identity '+w.attr.Id,canonical(bp.get(w.attr.Id)),canonical(w));
const da=read(baseDiagram),db=read(candidateDiagram),dbIds=new Map(walk(db).filter(n=>n.attr?.Id&&n.attr.absoluteBounds!==undefined).map(n=>[n.attr.Id,n]));let preserved=0;
for(const n of walk(da).filter(n=>n.attr?.Id&&n.attr.absoluteBounds!==undefined)){const mon=n.children.find(c=>c.tag.endsWith('Moniker'));if(mon&&[...retiredPaths].some(p=>mon.attr.name===p||mon.attr.name?.startsWith(p+'/')))continue;const neo=dbIds.get(n.attr.Id);check('retained geometry '+n.attr.Id,neo?{tag:neo.tag,bounds:neo.attr.absoluteBounds}:null,{tag:n.tag,bounds:n.attr.absoluteBounds});preserved++;}
report.preservedGeometry=preserved;report.status=report.errors.length?'FAIL':'PASS';
// Compact successful checks keep exact mismatch evidence without multi-megabyte duplicate trees.
report.checks=report.checks.map(c=>c.status==='PASS'?{label:c.label,status:c.status}:c);
/* E0-stand P5: frozen evidence source-pair-results.json is never rewritten by test runs; write only to an explicit path. */if(process.env.SOURCE_PAIR_RESULTS_PATH)fs.writeFileSync(process.env.SOURCE_PAIR_RESULTS_PATH,JSON.stringify(report)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,geometry:preserved,errors:report.errors}));process.exitCode=report.errors.length?1:0;
