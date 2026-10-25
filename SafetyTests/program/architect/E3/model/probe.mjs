import {programFromModel,toStartingRun,stIs,emg} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
import {load,kit} from './kit.mjs';
const variant=process.argv[2]||'e3a';const m=load();if(variant!=='base'){(await import('./'+variant+'.mjs')).apply(m,kit(m));}
const P=programFromModel(m,{label:variant,salSha256:'s',sgvlSha256:'s'});
const r=(v,a)=>v===undefined?'-':'+'+(v-a);
const tr=(x,a)=>{const f=(p)=>r(x.first(p,a-1),a);return `STO ${f(s=>s.STO)} DIS ${f(s=>s.out_HV_Discharge_Request)} C2off ${f(s=>!s.out_HV_C2)} FBKoff ${f(s=>!s.c2f)} RndEnd ${f(s=>stIs(s,'RND')&&!s.out_HV_C2&&!s.c2f)} SS1low ${f(s=>!s.out_SS1_DR1)} C1off ${f(s=>!s.out_LV_C1)} SAFE ${f(s=>stIs(s,'SAFE'))} EMG ${f(emg)} Unl ${f(s=>s.out_Door_Unlock_Solonoeid)} viol ${x.viol.count} end ${x.status()}`;};
const T={};
T.D01=()=>{const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(12000);return tr(x,a);};
T.D03=()=>{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const g=x.green(550);const a=g.p+500;x.wait(6000);return tr(x,a)+' SG? '+x.r.get('recRndC_SG');};
T.D03_noHVF_green=()=>{const x=P.rnd();toStartingRun(x);const g=x.green(550);x.wait(6000);return 'green right after start (no clearance): '+tr(x,g.p+500);};
T.D09=()=>{const x=P.rnd();const {u}=toStartingRun(x);x.wait(Math.max(0,u+200-x.t));const ev=x.t;x.step({in_LV_Faulty_FBK:true},200);x.step({in_LV_Faulty_FBK:false},8000);return 'LV blip in SU then back: '+tr(x,ev);};
T.SU_blue=()=>{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const b=x.blue(800);x.wait(500);return 'blue in SU: '+tr(x,b.p);};
T.SU_both=()=>{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const b=x.both();x.wait(3000);return 'BOTH in SU after clearance: '+tr(x,b.p2);};
T.ABORT_emg=()=>{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const g=x.green(550);const a=g.p+500;x.wait(200);x.step({in_ES_NC_1:false},6000);return 'EStop 200ms into abort: '+tr(x,a);};
T.PROT_emg=()=>{const x=P.run();const ev=x.t;x.step({in_HV_Faulty_FBK:true},3000);x.step({in_ES_NC_1:false},8000);return 'HVF in Run, EStop +3s: '+tr(x,ev);};
T.PROT_green=()=>{const x=P.run();const ev=x.t;x.step({in_HV_Faulty_FBK:true},2500);x.green(600);x.wait(8000);return 'HVF in Run, green +2.5s: '+tr(x,ev);};
T.SS1_LV_cover=()=>{const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(500);x.step({in_LV_Faulty_FBK:true},300);x.step({in_InterLock_NC_1:false},3000);return 'SS1 + LV loss, then NC1: '+tr(x,a);};
T.after_STO_cover=()=>{const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(3000);x.step({in_LV_Faulty_FBK:true},300);x.step({in_LV_Faulty_FBK:false,in_InterLock_NC_1:false},9000);return 'after STO LV blip, then NC1: '+tr(x,a);};
T.legacy01=()=>{const x=P.run();const ev=x.t;x.step({inPLC_RnD_Mode_2:true},300);x.step({inPLC_RnD_Mode_2:false},10000);return 'legacy (0,1) 300ms: '+tr(x,ev);};
T.cycle=()=>{const x=P.run();x.green(550);x.wait(10000);const ok1=x.status();const b=x.both();x.wait(3000);return `after descent ${ok1}; new BOTH -> ${x.status()} STO ${x.r.get('STO_DR1')} DIS ${x.r.get('out_HV_Discharge_Request')} viol ${x.viol.count}`;};
T.abort_then_up=()=>{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);x.green(550);x.wait(3000);x.step({in_HV_Faulty_FBK:false},10);x.wait(2100);x.both();x.wait(3000);return `abort then new BOTH -> ${x.status()} viol ${x.viol.count}`;};
const sel=process.argv[3]?process.argv[3].split(','):Object.keys(T);
for(const k of sel){try{console.log(k.padEnd(16),T[k]());}catch(e){console.log(k,'ERR',e.message);}}
