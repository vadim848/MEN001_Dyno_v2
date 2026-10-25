import fs from 'node:fs';import {parse,walk,anc} from './xmlpos.mjs';
const dir=process.argv[2];
const sal=fs.readFileSync(dir+'/TwinSafeGroup1.sal','utf8'),gvl=fs.readFileSync(dir+'/GVL1.sgvl','utf8');
const S=walk(parse(sal)),G=walk(parse(gvl));
const blocks=S.filter(n=>n.parent?.tag==='networkHasFunctionBlocks').map(b=>({net:anc(b,'Network').attr.name,b}));
const sel=process.argv.slice(3);
const portName=p=>`//${anc(p,'Network').attr.name}/${anc(p,'networkHasFunctionBlocks').children[0].attr.name}/${p.attr.name}`;
const ports=new Map(S.filter(n=>n.tag==='inPort'||n.tag==='outPort').map(p=>[portName(p),p]));
const wires=S.filter(n=>n.tag==='wiredLink').map(w=>({w,from:portName(w.parent.parent),to:w.children[0].attr.name}));
const varUse=S.filter(n=>n.tag==='variable').flatMap(v=>walk(v).filter(n=>n.tag.endsWith('PortMoniker')&&n.tag!=='twinSAFEGroupAliasPortMoniker').map(m=>({v:v.attr.name,role:anc(m,'targetUsages')?'target':'source',port:m.attr.name})));
const gsym=new Map(G.filter(n=>n.tag==='Variable').map(v=>[v.attr.Id,{name:walk(v).find(x=>x.tag==='Name'),v}]));
const gUse=G.filter(n=>n.tag==='ModelElementId');
for(const s of sel){const [net,bn]=s.split('/');for(const {b} of blocks.filter(x=>x.net===net&&(bn==='*'||x.b.attr.name===bn))){
  console.log(`== ${net}/${b.attr.name} ${b.tag} ord=${b.attr.orderOfExecution} id=${b.attr.Id}`);
  for(const p of walk(b).filter(n=>n.tag==='inPort'||n.tag==='outPort')){const pn=portName(p);
   const refs=walk(p).filter(n=>n.tag==='fbPortGlobalVariableReference').map(r=>r.attr.lastKnownPath);
   const wi=wires.filter(x=>x.to===pn).map(x=>'<-'+x.from),wo=wires.filter(x=>x.from===pn).map(x=>'->'+x.to);
   const vu=varUse.filter(x=>x.port===pn).map(x=>`var:${x.v}(${x.role})`);
   const gu=gUse.filter(x=>sal&&x.parent&&x.children.length===0&&false);
   const gs=G.filter(n=>n.tag==='ModelElementId').filter(n=>gvl.slice(n.openEnd,n.end-'</ModelElementId>'.length).trim()===p.attr.Id).map(n=>{const v=anc(n,'Variable');const nm=walk(v).find(x=>x.tag==='Name');return 'sgvl:'+gvl.slice(nm.openEnd,nm.end-7)+'('+(anc(n,'SourceUsages')?'src':'tgt')+')';});
   const ci=p.attr.channelInterface??'', d=p.attr.deactivate1??'';
   if(refs.length||wi.length||wo.length||vu.length||gs.length||ci==='Activated')console.log(`  ${p.attr.name} ${ci} ${d} ${[...refs,...wi,...wo,...vu,...gs].join(' ')}`);}
}}
