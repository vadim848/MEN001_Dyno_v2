// S1 catalog stand helper (v2-tester, 2026-10-23, D-COMPACT / D-RESUME-S1S2).
// Drives the FULL target SAL (no subgraph cut, no forced internal signals/stages) through real inputs only.
// Target: env CATALOG_SAL_DIR = folder with TwinSafeGroup1.sal (+ GVL1.sgvl there or in ../GVLs/);
// default canonical MEN001_Dyno/Safety_Dyno/TwinSafeGroup1. Stage filter: env CATALOG_STAGES (comma list).
//
// Declared stand assumptions (program/tester/S1/RESULTS.md, section "Assumptions"):
//  A1 in_Safety_Run TRUE constantly (group RunStop); in_False_SI2_CH8 technical constant FALSE (Q-MU06-01).
//  A2 plant: in_LV_C1_FBK / in_HV_C2_FBK follow out_LV_C1 / out_HV_C2 after PLANT_DELAY ms (default 20, per-test
//     x.plant.c1 / x.plant.c2); in_STO_DRx_FBK = NOT STO_DRx one scan later. x.hold pins any input over the plant.
//  A3 raw Faulty polarity D-ARCH-POL: raw FALSE = power supply healthy, TRUE = loss; names resolved per source
//     (in_*_Healthy_FBK on F1, in_*_Faulty_FBK after the rename) by src/signal-names.js; values unchanged.
//  A4 1 ms scan; observation after each complete scan.
//  A5 main-state status for PLC: published STS_SAFE/STS_RND/STS_RUN/STS_EMG (+STS_CFG) when the source has all four;
//     otherwise derived by the architect's D2-A convention over the stage RS outputs of Network3 and b_EStop_Ok
//     (SAFE=(S1|S12)&EOk, RND=SR&EOk, RUN=S3&EOk, EMG=complement). Observation convention, not an oracle.
//  A6 SafetyFault / Fault observed through a source symbol (env CATALOG_SAFETYFAULT_SYMBOL / CATALOG_FAULT_SYMBOL or a
//     unique name match); absent symbol: NOT VERIFIED in E2/E3 rows, FAIL in E5/E6 rows (stage deliverable).
//  A7 E4 PLC commands / heartbeat / STS_COVER_LOCKED resolved by name pattern (env CATALOG_SYM_<KIND> overrides);
//     a command input absent from the source = not implemented = FAIL of the E4 row (never PASS).
//  A8 heartbeat (only when the source declares one): PLC bit toggled every 500 ms (V14-Q20 period 0.5 s) unless the
//     test stops it.
//  A9 invariant (catalog rule 5): at every scan at most one stage RS active and exactly one main-state status.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {parseSalFile} from '../../src/sal-parser.js';
import {SalRuntime} from '../../src/sal-runtime.js';
import {assertNativeSalStructure} from '../../src/sal-native-structure.js';
import {resolvePhaseObservers} from '../../src/emergency-phase-matrix.js';
import {signalName} from '../../src/signal-names.js';

const ST=fileURLToPath(new URL('../../',import.meta.url));
const REPO=path.resolve(ST,'..');
export const DEFAULT_DIR=path.join(REPO,'MEN001_Dyno','Safety_Dyno','TwinSafeGroup1');
export const PLANT_DELAY=Number(process.env.CATALOG_PLANT_DELAY??20);
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

export function resolveTarget(dir=process.env.CATALOG_SAL_DIR){
 let d=DEFAULT_DIR;
 if(dir){d=path.isAbsolute(dir)?dir:[path.resolve(process.cwd(),dir),path.resolve(ST,dir),path.resolve(REPO,dir)].find(p=>fs.existsSync(path.join(p,'TwinSafeGroup1.sal')));
  if(!d)throw Error('CATALOG_SAL_DIR not found / no TwinSafeGroup1.sal: '+dir);}
 const sal=path.join(d,'TwinSafeGroup1.sal');
 const sgvl=[path.join(d,'GVL1.sgvl'),path.join(d,'..','GVLs','GVL1.sgvl')].find(p=>fs.existsSync(p));
 if(!fs.existsSync(sal)||!sgvl)throw Error('target incomplete (SAL/GVL1.sgvl): '+d);
 return {dir:d,sal,sgvl};
}

