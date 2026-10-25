import {rt,toRun,gesture} from './run.mjs';
// FBOr13.OrIn2 (g7 resets SR) kill: EStop swept around C2_FBK OFF during Run-down; E2a-only and full E2
for(const [name,opts] of [['E2a only',{e2b:false,e2c:false,e2d:false}],['full E2',{}]])
for(const mut of [[],[{op:'deactivate-input',block:'//Network3/FBOr13',port:'OrIn2'}]]){
 const res=[];
 for(const off of [-2,-1,0]){
  const r=rt({...opts,mut}); toRun(r); r.plantC2=false; r.hold={in_HV_C2_FBK:true};
  gesture(r,{green:true}); r.step(300);
  if(off<0){ r.step(1,{in_ES_NC_1:false}); for(let i=0;i<-off-1;i++)r.step(1); r.hold={in_HV_C2_FBK:false,in_ES_NC_1:false}; } else { r.hold={in_HV_C2_FBK:false,in_ES_NC_1:false}; }
  r.step(50); res.push(off+':'+r.ph()+'/v'+r.viol.length);
 }
 console.log(name.padEnd(9),(mut.length?'mut FBOr13.OrIn2':'base').padEnd(17),res.join('  '));
}
