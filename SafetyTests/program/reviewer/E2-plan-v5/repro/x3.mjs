// Reviewer v5: effect of Symbol transfer (b_Reset_*_Discharge_Req2 -> TON output after 0.5 s window) on
// out_LV_Discharge_Request / out_HV_Discharge_Request while the contactor command is ON. v4 vs v5 prototype. Model only.
const base='file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/';
for(const ver of ['v4/','']){
 const {rt,gesture}=await import(base+ver+'run.mjs');
 const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
 const up=(r,cmd,dis,st)=>{let u=-1,first=-1,last=-1,tst=-1,stoU=-1;for(let i=0;i<3000;i++){r.step(1,i===0?{in_Reset_PB:true,in_Relase_Door_PB:true}:i===1100?{in_Reset_PB:false,in_Relase_Door_PB:false}:undefined);if(u<0&&r.get(cmd))u=i;if(u>=0&&stoU<0&&r.get('STO_DR1'))stoU=i-u;if(u>=0&&r.get(cmd)&&r.get(dis)){if(first<0)first=i-u;last=i-u;}if(u>=0&&tst<0&&r.get(st))tst=i-u;}return `cmd@${u} ${dis}&cmd rel [${first},${last}] STO released rel ${stoU} state ${st} rel ${tst}`;};
 const r=rt({});boot(r);
 console.log(ver||'v5/','Safe->R&D', up(r,'out_LV_C1','out_LV_Discharge_Request','b_Step_RnD'));r.step(2100);
 console.log('   R&D->Run', up(r,'out_HV_C2','out_HV_Discharge_Request','b_Step3'));r.step(2000);
 gesture(r,{green:true,ms:600});r.step(15000);console.log('   after Run->R&D:',r.ph(),'HVdis',+r.get('out_HV_Discharge_Request'),'LVdis',+r.get('out_LV_Discharge_Request'));r.step(2100);
 console.log('   2nd R&D->Run', up(r,'out_HV_C2','out_HV_Discharge_Request','b_Step3'));r.step(2000);
 gesture(r,{green:true,ms:600});r.step(15000);gesture(r,{green:true,ms:600});r.step(5000);console.log('   after R&D->Safe:',r.ph(),'LVdis',+r.get('out_LV_Discharge_Request'));r.step(2100);
 console.log('   2nd Safe->R&D', up(r,'out_LV_C1','out_LV_Discharge_Request','b_Step_RnD'));
}
