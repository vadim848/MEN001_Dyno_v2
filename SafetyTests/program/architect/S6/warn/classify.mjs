// Build ../WARNINGS.json from map.out.json (+ probe/targeted outputs). usage: node classify.mjs
import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync(new URL('./map.out.json',import.meta.url)));
// NEW groups: [regex on key, group, stage-plan block, safety path, extra delay (scans), risk analysis, verdict]
const G=[
 [/PK_PREV\.DecOut/,'A-PLC-EDGE','E4 PLC command edge memory PK_PREV (S6 gates S6_G_*)','PLC command accept -> main transitions',0,
  'Intentional previous-scan memory: PA_x = CMD_gated(k) AND NOT CMD_gated(k-1) = rising-edge detector, 1-scan accept pulse. Same-scan read would make PA_x constantly FALSE. Reordering forbidden.','ACCEPT (intentional)'],
 [/linkCfgAccept/,'B-CFG','E4 Config entry PA_CFG -> STATE_CFG/FBRs5(Step1)/FBRs7/FBRs9 resets','Config entry; LV/HV discharge latches reset',1,
  'All 4 consumers of the 1-scan pulse read it in the same scan k+1 -> Step1 reset and STATE_CFG set in the same scan (no 0/2-state scan; stand rule 5 holds in all runs). Partial reordering of only some consumers WOULD create a 0/2-state scan - keep together.','ACCEPT'],
 [/linkCfgDone/,'B-CFG','E4 Config exit CFG_DONE -> FBOr2(Step1 set)/CFG_RST(STATE_CFG reset)','Config exit to Safe',1,
  'Both consumers read the pulse in the same scan k+1 -> STATE_CFG reset and Step1 set together (consistent hand-over).','ACCEPT'],
 [/CFG_EX\.RsOut->FBOr10|CFG_OFF\.AndOut->FBOr6/,'B-CFG','E4 Config exit -> HV/LV discharge request set (FBRs9/FBRs7)','discharge request (Config exit)',1,
  'Discharge request latch set 1 scan after CFG_EX/CFG_OFF; level signals (RS-latched), no pulse loss; discharge is a separate command after C1/C2 OFF, 1 scan << CFG_T_HOLD.','ACCEPT'],
 [/linkWdCfgFail/,'E-WD','E5 watchdog FAIL in Config -> CFG_EX_OR -> CFG_EX','watchdog -> Config exit',1,
  'WDCx_FAIL is RS-latched (level); exit 1 scan later after a 500 ms / 30 s window; no wrong state.','ACCEPT'],
 [/linkSafeUpScope->|SAFE_UP_SCOPE\.AndOut->PA_CFG/,'B-CFG','E4 PA_CFG guard linkSafeUpScope','Config entry guard',1,
  'Guard lags 1 scan only in its GATE_001 part; Step1 and EStop guards of PA_CFG are same-scan (PS_SAFE). Coincidence scan == legal sequence "command 1 scan earlier".','ACCEPT'],
 [/linkUpBlock/,'E-SF','E5 SafetyFault up-block SF_UPBLK -> PA_CFG.AndIn8','SafetyFault blocks Config entry',1,
  'If SafetyFault latches in the same scan as a CFG command edge, CFG is accepted (block seen next scan) == legal order "CFG accepted, then fault 1 scan later"; SU/BA up-blocks are same-scan. No 2-state scan; residual: up-block not effective in the coincidence scan.','ACCEPT'],
 [/FBAnd91\.AndOut->RUN_DOWN_REQ/,'C-RUNDOWN','E4 green Run->R&D request FBAnd91 -> RUN_DOWN_REQ','Run->R&D (STO via SS1 sequence)',1,
  'Level request (GREEN TON held); owner set 1 scan later. No pulse.','ACCEPT'],
 [/RUN_DOWN_OWNER\.RsOut->HEALTH_GUARD/,'C-RUNDOWN','E2a HEALTH_GUARD masks Healthy loss while RUN_DOWN_OWNER','Healthy-loss -> Step4 (FBAnd35/FBAnd12)',1,
  'Owner seen 1 scan late: Healthy loss in the owner-set scan is handled as before the command (Step4) == legal order. Probe Run->R&D(green/PLC) x LVF/HVF level+pulse at every event scan: no 0/2-state scan.','ACCEPT'],
 [/linkRunDownOwner/,'C-RUNDOWN','E2b FBOrIlRunOk (interlock tolerance while owner) -> FBAnd37 -> EStopIn3','Emergency (interlock in Run)',1,
  'Tolerance starts/ends 1 scan late; start: cover opening in the owner-set scan -> Emergency (conservative); end: owner reset only at R&D entry where NotRunSu already tolerates. No wrong state.','ACCEPT'],
 [/FBOr42\.OrOut->RD_SEQ/,'C-RUNDOWN','E3 RD_SEQ start (FBOr42 = owner OR RD_PROT)','Run-down SS1/STO sequence start',1,
  'RD_SEQ set 1 scan later (+1 pre-existing owner->FBOr42) = 2 scans before RD_T_SS1 starts; level, no pulse; STO timing unchanged relative to RD_SEQ.','ACCEPT'],
 [/RD_STO\.RsOut->RD_PROT_SET/,'C-RUNDOWN','E3 RD_PROT_SET = run & Healthy lost & NOT RD_STO','protective run-down + SafetyFault (linkHltRunLost)',0,
  'Self-terminating 1-scan set pulse by design (RD_PROT latches, RD_STO set same scan via RD_STO_TRIG). Targeted probe: 1-scan HV/LV faulty pulse in Run -> RD_PROT_SET 1 scan -> SF latched next scan, not lost. Coincidence with normal RD_STO set == Healthy loss 1 scan earlier.','ACCEPT'],
 [/FBAnd66\.AndOut->RD_RESET/,'C-RUNDOWN','E3 run-down completion FBAnd66 -> RD_RESET (RD_PROT/RD_SEQ/RD_STO reset)','STO latch of run-down, completion',1,
  'Run-down latches cleared 1 scan after Step12 handover (b_Step12_Set_2 same scan to owner reset): STO request held 1 scan longer (conservative), RD_SEQ Set (owner, lagged) already FALSE when reset releases. No 2-state scan in probes.','ACCEPT'],
 [/DN_T_HOLD\.TonOut->SU_ABORT_END/,'C-RUNDOWN','E3 StartingRun abort end DN_T_HOLD','abort latch SU_ABORT release',1,
  'Abort latch released 1 scan later (conservative: abort blocks PS_RND/HLT_LV/SG_OWNER).','ACCEPT'],
 [/linkAbortActive/,'C-RUNDOWN','E3/E4 SU_ABORT -> FBAndNotRunSu (interlock tolerance) / PS_RND (PLC R&D permit)','Emergency interlock tolerance / PLC accept',1,
  'At abort set the same consumers are already blocked by NOT recRndC_SU (prev-scan SU=TRUE), so no permissive window; at abort end permit returns 1 scan late (conservative).','ACCEPT'],
 [/linkDescActive->|DN_ACTIVE\.OrOut->PS_RUN/,'C-RUNDOWN','E4 PS_RUN blocked while descent active','PLC Run->R&D accept',1,
  'During the first descent scan PS_RUN may still accept CMD_RUN_TO_R&D -> second run-down request OR-ed into an already set owner: no effect.','ACCEPT'],
 [/FBAnd67\.AndOut->FBOr23/,'C-RUNDOWN','E2a out_SS1_DR2 = Step2 OR (Step3 AND NOT descent)','SS1 drive command (DR2)',1,
  'SS1 drop 1 scan after descent start (DR1 path FBAnd67->FBOr24 identical, pre-existing in F1); SS1->STO interval shortened by <=1 scan of a seconds-range timer. Both drives stay aligned (same lag).','ACCEPT'],
 [/out_EStop_Status/,'D-ESTOP','E2a FBAnd35 (Run healthy permit) reads out_EStop_Status (Network2) - order moved by E2a','Run healthy permit -> FBAnd12 -> Step4 (not the Emergency chain)',1,
  'Emergency itself is same-scan: FBEstop1 (ord 42) reads in_ES_NC_1/2 directly (probe: EMG at scan 1). Only the Step4 descent request via FBAnd12 follows 1 scan later (EMG already latched).','ACCEPT'],
 [/linkCoverClosed:FBAnd81\.AndOut->HEALTHY_OK\.AndIn3/,'D-ESTOP','E2b HEALTHY_OK cover term','Healthy permit -> Step4',1,
  'Cover term of HEALTHY_OK 1 scan late; Emergency path for the cover (FBOrIlRunOk, ord 98 > 94) is same-scan.','ACCEPT'],
 [/linkCoverClosed:FBAnd81\.AndOut->HEALTHY_OK\.AndIn4/,'D-ESTOP','E6v / S6-fix: HEALTHY_OK.AndIn4 duplicate of AndIn3 (min-2 input rule)','Healthy permit -> Step4',0,
  'AND(x,x)=x with the same symbol, same timing as AndIn3 (pre-existing E2b read): zero behavioural delta.','ACCEPT'],
 [/G10_EXIT\.AndOut->FBOr2/,'D-ESTOP','E2b G10 exit -> FBOr2 (Step1 set, FBRs17 reset)','return to Safe after Emergency drain',1,
  'FBOr2 sets Step1 and resets FBRs17 in the same scan k+1 (consistent hand-over).','ACCEPT'],
 [/linkSafeRndScope/,'D-ESTOP','E4 PS_RND scope guard','PLC accept in R&D',1,
  'Scope from Step_RnD (latched) and GATE_001; EStop/SU/SG terms of PS_RND unaffected; coincidence == legal order.','ACCEPT'],
 [/SF\.RsOut->SF_ACK|RELEASE\.TonOut->SF_ACK/,'E-SF','E5 SafetyFault ack SF_ACK = press AND RELEASE(k-1) AND NOT SF_SET AND SF(k-1)','SafetyFault reset',0,
  'Intentional: RELEASE(k-1) with NOT GATE_002(k) = "first pressed scan after the full release filter" (edge); SF(k-1) restricts ack to an already latched fault; NOT SF_SET is same-scan (ack impossible while the cause is present). Reordering would break the edge.','ACCEPT (intentional)'],
 [/linkHltRunLost|linkHltLvLost:HLT_LV\.AndOut->SF_SET/,'E-SF','E5 SF_SET sources linkHltRunLost / linkHltLvLost','SafetyFault set',1,
  '1-scan pulses are not lost (value persists until the producer re-writes): targeted probes Run HV/LV faulty 1-scan pulse and R&D LV faulty pulse -> SF latched at scan 2.','ACCEPT'],
 [/linkSafetyFault/,'E-SF','E5 STS_FAULT = PE_ERR OR SafetyFault (PF_OR)','status to PLC only',1,'Status bit 1 scan late; no safety function.','ACCEPT'],
 [/WDC[12]_OK\.RsOut->WDC[12]_FAIL_SET/,'E-WD','E5 watchdog FAIL_SET = window AND NOT FBK AND NOT OK(k-1)','watchdog C1/C2 FAIL latch',0,
  'OK_SET and FAIL_SET are decided in the same window-expiry scan by the FBK value (mutually exclusive); afterwards OK(k-1)=TRUE blocks FAIL (LOSS path handles later drops); both reset same-scan by NOT out_LV_C1/out_HV_C2. No 2-latch state.','ACCEPT'],
 [/linkWdEmg/,'E-WD','E5 WD_EMG -> FBAnd37.AndIn5 -> FBEstop1.EStopIn3 (FBAnd37->FBEstop1 pre-existing lag)','Emergency (watchdog loss)',1,
  'Targeted probe: C1/C2 FBK loss -> WD_EMG at scan 1, EMG at scan 3 (2 scans: 1 NEW + 1 pre-existing); 1-scan FBK glitch still latches EMG. Level/latched inputs to safeEstop, no missed pulse.','ACCEPT'],
 [/linkHltLvLost:HLT_LV\.AndOut->GATE_030/,'F-RND','E2c GATE_030 -> STATE_C (gesture consume latch) on LV Healthy loss','R&D->Safe on LV Healthy loss (E2-Q2a)',1,
  'STATE_SG set same scan (GATE_SG_SET ord 276), STATE_C 1 scan later; SG and C coexist by design for ~23 scans (C is the gesture-consumption latch, not a main state). Probe: no 0/2-main-state scan.','ACCEPT'],
];
const out=j.warnings.map((w,i)=>{const r={n:i+1,kind:w.kind,key:w.key,producer:{net:w.pnet,order:w.po,fb:w.key.split('->')[0].split(':').at(-1)},consumer:{net:w.cnet,order:w.co,port:w.key.split('->')[1]},
 status:w.status,inREF_4495a1f:w.inREF,inF1_04b45456:w.inF1,firstStage:w.firstStage};
 if(w.status==='PRE-EXISTING'){Object.assign(r,{verdict:'ACCEPT',rationale:'Same producer->consumer previous-scan read exists in '+(w.inREF?'reference 4495a1f and ':'')+'F1 (matched by instanceName/block Id); not changed by E2-E6v ordering.'});return r;}
 const g=G.find(([re])=>re.test(w.key));if(!g)throw Error('unclassified NEW '+w.key);
 Object.assign(r,{group:g[1],planBlock:g[2],safetyPath:g[3],extraDelayScans:g[4],extraDelayMsAtStand:g[4],analysis:g[5],verdict:g[6]});return r;});
