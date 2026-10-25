// Shared full-canonical-program fixture: the whole working SAL + GVL1 (no subgraph cut, no boundary
// substitution), all raw program inputs declared explicitly. in_False_SI2_CH8 is the technical constant
// FALSE (SCENARIO_DECISIONS Q-MU06-01 B) and may not be driven by a protocol.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parseSalFile} from '../../src/sal-parser.js';
import {SalRuntime} from '../../src/sal-runtime.js';
import {withActualNames} from '../../src/signal-names.js';
export const salPath=new URL('../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url);
export const sgvlPath=new URL('../../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url);
// G1 v6 (lead 2026-10-22): R0 nominal - raw Faulty FALSE = power supply healthy (was raw TRUE = fault on both PS).
// G1 v6: D-ARCH-POL-RENAME keys written with the renamed names and mapped to the actual SAL names (stand src/signal-names.js); raw values unchanged (FALSE = healthy).
export const FULL_PROGRAM_RAW=Object.freeze({in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:false,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_Faulty_FBK:false,in_HV_Faulty_FBK:false,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function fullProgramIdentity(){return {salSha256:hash(salPath),sgvlSha256:hash(sgvlPath)};}
// Returns the full-program runtime and a step function s(inputs,scans) with fixed 1 ms scans.
// G1 v6: the block count is a property of the source (F1 242, E2a 215 after R1); the guarantee "no subgraph selection" is that
// the runtime receives the parsed model unfiltered. An explicit blockCount still pins a known source.
export function createFullProgram({blockCount=null}={}){
 const model=parseSalFile(salPath,{bindingMode:'current',sgvlPath});
 assert.equal(model.bindingAudit.status,'PASS','full actual SAL/SGVL audit before execution');
 const all=model.networks.flatMap(n=>n.blocks);
 if(blockCount!=null)assert.equal(all.length,blockCount,'full program, no subgraph selection');
 const RAW=withActualNames(model,FULL_PROGRAM_RAW);const r=new SalRuntime(model,{scanMs:1,unconnectedInput:false});r.setInputs(RAW);
 const s=(inputs={},scans=1)=>{
  assert.ok(!('in_False_SI2_CH8' in inputs),'in_False_SI2_CH8 is a technical constant FALSE (Q-MU06-01)');
  inputs=withActualNames(model,inputs);for(const k of Object.keys(inputs))assert.ok(Object.hasOwn(RAW,k),'protocol may only drive declared raw inputs: '+k);
  r.setInputs(inputs);for(let k=0;k<scans;k++)r.scan(1);
 };
 const unbound=()=>[...r.assumedUnconnectedPorts];
 return {model,all,r,s,unbound};
}
// Declared initial Safe (stand convention, assumption A1): one accepted main Restart, then the b_Step1 owner
// memory is written before the protocol; then 2100 ms quiescent so the release filter is satisfied.
export function declareSafe(x){
 const {r,s,all}=x;
 s({},10);s({in_Reset_PB:true});s({in_Reset_PB:false});
 assert.equal(r.get('b_EStop_Ok'),true,'main EStop Restart accepted');
 const owner=all.find(b=>b.outputs.some(p=>p.globals.some(g=>g.resolvedName==='b_Step1')));
 r.memory.set(owner.path,{value:true});r.write(owner.outputs[0],true);
 s({},2100);assert.equal(r.get('b_Step1'),true,'declared Safe');
 return x;
}
