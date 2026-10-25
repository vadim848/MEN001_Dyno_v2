// In-memory edit kit over the parsed canonical model (scratch; architect E3).
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno';
export function load(){return parseSalFile(root+'/TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVLs/GVL1.sgvl'});}
export function kit(m){
 const bl=()=>m.networks.flatMap(n=>n.blocks);const B=p=>{const b=bl().find(b=>b.path===p);if(!b)throw Error('no block '+p);return b;};
 const port=pp=>{for(const b of bl())for(const p of [...b.inputs,...b.outputs])if(p.path===pp)return p;throw Error('no port '+pp);};
 const vr=n=>{let v=m.variables.find(v=>v.name===n);if(!v){v={name:n,id:n,alias:null,sourcePorts:[],targetPorts:[],groupPorts:[]};m.variables.push(v);}return v;};
 const clear=pp=>{const p=port(pp);for(const s of p.sources)port(s).targets=port(s).targets.filter(t=>t!==pp);p.sources=[];p.globals=[];for(const v of m.variables)v.targetPorts=v.targetPorts.filter(t=>t!==pp);};
 // spec: 'W://Net/Blk/Out' | 'V:var' | 'G:global' ; prefix '!' = inverted contact
 const bind=(pp,spec)=>{const p=port(pp);clear(pp);let inv=false;if(spec.startsWith('!')){inv=true;spec=spec.slice(1);}
  p.channelInterface='Activated';p.deactivate1=inv?'Make Contact (NO)':'Break Contact (NC)';
  const [k,...r]=spec.split(':');const n=r.join(':');
  if(k==='W'){p.sources=[n];port(n).targets.push(pp);}else if(k==='V')vr(n).targetPorts.push(pp);else if(k==='G')p.globals=[{resolvedName:n}];else throw Error(spec);};
 const mk=(net,name,fn,ins,{order,timing,outVar,outGlobal}={})=>{const N=m.networks.find(n=>n.name===net);const path=`//${net}/${name}`;
  const pn={safeAnd:'AndIn',safeOr:'OrIn'}[fn];const inNames=fn==='safeRs'?['Reset','Set']:fn==='safeTon'?['TonIn']:ins.map((_,i)=>pn+(i+1));
  const outName={safeAnd:'AndOut',safeOr:'OrOut',safeRs:'RsOut',safeTon:'TonOut'}[fn];
  const b={type:fn,name,instanceName:name,functionName:fn,orderOfExecution:order,path,inputs:inNames.map(n=>({name:n,channelInterface:'Activated',deactivate1:'Break Contact (NC)',sources:[],globals:[],targets:[],path:path+'/'+n})),
   outputs:[{name:outName,sources:[],globals:outGlobal?[{resolvedName:outGlobal}]:[],targets:[],path:path+'/'+outName}],parameters:timing!=null?[{timing:String(timing)}]:[]};
  N.blocks.push(b);ins.forEach((s,i)=>s!=null&&bind(b.inputs[i].path,s));if(outVar)vr(outVar).sourcePorts.push(b.outputs[0].path);return b.outputs[0].path;};
 const addIn=(blk,name,spec)=>{const b=B(blk);let p=b.inputs.find(i=>i.name===name);if(!p)throw Error('no input '+name+' on '+blk);bind(p.path,spec);};
 const off=pp=>{clear(pp);port(pp).channelInterface='Deactivated';};
 const order=(blk,o)=>{B(blk).orderOfExecution=o;};
 return {B,port,bind,mk,addIn,off,order,clear,vr};
}
