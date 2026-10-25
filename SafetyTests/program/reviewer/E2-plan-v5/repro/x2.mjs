// Reviewer v5: (A) consequences: legacy Bypass in steady Safe / R&D, M-E2d-01/02 killability under (A),
// M-E2b-35 (N1/FBAnd1 right after FBEstop1) effect. Model only (architect proto), not native/hardware.
import {build} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/proto.mjs';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
import {raw0} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/h.mjs';
const STS=['//Network3/DEC_SAFE/AndOut','//Network3/DEC_RND/AndOut','//Network3/DEC_RUN/AndOut','//Network3/DEC_EMG/AndOut'];
function rt({gateA=false,deact=[],fbAnd1AfterEstop=false}={}){
 const {m}=build({});
 const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
 if(gateA){const x=B.get('//Network1/FBAnd4').inputs.find(p=>p.name==='AndIn5');x.channelInterface='Activated';x.deactivate1='Break Contact (NC)';x.globals=[{resolvedName:'b_Step1'}];}
 for(const [b,p] of deact){const x=B.get(b).inputs.find(q=>q.name===p);x.channelInterface='Deactivated';x.globals=[];x.sources=[];}
 if(fbAnd1AfterEstop){const all=[...B.values()].filter(b=>b.orderOfExecution>0).sort((a,b)=>a.orderOfExecution-b.orderOfExecution);const f=B.get('//Network1/FBAnd1');const rest=all.filter(b=>b!==f);const i=rest.indexOf(B.get('//Network1/FBEstop1'));rest.splice(i+1,0,f);rest.forEach((b,k)=>b.orderOfExecution=k+1);}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs({...raw0});r.t=0;r.hold={};
 r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){r.setInputs({in_LV_C1_FBK:r.get('out_LV_C1'),in_HV_C2_FBK:r.get('out_HV_C2'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2'),...r.hold});r.scan(1);r.t++;}return r;};
 r.sts=()=>STS.filter(s=>r.get(s)).map(s=>s.split('/')[3].slice(4)).join('+');
 return r;}
const gesture=(r,{green=false,blue=false,ms=600})=>{r.step(1,{in_Reset_PB:green,in_Relase_Door_PB:blue});r.step(ms);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});};
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=r=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const toRun=r=>{toRnd(r);gesture(r,{green:true,blue:true,ms:1100});r.step(3000);};
const cnt=(r,n,k)=>{let c=0;for(let i=0;i<n;i++){r.step(1);if(r.get(k))c++;}return c;};
for(const gateA of [false,true]){const t=gateA?'(A)':'base';
 {const r=rt({gateA});boot(r);r.setInputs({inPLC_BypassC1C2:true});console.log(t,'steady Safe + Bypass 3000: C1 scans',cnt(r,3000,'out_LV_C1'),'sts',r.sts());}
 {const r=rt({gateA});toRnd(r);r.setInputs({inPLC_BypassC1C2:true});console.log(t,'steady R&D + Bypass 3000: C2 scans',cnt(r,3000,'out_HV_C2'),'sts',r.sts());}
 for(const [id,p] of [['M-E2d-01','AndIn3'],['M-E2d-02','AndIn4']])for(const st of ['Safe','RnD']){
   const nc=p==='AndIn3'?'in_InterLock_NC_1':'in_InterLock_NC_2';
   const f=(dd)=>{const r=rt({gateA,deact:dd});st==='Safe'?boot(r):toRnd(r);r.setInputs({[nc]:false});r.step(20);r.setInputs({inPLC_BypassC1C2:true});return cnt(r,2000,'out_HV_C2');};
   console.log(t,id,st,'cover open + Bypass: C2 scans base',f([]),'mutant',f([['//Network1/FBAnd4',p]]));}
}
// B43-02 held through exit with (A), then 3000 ms in Safe
for(const gateA of [false,true]){const r=rt({gateA});toRun(r);r.step(1,{in_ES_NC_1:false});r.step(100);r.step(1,{in_ES_NC_1:true});r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(12000);
 r.setInputs({inPLC_BypassC1C2:true});r.step(100);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});let e=0,s='';for(let i=0;i<3000;i++){r.step(1);if(r.get('out_LV_C1')||r.get('out_HV_C2'))e++;}console.log(gateA?'(A)':'base','B43-02 Bypass held through exit: energy scans',e,'sts',r.sts());}
// M-E2b-35: N1/FBAnd1 immediately after FBEstop1
for(const mv of [false,true]){const res=[];for(const cause of ['in_Estop_PLC','in_InterLock_NC_1','in_LV_Connector_Interlock']){const r=rt({fbAnd1AfterEstop:mv});toRun(r);const val=cause==='in_Estop_PLC';r.step(1,{[cause]:val});let eok=-1,emg=-1;for(let i=1;i<20;i++){if(eok<0&&!r.get('b_EStop_Ok'))eok=i-1;if(emg<0&&r.sts()==='EMG')emg=i-1;r.step(1);}res.push(cause+': EOk↓ e+'+eok+' STS_EMG e+'+emg);}console.log(mv?'M-E2b-35':'base    ',res.join(' | '));}
