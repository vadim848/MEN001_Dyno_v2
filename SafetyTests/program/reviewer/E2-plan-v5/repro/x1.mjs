// Reviewer v5: B4-3 variant (A) N1/FBAnd4.AndIn5 := b_Step1 against B43-01/B43-02 (analyst), and boot-with-FBK path (g1).
// Model only: architect prototype proto.mjs (R1 simulated on F1, old input names) over sal-runtime. Not native, not hardware.
import {build} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/proto.mjs';
import {SalRuntime} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
import {raw0} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/h.mjs';
const ST=['b_Step1','b_Step12','b_Step_RnD','b_Step3','b_Step4','b_Step5','b_Step6','b_Step2'];
const STS=['//Network3/DEC_SAFE/AndOut','//Network3/DEC_RND/AndOut','//Network3/DEC_RUN/AndOut','//Network3/DEC_EMG/AndOut'];
function rt({gateA=false,gateFbk=false}={}){
 const {m}=build({});
 const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
 if(gateA){const x=B.get('//Network1/FBAnd4').inputs.find(p=>p.name==='AndIn5');x.channelInterface='Activated';x.deactivate1='Break Contact (NC)';x.globals=[{resolvedName:'b_Step1'}];x.sources=[];}
 if(gateFbk){const x=B.get('//Network3/FBAnd1').inputs.find(p=>p.name==='AndIn3');x.channelInterface='Activated';x.deactivate1='Break Contact (NC)';x.sources=[];
   // sketch: two NO (negated) contacts need a helper block; emulate with a new AND block ordered first
   const net=m.networks.find(n=>n.name==='Network3');const path='//Network3/NOFBK';const out={name:'AndOut',path:path+'/AndOut',targets:[x.path],sources:[],globals:[]};
   const mk=(n,g)=>({name:n,path:path+'/'+n,sources:[],targets:[],globals:[{resolvedName:g}],channelInterface:'Activated',deactivate1:'Make Contact (NO)'});
   net.blocks.push({type:'x',name:'NOFBK',functionName:'safeAnd',orderOfExecution:0.5,path,inputs:[mk('AndIn1','in_LV_C1_FBK'),mk('AndIn2','in_HV_C2_FBK')],outputs:[out],parameters:[]});x.sources=[out.path];}
 const r=new SalRuntime(m,{scanMs:1,unconnectedInput:false});r.setInputs({...raw0});r.t=0;r.hold={};r.plantC2=true;r.plant=true;
 r.step=(n=1,inp)=>{if(inp)r.setInputs(inp);for(let i=0;i<n;i++){const pl={};if(r.plant){pl.in_LV_C1_FBK=r.get('out_LV_C1');}if(r.plantC2)pl.in_HV_C2_FBK=r.get('out_HV_C2');pl.in_STO_DR1_FBK=!r.get('STO_DR1');pl.in_STO_DR2_FBK=!r.get('STO_DR2');r.setInputs({...pl,...r.hold});r.scan(1);r.t++;}return r;};
 r.ph=()=>ST.filter(s=>r.get(s)).map(s=>s.replace('b_Step','S')).join('+')||'none';
 r.sts=()=>STS.filter(s=>r.get(s)).map(s=>s.split('/')[3].slice(4)).join('+');
 return r;}
