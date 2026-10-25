// Read-only source probe. Not a full-group/BOOT acceptance test.
// node SafetyTests/scripts/probe-plc-pulse-set.js
import {parseSalFile} from '../src/sal-parser.js';
import {SalRuntime} from '../src/sal-runtime.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
const file=new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url);
const model=parseSalFile(file),all=model.networks.flatMap(n=>n.blocks),get=p=>all.find(b=>b.path===p);
const traces=[];
for(const mode of ['LV','HV'])for(const fault of [false,true]){
  const producer=get(mode==='LV'?'//Network11/FBAnd1':'//Network1/FBAnd6');
  const aggregate=get('//Network1/'+(mode==='LV'?'FBOr17':'FBOr18'));
  const rs=get('//Network1/'+(mode==='LV'?'FBRs1':'FBRs2'));
  const paths=['FBAndLvCurrentPermit',mode==='LV'?'FBAndLvSetPermit':'FBAndHvSetPermit','FBAnd1','FBEstop1'].map(n=>'//Network1/'+n);
  const r=new SalRuntime({...model,networks:[{blocks:[...all.filter(b=>paths.includes(b.path)),producer,aggregate,rs]}]},
    {scanMs:1,unconnectedInput:false});
  r.setInputs({in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,
    in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Estop_PLC:false,
    in_False_SI2_CH8:false,in_Mentee_EStop:false,in_Reset_PB:false,b_Step12:false}).runFor(10);
  r.setInputs({in_Reset_PB:true}).scan();r.setInputs({in_Reset_PB:false}).scan();
  if(!r.get('b_EStop_Ok'))throw Error('Actual main EStop preparation failed');
  // Explicit cuts: LV Step12 state, HV upstream retry request. Reset aggregate
  // producers are outside scope; their Boolean FALSE source boundary is explicit.
  for(const path of rs.inputs.find(p=>p.name==='Reset').sources)r.values.set(path,false);
  if(mode==='LV')r.setInputs({b_Step12:true});else r.values.set('//Network1/FBAnd4/AndOut',true);
  let budget=100;
  while(!r.get(aggregate.outputs[0].path)&&budget-->0)r.scan();
  if(budget<=0)throw Error('Real producer failed to build aggregate');
  const output=mode==='LV'?'out_LV_C1':'out_HV_C2',rows=[];
  function snapshot(label){rows.push({label,output:r.get(output),EStopOK:r.get('b_EStop_Ok'),
    aggregate:r.get(aggregate.outputs[0].path),PLCproducer:r.get('//Network1/FBAnd1/AndOut')});}
  snapshot('prehistory');
  if(r.get(output))throw Error('Latch must still be FALSE before consuming aggregate');
  r.setInputs({in_Estop_PLC:fault}).scan();snapshot(fault?'one-sample PLC fault':'paired healthy');
  r.setInputs({in_Estop_PLC:false}).scan();snapshot('raw restored, no Restart');
  traces.push({mode,fault,cuts:mode==='LV'?'b_Step12=TRUE; Reset aggregate FALSE':'FBAnd4.AndOut=TRUE; Reset aggregate FALSE',rows});
}
console.log(JSON.stringify({kind:'READONLY ACTUAL SOURCE SUBGRAPH PROBE; NOT fullBOOT',
  sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),traces},null,2));
