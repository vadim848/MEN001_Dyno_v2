// v2-reviewer S4: trace Config + EStop energy (model evidence)
import {program} from '../../../test/helpers/catalog-program.js';
const P=program();const BY='inPLC_BypassC1C2';
for(const [lbl,ev,hold] of [['EStop',{in_ES_NC_1:false},2000],['NC1',{in_InterLock_NC_1:false},2000],['PLC-EMG',{in_Estop_PLC:true},2000],['EStop-exit',{in_ES_NC_1:false},2000]]){
 const x=P.safe();x.step({[BY]:true},1000);if(lbl==='EStop-exit')x.step({[BY]:false},300);const a=x.t;x.step(ev,hold);
 const ch=k=>{const r=[];let p;for(const s of x.seg(a-1)){if(s[k]!==p){r.push((s.t-a)+':'+(s[k]?1:0));p=s[k];}}return r.join(' ');};
 console.log(lbl,'st',x.status(),'| C1',ch('out_LV_C1'),'| C2',ch('out_HV_C2'),'| c1f',ch('c1f'),'| c2f',ch('c2f'),'| HVD',ch('out_HV_Discharge_Request'),'| LVD',ch('out_LV_Discharge_Request'),'| stg',[...new Set(x.seg(a-1).map(s=>s.stg+'/'+s.st))].join(' > '));
 x.step({in_ES_NC_1:true,in_InterLock_NC_1:true,in_Estop_PLC:false},8000);console.log('   +8s',x.status(),'C1',x.r.get('out_LV_C1'),'C2',x.r.get('out_HV_C2'),'cfgActive',x.r.get('linkCfgActive'));}
