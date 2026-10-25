// E2 G1 v2 (v2-tester) shared fixture: WHOLE working SAL + GVL1 (no subgraph cut, no boundary substitution,
// any block count so that the same tests run on canonical F1 and on E2 candidates/mutants).
// Real lifecycle only: group start -> Emergency -> main Restart (green press+release) -> Safe -> R&D -> Run ...
// Declared stimulus assumptions (SafetyTests/program/tester/E2-G1/HANDOFF_v2.md):
//  A1 in_Safety_Run = TRUE constantly (NORMATIVE; CRITERIA_DELTA R0 addition, analyst E2-G1-questions Q1/Q2;
//     reviewer G1 C1). The SAL variable has two consumers: the group port //RunStop of TwinSafeGroup1 and
//     //Network3/FBAnd1/AndIn1 (the "no stage -> Safe" branch). In any scan where the group logic runs it is TRUE.
//     DIAGNOSTIC ONLY (E2_INJECTED_SAFE=1): in_Safety_Run FALSE + one declared write of the b_Step1 owner memory
//     after Restart (as helpers/full-program-source.js declareSafe). Unreachable on target; every test name is then
//     prefixed "DIAG [injected-Safe, in_Safety_Run FALSE] " so it never matches the mutation regex ^E2[a-d] .
//  A2 plant: in_LV_C1_FBK / in_HV_C2_FBK follow out_LV_C1 / out_HV_C2 with one scan delay; in_STO_DRx_FBK = !STO_DRx
//     (one scan delay); a test may pin any feedback via x.hold (always < 500 ms unless stated).
//  A3 LV/HV Healthy raw polarity D-ARCH-POL: raw FALSE = healthy, raw TRUE = lost. Default 'raw-false' is NORMATIVE.
//     DIAGNOSTIC ONLY: E2_LV_HEALTHY_MODE=split (old stand convention: LV raw TRUE until R&D is reached, FALSE after);
//     test names are then prefixed "DIAG [split] ".
//  A4 Inputs are named after D-ARCH-POL-RENAME (in_LV_Faulty_FBK / in_HV_Faulty_FBK); see rename map in create().
//  A5 1 ms scan; observation after each complete scan (intra-scan glitches are not observed).
//  A6 status: published STS_SAFE/RND/RUN/EMG if the source has them, else derived by the architect's D2-A formula
//     (PLAN v2 §2.5) over b_Step* and b_EStop_Ok - an observation convention, not an oracle.
//  A7 E2_SOURCE_ROOT may point to a root containing MEN001_Dyno/Safety_Dyno (candidate worktree, G3).
//  A8 SafetyFault (Q-ARCH-05/Q-RC-11) is observed only through a source symbol matching /safety_?fault/i or the name
//     in E2_SAFETYFAULT_SYMBOL; canonical F1 has none -> those parts are NOT VERIFIED (t.todo), never PASS.
//  A9 Restart gesture (EMG6-01, V14-Q6): blue released, green released >= 10 scans, green pressed 100 ms, released.
//  A12 (G1 v3) create({source:'ref'}) runs the REFERENCE 4495a1f with the same stimulus/plant/observation code (rule L3
//     anchor, CRITERIA_DELTA_v4 §0.1): SAL = SafetyTests/fixtures/pinned (stand P2, SHA-checked by src/pinned-sources.js),
//     SGVL = helpers/e2-ref-4495a1f/GVL1.sgvl (git blob 4495a1f:MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl, SHA pinned below).
//     The sibling repository is never read at run time. Reference stages b_Step1..b_Step6; status by D2-A (A6).
//  m-d (G1 v2 review): a source publishing only PART of STS_SAFE/RND/RUN/EMG is a FAIL (statusMissing filled), never a
//     silent fallback to D2-A. m-e: several /safety_?fault/i symbols without E2_SAFETYFAULT_SYMBOL -> reading x.sf throws.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseSalFile} from '../../src/sal-parser.js';
import {SalRuntime} from '../../src/sal-runtime.js';
import {assertNativeSalStructure} from '../../src/sal-native-structure.js';
import {pinnedReferenceSalPath} from '../../src/pinned-sources.js';
import {resolvePhaseObservers} from '../../src/emergency-phase-matrix.js';
import {signalName} from '../../src/signal-names.js';
export const REF={commit:'4495a1f6049f6a58ebfd436761faa84d17c8d643',salSha256:'efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334',
 sgvlSha256:'8020e3d679f97d4bff8e99742a71db0dec840fdc0adf48904cbeb0d056b5e757',sgvl:new URL('./e2-ref-4495a1f/GVL1.sgvl',import.meta.url)};
