import fs from 'node:fs';
import crypto from 'node:crypto';
import {inspectNativeSalStructure} from '../src/sal-native-structure.js';
import {parseSalFile} from '../src/sal-parser.js';
const sal=new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url),sgvl=new URL('../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url);
const xml=fs.readFileSync(sal,'utf8');const native=inspectNativeSalStructure(xml);if(native.status!=='PASS')throw Error(JSON.stringify(native));
const model=parseSalFile(sal,{bindingMode:'current',sgvlPath:sgvl});
const blocks=model.networks.flatMap(n=>n.blocks),outputs=blocks.flatMap(b=>b.outputs.map(p=>({...p,block:b.path})));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const details={sha256:hash(sal),sgvlSha256:hash(sgvl),native,binding:{status:model.bindingAudit.status,errors:model.bindingAudit.errors},
variables:model.variables.filter(v=>/fault|error|diag|status|healthy|estop/i.test(v.name)),
errorOutputs:outputs.filter(p=>/error|diag/i.test(p.name)).map(p=>({path:p.path,globals:p.globals,targets:p.targets})),
mappedDiagnostics:[...xml.matchAll(/<fB\w+\b[^>]*(?:mapDiag|mapState)="true"[^>]*>/g)].map(m=>m[0]),
groupPorts:[...xml.matchAll(/<twinSAFEGroupAliasPort\b([^>]*)\/?>/g)].map(m=>m[1]),
statusNetwork:model.networks.find(n=>n.name==='Network10'),
sgvlFaultNames:[...fs.readFileSync(sgvl,'utf8').matchAll(/<Name>([^<]*(?:Fault|Error|Diag)[^<]*)<\/Name>/gi)].map(m=>m[1]),
encoding:[4,5,6].map(bits=>({bits,codeValues:2**bits,nonzeroErrorCodes:2**bits-1,independentBitmaskFlags:bits,bitmaskSubsets:2**bits}))};
const architectureFile=new URL('ARCHITECT.md',import.meta.url);
if(fs.existsSync(architectureFile)){
 const architecture=fs.readFileSync(architectureFile,'utf8');
 const grouped=architecture.split('## Grouped application families')[1]?.split('## Optional detail granularity')[0]??'';
 const detail=architecture.split('## Optional detail granularity')[1]?.split('## Additional named requirements')[0]??'';
 const groupedIds=[...grouped.matchAll(/^\| (F\d{2}) \|/gm)].map(m=>m[1]);
 const detailRows=[...detail.matchAll(/^\| (F\d{2}) \|[^\n]*\| (\d+) \|$/gm)].map(m=>({id:m[1],count:Number(m[2])}));
 details.architectureCheck={groupedIds,uniqueGroupedIds:new Set(groupedIds).size,detailRows,detailSum:detailRows.reduce((sum,r)=>sum+r.count,0),groupedWithDriverWatchdog:groupedIds.length+2,detailsWithDriverWatchdog:detailRows.reduce((sum,r)=>sum+r.count,0)+2,sourceSha256:hash(architectureFile)};
 if(groupedIds.length!==15||new Set(groupedIds).size!==15||detailRows.length!==15||details.architectureCheck.detailSum!==22)throw Error('Architecture catalogue arithmetic mismatch');
}
fs.writeFileSync(new URL('VERIFY_inventory.json',import.meta.url),JSON.stringify(details)+'\n');
console.log(JSON.stringify({sha256:details.sha256,sgvlSha256:details.sgvlSha256,native,binding:details.binding,variableNames:details.variables.map(v=>v.name),errorOutputs:details.errorOutputs,mappedDiagnostics:details.mappedDiagnostics,sgvlFaultNames:details.sgvlFaultNames,encoding:details.encoding}));
