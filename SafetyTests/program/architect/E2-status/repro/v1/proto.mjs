import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno';
const NC='Break Contact (NC)',NO='Make Contact (NO)';
export function build({e2a=true,e2b=true,e2c=true,e2d=true,mut=[]}={}){
 const m=parseSalFile(root+'/TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVLs/GVL1.sgvl'});
 const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
 const blk=p=>{const b=B.get('//'+p);if(!b)throw Error('no '+p);return b;};
 const inp=(p,n)=>{const x=blk(p).inputs.find(q=>q.name===n);if(!x)throw Error('no port '+p+'/'+n);return x;};
 const out=(p)=>blk(p).outputs[0];
 const allOuts=()=>[...B.values()].flatMap(b=>b.outputs);
 const unwire=(port)=>{for(const s of port.sources){const o=allOuts().find(q=>q.path===s);if(o)o.targets=o.targets.filter(t=>t!==port.path);}port.sources=[];port.globals=[];};
 const setG=(p,n,name,contact=NC)=>{const x=inp(p,n);unwire(x);x.globals=[{resolvedName:name}];x.channelInterface='Activated';x.deactivate1=contact;};
 const setW=(p,n,src,contact=NC)=>{const x=inp(p,n);unwire(x);const o=out(src);x.sources=[o.path];o.targets.push(x.path);x.channelInterface='Activated';x.deactivate1=contact;};
 const deact=(p,n)=>{const x=inp(p,n);unwire(x);x.channelInterface='Deactivated';};
 const outG=(p,name)=>{out(p).globals.push({resolvedName:name});};
 const kindOut={safeTon:'TonOut',safeRs:'RsOut',safeOr:'OrOut',safeAnd:'AndOut'};
 const newBlk=(net,name,fn,ins,timing)=>{const path=`//${net}/${name}`;const b={type:'x',name,functionName:fn,orderOfExecution:0,path,inputs:[],outputs:[{name:kindOut[fn],path:path+'/'+kindOut[fn],targets:[],sources:[],globals:[]}],parameters:timing?[{timing:String(timing)}]:[]};
   m.networks.find(x=>x.name===net).blocks.push(b);B.set(path,b);
   for(const [n,kind,src,contact] of ins){const port={name:n,path:path+'/'+n,sources:[],targets:[],globals:[],channelInterface:'Activated',deactivate1:contact||NC};b.inputs.push(port);
     if(kind==='g')port.globals=[{resolvedName:src}];else{const o=out(src);port.sources=[o.path];o.targets.push(port.path);}}
   return b;};
 const M=new Set(mut);
 if(e2a){
  setG('Network3/FBOr1','OrIn3','b_Step12_Set'); deact('Network3/FBOr1','OrIn4');
  setG('Network3/FBOr5','OrIn2','b_Step4_Set');
  setG('Network3/FBOr7','OrIn2','b_Step5_Set');
  setG('Network3/FBOr9','OrIn2','b_Step6_Set');
  { const x=inp('Network3/FBRs6','Reset'); unwire(x); const o=out('Network3/FBOr2'); x.sources=[o.path]; o.targets.push(x.path); x.deactivate1=NC; }
  blk('Network3/FBOr11').dead=true;
  setG('Network3/FBRs8','Set','b_Step12_Set');
  setG('Network3/FBOr16','OrIn1','b_Step_RnD_Set');
  { const x=inp('Network3/FBRs7','Set'); unwire(x); const o=out('Network3/FBOr16'); o.targets=o.targets.filter(t=>!t.includes('FBRs8')); x.sources=[o.path]; o.targets.push(x.path);}
  deact('Network3/FBOr13','OrIn2');
  if(!M.has('g6-noStep4mask'))setG('Network6/FBAnd18','AndIn3','b_Step4_Set',NO);
  setW('Network6/FBAnd18','AndIn4','Network6/FBAnd1');
  if(!M.has('owner-noG6reset'))setG('Network6/RUN_DOWN_RESET','OrIn1','b_Step12_Set_2'); else deact('Network6/RUN_DOWN_RESET','OrIn1');
  setG('Network7/FBAnd8','AndIn5','b_Step4');
  setG('SafeResumption/SG_OWNER_SET','AndIn3','recRndC_SU',NO);
  setG('RndPhysicalCompact/GATE_020','AndIn6','recRndC_SG',NO);
  newBlk('Network6','HEALTHY_OK','safeAnd',[['AndIn1','g','in_LV_Healthy_FBK',NO],['AndIn2','g','in_HV_Healthy_FBK',NO]]);
  newBlk('Network6','HEALTH_GUARD','safeOr',[['OrIn1','w','Network6/RUN_DOWN_OWNER'],['OrIn2','w','Network6/HEALTHY_OK']]);
  if(M.has('guard-noOwner'))deact('Network6/HEALTH_GUARD','OrIn1');
  setW('Network6/FBAnd9','AndIn6','Network6/HEALTH_GUARD'); deact('Network6/FBAnd9','AndIn7');
  newBlk('Network3','DEC_SAFE_OR','safeOr',[['OrIn1','w','Network3/FBRs1'],['OrIn2','w','Network3/FBRs8']]);
  newBlk('Network3','DEC_SAFE','safeAnd',[['AndIn1','w','Network3/DEC_SAFE_OR'],['AndIn2','g','b_EStop_Ok']]); outG('Network3/DEC_SAFE','STS_SAFE');
  newBlk('Network3','DEC_RND','safeAnd',[['AndIn1','w','Network3/FBRs7'],['AndIn2','g','b_EStop_Ok']]); outG('Network3/DEC_RND','STS_RND');
  newBlk('Network3','DEC_RUN','safeAnd',[['AndIn1','w','Network3/FBRs3'],['AndIn2','g','b_EStop_Ok']]); outG('Network3/DEC_RUN','STS_RUN');
  newBlk('Network3','DEC_EMG','safeAnd',[['AndIn1','w','Network3/DEC_SAFE',NO],['AndIn2','w','Network3/DEC_RND',NO],['AndIn3','w','Network3/DEC_RUN',NO]]); outG('Network3/DEC_EMG','STS_EMG');
 }
 if(e2b){
  outG('Network12/FBAnd16','linkCoverClosed');
  newBlk('Network1','FBOrIlRunOk','safeOr',[['OrIn1','g','b_Step3',NO],['OrIn2','g','linkCoverClosed']]);
  setW('Network1/FBAnd1','AndIn3','Network1/FBOrIlRunOk');
 }
 if(e2c){
  if(!M.has('nopol'))inp('Network11/FBAnd4','AndIn3').deactivate1=NO;
  newBlk('SafeResumption','HLT_LV','safeAnd',[['AndIn1','g','in_LV_Healthy_FBK'],['AndIn2','g','recRndC_SU',NO],['AndIn3','g','in_False_SI2_CH8',NO]]); outG('SafeResumption/HLT_LV','linkHltLvLost');
  newBlk('RndPhysicalCompact','GATE_SG_SET','safeOr',[['OrIn1','g','linkSafeSgOwnerSet'],['OrIn2','g','linkHltLvLost']]);
  setW('RndPhysicalCompact/STATE_SG','Set','RndPhysicalCompact/GATE_SG_SET');
 }
 if(e2d){
  newBlk('SafeResumption','IL_SCOPE','safeOr',[['OrIn1','g','b_Step1'],['OrIn2','g','linkCoverClosed']]); outG('SafeResumption/IL_SCOPE','linkIlScope');
  setG('RndPhysicalCompact/GATE_001','AndIn5','linkIlScope'); deact('RndPhysicalCompact/GATE_001','AndIn6');
  deact('Network1/FBAndLvCurrentPermit','AndIn4'); deact('Network1/FBAndLvCurrentPermit','AndIn5');
  deact('Network2/FBAnd1','AndIn5'); deact('Network2/FBAnd1','AndIn6');
  setG('Network1/FBAnd4','AndIn3','in_InterLock_NC_1'); setG('Network1/FBAnd4','AndIn4','in_InterLock_NC_2');
  setG('RndPhysicalCompact/GATE_010','AndIn3','in_InterLock_NC_1'); setG('RndPhysicalCompact/GATE_010','AndIn4','in_InterLock_NC_2');
 }
 for(const n of m.networks)n.blocks=n.blocks.filter(b=>!b.dead);
 let seq=m.networks.flatMap(n=>n.blocks).filter(b=>b.orderOfExecution>0).sort((a,b)=>a.orderOfExecution-b.orderOfExecution).map(b=>b.path.slice(2));
 const moveBefore=(x,y)=>{seq=seq.filter(s=>s!==x);seq.splice(seq.indexOf(y),0,x);};
 const moveAfter=(x,y)=>{seq=seq.filter(s=>s!==x);seq.splice(seq.indexOf(y)+1,0,x);};
 const ins=(xs,before)=>{seq.splice(seq.indexOf(before),0,...xs);};
 if(e2a){
  const head=['Network3/FBOr6','Network3/FBOr2','Network3/FBOr1','Network3/FBOr16','Network3/FBOr13','Network3/FBOr5','Network3/FBOr7','Network3/FBOr9','Network3/FBRs1','Network3/FBRs8','Network3/FBRs7','Network3/FBRs3','Network3/FBRs4','Network3/FBRs5','Network3/FBRs6'];
  if(!M.has('nohead'))seq=[...head,...seq.filter(s=>!head.includes(s))];
  seq.splice(seq.indexOf('Network1/FBEstop1')+1,0,'Network3/DEC_SAFE_OR','Network3/DEC_SAFE','Network3/DEC_RND','Network3/DEC_RUN','Network3/DEC_EMG');
  moveAfter('Network12/FBAnd15','Network12/FBDecouple1');
  moveBefore('Network3/FBAnd2','Network3/FBAnd1');
  moveBefore('Network2/FBAnd11','Network2/FBAnd91');
  moveAfter('SafeResumption/SG_OWNER_SET','RndPhysicalCompact/STATE_SU');
  moveAfter('RndPhysicalCompact/STATE_SG','SafeResumption/SG_OWNER_SET');
  ins(['Network6/HEALTHY_OK','Network6/HEALTH_GUARD'],'Network6/FBAnd9');
 }
 if(e2b){ moveBefore('Network12/FBAnd16','Network1/FBAnd1'); ins(['Network1/FBOrIlRunOk'],'Network1/FBAnd1'); }
 if(e2c){ ins(['SafeResumption/HLT_LV','RndPhysicalCompact/GATE_SG_SET'],'RndPhysicalCompact/STATE_SG'); }
 if(e2d){ ins(['SafeResumption/IL_SCOPE'],'RndPhysicalCompact/GATE_001'); }
 seq.forEach((p,i)=>{blk(p).orderOfExecution=i+1;});
 const missing=[...B.values()].filter(b=>!b.dead&&!seq.includes(b.path.slice(2)));if(missing.length)throw Error('unordered '+missing.map(b=>b.path));
 return {m,seq,count:seq.length};
}
