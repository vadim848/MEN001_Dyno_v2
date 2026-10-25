// v7.3 fix on E2b candidate (in-memory): spoil the UP attempt (STATE_L via GATE_029) when both buttons pressed and
// the UP permit condition is lost: R&D - cover; Safe - connectors. Plus regressions (V14-Q7, green down, blue in R&D).
import {cand,toRnd,boot,gesture} from './cand.mjs';
const NC='Break Contact (NC)',NO='Make Contact (NO)';
function fix(m,{noR=false,noS=false}={}){
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
 // order: right before GATE_029 (after GATE_003 and the head)
 const all=m.networks.flatMap(n=>n.blocks).filter(b=>b.orderOfExecution>0).sort((a,b)=>a.orderOfExecution-b.orderOfExecution);
 const i=all.indexOf(g29);all.splice(i,0,R,S);all.forEach((b,k)=>b.orderOfExecution=k+1);
}
const run=(variant,scen)=>{const r=cand('E2b',variant?m=>fix(m,variant):null);return scen(r);};
const coverHold=(r)=>{toRnd(r);r.step(2100);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(300);r.step(1,{in_InterLock_NC_1:false});r.step(200);r.step(1,{in_InterLock_NC_1:true});r.step(1000);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(2000);const a=r.ph();r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(1500);return `after episode: ${a}; new gesture: ${r.ph()}`;};
const connHold=(r)=>{boot(r);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(300);r.step(1,{in_LV_Connector_Interlock:false});r.step(200);r.step(1,{in_LV_Connector_Interlock:true});r.step(1000);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});r.step(2000);const a=r.ph();r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(1500);return `after episode: ${a}; new gesture: ${r.ph()}`;};
const safeCoverOpen=(r)=>{boot(r);r.step(1,{in_InterLock_NC_1:false});gesture(r,{green:true,blue:true,ms:1100});r.step(1500);return r.ph();};
const rndGreenCoverOpen=(r)=>{toRnd(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});gesture(r,{green:true});r.step(1500);return r.ph();};
const rndBlueCoverOpen=(r)=>{toRnd(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});r.step(1,{in_Relase_Door_PB:true});r.step(700);return 'UL='+(+r.get('out_Door_Unlock_Solonoeid'));};
const rndBothCoverOpenWhole=(r)=>{toRnd(r);r.step(2100);r.step(1,{in_InterLock_NC_1:false});r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1500);r.step(1,{in_InterLock_NC_1:true});r.step(1500);return r.ph();};
for(const [n,f] of [['R&D cover episode during BOTH hold',coverHold],['Safe connector episode during BOTH hold',connHold],['Safe cover open BOTH (V14-Q7)',safeCoverOpen],['R&D cover open green down',rndGreenCoverOpen],['R&D cover open blue (Q-ARCH-10)',rndBlueCoverOpen],['R&D BOTH with cover open, restore while held (IL-02)',rndBothCoverOpenWhole]])
 for(const [vn,v] of [['E2b',null],['E2b+v7.3',{}],['mut noR',{noR:true}],['mut noS',{noS:true}]]){
  if(vn==='mut noR'&&!/R&D cover episode/.test(n))continue; if(vn==='mut noS'&&!/connector/.test(n))continue;
  console.log(n.padEnd(52),vn.padEnd(10),run(v,f));}
