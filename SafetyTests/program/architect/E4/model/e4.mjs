// E4 scratch candidate (architect). Orders: fractional insertions (editor renumbers contiguously).
import {ext} from './kit4.mjs';
export function apply(m,k){
 const x=ext(m,k);const W=(n,b,o)=>`W://${n}/${b}/${o}`;
 // ---- legacy removal (question 77) + 10 s Bypass timer (V14-Q17)
 for(const p of ['//Network1/FBAnd10','//Network1/FBAnd12','//Network2/FBAnd61','//Network2/FBAnd81','//Network2/FBAnd11','//Network2/FBAnd91',
  '//Network6/FBAnd15','//Network6/FBAnd16','//Network6/FBAnd17','//Network1/FBTon1'])x.del(p);
 k.off('//Network1/FBAnd2/AndIn2');k.off('//Network1/FBAnd2/AndIn3');k.off('//Network2/FBOr1/OrIn2');k.off('//Network6/FBOr5/OrIn2');
 x.delVar('inPLC_RnD_Mode');x.delVar('inPLC_RnD_Mode_2');
 const C=['V:CMD_SAFE_TO_RND','V:CMD_RND_TO_RUN','V:CMD_RUN_TO_RND','V:CMD_RND_TO_SAFE','V:inPLC_BypassC1C2'];
 const N='Network1',P=(b,o)=>W(N,b,o);
 // ---- heartbeat (before FBEstop1, order 34)
 let o=33;const n=()=>(o+=0.01);
 k.mk(N,'HB_LO','safeAnd',['!V:in_PLC_Heartbeat'],{order:n()});
 k.mk(N,'HB_T_HI','safeTon',['V:in_PLC_Heartbeat'],{order:n(),timing:3});
 k.mk(N,'HB_T_LO','safeTon',[P('HB_LO','AndOut')],{order:n(),timing:3});
 k.mk(N,'HB_OK','safeAnd',['!'+P('HB_T_HI','TonOut'),'!'+P('HB_T_LO','TonOut')],{order:n()});
 k.addIn('//Network1/FBEstop1','EStopIn7',P('HB_OK','AndOut'));k.port('//Network1/FBEstop1/EStopIn7').channelInterface='Single-Channel 1 Activated';
 // ---- PLC command cluster (after N1/FBDecouple2, order 105)
 o=105;
 k.mk(N,'PS_SAFE','safeAnd',['G:b_Step1','G:b_EStop_Ok'],{order:n()});
 k.mk(N,'PS_RND','safeAnd',['V:linkSafeRndScope','G:b_EStop_Ok','!G:recRndC_SU','!V:linkAbortActive','!G:recRndC_SG'],{order:n()});
 k.mk(N,'PS_RUN','safeAnd',['G:b_Step3','G:b_EStop_Ok','!V:linkDescActive'],{order:n()});
 k.mk(N,'PS_ANY','safeOr',[P('PS_SAFE','AndOut'),P('PS_RND','AndOut'),P('PS_RUN','AndOut')],{order:n()});
 k.mk(N,'PC_O2','safeOr',[C[0],C[1]],{order:n()});k.mk(N,'PC_A2','safeAnd',[C[0],C[1]],{order:n()});
 k.mk(N,'PC_A3','safeAnd',[C[2],P('PC_O2','OrOut')],{order:n()});k.mk(N,'PC_O3','safeOr',[P('PC_O2','OrOut'),C[2]],{order:n()});
 k.mk(N,'PC_A4','safeAnd',[C[3],P('PC_O3','OrOut')],{order:n()});k.mk(N,'PC_O4','safeOr',[P('PC_O3','OrOut'),C[3]],{order:n()});
 k.mk(N,'PC_A5','safeAnd',[C[4],P('PC_O4','OrOut')],{order:n()});
 k.mk(N,'PC_TWO','safeOr',[P('PC_A2','AndOut'),P('PC_A3','AndOut'),P('PC_A4','AndOut'),P('PC_A5','AndOut')],{order:n()});
 k.mk(N,'PE_SET','safeAnd',[P('PC_TWO','OrOut'),P('PS_ANY','OrOut')],{order:n()});
 k.mk(N,'PE_ALLF','safeAnd',C.map(c=>'!'+c),{order:n()});
 k.mk(N,'PE_T_CLR','safeTon',[P('PE_ALLF','AndOut')],{order:n(),timing:1});
 k.mk(N,'PE_ERR','safeRs',[P('PE_T_CLR','TonOut'),P('PE_SET','AndOut')],{order:n()});
 k.mk(N,'PK_OK','safeAnd',['!V:in_Reset_PB','!V:in_Relase_Door_PB','!'+P('PE_ERR','RsOut')],{order:n()});
 const prev=i=>'!'+P('PK_PREV','DecOut'+i);
 // PK_PREV is created below (backward read = previous scan); bind after creation
 const later=[];
 const mkL=(name,fn,ins,opt)=>{const idx=ins.map((s,i)=>typeof s==='function'?i:-1).filter(i=>i>=0);
  k.mk(N,name,fn,ins.map(s=>typeof s==='function'?null:s),opt);for(const i of idx)later.push([`//${N}/${name}/AndIn${i+1}`,ins[i]]);};
 const pv=i=>()=>prev(i);
 mkL('PA_S2R','safeAnd',[C[0],pv(1),P('PS_SAFE','AndOut'),P('PK_OK','AndOut')],{order:n(),outVar:'linkPlcAccS2R'});
 mkL('PA_R2RUN','safeAnd',[C[1],pv(2),P('PS_RND','AndOut'),P('PK_OK','AndOut'),'V:linkCoverClosed','!V:in_HV_C2_FBK'],{order:n(),outVar:'linkPlcAccR2Run'});
 mkL('PA_RUN2R_T','safeAnd',[C[2],pv(3),P('PK_OK','AndOut')],{order:n(),outVar:'linkPlcAbortSu'});
 k.mk(N,'PA_RUN2R','safeAnd',[P('PA_RUN2R_T','AndOut'),P('PS_RUN','AndOut')],{order:n(),outVar:'linkPlcAccRun2R'});
 mkL('PA_R2S_ST','safeAnd',[C[3],pv(4),P('PS_RND','AndOut'),P('PK_OK','AndOut')],{order:n()});
 mkL('PA_R2S_AB','safeAnd',[C[3],pv(4),'G:b_Step12',P('PK_OK','AndOut')],{order:n()});
 k.mk(N,'PA_R2S','safeOr',[P('PA_R2S_ST','AndOut'),P('PA_R2S_AB','AndOut')],{order:n(),outVar:'linkPlcAccR2S'});
 mkL('PA_CFG','safeAnd',[C[4],pv(5),P('PS_SAFE','AndOut'),P('PK_OK','AndOut'),'V:linkSafeUpScope','V:linkCoverClosed','V:out_ReadyForStep2'],{order:n(),outVar:'linkCfgAccept'});
 k.mk(N,'PF_OR','safeOr',[P('PE_ERR','RsOut'),null],{order:n(),outVar:'STS_FAULT'});k.off('//Network1/PF_OR/OrIn2');
 // Config exit (N1)
 k.mk(N,'CFG_EX_SET','safeAnd',['V:linkCfgActive','!V:inPLC_BypassC1C2'],{order:n()});
 k.mk(N,'CFG_EX','safeRs',['!V:linkCfgActive',P('CFG_EX_SET','AndOut')],{order:n()});
 k.mk(N,'CFG_T_HOLD','safeTon',[P('CFG_EX','RsOut')],{order:n(),timing:1});
 k.mk(N,'CFG_OFF','safeAnd',[P('CFG_EX','RsOut'),P('CFG_T_HOLD','TonOut')],{order:n()});
 k.mk(N,'CFG_DONE','safeAnd',[P('CFG_OFF','AndOut'),'!V:out_LV_C1','!V:out_HV_C2','!V:in_LV_C1_FBK','!V:in_HV_C2_FBK'],{order:n(),outVar:'linkCfgDone'});
 x.mkDec(N,'PK_PREV',C,{order:n()});
 for(const [pp,f] of later)k.bind(pp,f());
 // rewires N1
 k.bind('//Network1/FBAnd4/AndIn1','V:linkCfgActive');k.bind('//Network1/FBAnd4/AndIn5','!'+P('CFG_EX','RsOut'));
 k.bind('//Network1/FBAnd7/AndIn1',P('CFG_OFF','AndOut'));k.bind('//Network1/FBAnd8/AndIn1',P('CFG_OFF','AndOut'));
 k.bind('//Network1/FBOr6/OrIn2',P('CFG_EX','RsOut'));
 k.bind('//Network1/FBOr5/OrIn1','V:linkCfgAccept');k.bind('//Network1/FBOr1/OrIn1','V:linkCfgAccept');
 k.bind('//Network1/FBOr2/OrIn3',P('CFG_OFF','AndOut'));
 k.bind('//Network1/FBAndNotRunSu/AndIn4','!V:linkCfgActive');
 // N3 Config stage
 k.mk('Network3','CFG_RST','safeOr',['V:linkCfgDone','G:b_Step4_Set'],{order:15.01});
 k.mk('Network3','STATE_CFG','safeRs',['W://Network3/CFG_RST/OrOut','V:linkCfgAccept'],{order:15.02,outVar:'linkCfgActive'});
 k.bind('//Network3/FBOr1/OrIn1','V:linkCfgAccept');k.bind('//Network3/FBOr2/OrIn1','V:linkCfgDone');
 k.bind('//Network3/FBAnd2/AndIn5','!W://Network3/STATE_CFG/RsOut');
 // status decoder at the end of the scan
 const D='Network3';o=900;
 k.mk(D,'DEC_S','safeOr',['G:b_Step1','G:b_Step12'],{order:n()});
 k.mk(D,'DEC_SAFE','safeAnd',['W://Network3/DEC_S/OrOut','G:b_EStop_Ok'],{order:n(),outVar:'STS_SAFE'});
 k.mk(D,'DEC_RND','safeAnd',['G:b_Step_RnD','G:b_EStop_Ok'],{order:n(),outVar:'STS_RND'});
 k.mk(D,'DEC_RUN','safeAnd',['G:b_Step3','G:b_EStop_Ok'],{order:n(),outVar:'STS_RUN'});
 k.mk(D,'DEC_CFG','safeAnd',['W://Network3/STATE_CFG/RsOut','G:b_EStop_Ok'],{order:n(),outVar:'STS_CFG'});
 k.mk(D,'DEC_EMG','safeAnd',['!W://Network3/DEC_SAFE/AndOut','!W://Network3/DEC_RND/AndOut','!W://Network3/DEC_RUN/AndOut','!W://Network3/DEC_CFG/AndOut'],{order:n(),outVar:'STS_EMG'});
 // injections into existing up/down paths
 k.mk('Network2','S2R_REQ','safeOr',['V:linkRndBothQualified','V:linkPlcAccS2R'],{order:136.5});k.bind('//Network2/FBAnd4/AndIn1','W://Network2/S2R_REQ/OrOut');
 k.mk('RndPhysicalCompact','SU_SET','safeOr',['W://RndPhysicalCompact/GATE_020/AndOut','V:linkPlcAccR2Run'],{order:182.5});k.bind('//RndPhysicalCompact/STATE_SU/Set','W://RndPhysicalCompact/SU_SET/OrOut');
 k.mk('Network6','RUN_DOWN_REQ','safeOr',['W://Network6/FBAnd24/AndOut','V:linkPlcAccRun2R'],{order:249.5});k.bind('//Network6/FBAnd23/AndIn1','W://Network6/RUN_DOWN_REQ/OrOut');
 k.bind('//Network6/SU_ABORT_CAUSE/OrIn3','V:linkPlcAbortSu');
 k.bind('//RndPhysicalCompact/GATE_SG_SET/OrIn3','V:linkPlcAccR2S');
 k.bind('//Network6/STAGE_LVON/OrIn3','V:linkCfgActive');
 // STS_COVER_LOCKED on a free channel of N10/FBDecouple2 (no new FB)
 k.bind('//Network10/FBDecouple2/DecIn5','V:linkCoverClosed');x.outVar('//Network10/FBDecouple2/DecOut5','STS_COVER_LOCKED');
}