// ---------- program (parsed model + name resolution), cached per SAL file ----------
const programs=new Map();
export function program(target=resolveTarget()){
 const key=target.sal+'|'+target.sgvl;if(programs.has(key))return programs.get(key);
 const xml=fs.readFileSync(target.sal,'utf8');
 assertNativeSalStructure(xml);
 const m=parseSalFile(target.sal,{bindingMode:'current',sgvlPath:target.sgvl});
 assert.equal(m.bindingAudit.status,'PASS','whole SAL/SGVL binding audit before execution');
 const P=makeProgram(m,{...target,salSha256:target.salSha256??sha(target.sal),sgvlSha256:target.sgvlSha256??sha(target.sgvl)});
 programs.set(key,P);return P;
}
const RAW0={in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,
 in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,in_Reset_PB:false,
 in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:true,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,
 inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,
 in_LV_Faulty_FBK:false,in_HV_Faulty_FBK:false,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false};
export const OUT=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat','out_LV_Discharge_Request',
 'out_HV_Discharge_Request','out_Door_Unlock_Solonoeid','out_SS1_DR1','out_SS1_DR2','outPLC_RnD','b_EStop_Ok'];
export const ENERGY=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat'];
const STATUS4=['STS_SAFE','STS_RND','STS_RUN','STS_EMG'];
// A7 name patterns (E4 interface, v1.4 §8; absent on F1/E2 sources).
const PATTERNS={SAFE_TO_RND:/CMD_?SAFE_?TO_?R(&|N|AND)?D$/i,RND_TO_RUN:/CMD_?R(&|N|AND)?D_?TO_?RUN$/i,RUN_TO_RND:/CMD_?RUN_?TO_?R(&|N|AND)?D$/i,
 RND_TO_SAFE:/CMD_?R(&|N|AND)?D_?TO_?SAFE$/i,TRIGGER_EMG:/CMD_?TRIGGER_?EMERGENCY$/i,HEARTBEAT:/heart_?beat/i,
 COVER_LOCKED:/STS_?COVER_?LOCKED$/i,FAULT:/^(outPLC_|out_|STS_)?Fault$/i,SAFETYFAULT:/safety_?fault/i,CFG:/^STS_?(CFG|CONFIG)$/i};

