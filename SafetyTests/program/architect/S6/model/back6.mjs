// Backward (previous-scan) reads: reader.order < writer.order via wire / symbol / global. Classify by forward reach to
// STO_DR1/2, out_LV_C1, out_HV_C2, out_EStop_Ok_Plc (Emergency). usage: node back6.mjs  -> canonical vs F1 vs S6 scratch
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
import {load,kit} from './kit6.mjs';import {apply} from './s6.mjs';
const f1='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/fixtures/stand-f1-04b45456';
const F1=parseSalFile(f1+'/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:f1+'/GVL1.sgvl'});
const C=load();const S=load();apply(S,kit(S));
const TGT=['STO_DR1','STO_DR2','out_LV_C1','out_HV_C2','out_EStop_Ok_Plc'];
function edges(m){const blk=new Map();for(const n of m.networks)for(const b of n.blocks){for(const p of [...b.inputs,...b.outputs])blk.set(p.path,b);}
 const E=[];const vw=new Map(),gw=new Map();
 for(const v of m.variables)for(const s of v.sourcePorts)vw.set(v.name,s);
 for(const b of blk.values())for(const o of b.outputs)for(const g of o.globals)gw.set(g.resolvedName,o.path);
 for(const b of new Set(blk.values()))for(const p of b.inputs){if(p.channelInterface==='Deactivated')continue;
  for(const s of p.sources)E.push([s,p.path,'wire']);for(const g of p.globals)if(gw.has(g.resolvedName))E.push([gw.get(g.resolvedName),p.path,'G:'+g.resolvedName]);}
 for(const v of m.variables)if(vw.has(v.name))for(const t of v.targetPorts)E.push([vw.get(v.name),t,'V:'+v.name]);
 const bb=p=>blk.get(p);const succ=new Map();for(const [s,t] of E){const a=bb(s).path;(succ.get(a)??succ.set(a,new Set()).get(a)).add(bb(t).path);}
 const tgtBlocks=new Set(TGT.map(n=>vw.get(n)).filter(Boolean).map(p=>bb(p).path));
 const reach=a=>{const seen=new Set([a]),st=[a];while(st.length){const x=st.pop();if(tgtBlocks.has(x))return [...tgtBlocks].filter(t=>seen.has(t)).length>0;for(const y of succ.get(x)??[])if(!seen.has(y)){seen.add(y);st.push(y);}}return false;};
 const tgtName=new Map(TGT.map(n=>[vw.get(n)&&bb(vw.get(n)).path,n]));
 const reachList=a=>{const seen=new Set([a]),st=[a];while(st.length){const x=st.pop();for(const y of succ.get(x)??[])if(!seen.has(y)){seen.add(y);st.push(y);}}return TGT.filter(n=>vw.get(n)&&seen.has(bb(vw.get(n)).path));};
 return E.filter(([s,t])=>bb(t).orderOfExecution<bb(s).orderOfExecution).map(([s,t,via])=>({key:s.split('/').slice(-2).join('.')+'->'+t.split('/').slice(-2).join('.'),via,reach:reachList(bb(t).path)}));}
const ef=edges(F1),ec=edges(C),es=edges(S);const kf=new Set(ef.map(e=>e.key)),kc=new Set(ec.map(e=>e.key));
console.log('backward reads: F1',ef.length,'canonical',ec.length,'S6',es.length);
console.log('S6-new vs canonical:',es.filter(e=>!kc.has(e.key)).map(e=>e.key).join(' ')||'none');
console.log('canonical-new vs F1 on safety paths:');for(const e of ec.filter(e=>!kf.has(e.key)&&e.reach.length))console.log(' ',e.key,e.via,'->',e.reach.join(','));
console.log('canonical-new vs F1 off safety paths:',ec.filter(e=>!kf.has(e.key)&&!e.reach.length).map(e=>e.key+'('+e.via+')').join(' '));
