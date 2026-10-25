// Reviewer G1 v3 probe (diagnostic, not oracle): REL-01(e) on canonical with BOTH held 2000/3000 ms and different episode
// windows; prints the first C1 ON offset from the press.
import * as L from '../../../../test/helpers/e2-lifecycle.js';
const CONN={in_LV_Connector_Interlock:false},OK={in_LV_Connector_Interlock:true};
for(const [hold,a,b] of [[2000,800,1300],[3000,800,1300],[3000,800,2500],[2000,500,999],[2000,1001,1500]]){
 const x=L.steadySafe();x.step(L.OFF,2500);const p=x.t+1;
 for(let n=p;n<p+hold;n++){const inp=n===p?{...L.BOTH}:{};if(n===p+a)Object.assign(inp,CONN);if(n===p+b)Object.assign(inp,OK);x.step(inp);}
 x.step(L.OFF,1500);const on=x.log.find(s=>s.t>=p&&s.out.out_LV_C1);
 console.log(`hold ${hold} episode [${a},${b}) -> C1 ON at ${on?'p+'+(on.t-p):'never'}`);}
