import {cand} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
const NC='Break Contact (NC)',NO='Make Contact (NO)';
export function fix(m,{noR=false,noS=false}={}){
 const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));const out=p=>B.get('//'+p).outputs[0];
 const net=n=>m.networks.find(x=>x.name===n);
 const nb=(netn,name,ins)=>{const path=`//${netn}/${name}`;const b={type:'x',name,functionName:'safeAnd',orderOfExecution:0,path,inputs:[],outputs:[{name:'AndOut',path:path+'/AndOut',targets:[],sources:[],globals:[]}],parameters:[]};
  for(const [n,kind,src,c] of ins){const p={name:n,path:path+'/'+n,sources:[],targets:[],globals:[],channelInterface:'Activated',deactivate1:c||NC};if(kind==='g')p.globals=[{resolvedName:src}];else{const o=out(src);p.sources=[o.path];o.targets.push(p.path);}b.inputs.push(p);}
  net(netn).blocks.push(b);B.set(path,b);return b;};
 out('SafeResumption/CONNECTORS').globals.push({resolvedName:'linkConnectorsOk'});
 const R=nb('RndPhysicalCompact','GATE_SPOIL_R',[['AndIn1','w','RndPhysicalCompact/GATE_003'],['AndIn2','g','b_Step_RnD'],['AndIn3','g','linkCoverClosed',NO]]);
 const S=nb('RndPhysicalCompact','GATE_SPOIL_S',[['AndIn1','w','RndPhysicalCompact/GATE_003'],['AndIn2','g','b_Step1'],['AndIn3','g','linkConnectorsOk',NO]]);
 const g29=B.get('//RndPhysicalCompact/GATE_029');
 const wire=(port,src)=>{const p=g29.inputs.find(q=>q.name===port);p.channelInterface='Activated';p.deactivate1=NC;p.globals=[];p.sources=[out(src).path];out(src).targets.push(p.path);};
 if(!noR)wire('OrIn6','RndPhysicalCompact/GATE_SPOIL_R'); if(!noS)wire('OrIn7','RndPhysicalCompact/GATE_SPOIL_S');
 const all=m.networks.flatMap(n=>n.blocks).filter(b=>b.orderOfExecution>0).sort((a,b)=>a.orderOfExecution-b.orderOfExecution);
 const i=all.indexOf(g29);all.splice(i,0,R,S);all.forEach((b,k)=>b.orderOfExecution=k+1);
}
export const mk=(c,v)=>cand(c,v?m=>fix(m,v):null);
