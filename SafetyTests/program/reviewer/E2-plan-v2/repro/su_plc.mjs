import {rt,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const E=(r)=>`EOk=${r.get('b_EStop_Ok')} C1=${r.get('out_LV_C1')} C2=${r.get('out_HV_C2')} STO1=${r.get('STO_DR1')} STO2=${r.get('STO_DR2')} SU=${r.get('recRndC_SU')}`;
const say=(n,r)=>console.log(n.padEnd(46),r.ph().padEnd(8),r.sts().padEnd(5),E(r),'viol',r.viol.length,r.viol[0]||'');
for(const [name,opts] of [['ALL E2',{}],['R1+E2a+E2b only',{e2c:false,e2d:false}],['R1+E2a+E2b+E2c',{e2d:false}]])
for(const ev of [{in_InterLock_NC_1:false},{in_ES_NC_1:false},{in_Estop_PLC:true},{in_Mentee_EStop:true},{in_LV_Connector_Interlock:false}]){
 const r=rt(opts); r.plantC2=false; r.hold={in_HV_C2_FBK:false};
 r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);
 gesture(r,{green:true,blue:true,ms:1100}); r.step(50); say(name+' StartingRun',r);
 r.step(1,ev); for(let i=0;i<3;i++){r.step(1); say('  '+JSON.stringify(ev)+' +'+(i+2),r);} r.step(12000); say('  +12s',r);
}