const root=process.env.E2_SOURCE_ROOT?pathToFileURL(path.resolve(process.env.E2_SOURCE_ROOT)+'/'):new URL('../../../',import.meta.url);
export const salPath=new URL('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',root);
export const sgvlPath=new URL('MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',root);
export const LV_MODE=process.env.E2_LV_HEALTHY_MODE??'raw-false';
if(!['split','raw-false'].includes(LV_MODE))throw Error('E2_LV_HEALTHY_MODE must be split or raw-false');
export const INJECTED_SAFE=process.env.E2_INJECTED_SAFE==='1';
export const DIAG_PREFIX=(INJECTED_SAFE?'DIAG [injected-Safe, in_Safety_Run FALSE] ':'')+(LV_MODE==='split'?'DIAG [split] ':'');
// Test name: normative names start with "E2a|E2b|E2c|E2d " (mutation regex ^E2[a-d] ); diagnostic modes are prefixed.
export const T=name=>DIAG_PREFIX+name;
// G1 v6 (lead 2026-10-22, candidate E2a-core: stage Symbols removed by C-R1-2а): a stage is observed at the OUTPUT of its state
// RS block in Network3 (//Network3/FBRsN/RsOut, map and checks of the stand: src/emergency-phase-matrix.js resolvePhaseObservers);
// the Symbol b_<phase>, if present, is only a cross-check (divergence -> stand ERROR). Required: Step1, Step12, Step_RnD, Step3
// (status D2-A); Step4/5/6/Step2 are observed when their RS block exists (structurally removed -> not applicable, listed in identity).
export const STAGES_REQUIRED=['b_Step1','b_Step12','b_Step_RnD','b_Step3'];
export const STAGES_OPTIONAL=['b_Step4','b_Step5','b_Step6','b_Step2'];
export const STATUS_REQUIRED=['STS_SAFE','STS_RND','STS_RUN','STS_EMG'];
export const STATUS_OPTIONAL=['STS_CFG'];
export const RAW0=Object.freeze({in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,
 in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Mentee_EStop:false,in_Estop_PLC:false,in_False_SI2_CH8:false,
 in_Reset_PB:false,in_Relase_Door_PB:false,in_Door_Monitor:true,in_Safety_Run:true,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,
 inPLC_BypassC1C2:false,in_LV_C1_FBK:false,in_HV_C2_FBK:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,
 in_LV_Faulty_FBK:LV_MODE==='split',in_HV_Faulty_FBK:false,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,
 in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false});
// Observed actuator/command outputs (alias outputs + EStop memory). Names absent from a source are skipped.
export const OUTPUTS=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_SS1_DR1','out_SS1_DR2','out_LV_Discharge_Request',
 'out_HV_Discharge_Request','out_Door_Unlock_Solonoeid','out_C3_BatRelay','out_RBM_Bat',
 'outPLC_STO_1','outPLC_STO_2','out_EStop_Status','b_EStop_Ok'];
