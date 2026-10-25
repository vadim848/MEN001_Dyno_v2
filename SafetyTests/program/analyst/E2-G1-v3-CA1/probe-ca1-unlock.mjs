// Analyst C-A1 probe 2 (diagnostic): Unlock moment when in_Estop_PLC arrives in Safe while blue is held (Unlock TRUE).
import * as L from '../../../test/helpers/e2-lifecycle.js';
for(const source of ['ref','work']){
 const x=source==='ref'?L.boot(L.create({source:'ref'})):L.cached('Safe');x.step(L.OFF,2100);
 x.step(L.BLUE,700);const u0=x.get('out_Door_Unlock_Solonoeid');const e=x.t+1;x.step({...L.BLUE,in_Estop_PLC:true},50);
 const s=x.log.filter(s=>s.t>=e-1&&s.t<=e+4).map(s=>`${s.t-e}:U=${s.out.out_Door_Unlock_Solonoeid},st=${s.statuses}`);
 console.log(source,'unlock before e',u0,s.join(' | '));}
