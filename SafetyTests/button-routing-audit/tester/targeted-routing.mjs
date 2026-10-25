import fs from 'node:fs';
import crypto from 'node:crypto';
import {createSafeRunFixture} from '../../test/helpers/safe-run-source.js';
import {parseSalFile} from '../../src/sal-parser.js';
import {physicalRndSource} from '../../src/physical-rnd-source.js';
const root=new URL('../../../',import.meta.url);
const sal=new URL('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',root);
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const results=[];
const both={in_Reset_PB:true,in_Relase_Door_PB:true};
const keys=['runPhysical','runResetSto1','runResetSto2','runDischarge','runResetHv'];
for(const delta of [0,250]){
 const x=createSafeRunFixture('Run');
 const first=x.sample(delta===0?both:{in_Reset_PB:true});
 const second=delta===0?first:x.edgeAfter(first,delta,both);
 x.advance(1100);
 const during=x.frames.filter(f=>f.timeMs>=first);
 const premature=during.find(f=>keys.some(k=>f.signals[k]));
 const released=x.sample({in_Relase_Door_PB:false});x.advance(700);
 const degraded=x.frames.find(f=>f.timeMs>=released&&keys.some(k=>f.signals[k]));
 results.push({id:`RUN-valid-chord-delta${delta}-release-blue`,oracle:'USER_DECISIONS_2026_10_20_HANDOFF.md section2: valid BOTH in Run ignored, no subsequent single from same attempt',status:premature||degraded?'FAIL':'PASS',first,second,released,firstViolation:premature??degraded??null,rises:x.rises,scope:x.scope,unresolved:x.unbound()});
}
{
 const model=parseSalFile(sal);
 const x=physicalRndSource(model,1,{observedSignals:{sg:'recRndC_SG',resetLv:'b_Reset_LV_C1_3',dischargeLv:'b_Set_LV_Discharge_Request_2'}});
 const first=x.sample({in_Reset_PB:true});x.advance(502);
 const before=x.frames.at(-1);
 const plc=x.sample({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});x.advance(10);
 const opposed=x.frames.find(f=>f.timeMs>=plc&&f.signals.up&&f.signals.down);
 results.push({id:'RND-accepted-green-plus-PLC11',status:opposed?'CONDITIONAL_CONFLICT':'NO_CONFLICT_OBSERVED',oracle:'User asks command routing exclusivity; standalone PLC endpoint policy remains unresolved QP, no protocol assumption or full reachability claim',first,plc,before,opposed:opposed??null,outputAfter:x.frames.at(-1),transitions:x.transitions,scope:x.scope,unresolved:x.observed().commandConeUnconnected});
}
const report={sourceSha256:hash(sal),sgvlSha256:hash(new URL('MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',root)),results,limits:['Actual SAL command components with explicit Network3 owner cuts; not full group/native/BOOT reachability.','No software fixes. Independent requests and actual energy outputs are separately observed.']};
fs.writeFileSync(new URL('targeted-routing-results.json',import.meta.url),JSON.stringify(report)+'\n');
console.log(JSON.stringify(results.map(({id,status,firstViolation,opposed,outputAfter})=>({id,status,firstViolation,opposed,outputAfter})),null,2));