// Program from an in-memory (mutated) model; constants = pseudo-variable values pinned for the whole run (mutants only).
export function programFromModel(m,identity,constants={}){return makeProgram(m,identity,constants);}
function makeProgram(m,identity,constants={}){
 const blocks=m.networks.flatMap(n=>n.blocks);
 const varNames=new Set(m.variables.map(v=>v.name));
 const names=new Set(varNames);for(const b of blocks)for(const p of b.outputs)for(const g of p.globals)names.add(g.resolvedName);
 const inputVars=new Set(m.variables.filter(v=>v.targetPorts.length&&!v.sourcePorts.length).map(v=>v.name));
 const rp=resolvePhaseObservers(m);const phases=rp.observers;
 const rename=Object.fromEntries(['LV','HV'].map(k=>[`in_${k}_Faulty_FBK`,signalName(m,`in_${k}_Faulty_FBK`)]));
 const sym=kind=>{const env=process.env['CATALOG_SYM_'+kind]??(kind==='FAULT'?process.env.CATALOG_FAULT_SYMBOL:kind==='SAFETYFAULT'?process.env.CATALOG_SAFETYFAULT_SYMBOL:undefined);
  if(env)return names.has(env)?env:null;const all=[...names].filter(n=>PATTERNS[kind].test(n));
  if(all.length>1)throw Error(`symbol for ${kind} ambiguous (${all.join(', ')}): set CATALOG_SYM_${kind}`);
  if(!all.length&&kind==='TRIGGER_EMG'&&names.has('in_Estop_PLC'))return 'in_Estop_PLC';// Q-E4-5 A (answered by Vadim: A)
  return all[0]??null;};
 const published=STATUS4.every(s=>names.has(s));
 const P={m,blocks,names,inputVars,phases,rename,identity:{...identity,blocks:blocks.length,statusMode:published?'published STS_*':'derived D2-A',
  stages:phases.map(o=>o.phase).join(',')},sym,published,constants,cache:new Map()};
 P.create=o=>create(P,o);
 P.cached=(kind,builder)=>{if(!P.cache.has(kind)){try{P.cache.set(kind,{x:builder()});}catch(e){P.cache.set(kind,{e});}}
  const c=P.cache.get(kind);if(c.e)throw c.e;return c.x.fork();};
 P.safe=()=>P.cached('Safe',()=>boot(P.create()));
 P.rnd=()=>P.cached('RnD',()=>toRnD(P.safe()));
 P.run=()=>P.cached('Run',()=>toRun(P.rnd()));
 P.rndC3=()=>P.cached('RnDC3',()=>withC3(P.rnd()));
 P.runC3=()=>P.cached('RunC3',()=>toRun(P.rndC3()));
 return P;
}

export class Precondition extends Error{constructor(m){super(m);this.code='PRECONDITION';}}
export const pre=(cond,msg)=>{if(!cond)throw new Precondition(msg);};

