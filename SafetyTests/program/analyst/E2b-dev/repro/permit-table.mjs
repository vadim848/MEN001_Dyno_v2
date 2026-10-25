// E2b-dev (v2-analyst): справка — таблица разрешений LV/HV Set на кандидате (подграф как в current-*-set-permit). Не oracle.
import * as V2 from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/v2-structural.js';
import { parseSalFile } from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
import { SalRuntime } from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-runtime.js';
const model=parseSalFile(V2.salUrl,V2.parseOptions),blocks=model.networks.flatMap(n=>n.blocks);const get=p=>blocks.find(b=>b.path===p);
const healthy={b_EStop_Ok:true,in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Estop_PLC:false};
const permit=get('//Network1/FBAndLvCurrentPermit');
for(const b of [permit,get('//Network1/FBAndLvSetPermit'),get('//Network1/FBAndHvSetPermit'),get('//Network1/FBOr18'),get('//Network1/FBOr17')])
 console.log(b.path,b.inputs.map(i=>`${i.name}<-${(i.sources||[]).join('|')||i.alias||i.variable||JSON.stringify(i.binding||'')}${i.inverted?'(NO)':''}${i.active===false?'[deact]':''}`).join('  '));
for(const [lbl,gate,rs,or,out] of [['LV','//Network1/FBAndLvSetPermit','//Network1/FBRs1','//Network1/FBOr17','out_LV_C1'],['HV','//Network1/FBAndHvSetPermit','//Network1/FBRs2','//Network1/FBOr18','out_HV_C2']]){
 const row=[];for(const fault of [null,...Object.keys(healthy)]){const r=new SalRuntime({...model,networks:[{blocks:[permit,get(gate),get(rs),get(or)]}]},{unconnectedInput:false}).setInputs(healthy);r.values.set('//Network1/FBAnd1/AndOut',true);
  const R=get(rs);for(const s of R.inputs.find(p=>p.name==='Reset').sources||[])r.values.set(s,false);r.values.set(R.inputs.find(p=>p.name==='Reset').path,false);
  r.values.set(get(or).outputs[0].path,true);if(fault)r.setInputs({[fault]:!healthy[fault]});r.scan();row.push(`${fault||'none'}=${+!!r.get(out)}`);}
 console.log(lbl,'aggregate TRUE ->',row.join(' '));}
