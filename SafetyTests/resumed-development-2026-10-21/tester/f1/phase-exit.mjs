import fs from 'node:fs';import {createRndDownFixture} from './lifecycle-source.js';
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false},rows=[];
function wait(x,k,v){const end=x.clock.timeMs+2500;while(x.get(k)!==v&&x.clock.timeMs<end)x.sample();if(x.get(k)!==v)throw Error('Preparation unavailable '+k+'='+v+'; not a normative deadline');return x.clock.timeMs;}
for(const offset of [-1,0,1]){let x;const marks={},checks=[];const e=(label,actual,expected)=>checks.push({label,actual,expected});try{
 x=createRndDownFixture();x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);
 x.sample({in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_HV_C2_FBK:true,in_HV_Healthy_FBK:true});x.sample(both);x.advance(1000);wait(x,'SU',true);wait(x,'sto1',true);wait(x,'sto2',true);x.sample({in_HV_Healthy_FBK:false,in_LV_Healthy_FBK:false});wait(x,'b_Step3',true);x.sample(off);x.advance(2100);
 if(!x.get('b_Step3'))throw Error('Established Run source profile unavailable');
 marks.plc=x.sample({inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:true});marks.green=x.sample({in_Reset_PB:true});marks.expectedQ=marks.green+500;x.advance(499+offset);marks.feedback=x.sample({in_HV_C2_FBK:false});x.advance(10);
 marks.step12=wait(x,'b_Step12',true);x.sample({in_LV_Healthy_FBK:true});marks.rnd=wait(x,'b_Step_RnD',true);x.advance(700);
 const owners=x.blockEvents.filter(v=>v.block==='//Network6/RUN_DOWN_OWNER'&&v.timeMs>=marks.green);
 e('new native owner evaluations are actually observed',owners.length>0,true);
 const afterExit=owners.filter(v=>!v.Run);e('actual Runexit observed at owner consumer',afterExit.length>0,true);
 e('pending qualification cannot own down outside actual Run',afterExit.some(v=>v.outputs.RsOut.value),false);
 e('same attempt cannot cascade RnDgreen after realhandoff',x.frames.filter(v=>v.timeMs>=marks.rnd).some(v=>v.signals.SG||v.signals.down),false);
 e('all demanded inputs resolved',x.unbound(),[]);
 const timeline=x.blockEvents.filter(v=>v.timeMs>=marks.expectedQ-3&&v.timeMs<=marks.expectedQ+6&&['//Network6/FBAnd23','//Network6/FBAnd24','//Network6/RUN_DOWN_OWNER','//Network6/RUN_DOWN_RESET','//Network3/FBRs3','//Network3/FBRs8'].includes(v.block));
 rows.push({offset,status:checks.some(c=>JSON.stringify(c.actual)!==JSON.stringify(c.expected))?'FAIL':'PASS',marks,checks,timeline,scope:x.scope,protocolWrites:x.protocolWrites});
}catch(error){rows.push({offset,status:'ERROR',error:error.stack,marks,checks,last:x?.frames.at(-1),scope:x?.scope});}console.log(offset,rows.at(-1).status);}
const report={counts:Object.fromEntries(['PASS','FAIL','ERROR'].map(s=>[s,rows.filter(r=>r.status===s).length])),rows,limits:['Actual native phase writers after initialSafe+sevenN4cuts; no phase, Set, Reset, owner injection after protocolstart','Clockq scheduling uses physicalgreen500 reference; observed native events determine whether qualification was rejected before q or pending capture reset','PLC01 oldnormalreceiver is a concurrency stimulus, not acceptance of F2 stop sequence']};fs.writeFileSync(new URL('phase-exit-results.json',import.meta.url),JSON.stringify(report)+'\n');console.log('TOTAL',JSON.stringify(report.counts));process.exitCode=report.counts.ERROR?3:report.counts.FAIL?1:0;
