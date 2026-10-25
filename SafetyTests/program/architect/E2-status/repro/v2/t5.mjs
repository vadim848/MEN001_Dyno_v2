import {rt,toRun,gesture,trace} from './run.mjs';
// M-g6: EStop near C2_FBK OFF during run-down: sweep offset
for(const mut of [[],[{op:'deactivate-input',block:'//Network6/FBAnd18',port:'AndIn3'}]]){
 let res=[];
 for(const off of [-3,-2,-1,0,1,2,3]){
  const r=rt({mut}); toRun(r); r.plantC2=false; r.hold={in_HV_C2_FBK:true};
  gesture(r,{green:true}); r.step(300);
  const ev=()=>r.setInputs({in_ES_NC_1:false});
  if(off<=0){ r.step(1,{in_ES_NC_1:false}); for(let i=0;i<-off;i++)r.step(1); r.hold={in_HV_C2_FBK:false,in_ES_NC_1:false}; }
  else { r.hold={in_HV_C2_FBK:false}; r.step(off); r.hold={in_HV_C2_FBK:false,in_ES_NC_1:false}; }
  r.step(50); res.push(off+':'+r.ph()+'/'+r.sts()+'/v'+r.viol.length);
 }
 console.log('mut',(mut[0]?mut[0].block+'.'+mut[0].port:'none'),res.join('  '));
}
// M-owner: run-down then R&D->Run must reach Run
for(const mut of [[],[{op:'deactivate-input',block:'//Network6/RUN_DOWN_RESET',port:'OrIn1'}]]){
 const r=rt({mut}); toRun(r); gesture(r,{green:true}); r.step(3000); const a=r.ph();
 r.step(2100); gesture(r,{green:true,blue:true,ms:1100}); r.step(3000);
 console.log('mut',(mut[0]?mut[0].block+'.'+mut[0].port:'none'),'after down',a,'after up',r.ph(),r.sts(),'C2',r.get('out_HV_C2'),'viol',r.viol.length);
}
