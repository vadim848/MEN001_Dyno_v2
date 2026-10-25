import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {parseSalFile} from '../../src/sal-parser.js';import {readBindingXml} from '../../src/sal-binding-validator.js';import {inspectNativeSalStructure} from '../../src/sal-native-structure.js';
const root=new URL('../../../',import.meta.url),out=new URL('./',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex');
const ledger=JSON.parse(read('SafetyTests/resumed-development-2026-10-21/architect/P0_REBASE_LEDGER.json')),base='SafetyTests/candidates/resumed-p0/native/',walk=n=>[...(n.attr?[n]:[]),...n.children.flatMap(walk)];
const a=parseSalFile(new URL(ledger.source.sal,root),{bindingMode:'current'}),b=parseSalFile(new URL(base+'TwinSafeGroup1.sal',root),{bindingMode:'current',sgvlPath:new URL(base+'GVL1.sgvl',root)});
const preflight=inspectNativeSalStructure(read(base+'TwinSafeGroup1.sal'));assert.equal(preflight.status,'PASS');assert.deepEqual(preflight.counts,{networks:14,blocks:241,ports:2066,variables:75,wires:306,crossNetworkWires:0});assert.equal(b.bindingAudit.globalRefs.length,206);
const key=e=>e.from+'|'+e.to;assert.deepEqual(b.bindingAudit.edges.map(key).sort(),ledger.expectedCanonicalWires.map(key).sort());
const aa=walk(readBindingXml(read(ledger.source.sal))),bb=walk(readBindingXml(read(base+'TwinSafeGroup1.sal'))),byId=new Map(bb.filter(n=>n.attr.Id).map(n=>[n.attr.Id,n]));
const retired=new Set(ledger.retired.map(x=>x.id)),insideRetired=n=>{if(n.tag==='networkHasFunctionBlocks'&&n.children.some(c=>retired.has(c.attr?.Id)))return true;for(let p=n;p;p=p.parent)if(retired.has(p.attr?.Id))return true;return false;};
const active=new Set(['//RndPhysicalCompact/GATE_025/AndIn3','//RndPhysicalCompact/GATE_026/AndIn3','//RndPhysicalCompact/GATE_029/OrIn4','//Network7/FBAnd8/AndIn3','//Network7/FBAnd8/AndIn4']);
const ports=a.networks.flatMap(n=>n.blocks.flatMap(b=>[...b.inputs,...b.outputs])),activatedIds=new Set(ports.filter(p=>active.has(p.path)).map(p=>p.Id));
let retainedAttributes=0;
for(const n of aa.filter(n=>n.attr.Id&&!insideRetired(n)&&!['wiredLink','variableUsagesHasUsages','fbPortUsage','fbPortUsageReferencesFunctionBlockPort'].includes(n.tag))){
 const q=byId.get(n.attr.Id);assert(q,`Missing retained object ${n.tag} ${n.attr.Id}`);
 const attrs=x=>{const d={...x.attr};delete d.Crc;delete d.orderOfExecution;if(activatedIds.has(n.attr.Id)){delete d.channelInterface;delete d.deactivate1;}return d;};assert.deepEqual(attrs(q),attrs(n),`Retained attributes ${n.tag} ${n.attr.Id}`);retainedAttributes++;
}
const normalize=n=>({tag:n.tag,attr:n.attr,text:n.text,children:n.children.map(normalize)});
const nonprogram=ns=>ns.filter(n=>/Usage$/.test(n.tag)&&n.tag!=='fbPortUsage').map(n=>JSON.stringify(normalize(n))).sort();assert.deepEqual(nonprogram(bb),nonprogram(aa));
// Verify complete Symbol native wrappers including group/device usage records,
// applying only the four allowed moniker moves and two retired complement readers.
const norm=n=>({tag:n.tag,attr:Object.fromEntries(Object.entries(n.attr??{}).filter(([k])=>k!=='Crc')),text:n.text.trim(),children:n.children.map(norm)});
for(const v of aa.filter(n=>n.tag==='variable')){
 const expected=structuredClone(norm(v));
 const rewrite=n=>{n.children=n.children.filter(c=>!(c.tag==='variableUsagesHasUsages'&&JSON.stringify(c).includes('STATE_Prev')&&JSON.stringify(c).includes('/Reset')));for(const m of ledger.wireDelta.aliasReaderMoves)if(n.attr.name===m.oldLogicReader)n.attr.name=m.newLogicReader;n.children.forEach(rewrite);};rewrite(expected);
 assert.deepEqual(norm(byId.get(v.attr.Id)),expected,`Complete Symbol wrappers ${v.attr.name}`);
}
const portMoves=JSON.parse(read('SafetyTests/resumed-development-2026-10-21/editor/PORT_MOVES.json')),retiredIds=new Set(ports.filter(p=>ledger.retired.some(r=>p.path.startsWith(r.path+'/'))).map(p=>p.Id));
const expectedGvl=norm(readBindingXml(read(ledger.source.sgvl)).children[0]);
const rewriteGvl=n=>{n.children=n.children.filter(c=>!(c.tag==='FbPortUsage'&&c.children.some(v=>retiredIds.has(v.text)&&!portMoves[v.text])));if(n.tag==='ModelElementId'&&portMoves[n.text])n.text=portMoves[n.text];n.children.forEach(rewriteGvl);};rewriteGvl(expectedGvl);
assert.deepEqual(norm(readBindingXml(read(base+'GVL1.sgvl')).children[0]),expectedGvl,'Complete SGVL exact program-use substitutions only');
const inventory=ns=>ns.filter(n=>n.tag==='variable').map(n=>({id:n.attr.Id,name:n.attr.name})).sort((a,b)=>a.id.localeCompare(b.id));assert.deepEqual(inventory(bb),inventory(aa));
const da=walk(readBindingXml(read(ledger.source.sal+'.diagram'))),db=walk(readBindingXml(read(base+'TwinSafeGroup1.sal.diagram'))),di=new Map(db.filter(n=>n.attr.absoluteBounds).map(n=>[n.attr.Id,n]));let geometry=0;
for(const n of da.filter(n=>n.attr.absoluteBounds)){const path=n.children.find(n=>n.attr.name)?.attr.name;if(path&&ledger.retired.some(r=>path===r.path||path.startsWith(r.path+'/')))continue;const q=di.get(n.attr.Id);assert(q,`Missing shape ${n.attr.Id}`);assert.equal(q.attr.absoluteBounds,n.attr.absoluteBounds,`Geometry ${n.attr.Id}`);geometry++;}
const orders=b.networks.flatMap(n=>n.blocks).sort((a,b)=>a.orderOfExecution-b.orderOfExecution).map(b=>({path:b.path,new:b.orderOfExecution}));assert.deepEqual(orders,ledger.retainedOrder.map(({path,new:n})=>({path,new:n})));
const report={status:'PASS',source:ledger.source,candidate:Object.fromEntries(['TwinSafeGroup1.sal','GVL1.sgvl','TwinSafeGroup1.sal.diagram'].map(p=>[p,{path:base+p,sha256:hash(base+p)}])),preflight,globalRefs:b.bindingAudit.globalRefs.length,retainedAttributes,nonprogramUsages:nonprogram(bb).length,retainedGeometry:geometry,allowedContactActivations:[...active],limits:'Editor structural selfchecks only. Independent paired/regression tests and candidate review required; known functional failures remain.'};
fs.writeFileSync(new URL('SELF_CHECK.json',out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