export const ENERGY=['out_LV_C1','out_HV_C2','STO_DR1','STO_DR2','out_C3_BatRelay','out_RBM_Bat'];// TRUE = energy / torque enabled
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const cachedModel=new Map();
function model(source='work'){
 if(cachedModel.has(source))return cachedModel.get(source);
 let sal=salPath,sgvl=sgvlPath;
 if(source==='ref'){sal=pinnedReferenceSalPath();sgvl=REF.sgvl;
  assert.equal(hash(sal),REF.salSha256,'pinned reference SAL SHA256 (4495a1f)');assert.equal(hash(sgvl),REF.sgvlSha256,'pinned reference SGVL SHA256 (4495a1f)');}
 else if(source!=='work')throw Error('unknown source '+source);
 assertNativeSalStructure(fs.readFileSync(sal,'utf8'));
 const m=parseSalFile(sal,{bindingMode:'current',sgvlPath:sgvl});
 assert.equal(m.bindingAudit.status,'PASS','whole SAL/SGVL binding audit before execution');
 const names=new Set(m.variables.map(v=>v.name));
 for(const b of m.networks.flatMap(n=>n.blocks))for(const p of b.outputs)for(const g of p.globals)names.add(g.resolvedName);
 let phases=null;if(source==='work'){const rp=resolvePhaseObservers(m);phases=Object.fromEntries(rp.observers.map(o=>['b_'+o.phase,o]));
  for(const st of STAGES_REQUIRED)assert.ok(phases[st],'stage observation point missing (state RS block of Network3): '+st);}
 const res={m,names,phases,identity:{source,salSha256:hash(sal),sgvlSha256:hash(sgvl),blocks:m.networks.flatMap(n=>n.blocks).length,
  stageObservers:phases?Object.fromEntries(Object.entries(phases).map(([k,o])=>[k,o.out+(o.symbol?' (Symbol '+o.symbol+' cross-check)':'')])):'reference Symbols (A12)'}};
 cachedModel.set(source,res);return res;
}
export function identity(source='work'){return model(source).identity;}
export function hasName(n,source='work'){return model(source).names.has(n);}
// A8: SafetyFault observation point (architect name not fixed yet).
// G1 v6: PLC transition commands (E4, full revision; absent on canonical F1). kind 'SAFE_TO_RND' | 'RND_TO_RUN'. Lookup:
// E2_CMD_<kind>_SYMBOL, else a unique source name matching the pattern; null when absent (tests then report NOT VERIFIED).
export function plcCommandName(kind,source='work'){const {names}=model(source);const env=process.env['E2_CMD_'+kind+'_SYMBOL'];
 if(env)return names.has(env)?env:null;const re={SAFE_TO_RND:/CMD_?SAFE_?TO_?R(&|N)?D$/i,RND_TO_RUN:/CMD_?R(&|N)?D_?TO_?RUN$/i}[kind];
 const all=[...names].filter(n=>re.test(n));if(all.length>1)throw Error('PLC command symbol ambiguous ('+all.join(', ')+'): set E2_CMD_'+kind+'_SYMBOL');return all[0]??null;}
export function safetyFaultName(source='work'){const {names}=model(source);const env=process.env.E2_SAFETYFAULT_SYMBOL;
 if(env)return names.has(env)?env:null;const all=[...names].filter(n=>/safety_?fault/i.test(n));
 if(all.length>1)return {ambiguous:all};return all[0]??null;}
export const BOTH={in_Reset_PB:true,in_Relase_Door_PB:true},GREEN={in_Reset_PB:true,in_Relase_Door_PB:false},
 BLUE={in_Reset_PB:false,in_Relase_Door_PB:true},OFF={in_Reset_PB:false,in_Relase_Door_PB:false};
