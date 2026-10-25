// Generates PLAN.json delta (canonical E3 -> E4 scratch model) from the model itself.
import fs from 'node:fs';import crypto from 'node:crypto';
import {load,kit} from './kit.mjs';import {apply} from './e4.mjs';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno';
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const a=load(),b=load();apply(b,kit(b));
const blocks=m=>new Map(m.networks.flatMap(n=>n.blocks).map(x=>[x.path,x]));
const vt=m=>{const t=new Map();for(const v of m.variables)for(const p of v.targetPorts)t.set(p,v.name);return t;};
const A=blocks(a),B=blocks(b),VA=vt(a),VB=vt(b);
const spec=(p,V)=>{if(p.channelInterface==='Deactivated'||p.channelInterface==='Both Deactivated')return 'Deactivated';
 const inv=p.deactivate1==='Make Contact (NO)'?'!':'';const s=[...p.sources.map(x=>'W:'+x),...p.globals.map(g=>'G:'+g.resolvedName),...(V.get(p.path)?['V:'+V.get(p.path)]:[])];
 return s.length?inv+s.join('|'):(p.name.startsWith('DecIn')?'-':'unbound');};
const outs=(x,m)=>{const r={};for(const o of x.outputs){const v=m.variables.filter(v=>v.sourcePorts.includes(o.path)).map(v=>v.name);if(v.length)r[o.name]='V:'+v.join(',');}return r;};
const ordered=[...B.values()].sort((x,y)=>x.orderOfExecution-y.orderOfExecution);
const add=ordered.filter(x=>!A.has(x.path)).map(x=>{const ins={};for(const p of x.inputs){const s=spec(p,VB);if(s!=='-')ins[p.name]=s;}
 const t=x.parameters?.[0]?.timing;const prevExisting=ordered.slice(0,ordered.indexOf(x)).reverse().find(y=>A.has(y.path));
 return {path:x.path,fn:x.functionName,...(t!=null?{timing_s:Number(t)}:{}),in:ins,out:outs(x,b),insertAfterCanonical:prevExisting?.path??'(first)'};});
const del=[...A.keys()].filter(p=>!B.has(p));
const changes=[];for(const [p,x] of B)if(A.has(p))for(const port of x.inputs){const q=A.get(p).inputs.find(i=>i.name===port.name);
 const s0=spec(q,VA),s1=spec(port,VB);if(s0!==s1||q.channelInterface!==port.channelInterface)changes.push({port:port.path,before:s0,after:s1,...(q.channelInterface!==port.channelInterface?{channelInterface:[q.channelInterface,port.channelInterface]}:{})});}
for(const [p,x] of B)if(A.has(p))for(const o of x.outputs){const v0=outs(A.get(p),a)[o.name],v1=outs(x,b)[o.name];if(v0!==v1)changes.push({port:o.path,before:v0??'none',after:v1});}
const names=m=>new Set(m.variables.map(v=>v.name));const NA=names(a),NB=names(b);
const ports=m=>m.networks.flatMap(n=>n.blocks).reduce((s,x)=>s+x.inputs.length+x.outputs.length,0);
const j={slice:'E4 (S4) PLC interface v1.4, Config, heartbeat, legacy removal',author:'v2-architect',date:'2026-10-24',
 source:{sal:'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',salSha256:sha(root+'/TwinSafeGroup1/TwinSafeGroup1.sal'),sgvl:'MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',sgvlSha256:sha(root+'/GVLs/GVL1.sgvl'),fb:A.size},
 target:{dir:'candidates/E4/native',fb:B.size,limit:512,variables:[NA.size,NB.size],modelPorts:[ports(a),ports(b)]},
 orderRule:'new blocks placed by insertAfterCanonical in listed order; Network3 DEC_* last in the scan; renumber contiguous 1..N',
 addBlocks:add,deleteBlocks:del,changes,
 addVariables:[...NB].filter(n=>!NA.has(n)),removeVariables:[...NA].filter(n=>!NB.has(n))};
fs.writeFileSync(process.argv[2],JSON.stringify(j,null,1));console.log('add',add.length,'del',del.length,'changes',changes.length,'vars',NA.size,'->',NB.size,'ports',ports(a),'->',ports(b));
