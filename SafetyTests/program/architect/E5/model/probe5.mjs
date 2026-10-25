// W-03/W-04 with the tf lookup after a 100 ms wait (stand precondition bug), G-07 timeline, extra probes.
import {programFromModel,toSafeToRnd,toStartingRun,stIs} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
import {load,kit} from './kit5.mjs';import {apply} from './e5.mjs';
const mkP=()=>{const m=load();apply(m,kit(m));return programFromModel(m,{label:'p',salSha256:'x',sgvlSha256:'x'});};
const P=mkP();const F='linkSafetyFault';
{const x=P.safe();const {u1}=toSafeToRnd(x,{holdLvFaulty:true});x.wait(100);const tf=x.first(s=>s.c1f,u1-1);x.wait(tf+31000-x.t);
 const off=x.fall('out_LV_C1',u1);x.wait(1000);console.log('W-04*: C1 OFF at tf+',off-tf,'status',x.status(),'SF',x.r.get(F),'emg',!!x.never(s=>s.st.includes('EMG'),u1));}
{const x=P.rnd();x.step({in_HV_Faulty_FBK:true});const {u}=toStartingRun(x);x.wait(100);const tf=x.first(s=>s.c2f,u-1);
 while(x.t<tf+31000){x.step({in_HV_Faulty_FBK:false},50);x.step({in_HV_Faulty_FBK:true},60);}
 const sto=x.first(s=>s.STO,u);const run=x.never(s=>stIs(s,'RUN'),u);x.wait(5000);console.log('W-03*: STO at tf+',sto-tf,'run?',!!run,'status',x.status(),'SF',x.r.get(F));}
{const x=P.safe();x.hold.in_HV_C2_FBK=false;const t=x.t;x.step({inPLC_BypassC1C2:true},3000);const on=x.first(s=>s.out_HV_C2,t);
 const dis=x.rise('out_HV_Discharge_Request',on),off=x.fall('out_HV_C2',on),c1=x.fall('out_LV_C1',on);console.log('G-07: C2 ON',on-t,'HVdis +',dis-on,'C2 OFF +',off-on,'C1 OFF +',c1-on,'status',x.status(),'SF',x.r.get(F),'STS_FAULT',x.r.get('STS_FAULT'));}
// Safe: C2_FBK ON without command -> SF; welded C1 after R&D->Safe -> Emergency 500 ms
{const x=P.safe();x.hold.in_HV_C2_FBK=true;x.wait(50);console.log('spont C2 Safe: SF',x.r.get(F),'emg',x.status());}
// Config exit with welded C2 (S4-F3a)
{const x=P.safe();x.step({inPLC_BypassC1C2:true},2000);x.step({inPLC_BypassC1C2:false},1);const off=x.until(s=>!s.out_HV_C2,5000,'C2 OFF');x.hold.in_HV_C2_FBK=true;x.wait(1000);const e=x.first(s=>s.st.includes('EMG'),off);console.log('Config exit welded C2: EMG at C2 OFF+',e===undefined?'none':e-off);}
// Config: confirmed C1_FBK lost -> Emergency
{const x=P.safe();x.step({inPLC_BypassC1C2:true},2000);const ev=x.t;x.hold.in_LV_C1_FBK=false;x.wait(200);const e=x.first(s=>s.st.includes('EMG'),ev);console.log('Config C1 loss: EMG at +',e===undefined?'none':e-ev);}
// R&D: C1_FBK lost -> Emergency
{const x=P.rnd();const ev=x.t;x.hold.in_LV_C1_FBK=false;x.wait(200);const e=x.first(s=>s.st.includes('EMG'),ev);console.log('R&D C1 loss: EMG at +',e===undefined?'none':e-ev);}
// FBK dither inside the window (Q-V4-01): no fault, R&D reached
{const x=P.safe();x.plant&&0;const {u1}=toSafeToRnd(x);x.hold.in_LV_C1_FBK=false;x.wait(60);delete x.hold.in_LV_C1_FBK;x.wait(1500);console.log('dither in window: status',x.status(),'SF',x.r.get(F),'emg',!!x.never(s=>s.st.includes('EMG'),u1));}
// blue press acknowledges in Safe (Unlock behaviour = QUESTIONS Q-E5-1)
{const x=P.safe();x.hold.in_LV_C1_FBK=false;toSafeToRnd(x);x.wait(1500);delete x.hold.in_LV_C1_FBK;x.wait(2100);const sf0=x.r.get(F);x.blue(600);x.wait(50);console.log('blue ack: SF before',sf0,'after',x.r.get(F),'unlock seen',!!x.log.slice(-650).find(s=>s.out_Door_Unlock_Solonoeid));}
