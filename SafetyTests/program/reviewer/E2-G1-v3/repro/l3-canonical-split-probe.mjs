// Reviewer G1 v3 probe (DIAGNOSTIC ONLY, split LV convention; not an oracle): profile of in_Estop_PLC in steady Run on the
// canonical F1 with the tester's helper vs the pinned reference anchor REF_RUN_PLC; L3 verdict printed for information.
import * as E from '../../../../test/helpers/e2-emergency.js';
import * as RL from '../../../../test/helpers/e2-rule-l.js';
const p=E.runRef();console.log('canonical split profile',JSON.stringify(p));console.log('reference REF_RUN_PLC ',JSON.stringify(RL.REF_RUN_PLC));
const list=[];const c=(ok,m)=>{if(!ok)list.push(m);return ok;};RL.L3(c,p,RL.REF_RUN_PLC);console.log('L3 violations:',list);
