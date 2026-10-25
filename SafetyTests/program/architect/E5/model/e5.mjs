// E5/E6 scratch candidate over E4 (architect). Fractional orders; editor renumbers contiguously.
export function apply(m,k){
 const R='RndPhysicalCompact',W=(b,o)=>`W://${R}/${b}/${o}`;
 let o=170;const n=()=>(o+=0.01);// cluster after GATE_012 (170), before RELEASE (171): reads RELEASE of the previous scan
 // ---- contactor watchdogs (E6-Q1, Q-V4-01/02, Q-RC-19), X = C1 / C2
 const wd=(X,cmd,fbk)=>{
  k.mk(R,`WD${X}_WIN`,'safeTon',[`V:${cmd}`],{order:n(),timing:0.5});                         // 500 ms from command ON
  k.mk(R,`WD${X}_FAIL_SET`,'safeAnd',[W(`WD${X}_WIN`,'TonOut'),`!V:${fbk}`,null],{order:n()}); // AndIn3 = !OK (prev scan), bound below
  k.mk(R,`WD${X}_FAIL`,'safeRs',[`!V:${cmd}`,W(`WD${X}_FAIL_SET`,'AndOut')],{order:n()});      // rise failure (level until cmd OFF)
  k.mk(R,`WD${X}_OK_SET`,'safeAnd',[W(`WD${X}_WIN`,'TonOut'),`V:${fbk}`,'!'+W(`WD${X}_FAIL`,'RsOut')],{order:n()});
  k.mk(R,`WD${X}_OK`,'safeRs',[`!V:${cmd}`,W(`WD${X}_OK_SET`,'AndOut')],{order:n()});          // confirmed at window end
  k.mk(R,`WD${X}_LOSS`,'safeAnd',[W(`WD${X}_OK`,'RsOut'),`!V:${fbk}`],{order:n()});            // Q-RC-19 -> Emergency
  k.mk(R,`WD${X}_SEEN_SET`,'safeAnd',[`V:${cmd}`,`V:${fbk}`],{order:n()});
  k.mk(R,`WD${X}_SEEN`,'safeRs',[`!V:${fbk}`,W(`WD${X}_SEEN_SET`,'AndOut')],{order:n()});      // FBK ON caused by a command
  k.mk(R,`WD${X}_OFF_IN`,'safeAnd',[`!V:${cmd}`,W(`WD${X}_SEEN`,'RsOut')],{order:n()});
  k.mk(R,`WD${X}_OFF`,'safeTon',[W(`WD${X}_OFF_IN`,'AndOut')],{order:n(),timing:0.5});        // OFF failure -> Emergency
  k.addIn(`//${R}/WD${X}_FAIL_SET`,'AndIn3','!'+W(`WD${X}_OK`,'RsOut'));
 };
 // spontaneous FBK (Q-V4-02): scope inputs filled below
 wd('C1','out_LV_C1','in_LV_C1_FBK');wd('C2','out_HV_C2','in_HV_C2_FBK');
 k.mk(R,'WDC1_SPONT','safeAnd',['!V:out_LV_C1','V:in_LV_C1_FBK','!'+W('WDC1_SEEN','RsOut'),'G:b_Step1','G:b_EStop_Ok'],{order:n()});
 k.mk(R,'WDC2_SCOPE','safeOr',['G:b_Step1','G:b_Step_RnD'],{order:n()});
 k.mk(R,'WDC2_SPONT','safeAnd',['!V:out_HV_C2','V:in_HV_C2_FBK','!'+W('WDC2_SEEN','RsOut'),W('WDC2_SCOPE','OrOut'),'G:b_EStop_Ok'],{order:n()});
 // 30 s Healthy confirmation (Q-CA1-01, 66(b)): from first FBK ON in Safe->R&D / StartingRun
 k.mk(R,'WDH1_LAT','safeRs',['!G:b_Step12','V:in_LV_C1_FBK'],{order:n()});
 k.mk(R,'WDH1_T','safeTon',[W('WDH1_LAT','RsOut')],{order:n(),timing:30});
 k.mk(R,'WDH2_LAT','safeRs',['!G:recRndC_SU','V:in_HV_C2_FBK'],{order:n()});
 k.mk(R,'WDH2_T','safeTon',[W('WDH2_LAT','RsOut')],{order:n(),timing:30});
 k.mk(R,'WD_ROLL_S12','safeOr',[W('WDC1_FAIL','RsOut'),W('WDH1_T','TonOut')],{order:n()});
 k.mk(R,'WD_ROLL_SU','safeOr',[W('WDC2_FAIL','RsOut'),W('WDH2_T','TonOut')],{order:n(),outVar:'linkWdRollSu'});
 k.mk(R,'WD_FAIL_ANY','safeOr',[W('WDC1_FAIL','RsOut'),W('WDC2_FAIL','RsOut')],{order:n(),outVar:'linkWdCfgFail'});
 k.mk(R,'WD_EMG','safeOr',[W('WDC1_LOSS','AndOut'),W('WDC2_LOSS','AndOut'),W('WDC1_OFF','TonOut'),W('WDC2_OFF','TonOut')],{order:n(),outVar:'linkWdEmg'});
 // ---- SafetyFault (66(a), Q-ARCH-05/Q-RC-11, E6-Q2, Q-RC-07, Q-V7-04)
 k.mk(R,'SF_HL_SU','safeAnd',['G:recRndC_SU','V:in_LV_Faulty_FBK'],{order:n()});
 k.mk(R,'SF_SET','safeOr',[W('WD_ROLL_S12','OrOut'),W('WD_ROLL_SU','OrOut'),W('WDC1_SPONT','AndOut'),W('WDC2_SPONT','AndOut'),
  'V:linkHltRunLost',W('SF_HL_SU','AndOut'),'V:linkHltLvLost'],{order:n()});
 k.mk(R,'SF_ACK','safeAnd',['!'+W('GATE_002','AndOut'),W('RELEASE','TonOut'),'!'+W('SF_SET','OrOut'),null],{order:n()}); // prev-scan RELEASE, SF
 k.mk(R,'SF','safeRs',[W('SF_ACK','AndOut'),W('SF_SET','OrOut')],{order:n(),outVar:'linkSafetyFault'});
 k.addIn(`//${R}/SF_ACK`,'AndIn4',W('SF','RsOut'));
 o=171.5;
 k.mk(R,'SF_ACKC','safeRs',[W('RELEASE','TonOut'),W('SF_ACK','AndOut')],{order:n()});           // attempt consumed until both OFF 2 s
 k.mk(R,'SF_UPBLK','safeOr',[W('SF','RsOut'),W('SF_ACKC','RsOut')],{order:n(),outVar:'linkUpBlock'});
 // ---- consumers
 k.vr('linkHltRunLost').sourcePorts.push('//Network6/RD_PROT_SET/AndOut');                  // HealthyLost Run/SS1 (Q-RC-02/15)
 k.addIn('//Network1/FBAnd1','AndIn5','!V:linkWdEmg');                                       // Emergency (E-09/E-10, S4-F3a)
 k.addIn('//Network2/FBAnd4','AndIn4','!V:linkUpBlock');                                     // Safe->R&D (BOTH + PLC)
 k.addIn('//Network1/PA_CFG','AndIn8','!V:linkUpBlock');                                     // Config entry (Q-RC-07b)
 // R&D->Run: gate STATE_SU.Set
 k.mk(R,'SU_SET_G','safeAnd',[W('SU_SET','OrOut'),'!'+W('SF_UPBLK','OrOut')],{order:222.5});
 k.bind('//RndPhysicalCompact/STATE_SU/Set',W('SU_SET_G','AndOut'));
 k.addIn(`//${R}/GATE_SG_SET`,'OrIn4',W('WD_ROLL_S12','OrOut'));                             // W-01/W-04 rollback = abort Safe->R&D
 k.addIn('//Network6/SU_ABORT_CAUSE','OrIn4','V:linkWdRollSu');                              // W-02/W-03 rollback = abort StartingRun
 k.mk('Network1','CFG_EX_OR','safeOr',['W://Network1/CFG_EX_SET/AndOut','V:linkWdCfgFail'],{order:138.5}); // G-07 rollback = Config exit
 k.bind('//Network1/CFG_EX/Set','W://Network1/CFG_EX_OR/OrOut');
 k.addIn('//Network1/PF_OR','OrIn2','V:linkSafetyFault');                                    // STS_FAULT (Q-RC-13)
}