export function create({safetyRun=!INJECTED_SAFE,source='work'}={}){
 const {m,names,phases}=model(source);
 // D-ARCH-POL-RENAME: tests use in_LV_Faulty_FBK / in_HV_Faulty_FBK (raw TRUE = loss); on a source still using the old
 // names in_*_Healthy_FBK the same raw value is written to the old name (same polarity, rename only).
 // G1 v6: actual names via the stand map src/signal-names.js (neither / both / mixed generations declared -> SignalNameError).
 const rename=Object.fromEntries(['LV','HV'].map(k=>[`in_${k}_Faulty_FBK`,signalName(m,`in_${k}_Faulty_FBK`)]).filter(([a,b])=>a!==b));
 let stages;
 if(source==='ref')stages=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6'].filter(s=>names.has(s));
 else stages=[...STAGES_REQUIRED,...STAGES_OPTIONAL.filter(s=>phases[s])];
 // stage read: RS output (work) with the Symbol cross-check, Symbol (reference)
 const stageVal=k=>{const o=phases?.[k];if(!o)return r.get(k);const v=r.get(o.out);
  if(o.symbol&&names.has(o.symbol)&&r.get(o.symbol)!==v)throw Error(`ERROR stand: stage Symbol ${o.symbol}=${r.get(o.symbol)} diverges from its RS output ${o.out}=${v}`);return !!v;};
 // Status: published STS_* if all present in the source (D2-B); otherwise DERIVED per architect PLAN v2 §2.5 (D2-A):
 // SAFE=(S1|S12)&EStopOk, RND=SR&EStopOk, RUN=S3&EStopOk, EMG=complement. Observation convention (A6).
 // m-d: partial publication (some but not all of the four) -> statusMissing lists the absent ones -> status tests FAIL.
 const published=STATUS_REQUIRED.every(s=>names.has(s)),partial=!published&&STATUS_REQUIRED.some(s=>names.has(s));
 const statusMissing=partial?STATUS_REQUIRED.filter(s=>!names.has(s)).map(s=>s+' (partial STS_* publication, m-d)'):[];
 const statusMode=published?'published':partial?'partial-FAIL':'derived-D2A';
 const statuses=published?[...STATUS_REQUIRED,...STATUS_OPTIONAL].filter(s=>names.has(s)):STATUS_REQUIRED;
 const derived=()=>{const ok=r.get('b_EStop_Ok'),o=[];if(ok&&(stageVal('b_Step1')||stageVal('b_Step12')))o.push('STS_SAFE');if(ok&&stageVal('b_Step_RnD'))o.push('STS_RND');
  if(ok&&stageVal('b_Step3'))o.push('STS_RUN');if(!o.length)o.push('STS_EMG');return o;};
 const sfRaw=safetyFaultName(source),sfAmb=sfRaw&&typeof sfRaw==='object'?sfRaw.ambiguous:null,sf=sfAmb?null:sfRaw;
 const outputs=[...OUTPUTS.filter(s=>names.has(s)),...(sf?[sf]:[])];
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});const tr=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[rename[k]??k,v]));r.setInputs(tr({...RAW0,in_Safety_Run:safetyRun}));
 const x={r,m,source,safetyRun,declaredSafe:false,t:0,hold:{},log:[],stages,statuses,statusMissing,statusMode,outputs,listeners:[],inputs:{...RAW0,in_Safety_Run:safetyRun}};
 Object.defineProperty(x,'sf',{enumerable:true,get(){if(sfAmb)throw Error('SafetyFault symbol ambiguous ('+sfAmb.join(', ')+'): set E2_SAFETYFAULT_SYMBOL to the architect name (A8, review m-e)');return sf;}});
 x.get=k=>stages.includes(k)?stageVal(k):r.get(k);
 x.stageSet=()=>stages.filter(s=>stageVal(s));
 x.statusSet=()=>published?statuses.filter(s=>r.get(s)):derived();
 // G1 v8 TD-09 (analyst E2-v73-q §1.1): the down-acceptance marker linkRunDownOwner is recorded per scan when the source has it
 // (owner: true/false); undefined when the Symbol is absent (callers then report ERROR, never fall back to the first output change).
 const hasOwner=names.has('linkRunDownOwner');
 x.snap=()=>({t:x.t,stages:x.stageSet(),statuses:x.statusSet(),out:Object.fromEntries(outputs.map(o=>[o,r.get(o)])),owner:hasOwner?!!r.get('linkRunDownOwner'):undefined,
  c1fbk:r.get('in_LV_C1_FBK'),c2fbk:r.get('in_HV_C2_FBK'),hvFaulty:x.inputs.in_HV_Faulty_FBK,lvFaulty:x.inputs.in_LV_Faulty_FBK});
 x.step=(inputs={},n=1)=>{
  assert.ok(!('in_False_SI2_CH8' in inputs),'in_False_SI2_CH8 is a technical constant FALSE (Q-MU06-01)');
  assert.ok(!('in_Safety_Run' in inputs),'in_Safety_Run is constant in functional tests (R0 addition)');
  for(const k of Object.keys(inputs))assert.ok(Object.hasOwn(RAW0,k),'protocol may only drive declared raw inputs: '+k);
  Object.assign(x.inputs,inputs);r.setInputs(tr(inputs));
  for(let i=0;i<n;i++){
   r.setInputs({in_LV_C1_FBK:r.get('out_LV_C1'),in_HV_C2_FBK:r.get('out_HV_C2'),in_STO_DR1_FBK:!r.get('STO_DR1'),
    in_STO_DR2_FBK:!r.get('STO_DR2'),...tr(x.hold)});
   r.scan(1);x.t++;const s=x.snap();x.log.push(s);for(const f of x.listeners)f(s,x);
  }
  return x;
 };
 x.until=(pred,max,label)=>{const end=x.t+max;while(!pred()&&x.t<end)x.step();
  assert.ok(pred(),`precondition not reached within ${max} ms: ${label} (t=${x.t}, stages=${x.stageSet()}, statuses=${x.statusSet()})`);return x.t;};
 x.unbound=()=>[...r.assumedUnconnectedPorts];
 // Fork: an independent runtime continuing from exactly this state (same values/memories/time/inputs).
 x.fork=()=>{const y=create({safetyRun:x.safetyRun,source});y.r.values=new Map(x.r.values);y.r.memory=new Map(x.r.memory);
  y.t=x.t;y.hold={...x.hold};y.declaredSafe=x.declaredSafe;y.inputs={...x.inputs};return y;};
 return x;
}
// A9 Restart gesture: green press + release with the blue released (EMG6-01, V14-Q6; reviewer G1 M5).
export function restart(x,press=100){if(x.inputs.in_Reset_PB||x.inputs.in_Relase_Door_PB)x.step(OFF,10);
 x.step(GREEN,press);x.step(OFF);return x;}
