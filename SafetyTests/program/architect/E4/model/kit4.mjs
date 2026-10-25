// E4 extensions over the E3 kit: decouple blocks, block/variable deletion.
export function ext(m,k){
 const mkDec=(net,name,ins,{order,outVars=[]}={})=>{const N=m.networks.find(n=>n.name===net);const path=`//${net}/${name}`;
  const b={type:'safeDecouple',name,instanceName:name,functionName:'safeDecouple',orderOfExecution:order,path,
   inputs:[...Array(8)].map((_,i)=>({name:'DecIn'+(i+1),channelInterface:'Activated',deactivate1:'Break Contact (NC)',sources:[],globals:[],targets:[],path:path+'/DecIn'+(i+1)})),
   outputs:[...Array(8)].map((_,i)=>({name:'DecOut'+(i+1),sources:[],globals:[],targets:[],path:path+'/DecOut'+(i+1)})),parameters:[]};
  N.blocks.push(b);ins.forEach((s,i)=>s!=null&&k.bind(b.inputs[i].path,s));outVars.forEach((v,i)=>v&&k.vr(v).sourcePorts.push(b.outputs[i].path));return b;};
 const del=p=>{const b=k.B(p);for(const i of b.inputs)k.clear(i.path);
  for(const o of b.outputs){for(const t of o.targets){const tp=k.port(t);tp.sources=tp.sources.filter(s=>s!==o.path);}o.targets=[];}
  for(const v of m.variables)v.sourcePorts=v.sourcePorts.filter(s=>!s.startsWith(p+'/'));
  for(const n of m.networks)n.blocks=n.blocks.filter(x=>x.path!==p);};
 const delVar=n=>{const v=m.variables.find(v=>v.name===n);if(v&&(v.targetPorts.length||v.sourcePorts.length))throw Error('var still used '+n+' '+v.targetPorts);m.variables=m.variables.filter(v=>v.name!==n);};
 const outVar=(pp,n)=>k.vr(n).sourcePorts.push(pp);
 return {mkDec,del,delVar,outVar};
}
