// StartingRun held (C2_FBK kept OFF) + cover loss / EStop: Q-RC-03(a) Emergency with energy removal; plus canonical-like baseline without E2b
import {rt,gesture} from './run.mjs';
const E=(r)=>`EOk=${r.get('b_EStop_Ok')} C1=${r.get('out_LV_C1')} C2=${r.get('out_HV_C2')} STO1=${r.get('STO_DR1')} STO2=${r.get('STO_DR2')} SU=${r.get('recRndC_SU')}`;
const say=(n,r)=>console.log(n.padEnd(40),r.ph().padEnd(8),r.sts().padEnd(5),E(r),'viol',r.viol.length,r.viol[0]||'');
for(const [name,opts] of [['E2 (R1+E2a..d)',{}],['without E2b',{e2b:false}]])
for(const ev of [{in_InterLock_NC_1:false},{in_ES_NC_1:false}]){
 const r=rt(opts); r.plantC2=false; r.hold={in_HV_C2_FBK:false};
 r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);
 gesture(r,{green:true,blue:true,ms:1100}); r.step(50); say(name+' StartingRun',r);
 r.step(1,ev); r.step(20); say('  '+JSON.stringify(ev)+' +20ms',r); r.step(12000); say('  +12s',r);
}