// ---- real lifecycle producers (approved timings: BOTH 1 s from second press, single 0.5 s, release filter 2 s) ----
export function boot(x){
 x.step({},10);restart(x,1);
 assert.ok(x.get('b_EStop_Ok'),'precondition: main EStop Restart accepted');
 if(!x.safetyRun){const owner=x.m.networks.flatMap(n=>n.blocks).find(b=>b.outputs.some(p=>p.globals.some(g=>g.resolvedName==='b_Step1')));
  x.r.memory.set(owner.path,{value:true});x.r.write(owner.outputs[0],true);x.declaredSafe=true;}
 x.until(()=>x.get('b_Step1'),100,'Safe after main Restart');x.step({},2100);
 assert.deepEqual(x.stageSet(),['b_Step1'],'precondition: steady Safe (only b_Step1)');return x;
}
export function toRnD(x){
 x.step(BOTH,1100);x.step(OFF);x.until(()=>x.get('b_Step_RnD'),3000,'R&D after BOTH from Safe');
 x.step({},2100);if(LV_MODE==='split')x.step({in_LV_Faulty_FBK:false});x.step({},100);
 assert.ok(x.stageSet().join()==='b_Step_RnD'&&x.get('out_LV_C1'),`precondition: steady R&D (only b_Step_RnD, C1 ON); stages=${x.stageSet()} C1=${x.get('out_LV_C1')}`);return x;
}
export function withC3(x){x.step({in_C3_Manual_Set:true},100);x.step({in_C3_Manual_Set:false,in_RBM_Manual_Set:true},100);x.step({in_RBM_Manual_Set:false},100);
 assert.ok(x.get('out_C3_BatRelay')&&x.get('out_RBM_Bat'),`precondition: C3 and BMS ON by manual set (MOD-C3) before the event; C3=${x.get('out_C3_BatRelay')} BMS=${x.get('out_RBM_Bat')}`);return x;}
export function toRun(x){
 x.step(BOTH,1100);x.step(OFF);x.until(()=>x.get('b_Step3'),4000,'Run after BOTH from R&D');x.step({},2100);
 assert.ok(x.stageSet().join()==='b_Step3'&&x.get('out_LV_C1')&&x.get('out_HV_C2')&&x.get('STO_DR1')&&x.get('STO_DR2'),
  `precondition: steady Run (only b_Step3, C1 ON, C2 ON, STO released); stages=${x.stageSet()} C1=${x.get('out_LV_C1')} C2=${x.get('out_HV_C2')} STO=${x.get('STO_DR1')}/${x.get('STO_DR2')}`);return x;
}
// Per-process cache of real-lifecycle steady states; callers always receive a fork (independent runtime).
const steadyCache=new Map();
export function cached(kind,o={}){const key=kind+JSON.stringify(o);
 if(!steadyCache.has(key)){try{steadyCache.set(key,{Safe:steadySafe,RnD:steadyRnD,Run:steadyRun}[kind](o));}
  catch(e){steadyCache.set(key,{error:e});}}
 const c=steadyCache.get(key);if(c.error)throw c.error;return c.fork();}
export function steadySafe(o={}){return boot(create(o));}
export function steadyRnD(o={}){const x=toRnD(boot(create(o)));if(o.c3)withC3(x);return x;}
export function steadyRun(o={}){const x=toRnD(boot(create(o)));if(o.c3)withC3(x);toRun(x);
 if(o.c3)assert.ok(x.get('out_C3_BatRelay')&&x.get('out_RBM_Bat'),'precondition: C3/BMS set in R&D still ON in steady Run (MOD-C3)');return x;}
