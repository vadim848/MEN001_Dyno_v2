// v2-reviewer S4 behaviour probes on candidates/E4 (model evidence only). CATALOG_SAL_DIR=candidates/E4/native CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC
import {program,toStartingRun,stIs,emg} from '../../../test/helpers/catalog-program.js';
const P=program();const L=(...a)=>console.log(a.join(' '));const F='STS_FAULT',BY='inPLC_BypassC1C2';
const up=(x,f)=>x.first(s=>s.out_HV_C2||!s.STO,f);
// 1 StartingRun: blue pressed, CMD_RUN_TO_RND edge -> ignored (Q-E4-2 A / V14-Q14); after release not deferred
{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(100);x.step({in_Relase_Door_PB:true},100);const a=x.t;x.step({in_Relase_Door_PB:true,CMD_RUN_TO_RND:true},150);x.step({in_Relase_Door_PB:false,CMD_RUN_TO_RND:true},800);
 L('P1 SU blue pressed + abort edge: STO after edge', x.first(s=>s.STO,a)??'none', 'status',x.status(), 'viol',x.viol.count);}
// 2 held CMD_SAFE_TO_RND: up to R&D, green down to Safe, still held -> must stay Safe
{const x=P.safe();x.step({CMD_SAFE_TO_RND:true},3000);const s1=x.status();x.wait(2100);x.green(550);x.wait(4000);const s2=x.status();x.wait(3000);
 L('P2 held S2R: after edge',s1,'after green',s2,'end',x.status(),'C1',x.r.get('out_LV_C1'),'viol',x.viol.count);}
// 3 StartingRun: CMD_RND_TO_SAFE edge -> ignored (Q-RC-08 2)
{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(100);const a=x.t;x.step({CMD_RND_TO_SAFE:true},200);x.step({CMD_RND_TO_SAFE:false},500);
 L('P3 SU + R2S edge: STO after', x.first(s=>s.STO,a)??'none','C2off',x.first(s=>!s.out_HV_C2,a)??'none','status',x.status());}
// 4 Safe: Bypass held + CMD_SAFE_TO_RND edge -> error, none (Q-RC-18a)
{const x=P.safe();const a=x.t;x.step({[BY]:true,CMD_SAFE_TO_RND:true},1500);L('P4 Safe Bypass+S2R same scan: status',x.status(),'C1 on',x.first(s=>s.out_LV_C1,a)??'none','fault',x.r.get(F));
 x.step({[BY]:false,CMD_SAFE_TO_RND:false},1100);L('   after all FALSE 1.1 s fault',x.r.get(F));}
// 5 Config: two commands TRUE -> no error (Q-RC-04)
{const x=P.safe();x.step({[BY]:true},1000);L('P5 status',x.status());x.step({[BY]:true,CMD_SAFE_TO_RND:true,CMD_RND_TO_RUN:true},500);L('   Config + 2 cmds: fault',x.r.get(F),'status',x.status());
 x.step({[BY]:false},3000);L('   exit with cmds TRUE: status',x.status(),'fault',x.r.get(F));x.step({CMD_SAFE_TO_RND:false,CMD_RND_TO_RUN:false},1500);L('   end',x.status(),'C1',x.r.get('out_LV_C1'));}
// 6 Config exit with C1_FBK stuck ON -> stuck in Config? (E6 bounded)
{const x=P.safe();x.step({[BY]:true},1000);x.hold.in_LV_C1_FBK=true;x.step({[BY]:false},8000);L('P6 exit, C1_FBK stuck: status',x.status(),'C1',x.r.get('out_LV_C1'),'C2',x.r.get('out_HV_C2'));}
// 7 PLC default mapping (n_SafeSate=0 -> CMD_RND_TO_SAFE held TRUE): Bypass edge in Safe
{const x=P.safe();x.step({CMD_RND_TO_SAFE:true},1500);const a=x.t;x.step({CMD_RND_TO_SAFE:true,[BY]:true},3000);L('P7 R2S held + Bypass: status',x.status(),'fault',x.r.get(F),'C1on',x.first(s=>s.out_LV_C1,a)??'none');}
// 8 Bypass edge and BOTH same moment: BOTH wins
{const x=P.safe();x.wait(2100);x.step({in_Reset_PB:true,in_Relase_Door_PB:true},999);x.step({in_Reset_PB:true,in_Relase_Door_PB:true,[BY]:true},300);x.step({in_Reset_PB:false,in_Relase_Door_PB:false,[BY]:true},3000);
 L('P8 BOTH + Bypass edge: status',x.status(),'fault',x.r.get(F),'viol',x.viol.count);}
// 9 EStop in Config, restart with Bypass still TRUE
{const x=P.safe();x.step({[BY]:true},1000);x.step({in_ES_NC_1:false},2000);x.step({in_ES_NC_1:true},500);const e=x.status();x.restart?.();x.wait(3000);L('P9 Config EStop:',e,'after restart',x.status(),'C1',x.r.get('out_LV_C1'),'C2',x.r.get('out_HV_C2'));}
// 10 Heartbeat stop in Run
{const x=P.run();x.hbStopped=true;const a=x.t;x.wait(3600);L('P10 Run hb stop: EMG at +',(x.first(emg,a)??NaN)-a,'STO',x.r.get('STO_DR1'));}
