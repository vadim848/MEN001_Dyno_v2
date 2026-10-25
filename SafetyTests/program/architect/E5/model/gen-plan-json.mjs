import fs from 'node:fs';import {load,kit} from './kit5.mjs';import {apply} from './e5.mjs';
const desc=m=>{const vt=new Map(),vs=new Map();for(const v of m.variables){for(const t of v.targetPorts)vt.set(t,'V:'+v.name);for(const s of v.sourcePorts)vs.set(s,[...(vs.get(s)||[]),'V:'+v.name]);}
 const out={};for(const n of m.networks)for(const b of n.blocks){out[b.path]={fn:b.functionName||b.type,order:b.orderOfExecution,timing:b.parameters?.[0]?.timing,
  in:Object.fromEntries(b.inputs.filter(p=>p.channelInterface!=='Deactivated').map(p=>[p.name,(p.deactivate1==='Make Contact (NO)'?'!':'')+([...p.sources.map(s=>'W:'+s),...p.globals.map(g=>'G:'+g.resolvedName),vt.get(p.path)].filter(Boolean).join('|')||'?')])),
  out:Object.fromEntries(b.outputs.map(p=>[p.name,[...p.globals.map(g=>'G:'+g.resolvedName),...(vs.get(p.path)||[])]]).filter(([,v])=>v.length))};}return {blocks:out,vars:new Set(m.variables.map(v=>v.name))};};
const a=desc(load());const m=load();apply(m,kit(m));const b=desc(m);
const added={},changed={};for(const [p,d] of Object.entries(b.blocks)){if(!a.blocks[p])added[p]=d;else{const o=a.blocks[p];const ci={};for(const k of new Set([...Object.keys(o.in),...Object.keys(d.in)]))if(o.in[k]!==d.in[k])ci[k]={from:o.in[k]??'(deactivated)',to:d.in[k]??'(deactivated)'};
 const co=JSON.stringify(o.out)!==JSON.stringify(d.out)?{from:o.out,to:d.out}:undefined;if(Object.keys(ci).length||co)changed[p]={inputs:ci,outputs:co};}}
const J={stage:'E5/E6 (S5)',base:{sal:'candidates/E4/native/TwinSafeGroup1.sal',sha256:'4ee8d3d96da1a1b91860131fc4c1b52a017aced44408f07532e960d565307a8f',sgvlSha256:'98a0d10f4dfe9a9898c1acd5f8c5c89ac526e93e3b781bdb44f5f1c6141a9b4c',fb:Object.keys(a.blocks).length},
 fbAfter:Object.keys(b.blocks).length,deleted:[],newVariables:[...b.vars].filter(v=>!a.vars.has(v)),removedVariables:[...a.vars].filter(v=>!b.vars.has(v)),
 orderNote:'fractional orders = insertion points; editor renumbers contiguously 1..N keeping relative order',added,changed};
fs.writeFileSync('../PLAN.json',JSON.stringify(J,null,1));console.log('added',Object.keys(added).length,'changed',Object.keys(changed).length,'vars',J.newVariables.join(','),'fb',J.base.fb,'->',J.fbAfter);
