import fs from 'node:fs';import crypto from 'node:crypto';
import {readBindingXml,validateSalBindings} from '../../src/sal-binding-validator.js';
const base=new URL('./',import.meta.url),repo=new URL('../../../',base),load=p=>fs.readFileSync(new URL(p,repo),'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const plan=JSON.parse(load('SafetyTests/user-decisions-architecture/LV_COMPLETION_COUNTED_PLAN.json')),input=load('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal'),ginput=load('MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl');
if(hash(input)!==plan.source.salSha256||hash(ginput)!==plan.source.sgvlSha256)throw Error('Working source precondition changed');
const initialAudit=validateSalBindings(input,ginput);if(initialAudit.status!=='PASS')throw Error('Source native audit failed');
const root=readBindingXml(input),groot=readBindingXml(ginput),walk=n=>[n,...n.children.flatMap(walk)],nodes=walk(root),gnodes=walk(groot),blocks=new Map(),ports=new Map();
for(const net of nodes.filter(n=>n.tag==='Network'))for(const w of net.children.find(n=>n.tag==='functionBlocks').children){const b=w.children[0],path=`//${net.attr.name}/${b.attr.name}`;blocks.set(path,b);for(const p of walk(b).filter(n=>['inPort','outPort'].includes(n.tag)))ports.set(path+'/'+p.attr.name,p);}
const retired=new Set(plan.retire.map(r=>r.path)),changed=new Set([...plan.bindings,...plan.deactivate].map(r=>r.target)),dead=p=>retired.has(p?.slice(0,p.lastIndexOf('/'))),targetRemoved=p=>changed.has(p)||dead(p),id=()=>crypto.randomUUID();
for(const r of plan.retire)if(blocks.get(r.path)?.attr.Id!==r.id)throw Error('Retired block identity mismatch');
for(const r of [...plan.bindings,...plan.deactivate])if(ports.get(r.target)?.attr.Id!==r.targetId)throw Error('Target identity mismatch '+r.target);
function prune(n){n.children=n.children.filter(c=>{if(c.tag==='networkHasFunctionBlocks'&&plan.retire.some(r=>r.id===c.children[0]?.attr.Id))return false;if(c.tag==='wiredLink'){const m=c.children[0];return m?.tag==='inPortMoniker'?!targetRemoved(m.attr.name):!dead(m?.attr.name);}if(c.tag==='variableUsagesHasUsages'&&walk(c).some(m=>m.tag==='inPortMoniker'&&targetRemoved(m.attr.name)))return false;return true;});for(const c of n.children)prune(c);}
prune(root);
const portPathsById=new Map([...ports].map(([path,p])=>[p.attr.Id,path]));
for(const v of gnodes.filter(n=>n.tag==='Variable'))for(const role of v.children.filter(n=>['TargetUsages','SourceUsages'].includes(n.tag)))role.children=role.children.filter(u=>!targetRemoved(portPathsById.get(u.children.find(n=>n.tag==='ModelElementId')?.text)));
const node=(tag,attr={},children=[],text='')=>({tag,attr,children,text}),append=(n,tag,c)=>{let role=n.children.find(n=>n.tag===tag);if(!role){role=node(tag);n.children.push(role);}role.children.push(c);};
const addedIds=[];function guid(){const x=id();addedIds.push(x);return x;}
for(const r of plan.deactivate){const p=ports.get(r.target);p.children=[];p.attr.channelInterface='Deactivated';}
for(const r of plan.bindings){const p=ports.get(r.target);p.children=[];p.attr.channelInterface=r.channelInterface;p.attr.deactivate1=r.deactivate1;
 if(r.source.startsWith('//')){const source=ports.get(r.source);if(!source||source.tag!=='outPort')throw Error('Missing actual wire producer '+r.source);append(source,'targetFunctionBlockPorts',node('wiredLink',{Id:guid()},[node('inPortMoniker',{name:r.target})]));}
 else{const global=gnodes.find(n=>n.tag==='Variable'&&n.children.find(n=>n.tag==='Name')?.text===r.source),alias=nodes.find(n=>n.tag==='variable'&&n.attr.name===r.source);
  if(global){p.children.push(node('fbPortGlobalVariableReferences',{},[node('functionBlockPortHasFbPortGlobalVariableReferences',{Id:guid()},[node('fbPortGlobalVariableReference',{Id:guid(),variableId:global.attr.Id,lastKnownPath:'GVL1.'+r.source})])]));append(global,'TargetUsages',node('FbPortUsage',{Id:guid()},[node('ModelElementId',{},[],p.attr.Id)]));}
  else if(alias){let usage=node('inPortMoniker',{name:r.target});for(const tag of ['fbPortUsageReferencesFunctionBlockPort','functionBlockPort','fbPortUsage','variableUsagesHasUsages','usages','variableUsages','variableHasTargetUsages'])usage=node(tag,['functionBlockPort','usages'].includes(tag)?{}:{Id:guid()},[usage]);append(alias,'targetUsages',usage);}
  else throw Error('Missing exact global/alias '+r.source);
 }
}
for(const r of plan.ordering.manifest){const b=blocks.get(r.path);if(!b||b.attr.Id!==r.id||Number(b.attr.orderOfExecution)!==r.sourceOrder)throw Error('Ordered native identity mismatch '+r.path);b.attr.orderOfExecution=String(r.order);}
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;'),render=n=>n.tag==='#document'?n.children.map(render).join(''):'<'+n.tag+Object.entries(n.attr).map(([k,v])=>' '+k+'="'+esc(v)+'"').join('')+(n.children.length||n.text.trim()?'>'+esc(n.text)+n.children.map(render).join('')+'</'+n.tag+'>':' />');
const sal=render(root),gvl=render(groot),audit=validateSalBindings(sal,gvl);
fs.writeFileSync(new URL('TwinSafeGroup1.sal',base),sal);fs.writeFileSync(new URL('GVL1.sgvl',base),gvl);
fs.writeFileSync(new URL('BUILD_MANIFEST.json',base),JSON.stringify({planVersion:plan.version,sourceSha256:hash(input),sourceSgvlSha256:hash(ginput),salSha256:hash(sal),sgvlSha256:hash(gvl),newBlockPortGlobalIds:[],newRelationshipIds:addedIds,retired:plan.retire,ordered:plan.ordering.manifest,crc:'source metadata retained, not recalculated'},null,2));fs.writeFileSync(new URL('BINDING_AUDIT.json',base),JSON.stringify(audit,null,2));console.log({status:audit.status,errors:audit.errors,salSha256:hash(sal),sgvlSha256:hash(gvl)});if(audit.status!=='PASS')process.exitCode=1;