const gesture=(r,{green=false,blue=false,ms=600})=>{r.step(1,{in_Reset_PB:green,in_Relase_Door_PB:blue});r.step(ms);r.step(1,{in_Reset_PB:false,in_Relase_Door_PB:false});};
const boot=r=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=r=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const toRun=r=>{toRnd(r);gesture(r,{green:true,blue:true,ms:1100});r.step(3000);};
const watch=(r,n,acc)=>{for(let i=0;i<n;i++){r.step(1);const e=+r.get('out_LV_C1')||+r.get('out_HV_C2');const s=r.sts();if(e&&s==='EMG')acc.emg++;if(e&&s==='SAFE')acc.safe++;if(e)acc.any++;}};
const fmt=a=>`EMG&E=${a.emg} SAFE&E=${a.safe} anyE=${a.any}`;
for(const gateA of [false,true]){
 const tag=gateA?'(A)':'base';
 // B43-01 (a): Run, ES 100ms, early restart, wait 12s, Bypass 5000
 for(const from of ['Run','RnD']){const r=rt({gateA});from==='Run'?toRun(r):toRnd(r);r.step(1,{in_ES_NC_1:false});r.step(100);r.step(1,{in_ES_NC_1:true});r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(12000);
  const a={emg:0,safe:0,any:0};const st0=r.ph()+'/'+r.sts();r.setInputs({inPLC_BypassC1C2:true});watch(r,5000,a);console.log(tag,'B43-01a from',from,'pre',st0,fmt(a),'end',r.ph(),r.sts());}
 // B43-01 (c): Bypass TRUE before e
 {const r=rt({gateA});toRun(r);r.setInputs({inPLC_BypassC1C2:true});r.step(1,{in_ES_NC_1:false});r.step(100);r.step(1,{in_ES_NC_1:true});r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});const a={emg:0,safe:0,any:0};watch(r,14000,a);console.log(tag,'B43-01c Bypass before e',fmt(a),'end',r.ph(),r.sts());}
 // Emergency in steady Safe (ES held), Bypass
 {const r=rt({gateA});boot(r);r.step(1,{in_ES_NC_1:false});r.step(50);const a={emg:0,safe:0,any:0};r.setInputs({inPLC_BypassC1C2:true});watch(r,2000,a);console.log(tag,'Safe+ES held, Bypass',r.ph(),r.sts(),fmt(a));}
 {const r=rt({gateA});boot(r);r.step(1,{in_LV_Connector_Interlock:false});r.step(50);const a={emg:0,safe:0,any:0};r.setInputs({inPLC_BypassC1C2:true});watch(r,2000,a);console.log(tag,'Safe+LV connector lost, Bypass',r.ph(),r.sts(),fmt(a));}
 // B43-02: S6 after chain, green 100 ms, bypass at delta from release, 300 ms; and held through
 for(const d of [-100,-1,0,1,2,'held']){const r=rt({gateA});toRun(r);r.step(1,{in_ES_NC_1:false});r.step(100);r.step(1,{in_ES_NC_1:true});r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(12000);
  const pre=r.ph()+'/'+r.sts();const a={emg:0,safe:0,any:0};let firstSafe=-1;const ev={};
  if(d==='held')r.setInputs({inPLC_BypassC1C2:true});
  const T0=200;// green pressed at k=100..199, released at k=200
  for(let k=0;k<3000;k++){const inp={};if(k===100)inp.in_Reset_PB=true;if(k===T0)inp.in_Reset_PB=false;if(d!=='held'){if(k===T0+d)inp.inPLC_BypassC1C2=true;if(k===T0+d+300)inp.inPLC_BypassC1C2=false;}r.setInputs(inp);
   const before=a.any;watch(r,1,a);if(firstSafe<0&&r.sts()==='SAFE')firstSafe=k;}
  console.log(tag,'B43-02 delta',String(d).padEnd(5),'pre',pre,'firstSAFE k',firstSafe,fmt(a),'end',r.ph(),r.sts());}
}
// boot with FBK held, Restart
for(const gateFbk of [false,true])for(const fb of ['in_LV_C1_FBK','in_HV_C2_FBK']){const r=rt({gateFbk});r.plant=false;r.plantC2=false;r.hold={[fb]:true};r.step(50);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(300);const s1=r.ph()+'/'+r.sts();
 r.hold={};r.step(100);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(300);const s2=r.ph()+'/'+r.sts();
 // normal lifecycle sanity
 r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);
 console.log(gateFbk?'gateFbk':'base   ','boot',fb,'Restart->',s1,'| FBK OFF + Restart ->',s2,'| BOTH ->',r.ph(),r.sts());}
