// Architect probes on the E4 scratch model (observations, not oracle).
import {programFromModel,stIs,toStartingRun} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
import {load,kit} from './kit.mjs';
import {apply} from './e4.mjs';
const m=load();apply(m,kit(m));const P=programFromModel(m,{label:'e4',salSha256:'scratch',sgvlSha256:'scratch'});
const out=(k,v)=>console.log(k.padEnd(52),typeof v==='object'?JSON.stringify(v):v);
const BY='inPLC_BypassC1C2';
{const x=P.safe();x.step({in_InterLock_NC_1:false},50);x.step({[BY]:true},300);const t=x.t;x.step({CMD_SAFE_TO_RND:true},300);
 out('a Bypass held(open-ish)+S2R edge: status, C1, FAULT',[x.status().join(),x.r.get('out_LV_C1'),x.r.get('STS_FAULT')]);
 x.step({[BY]:false,CMD_SAFE_TO_RND:false},990);out('a  after 990 ms all FALSE: FAULT',x.r.get('STS_FAULT'));x.wait(30);out('a  after 1020 ms: FAULT',x.r.get('STS_FAULT'));void t;}
{const x=P.safe();x.wait(2100);x.step({in_Reset_PB:true,in_Relase_Door_PB:true},500);x.step({in_Reset_PB:true,in_Relase_Door_PB:true,[BY]:true},700);
 x.step({in_Reset_PB:false,in_Relase_Door_PB:false,[BY]:true},1500);out('b BOTH + Bypass edge while pressed: status, C1, C2',[x.status().join(),x.r.get('out_LV_C1'),x.r.get('out_HV_C2')]);}
{const x=P.safe();x.step({[BY]:true},1000);out('c Config: status, C1, C2, STO(torque off), LVDis, HVDis',[x.status().join(),x.r.get('out_LV_C1'),x.r.get('out_HV_C2'),!x.r.get('STO_DR1'),x.r.get('out_LV_Discharge_Request'),x.r.get('out_HV_Discharge_Request')]);
 x.step({in_ES_NC_1:false},300);x.step({in_ES_NC_1:true},12000);out('c  EStop in Config -> status, C1, C2',[x.status().join(),x.r.get('out_LV_C1'),x.r.get('out_HV_C2')]);
 x.step({in_Reset_PB:true},300);x.step({in_Reset_PB:false},1000);out('c  Restart (Bypass still TRUE) -> status',x.status().join());}
{const x=P.safe();x.step({[BY]:true},1000);const t=x.t;x.hbStopped=true;x.wait(3600);const e=x.first(s=>stIs(s,'EMG'),t);out('d heartbeat stop in Config -> EMG at +ms',e===undefined?'none':e-t);}
{const x=P.safe();x.step({[BY]:true},1000);const t=x.t;x.step({[BY]:false},3000);
 const f=k=>{const i=x.first(s=>!s[k],t);return i===undefined?'none':i-t;};const g=k=>{const i=x.first(s=>s[k],t);return i===undefined?'none':i-t;};
 out('e exit: HVDis set, C2 off, C1 off, LVDis set, SAFE (+ms)',[g('out_HV_Discharge_Request'),f('out_HV_C2'),f('out_LV_C1'),g('out_LV_Discharge_Request'),(x.first(s=>stIs(s,'SAFE'),t)??NaN)-t]);}
{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(100);const t=x.t;x.step({CMD_RUN_TO_RND:true,CMD_RND_TO_SAFE:true},300);x.step({CMD_RUN_TO_RND:false,CMD_RND_TO_SAFE:false},2500);
 out('f SU + RUN2R edge with R2S TRUE: STO at, C2 off at, status, FAULT',[(x.first(s=>s.STO,t)??NaN)-t,(x.first(s=>!s.out_HV_C2,t)??NaN)-t,x.status().join(),x.r.get('STS_FAULT')]);}
{const x=P.run();x.step({CMD_RUN_TO_RND:true},100);x.step({CMD_RUN_TO_RND:false},300);const t=x.t;x.step({in_InterLock_NC_1:false},12000);
 out('g PLC Run->R&D in SS1, NC1 lost: status',[x.status().join(),x.never?.(s=>stIs(s,'EMG'),t)===undefined?'no EMG':'EMG']);}
