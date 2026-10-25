import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {parseSalFile} from '../../src/sal-parser.js';
import {inspectNativeSalStructure} from '../../src/sal-native-structure.js';
import {SalRuntime} from '../../src/sal-runtime.js';
const root=new URL('../../../',import.meta.url);
const files=[['MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal','MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl'],['SafetyTests/candidates/resumed-p0/native/TwinSafeGroup1.sal','SafetyTests/candidates/resumed-p0/native/GVL1.sgvl']];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');
const hashes=files.map(f=>f.map(hash));
const models=files.map(([f,g])=>{assert.equal(inspectNativeSalStructure(fs.readFileSync(new URL(f,root),'utf8')).status,'PASS');const m=parseSalFile(new URL(f,root),{bindingMode:'current',sgvlPath:new URL(g,root)});assert.equal(m.bindingAudit.status,'PASS');return m;});
const rows=[];
function evaluate(model,paths,inputs,published,out){
 const r=new SalRuntime(model,{scanMs:1,unconnectedInput:false});r.setInputs(inputs);
 for(const [p,value]of Object.entries(published))r.values.set(p,value);
 const blocks=model.networks.flatMap(n=>n.blocks).filter(b=>paths.includes(b.path)).sort((a,b)=>a.orderOfExecution-b.orderOfExecution);
 for(const b of blocks)r.evaluate(b,1);
 assert.equal(r.assumedUnconnectedPorts.size,0);return r.get(out);
}
for(let mask=0;mask<32;mask++){
 const [s,pg,g,pb,b]=[0,1,2,3,4].map(i=>Boolean(mask&(1<<i)));
 const published={'//RndPhysicalCompact/GATE_005/AndOut':s,'//RndPhysicalCompact/SNAP_1/DecOut1':pg,'//RndPhysicalCompact/SNAP_1/DecOut2':pb,'//RndPhysicalCompact/GATE_022/AndOut':false,'//RndPhysicalCompact/GATE_023/AndOut':false,'//RndPhysicalCompact/GATE_024/AndOut':false};
 const paths=['025','026','027','028','029'].map(x=>'//RndPhysicalCompact/GATE_'+x);
 const got=models.map(m=>evaluate(m,paths,{in_Reset_PB:g,in_Relase_Door_PB:b},published,'//RndPhysicalCompact/GATE_029/OrOut'));
 const expected=s&&((pg&&!g)||(pb&&!b));assert.deepEqual(got,[expected,expected]);rows.push({id:'distribution'+mask,inputs:{s,pg,g,pb,b},got,expected});
}
for(let mask=0;mask<16;mask++){
 const [a,b,c,d]=[0,1,2,3].map(i=>Boolean(mask&(1<<i)));
 const got=models.map(m=>evaluate(m,['//Network7/FBAnd6','//Network7/FBAnd7','//Network7/FBAnd8'],{in_STO_DR1_FBK:c,in_STO_DR2_FBK:d},{'//Network7/FBOr1/OrOut':a,'//Network7/FBOr2/OrOut':b},'//Network7/FBAnd8/AndOut'));
 const expected=a&&b&&c&&d;assert.deepEqual(got,[expected,expected]);rows.push({id:'conjunction'+mask,inputs:{a,b,c,d},got,expected});
}
assert.deepEqual(files.map(f=>f.map(hash)),hashes);
const report={status:'PASS',hashes,counts:{actualContactDistribution:32,actualConjunction:16},rows,limits:'Actual source primitives evaluated under independent algebra input cuts; not lifecycle reachability, integration or native timing proof'};
fs.writeFileSync(new URL('ALGEBRA_PROBES.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,counts:report.counts,hashes}));