let currentCtx=null;
function create(P,{plant={}}={}){
 const r=new SalRuntime(P.m,{scanMs:1,unconnectedInput:false});
 const map=k=>P.rename[k]??k;
 const x={P,r,t:0,inputs:{...RAW0},hold:{},plant:{c1:PLANT_DELAY,c2:PLANT_DELAY,...plant},hist:{c1:[],c2:[]},log:[],
  viol:{count:0,first:[]},hbStopped:false,hbVal:false,hbLast:0,hb:P.sym('HEARTBEAT')};
 r.setInputs(Object.fromEntries(Object.entries(RAW0).map(([k,v])=>[map(k),v])));r.setInputs(P.constants);
 const stageVal=o=>{const v=r.get(o.out);if(o.symbol&&r.get(o.symbol)!==v)throw Error(`stand ERROR: ${o.symbol} diverges from ${o.out}`);return v;};
 x.stages=()=>P.phases.filter(stageVal).map(o=>o.phase);
 x.status=()=>{if(P.published){const s=[...STATUS4,...(P.sym('CFG')?[P.sym('CFG')]:[])].filter(n=>r.get(n));return s.map(n=>n.replace(/^STS_/,'').replace(/^(CFG|CONFIG)$/,'CFG'));}
  const st=x.stages(),ok=r.get('b_EStop_Ok'),o=[];if(ok&&(st.includes('Step1')||st.includes('Step12')))o.push('SAFE');
  if(ok&&st.includes('Step_RnD'))o.push('RND');if(ok&&st.includes('Step3'))o.push('RUN');if(!o.length)o.push('EMG');return o;};
 const faultSym=P.sym('FAULT'),sfSym=P.sym('SAFETYFAULT'),coverSym=P.sym('COVER_LOCKED');
 x.faultName=sfSym;x.plcFaultName=faultSym;x.coverName=coverSym;
 x.snap=()=>{const s={t:x.t,st:x.status(),ns:0,c1f:r.get('in_LV_C1_FBK'),c2f:r.get('in_HV_C2_FBK')};const stg=x.stages();s.ns=stg.length;s.stg=stg.join('+');
  for(const k of OUT)s[k]=r.get(k);s.fault=sfSym?r.get(sfSym):undefined;s.plcFault=faultSym?r.get(faultSym):undefined;s.cover=coverSym?r.get(coverSym):undefined;
  s.STO=!r.get('STO_DR1')&&!r.get('STO_DR2');// TRUE = torque off (STO active)
  return s;};
 x.set=(inputs)=>{for(const k of Object.keys(inputs)){
   pre(k!=='in_False_SI2_CH8'&&k!=='in_Safety_Run','constant inputs may not be driven: '+k);
   pre(Object.hasOwn(RAW0,k)||P.inputVars.has(k),'stimulus may only drive declared raw program inputs: '+k);}
  Object.assign(x.inputs,inputs);r.setInputs(Object.fromEntries(Object.entries(inputs).map(([k,v])=>[map(k),v])));return x;};
 x.step=(inputs={},n=1)=>{x.set(inputs);
  for(let i=0;i<n;i++){
   const c1=r.get('out_LV_C1'),c2=r.get('out_HV_C2');x.hist.c1.push(c1);x.hist.c2.push(c2);
   const lag=(h,d)=>h.length>d?h[h.length-1-d]:false;
   const plant={in_LV_C1_FBK:lag(x.hist.c1,x.plant.c1),in_HV_C2_FBK:lag(x.hist.c2,x.plant.c2),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2')};
   if(x.hb&&!x.hbStopped){const v=Math.floor(x.t/500)%2===1;if(v!==x.hbVal){x.hbVal=v;x.hbLast=x.t+1;}plant[x.hb]=v;}
   r.setInputs(Object.fromEntries(Object.entries({...plant,...x.hold}).map(([k,v])=>[map(k),v])));
   r.scan(1);x.t++;const s=x.snap();x.log.push(s);
   if(s.ns>1||s.st.length!==1){x.viol.count++;if(x.viol.first.length<3)x.viol.first.push(`t=${s.t} stages=${s.stg} status=${s.st.join('+')}`);}
  }
  return x;};
 x.wait=ms=>x.step({},ms);
 x.until=(pred,max,label)=>{const end=x.t+max;while(!pred(x.snap())&&x.t<end)x.step();
  pre(pred(x.snap()),`${label} not reached within ${max} ms (t=${x.t} status=${x.status()} stages=${x.stages()})`);return x.t;};
 x.is=st=>{const s=x.status();return s.length===1&&s[0]===st;};
 x.fork=()=>{const y=create(P,{plant:x.plant});y.r.values=new Map(r.values);y.r.memory=new Map([...r.memory].map(([k,v])=>[k,{...v}]));
  y.t=x.t;y.inputs={...x.inputs};y.hold={...x.hold};y.hist={c1:[...x.hist.c1],c2:[...x.hist.c2]};y.log=[...x.log];
  y.viol={count:x.viol.count,first:[...x.viol.first]};y.hbStopped=x.hbStopped;y.hbVal=x.hbVal;y.hbLast=x.hbLast;if(currentCtx)currentCtx.xs.push(y);return y;};
 // ---- log queries over (from, to] ----
 x.seg=(from,to=x.t)=>x.log.filter(s=>s.t>from&&s.t<=to);
 x.first=(pred,from,to=x.t)=>x.seg(from,to).find(pred)?.t;
 x.prev=s=>s.t>1?x.log[s.t-2]:{};
 x.rise=(k,from,to)=>x.seg(from,to).find(s=>s[k]&&!x.prev(s)[k])?.t;
 x.fall=(k,from,to)=>x.seg(from,to).find(s=>!s[k]&&x.prev(s)[k])?.t;
 x.never=(pred,from,to)=>x.seg(from,to).find(pred);
 // ---- operator gestures ----
 x.green=(ms)=>{const p=x.t;x.step({in_Reset_PB:true,in_Relase_Door_PB:false},ms);x.step({in_Reset_PB:false});return {p,rel:x.t-1};};
 x.blue=(ms)=>{const p=x.t;x.step({in_Relase_Door_PB:true,in_Reset_PB:false},ms);x.step({in_Relase_Door_PB:false});return {p,rel:x.t-1};};
 // BOTH: first button, second after delta, both held `hold` ms from the second, then both released (rule 8).
 x.both=({first='green',delta=100,hold=1050,release=true}={})=>{const a=first==='green'?'in_Reset_PB':'in_Relase_Door_PB',b=a==='in_Reset_PB'?'in_Relase_Door_PB':'in_Reset_PB';
  const p1=x.t;x.step({[a]:true,[b]:false},delta);const p2=x.t;x.step({[a]:true,[b]:true},hold);
  if(release)x.step({in_Reset_PB:false,in_Relase_Door_PB:false});return {p1,p2,rel:p2+hold};};
 x.restart=(press=100)=>{x.step({in_Reset_PB:false,in_Relase_Door_PB:false},10);x.step({in_Reset_PB:true},press);x.step({in_Reset_PB:false});return x.t;};
 if(currentCtx)currentCtx.xs.push(x);
 return x;
}

// ---- standard start and steady states (catalog rule 2) ----
export function boot(x){
 x.wait(10);pre(x.is('EMG'),`group start must be Emergency (catalog rule 2, Q-RC-10); status=${x.status()}`);
 x.restart();x.until(s=>s.st.length===1&&s.st[0]==='SAFE',1000,'Safe after Restart');x.wait(2100);
 pre(x.is('SAFE')&&!x.r.get('out_LV_C1')&&!x.r.get('out_HV_C2'),`steady Safe (no C1/C2); status=${x.status()}`);return x;
}
export function toRnD(x){x.both();x.until(s=>s.st[0]==='RND'&&s.st.length===1,3000,'R&D after BOTH from Safe');x.wait(2100);
 pre(x.is('RND')&&x.r.get('out_LV_C1')&&!x.r.get('out_HV_C2'),`steady R&D (C1 ON, C2 OFF); status=${x.status()}`);return x;}
export function toRun(x){x.both();x.until(s=>s.st[0]==='RUN'&&s.st.length===1,4000,'Run after BOTH from R&D');x.wait(2100);
 pre(x.is('RUN')&&x.r.get('out_LV_C1')&&x.r.get('out_HV_C2')&&x.r.get('STO_DR1')&&x.r.get('STO_DR2'),`steady Run (C1, C2 ON, STO released); status=${x.status()}`);return x;}
export function withC3(x){x.step({in_C3_Manual_Set:true},100);x.step({in_C3_Manual_Set:false,in_RBM_Manual_Set:true},100);x.step({in_RBM_Manual_Set:false},100);
 pre(x.r.get('out_C3_BatRelay')&&x.r.get('out_RBM_Bat'),'C3/BMS ON by manual set in R&D (V14-Q15) before the event');return x;}

// StartingRun (R&D->Run accepted, Run not confirmed): returns u = first scan with C2 ON or STO released after the gesture.
export function toStartingRun(x,{holdHvFaulty=false}={}){
 if(holdHvFaulty)x.step({in_HV_Faulty_FBK:true});
 const g=x.both({release:false,hold:1000});
 let u;const end=x.t+200;while(x.t<end){x.step({in_Reset_PB:true,in_Relase_Door_PB:true});const s=x.log.at(-1);if(s.out_HV_C2||!s.STO){u=s.t;break;}}
 x.step({in_Reset_PB:false,in_Relase_Door_PB:false});
 pre(u!==undefined,'R&D->Run accepted (C2 ON / STO released) within 1.2 s of the second press');
 return {u,g};
}
// Safe->R&D accepted (C1 ON), R&D not reached: u1 = first C1 ON.
export function toSafeToRnd(x,{holdLvFaulty=false}={}){
 if(holdLvFaulty)x.step({in_LV_Faulty_FBK:true});
 x.both({release:false,hold:1000});let u1;const end=x.t+200;
 while(x.t<end){x.step({in_Reset_PB:true,in_Relase_Door_PB:true});if(x.log.at(-1).out_LV_C1){u1=x.t;break;}}
 x.step({in_Reset_PB:false,in_Relase_Door_PB:false});pre(u1!==undefined,'Safe->R&D accepted (C1 ON) within 1.2 s of the second press');return {u1};
}

// ---- catalog scenario registry ----
export const SCENARIOS=new Map();
const STAGE_FILTER=(process.env.CATALOG_STAGES??'').split(',').map(s=>s.trim()).filter(Boolean);
export const STAGE_ORDER=['E2','E3','E4','E5','E6','E7'];
export function def(id,stage,title,run,{source='',sfStage}={}){SCENARIOS.set(id,{id,stage,title,run,source});return id;}
// Run a scenario on program P; returns {fails, nv, xs}. Never throws for scenario failures.
export function runScenario(id,P){
 const sc=SCENARIOS.get(id);const ctx={xs:[],fails:[],nv:[]};const prev=currentCtx;currentCtx=ctx;
 const c=(cond,msg)=>{if(!cond)ctx.fails.push(msg);return !!cond;};
 c.nv=msg=>ctx.nv.push(msg);c.stage=sc.stage;
 // SafetyFault/Fault check honouring A6.
 c.fault=(x,expected,label,t)=>{const v=t===undefined?x.log.at(-1)?.fault:x.log.find(s=>s.t===t)?.fault;
  if(x.faultName==null){const late=STAGE_ORDER.indexOf(sc.stage)>=STAGE_ORDER.indexOf('E5');
   if(late)ctx.fails.push(`${label}: SafetyFault/Fault not observable on target (no symbol) - not implemented`);else ctx.nv.push(`${label}: SafetyFault not observable on target (no symbol; introduced in E5)`);return;}
  c(v===expected,`${label}: SafetyFault expected ${expected}, observed ${v}`);};
 try{sc.run(P,c);}
 catch(e){if(e.code==='PRECONDITION')ctx.fails.push('PRECONDITION/STAND: '+e.message);else ctx.fails.push('ERROR: '+(e.stack??e).toString().split('\n').slice(0,3).join(' / '));}
 finally{currentCtx=prev;}
 const seen=new Set();for(const x of ctx.xs){if(x.viol.count&&!seen.has(x.viol.first[0])){seen.add(x.viol.first[0]);
  ctx.fails.push(`invariant "exactly one main state" (rule 5) violated in ${x.viol.count} scans, first: ${x.viol.first.join('; ')}`);}}
 return ctx;
}
export function register(ids){
 for(const id of ids){const sc=SCENARIOS.get(id);const skip=STAGE_FILTER.length&&!STAGE_FILTER.includes(sc.stage)?`stage ${sc.stage} not in CATALOG_STAGES`:false;
  test(`[${sc.stage}] ${sc.id} ${sc.title}`,{skip},t=>{const P=program();const r=runScenario(id,P);
   assert.deepEqual(r.fails,[],`${sc.id}: ${r.fails.length} violated check(s) [source ${sc.source}]`);
   if(r.nv.length)t.todo('NOT VERIFIED: '+r.nv.join(' | '));});}
}
export function todoRow(id,stage,title,question){SCENARIOS.set(id,{id,stage,title,run:(P,c)=>c.nv('OPEN QUESTION: '+question),source:'program/tester/S1/QUESTIONS.md'});return id;}
// Common predicates.
export const emg=s=>s.st.length===1&&s.st[0]==='EMG';
export const stIs=(s,v)=>s.st.length===1&&s.st[0]===v;
export const energyOff=s=>ENERGY.every(k=>!s[k])&&!s.c1f&&!s.c2f;
