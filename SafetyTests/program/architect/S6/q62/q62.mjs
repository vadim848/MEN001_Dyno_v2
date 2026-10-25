// Q-S6-2 A: FBEstop1.Restart counts only a green press that began in Emergency (incl. boot Emergency, BOOT-002).
// Q62_BLK = RS(Reset = !in_Reset_PB, Set = b_EStop_Ok)  order after FBEstop1 (same-scan b_EStop_Ok), reset-dominant:
//           =1 iff the current green press had a scan with b_EStop_Ok=1 (pressed outside Emergency); cleared on release.
// Q62_RST = in_Reset_PB AND !Q62_BLK                     order before FBEstop1 (reads BLK of previous scan = press history)
// FBEstop1.Restart: V:in_Reset_PB -> W:Q62_RST.AndOut
export function apply(m,k){
 const N='Network1',W=(b,o='AndOut')=>`W://${N}/${b}/${o}`;
 const idx=p=>{const b=k.B(p);b.type={safeAnd:'fBAnd',safeOr:'fBOr',safeRs:'fBRs'}[b.functionName];b.inputs.forEach((q,i)=>{q.objectIndex??=String(8+i);});};
 k.mk(N,'Q62_RST','safeAnd',['V:in_Reset_PB',null],{order:41.5});idx(`//${N}/Q62_RST`);
 k.mk(N,'Q62_BLK','safeRs',['!V:in_Reset_PB','G:b_EStop_Ok'],{order:42.1});idx(`//${N}/Q62_BLK`); // [Reset, Set]
 k.addIn(`//${N}/Q62_RST`,'AndIn2','!'+W('Q62_BLK','RsOut'));
 k.addIn(`//${N}/FBEstop1`,'Restart',W('Q62_RST'));
}
