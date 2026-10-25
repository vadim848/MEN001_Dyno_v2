// Catalog section M: 12 critical guards, each mutated ("condition removed / inverted") in memory on the target SAL model
// and paired with its killing scenario (+2 extra guards M-B1/M-B2 from the S2 review). Killed = that scenario FAILs on the mutant. A mutation is NOT ASSESSABLE (todo)
// when its killing scenario already FAILs on the unmutated target. Locators are block/port paths of the target; each is
// checked against the expected source before mutating (a missing/mismatched locator is a FAIL, never a silent pass).
import test from 'node:test';
import assert from 'node:assert/strict';
import {program,programFromModel,runScenario,SCENARIOS} from '../helpers/catalog-program.js';
import './lib/k.js';import './lib/c.js';import './lib/e.js';import './lib/u.js';import './lib/d.js';import './lib/h.js';import './lib/w.js';import './lib/p.js';import './lib/g.js';

const D=(port,from)=>({op:'deactivate',port,from});
const MUTS=[
 {id:'M-01',title:'EStop NC1/NC2 condition removed (all consumers read OK)',kill:'E-01',ops:[{op:'const',signal:'in_ES_NC_1',value:true},{op:'const',signal:'in_ES_NC_2',value:true}]},
 {id:'M-02',title:'in_Estop_PLC condition removed (all consumers read FALSE)',kill:'E-02',ops:[{op:'const',signal:'in_Estop_PLC',value:false}]},
 {id:'M-03',title:'NC1&NC2 removed from the HV step up (recognizer, spoil, C2/STO set permits)',kill:'C-02',ops:[
  D('//RndPhysicalCompact/GATE_020/AndIn6','V:linkCoverClosed'),D('//Network12/FBAnd4/AndIn2','//Network12/FBAnd16/AndOut'),
  D('//Network1/FBAndHvSetPermit/AndIn5','V:in_InterLock_NC_1'),D('//Network1/FBAndHvSetPermit/AndIn6','V:in_InterLock_NC_2'),
  D('//Network1/FBAndSto1SetPermit/AndIn5','V:in_InterLock_NC_1'),D('//Network1/FBAndSto1SetPermit/AndIn6','V:in_InterLock_NC_2'),
  D('//Network1/FBAndSto2SetPermit/AndIn5','V:in_InterLock_NC_1'),D('//Network1/FBAndSto2SetPermit/AndIn6','V:in_InterLock_NC_2'),
  D('//RndPhysicalCompact/GATE_PF_SET/OrIn1','//RndPhysicalCompact/GATE_SPOIL_R/AndOut')]},
 {id:'M-04',title:'cover (NC) removed from the Run guards (emergency and Run hold)',kill:'C-04',ops:[D('//Network1/FBAnd1/AndIn3','//Network1/FBOrIlRunOk/OrOut'),D('//Network6/HEALTHY_OK/AndIn3','V:linkCoverClosed'),
  {op:'deactivate',port:'//Network6/HEALTHY_OK/AndIn4',from:'V:linkCoverClosed',optional:true}]},// S6: duplicate cover term (Verify min-2 inputs) - all copies removed
 {id:'M-05',title:'LV/HV connector condition removed (all consumers read OK)',kill:'C-09',ops:[{op:'const',signal:'in_HV_Connector_Interlock',value:true},{op:'const',signal:'in_LV_Connector_Interlock',value:true}]},
 {id:'M-06',title:'STO released without an accepted step up (lift term removed from STO set)',kill:'U-03',ops:[
  D('//Network1/FBAndSto1SetPermit/AndIn1','//Network1/FBOr8/OrOut'),D('//Network1/FBAndSto2SetPermit/AndIn1',null)]},
 {id:'M-07',title:'C2 ON without an accepted step up (lift term removed from C2 set)',kill:'U-03',ops:[D('//Network1/FBAndHvSetPermit/AndIn1','//Network1/FBOr18/OrOut')]},
 {id:'M-08',title:'Unlock stage term removed (Unlock no longer restricted to Safe/R&D)',kill:'K-11',ops:[D('//Network12/FBAnd2/AndIn1','//Network12/FBAnd1/AndOut'),D('//Network2/FBAnd7/AndIn1','//Network2/FBDecouple3/DecOut1')]},
 {id:'M-09',title:'emergency no longer clears Run / R&D (Restart not only into Safe)',kill:'E-04',ops:[D('//Network3/FBOr5/OrIn2','G:b_Step4_Set'),D('//Network3/FBOr13/OrIn2','G:b_Step4_Set')]},
 {id:'M-10',title:'Run confirmation without the C2 window and C2_FBK',kill:'U-04',ops:[D('//Network12/FBAnd6/AndIn1','//Network12/WIN_C2/TonOut'),D('//Network12/FBAnd6/AndIn2','V:in_HV_C2_FBK')]},
 {id:'M-11',title:'LV Faulty polarity inverted at every guard consumer',kill:'H-01',ops:[{op:'invertSignal',signal:'in_LV_Faulty_FBK'}]},
 // Extra (S2 review B1/B2, reviewer probes program/reviewer/S2/probe*.mjs): guards of the two E2e fixes.
 {id:'M-B1',title:'HLT memory removed (HLT_LV_SRC fed by Faulty only)',kill:'D-08',ops:[D('//SafeResumption/HLT_LV_SRC/OrIn2',null)]},
 {id:'M-B2',title:'FBK_OFF unlinked from C1/C2_FBK (Emergency exit not gated by feedback)',kill:'E-05',ops:[{op:'unlink',signals:['in_LV_C1_FBK','in_HV_C2_FBK'],prefix:'//Network1/FBK_OFF/'}]},
 // Extra (S3 review T1..T5, reviewer probe program/reviewer/S3/probe3.mjs).
 {id:'M-T1',title:'SS1 not requested at descent start',kill:'D-01',ops:[D('//Network1/FBAnd2/AndIn4',null)]},
 {id:'M-T2',title:'LV memory in the protective descent fed by linkRunDownOwner',kill:'H-03',ops:[{op:'revar',port:'//SafeResumption/HLT_DESC_SET/AndIn2',from:'linkDescActive',to:'linkRunDownOwner'}]},
 {id:'M-T3',title:'normal descent turned protective keeps the NC tolerance',kill:'C-07',ops:[D('//Network6/RUN_DOWN_RESET/OrIn4',null)]},
 {id:'M-T4',title:'Healthy loss after STO makes the descent protective',kill:'H-07',ops:[D('//Network6/RD_PROT_SET/AndIn3',null)]},
 {id:'M-T5',title:'descent sequencer not reset at Safe',kill:'E-07',ops:[D('//Network6/RD_RESET/OrIn2',null)]},
 // Extra (S4 review F2, reviewer mut.all.txt): E4 guards (E4 locators).
 {id:'M-P1',title:'PLC Config entry without button check',kill:'G-02',ops:[D('//Network1/PA_CFG/AndIn4',null)]},
 {id:'M-P4',title:'CMD_SAFE_TO_R&D without edge',kill:'P-06',ops:[D('//Network1/PA_S2R/AndIn2',null)]},
 {id:'M-P5',title:'CMD_SAFE_TO_R&D without button check',kill:'P-09',ops:[D('//Network1/PA_S2R/AndIn4',null)]},
 {id:'M-P6',title:'CMD_RUN_TO_R&D abort without edge',kill:'P-06',ops:[D('//Network1/PA_RUN2R_T/AndIn2',null)]},
 {id:'M-P7',title:'CMD_R&D_TO_SAFE step without edge',kill:'P-06',ops:[D('//Network1/PA_R2S_ST/AndIn2',null)]},
 {id:'M-P8',title:'CMD_R&D_TO_SAFE abort without edge',kill:'P-06',ops:[D('//Network1/PA_R2S_AB/AndIn2',null)]},
 {id:'M-P9',title:'CMD_R&D_TO_SAFE abort without Step12 scope',kill:'P-05',ops:[D('//Network1/PA_R2S_AB/AndIn3',null)]},
 {id:'M-P10',title:'PLC commands not blocked by the blue button',kill:'P-09',ops:[D('//Network1/PK_OK/AndIn2',null)]},
 {id:'M-P11',title:'PLC error clear ignores Bypass',kill:'P-07',ops:[D('//Network1/PE_ALLF/AndIn5',null)]},
 {id:'M-P12',title:'Config not in the LV emergency scope',kill:'G-05',ops:[D('//Network6/STAGE_LVON/OrIn3',null)]},
 {id:'M-P13',title:'Config not reset by Emergency',kill:'G-05',ops:[D('//Network3/CFG_RST/OrIn2',null)]},
 // Extra (E5 plan §6 survivors now covered by S5 sub-cases; E5 locators).
 {id:'M-S1',title:'C1 confirmed-FBK loss not an Emergency',kill:'E-09',ops:[D('//RndPhysicalCompact/WD_EMG/OrIn1',null)]},
 {id:'M-S2',title:'C1 OFF failure not an Emergency',kill:'E-10',ops:[D('//RndPhysicalCompact/WD_EMG/OrIn3',null)]},
 {id:'M-S3',title:'spontaneous C2_FBK not a SafetyFault',kill:'W-09',ops:[D('//RndPhysicalCompact/SF_SET/OrIn4',null)]},
 {id:'M-S4',title:'LV loss in StartingRun not a SafetyFault',kill:'D-09',ops:[D('//RndPhysicalCompact/SF_SET/OrIn6',null)]},
 {id:'M-S5',title:'Config entry with SafetyFault',kill:'W-06',ops:[D('//Network1/PA_CFG/AndIn8',null)]},
 {id:'M-S6',title:'acknowledge without the 2 s release',kill:'W-06',ops:[D('//RndPhysicalCompact/SF_ACK/AndIn2',null)]},
 {id:'M-S7',title:'Config C1 watchdog failure not a rollback',kill:'G-07',ops:[D('//RndPhysicalCompact/WD_FAIL_ANY/OrIn1',null)]},
 // S6 gate mutations (program/architect/S6/PLAN.md G3) killed by catalog scenarios (S6 locators).
 {id:'M-G1',since:'S6',title:'S6 gate of CMD_R&D_TO_RUN removed',kill:'W-08',ops:[D('//Network1/S6_G_R2RUN/AndIn1','V:CMD_RND_TO_RUN')]},
 {id:'M-G6',since:'S6',title:'heartbeat-low branch dead (HB_LO.AndIn2 inverted)',kill:'P-11',ops:[{op:'invert',port:'//Network1/HB_LO/AndIn2'}]},
 {id:'M-G7',since:'S6',title:'duplicate cover term inverted (HEALTHY_OK.AndIn4)',kill:'P-03',ops:[{op:'invert',port:'//Network6/HEALTHY_OK/AndIn4'}]},
 // Q-S6-2 gate (program/architect/S6/PLAN_Q62.md G3), killed by E-05.
 {id:'M-Q2',since:'S6-Q62',title:'Q62_RST BLK input removed',kill:'E-05',ops:[D('//Network1/Q62_RST/AndIn2','//Network1/Q62_BLK/RsOut')]},
 {id:'M-Q3',since:'S6-Q62',title:'Q62_RST BLK input not inverted',kill:'E-05',ops:[{op:'invert',port:'//Network1/Q62_RST/AndIn2'}]},
 {id:'M-Q4',since:'S6-Q62',title:'Q62_BLK set polarity inverted',kill:'E-05',ops:[{op:'invert',port:'//Network1/Q62_BLK/Set'}]},
 {id:'M-Q5',since:'S6-Q62',title:'Q62_BLK reset polarity inverted',kill:'E-05',ops:[{op:'invert',port:'//Network1/Q62_BLK/Reset'}]},
 {id:'M-12',title:'DOWN order STO<Discharge<C2 OFF removed',kill:'D-02',ops:[D('//Network6/RD_DIS/AndIn2','//Network6/RD_T_COAST/TonOut'),D('//Network6/DN_C2/AndIn2','//Network6/DN_T_HOLD/TonOut')]}
];

