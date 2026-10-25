// Tester E1-f1-reclass: requirement-based, reachable behavioural test that distinguishes MU24
// (RndPhysicalCompact/GATE_016.AndIn4 RELEASE gating deactivated) on the FULL canonical program.
// in_False_SI2_CH8 is held constant FALSE throughout (Q-MU06-01 B); it is never driven.
// Oracle sources (SafetyTests/SCENARIO_DECISIONS.md):
//  - item 9 (Vadim): "2 s continuous release of BOTH buttons before a new attempt"; the pause is not counted
//    while a button is still held. Also item 11 ("for a new attempt both buttons released continuously 2 s").
//  - Q-REARM closed by item 9; table row "Startup with held button: not accepted before full release and release filter".
// Initial state: declared Safe (b_Step1 seeded before the protocol; stand convention, assumption A1).
// Run: node --test mu24-reachable-kill.test.mjs            (canonical F1, expected PASS)
//      MUT=MU24 node --test mu24-reachable-kill.test.mjs   (mutant, expected FAIL of the q-1 cases)
import test from 'node:test';import assert from 'node:assert/strict';
import {parseSalFile} from '../../../../src/sal-parser.js';
import {SalRuntime} from '../../../../src/sal-runtime.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno/';
const raw={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_Healthy_FBK:true,in_HV_Healthy_FBK:true,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
const MUT=process.env.MUT||'F1';
function make(){const m=parseSalFile(root+'TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'GVLs/GVL1.sgvl'});const all=m.networks.flatMap(n=>n.blocks);
 assert.equal(all.length,242);
 if(MUT==='MU24')all.find(x=>x.path==='//RndPhysicalCompact/GATE_016').inputs.find(x=>x.name==='AndIn4').channelInterface='Deactivated';
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs(raw);
 const s=(i={},n=1)=>{assert.ok(!('in_False_SI2_CH8' in i),'in_False_SI2_CH8 is a constant FALSE (Q-MU06-01)');r.setInputs(i);for(let k=0;k<n;k++)r.scan(1);};
 s({},10);s({in_Reset_PB:true});s({in_Reset_PB:false});assert.equal(r.get('b_EStop_Ok'),true);
 const b=all.find(x=>x.outputs.some(p=>p.globals.some(g=>g.resolvedName==='b_Step1')));r.memory.set(b.path,{value:true});r.write(b.outputs[0],true);
 s({},2100);assert.equal(r.get('b_Step1'),true,'declared Safe');return {r,s};}
const off={in_Reset_PB:false,in_Relase_Door_PB:false};
const attempts={BOTH:[{in_Reset_PB:true,in_Relase_Door_PB:true},1100,['out_LV_C1','b_Step12']],BLUE:[{in_Relase_Door_PB:true},700,['out_Door_Unlock_Solonoeid']]};
for(const [cause,bad] of [['in_InterLock_NC_1',false],['in_InterLock_NC_2',false]])
for(const [held,h] of [['green',{in_Reset_PB:true}],['blue',{in_Relase_Door_PB:true}]])
for(const [an,[press,len,effects]] of Object.entries(attempts))
for(const neutral of [1999,2001])
 test(`MU24-REACH Safe ${held} held across ${cause} open/close, release, ${an} after ${neutral} ms neutral -> ${neutral<2000?'rejected':'accepted'}`,()=>{
  const {r,s}=make();
  s(h,100);s({[cause]:bad},300);assert.equal(r.get('b_Step1'),true,'Safe kept during cover open (no phase change)');
  s({[cause]:!bad},700);assert.equal(r.get('b_EStop_Ok'),true);assert.equal(r.get('b_Step1'),true);
  s(off,neutral);const seen={};s(press);for(let i=0;i<len;i++){s();for(const e of effects)if(r.get(e))seen[e]=true;}
  for(const e of effects)assert.equal(!!seen[e],neutral>2000,`${e}: release filter 2 s of both buttons (SCENARIO_DECISIONS item 9/11)`);
 });
