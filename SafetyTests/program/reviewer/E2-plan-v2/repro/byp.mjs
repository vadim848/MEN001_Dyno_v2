import {rt,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
const O=(r)=>`C1=${+r.get('out_LV_C1')} C2=${+r.get('out_HV_C2')} STO=${+r.get('STO_DR1')}`;
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
for(const [nm,o] of [['canon',{r1:false,e2a:false,e2b:false,e2c:false,e2d:false}],['E2 all',{}],['E2 mut AndIn3',{mut:[{op:'deactivate-input',block:'//Network1/FBAnd4',port:'AndIn3'}]}]])
for(const st of ['boot','safe','rnd'])for(const cov of [true,false]){
 const r=rt(o); if(st==='boot'){r.step(10);} else if(st==='safe')boot(r); else toRnd(r);
 r.step(1,{in_InterLock_NC_1:cov}); r.step(5); const b=r.ph()+' '+O(r); r.step(1,{inPLC_BypassC1C2:true}); let mx='';for(let i=0;i<600;i++){r.step(1); if((st!=='rnd'&&r.get('out_LV_C1'))||r.get('out_HV_C2')) {mx='ENERGIZED@'+i+' '+O(r);break;}}
 console.log(nm.padEnd(14),st.padEnd(5),'cover',cov?'closed':'open  ',b,'-> bypass',mx||('none '+O(r)), r.ph());
}
