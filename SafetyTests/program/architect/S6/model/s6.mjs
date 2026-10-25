// S6-fix: native input rule. Each Standard PLC symbol enters only AndIn1 of a gate safeAnd (AndIn2 = safe TRUE),
// gate output replaces the symbol at every non-AndIn1 consumer. Gates run right before the first consumer (same scan).
export function apply(m,k){
 const N='Network1',W=(b,o='AndOut')=>`W://${N}/${b}/${o}`;
 const idx=p=>{const b=k.B(p);b.type={safeAnd:'fBAnd',safeOr:'fBOr'}[b.functionName];b.inputs.forEach((q,i)=>{q.objectIndex??=String(8+i);});};
 // safe constant TRUE: X OR NOT X, X = safe alias in_ES_NC_1 (input image, no ordering dependency)
 k.mk(N,'S6_TRUE','safeOr',['V:in_ES_NC_1','!V:in_ES_NC_1'],{order:35.1});idx(`//${N}/S6_TRUE`);
 const T=W('S6_TRUE','OrOut');
 const gate=(name,sym,order)=>{k.mk(N,name,'safeAnd',[`V:${sym}`,T],{order});idx(`//${N}/${name}`);return W(name);};
 const hb=gate('S6_G_HB','in_PLC_Heartbeat',35.2);
 k.addIn(`//${N}/HB_T_HI`,'TonIn',hb);                       // was V:in_PLC_Heartbeat (NC, pass)
 k.addIn(`//${N}/HB_LO`,'AndIn2',T);                         // min-2; AndIn1 = !in_PLC_Heartbeat unchanged
 const s2r=gate('S6_G_S2R','CMD_SAFE_TO_RND',115.1),r2run=gate('S6_G_R2RUN','CMD_RND_TO_RUN',115.2),
  run2r=gate('S6_G_RUN2R','CMD_RUN_TO_RND',115.3),r2s=gate('S6_G_R2S','CMD_RND_TO_SAFE',115.4),byp=gate('S6_G_BYP','inPLC_BypassC1C2',115.5);
 const P=(b,p,s,inv=false)=>k.addIn(`//${N}/${b}`,p,(inv?'!':'')+s);
 P('PC_O2','OrIn1',s2r);P('PC_O2','OrIn2',r2run);P('PC_O3','OrIn2',run2r);P('PC_O4','OrIn2',r2s);
 P('PC_A2','AndIn2',r2run);
 P('PE_ALLF','AndIn2',r2run,true);P('PE_ALLF','AndIn3',run2r,true);P('PE_ALLF','AndIn4',r2s,true);P('PE_ALLF','AndIn5',byp,true);
 P('CFG_EX_SET','AndIn2',byp,true);
 P('PK_PREV','DecIn1',s2r);P('PK_PREV','DecIn2',r2run);P('PK_PREV','DecIn3',run2r);P('PK_PREV','DecIn4',r2s);P('PK_PREV','DecIn5',byp);
 // HEALTHY_OK (Network6): AND(x) -> AND(x,x), no new FB
 k.addIn('//Network6/HEALTHY_OK','AndIn4','V:linkCoverClosed');
}
