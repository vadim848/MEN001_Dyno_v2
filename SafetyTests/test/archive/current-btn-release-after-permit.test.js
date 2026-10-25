// Adopted from program/tester/E1-f1-reclass/repro/mu24-reachable-kill.test.mjs (logic and oracle unchanged).
// Full canonical program (242 blocks). in_False_SI2_CH8 held constant FALSE (Q-MU06-01 B); never driven.
// Oracle (SafetyTests/SCENARIO_DECISIONS.md):
//  - item 9 (Vadim): 2 s continuous release of BOTH buttons before a new attempt; the pause is not counted
//    while a button is still held. Item 11: for a new attempt both buttons released continuously 2 s.
//  - Q-REARM closed by item 9; "Startup with held button: not accepted before full release and release filter".
// Protocol: declared Safe; a button (green or blue) is held across a cover open/close (IL1 or IL2 FALSE 300 ms,
// Safe and b_EStop_Ok kept), then released; a new attempt after 1999 ms of release is rejected, after 2001 ms
// accepted (positive control). BOTH -> out_LV_C1/b_Step12; BLUE -> out_Door_Unlock_Solonoeid.
// Guards this distinguishes: //RndPhysicalCompact/GATE_016.AndIn4 (mutant MU24, E1-f1 mutation list).
// Assumptions: A1 declared Safe by owner-memory seed; A2 b_EStop_Ok by one Reset_PB pulse; A3 1 ms scan,
// exact q=2000 ms not asserted (only q-1/q+1); A4 in_False never driven.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFullProgram,declareSafe} from '../helpers/full-program-source.js';
const make=()=>declareSafe(createFullProgram());
const off={in_Reset_PB:false,in_Relase_Door_PB:false};
const attempts={BOTH:[{in_Reset_PB:true,in_Relase_Door_PB:true},1100,['out_LV_C1','b_Step12']],BLUE:[{in_Relase_Door_PB:true},700,['out_Door_Unlock_Solonoeid']]};
for(const [cause,bad] of [['in_InterLock_NC_1',false],['in_InterLock_NC_2',false]])
for(const [held,h] of [['green',{in_Reset_PB:true}],['blue',{in_Relase_Door_PB:true}]])
for(const [an,[press,len,effects]] of Object.entries(attempts))
for(const neutral of [1999,2001])
 test(`BTN-RELEASE-AFTER-PERMIT Safe ${held} held across ${cause} open/close, release, ${an} after ${neutral} ms neutral -> ${neutral<2000?'rejected':'accepted'}`,()=>{
  const {r,s}=make();
  s(h,100);s({[cause]:bad},300);assert.equal(r.get('b_Step1'),true,'Safe kept during cover open (no phase change)');
  s({[cause]:!bad},700);assert.equal(r.get('b_EStop_Ok'),true);assert.equal(r.get('b_Step1'),true);
  s(off,neutral);const seen={};s(press);for(let i=0;i<len;i++){s();for(const e of effects)if(r.get(e))seen[e]=true;}
  for(const e of effects)assert.equal(!!seen[e],neutral>2000,`${e}: release filter 2 s of both buttons (SCENARIO_DECISIONS item 9/11)`);
 });
