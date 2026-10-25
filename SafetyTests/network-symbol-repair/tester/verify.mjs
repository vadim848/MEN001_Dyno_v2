import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {readBindingXml,validateSalBindings} from '../../src/sal-binding-validator.js';
const here=import.meta.dirname,base=path.join(here,'baseline');
const bp=path.join(base,'TwinSafeGroup1.sal'),bg=path.join(base,'GVL1.sgvl');
const cp=path.resolve(process.argv[2]??'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal'),cg=path.resolve(process.argv[3]??'MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),walk=n=>[n,...n.children.flatMap(walk)],up=(n,t)=>{for(let p=n.parent;p;p=p.parent)if(p.tag===t)return p;};
const cross=e=>e.from.split('/')[2]!==e.to.split('/')[2];
function read(s,g){const sx=fs.readFileSync(s,'utf8'),gx=fs.readFileSync(g,'utf8'),sal=readBindingXml(sx),gvl=readBindingXml(gx),sn=walk(sal),gn=walk(gvl),audit=validateSalBindings(sx,gx);assert.equal(audit.status,'PASS',audit.errors.join('\n'));
 const ports=new Map(sn.filter(n=>['inPort','outPort'].includes(n.tag)).map(n=>[n.attr.Id,n]));const pp=n=>`//${up(n,'Network').attr.name}/${up(n,'networkHasFunctionBlocks').children[0].attr.name}/${n.attr.name}`;
 const refs=sn.filter(n=>n.tag==='fbPortGlobalVariableReference').map(n=>({node:n,port:up(n,'inPort')??up(n,'outPort'),symbol:n.attr.variableId}));
 const vars=new Map(gn.filter(n=>n.tag==='Variable').map(n=>[n.attr.Id,n]));
 const semantic=new Set(audit.edges.map(e=>`${e.from}->${e.to}`));
 const aliases=sn.filter(n=>n.tag==='variable');for(const v of aliases){const ms=walk(v).filter(n=>['inPortMoniker','outPortMoniker'].includes(n.tag)),src=ms.filter(n=>n.tag==='outPortMoniker'),dst=ms.filter(n=>n.tag==='inPortMoniker');assert.ok(src.length<=1,`multiple alias writers ${v.attr.Id}`);for(const a of src)for(const z of dst)semantic.add(`${a.attr.name}->${z.attr.name}`);}
 for(const[id,v]of vars){const rr=refs.filter(r=>r.symbol===id),sources=rr.filter(r=>r.port.tag==='outPort'),targets=rr.filter(r=>r.port.tag==='inPort');assert.ok(sources.length<=1,`multiple symbol writers ${id}`);
  for(const source of sources)for(const target of targets)semantic.add(`${pp(source.port)}->${pp(target.port)}`);
  const names=v.children.filter(n=>n.tag==='Name');assert.equal(names.length,1,`name ${id}`);assert.ok(names[0].text.trim());
  for(const [tag,direction]of [['SourceUsages','outPort'],['TargetUsages','inPort']]){const containers=v.children.filter(n=>n.tag===tag);assert.ok(containers.length<=1,`duplicate usage container ${id} ${tag}`);const expected=rr.filter(r=>r.port.tag===direction).map(r=>r.port.attr.Id).sort(),actual=[];
   for(const c of containers)for(const u of c.children){assert.equal(u.tag,'FbPortUsage');assert.equal(u.children.length,1);assert.equal(u.children[0].tag,'ModelElementId');const pid=u.children[0].text.trim();assert.equal(ports.get(pid)?.tag,direction,`usage direction ${pid}`);actual.push(pid);}
   assert.equal(new Set(actual).size,actual.length,`duplicate usage ${id}`);assert.deepEqual(actual.sort(),expected,`complete exact usage index ${id} ${tag}`);
  }
 }
 assert.equal(new Set([...vars.values()].map(v=>v.children.find(n=>n.tag==='Name').text.trim())).size,vars.size,'unique symbol names');
 return{sal,gvl,sn,gn,audit,ports,refs,vars,semantic,pp};}
function canonical(n,skip){if(skip(n))return null;return {tag:n.tag,attr:n.attr??{},text:n.text.trim(),children:n.children.map(c=>canonical(c,skip)).filter(Boolean)};}
const result={capturedAt:new Date().toISOString(),baselineSalSha256:hash(bp),baselineSgvlSha256:hash(bg),candidateSalSha256:hash(cp),candidateSgvlSha256:hash(cg),checks:[]};
function check(name,fn){try{const detail=fn();result.checks.push({name,status:'PASS',detail});}catch(e){result.checks.push({name,status:'FAIL',error:e.message});}}
let b,c;check('full source binding namespace wrappers symbol indices and single writer',()=>{b=read(bp,bg);c=read(cp,cg);return{beforeWires:b.audit.edges.length,afterWires:c.audit.edges.length,baselineCrossNetwork:b.audit.edges.filter(cross).length};});
if(b&&c){const removed=new Set(b.audit.edges.filter(cross).map(e=>e.id)),bids=new Set(b.sn.map(n=>n.attr?.Id).filter(Boolean)),gids=new Set(b.gn.map(n=>n.attr?.Id).filter(Boolean));
 check('planned ordinary symbols and exact single source/multi-target allocation',()=>{
  const plan=JSON.parse(fs.readFileSync(path.join(here,'../architect/SYMBOL_PLAN.json'))).plan;
  const oldVars=new Set(b.sn.filter(n=>n.tag==='variable').map(n=>n.attr.Id)),vars=c.sn.filter(n=>n.tag==='variable'),added=vars.filter(n=>!oldVars.has(n.attr.Id));
  assert.equal(vars.length,75);assert.equal(added.length,11);assert.equal(new Set(vars.map(v=>v.attr.name)).size,vars.length);assert.ok(added.every(v=>v.parent.tag==='safetyApplicationHasVariables'));assert.equal(c.refs.length-b.refs.length,6);assert.equal(c.vars.size,b.vars.size);
  assert.deepEqual(added.map(v=>v.attr.name).sort(),plan.filter(p=>p.mechanism==='new-sal-symbol').map(p=>p.symbolName).sort());
  for(const p of plan.filter(p=>p.mechanism!=='reuse-sgvl-symbol')){const v=vars.find(n=>n.attr.name===p.symbolName);assert.ok(v,`missing ${p.symbolName}`);assert.equal(v.attr.isLocal,'false');
   const all=walk(v);if(!oldVars.has(v.attr.Id)){assert.deepEqual(Object.keys(v.attr).sort(),['Id','isLocal','name']);assert.deepEqual(all.filter(n=>n.tag==='outPortMoniker').map(n=>n.attr.name),[p.from]);assert.deepEqual(all.filter(n=>n.tag==='inPortMoniker').map(n=>n.attr.name).sort(),p.targets.slice().sort());assert.ok(all.every(n=>!['aliasDeviceIoUsage','aliasDeviceIoUsage','twinSAFEGroupAliasPortMoniker'].includes(n.tag)));}
  }
 });
 check('zero graphical cross-network wires',()=>assert.deepEqual(c.audit.edges.filter(cross),[]));
 check('exact normalized direct and global-symbol endpoint graph equivalence',()=>assert.deepEqual([...c.semantic].sort(),[...b.semantic].sort()));
 check('preserve every original SAL node attribute ordering and local wire; only remove cross wires add global refs',()=>{
  const strip=n=>removed.has(n.attr?.Id)||n.tag==='targetFunctionBlockPorts'&&!n.children.some(x=>!removed.has(x.attr.Id));
  const cstrip=n=>strip(n)||(n.tag==='safetyApplicationHasVariables'&&!bids.has(n.attr.Id))||(n.tag==='variableUsagesHasUsages'&&!bids.has(n.attr.Id))||(n.attr?.Id&&!bids.has(n.attr.Id)&&['functionBlockPortHasFbPortGlobalVariableReferences','fbPortGlobalVariableReference'].includes(n.tag))||n.tag==='fbPortGlobalVariableReferences'&&n.children.every(x=>!bids.has(x.attr.Id));
  assert.deepEqual(canonical(c.sal,cstrip),canonical(b.sal,strip));
 });
 check('existing SGVL definitions identity metadata and usage records immutable; only append usages or new symbols',()=>{
  const additions=c.gn.filter(n=>n.tag==='Variable'&&!gids.has(n.attr.Id));
  assert.equal(additions.length,0);for(const v of additions){assert.deepEqual(Object.keys(v.attr).sort(),['Id']);assert.deepEqual(v.children.map(x=>x.tag).sort(),['Name','SourceUsages','TargetUsages']);}
  const skip=n=>n.attr?.Id&&!gids.has(n.attr.Id)&&['Variable','FbPortUsage'].includes(n.tag);
  assert.deepEqual(canonical(c.gvl,skip),canonical(b.gvl,()=>false));return{newSymbols:additions.length};
 });
 check('new references limited to exact baseline cross-wire endpoints and source producer',()=>{
  const endpoints=new Set(b.audit.edges.filter(cross).flatMap(e=>[e.from,e.to]));
  const original=new Set(b.refs.map(r=>r.node.attr.Id));
  for(const r of c.refs.filter(r=>!original.has(r.node.attr.Id)))assert.ok(endpoints.has(c.pp(r.port)),`unexpected added binding ${c.pp(r.port)}`);
  for(const e of b.audit.edges.filter(cross))assert.ok(c.semantic.has(`${e.from}->${e.to}`),`unbridged ${e.from}->${e.to}`);
 });}
result.status=result.checks.every(r=>r.status==='PASS')?'PASS':'FAIL';const output=path.join(here,process.argv[4]??'INDEPENDENT_RESULTS.json');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=result.status==='PASS'?0:1;

