// E2a-RC staging: textual, structure-preserving edit of candidate E2a-core per
// program/architect/E2-status/PLAN.md v7 section 4 (windows WIN_C1/WIN_C2 + DIS-HOLD)
// and PLAN.json slices[E2a-RC]. Nothing else.
// Stored CRC values are NOT touched; native writers regenerate them.
// New block / wire presentations are NOT written here: native FixUpDiagram creates them
// (same approach as E2a-core / F1). Removed wires lose their connectors.
// Usage: node make-e2a-rc.mjs <sourceDir E2a-core> <stagedDir>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse, walk, anc, lineRange, applyEdits} from './xmlpos.mjs';

const [srcDir, outDir] = process.argv.slice(2);
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const read = f => fs.readFileSync(path.join(srcDir, f), 'utf8');
let sal = read('TwinSafeGroup1.sal'), gvl = read('GVL1.sgvl'), dia = read('TwinSafeGroup1.sal.diagram');
const EXPECT = {sal: '5648e31cec9fea6d82ed2392a4be21a26c599eb4872969f5adab2ef3b87fd40b', sgvl: 'e60698840e556dbd6d838958eadb8545735a81aaff8efbfceabc3613a4e08010', diagram: '27d7f20d890d48fc175fbd25af21a5b0c874ce4cf248b37ac73df26fe0624785'};
assert.equal(hash(sal), EXPECT.sal); assert.equal(hash(gvl), EXPECT.sgvl); assert.equal(hash(dia), EXPECT.diagram);
// Assigned spec PLAN v7 (35225c3c/7422ab65), archived by the architect as PLAN.v7_1.*; PLAN v7.2 (addendum) does not change slices[E2a-RC] logic (only disHold.e4 text).
const PLAN = {md: '35225c3c7c144759c2568d16261abce2a91f75928718e750b5b26e507f10248c', json: '7422ab65a6e6081c56008372a3421973fbea8bca8ecdd3abd975458cbe5312fb'};
assert.equal(hash(fs.readFileSync(new URL('../../../architect/E2-status/PLAN.v7_1.md', import.meta.url))), PLAN.md, 'PLAN v7 (=PLAN.v7_1.md) changed');
assert.equal(hash(fs.readFileSync(new URL('../../../architect/E2-status/PLAN.v7_1.json', import.meta.url))), PLAN.json, 'PLAN v7 json changed');
const guid = label => {const h = hash('E2a-RC/' + label); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${'89ab'[parseInt(h[16], 16) & 3]}${h.slice(17, 20)}-${h.slice(20, 32)}`;};
const NC = 'Break Contact (NC)';

// ---------------- plan (E2a-RC) ----------------
const NEW_BLOCKS = [
  {net: 'Network12', name: 'WIN_C2', fn: 'safeTon', template: 'Network12/FBTon3', params: {'Delay Time (s)': {timing: '0.5'}},
    inputs: {TonIn: {wire: 'Network12/FBAnd4/AndOut', contact: NC}}},
  {net: 'Network11', name: 'WIN_C1', fn: 'safeTon', template: 'Network11/FBTon1', params: {'Delay Time (s)': {timing: '0.5'}},
    inputs: {TonIn: {wire: 'Network11/FBAnd1/AndOut', contact: NC}}},
];
const INPUTS = [
  // 4.1 windows, Run (N12)
  ['Network12/FBAnd6/AndIn1', {wire: 'Network12/WIN_C2/TonOut'}, 'FBAnd6.AndIn1 := wire WIN_C2'],
  ['Network12/FBTon3/TonIn', {wire: 'Network12/FBAnd6/AndOut'}, 'FBTon3.TonIn := wire FBAnd6'],
  ['Network12/FBDecouple2/DecIn1', {wire: 'Network12/FBTon3/TonOut'}, 'FBTon3.TonOut -> DecIn1'],
  ['Network12/FBDecouple2/DecIn2', {wire: 'Network12/FBTon3/TonOut'}, 'FBTon3.TonOut -> DecIn2'],
  ['Network12/FBDecouple2/DecIn3', {wire: 'Network12/FBTon3/TonOut'}, 'FBTon3.TonOut -> DecIn3'],
  ['Network12/FBDecouple2/DecIn4', {wire: 'Network12/FBTon3/TonOut'}, 'FBTon3.TonOut -> DecIn4'],
  // 4.1 windows, R&D (N11)
  ['Network11/FBAnd4/AndIn1', {wire: 'Network11/WIN_C1/TonOut'}, 'N11/FBAnd4.AndIn1 := wire WIN_C1'],
  ['Network11/FBTon1/TonIn', {wire: 'Network11/FBAnd4/AndOut'}, 'N11/FBTon1.TonIn := wire FBAnd4'],
  ['Network11/FBAnd5/AndIn1', {wire: 'Network11/FBTon1/TonOut'}, 'N11/FBAnd5.AndIn1 := wire FBTon1'],
  // 4.2 DIS-HOLD
  ['Network1/FBOr5/OrIn2', {symbol: 'b_Set_HV_C2_1'}, 'DIS-HOLD HV: reset HV discharge request by accepted C2 command (second targetUsage)'],
  ['Network1/FBOr1/OrIn2', {symbol: 'b_Step12_Set'}, 'DIS-HOLD LV: reset LV discharge request by g2'],
  ['Network2/FBAnd91/AndIn4', {symbol: 'b_EStop_Ok', contact: NC}, 'TD-05: legacy PLC Safe->R&D gated by EOk'],
];
const DELETE_SYMBOLS = {b_Reset_HV_Discharg_Req2: 'Network12/FBAnd6/AndOut', b_Reset_LV_Discharge_Req2: 'Network11/FBAnd4/AndOut'};
const EXP = {fb: 217, ports: 1836, symbols: 63, salVariables: 75};

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
const instanceNames = new Set([...blocks.values()].map(b => b.attr.instanceName));
for (const nb of NEW_BLOCKS) assert(!instanceNames.has(nb.name) && !blocks.has(`${nb.net}/${nb.name}`), 'name collision ' + nb.name);

const edits = [];
const removedWireIds = new Set();
const sgvlRemove = []; // target usages {symbol, portId}
const sgvlAdd = [];
const outDrop = new Map(), outAdd = new Map();
const push = (m, k, v) => {if (!m.has(k)) m.set(k, []); m.get(k).push(v);};
// symbol deletion: source out-port global refs dropped; every target usage must be re-bound by INPUTS
const outGlobalsDrop = new Map(); // outPortKey -> Set(symbol)
for (const [sym, srcPort] of Object.entries(DELETE_SYMBOLS)) {
  const p = ports.get(srcPort); assert(p, srcPort);
  const refs = walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference' && n.attr.lastKnownPath === 'GVL1.' + sym); assert.equal(refs.length, 1, sym);
  push(outGlobalsDrop, srcPort, sym);
}
// input ports
const inSpecs = new Map();
for (const [k, spec, why] of INPUTS) {
  const p = ports.get(k); assert(p, k); assert(!inSpecs.has(k), 'dup ' + k);
  inSpecs.set(k, {spec, why});
  for (const {w, from} of wires.filter(x => x.to === k)) {push(outDrop, from, w); removedWireIds.add(w.attr.Id); log.push({dropWire: `${from} -> ${k}`});}
  for (const r of walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference')) sgvlRemove.push({symbol: r.attr.lastKnownPath.replace('GVL1.', ''), portId: p.attr.Id, why: k});
  // SAL variable target usages must not exist on re-bound ports
  assert(!S.some(n => n.tag === 'inPortMoniker' && !anc(n, 'networkHasFunctionBlocks') && n.attr.name === '//' + k), 'SAL variable on ' + k);
  if (spec.wire) push(outAdd, spec.wire, {to: k, id: guid(`wire/${spec.wire}->${k}`)});
  if (spec.symbol) {assert(symbolsByName.has(spec.symbol) && !(spec.symbol in DELETE_SYMBOLS), spec.symbol); sgvlAdd.push({symbol: spec.symbol, portId: p.attr.Id, label: k});}
}
for (const nb of NEW_BLOCKS) for (const [pn, s] of Object.entries(nb.inputs)) if (s.wire) push(outAdd, s.wire, {to: `${nb.net}/${nb.name}/${pn}`, id: guid(`wire/${s.wire}->${nb.net}/${nb.name}/${pn}`)});
// every target usage of a deleted symbol must be removed by INPUTS
for (const sym of Object.keys(DELETE_SYMBOLS)) {
  const v = symbolsByName.get(sym);
  const tIds = v.children.find(c => c.tag === 'TargetUsages').children.map(u => gtext(u.children.find(c => c.tag === 'ModelElementId')));
  const removedT = sgvlRemove.filter(r => r.symbol === sym).map(r => r.portId);
  assert.deepEqual([...tIds].sort(), [...removedT].sort(), 'deleted symbol has other consumers: ' + sym);
  log.push({deleteSymbol: sym, source: DELETE_SYMBOLS[sym], formerTargets: removedT.length});
}

const ind = (xml, node) => xml.slice(xml.lastIndexOf('\n', node.start) + 1, node.start);
function setContact(open, p, spec) {
  if (!/ channelInterface="/.test(open)) {assert(!spec.contact, 'no contact on ' + pkey(p)); return open;} // safeDecouple inputs
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
const selfClose = open => open.endsWith('/>') ? open : open.slice(0, -1).replace(/\s*$/, '') + ' />';
const plainOpen = open => open.endsWith('/>') ? open.slice(0, -2).replace(/\s*$/, '') + '>' : open;
// rewrite in-ports
for (const [k, {spec}] of inSpecs) {
  const p = ports.get(k); const i = ind(sal, p);
  const open = setContact(sal.slice(p.start, p.openEnd), p, spec);
  assert(p.children.every(c => c.tag === 'fbPortGlobalVariableReferences'), 'unexpected in-port child ' + k);
  const children = spec.symbol ? [globalsXml(i + '  ', spec.symbol, k)] : [];
  edits.push([p.start, p.end, children.length ? plainOpen(open) + children.map(c => '\n' + i + '  ' + c).join('') + '\n' + i + '</inPort>' : selfClose(open)]);
}
// rewrite out-ports with wire deltas / dropped source refs of deleted symbols
const isNew = k => NEW_BLOCKS.some(nb => k.startsWith(`${nb.net}/${nb.name}/`));
for (const k of new Set([...outDrop.keys(), ...outAdd.keys(), ...outGlobalsDrop.keys()])) {
  if (isNew(k)) continue; // generated below
  const p = ports.get(k); assert(p, k); const i = ind(sal, p);
  const drop = new Set((outDrop.get(k) ?? []).map(w => w.attr.Id)), add = outAdd.get(k) ?? [], gdrop = new Set(outGlobalsDrop.get(k) ?? []);
  const open = sal.slice(p.start, p.openEnd);
  const children = [];
  let tfpSeen = false;
  for (const c of p.children) {
    if (c.tag === 'fbPortGlobalVariableReferences') {
      const rels = c.children.filter(r => !gdrop.has(r.children[0].attr.lastKnownPath.replace('GVL1.', '')));
      assert.equal(c.children.length - rels.length, gdrop.size, 'global drop ' + k);
      if (rels.length) children.push('<fbPortGlobalVariableReferences>' + rels.map(r => '\n' + i + '    ' + sal.slice(r.start, r.end)).join('') + '\n' + i + '  </fbPortGlobalVariableReferences>');
      for (const s of gdrop) log.push({outPortSourceRefRemoved: k, symbol: s});
      continue;
    }
    if (c.tag !== 'targetFunctionBlockPorts') {children.push(sal.slice(c.start, c.end)); continue;}
    tfpSeen = true;
    const kept = c.children.filter(w => !drop.has(w.attr.Id)).map(w => sal.slice(w.start, w.end));
    const all = [...kept, ...add.map(w => wireXml(i + '    ', w))];
    if (all.length) children.push('<targetFunctionBlockPorts>' + all.map(x => '\n' + i + '    ' + x).join('') + '\n' + i + '  </targetFunctionBlockPorts>');
  }
  if (!tfpSeen && add.length) children.push('<targetFunctionBlockPorts>' + add.map(w => '\n' + i + '    ' + wireXml(i + '    ', w)).join('') + '\n' + i + '  </targetFunctionBlockPorts>');
  edits.push([p.start, p.end, children.length ? plainOpen(open) + children.map(c => '\n' + i + '  ' + c).join('') + '\n' + i + '</outPort>' : selfClose(open)]);
  log.push({outPort: k, droppedWires: drop.size, added: add.map(w => w.to), droppedSourceRefs: [...gdrop]});
}
// new blocks (one per network: append after the last wrapper of that network)
const newPortIds = {};
for (const nb of NEW_BLOCKS) {
  const t = blocks.get(nb.template); assert.equal(t.attr.functionName, nb.fn);
  const bk = `${nb.net}/${nb.name}`;
  const netFb = S.find(n => n.tag === 'Network' && n.attr.name === nb.net).children.find(c => c.tag === 'functionBlocks');
  const lastWrapper = netFb.children.at(-1); const wi = ind(sal, lastWrapper);
  const L = [];
  L.push(`<networkHasFunctionBlocks Id="${guid(bk + '/wrapper')}">`);
  L.push(`  <${t.tag} Id="${guid(bk + '/block')}" name="${nb.name}" instanceName="${nb.name}" orderOfExecution="@@ORDER:${bk}@@" mapState="${t.attr.mapState}" mapDiag="${t.attr.mapDiag}" functionName="${nb.fn}">`);
  const containers = t.children.map(c => c.tag); assert.deepEqual(containers, ['inPorts', 'outPorts', 'parameterPorts']);
  for (const [container, rel] of [['inPorts', 'functioBlockHasInPorts'], ['outPorts', 'functionBlockHasOutPorts'], ['parameterPorts', 'functionBlockHasParamPorts']]) {
    const tc = t.children.find(c => c.tag === container);
    L.push(`    <${container}>`);
    for (const r of tc.children) {
      assert.equal(r.tag, rel);
      const tp = r.children[0];
      const {Id, channelInterface, deactivate1, ...attrs} = tp.attr;
      const pk = `${bk}/${tp.attr.name}`; const pid = guid(pk + '/port'); newPortIds[pk] = pid;
      if (tp.tag === 'parameterPort') {const ov = nb.params[tp.attr.name]; assert(ov, 'param ' + pk); Object.assign(attrs, ov);}
      const a = Object.entries(attrs).map(([x, y]) => ` ${x}="${y}"`);
      if (tp.tag === 'inPort') {
        const s = nb.inputs[tp.attr.name];
        const ci = s ? ` channelInterface="Activated" deactivate1="${s.contact}"` : ' channelInterface="Deactivated"';
        const at = a.findIndex(x => x.startsWith(' maxDeviation=')); assert(at > 0);
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
  L.push(`  </${t.tag}>`);
  L.push('</networkHasFunctionBlocks>');
  edits.push([lastWrapper.end, lastWrapper.end, '\n' + L.map(x => wi + x).join('\n')]);
  log.push({newBlock: bk, fn: nb.fn, template: nb.template, params: nb.params, inputs: nb.inputs});
}
// order of execution (PLAN.json slices[E2a-RC].order; same as architect proto.mjs)
let seq = [...blocks.entries()].sort((a, b) => +a[1].attr.orderOfExecution - +b[1].attr.orderOfExecution).map(([k]) => k);
const moveBefore = (x, y) => {assert(seq.includes(x) && seq.includes(y), x + ' ' + y); seq = seq.filter(s => s !== x); seq.splice(seq.indexOf(y), 0, x);};
const insBefore = (x, y) => {assert(!seq.includes(x) && seq.includes(y)); seq.splice(seq.indexOf(y), 0, x);};
moveBefore('Network12/FBAnd6', 'Network12/FBTon3'); insBefore('Network12/WIN_C2', 'Network12/FBAnd6');
moveBefore('Network11/FBAnd4', 'Network11/FBTon1'); insBefore('Network11/WIN_C1', 'Network11/FBAnd4');
assert.equal(seq.length, EXP.fb); assert.equal(new Set(seq).size, EXP.fb);
const orderMap = [];
seq.forEach((k, i) => {
  const n = String(i + 1);
  if (isNew(k + '/')) {orderMap.push({block: k, from: null, to: i + 1}); return;}
  const b = blocks.get(k); const o = b.attr.orderOfExecution;
  orderMap.push({block: k, from: +o, to: i + 1});
  if (o === n) return;
  const open = sal.slice(b.start, b.openEnd); const at = open.indexOf(` orderOfExecution="${o}"`); assert(at > 0);
  edits.push([b.start + at, b.start + at + ` orderOfExecution="${o}"`.length, ` orderOfExecution="${n}"`]);
});
sal = applyEdits(sal, edits);
for (const nb of NEW_BLOCKS) {const bk = `${nb.net}/${nb.name}`; sal = sal.replace(`@@ORDER:${bk}@@`, String(seq.indexOf(bk) + 1));}
assert(!sal.includes('@@ORDER'));
for (const s of Object.keys(DELETE_SYMBOLS)) assert(!sal.includes('GVL1.' + s + '"'), 'symbol still referenced ' + s);

// ---------------- SGVL ----------------
const gEdits = [];
const idOf = u => gtext(u.children.find(c => c.tag === 'ModelElementId'));
for (const r of sgvlRemove) {
  if (r.symbol in DELETE_SYMBOLS) continue; // whole Variable removed below
  const v = symbolsByName.get(r.symbol); assert(v, r.symbol);
  const us = walk(v).filter(n => n.tag === 'FbPortUsage' && idOf(n) === r.portId); assert.equal(us.length, 1, `sgvl usage ${r.symbol} ${r.portId}`);
  assert(anc(us[0], 'TargetUsages'));
  gEdits.push([...lineRange(gvl, us[0]), '']);
  log.push({sgvlTargetUsageRemoved: r.symbol, portId: r.portId, why: r.why});
}
for (const sym of Object.keys(DELETE_SYMBOLS)) {gEdits.push([...lineRange(gvl, symbolsByName.get(sym)), '']); log.push({sgvlVariableRemoved: sym, id: symbolsByName.get(sym).attr.Id});}
const addBySym = new Map();
for (const a of sgvlAdd) push(addBySym, a.symbol, a);
for (const [sym, list] of addBySym) {
  const v = symbolsByName.get(sym); const tu = v.children.find(c => c.tag === 'TargetUsages');
  const first = tu.children[0]; assert(first, 'symbol without target usage ' + sym);
  const i = ind(gvl, first);
  const closeStart = tu.end - '</TargetUsages>'.length; assert.equal(gvl.slice(closeStart, tu.end), '</TargetUsages>');
  const at = gvl.lastIndexOf('\n', closeStart) + 1;
  gEdits.push([at, at, list.map(a => `${i}<FbPortUsage Id="${guid('sgvl/' + a.label)}">\n${i}  <ModelElementId>${a.portId}</ModelElementId>\n${i}</FbPortUsage>\n`).join('')]);
  for (const a of list) log.push({sgvlTargetUsageAdded: sym, port: a.label, portId: a.portId});
}
gvl = applyEdits(gvl, gEdits);

// ---------------- diagram ----------------
const D = walk(parse(dia));
const dEdits = [];
let connectorsRemoved = 0;
for (const c of D.filter(n => n.tag === 'wiredLinkConnector')) {
  const wid = c.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id;
  if (removedWireIds.has(wid)) {dEdits.push([...lineRange(dia, c), '']); connectorsRemoved++;}
}
assert.equal(connectorsRemoved, removedWireIds.size, 'every removed wire had exactly one connector');
dia = applyEdits(dia, dEdits);

fs.mkdirSync(outDir, {recursive: true});
for (const [f, x] of [['TwinSafeGroup1.sal', sal], ['GVL1.sgvl', gvl], ['TwinSafeGroup1.sal.diagram', dia]]) fs.writeFileSync(path.join(outDir, f), x);
const addedWires = [...outAdd.entries()].flatMap(([from, ws]) => ws.map(w => ({id: w.id, from, to: w.to})));
const result = {source: EXPECT, plan: PLAN, staged: {sal: hash(sal), sgvl: hash(gvl), diagram: hash(dia)}, expected: EXP,
  newBlocks: NEW_BLOCKS.map(b => ({path: `${b.net}/${b.name}`, fn: b.fn, id: guid(`${b.net}/${b.name}/block`), ports: Object.fromEntries(Object.entries(newPortIds).filter(([k]) => k.startsWith(`${b.net}/${b.name}/`)))})),
  deletedSymbols: DELETE_SYMBOLS, removedWires: [...removedWireIds], addedWires, connectorsRemoved, inputs: INPUTS.map(([k, s, why]) => ({port: k, ...s, why})), orderMap, log,
  crc: 'stored CRC attributes unchanged in staging; native writers regenerate them'};
fs.writeFileSync(path.join(outDir, '..', 'STAGING.json'), JSON.stringify(result, null, 1) + '\n');
console.log(JSON.stringify({staged: result.staged, removedWires: removedWireIds.size, addedWires: addedWires.length, connectorsRemoved, sgvlRemoved: sgvlRemove.length, sgvlAdded: sgvlAdd.length}, null, 1));
