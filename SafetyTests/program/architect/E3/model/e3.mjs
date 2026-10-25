// E3 scratch candidate A (architect). Orders: new cluster at 161.01.. (before STATE_SU 162).
export function apply(m,k){
 const N='Network6',P='//Network6/';let o=161;const n=()=>(o+=0.01);
 k.mk(N,'RD_HLOSS','safeOr',['V:in_LV_Faulty_FBK','V:in_HV_Faulty_FBK'],{order:n()});
 k.mk(N,'RD_PROT_SET','safeAnd',['W:'+P+'FBAnd1/AndOut','W:'+P+'RD_HLOSS/OrOut',null],{order:n()});
 k.mk(N,'RD_RESET','safeOr',['W:'+P+'FBAnd18/AndOut','G:b_Step1'],{order:n()});
 k.mk(N,'RD_PROT','safeRs',['W:'+P+'RD_RESET/OrOut','W:'+P+'RD_PROT_SET/AndOut'],{order:n()});
 k.mk(N,'RD_SEQ','safeRs',['W:'+P+'RD_RESET/OrOut','W:'+P+'FBOr5/OrOut'],{order:n()});
 k.mk(N,'RD_T_SS1','safeTon',['W:'+P+'RD_SEQ/RsOut'],{order:n(),timing:2});
 k.mk(N,'RD_STO_TRIG','safeOr',['W:'+P+'RD_T_SS1/TonOut','W:'+P+'RD_PROT/RsOut'],{order:n()});
 k.mk(N,'RD_STO','safeRs',['W:'+P+'RD_RESET/OrOut','W:'+P+'RD_STO_TRIG/OrOut'],{order:n()});
 k.bind(P+'RD_PROT_SET/AndIn3','!W:'+P+'RD_STO/RsOut');
 k.mk(N,'RD_T_COAST','safeTon',['W:'+P+'RD_STO/RsOut'],{order:n(),timing:5});
 k.mk(N,'RD_DIS','safeAnd',['W:'+P+'RD_SEQ/RsOut','W:'+P+'RD_T_COAST/TonOut'],{order:n()});
 k.mk(N,'SU_ABORT_CAUSE','safeOr',['V:linkRndGreenQualified','V:in_LV_Faulty_FBK'],{order:n()});
 k.mk(N,'SU_ABORT_SET','safeAnd',['G:recRndC_SU','W:'+P+'SU_ABORT_CAUSE/OrOut'],{order:n()});
 k.mk(N,'SU_ABORT_END','safeAnd',[null,'!V:out_HV_C2','!V:in_HV_C2_FBK'],{order:n()});
 k.mk(N,'SU_ABORT_RESET','safeOr',['W:'+P+'SU_ABORT_END/AndOut','G:b_Step1'],{order:n()});
 k.mk(N,'SU_ABORT','safeRs',['W:'+P+'SU_ABORT_RESET/OrOut','W:'+P+'SU_ABORT_SET/AndOut'],{order:n(),outVar:'linkAbortActive'});
 k.mk(N,'DN_STO','safeOr',['W:'+P+'RD_STO/RsOut','W:'+P+'SU_ABORT/RsOut'],{order:n()});
 k.mk(N,'DN_DIS','safeOr',['W:'+P+'RD_DIS/AndOut','W:'+P+'SU_ABORT/RsOut'],{order:n()});
 k.mk(N,'DN_T_HOLD','safeTon',['W:'+P+'DN_DIS/OrOut'],{order:n(),timing:1});
 k.bind(P+'SU_ABORT_END/AndIn1','W:'+P+'DN_T_HOLD/TonOut');
 k.mk(N,'DN_C2','safeAnd',['W:'+P+'DN_DIS/OrOut','W:'+P+'DN_T_HOLD/TonOut'],{order:n()});
 k.mk(N,'DN_ACTIVE','safeOr',['W:'+P+'RD_SEQ/RsOut','W:'+P+'SU_ABORT/RsOut'],{order:n(),outVar:'linkDescActive'});
 k.mk('RndPhysicalCompact','SU_RESET','safeOr',['!V:linkSafeRndScope','V:linkAbortActive'],{order:n()});
 // rewires
 for(const i of [1,2,3,4])k.clear(P+'FBDecouple2/DecIn'+i);
 k.bind(P+'FBDecouple2/DecIn1','W:'+P+'DN_STO/OrOut');k.bind(P+'FBDecouple2/DecIn2','W:'+P+'DN_STO/OrOut');
 k.bind(P+'FBDecouple2/DecIn3','W:'+P+'DN_DIS/OrOut');k.bind(P+'FBDecouple2/DecIn4','W:'+P+'DN_C2/AndOut');
 k.addIn(P+'FBOr5','OrIn3','W:'+P+'RD_PROT/RsOut');
 k.addIn(P+'RUN_DOWN_RESET','OrIn4','W:'+P+'RD_PROT/RsOut');
 k.off(P+'HEALTHY_OK/AndIn1');k.off(P+'HEALTHY_OK/AndIn2');
 k.addIn('//Network1/FBAndNotRunSu','AndIn3','!V:linkAbortActive');
 k.addIn('//Network1/FBAnd2','AndIn4','!V:linkDescActive');
 k.off('//RndPhysicalCompact/GATE_008/AndIn4');k.off('//RndPhysicalCompact/GATE_014/AndIn4');
 k.bind('//RndPhysicalCompact/STATE_SU/Reset','W://RndPhysicalCompact/SU_RESET/OrOut');
 k.addIn('//SafeResumption/SG_OWNER_SET','AndIn3','!V:linkAbortActive');
 k.addIn('//SafeResumption/HLT_LV','AndIn5','!V:linkAbortActive');
 k.bind('//SafeResumption/HLT_DESC_SET/AndIn2','V:linkDescActive');
 k.addIn('//Network12/FBAnd2','AndIn5','!G:recRndC_SU');k.addIn('//Network12/FBAnd2','AndIn6','!V:linkAbortActive');
}
