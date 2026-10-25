import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseSalFile} from '../../src/sal-parser.js';
import {inspectNativeSalStructure} from '../../src/sal-native-structure.js';
import {readBindingXml} from '../../src/sal-binding-validator.js';
import {SalRuntime} from '../../src/sal-runtime.js';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const reference=new URL('../../../../MEN001_Dyno/MEN001_Dyno/Safety_Dyno/',import.meta.url);
const current=new URL('../../../MEN001_Dyno/Safety_Dyno/',import.meta.url);
const active=p=>!['Deactivated','Both Deactivated'].includes(p.channelInterface);
function inspect(base,label){
 const sal=new URL('TwinSafeGroup1/TwinSafeGroup1.sal',base),gvl=new URL('GVLs/GVL1.sgvl',base);
 const native=inspectNativeSalStructure(fs.readFileSync(sal,'utf8'));
 if(native.status!=='PASS')throw Error(label+' native preflight');
 const m=parseSalFile(sal,{bindingMode:'current',sgvlPath:gvl});
 if(m.bindingAudit.status!=='PASS')throw Error(label+' typed bindings');
 const walk=n=>[n,...n.children.flatMap(walk)],ids=new Map();
 for(const n of walk(readBindingXml(fs.readFileSync(sal,'utf8'))).filter(n=>n.attr?.functionName)){let net=n.parent;while(net&&net.tag!=='Network')net=net.parent;ids.set(`//${net.attr.name}/${n.attr.name}`,n.attr.Id);}
 const bs=m.networks.flatMap(n=>n.blocks),ports=bs.flatMap(b=>[...b.inputs,...b.outputs]);
 const writer=new Map(m.variables.map(v=>[v.name,v.sourcePorts]));
 for(const b of bs)for(const p of b.outputs)for(const g of p.globals){if(!writer.has(g.resolvedName))writer.set(g.resolvedName,[]);writer.get(g.resolvedName).push(p.path);}
 const targets=new Map(m.variables.flatMap(v=>v.targetPorts.map(p=>[p,v.name])));
 function sources(p){return [...new Set([...p.sources,...p.globals.flatMap(g=>writer.get(g.resolvedName)??[]),...(writer.get(targets.get(p.path))??[])])];}
 const input=p=>({path:p.path,id:p.Id,negated:p.deactivate1==='Make Contact (NO)',sources:sources(p),globals:p.globals.map(g=>g.resolvedName),alias:targets.get(p.path)});
 const state=m.networks.find(n=>n.name==='Network3');
 const network=state.blocks.toSorted((a,b)=>a.orderOfExecution-b.orderOfExecution).map(b=>({path:b.path,id:ids.get(b.path),order:b.orderOfExecution,type:b.functionName,inputs:b.inputs.filter(active).map(input),outputs:b.outputs.map(p=>({path:p.path,id:p.Id,names:[...new Set([...p.globals.map(g=>g.resolvedName),...m.variables.filter(v=>v.sourcePorts.includes(p.path)).map(v=>v.name)])]}))}));
 const names=['b_Step1','b_Step3','out_Step1','out_Step3','out_Safety_Armed','b_Step1_Set','b_Step1_Set_2','b_Step1_Set_3','b_Step3_Set','b_Step3_Set_2','b_Step3_Set_3'];
 const directWriters=Object.fromEntries(names.map(n=>[n,[...new Set(writer.get(n)??[])].map(path=>{const b=bs.find(b=>b.outputs.some(p=>p.path===path));const relevant=b?.functionName==='safeDecouple'?[b.inputs[b.outputs.findIndex(p=>p.path===path)]]:b?.inputs.filter(active);return{path,order:b?.orderOfExecution,inputs:relevant?.map(input)};})]));
 const trials=[];
 if(label==='canonical')for(const fallback of [false,true]){
  const r=new SalRuntime({...m,networks:[state]},{scanMs:10,unconnectedInput:fallback});
  r.setInputs({in_Safety_Run:false,b_EStop_Ok:false,in_False_SI2_CH8:false,b_Step1_Set:true,b_Step3_Set_2:true});
  const frames=[];for(let scan=1;scan<=5;scan++){r.scan();frames.push({scan,Safe:r.get('b_Step1'),Run:r.get('b_Step3'),outSafe:r.get('out_Step1'),outArmed:r.get('out_Safety_Armed')});}
  trials.push({scope:'CONDITIONAL Network3 only; upstream removed; internal Set variables injected; NOT legal-input reachability',fallback,frames,assumedUnconnected:[...r.assumedUnconnectedPorts]});
 }
 return{label,sha256:{sal:sha(sal),gvl:sha(gvl)},nativeStatus:native.status,bindingStatus:m.bindingAudit.status,network,directWriters,conditionalTrials:trials};
}
// Reference must be inspected before canonical. Neither source is edited.
const result={scope:'Source trace and conditional reproduction only; independent workflow review pending. No full startup reachability or native lifecycle claim.',sources:[inspect(reference,'reference'),inspect(current,'canonical')]};
fs.writeFileSync(new URL('SOURCE_TRACE.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({sources:result.sources.map(s=>({label:s.label,sha256:s.sha256,networkBlocks:s.network.length,conditionalTrials:s.conditionalTrials}))},null,2));
