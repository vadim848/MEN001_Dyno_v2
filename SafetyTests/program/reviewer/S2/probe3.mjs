import {program,programFromModel,runScenario} from '../../../test/helpers/catalog-program.js';
import '../../../test/catalog/lib/e.js';import fs from 'node:fs';
const P0=program();const m=structuredClone(P0.m);let n=0;
for(const v of m.variables)if(['in_LV_C1_FBK','in_HV_C2_FBK'].includes(v.name)){const b=v.targetPorts.length;v.targetPorts=v.targetPorts.filter(p=>!p.startsWith('//Network1/FBK_OFF/'));n+=b-v.targetPorts.length;}
const P=programFromModel(m,{...P0.identity,label:'mut'});const out=[`unlinked FBK_OFF ports: ${n}`];
for(const id of ['E-04','E-05','E-06']){const r=runScenario(id,P);out.push(`FBK fix removed: ${id} ${r.fails.length?'FAIL '+r.fails.join(' | ').slice(0,200):'pass'}`);}
{const x=P.rnd();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});let t0=x.t;while(x.t-t0<15000)x.step();x.hold.in_LV_C1_FBK=true;x.wait(500);
  x.restart();x.wait(1000);out.push(`FBK fix removed: C1_FBK ON whole press -> left EMG: ${!!x.log.slice(-1000).find(s=>!(s.st.length===1&&s.st[0]==='EMG'))}`);}
console.log(out.join('\n'));fs.writeFileSync(new URL('./probe3.out.txt',import.meta.url),out.join('\n')+'\n');
