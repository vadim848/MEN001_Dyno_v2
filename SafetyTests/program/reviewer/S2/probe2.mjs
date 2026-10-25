import {program,programFromModel} from '../../../test/helpers/catalog-program.js';
import fs from 'node:fs';
const P0=program();
const mut=(P,fn)=>{const m=structuredClone(P.m);for(const n of m.networks)for(const b of n.blocks)for(const p of b.inputs)fn(b,p);return programFromModel(m,{...P.identity,label:'mut'});};
const stIs=(s,v)=>s.st.length===1&&s.st[0]===v;const out=[];
const variants={base:P0,noMem:mut(P0,(b,p)=>{if(p.path==='//SafeResumption/HLT_LV_SRC/OrIn2')p.channelInterface='Deactivated';}),
 fbkFixOff:mut(P0,(b,p)=>{if(p.path==='//Network1/FBK_OFF/AndIn1'||p.path==='//Network1/FBK_OFF/AndIn2')p.channelInterface='Deactivated';})};
for(const [k,P] of Object.entries(variants)){
 for(const pulse of [1,2,50]){const x=P.run();x.green(550);const off=x.until(s=>!s.out_HV_C2,25000,'C2 OFF');x.hold.in_HV_C2_FBK=true;x.step({},5);
  x.step({in_LV_Faulty_FBK:true},pulse);x.step({in_LV_Faulty_FBK:false},3);x.hold.in_HV_C2_FBK=false;x.wait(5000);
  const r=x.first(s=>stIs(s,'RND'),off-1);out.push(`${k} D-08 LV pulse ${pulse} returned before C2_FBK OFF: RND@${r===undefined?'none':r-off} final=${x.status()} viol=${x.viol.count}`);}
 // E-05 FBK-on-during-press subcase
 {const x=P.rnd();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});let t0=x.t;while(x.t-t0<15000)x.step();x.wait(500);
  x.step({in_Reset_PB:true},200);x.hold.in_LV_C1_FBK=true;x.step({},300);x.step({in_Reset_PB:false},5);const t=x.t;x.wait(1000);
  out.push(`${k} Emergency: C1_FBK ON while green held, released with FBK ON -> left EMG: ${!!x.log.slice(-1000).find(s=>!(s.st.length===1&&s.st[0]==='EMG'))}`);}
 {const x=P.rnd();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});let t0=x.t;while(x.t-t0<15000)x.step();x.hold.in_LV_C1_FBK=true;x.wait(500);
  x.restart();x.wait(1000);out.push(`${k} Emergency: C1_FBK ON whole press -> left EMG: ${!!x.log.slice(-1000).find(s=>!(s.st.length===1&&s.st[0]==='EMG'))}`);}
}
console.log(out.join('\n'));fs.writeFileSync(new URL('./probe2.out.txt',import.meta.url),out.join('\n')+'\n');