// Invariant collectors (E2-01).
export function watchStages(x){const v=[];x.listeners.push(s=>{if(s.stages.length>1)v.push(`t=${s.t}: ${s.stages.join('+')}`);});return v;}
export function watchStatus(x){const v=[];if(x.statusMissing.length){v.push('status publication missing: '+x.statusMissing.join(','));return v;}
 x.listeners.push(s=>{if(s.statuses.length!==1)v.push(`t=${s.t}: [${s.statuses.join('+')}] stages=${s.stages.join('+')}`);});return v;}
export function statusIs(x,name){return x.statusMissing.length===0&&x.statusSet().length===1&&x.statusSet()[0]===name;}
export function variableInfo(n){return model().m.variables.find(v=>v.name===n);}
// Reviewer G1 M6: collect every violated check of a test, report all at once.
// G1 v5: c.nv(msg) records a NOT VERIFIED part (awaiting an analyst answer); c.finish(t,title) = c.done(title) and then, only if
// every normative check passed, t.todo with the NV list (summarize.mjs: "ok # TODO" -> NV). A normative FAIL is never hidden by NV.
export function checks(){const list=[],nvl=[];const c=(cond,msg)=>{if(!cond)list.push(msg);return !!cond;};c.list=list;c.nvList=nvl;
 c.done=(title='violated checks')=>assert.deepEqual(list,[],`${list.length} ${title}`);
 c.nv=m=>{nvl.push(m);};c.finish=(t,title)=>{c.done(title);if(nvl.length)t.todo('NOT VERIFIED: '+nvl.join(' | '));};return c;}
export const rises=(seg,k)=>seg.filter((s,i)=>i>0&&s.out[k]&&!seg[i-1].out[k]).map(s=>s.t);
export const firstAt=(seg,pred)=>seg.find(pred)?.t;
export const isEmg=s=>s.statuses.length===1&&s.statuses[0]==='STS_EMG';
// EMG6-01 endpoint (reviewer G1 C2; V14-Q6, Q-ARCH-01, Q-RC-14): energy removed before Restart; after the green
// press+release ONLY Safe (b_Step1 alone, status Safe), never R&D/Run/Config, no energy, no STO release.
// Moment of the first Safe scan after release is an observation (not specified); 2000 ms window.
export function restartToSafe(x,c,label=''){
 const pre=x.snap();
 c(ENERGY.every(k=>!pre.out[k])&&!pre.c1fbk&&!pre.c2fbk,`${label}energy removed before Restart (EMGREF end state: C1/C2/C3/BMS OFF, STO active, C1/C2_FBK OFF): ${JSON.stringify(Object.fromEntries([...ENERGY.filter(k=>pre.out[k]).map(k=>[k,true]),...(pre.c1fbk?[['C1_FBK',true]]:[]),...(pre.c2fbk?[['C2_FBK',true]]:[])]))}`);
 c(isEmg(pre),`${label}still Emergency (latched) right before Restart; statuses=${pre.statuses}`);
 const from=x.t;restart(x);x.step({},2000);const seg=x.log.filter(s=>s.t>from);
 c(seg.every(s=>!s.stages.some(v=>['b_Step_RnD','b_Step3','b_Step12'].includes(v))&&!s.statuses.some(v=>['STS_RND','STS_RUN','STS_CFG'].includes(v))),
  `${label}after Restart never R&D/Run/Safe->R&D/Config (EMG6-01, Q-ARCH-01 "только Safe"); first offending ${JSON.stringify(seg.find(s=>s.stages.some(v=>['b_Step_RnD','b_Step3','b_Step12'].includes(v))))?.slice(0,160)}`);
 c(seg.every(s=>ENERGY.every(k=>!s.out[k])),`${label}no energy after Restart (EMG6-01: Safe with energy removed)`);
 c(x.stageSet().join()==='b_Step1'&&statusIs(x,'STS_SAFE'),`${label}Restart -> only Safe within 2000 ms (EMG6-01, V14-Q6, Q-ARCH-01); stages=${x.stageSet().join('+')||'none'} statuses=${x.statusSet()}`);
}
