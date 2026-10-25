import fs from 'node:fs';import crypto from 'node:crypto';import {readBindingXml,validateSalBindings} from '../../src/sal-binding-validator.js';
const base='SafetyTests/network-symbol-repair/editor',walk=n=>[n,...n.children.flatMap(walk)],hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const result={};
for(const filename of ['TwinSafeGroup1.sal','GVL1.sgvl']){
 const a=fs.readFileSync(`${base}/candidate-native-bindings/${filename}`,'utf8'),b=fs.readFileSync(`${base}/native-output/${filename}`,'utf8');
 const an=walk(readBindingXml(a)),bn=walk(readBindingXml(b)),am=new Map(an.filter(n=>n.attr?.Id).map(n=>[n.attr.Id,n])),bm=new Map(bn.filter(n=>n.attr?.Id).map(n=>[n.attr.Id,n])),differences=[];
 for(const[id,n]of am){const m=bm.get(id);if(!m){differences.push({id,tag:n.tag,removed:true});continue;}if(n.tag!==m.tag)differences.push({id,tagBefore:n.tag,tagAfter:m.tag});for(const key of new Set([...Object.keys(n.attr),...Object.keys(m.attr)]))if(n.attr[key]!==m.attr[key])differences.push({id,tag:n.tag,name:n.attr.name,key,before:n.attr[key],after:m.attr[key]});}
 for(const[id,n]of bm)if(!am.has(id))differences.push({id,tag:n.tag,added:true});
 const leafTexts=nodes=>nodes.filter(n=>!n.children.length).map(n=>{let p=n,key=n.tag;while(p.parent){p=p.parent;key=p.tag+(p.attr?.Id?`#${p.attr.Id}`:'')+'/'+key;}return[key,n.text.trim()];}).sort((x,y)=>JSON.stringify(x).localeCompare(JSON.stringify(y)));
 result[filename]={inputSha256:hash(a),outputSha256:hash(b),idCountBefore:am.size,idCountAfter:bm.size,differences,leafTextsEqual:JSON.stringify(leafTexts(an))===JSON.stringify(leafTexts(bn))};
}
result.bindings=validateSalBindings(fs.readFileSync(`${base}/native-output/TwinSafeGroup1.sal`,'utf8'),fs.readFileSync(`${base}/native-output/GVL1.sgvl`,'utf8'));
fs.writeFileSync(`${base}/NATIVE_SERIALIZATION_DELTA.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,bindings:{status:result.bindings.status,errors:result.bindings.errors,warnings:result.bindings.warnings}},null,2));
