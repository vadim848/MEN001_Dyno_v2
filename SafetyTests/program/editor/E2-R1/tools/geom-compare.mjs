import fs from 'node:fs';import {parse,walk,anc} from './xmlpos.mjs';
const [a,b]=process.argv.slice(2).map(f=>walk(parse(fs.readFileSync(f,'utf8'))));
const bounds=n=>n.attr.absoluteBounds?.split(',').map(Number);
const mb=new Map(b.filter(n=>n.attr.absoluteBounds).map(n=>[n.attr.Id,n]));
const lanes={};let missing=0,same=0;
for(const n of a.filter(n=>n.attr.absoluteBounds)){const m=mb.get(n.attr.Id);if(!m){missing++;continue;}
 const x=bounds(n),y=bounds(m);const d=x.map((v,i)=>+(y[i]-v).toFixed(9));
 const lane=n.tag==='networkSwimLane'?n:anc(n,'networkSwimLane');const key=(lane?walk(lane).find(c=>c.tag==='networkMoniker').attr.name:'(root)')+(n.tag==='networkSwimLane'||n.tag.endsWith('Diagram')?' [container '+n.tag+']':'');
 const k=key+' d='+JSON.stringify(n.tag==='networkSwimLane'||n.tag.endsWith('Diagram')?d:[d[0],d[1],d[2],d[3]]);lanes[k]=(lanes[k]||0)+1;}
console.log('missing in second:',missing);for(const[k,v]of Object.entries(lanes).sort())console.log(v,k);