const srcOf=(m,p)=>[...p.sources,...p.globals.map(g=>'G:'+g.resolvedName),...m.variables.filter(v=>v.targetPorts.includes(p.path)).map(v=>'V:'+v.name)];
function mutate(P,ops){
 const m=structuredClone(P.m);const ports=new Map(m.networks.flatMap(n=>n.blocks.flatMap(b=>b.inputs.map(p=>[p.path,{p,b}]))));const constants={};const done=[];
 for(const o of ops){
  if(o.op==='locatorPendingE3')throw Error('LOCATOR PENDING: the DOWN-order guard does not exist before E3; locator to be defined on the S3 candidate');
  if(o.op==='invert'){const e=ports.get(o.port);if(!e||e.p.channelInterface!=='Activated')throw Error('LOCATOR NOT FOUND on target: '+o.port);
   e.p.deactivate1=e.p.deactivate1==='Make Contact (NO)'?'Break Contact (NC)':'Make Contact (NO)';done.push(o.port+' inverted');continue;}
  if(o.op==='revar'){const a=m.variables.find(v=>v.name===o.from),b=m.variables.find(v=>v.name===o.to);if(!a||!b||!a.targetPorts.includes(o.port))throw Error('LOCATOR NOT FOUND on target: '+o.port+' <- '+o.from);
   a.targetPorts=a.targetPorts.filter(p=>p!==o.port);b.targetPorts.push(o.port);done.push(`${o.port}: ${o.from} -> ${o.to}`);continue;}
  if(o.op==='unlink'){let n=0;for(const sig of o.signals){const v=m.variables.find(x=>x.name===sig);const b=v.targetPorts.length;v.targetPorts=v.targetPorts.filter(p=>!p.startsWith(o.prefix));n+=b-v.targetPorts.length;}
   if(!n)throw Error('LOCATOR NOT FOUND on target: no consumer under '+o.prefix);done.push(`${n} port(s) under ${o.prefix} unlinked`);continue;}
  if(o.op==='deactivate'&&o.optional){const e=ports.get(o.port);if(!e||e.p.channelInterface!=='Activated'||!srcOf(m,e.p).includes(o.from))continue;}
  if(o.op==='deactivate'){const e=ports.get(o.port);if(!e)throw Error('LOCATOR NOT FOUND on target: '+o.port);
   if(!['safeAnd','safeOr'].includes(e.b.functionName)||e.p.channelInterface!=='Activated')throw Error(`LOCATOR MISMATCH: ${o.port} is not an Activated safeAnd/safeOr input`);
   if(o.from&&!srcOf(m,e.p).includes(o.from))throw Error(`LOCATOR MISMATCH: ${o.port} reads ${srcOf(m,e.p).join(',')||'nothing'}, expected ${o.from}`);
   e.p.channelInterface='Deactivated';done.push(o.port);}
  else if(o.op==='const'||o.op==='invertSignal'){const actual=P.rename[o.signal]??o.signal;const v=m.variables.find(x=>x.name===actual);if(!v)throw Error('signal not declared: '+actual);
   if(o.op==='const'){const pseudo='__MUT_'+actual;m.variables.push({name:pseudo,id:pseudo,alias:null,sourcePorts:[],targetPorts:[...v.targetPorts],groupPorts:[]});
    done.push(`${actual}: ${v.targetPorts.length} consumer(s) pinned ${o.value}`);v.targetPorts=[];constants[pseudo]=o.value;}
   else{let n=0;for(const pp of v.targetPorts){const e=ports.get(pp);if(!e||!['safeAnd','safeOr','safeRs'].includes(e.b.functionName))continue;
    if(e.p.deactivate1==='Break Contact (NC)')e.p.deactivate1='Make Contact (NO)';else if(e.p.deactivate1==='Make Contact (NO)')e.p.deactivate1='Break Contact (NC)';else continue;n++;}
    if(!n)throw Error('no invertible guard consumer of '+actual);done.push(`${actual}: ${n} guard consumer(s) inverted`);}}
 }
 return {P:programFromModel(m,{...P.identity,label:'mutant'},constants),done};
}
const baseCache=new Map();
const STAGES=(process.env.CATALOG_STAGES??'').split(',').map(s=>s.trim()).filter(Boolean);
for(const M of MUTS){const sc=SCENARIOS.get(M.kill);
 test(`[M] ${M.id} ${M.title} (killing scenario ${M.kill})`,{skip:STAGES.length&&!STAGES.includes(sc.stage)?`killing scenario stage ${sc.stage} not in CATALOG_STAGES`:false},t=>{
  const P=program();if(!baseCache.has(M.kill))baseCache.set(M.kill,runScenario(M.kill,P));const base=baseCache.get(M.kill);
  if(base.fails.length){t.todo(`NOT ASSESSABLE: killing scenario ${M.kill} FAILs on the unmutated target (${base.fails.length} check(s))`);return;}
  let mm;try{mm=mutate(P,M.ops);}catch(e){if(/LOCATOR NOT FOUND/.test(e.message)&&M.since){t.todo(`NOT ASSESSABLE: guard introduced in ${M.since}, absent on this target`);return;}
   if(/LOCATOR NOT FOUND/.test(e.message)&&base.nv.length){t.todo(`NOT ASSESSABLE: guard absent and ${M.kill} has NOT VERIFIED parts on this target`);return;}throw e;}
  const {P:Pm,done}=mm;t.diagnostic(`${M.id} applied: ${done.join('; ')}`);
  const r=runScenario(M.kill,Pm);t.diagnostic(`${M.id} killed by: ${r.fails.slice(0,2).join(' | ').slice(0,300)}`);
  assert.ok(r.fails.length>0,`${M.id} SURVIVED: ${M.kill} passes on the mutant`);});}
