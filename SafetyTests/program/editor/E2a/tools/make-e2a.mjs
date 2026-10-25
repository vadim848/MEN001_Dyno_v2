// E2a-core staging: textual, structure-preserving edit of candidate R1 per
// program/architect/E2-status/PLAN.md v4 section 3 E2a (items 1-3, 5) WITHOUT
// E2a-RC (item 4) and E2a-PLC, plus the lead's E2a-core composition:
//   - g7 in Reset S1: Network3/FBOr1.OrIn4 := b_Step4_Set (PLAN E2b item 7, B3-4);
//   - order moves B3-1/B3-2: Network12/FBAnd16, SafeResumption/CONNECTORS,
//     SafeResumption/CONNECTOR_SCOPE before Network1/FBAnd1 (PLAN section 2.2).
// Stored CRC values are NOT touched; native writers regenerate them.
// New block / wire presentations are NOT written here: native FixUpDiagram creates them
// (same approach as the accepted F1 build). Removed blocks/wires lose their shapes/connectors.
// Usage: node make-e2a.mjs <sourceDir> <stagedDir>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse, walk, anc, lineRange, applyEdits} from './xmlpos.mjs';

const [srcDir, outDir] = process.argv.slice(2);
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const read = f => fs.readFileSync(path.join(srcDir, f), 'utf8');
let sal = read('TwinSafeGroup1.sal'), gvl = read('GVL1.sgvl'), dia = read('TwinSafeGroup1.sal.diagram');
const EXPECT = {sal: 'ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3', sgvl: '4f205138337ea3de3660d5ef2d8978db438e3e8d19f2e9dd393ec7a5816cdb36', diagram: 'b82aa41a6ee065267852d78ccaff961714eca1e8e8c006f087de715fb2a137b6'};
assert.equal(hash(sal), EXPECT.sal); assert.equal(hash(gvl), EXPECT.sgvl); assert.equal(hash(dia), EXPECT.diagram);
const PLAN_SHA = 'b90eff7c4045a638a6822bbff022459565f552b2e2b39ea295c6693bc640b4fd'; // PLAN.md v5 (E2a-core unchanged vs v4 c57da896…; v4 kept as PLAN.v4.md)
assert.equal(hash(fs.readFileSync(new URL('../../../architect/E2-status/PLAN.md', import.meta.url))), PLAN_SHA, 'PLAN.md changed');
const guid = label => {const h = hash('E2a-core/' + label); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${'89ab'[parseInt(h[16], 16) & 3]}${h.slice(17, 20)}-${h.slice(20, 32)}`;};
const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';

// ---------------- plan (E2a-core) ----------------
const DELETE_BLOCKS = ['Network3/FBOr6', 'Network3/FBOr11'];
const NEW_BLOCKS = [
  {net: 'Network6', name: 'HEALTHY_OK', fn: 'safeAnd', template: 'Network6/FBAnd9',
    inputs: {AndIn1: {variable: 'in_LV_Healthy_FBK', contact: NO}, AndIn2: {variable: 'in_HV_Healthy_FBK', contact: NO}}},
  {net: 'Network6', name: 'HEALTH_GUARD', fn: 'safeOr', template: 'Network6/FBOr5',
    inputs: {OrIn1: {wire: 'Network6/RUN_DOWN_OWNER/RsOut', contact: NC}, OrIn2: {wire: 'Network6/HEALTHY_OK/AndOut', contact: NC}}},
];
// input port final source: {symbol}|{wire: outPortKey}|{variable (moved usage)}|{deactivate:true}; contact optional (keep if absent)
const INPUTS = [
  ['Network3/FBOr1/OrIn3', {symbol: 'b_Step12_Set'}, 'g2 -> Reset S1'],
  ['Network3/FBOr1/OrIn4', {symbol: 'b_Step4_Set'}, 'g7 -> Reset S1 (B3-4, lead E2a-core)'],
  ['Network3/FBOr5/OrIn2', {symbol: 'b_Step4_Set'}, 'g7 -> Reset S3'],
  ['Network3/FBOr7/OrIn2', {symbol: 'b_Step5_Set'}, 'g8 -> Reset S4'],
  ['Network3/FBOr9/OrIn2', {symbol: 'b_Step6_Set'}, 'g9 -> Reset S5'],
  ['Network3/FBRs6/Reset', {wire: 'Network3/FBOr2/OrOut'}, 'Reset S6 := wire FBOr2'],
  ['Network3/FBRs8/Set', {symbol: 'b_Step12_Set'}, 'g2 -> Set S12'],
  ['Network3/FBOr16/OrIn1', {symbol: 'b_Step_RnD_Set'}, 'g3 -> Set SR'],
  ['Network3/FBRs7/Set', {wire: 'Network3/FBOr16/OrOut'}, 'Set SR := wire FBOr16'],
  ['Network3/FBRs3/Set', {symbol: 'b_Step3_Set_2'}, 'g4 -> Set S3'],
  ['Network3/FBOr13/OrIn2', {symbol: 'b_Step4_Set'}, 'g7 -> Reset SR'],
  ['Network6/FBAnd18/AndIn4', {wire: 'Network6/FBAnd1/AndOut', contact: NC}, 'FBAnd18.AndIn4 := wire N6/FBAnd1'],
  ['Network6/RUN_DOWN_RESET/OrIn1', {symbol: 'b_Step12_Set_2'}, 'RUN_DOWN_RESET.OrIn1 := g6'],
  ['Network7/FBAnd8/AndIn5', {symbol: 'b_Step4', contact: NC}, 'FBAnd8.AndIn5 := b_Step4'],
  ['Network6/FBAnd9/AndIn6', {wire: 'Network6/HEALTH_GUARD/OrOut', contact: NC}, 'FBAnd9.AndIn6 := wire HEALTH_GUARD'],
  ['Network6/FBAnd9/AndIn7', {deactivate: true}, 'FBAnd9.AndIn7 deactivated'],
  ['Network11/FBAnd4/AndIn3', {keep: true, contact: NO}, 'D-ARCH-POL: NC -> NO'],
];
// SAL variable target usages re-pointed (usage element kept, moniker moved)
const VAR_MOVES = [
  ['in_LV_Healthy_FBK', '//Network6/FBAnd9/AndIn6', '//Network6/HEALTHY_OK/AndIn1'],
  ['in_HV_Healthy_FBK', '//Network6/FBAnd9/AndIn7', '//Network6/HEALTHY_OK/AndIn2'],
];
const RENAMES = [['in_LV_Healthy_FBK', 'in_LV_Faulty_FBK'], ['in_HV_Healthy_FBK', 'in_HV_Faulty_FBK'], ['outPLC_LV_Healthy', 'outPLC_LV_Faulty'], ['outPLC_HV_Healthy', 'outPLC_HV_Faulty']];
const HEAD = ['Network3/FBOr2', 'Network3/FBOr1', 'Network3/FBOr16', 'Network3/FBOr13', 'Network3/FBOr5', 'Network3/FBOr7', 'Network3/FBOr9', 'Network3/FBRs1', 'Network3/FBRs8', 'Network3/FBRs7', 'Network3/FBRs3', 'Network3/FBRs4', 'Network3/FBRs5', 'Network3/FBRs6'];

const log = [];
// ---------------- SAL model ----------------
const S = walk(parse(sal));
const blockOf = p => anc(p, 'networkHasFunctionBlocks')?.children[0];
const pkey = p => `${anc(p, 'Network').attr.name}/${blockOf(p).attr.name}/${p.attr.name}`;
const blocks = new Map(S.filter(n => n.parent?.tag === 'networkHasFunctionBlocks').map(b => [`${anc(b, 'Network').attr.name}/${b.attr.name}`, b]));
assert.equal(blocks.size, 215);
const ports = new Map(S.filter(n => n.tag === 'inPort' || n.tag === 'outPort').map(p => [pkey(p), p]));
assert.equal(ports.size, 1832);
const G0 = walk(parse(gvl));
const gtext = n => gvl.slice(n.openEnd, n.end - `</${n.tag}>`.length).trim();
const symbolsByName = new Map(G0.filter(n => n.tag === 'Variable').map(v => [gtext(v.children.find(c => c.tag === 'Name')), v]));
assert.equal(symbolsByName.size, 65);
const wires = S.filter(n => n.tag === 'wiredLink').map(w => ({w, from: pkey(w.parent.parent), to: w.children[0].attr.name.slice(2)}));
for (const b of DELETE_BLOCKS) assert(blocks.has(b), b);

const edits = [];
const removedWireIds = new Set();
const sgvlRemove = []; // {symbol, portId}
const sgvlAdd = []; // {symbol, portId, label}
const deletedPortKeys = new Set(), deletedPortIds = new Set();
// 1. delete blocks
for (const k of DELETE_BLOCKS) {
  const b = blocks.get(k);
  for (const p of walk(b).filter(n => n.tag === 'inPort' || n.tag === 'outPort')) {
    deletedPortKeys.add(pkey(p)); deletedPortIds.add(p.attr.Id);
    for (const r of walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference')) sgvlRemove.push({symbol: r.attr.lastKnownPath.replace('GVL1.', ''), portId: p.attr.Id, why: 'deleted block ' + k});
  }
  for (const wl of walk(b).filter(n => n.tag === 'wiredLink')) removedWireIds.add(wl.attr.Id);
  // no SAL variable usage may reference a deleted port
  assert(!S.filter(n => n.tag.endsWith('PortMoniker')).some(m => !anc(m, 'networkHasFunctionBlocks') && deletedPortKeys.has(m.attr.name.slice(2))), 'variable usage on deleted block ' + k);
  edits.push([...lineRange(sal, b.parent), '']);
  log.push({deleteBlock: k, wires: walk(b).filter(n => n.tag === 'wiredLink').map(w => w.children[0].attr.name)});
}
// 2. per out-port wire deltas
const outDrop = new Map(), outAdd = new Map();
const push = (m, k, v) => {if (!m.has(k)) m.set(k, []); m.get(k).push(v);};
for (const {w, from, to} of wires) if (deletedPortKeys.has(to) && !deletedPortKeys.has(from)) {push(outDrop, from, w); removedWireIds.add(w.attr.Id); log.push({dropWire: `${from} -> ${to}`, reason: 'target block deleted'});}
// 3. input ports
const inSpecs = new Map();
for (const [k, spec, why] of INPUTS) {
  const p = ports.get(k); assert(p, k); assert(!inSpecs.has(k), 'dup ' + k);
  inSpecs.set(k, {spec, why});
  if (spec.keep) continue;
  // drop every current source of the port
  for (const {w, from} of wires.filter(x => x.to === k)) {if (!deletedPortKeys.has(from)) {push(outDrop, from, w); log.push({dropWire: `${from} -> ${k}`});} removedWireIds.add(w.attr.Id);}
  for (const r of walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference')) sgvlRemove.push({symbol: r.attr.lastKnownPath.replace('GVL1.', ''), portId: p.attr.Id, why: k});
  if (spec.wire) push(outAdd, spec.wire, {to: k, id: guid(`wire/${spec.wire}->${k}`)});
  if (spec.symbol) {assert(symbolsByName.has(spec.symbol), spec.symbol); sgvlAdd.push({symbol: spec.symbol, portId: p.attr.Id, label: k});}
}
// new block wires
for (const nb of NEW_BLOCKS) for (const [pn, s] of Object.entries(nb.inputs)) if (s.wire) push(outAdd, s.wire, {to: `${nb.net}/${nb.name}/${pn}`, id: guid(`wire/${s.wire}->${nb.net}/${nb.name}/${pn}`)});

const ind = (xml, node) => xml.slice(xml.lastIndexOf('\n', node.start) + 1, node.start);
function setContact(open, p, spec) {
  if (spec.deactivate) return open.replace(/ channelInterface="Activated" deactivate1="[^"]*"/, ' channelInterface="Deactivated"');
  let o = open;
  if (/ channelInterface="Deactivated"/.test(o)) {assert(spec.contact, 'activation needs contact ' + pkey(p)); o = o.replace(' channelInterface="Deactivated"', ` channelInterface="Activated" deactivate1="${spec.contact}"`);}
  else if (spec.contact) o = o.replace(/ deactivate1="[^"]*"/, ` deactivate1="${spec.contact}"`);
  assert(/ channelInterface="Activated" deactivate1="(Break Contact \(NC\)|Make Contact \(NO\))"/.test(o), 'contact ' + pkey(p));
  return o;
}
const globalsXml = (i, symbol, k) => {
  const v = symbolsByName.get(symbol);
  return `<fbPortGlobalVariableReferences>\n${i}  <functionBlockPortHasFbPortGlobalVariableReferences Id="${guid('grel/' + k)}">\n${i}    <fbPortGlobalVariableReference Id="${guid('gref/' + k)}" variableId="${v.attr.Id}" lastKnownPath="GVL1.${symbol}" />\n${i}  </functionBlockPortHasFbPortGlobalVariableReferences>\n${i}</fbPortGlobalVariableReferences>`;
};
const wireXml = (i, w) => `<wiredLink Id="${w.id}">\n${i}  <inPortMoniker name="//${w.to}" />\n${i}</wiredLink>`;
// rewrite in-ports
for (const [k, {spec}] of inSpecs) {
  const p = ports.get(k); const i = ind(sal, p);
  let open = sal.slice(p.start, p.openEnd);
  open = setContact(open, p, spec);
  const plain = open.endsWith('/>') ? open.slice(0, -2).replace(/\s*$/, '') + '>' : open;
  const self = open.endsWith('/>') ? open : open.slice(0, -1).replace(/\s*$/, '') + ' />';
  let children = p.children.map(c => sal.slice(c.start, c.end));
  if (!spec.keep) children = spec.symbol ? [globalsXml(i + '  ', spec.symbol, k)] : [];
  assert(p.children.every(c => c.tag === 'fbPortGlobalVariableReferences'), 'unexpected in-port child ' + k);
  edits.push([p.start, p.end, children.length ? plain + children.map(c => '\n' + i + '  ' + c).join('') + '\n' + i + '</inPort>' : self]);
}
// rewrite out-ports with wire deltas
for (const k of new Set([...outDrop.keys(), ...outAdd.keys()])) {
  if (k.startsWith('Network6/HEALTH')) continue; // new blocks: generated below
  const p = ports.get(k); assert(p, k); const i = ind(sal, p);
  const drop = new Set((outDrop.get(k) ?? []).map(w => w.attr.Id)), add = outAdd.get(k) ?? [];
  const open = sal.slice(p.start, p.openEnd);
  const plain = open.endsWith('/>') ? open.slice(0, -2).replace(/\s*$/, '') + '>' : open;
  const self = open.endsWith('/>') ? open : open.slice(0, -1).replace(/\s*$/, '') + ' />';
  const children = [];
  let tfpSeen = false;
  for (const c of p.children) {
    if (c.tag !== 'targetFunctionBlockPorts') {children.push(sal.slice(c.start, c.end)); continue;}
    tfpSeen = true;
    const kept = c.children.filter(w => !drop.has(w.attr.Id)).map(w => sal.slice(w.start, w.end));
    const all = [...kept, ...add.map(w => wireXml(i + '    ', w))];
    if (all.length) children.push('<targetFunctionBlockPorts>' + all.map(x => '\n' + i + '    ' + x).join('') + '\n' + i + '  </targetFunctionBlockPorts>');
  }
  if (!tfpSeen && add.length) children.push('<targetFunctionBlockPorts>' + add.map(w => '\n' + i + '    ' + wireXml(i + '    ', w)).join('') + '\n' + i + '  </targetFunctionBlockPorts>');
  edits.push([p.start, p.end, children.length ? plain + children.map(c => '\n' + i + '  ' + c).join('') + '\n' + i + '</outPort>' : self]);
  log.push({outPort: k, dropped: [...drop].length, added: add.map(w => w.to)});
}
// 4. new blocks
const newPortIds = {};
const net6fb = S.find(n => n.tag === 'Network' && n.attr.name === 'Network6').children.find(c => c.tag === 'functionBlocks');
const lastWrapper = net6fb.children.at(-1);
const wi = ind(sal, lastWrapper);
let newText = '';
for (const nb of NEW_BLOCKS) {
  const t = blocks.get(nb.template); assert.equal(t.attr.functionName, nb.fn);
  const bk = `${nb.net}/${nb.name}`; assert(!blocks.has(bk));
  const tag = t.tag;
  const L = [];
  L.push(`<networkHasFunctionBlocks Id="${guid(bk + '/wrapper')}">`);
  L.push(`  <${tag} Id="${guid(bk + '/block')}" name="${nb.name}" instanceName="${nb.name}" orderOfExecution="@@ORDER:${bk}@@" mapState="false" mapDiag="false" functionName="${nb.fn}">`);
  for (const [container, rel] of [['inPorts', 'functioBlockHasInPorts'], ['outPorts', 'functionBlockHasOutPorts']]) {
    const tc = t.children.find(c => c.tag === container);
    L.push(`    <${container}>`);
    for (const r of tc.children) {
      assert.equal(r.tag, rel);
      const tp = r.children[0];
      const {Id, channelInterface, deactivate1, ...attrs} = tp.attr;
      const pk = `${bk}/${tp.attr.name}`; const pid = guid(pk + '/port'); newPortIds[pk] = pid;
      let a = Object.entries(attrs).map(([x, y]) => ` ${x}="${y}"`);
      if (tp.tag === 'inPort') {
        const s = nb.inputs[tp.attr.name];
        const ci = s ? ` channelInterface="Activated" deactivate1="${s.contact}"` : ' channelInterface="Deactivated"';
        const at = a.findIndex(x => x.startsWith(' maxDeviation='));
        a.splice(at, 0, ci);
      }
      L.push(`      <${rel} Id="${guid(pk + '/rel')}">`);
      const head = `        <${tp.tag} Id="${pid}"${a.join('')}`;
      const add = tp.tag === 'outPort' ? (outAdd.get(pk) ?? []) : [];
      if (add.length) {
        L.push(head + '>');
        L.push('          <targetFunctionBlockPorts>');
        for (const w of add) L.push('            ' + wireXml('            ', w));
        L.push('          </targetFunctionBlockPorts>');
        L.push(`        </${tp.tag}>`);
      } else L.push(head + ' />');
      L.push(`      </${rel}>`);
    }
    L.push(`    </${container}>`);
  }
  L.push(`  </${tag}>`);
  L.push('</networkHasFunctionBlocks>');
  newText += '\n' + L.map(x => wi + x).join('\n');
  log.push({newBlock: bk, fn: nb.fn, template: nb.template, inputs: nb.inputs});
}
edits.push([lastWrapper.end, lastWrapper.end, newText]);
// 5. SAL variable usage moves + renames
for (const [v, from, to] of VAR_MOVES) {
  const vn = S.find(n => n.tag === 'variable' && n.attr.name === v); assert(vn, v);
  const ms = walk(vn).filter(n => n.tag === 'inPortMoniker' && n.attr.name === from); assert.equal(ms.length, 1, v + from);
  assert(anc(ms[0], 'targetUsages'));
  const t = sal.slice(ms[0].start, ms[0].end); edits.push([ms[0].start, ms[0].end, t.replace(`name="${from}"`, `name="${to}"`)]);
  log.push({salVariableUsageMoved: v, from, to});
}
for (const [a, b] of RENAMES) {
  const vn = S.filter(n => n.tag === 'variable' && n.attr.name === a); assert.equal(vn.length, 1, a);
  assert(!S.some(n => n.tag === 'variable' && n.attr.name === b));
  const open = sal.slice(vn[0].start, vn[0].openEnd); assert.equal(open.split(`name="${a}"`).length, 2);
  // the variable open tag may overlap no other edit (usage edits are inside children)
  edits.push([vn[0].start, vn[0].openEnd, open.replace(`name="${a}"`, `name="${b}"`)]);
  log.push({rename: a, to: b, variableId: vn[0].attr.Id});
}
// 6. order of execution
let seq = [...blocks.entries()].filter(([k]) => !DELETE_BLOCKS.includes(k)).sort((a, b) => +a[1].attr.orderOfExecution - +b[1].attr.orderOfExecution).map(([k]) => k);
const moveBefore = (x, y) => {assert(seq.includes(x) && seq.includes(y), x + ' ' + y); seq = seq.filter(s => s !== x); seq.splice(seq.indexOf(y), 0, x);};
const moveAfter = (x, y) => {assert(seq.includes(x) && seq.includes(y), x + ' ' + y); seq = seq.filter(s => s !== x); seq.splice(seq.indexOf(y) + 1, 0, x);};
seq = [...HEAD, ...seq.filter(s => !HEAD.includes(s))];
moveAfter('Network12/FBAnd15', 'Network12/FBDecouple1');
moveBefore('Network3/FBAnd2', 'Network3/FBAnd1');
moveBefore('Network2/FBAnd11', 'Network2/FBAnd91');
seq.splice(seq.indexOf('Network6/FBAnd9'), 0, 'Network6/HEALTHY_OK', 'Network6/HEALTH_GUARD');
moveBefore('Network12/FBAnd16', 'Network1/FBAnd1');
moveBefore('SafeResumption/CONNECTORS', 'Network1/FBAnd1');
moveBefore('SafeResumption/CONNECTOR_SCOPE', 'Network1/FBAnd1');
assert.equal(seq.length, 215); assert.equal(new Set(seq).size, 215);
const orderMap = [];
seq.forEach((k, i) => {
  const n = String(i + 1);
  if (k.startsWith('Network6/HEALTH')) {orderMap.push({block: k, from: null, to: i + 1}); return;}
  const b = blocks.get(k); const o = b.attr.orderOfExecution;
  orderMap.push({block: k, from: +o, to: i + 1});
  if (o === n) return;
  const open = sal.slice(b.start, b.openEnd); const at = open.indexOf(` orderOfExecution="${o}"`); assert(at > 0);
  edits.push([b.start + at, b.start + at + ` orderOfExecution="${o}"`.length, ` orderOfExecution="${n}"`]);
});
sal = applyEdits(sal, edits);
for (const nb of NEW_BLOCKS) {const bk = `${nb.net}/${nb.name}`; sal = sal.replace(`@@ORDER:${bk}@@`, String(seq.indexOf(bk) + 1));}
assert(!sal.includes('@@ORDER'));

// ---------------- SGVL ----------------
const gEdits = [];
const idOf = u => gtext(u.children.find(c => c.tag === 'ModelElementId'));
for (const r of sgvlRemove) {
  const v = symbolsByName.get(r.symbol); assert(v, r.symbol);
  const us = walk(v).filter(n => n.tag === 'FbPortUsage' && idOf(n) === r.portId); assert.equal(us.length, 1, `sgvl usage ${r.symbol} ${r.portId}`);
  assert(anc(us[0], 'TargetUsages'), 'only target usages are removed');
  gEdits.push([...lineRange(gvl, us[0]), '']);
  log.push({sgvlTargetUsageRemoved: r.symbol, portId: r.portId, why: r.why});
}
const addBySym = new Map();
for (const a of sgvlAdd) push(addBySym, a.symbol, a);
for (const [sym, list] of addBySym) {
  const v = symbolsByName.get(sym); const tu = v.children.find(c => c.tag === 'TargetUsages');
  const first = tu.children[0]; assert(first, 'symbol without target usage ' + sym);
  const i = ind(gvl, first);
  const closeStart = tu.end - '</TargetUsages>'.length; assert.equal(gvl.slice(closeStart, tu.end), '</TargetUsages>');
  const at = gvl.lastIndexOf('\n', closeStart) + 1; // insert as new lines before the closing tag line
  const text = list.map(a => `${i}<FbPortUsage Id="${guid('sgvl/' + a.label)}">\n${i}  <ModelElementId>${a.portId}</ModelElementId>\n${i}</FbPortUsage>\n`).join('');
  gEdits.push([at, at, text]);
  for (const a of list) log.push({sgvlTargetUsageAdded: sym, port: a.label, portId: a.portId});
}
gvl = applyEdits(gvl, gEdits);

// ---------------- diagram ----------------
const D = walk(parse(dia));
const dEdits = [];
const delNames = new Set(DELETE_BLOCKS.map(k => '//' + k));
let shapesRemoved = 0, connectorsRemoved = 0;
const removedShapeIds = new Set();
for (const n of D.filter(n => /^fB\w+Shape$/.test(n.tag))) {
  const mon = n.children.find(c => c.tag.endsWith('Moniker'));
  if (delNames.has(mon.attr.name)) {dEdits.push([...lineRange(dia, n), '']); shapesRemoved++; for (const s of walk(n)) if (s.attr.Id) removedShapeIds.add(s.attr.Id);}
}
assert.equal(shapesRemoved, 2);
for (const c of D.filter(n => n.tag === 'wiredLinkConnector')) {
  const wid = c.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id;
  if (removedWireIds.has(wid)) {dEdits.push([...lineRange(dia, c), '']); connectorsRemoved++; continue;}
  for (const x of walk(c).filter(x => x.tag.endsWith('PortShapeMoniker'))) assert(!removedShapeIds.has(x.attr.Id), 'kept connector references removed shape');
}
assert.equal(connectorsRemoved, removedWireIds.size, 'every removed wire had exactly one connector');
dia = applyEdits(dia, dEdits);

fs.mkdirSync(outDir, {recursive: true});
for (const [f, x] of [['TwinSafeGroup1.sal', sal], ['GVL1.sgvl', gvl], ['TwinSafeGroup1.sal.diagram', dia]]) fs.writeFileSync(path.join(outDir, f), x);
const addedWires = [...outAdd.entries()].flatMap(([from, ws]) => ws.map(w => ({id: w.id, from, to: w.to})));
const result = {source: EXPECT, plan: PLAN_SHA, staged: {sal: hash(sal), sgvl: hash(gvl), diagram: hash(dia)}, deletedBlocks: DELETE_BLOCKS, newBlocks: NEW_BLOCKS.map(b => ({path: `${b.net}/${b.name}`, fn: b.fn, id: guid(`${b.net}/${b.name}/block`), ports: Object.fromEntries(Object.entries(newPortIds).filter(([k]) => k.startsWith(`${b.net}/${b.name}/`)))})), removedWires: [...removedWireIds], addedWires, connectorsRemoved, inputs: INPUTS.map(([k, s, why]) => ({port: k, ...s, why})), renames: RENAMES, orderMap, log, crc: 'stored CRC attributes unchanged in staging; native writers regenerate them'};
fs.writeFileSync(path.join(outDir, '..', 'STAGING.json'), JSON.stringify(result, null, 1) + '\n');
console.log(JSON.stringify({staged: result.staged, removedWires: removedWireIds.size, addedWires: addedWires.length, connectorsRemoved, sgvlRemoved: sgvlRemove.length, sgvlAdded: sgvlAdd.length}, null, 1));
