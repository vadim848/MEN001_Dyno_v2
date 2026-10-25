// Reviewer G1 v4 (diagnostic, not oracle): what helpers/e2-rule-l.js EMGRDL (mode 'A') says for the rd-sweep PLC_HV test
// (in_Estop_PLC + in_HV_Faulty_FBK in the same scan e=t_a+1000) for two hypothetical candidates:
//  (1) STP-D honoured: STO at e+1 (h+1);  (2) STP-D ignored under Emergency: STO at t_a+2000.
import * as RL from '../../../../test/helpers/e2-rule-l.js';
const ta=10000,e=ta+1000,qN={STO_DR1:ta+2000,STO_DR2:ta+2000};
for(const [nm,off] of [['STP-D honoured (STO h+1)',1],['STP-D ignored (STO t_a+2000)',1000]]){
 const list=[];const c=(ok,m)=>{if(!ok)list.push(m);};
 RL.EMGRDL(c,{status:1,STO_DR1:off,STO_DR2:off},{e,qN,run:{...RL.REF_RUN_PLC},log:[],end:e+10000,mode:'A'});
 console.log(nm,'->',list.length?'FAIL: '+list[0]:'PASS');}
