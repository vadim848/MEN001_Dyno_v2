// v2-reviewer S3 behaviour probes on candidates/E3 (model evidence only; not hardware). Run with CATALOG_SAL_DIR=candidates/E3/native
import {program,toStartingRun,toRun,stIs,emg} from '../../../test/helpers/catalog-program.js';import fs from 'node:fs';
const P=program();const out=[];const L=(...a)=>{out.push(a.join(' '));};
const rel=(v,a)=>v===undefined?'none':'+'+(v-a);
const tr=(x,a)=>({STO:x.first(s=>s.STO,a-1),SS1:x.first(s=>!s.out_SS1_DR1,a-1),DIS:x.first(s=>s.out_HV_Discharge_Request,a-1),C2:x.first(s=>!s.out_HV_C2,a-1),FBK:x.first(s=>!s.c2f,a-1),
 RND:x.first(s=>stIs(s,'RND')&&!s.out_HV_C2&&!s.c2f,a-1),SAFE:x.first(s=>stIs(s,'SAFE'),a-1),EMG:x.first(emg,a-1),C1OFF:x.first(s=>!s.out_LV_C1,a-1)});
const fmt=(t,a)=>Object.entries(t).map(([k,v])=>k+'='+rel(v,a)).join(' ');
const viol=x=>`viol=${x.viol.count}`;
// 0 normal Run->R&D reference times
const N=(()=>{const x=P.run().fork?P.run():null;return null;})();
{const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(12000);L('P0 normal Run->R&D',fmt(tr(x,a),a),'end',x.status(),viol(x));}
// 1 green held 12 s in Run (one attempt one step: must stay R&D)
{const x=P.run();const p=x.t;x.step({in_Reset_PB:true},12000);x.step({in_Reset_PB:false});x.wait(3000);const a=p+500;L('P1 green held 12 s in Run',fmt(tr(x,a),a),'end',x.status(),'C1',x.r.get('out_LV_C1'),viol(x));}
// 2 green held 3 s in StartingRun after clearance
{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const p=x.t;x.step({in_Reset_PB:true},3000);x.step({in_Reset_PB:false});x.wait(4000);const a=p+500;
 L('P2 green held 3 s in SU',fmt(tr(x,a),a),'end',x.status(),'C1',x.r.get('out_LV_C1'),viol(x));
 // then new BOTH after clearance -> Run?
 x.step({in_HV_Faulty_FBK:false},10);x.wait(2100);x.both();x.wait(3000);L('P2b after abort: new BOTH ->',x.status(),viol(x));}
// 3 BOTH in SU after clearance, then HV normal -> Run; nothing extra
{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const p=x.t;x.both();x.wait(500);const s1=x.status();x.step({in_HV_Faulty_FBK:false});x.wait(3000);
 L('P3 BOTH in SU then HV ok',s1,'->',x.status(),'unlock',!!x.never(s=>s.out_Door_Unlock_Solonoeid,p),viol(x));
 x.wait(2100);const g=x.green(550);const a=g.p+500;x.wait(12000);L('P3b then green down',fmt(tr(x,a),a),x.status(),viol(x));}
// 4 abort in SU then blue in R&D after end -> Unlock allowed (Q-ARCH-10)
{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);x.green(550);x.wait(3000);x.step({in_HV_Faulty_FBK:false},2100);const p=x.t;x.blue(600);x.wait(100);
 L('P4 blue in R&D after abort: unlock',!!x.never(s=>s.out_Door_Unlock_Solonoeid,p),x.status(),viol(x));}
// 5 Emergency (EStop) during descent at various moments vs normal
for(const d of [1000,3000,6500,7300,7900]){const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(a+d-x.t);x.step({in_ES_NC_1:false},12000);
 L(`P5 EStop at a+${d}`,fmt(tr(x,a),a),viol(x));}
