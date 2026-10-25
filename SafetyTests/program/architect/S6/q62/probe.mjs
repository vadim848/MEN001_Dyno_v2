// Q62 targeted probes, base (E6v) vs q62 scratch. usage: node probe.mjs
import {programFromModel} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
import {load,kit} from './kit.mjs';import {apply} from './q62.mjs';
const mk=v=>{const m=load();if(v==='q62')apply(m,kit(m));return programFromModel(m,{label:v,salSha256:'s',sgvlSha256:'s'});};
const drain=x=>x.wait(16000);
const C={
 heldPulse:(P,ev,ok,d)=>{const x=P.safe();x.step({in_Reset_PB:true},d);x.step({in_Reset_PB:true,...ev},1);x.step({in_Reset_PB:true,...ok},300);x.step({in_Reset_PB:false});x.wait(50);const a=x.status().join('+');drain(x);x.restart();x.wait(2000);return a+' -> newpress '+x.status().join('+');},
 sameScan:(P)=>{const x=P.safe();x.step({in_Reset_PB:true,in_ES_NC_1:false},1);x.step({in_Reset_PB:true,in_ES_NC_1:true},300);x.step({in_Reset_PB:false});x.wait(50);return x.status().join('+');},
 nextScan:(P)=>{const x=P.safe();x.step({in_ES_NC_1:false},1);x.step({in_Reset_PB:true,in_ES_NC_1:true},300);x.step({in_Reset_PB:false});x.wait(50);return x.status().join('+');},
 pressDuringEstop:(P)=>{const x=P.rnd();x.step({in_ES_NC_1:false},300);drain(x);x.step({in_Reset_PB:true},100);x.step({in_Reset_PB:true,in_ES_NC_1:true},100);x.step({in_Reset_PB:false});x.wait(50);return x.status().join('+');},
 bootHeld:(P)=>{const x=P.create();x.step({in_Reset_PB:true},1000);x.step({in_Reset_PB:false});x.wait(50);return x.status().join('+');},
 heldLevel:(P)=>{const x=P.safe();x.step({in_Reset_PB:true},100);x.step({in_Reset_PB:true,in_ES_NC_1:false},300);x.step({in_Reset_PB:true,in_ES_NC_1:true},300);x.step({in_Reset_PB:false});x.wait(50);const a=x.status().join('+');drain(x);x.restart();x.wait(2000);return a+' -> newpress '+x.status().join('+');},
 normalRestart:(P)=>{const x=P.rnd();x.step({in_ES_NC_1:false},300);x.step({in_ES_NC_1:true});drain(x);const t=x.restart();x.wait(5);return x.status().join('+')+' exitScan='+(x.first(s=>s.st.includes('SAFE'),t-1)-t);},
};
const res={};for(const v of ['base','q62']){const P=mk(v);res[v]={};
 for(const [k,ev,ok] of [['NC1',{in_ES_NC_1:false},{in_ES_NC_1:true}],['PLC',{in_Estop_PLC:true},{in_Estop_PLC:false}],['Mentee',{in_Mentee_EStop:true},{in_Mentee_EStop:false}]])
  for(const d of [1,100])res[v][`heldPulse ${k} d=${d}`]=C.heldPulse(P,ev,ok,d);
 for(const k of ['sameScan','nextScan','pressDuringEstop','bootHeld','heldLevel','normalRestart'])res[v][k]=C[k](P);}
for(const k of Object.keys(res.base))console.log(k.padEnd(22),'| base:',res.base[k].padEnd(28),'| q62:',res.q62[k]);
