import fs from 'node:fs';import {parse,walk,anc} from './xmlpos.mjs';
const [dir,...names]=process.argv.slice(2);const sal=fs.readFileSync(dir+'/TwinSafeGroup1.sal','utf8');const S=walk(parse(sal));
const portName=p=>`//${anc(p,'Network').attr.name}/${anc(p,'networkHasFunctionBlocks').children[0].attr.name}/${p.attr.name}`;
const ports=new Map(S.filter(n=>n.tag==='inPort'||n.tag==='outPort').map(p=>[portName(p),p]));
for(const v of S.filter(n=>n.tag==='variable'&&(names.length===0||names.includes(n.attr.name)))){
 const us=walk(v).filter(n=>/Usage$/.test(n.tag));
 console.log(v.attr.name, us.map(u=>{const r=anc(u,'targetUsages')?'T':'S';const m=walk(u).find(n=>n.tag.endsWith('Moniker'));const p=m&&ports.get(m.attr.name);return r+':'+(m?m.attr.name:u.tag)+(p?`[f${p.attr.filter}${p.attr.deactivate1?'/'+p.attr.deactivate1.split(' ')[0]:''}]`:'');}).join(' '));}
