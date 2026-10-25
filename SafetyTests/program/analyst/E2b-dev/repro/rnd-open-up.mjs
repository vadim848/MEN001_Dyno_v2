// E2b-dev (v2-analyst): справка — подъём R&D->Run при открытой крышке (кнопки, legacy PLC (1,1)). Не oracle.
import * as L from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/e2-lifecycle.js';
const {BOTH,OFF}=L;
for(const [nm,up] of [['BOTH',null],['PLC(1,1)',{inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true}]])for(const cov of ['in_InterLock_NC_1','in_InterLock_NC_2']){
 const x=L.cached('RnD',{c3:true}).fork();const from=x.t;x.step({[cov]:false},200);
 if(up){x.step(up,3000);x.step({inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false},500);}else{x.step(BOTH,1100);x.step(OFF,2000);}
 const seg=x.log.filter(s=>s.t>from);const rel=seg.filter(s=>s.out.out_HV_C2||s.out.STO_DR1||s.out.STO_DR2);
 console.log(nm,cov,'FALSE: C2/STO scans',rel.length,'emg',seg.some(s=>!s.out.b_EStop_Ok),'run',seg.some(s=>s.statuses.includes('STS_RUN')),'endStages',x.stageSet().join('+'));}
