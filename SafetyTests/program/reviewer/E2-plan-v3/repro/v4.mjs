// Reviewer v3: equivalentByProof check for G10_EXIT.AndIn1 (S6) and AndIn6 (C2_FBK) (model).
import {rt} from '../../../architect/E2-status/repro/run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const both=(r)=>{r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1100);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(2500);};
const restart=(r)=>{r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(30);};
const ST=['b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6'];
const D=(p)=>({op:'deactivate-input',block:'//Network3/G10_EXIT',port:p});
// A: R&D EStop, ES released, Restart at various times after event (S4/S5 window with energy off)
for(const [n,m] of [['base',[]],['G10.AndIn1',[D('AndIn1')]]]){
 const out=[];
 for(const tr of [1000,2100,2500,3000,4000,6000,8000]){
  const r=rt({mut:m}); boot(r); both(r); r.step(1,{in_ES_NC_1:false}); r.step(50); r.step(1,{in_ES_NC_1:true}); r.step(tr-51);
  const before=r.ph(); restart(r); let multi=''; for(let i=0;i<12000;i++){r.step(1); const s=ST.filter(x=>r.get(x)); if(s.length>1&&!multi)multi=s.join('+');}
  out.push(`t+${tr}:${before}->${r.ph()}${multi?' MULTI '+multi:''} viol${r.viol.length}`);
 }
 console.log('A',n.padEnd(11),out.join(' | '));
}
// B: R&D EStop -> S6; then C2_FBK TRUE (stuck/glitch, command OFF); ES released; Restart
for(const [n,m] of [['base',[]],['G10.AndIn6',[D('AndIn6')]],['G10.AndIn7',[D('AndIn7')]],['G10.AndIn8',[D('AndIn8')]]]){
 const r=rt({mut:m}); boot(r); both(r); r.step(1,{in_ES_NC_1:false}); r.step(12000); const s6=r.ph(); r.plantC2=false; r.hold={in_HV_C2_FBK:true}; r.step(1,{in_ES_NC_1:true}); r.step(20); restart(r);
 console.log('B',n.padEnd(11),'at',s6,'C2_FBK=1 restart ->',r.ph(),'C2=',+r.get('out_HV_C2'),'viol',r.viol.length);
}
