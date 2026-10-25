import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseSalFile} from '../src/sal-parser.js';
import {inspectNativeSalStructure} from '../src/sal-native-structure.js';
import {createSafeRunFixture} from '../test/helpers/safe-run-source.js';
const root=new URL('../../',import.meta.url);
const current=new URL('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',root);
const sgvl=new URL('MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',root);
const reference=new URL('../MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',root);
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const before={sal:hash(current),sgvl:hash(sgvl),reference:hash(reference)};
const preflight=inspectNativeSalStructure(fs.readFileSync(current,'utf8'));
if(preflight.status!=='PASS')throw Error('Structure preflight failed');
const model=parseSalFile(current);
if(model.bindingAudit.status!=='PASS')throw Error('Binding preflight failed');
const old=parseSalFile(reference);
const consumers=m=>m.variables.find(v=>v.name==='in_Reset_PB').targetPorts;
const results=[];
for(const hold of [400,1100]){
 const x=createSafeRunFixture('Run');
 const start=x.sample({in_Reset_PB:true,in_Relase_Door_PB:true});x.advance(hold);
 const release=x.sample({in_Relase_Door_PB:false});x.advance(700);
 results.push({case:`BOTH${hold}-release-blue`,start,release,down:x.first('runPhysical',start),hvReset:x.first('runResetHv',start),unbound:x.unbound()});
}
{
 const x=createSafeRunFixture('Run');
 x.sample({in_Reset_PB:true,in_Relase_Door_PB:true});x.advance(1100);
 const neutral=x.sample({in_Reset_PB:false,in_Relase_Door_PB:false});x.advance(2100);
 const settledBeforeGreen=x.current().signals.runPhysical;
 const green=x.sample({in_Reset_PB:true});x.advance(600);
 results.push({case:'BOTH-then-full-neutral-then-fresh-green',neutral,settledBeforeGreen,green,down:x.first('runPhysical',green),delta:x.first('runPhysical',green)-green,neutralEdgeTransient:x.first('runPhysical',neutral),unbound:x.unbound(),limits:x.scope.limits});
}
const after={sal:hash(current),sgvl:hash(sgvl),reference:hash(reference)};
const report={before,after,unchanged:JSON.stringify(before)===JSON.stringify(after),preflight,binding:{status:model.bindingAudit.status,globalRefs:model.bindingAudit.globalRefs.length},rawGreenConsumers:{current:consumers(model),reference:consumers(old)},results,oracle:'Earlier Vadim-approved green500/BOTH1000/chord250/full clear/Run BOTH ignore; cancelled Niv proposals excluded',limits:'Actual SAL component execution with explicit Network3 phase boundary; not full boot/native/online/physical reachability'};
fs.writeFileSync(new URL('GREEN_LEGACY_RECHECK.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
