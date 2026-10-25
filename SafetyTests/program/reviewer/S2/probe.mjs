// v2-reviewer S2 probes (review evidence only; model, not hardware)
import {program,programFromModel,runScenario} from '../../../test/helpers/catalog-program.js';
import '../../../test/catalog/lib/k.js';import '../../../test/catalog/lib/c.js';import '../../../test/catalog/lib/e.js';
import '../../../test/catalog/lib/u.js';import '../../../test/catalog/lib/d.js';import '../../../test/catalog/lib/h.js';
import {drainEnergy} from '../../../test/catalog/lib/e.js';
const P=program();
const emg=s=>s.st.length===1&&s.st[0]==='EMG';
function mut(fn){const m=structuredClone(P.m);for(const n of m.networks)for(const b of n.blocks)for(const p of b.inputs)fn(b,p,n);return programFromModel(m,{...P.identity,label:'mut'});}
const out=[];const log=(...a)=>{out.push(a.join(' '));console.log(...a);};
const run=(lbl,Pm,ids)=>{for(const id of ids){const r=runScenario(id,Pm);log(lbl,id,r.fails.length?'FAIL: '+r.fails.slice(0,2).join(' | ').slice(0,260):'pass');}};
// mutants of each fix
run('drop D04 item4 (FBOrS12Reset.OrIn3)',mut((b,p)=>{if(p.path==='//Network3/FBOrS12Reset/OrIn3')p.channelInterface='Deactivated';}),['D-04','E-08','D-06','K-01']);
run('drop D04 item3 (SG_S12 term)',mut((b,p)=>{if(p.path==='//RndPhysicalCompact/SG_SCOPE/OrIn2')p.channelInterface='Deactivated';}),['D-04']);
run('drop FBK fix (EStopIn5 deactivated)',mut((b,p)=>{if(p.path==='//Network1/FBEstop1/EStopIn5')p.channelInterface='Deactivated';}),['E-04','E-05','E-06']);
run('drop HLT memory (HLT_LV_SRC.OrIn2)',mut((b,p)=>{if(p.path==='//SafeResumption/HLT_LV_SRC/OrIn2')p.channelInterface='Deactivated';}),['D-08','H-05']);
run('drop L3 (FBOrS5.OrIn2)',mut((b,p)=>{if(p.path==='//Network8/FBOrS5/OrIn2')p.channelInterface='Deactivated';}),['E-01']);
run('drop S4a (WIN_C1_IN.AndIn2)',mut((b,p)=>{if(p.path==='//Network11/WIN_C1_IN/AndIn2')p.channelInterface='Deactivated';}),['U-01','K-01']);
// Probe 1: Emergency from R&D, energy drained, green pressed; C1_FBK turns ON while green held, then released while FBK ON
{const x=P.rnd();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});drainEnergy(x);x.wait(500);
 x.step({in_Reset_PB:true},200);x.hold.in_LV_C1_FBK=true;x.step({},300);x.step({in_Reset_PB:false},5);const t=x.t;x.wait(2000);
 log('P1 FBK ON while green held, release with FBK ON: left Emergency?',!!x.never(s=>!emg(s),t-6));
 delete x.hold.in_LV_C1_FBK;x.wait(2000);log('P1b FBK OFF after, no new press: left Emergency (deferred exit)?',!!x.never(s=>!emg(s),t));
 x.restart();x.wait(500);log('P1c new press after FBK OFF -> status',x.status().join('+'),'viol',x.viol.count);}
// Probe 2: green held, FBK ON then OFF while held, release -> exit (allowed by SPEC12)
{const x=P.rnd();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});drainEnergy(x);x.wait(500);
 x.step({in_Reset_PB:true},100);x.hold.in_HV_C2_FBK=true;x.step({},200);delete x.hold.in_HV_C2_FBK;x.step({},200);x.step({in_Reset_PB:false});x.wait(500);
 log('P2 C2_FBK ON/OFF while held, release with FBK OFF -> status',x.status().join('+'));}
// Probe 3: in Run/R&D (EOk TRUE) FBK glitch must not create Emergency through EStopIn5
{const x=P.rnd();x.hold.in_HV_C2_FBK=true;x.wait(300);delete x.hold.in_HV_C2_FBK;x.wait(300);log('P3 R&D, spurious C2_FBK 300ms -> status',x.status().join('+'));}
// Probe 4: HLT memory reset: descent with LV loss -> Safe; then BOTH -> R&D and stays
{const x=P.run();x.green(550);x.wait(1500);x.step({in_LV_Faulty_FBK:true},50);x.step({in_LV_Faulty_FBK:false});
 x.wait(25000);log('P4 after descent with LV pulse in SS1/STO phase -> status',x.status().join('+'));
 x.wait(2100);x.both();x.wait(4000);log('P4b clean BOTH from Safe -> status',x.status().join('+'),'viol',x.viol.count);}
// Probe 5: memory set during descent, then Emergency, Restart -> Safe, BOTH -> R&D stays
{const x=P.run();x.green(550);x.wait(3000);x.step({in_LV_Faulty_FBK:true},50);x.step({in_LV_Faulty_FBK:false});x.wait(500);
 x.step({in_ES_NC_1:false},300);x.step({in_ES_NC_1:true});drainEnergy(x);x.wait(500);x.restart();x.wait(1500);
 log('P5 Emergency during descent with memory, restart ->',x.status().join('+'));x.wait(2100);x.both();x.wait(4000);log('P5b BOTH ->',x.status().join('+'),'viol',x.viol.count);}
// Probe 6: D-04 timing: green 0.45 s in S12 (below threshold) -> no abort; 0.55 -> abort
for(const ms of [450,550]){const x=P.safe();x.hold.in_LV_Faulty_FBK=true;x.both();x.wait(2100);const t=x.t;x.green(ms);x.wait(1500);
 const c1off=x.first(s=>!s.out_LV_C1,t);log('P6 S12 green',ms,'C1 OFF at',c1off===undefined?'none':c1off-t,'status',x.status().join('+'));
 delete x.hold.in_LV_Faulty_FBK;x.wait(3000);log('P6b after LV normal ->',x.status().join('+'),'viol',x.viol.count);}
import fs from 'node:fs';fs.writeFileSync(new URL('./probe.out.txt',import.meta.url),out.join('\n')+'\n');
