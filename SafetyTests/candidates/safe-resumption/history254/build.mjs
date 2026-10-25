// Isolated source-bound candidate. Never writes production files.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {readBindingXml,validateSalBindings} from '../../src/sal-binding-validator.js';
const base=new URL('./',import.meta.url), repo=new URL('../../../',base);
const read=p=>fs.readFileSync(new URL(p,repo),'utf8');
const sal=read('MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal'),gvl=read('MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl');
const plan=JSON.parse(read('SafetyTests/SAFE_RUN_GESTURE_COUNTED_PLAN.json'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
if(hash(sal)!==plan.sourceSha256)throw Error('Source SHA changed');
const P=plan.safeOnlyCandidate, root=readBindingXml(sal),gr=readBindingXml(gvl);
const walk=n=>[n,...n.children.flatMap(walk)], id=()=>crypto.randomUUID();
const node=(tag,attr={},children=[])=>({tag,attr,children,text:''});
const all=walk(root), blocks=new Map(),ports=new Map();
for(const net of all.filter(n=>n.tag==='Network'))for(const w of net.children.find(n=>n.tag==='functionBlocks').children){const b=w.children[0],p=`//${net.attr.name}/${b.attr.name}`;blocks.set(p,b);for(const x of walk(b).filter(n=>['inPort','outPort'].includes(n.tag)))ports.set(p+'/'+x.attr.name,x);}
const edges=validateSalBindings(sal,gvl).edges.map(e=>({from:e.from,to:e.to}));
const removed=new Set(P.retire.map(x=>x.path));
const names=new Map(P.newBlocks.map(b=>[b.symbol,'//SafeResumption/'+b.symbol]));
const originalPortBindings=new Map();
for(const n of all.filter(n=>n.tag==='variable'))for(const m of walk(n).filter(n=>n.tag==='inPortMoniker'))originalPortBindings.set(m.attr.name,n);
const globals=new Map(walk(gr).filter(n=>n.tag==='Variable').map(n=>[n.children.find(n=>n.tag==='Name').text,n]));
const aliases=new Map(all.filter(n=>n.tag==='variable').map(n=>[n.attr.name,n]));
const fresh=n=>{const x=node(n.tag,{...n.attr},n.children.map(fresh));x.text=n.text;if(x.attr.Id)x.attr.Id=id();return x;};
const network=node('Network',{Id:id(),name:'SafeResumption',networkName:'SafeResumption',intId:'14',networkOrderId:'13'},[node('functionBlocks')]);
for(const b of P.newBlocks){const x=fresh(blocks.get(b.template));x.attr.name=x.attr.instanceName=b.symbol;const p=names.get(b.symbol);blocks.set(p,x);network.children[0].children.push(node('networkHasFunctionBlocks',{Id:id()},[x]));for(const q of walk(x).filter(n=>['inPort','outPort'].includes(n.tag))){q.children=[];ports.set(p+'/'+q.attr.name,q);}}
all.find(n=>n.tag==='networks').children.push(node('safetyApplicationHasNetworks',{Id:id()},[network]));
const bindings=new Map();
const output=path=>{const b=blocks.get(path);return path+'/'+walk(b).find(n=>n.tag==='outPort').attr.name;};
const resolve=s=>names.has(s)?output(names.get(s)):s==='E'?output('//RndPhysicalCompact/GATE_001'):s;
function bind(target,source){const inverted=source.startsWith('!');source=resolve(inverted?source.slice(1):source);bindings.set(target,{source,inverted});}
for(const b of P.newBlocks){const path=names.get(b.symbol),x=blocks.get(path),inputs=walk(x).filter(n=>n.tag==='inPort');for(const p of inputs){p.attr.channelInterface='Deactivated';p.children=[];}if(b.inputs)b.inputs.forEach((s,i)=>bind(path+'/'+inputs[i].attr.name,s));else{bind(path+'/Reset',b.Reset);bind(path+'/Set',b.Set);}}
const R='//RndPhysicalCompact/';
P.existingEInputs.forEach((s,i)=>bind(R+'GATE_001/AndIn'+(i+1),s));
for(const p of walk(blocks.get(R+'GATE_001')).filter(n=>n.tag==='inPort'))p.attr.channelInterface='Deactivated';
const replacements=new Map([[R+'GATE_017/AndOut',R+'GREEN/TonOut'],[R+'GATE_018/AndOut',R+'BLUE/TonOut'],[R+'GATE_020/AndOut',R+'BOTH/TonOut']]);
for(const e of edges)if(replacements.has(e.from)&&!removed.has(e.to.slice(0,e.to.lastIndexOf('/'))))bind(e.to,replacements.get(e.from));
bind(R+'STATE_SU/Reset','!RND_SCOPE');bind(R+'STATE_SG/Set','SG_OWNER_SET');
bind(R+'GATE_030/OrIn1',R+'GREEN/TonOut');bind(R+'GATE_030/OrIn2',R+'BLUE/TonOut');bind(R+'GATE_030/OrIn3',R+'STATE_SU/RsOut');bind(R+'GATE_030/OrIn4','SAFE_ACCEPTED_UP');
// Retain original input slots for And4 readiness; replace only old physical timer.
const oldTimer='//Network2/FBTon3/TonOut';
for(const e of edges.filter(e=>e.to.startsWith('//Network2/FBAnd4/')&&e.from===oldTimer))bind(e.to,R+'BOTH/TonOut');
const and4=blocks.get('//Network2/FBAnd4'),free=walk(and4).filter(n=>n.tag==='inPort').find(p=>p.attr.channelInterface==='Deactivated');if(!free)throw Error('And4 has no free input');bind('//Network2/FBAnd4/'+free.attr.name,'SAFE_UP_SCOPE');
for(const e of edges.filter(e=>e.from==='//Network2/FBAnd4/AndOut'))bind(e.to,'SAFE_ACCEPTED_UP');
const blue=originalPortBindings;
for(const [p,v]of blue)if(p.startsWith('//Network2/FBAnd7/')&&v.attr.name==='in_Relase_Door_PB')bind(p,R+'STATE_BA/RsOut');
// Remove stale usage records and wire relationships for every replaced/retired port.
const deadPath=p=>removed.has(p?.slice(0,p.lastIndexOf('/'))), changed=p=>bindings.has(p)||deadPath(p);
function prune(n){n.children=n.children.filter(c=>{if(c.tag==='networkHasFunctionBlocks'&&removed.has([...blocks].find(([,b])=>b===c.children[0])?.[0]))return false;if(c.tag==='wiredLink'){const m=c.children[0];return m?.tag==='inPortMoniker'?!changed(m.attr.name):!deadPath(m?.attr.name);}if(c.tag==='variableUsagesHasUsages'&&walk(c).some(m=>m.tag==='inPortMoniker'&&changed(m.attr.name)))return false;return true;});for(const c of n.children)prune(c);}
prune(root);
for(const [p,n]of ports)if(bindings.has(p)){n.children=[];const b=bindings.get(p);n.attr.channelInterface='Activated';n.attr.deactivate1=b.inverted?'Make Contact (NO)':'Break Contact (NC)';}
function append(n,tag,c){let x=n.children.find(n=>n.tag===tag);if(!x){x=node(tag);n.children.push(x);}x.children.push(c);}
for(const [target,{source}]of bindings){const p=ports.get(target);if(!p)throw Error('Missing '+target);if(source.startsWith('//')){const s=ports.get(source);if(!s)throw Error('Missing source '+source);append(s,'targetFunctionBlockPorts',node('wiredLink',{Id:id()},[node('inPortMoniker',{name:target})]));}else if(globals.has(source)){const g=globals.get(source);p.children.push(node('fbPortGlobalVariableReferences',{},[node('functionBlockPortHasFbPortGlobalVariableReferences',{Id:id()},[node('fbPortGlobalVariableReference',{Id:id(),variableId:g.attr.Id,lastKnownPath:'GVL1.'+source})])]));append(g,'TargetUsages',node('FbPortUsage',{Id:id()},[Object.assign(node('ModelElementId'),{text:p.attr.Id})]));}else if(aliases.has(source)){append(aliases.get(source),'targetUsages',node('variableHasTargetUsages',{Id:id()},[node('variableUsages',{Id:id()},[node('usages',{},[node('variableUsagesHasUsages',{Id:id()},[node('fbPortUsage',{Id:id()},[node('functionBlockPort',{},[node('fbPortUsageReferencesFunctionBlockPort',{Id:id()},[node('inPortMoniker',{name:target})])])])])])])]));}else throw Error('Unknown source '+source);}
// Remove SGVL port usages which no longer refer to an unchanged global binding.
const oldIds=new Map([...ports].map(([p,n])=>[n.attr.Id,p]));
for(const g of walk(gr).filter(n=>n.tag==='Variable'))for(const role of g.children.filter(n=>['TargetUsages','SourceUsages'].includes(n.tag)))role.children=role.children.filter(u=>{const pid=u.children.find(n=>n.tag==='ModelElementId')?.text,p=oldIds.get(pid);return !p||(!deadPath(p)&&(!bindings.has(p)||bindings.get(p).source===g.children.find(n=>n.tag==='Name').text));});
for(const row of P.ordering.manifest){const path=names.get(row.path)??row.path;const b=blocks.get(path);if(!b)throw Error('Manifest missing '+JSON.stringify(row));b.attr.orderOfExecution=String(row.order);}
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const render=n=>n.tag==='#document'?n.children.map(render).join(''): '<'+n.tag+Object.entries(n.attr).map(([k,v])=>' '+k+'="'+esc(v)+'"').join('')+(n.children.length||n.text.trim()? '>'+esc(n.text)+n.children.map(render).join('')+'</'+n.tag+'>':' />');
const candidate=render(root),candidateGvl=render(gr),audit=validateSalBindings(candidate,candidateGvl);
fs.writeFileSync(new URL('TwinSafeGroup1.sal',base),candidate);fs.writeFileSync(new URL('GVL1.sgvl',base),candidateGvl);
fs.writeFileSync(new URL('binding-audit.json',base),JSON.stringify({sourceSha256:hash(sal),candidateSha256:hash(candidate),...audit},null,2));
console.log({status:audit.status,errors:audit.errors});

