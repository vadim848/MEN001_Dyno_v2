import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readBindingXml,validateSalBindings} from '../../src/sal-binding-validator.js';
import {inspectNativeSalStructure} from '../../src/sal-native-structure.js';
const here=import.meta.dirname,src='MEN001_Dyno/Safety_Dyno',out=path.join(here,'candidate-input');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),walk=n=>[n,...n.children.flatMap(walk)];
let sal=fs.readFileSync(`${src}/TwinSafeGroup1/TwinSafeGroup1.sal`,'utf8'),gvl=fs.readFileSync(`${src}/GVLs/GVL1.sgvl`,'utf8'),diagram=fs.readFileSync(`${src}/TwinSafeGroup1/TwinSafeGroup1.sal.diagram`,'utf8');
assert.equal(hash(sal),'49ae801d5f6ade77c310859f4efafba92946628a8a6fa7ed268c71b12dc162d5');
assert.equal(hash(gvl),'b10bd9412aade7734aa9d8db1419f9ce3a5a848bb7855a406e8ddca5588f796d');
const baseline={sal:hash(sal),sgvl:hash(gvl),diagram:hash(diagram)};
assert.equal(inspectNativeSalStructure(sal).status,'PASS');assert.deepEqual(validateSalBindings(sal,gvl).errors,[]);
function edit(xml,tag,id,fn){const re=new RegExp(`<${tag}\\b[^>]*\\bId="${id}"[^>]*>`,'g'),m=[...xml.matchAll(re)];assert.equal(m.length,1,`${tag} ${id}`);const start=m[0].index,end=m[0][0].endsWith('/>')?start+m[0][0].length:xml.indexOf(`</${tag}>`,start)+tag.length+3;assert(end>start);const a=xml.slice(start,end),b=fn(a);assert.notEqual(a,b);return xml.slice(0,start)+b+xml.slice(end);}
const pairs=[['b8d7aed0-ee4b-49e3-bdc8-c24952b317e9','3f513b29-6b63-4f75-926e-811ca7650568'],['e38bf21e-15b3-448f-89c8-2795d5bf62db','75f42369-fbd7-49b1-a11b-18df643208ea'],['d67690a6-7037-1fa6-4c0b-5dc60799e6b9','5ee6aed8-eb13-5af9-5850-d5064f5b2468']];
for(const[a,b]of pairs){sal=edit(sal,'inPort',a,x=>{assert(x.includes('deactivate1="Break Contact (NC)"'));return x.replace('deactivate1="Break Contact (NC)"','deactivate1="Make Contact (NO)"');});sal=edit(sal,'inPort',b,x=>{assert(x.includes('deactivate1="Make Contact (NO)"'));return x.replace('deactivate1="Make Contact (NO)"','deactivate1="Break Contact (NC)"');});}
const moves=[['//Network1/FBAndUnlockHold/AndIn5','//Network1/FBAndUnlockHold/AndIn1'],['//Network1/FBAndLvCurrentPermit/AndIn8','//Network1/FBAndLvCurrentPermit/AndIn1'],['//RndPhysicalCompact/GATE_001/AndIn4','//RndPhysicalCompact/GATE_001/AndIn1']];
sal=edit(sal,'variable','6d615846-7050-4fe7-9d46-85e8b6460f93',x=>{for(const[a,b]of moves){assert.equal(x.split(`name="${a}"`).length,2);x=x.replace(`name="${a}"`,`name="${b}"`);}return x;});
sal=edit(sal,'variable','1fcf5ae0-71f2-49fa-99bc-aec0ba975d67',x=>x.replace('name="//RndPhysicalCompact/GATE_001/AndIn1"','name="//RndPhysicalCompact/GATE_001/AndIn4"'));
sal=edit(sal,'wiredLink','e95829da-c023-4ad3-972f-e815e8e42a9e',x=>x.replace('name="//Network1/FBAndUnlockHold/AndIn1"','name="//Network1/FBAndUnlockHold/AndIn5"'));
let reference;
sal=edit(sal,'inPort',pairs[1][0],x=>{reference=x.match(/<fbPortGlobalVariableReferences>[\s\S]*?<\/fbPortGlobalVariableReferences>/)[0];return x.replace(reference,'');});
sal=edit(sal,'inPort',pairs[1][1],x=>{assert(x.endsWith('/>'));return x.slice(0,-2)+`>${reference}</inPort>`;});
gvl=edit(gvl,'FbPortUsage','e5dd53d4-fd9b-45d1-94c6-6dccd8fd4671',x=>x.replace('e38bf21e-15b3-448f-89c8-2795d5bf62db','75f42369-fbd7-49b1-a11b-18df643208ea'));
diagram=edit(diagram,'wiredLinkConnector','29b3b33c-920d-4222-80e2-684c951209b2',x=>x.replace('Id="4ae1bc42-0f66-45d2-8285-4145038d940c"','Id="06ad6e3e-ac4d-4533-ad3e-049af5e1fe21"').replaceAll(': 50.945',': 52.025'));
const preflight=inspectNativeSalStructure(sal),bindings=validateSalBindings(sal,gvl);assert.equal(preflight.status,'PASS');assert.deepEqual(bindings.errors,[]);
fs.mkdirSync(out,{recursive:true});for(const[file,value]of [['TwinSafeGroup1.sal',sal],['GVL1.sgvl',gvl],['TwinSafeGroup1.sal.diagram',diagram]])fs.writeFileSync(path.join(out,file),value);
const result={baseline,candidateInput:{sal:hash(sal),sgvl:hash(gvl),diagram:hash(diagram)},pairs,preflight,bindings:{status:bindings.status,errors:bindings.errors},crc:'Existing stored CRC values are deliberately unchanged in staging; native writers generate candidate-output CRCs.'};
fs.writeFileSync(path.join(here,'CANDIDATE_INPUT.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