// 6 Emergency during SU abort (+200) and protective HV (+3000)
{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const g=x.green(550);const a=g.p+500;x.wait(200);x.step({in_ES_NC_1:false},8000);L('P6 EStop abort+200',fmt(tr(x,a),a),viol(x));
 x.step({in_ES_NC_1:true,in_HV_Faulty_FBK:false},500);x.restart();x.wait(3000);L('P6b restart ->',x.status(),viol(x));x.both();x.wait(3000);L('P6c BOTH ->',x.status());x.wait(2100);x.both();x.wait(3000);L('P6d BOTH ->',x.status());
 x.wait(2100);const g2=x.green(550);const a2=g2.p+500;x.wait(12000);L('P6e normal descent after',fmt(tr(x,a2),a2),x.status(),viol(x));}
{const x=P.run();const ev=x.t;x.step({in_HV_Faulty_FBK:true},3000);x.step({in_ES_NC_1:false},10000);L('P7 HV loss Run, EStop +3000',fmt(tr(x,ev),ev),viol(x));
 x.step({in_ES_NC_1:true,in_HV_Faulty_FBK:false},500);x.restart();x.wait(3000);x.both();x.wait(3000);x.wait(2100);x.both();x.wait(3000);L('P7b restart,BOTH,BOTH ->',x.status());
 x.wait(2100);const g2=x.green(550);const a2=g2.p+500;x.wait(12000);L('P7c normal descent after',fmt(tr(x,a2),a2),x.status(),viol(x));}
// 8 HV loss Run: protective timing; then back, BOTH -> Run, normal descent timing
{const x=P.run();const ev=x.t;x.step({in_HV_Faulty_FBK:true},1);x.wait(8000);L('P8 HV loss in Run',fmt(tr(x,ev),ev),x.status(),viol(x));
 x.step({in_HV_Faulty_FBK:false},2100);x.both();x.wait(3000);L('P8b BOTH ->',x.status());x.wait(2100);const g=x.green(550);const a=g.p+500;x.wait(12000);L('P8c descent after',fmt(tr(x,a),a),x.status(),viol(x));}
// 9 LV loss in SS1 (a+500), NC1 lost at a+1500 -> EMG (protective); LV blip after STO, NC1 lost -> no EMG
{const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(500);x.step({in_LV_Faulty_FBK:true},1000);x.step({in_InterLock_NC_1:false},10000);L('P9 LV@SS1 then NC1',fmt(tr(x,a),a),viol(x));}
{const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(2500);x.step({in_LV_Faulty_FBK:true},100);x.step({in_LV_Faulty_FBK:false},400);x.step({in_InterLock_NC_1:false},10000);L('P9b LV blip after STO then NC1',fmt(tr(x,a),a),'end',x.status(),viol(x));}
// 10 LV blip 200 ms in SU: C1 OFF only after R_end, then Safe
{const x=P.rnd();const {u}=toStartingRun(x);x.wait(Math.max(0,u+200-x.t));const ev=x.t;x.step({in_LV_Faulty_FBK:true},200);x.step({in_LV_Faulty_FBK:false},5000);
 L('P10 LV blip in SU',fmt(tr(x,ev),ev),'end',x.status(),viol(x));}
// 11 green before clearance in SU (green held from BOTH released 300 ms ago): ignored
{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(300);const p=x.t;x.green(600);x.wait(3000);L('P11 green before clearance in SU: STO',!!x.never(s=>s.STO,p),'C2 off',!!x.never(s=>!s.out_HV_C2,p),x.status());}
// 12 HV Faulty in R&D after descent: ignored; green during protective descent ignored
{const x=P.run();const ev=x.t;x.step({in_HV_Faulty_FBK:true},2100);const g=x.green(550);x.wait(8000);L('P12 green during protective',fmt(tr(x,ev),ev),x.status(),'C1',x.r.get('out_LV_C1'),viol(x));}
// 13 two consecutive Run->R&D cycles
{const x=P.run();for(let i=0;i<2;i++){const g=x.green(550);const a=g.p+500;x.wait(12000);L('P13 cycle',i,fmt(tr(x,a),a),x.status());x.wait(2100);x.both();x.wait(3000);}L('P13 end',x.status(),viol(x));}
// 14 SU abort by green + LV loss same time; green in SU and blue during abort window
{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);const p=x.t;x.step({in_Reset_PB:true},550);x.step({in_Reset_PB:false,in_LV_Faulty_FBK:true});x.wait(6000);L('P14 green+LV in SU',fmt(tr(x,p),p),x.status(),viol(x));}
console.log(out.join('\n'));fs.writeFileSync(new URL('./probe.out.txt',import.meta.url),out.join('\n')+'\n');
