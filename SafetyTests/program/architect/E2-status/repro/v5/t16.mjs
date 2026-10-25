// v5 E2a-RC: window 0.5 s from command + 0.1 s continuous FBK and healthy (Run and R&D), mutants
import {rt,gesture} from './run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const run=(mut,{fbk=30,hvGlitch=null,fbkDip=null,hvBad=false}={})=>{const r=rt({mut});toRnd(r);r.plantC2=false;r.hold={in_HV_C2_FBK:false,...(hvBad?{in_HV_Healthy_FBK:true}:{})};
 r.step(2100);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});let i=0;while(!r.get('out_HV_C2')&&i++<3000)r.step(1);const tc=r.t;let tr=-1;
 for(let k=1;k<=1500;k++){const rel=r.t-tc;const fb=rel>=fbk&&!(fbkDip!==null&&rel===fbkDip);const hv=hvBad||(hvGlitch!==null&&rel===hvGlitch);r.hold={...r.hold,in_HV_C2_FBK:fb,in_HV_Healthy_FBK:hv};r.step(1);if(r.get('b_Step3')&&tr<0)tr=r.t-tc;}
 return 'Run@cmd+'+tr;};
for(const [n,m,o] of [['base fbk30',[],{}],['base fbk700',[],{fbk:700}],['base HV glitch @560',[],{hvGlitch:560}],['base FBK dip @560 (after window)',[],{fbkDip:560}],['base HV faulty',[],{hvBad:true}],
 ['M window bypass FBAnd6.AndIn1',[D('//Network12/FBAnd6','AndIn1')],{}],['M FBAnd6.AndIn2 (FBK)',[D('//Network12/FBAnd6','AndIn2')],{fbk:9999}],['M FBAnd6.AndIn3 (HV)',[D('//Network12/FBAnd6','AndIn3')],{hvBad:true}]])console.log('RUN',n.padEnd(34),run(m,o));
const rnd=(mut,{fbk=30,lvBad=false}={})=>{const r=rt({mut});boot(r);r.plant=false;r.hold={in_LV_C1_FBK:false,...(lvBad?{in_LV_Healthy_FBK:true}:{})};r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});let i=0;while(!r.get('out_LV_C1')&&i++<3000)r.step(1);const tc=r.t;let tr=-1;
 for(let k=1;k<=1500;k++){r.hold={...r.hold,in_LV_C1_FBK:(r.t-tc)>=fbk};r.step(1);if(r.get('b_Step_RnD')&&tr<0)tr=r.t-tc;}return 'R&D@cmd+'+tr;};
for(const [n,m,o] of [['base fbk30',[],{}],['base fbk700',[],{fbk:700}],['base LV faulty',[],{lvBad:true}],['M window bypass N11/FBAnd4.AndIn1',[D('//Network11/FBAnd4','AndIn1')],{}],['M N11/FBAnd4.AndIn2 (FBK)',[D('//Network11/FBAnd4','AndIn2')],{fbk:9999}]])console.log('RND',n.padEnd(34),rnd(m,o));
