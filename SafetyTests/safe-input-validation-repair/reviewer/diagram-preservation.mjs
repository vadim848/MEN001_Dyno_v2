import fs from 'node:fs';
import assert from 'node:assert/strict';
import {readBindingXml} from '../../src/sal-binding-validator.js';
const h=import.meta.dirname,read=p=>readBindingXml(fs.readFileSync(p,'utf8'));
const b=read(h+'/../../network-symbol-repair/editor/native-reviewed-output/TwinSafeGroup1.sal.diagram'),c=read(h+'/../editor/candidate-output/TwinSafeGroup1.sal.diagram');
const native=JSON.parse(fs.readFileSync(h+'/../tester/NATIVE_CANDIDATE_CRC.json','utf8').replace(/^\uFEFF/,''));
assert.equal(native.baselineGeometry.length,2463);assert.equal(native.nonzeroNativeGeometryCount,2463);
for(const row of native.baselineGeometry)assert.equal(row.maxDelta,0);
let omittedDerived=0,roundedRoutes=0,retargets=0,visited=0,maxRoundDelta=0;
function compare(a,z,connector){visited++;assert.equal(a.tag,z.tag);assert.equal(a.text.trim(),z.text.trim());assert.equal(a.children.length,z.children.length);if(a.tag==='wiredLinkConnector')connector=a.attr.Id;
for(const k of new Set([...Object.keys(a.attr??{}),...Object.keys(z.attr??{})])){
 const av=a.attr[k],zv=z.attr[k];if(av===zv)continue;
 if(k==='Crc'&&a.tag==='safetyApplicationLanguageDiagram')continue;
 if(k==='absoluteBounds'&&zv===undefined&&['inPortShape','outPortShape','paramPortShape'].includes(a.tag)){assert.ok(native.baselineGeometry.some(r=>r.id===a.attr.Id&&r.maxDelta===0));omittedDerived++;continue;}
 if(k==='Id'&&a.tag==='inPortShapeMoniker'&&connector==='29b3b33c-920d-4222-80e2-684c951209b2'){assert.equal(av,'4ae1bc42-0f66-45d2-8285-4145038d940c');assert.equal(zv,'06ad6e3e-ac4d-4533-ad3e-049af5e1fe21');retargets++;continue;}
 if(k==='edgePoints'){
  const before=connector==='29b3b33c-920d-4222-80e2-684c951209b2'?av.replaceAll(': 50.945',': 52.025'):av;
  const re=/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  assert.equal(before.replace(re,'#'),zv.replace(re,'#'),'route syntax');const x=before.match(re).map(Number),y=zv.match(re).map(Number);assert.equal(x.length,y.length);for(let i=0;i<x.length;i++){const delta=Math.abs(x[i]-y[i]);assert.ok(delta<=1e-10,`${connector} route drift ${delta}`);maxRoundDelta=Math.max(maxRoundDelta,delta);}roundedRoutes++;continue;
 }
 assert.fail(`${a.tag}/${a.attr.Id??connector}/${k}: ${av} -> ${zv}`);
}
a.children.forEach((n,i)=>compare(n,z.children[i],connector));}
compare(b,c);assert.equal(retargets,1);
const report={status:'PASS_EXACT_DIAGRAM_PRESERVATION_WITH_NATIVE_DERIVED_BOUNDS',visited,omittedDerived,roundedRoutes,maxRoundDelta,retargets,nativeShapeBounds:2463,nativeBoundsMaxDelta:0,limits:['One explicitly authorized connector changes destination and matching route Y coordinates; all other diagram tree structure/attributes/text preserved except native root CRC, native-verified omitted derived port bounds and floating decimal route rounding <=1e-10.']};fs.writeFileSync(h+'/FRESH_DIAGRAM_PRESERVATION.json',JSON.stringify(report,null,2));console.log(report);