const by=(f)=>out.reduce((a,o)=>(a[f(o)]=(a[f(o)]??0)+1,a),{});
const doc={source:'program/lead/S6/VERIFY_RESULT_3.md (Vadim xlsx 2026-10-25)',canonical:{sal:'9209319039fc555e77e5dfc626deafd507a14058cfd96847f0eb29dccb3469ef',sgvl:'27864ca301abf9c651527c66ff15194ef802a9016e344f02ec3e6b1681995db1',commit:'0c1800e'},
 reference:{commit:'4495a1f6049f6a58ebfd436761faa84d17c8d643',sal:'c5f0c0cea479f65e3a11fbe9cf2520a2b54d2cbf85602fd7a2cbab8e27132153'},f1:'fixtures/stand-f1-04b45456 (SAL 04b45456...)',
 semantics:'stand: native orderOfExecution, consumer before producer reads previous-scan value; scanMs=1 (1 scan = 1 ms on stand; native EL6910 cycle time not known -> delays given in scans)',
 counts:{total:out.length,byKind:by(o=>o.kind),byStatus:by(o=>o.status),newByStage:by(o=>o.status==='NEW'?o.firstStage:'-'),byVerdict:by(o=>o.verdict),fix:out.filter(o=>/FIX/.test(o.verdict)).length},
 tools:['architect/S6/warn/map.mjs','architect/S6/warn/dump.mjs','architect/S6/warn/probe.mjs','architect/S6/warn/targeted.mjs','architect/S6/warn/classify.mjs'],warnings:out};
for(const f of fs.readdirSync(new URL('.',import.meta.url)).filter(f=>/^probe\..*\.out\.json$/.test(f)))(doc.probes??=[]).push({file:f,summary:JSON.parse(fs.readFileSync(new URL('./'+f,import.meta.url))).summary.filter(s=>s.viol||s.energyRiseAfterEmg||s.emgNotReached||s.pulseNotLatched||s.notInjected)});
if(fs.existsSync(new URL('./targeted.out.json',import.meta.url)))doc.targeted=JSON.parse(fs.readFileSync(new URL('./targeted.out.json',import.meta.url))).map(r=>({label:r.label,firstTrue:r.firstTrue,firstEMG:r.firstEMG,firstFault:r.firstFault,check:r.check}));
fs.writeFileSync(new URL('../WARNINGS.json',import.meta.url),JSON.stringify(doc,null,1));console.log(JSON.stringify(doc.counts));
