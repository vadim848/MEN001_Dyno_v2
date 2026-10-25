// E2-status v2 prototype: in-memory model of R1 (simulated by removal/deactivation) + E2a..E2d
// applied to canonical F1. Canonical files are only read. Model run, not native validation.
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno';
const NC='Break Contact (NC)',NO='Make Contact (NO)';
export function build({r1=true,e2a=true,e2b=true,e2c=true,e2d=true,e2e=true,mut=[]}={}){
 const m=parseSalFile(root+'/TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVLs/GVL1.sgvl'});
 const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
 const blk=p=>{const b=B.get('//'+p);if(!b)throw Error('no '+p);return b;};
 const inp=(p,n)=>{const x=blk(p).inputs.find(q=>q.name===n);if(!x)throw Error('no port '+p+'/'+n);return x;};
 const out=(p)=>blk(p).outputs[0];
 const allOuts=()=>[...B.values()].flatMap(b=>b.outputs);
 const allIn=()=>[...B.values()].flatMap(b=>b.inputs);
 const unwire=(port)=>{for(const s of port.sources){const o=allOuts().find(q=>q.path===s);if(o)o.targets=o.targets.filter(t=>t!==port.path);}port.sources=[];port.globals=[];};
 const setG=(p,n,name,contact=NC)=>{const x=inp(p,n);unwire(x);x.globals=[{resolvedName:name}];x.channelInterface='Activated';x.deactivate1=contact;};
 const setW=(p,n,src,contact=NC)=>{const x=inp(p,n);unwire(x);const o=out(src);x.sources=[o.path];o.targets.push(x.path);x.channelInterface='Activated';x.deactivate1=contact;};
 const deact=(p,n)=>{const x=inp(p,n);unwire(x);x.channelInterface='Deactivated';};
 const outG=(p,name)=>{out(p).globals.push({resolvedName:name});};
 const kill=p=>{blk(p).dead=true;};
 const kindOut={safeTon:'TonOut',safeRs:'RsOut',safeOr:'OrOut',safeAnd:'AndOut'};
 const newBlk=(net,name,fn,ins)=>{const path=`//${net}/${name}`;const b={type:'x',name,functionName:fn,orderOfExecution:0,path,inputs:[],outputs:[{name:kindOut[fn],path:path+'/'+kindOut[fn],targets:[],sources:[],globals:[]}],parameters:[]};
   m.networks.find(x=>x.name===net).blocks.push(b);B.set(path,b);
   for(const [n,kind,src,contact] of ins){const port={name:n,path:path+'/'+n,sources:[],targets:[],globals:[],channelInterface:'Activated',deactivate1:contact||NC};b.inputs.push(port);
     if(kind==='g')port.globals=[{resolvedName:src}];else{const o=out(src);port.sources=[o.path];o.targets.push(port.path);}}
   return b;};
 if(r1){
  for(const b of m.networks.find(n=>n.name==='Network5').blocks)b.dead=true;
  ['Network3/FBRs2','Network3/FBOr3','Network3/FBOr4','Network4/FBDecouple1','Network9/FBAnd1','Network12/FBAnd12','Network12/FBAnd13','Network12/FBAnd14','Network1/FBAnd3','Network1/FBAnd9','Network1/FBAnd11','Network6/FBAnd10'].forEach(kill);
  setG('Network3/FBDecouple2','DecIn2','in_False_SI2_CH8');
  { const o=out('Network1/FBAnd2'); const x=inp('Network1/FBOr12','OrIn2'); unwire(x); x.sources=[o.path]; o.targets.push(x.path); }
  setG('Network6/FBAnd9','AndIn1','out_EStop_Status');
  for(const [p,n] of [['Network3/FBOr1','OrIn1'],['Network3/FBOr1','OrIn2'],['Network3/FBOr2','OrIn1'],['Network3/FBOr2','OrIn3'],['Network3/FBOr2','OrIn4'],['Network3/FBOr5','OrIn1'],['Network3/FBOr6','OrIn1'],['Network3/FBOr7','OrIn1'],['Network3/FBOr9','OrIn1'],['Network3/FBOr11','OrIn1'],['Network3/FBAnd1','AndIn3'],['Network1/FBOr1','OrIn1'],['Network1/FBOr5','OrIn1'],['Network1/FBOr8','OrIn1'],['Network1/FBOr10','OrIn1'],['Network1/FBOr14','OrIn1'],['Network1/FBOr17','OrIn1'],['Network1/FBOr18','OrIn1'],['Network12/FBOr2','OrIn2']])deact(p,n);
 }
 if(e2a){
  setG('Network3/FBOr1','OrIn3','b_Step12_Set'); deact('Network3/FBOr1','OrIn4');
  setG('Network3/FBOr5','OrIn2','b_Step4_Set');
  setG('Network3/FBOr7','OrIn2','b_Step5_Set');
  setG('Network3/FBOr9','OrIn2','b_Step6_Set');
  { const x=inp('Network3/FBRs6','Reset'); unwire(x); const o=out('Network3/FBOr2'); x.sources=[o.path]; o.targets.push(x.path); x.deactivate1=NC; }
  kill('Network3/FBOr11');
  setG('Network3/FBRs8','Set','b_Step12_Set');
  setG('Network3/FBOr16','OrIn1','b_Step_RnD_Set');
  { const x=inp('Network3/FBRs7','Set'); unwire(x); const o=out('Network3/FBOr16'); o.targets=o.targets.filter(t=>!t.includes('FBRs8')); x.sources=[o.path]; o.targets.push(x.path);}
  kill('Network3/FBOr6'); setG('Network3/FBRs3','Set','b_Step3_Set_2'); deact('Network3/FBOr13','OrIn2');
  setG('Network3/FBOr13','OrIn2','b_Step4_Set'); // g7 arbitration by reset dominance (replaces v1 FBAnd18.AndIn3)
  setW('Network6/FBAnd18','AndIn4','Network6/FBAnd1');
  setG('Network6/RUN_DOWN_RESET','OrIn1','b_Step12_Set_2');
  setG('Network7/FBAnd8','AndIn5','b_Step4');
  inp('Network11/FBAnd4','AndIn3').deactivate1=NO; // D-ARCH-POL
  // E2a-RC: TON counts 0.1 s of (cmd and C2_FBK and HV ok)
  setW('Network12/FBAnd6','AndIn1','Network12/FBAnd4');
  setW('Network12/FBTon3','TonIn','Network12/FBAnd6');
  { const a6=out('Network12/FBAnd6'); const t3=out('Network12/FBTon3'); for(const tg of [...a6.targets]){ if(tg.includes('FBDecouple2')){ const x=allIn().find(q=>q.path===tg); x.sources=[t3.path]; t3.targets.push(tg);} } a6.targets=a6.targets.filter(tg=>!tg.includes('FBDecouple2')); t3.globals=a6.globals; a6.globals=[]; }
  newBlk('Network6','HEALTHY_OK','safeAnd',[['AndIn1','g','in_LV_Healthy_FBK',NO],['AndIn2','g','in_HV_Healthy_FBK',NO]]);
  newBlk('Network6','HEALTH_GUARD','safeOr',[['OrIn1','w','Network6/RUN_DOWN_OWNER'],['OrIn2','w','Network6/HEALTHY_OK']]);
  setW('Network6/FBAnd9','AndIn6','Network6/HEALTH_GUARD'); deact('Network6/FBAnd9','AndIn7');
  newBlk('Network3','DEC_SAFE_OR','safeOr',[['OrIn1','w','Network3/FBRs1'],['OrIn2','w','Network3/FBRs8']]);
  newBlk('Network3','DEC_SAFE','safeAnd',[['AndIn1','w','Network3/DEC_SAFE_OR'],['AndIn2','g','b_EStop_Ok']]);
  newBlk('Network3','DEC_RND','safeAnd',[['AndIn1','w','Network3/FBRs7'],['AndIn2','g','b_EStop_Ok']]);
  newBlk('Network3','DEC_RUN','safeAnd',[['AndIn1','w','Network3/FBRs3'],['AndIn2','g','b_EStop_Ok']]);
  newBlk('Network3','DEC_EMG','safeAnd',[['AndIn1','w','Network3/DEC_SAFE',NO],['AndIn2','w','Network3/DEC_RND',NO],['AndIn3','w','Network3/DEC_RUN',NO]]);
 }
 if(e2b){
  outG('Network12/FBAnd16','linkCoverClosed');
  outG('Network6/RUN_DOWN_OWNER','linkRunDownOwner');
  newBlk('Network1','FBAndNotRunSu','safeAnd',[['AndIn1','g','b_Step3',NO],['AndIn2','g','recRndC_SU',NO]]);
  newBlk('Network1','FBOrIlRunOk','safeOr',[['OrIn1','w','Network1/FBAndNotRunSu'],['OrIn2','g','linkCoverClosed'],['OrIn3','g','linkRunDownOwner']]);
  setW('Network1/FBAnd1','AndIn3','Network1/FBOrIlRunOk');
  setG('Network1/FBAnd1','AndIn4','linkSafeConnectorScope'); // EMG-004
  { const b=blk('Network6/HEALTHY_OK'); const port={name:'AndIn3',path:b.path+'/AndIn3',sources:[],targets:[],globals:[{resolvedName:'linkCoverClosed'}],channelInterface:'Activated',deactivate1:NC}; b.inputs.push(port); }
  deact('Network6/FBAnd9','AndIn2'); deact('Network6/FBAnd9','AndIn3');
  newBlk('Network6','STAGE_LVON','safeOr',[['OrIn1','g','b_Step12'],['OrIn2','g','b_Step_RnD']]);
  newBlk('Network6','FBAndLvEmg','safeAnd',[['AndIn1','w','Network6/STAGE_LVON'],['AndIn2','g','b_EStop_Ok',NO],['AndIn3','g','in_False_SI2_CH8',NO]]);
  newBlk('Network3','FBOrS12Reset','safeOr',[['OrIn1','g','b_Step_RnD_Set'],['OrIn2','g','b_Step4_Set']]);
  { const x=inp('Network3/FBRs8','Reset'); unwire(x); const o=out('Network3/FBOrS12Reset'); x.sources=[o.path]; o.targets.push(x.path); x.deactivate1=NC; }
  deact('RndPhysicalCompact/GATE_001','AndIn5'); deact('RndPhysicalCompact/GATE_001','AndIn6');
  setG('RndPhysicalCompact/GATE_020','AndIn6','linkCoverClosed');
  setW('RndPhysicalCompact/GATE_030','OrIn5','RndPhysicalCompact/BOTH');
  newBlk('Network6','FBOrStep4','safeOr',[['OrIn1','w','Network6/FBAnd2'],['OrIn2','w','Network6/FBAndLvEmg']]);
  setW('Network6/FBDecouple1','DecIn1','Network6/FBOrStep4');
  setG('Network3/FBOr1','OrIn4','b_Step4_Set');

 }
 if(e2c){
  newBlk('SafeResumption','HLT_LV','safeAnd',[['AndIn1','g','in_LV_Healthy_FBK'],['AndIn2','g','recRndC_SU',NO],['AndIn3','g','in_False_SI2_CH8',NO]]); outG('SafeResumption/HLT_LV','linkHltLvLost');
  newBlk('RndPhysicalCompact','GATE_SG_SET','safeOr',[['OrIn1','g','linkSafeSgOwnerSet'],['OrIn2','g','linkHltLvLost']]);
  setW('RndPhysicalCompact/STATE_SG','Set','RndPhysicalCompact/GATE_SG_SET');
  setG('RndPhysicalCompact/GATE_020','AndIn7','recRndC_SG',NO);
  setG('RndPhysicalCompact/GATE_030','OrIn6','linkHltLvLost');
 }
 if(e2d){
  deact('Network1/FBAndLvCurrentPermit','AndIn4'); deact('Network1/FBAndLvCurrentPermit','AndIn5');
  deact('Network2/FBAnd1','AndIn5'); deact('Network2/FBAnd1','AndIn6');
  setG('SafeResumption/MODE','OrIn4','b_Step12'); // Q-REL-AFTER-PERMIT: no permit dip in Safe->R&D
  setG('Network1/FBAnd4','AndIn3','in_InterLock_NC_1'); setG('Network1/FBAnd4','AndIn4','in_InterLock_NC_2');
  
 }
 if(e2e){
  newBlk('Network3','G10_EXIT','safeAnd',[['AndIn1','w','Network3/FBRs6'],['AndIn2','g','b_EStop_Ok'],['AndIn3','g','in_Reset_PB',NO],['AndIn4','g','recRndC_PrevG'],['AndIn5','g','in_LV_C1_FBK',NO],['AndIn6','g','in_HV_C2_FBK',NO],['AndIn7','g','out_LV_C1',NO],['AndIn8','g','out_HV_C2',NO]]);
  setW('Network3/FBOr2','OrIn3','Network3/G10_EXIT');
 }
 for(const mm of mut){ if(mm.op==='deactivate-input')deact(mm.block.slice(2),mm.port); else if(mm.op==='invert-contact'){const x=inp(mm.block.slice(2),mm.port);x.deactivate1=x.deactivate1===NO?NC:NO;} }
 for(const n of m.networks)n.blocks=n.blocks.filter(b=>!b.dead);
 let seq=m.networks.flatMap(n=>n.blocks).filter(b=>b.orderOfExecution>0).sort((a,b)=>a.orderOfExecution-b.orderOfExecution).map(b=>b.path.slice(2));
 const moveBefore=(x,y)=>{seq=seq.filter(s=>s!==x);seq.splice(seq.indexOf(y),0,x);};
 const moveAfter=(x,y)=>{seq=seq.filter(s=>s!==x);seq.splice(seq.indexOf(y)+1,0,x);};
 const ins=(xs,before)=>{seq.splice(seq.indexOf(before),0,...xs);};
 if(e2a){
  const head=['Network3/FBOr2','Network3/FBOr1','Network3/FBOr16','Network3/FBOr13','Network3/FBOr5','Network3/FBOr7','Network3/FBOr9','Network3/FBRs1','Network3/FBRs8','Network3/FBRs7','Network3/FBRs3','Network3/FBRs4','Network3/FBRs5','Network3/FBRs6'];
  seq=[...head,...seq.filter(s=>!head.includes(s))];
  seq.splice(seq.indexOf('Network1/FBEstop1')+1,0,'Network3/DEC_SAFE_OR','Network3/DEC_SAFE','Network3/DEC_RND','Network3/DEC_RUN','Network3/DEC_EMG');
  moveAfter('Network12/FBAnd15','Network12/FBDecouple1');
  moveBefore('Network3/FBAnd2','Network3/FBAnd1');
  moveBefore('Network2/FBAnd11','Network2/FBAnd91');
  ins(['Network6/HEALTHY_OK','Network6/HEALTH_GUARD'],'Network6/FBAnd9');
 }
 if(e2a){ moveBefore('Network12/FBAnd6','Network12/FBTon3'); }
 if(e2b){ moveBefore('Network12/FBAnd16','Network1/FBAnd1'); moveBefore('SafeResumption/CONNECTORS','Network1/FBAnd1'); moveBefore('SafeResumption/CONNECTOR_SCOPE','Network1/FBAnd1'); ins(['Network1/FBAndNotRunSu','Network1/FBOrIlRunOk'],'Network1/FBAnd1'); ins(['Network6/STAGE_LVON','Network6/FBAndLvEmg','Network6/FBOrStep4'],'Network6/FBDecouple1'); seq=seq.filter(x=>x!=='Network3/FBOrS12Reset'); seq.splice(seq.indexOf('Network3/FBRs1'),0,'Network3/FBOrS12Reset'); }
 if(e2c){ moveAfter('SafeResumption/SG_OWNER_SET','RndPhysicalCompact/STATE_SU'); seq=seq.filter(x=>x!=='RndPhysicalCompact/STATE_SG'); seq.splice(seq.indexOf('SafeResumption/SG_OWNER_SET')+1,0,'SafeResumption/HLT_LV','RndPhysicalCompact/GATE_SG_SET','RndPhysicalCompact/STATE_SG'); }

 if(e2e){ seq.splice(seq.indexOf('Network1/FBEstop1')+1,0,'Network3/G10_EXIT'); }
 seq.forEach((p,i)=>{blk(p).orderOfExecution=i+1;});
 const missing=[...B.values()].filter(b=>!b.dead&&!seq.includes(b.path.slice(2)));if(missing.length)throw Error('unordered '+missing.map(b=>b.path));
 return {m,seq,count:seq.length};
}
