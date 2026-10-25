import {make,phases} from './sim.mjs';
const OWN='//Network6/RUN_DOWN_OWNER/RsOut';
function run(mut,d,{healthy='in_HV_Healthy_FBK'}={}){
 const {r}=make(mut);
 const ph=()=>phases.filter(p=>r.get(p)).join('+');
 if(ph()!=='b_Step3')throw Error('not run '+ph());
 r.setInputs({in_Reset_PB:true});let t=0,ownerAt=null,tonAt=null;
 while(t<3000){r.scan(1);t++;if(ownerAt==null&&r.get(OWN))ownerAt=t;if(tonAt==null&&r.get('//Network6/FBTon1/TonOut'))tonAt=t;if(tonAt!=null&&t>tonAt+20)break;}
 r.setInputs({in_Reset_PB:false});
 for(let i=0;i<50;i++)r.scan(1);
 const pre={ph:ph(),owner:r.get(OWN),ton:r.get('//Network6/FBTon1/TonOut')};
 r.setInputs({[healthy]:true}); // fault polarity (raw TRUE = not healthy in this XML)
 const log=[];let both=false,sawStep12=false,lvSet=false;
 for(let s=1;s<=40;s++){ if(s===d) r.setInputs({in_HV_C2_FBK:false}); r.scan(1);
  const p=ph(); if(r.get('b_Step4')&&r.get('b_Step12'))both=true; if(r.get('b_Step12'))sawStep12=true; if(r.get('b_Step4')&&r.get('b_Set_LV_C1_1'))lvSet=true;
  if(s<=8)log.push(`s${s}:${p}|own=${+r.get(OWN)}|or5=${+r.get('//Network6/FBOr5/OrOut')}|dec4=${+r.get('b_Reset_HV_C2_4')}|ton=${+r.get('//Network6/FBTon1/TonOut')}|s12set2=${+r.get('b_Step12_Set_2')}|s4set=${+r.get('b_Step4_Set')}`);}
 return {mut,d,ownerAt,tonAt,pre,both,sawStep12,lvSetInStep4:lvSet,final:ph(),log};
}
const mode=process.argv[2]||'sweep';
if(mode==='sweep'){for(const healthy of ['in_HV_Healthy_FBK','in_LV_Healthy_FBK'])for(let d=1;d<=7;d++){const a=run('F1',d,{healthy}),b=run('MU11',d,{healthy});console.log(healthy,'d='+d,'F1 both='+a.both,'final='+a.final,'| MU11 both='+b.both,'final='+b.final,'lvC1req/Step4 F1='+a.lvSetInStep4+' MU11='+b.lvSetInStep4);}}
else {const d=+process.argv[3];for(const mut of ['F1','MU11']){const x=run(mut,d);console.log(JSON.stringify({...x,log:undefined}));console.log(x.log.join('\n'));}}
