// E2b staging: textual, structure-preserving edit of candidate E2a-RC per
// program/architect/E2-status/PLAN.md v7.4.1 (section 6 + addendum v7.3 GATE_SPOIL_R/S, linkConnectorsOk) and PLAN.json v7.4.1 slices[E2b] (items moved to E2a-core by D-1 are
// NOT repeated). Contacts of new blocks as in the architect prototype repro/proto.mjs (e2b + e2e: G10_EXIT).
// Stored CRC values are NOT touched; native writers regenerate them. New block / wire presentations are created by
// native FixUpDiagram. Removed wires lose their connectors.
// Usage: node make-e2b.mjs <sourceDir E2a-RC> <stagedDir>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse, walk, anc, lineRange, applyEdits} from './xmlpos.mjs';

const [srcDir, outDir] = process.argv.slice(2);
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const read = f => fs.readFileSync(path.join(srcDir, f), 'utf8');
let sal = read('TwinSafeGroup1.sal'), gvl = read('GVL1.sgvl'), dia = read('TwinSafeGroup1.sal.diagram');
const EXPECT = {sal: '5733552a150bfd33df4211da8f97a8fc993ff990ad52c90a8d7758d950660f3f', sgvl: '253de7f39f2c4af83fa8642445a885d18ecfcdccec46fcbf96612d88a810b669', diagram: '5fa942384352033814f2d51bf8c4a847098d6a3322d4b733995de64b7b759bb2'};
assert.equal(hash(sal), EXPECT.sal); assert.equal(hash(gvl), EXPECT.sgvl); assert.equal(hash(dia), EXPECT.diagram);
// PLAN v7.4.1 as of the build (V73-C/V73-D text/mutation-plan revision of 4151ca47/74a3bc8b; slices E2b..E2d logic unchanged)
const PLAN = {md: 'f247e310c096c8d59dc7a5f80fb1be7f8cf4276e2aa7d56b8f54b990727ce595', json: '096ebdadf766c1d9ca97697a1ef05275e647c88ee96f5f13c3c895edab9dcdbb'};
const planFile = f => fs.readFileSync(new URL('../../../architect/E2-status/' + f, import.meta.url));
const planArchived = [['PLAN.md', PLAN.md], ['PLAN.json', PLAN.json]].every(([f, h]) => hash(planFile(f)) === h);
if (!planArchived) {
  // the architect archives a superseded version as PLAN.v7_2.*; accept it there
  assert.equal(hash(planFile('PLAN.v7_4_1.md')), PLAN.md, 'PLAN v7.4.1 md not found'); assert.equal(hash(planFile('PLAN.v7_4_1.json')), PLAN.json, 'PLAN v7.4.1 json not found');
}
const guid = label => {const h = hash('E2b/' + label); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${'89ab'[parseInt(h[16], 16) & 3]}${h.slice(17, 20)}-${h.slice(20, 32)}`;};
const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';
const AND = 'Network6/FBAnd9', OR = 'Network6/FBOr5'; // native templates (as E2a-core)

// ---------------- plan (E2b, v7.4.1 incl. v7.3) ----------------
// input spec: {wire: outPortKey}|{symbol}|{variable: SAL variable name}|{deactivate:true}; contact required for activated ports
const NEW_BLOCKS = [
  {net: 'Network1', name: 'FBAndNotRunSu', fn: 'safeAnd', template: AND, inputs: {AndIn1: {symbol: 'b_Step3', contact: NO}, AndIn2: {symbol: 'recRndC_SU', contact: NO}}},
  {net: 'Network1', name: 'FBOrIlRunOk', fn: 'safeOr', template: OR, inputs: {OrIn1: {wire: 'Network1/FBAndNotRunSu/AndOut', contact: NC}, OrIn2: {variable: 'linkCoverClosed', contact: NC}, OrIn3: {variable: 'linkRunDownOwner', contact: NC}}},
  {net: 'Network6', name: 'STAGE_LVON', fn: 'safeOr', template: OR, inputs: {OrIn1: {symbol: 'b_Step12', contact: NC}, OrIn2: {symbol: 'b_Step_RnD', contact: NC}}},
  {net: 'Network6', name: 'FBAndLvEmg', fn: 'safeAnd', template: AND, inputs: {AndIn1: {wire: 'Network6/STAGE_LVON/OrOut', contact: NC}, AndIn2: {symbol: 'b_EStop_Ok', contact: NO}, AndIn3: {variable: 'in_False_SI2_CH8', contact: NO}}},
  {net: 'Network6', name: 'FBOrStep4', fn: 'safeOr', template: OR, inputs: {OrIn1: {wire: 'Network6/FBAnd2/AndOut', contact: NC}, OrIn2: {wire: 'Network6/FBAndLvEmg/AndOut', contact: NC}}},
  {net: 'Network3', name: 'FBOrS12Reset', fn: 'safeOr', template: OR, inputs: {OrIn1: {symbol: 'b_Step_RnD_Set', contact: NC}, OrIn2: {symbol: 'b_Step4_Set', contact: NC}}},
  {net: 'Network3', name: 'G10_EXIT', fn: 'safeAnd', template: AND, inputs: {AndIn1: {wire: 'Network3/FBRs6/RsOut', contact: NC}, AndIn2: {symbol: 'b_EStop_Ok', contact: NC}, AndIn3: {variable: 'in_Reset_PB', contact: NO}, AndIn4: {symbol: 'recRndC_PrevG', contact: NC},
    AndIn5: {variable: 'in_LV_C1_FBK', contact: NO}, AndIn6: {variable: 'in_HV_C2_FBK', contact: NO}, AndIn7: {variable: 'out_LV_C1', contact: NO}, AndIn8: {variable: 'out_HV_C2', contact: NO}}},
  {net: 'Network3', name: 'FBAndBootFbkOff', fn: 'safeAnd', template: AND, inputs: {AndIn1: {variable: 'in_LV_C1_FBK', contact: NO}, AndIn2: {variable: 'in_HV_C2_FBK', contact: NO}, AndIn3: {variable: 'in_Reset_PB', contact: NO}, AndIn4: {symbol: 'recRndC_PrevG', contact: NC}}},
  // v7.3 D-E2b-1 / D-E2b-3(b): spoil the attempt (STATE_L) on a permit episode while both buttons are pressed
  {net: 'RndPhysicalCompact', name: 'GATE_SPOIL_R', fn: 'safeAnd', template: AND, inputs: {AndIn1: {wire: 'RndPhysicalCompact/GATE_003/AndOut', contact: NC}, AndIn2: {symbol: 'b_Step_RnD', contact: NC}, AndIn3: {variable: 'linkCoverClosed', contact: NO}}},
  {net: 'RndPhysicalCompact', name: 'GATE_SPOIL_S', fn: 'safeAnd', template: AND, inputs: {AndIn1: {wire: 'RndPhysicalCompact/GATE_003/AndOut', contact: NC}, AndIn2: {symbol: 'b_Step1', contact: NC}, AndIn3: {variable: 'linkConnectorsOk', contact: NO}}},
];
const NEW_VARS = [
  {name: 'linkCoverClosed', source: 'Network12/FBAnd16/AndOut', template: 'linkSafeConnectorScope'},
  {name: 'linkRunDownOwner', source: 'Network6/RUN_DOWN_OWNER/RsOut', template: 'linkSafeConnectorScope'},
  {name: 'linkConnectorsOk', source: 'SafeResumption/CONNECTORS/AndOut', template: 'linkSafeConnectorScope'}, // v7.3
];
const INPUTS = [
  ['Network1/FBAnd1/AndIn3', {wire: 'Network1/FBOrIlRunOk/OrOut', contact: NC}, 'item 2: IL Run ok'],
  ['Network1/FBAnd1/AndIn4', {variable: 'linkSafeConnectorScope', contact: NC}, 'item 2: EMG-004 connector scope'],
  ['Network6/HEALTHY_OK/AndIn3', {variable: 'linkCoverClosed', contact: NC}, 'item 3'],
  ['Network6/FBAnd9/AndIn2', {deactivate: true}, 'item 3'],
  ['Network6/FBAnd9/AndIn3', {deactivate: true}, 'item 3'],
  ['Network6/FBDecouple1/DecIn1', {wire: 'Network6/FBOrStep4/OrOut'}, 'item 4: g7 = FBOrStep4 (stage based)'],
  ['Network3/FBRs8/Reset', {wire: 'Network3/FBOrS12Reset/OrOut'}, 'item 5'],
  ['RndPhysicalCompact/GATE_001/AndIn5', {deactivate: true}, 'item 6'],
  ['RndPhysicalCompact/GATE_001/AndIn6', {deactivate: true}, 'item 6'],
  ['RndPhysicalCompact/GATE_020/AndIn6', {variable: 'linkCoverClosed', contact: NC}, 'item 6'],
  ['RndPhysicalCompact/GATE_030/OrIn5', {wire: 'RndPhysicalCompact/BOTH/TonOut', contact: NC}, 'item 6'],
  ['Network3/FBOr2/OrIn3', {wire: 'Network3/G10_EXIT/AndOut', contact: NC}, 'item 7: g10'],
  ['Network1/FBAnd4/AndIn5', {symbol: 'b_Step1', contact: NC}, 'item 8 B5-1 (A): legacy Bypass only in Safe'],
  ['Network3/FBAnd1/AndIn3', {wire: 'Network3/FBAndBootFbkOff/AndOut', contact: NC}, 'item 9 B5-2 EMG6-01-BOOT'],
  ['RndPhysicalCompact/GATE_029/OrIn6', {wire: 'RndPhysicalCompact/GATE_SPOIL_R/AndOut', contact: NC}, 'v7.3 GATE_SPOIL_R'],
  ['RndPhysicalCompact/GATE_029/OrIn7', {wire: 'RndPhysicalCompact/GATE_SPOIL_S/AndOut', contact: NC}, 'v7.3 GATE_SPOIL_S'],
];
const EXP = {fb: 227, ports: 1926, symbols: 63, salVariables: 78};

const log = [];
const S = walk(parse(sal));
const blockOf = p => anc(p, 'networkHasFunctionBlocks')?.children[0];
const pkey = p => `${anc(p, 'Network').attr.name}/${blockOf(p).attr.name}/${p.attr.name}`;
const blocks = new Map(S.filter(n => n.parent?.tag === 'networkHasFunctionBlocks').map(b => [`${anc(b, 'Network').attr.name}/${b.attr.name}`, b]));
assert.equal(blocks.size, 217);
const ports = new Map(S.filter(n => n.tag === 'inPort' || n.tag === 'outPort').map(p => [pkey(p), p]));
assert.equal(ports.size, 1836);
const G0 = walk(parse(gvl));
const gtext = n => gvl.slice(n.openEnd, n.end - `</${n.tag}>`.length).trim();
const symbolsByName = new Map(G0.filter(n => n.tag === 'Variable').map(v => [gtext(v.children.find(c => c.tag === 'Name')), v]));
assert.equal(symbolsByName.size, 63);
const varsByName = new Map(S.filter(n => n.tag === 'variable').map(v => [v.attr.name, v]));
assert.equal(varsByName.size, 75);
for (const nv of NEW_VARS) assert(!varsByName.has(nv.name) && !symbolsByName.has(nv.name), 'name exists ' + nv.name);
const wires = S.filter(n => n.tag === 'wiredLink').map(w => ({w, from: pkey(w.parent.parent), to: w.children[0].attr.name.slice(2)}));
const instanceNames = new Set([...blocks.values()].map(b => b.attr.instanceName));
for (const nb of NEW_BLOCKS) assert(!instanceNames.has(nb.name) && !blocks.has(`${nb.net}/${nb.name}`), 'name collision ' + nb.name);
const isNew = k => NEW_BLOCKS.some(nb => k === `${nb.net}/${nb.name}` || k.startsWith(`${nb.net}/${nb.name}/`));
const allVarNames = new Set([...varsByName.keys(), ...NEW_VARS.map(v => v.name)]);

const edits = [];
const removedWireIds = new Set();
const sgvlRemove = [], sgvlAdd = [];
const varUsageRemove = []; // usage wrapper nodes (variableUsagesHasUsages) to delete
const varTargetAdd = new Map(); // var name -> [port keys]
const outDrop = new Map(), outAdd = new Map();
const push = (m, k, v) => {if (!m.has(k)) m.set(k, []); m.get(k).push(v);};
const varTargetsOf = k => S.filter(n => n.tag === 'inPortMoniker' && !anc(n, 'networkHasFunctionBlocks') && n.attr.name === '//' + k);
// input ports
const inSpecs = new Map();
const lossCheck = []; // [variable, remaining target usages after removals] - judged after planned additions
for (const [k, spec, why] of INPUTS) {
  const p = ports.get(k); assert(p, k); assert(!inSpecs.has(k), 'dup ' + k);
  inSpecs.set(k, {spec, why});
  for (const {w, from} of wires.filter(x => x.to === k)) {push(outDrop, from, w); removedWireIds.add(w.attr.Id); log.push({dropWire: `${from} -> ${k}`});}
  for (const r of walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference')) sgvlRemove.push({symbol: r.attr.lastKnownPath.replace('GVL1.', ''), portId: p.attr.Id, why: k});
  for (const m of varTargetsOf(k)) {
    const u = anc(m, 'variableUsagesHasUsages'); assert(anc(m, 'targetUsages'), 'variable source on input ' + k);
    const v = anc(m, 'variable'); const left = walk(v).filter(n => n.tag === 'variableUsagesHasUsages' && anc(n, 'targetUsages')).length - 1;
    lossCheck.push([v.attr.name, left]);
    varUsageRemove.push(u); log.push({salVariableTargetUsageRemoved: v.attr.name, port: k});
  }
  if (spec.wire) push(outAdd, spec.wire, {to: k, id: guid(`wire/${spec.wire}->${k}`)});
  if (spec.symbol) {assert(symbolsByName.has(spec.symbol), spec.symbol); sgvlAdd.push({symbol: spec.symbol, portId: p.attr.Id, label: k});}
  if (spec.variable) {assert(allVarNames.has(spec.variable), spec.variable); push(varTargetAdd, spec.variable, k);}
}
// new block inputs
const newPortIds = {};
for (const nb of NEW_BLOCKS) {
  const bk = `${nb.net}/${nb.name}`;
  for (const r of blocks.get(nb.template).children.flatMap(c => c.children)) {const tp = r.children[0]; newPortIds[`${bk}/${tp.attr.name}`] = guid(`${bk}/${tp.attr.name}/port`);}
  for (const [pn, s] of Object.entries(nb.inputs)) {
    const k = `${bk}/${pn}`; assert(newPortIds[k], k);
    if (s.wire) push(outAdd, s.wire, {to: k, id: guid(`wire/${s.wire}->${k}`)});
    if (s.symbol) {assert(symbolsByName.has(s.symbol), s.symbol); sgvlAdd.push({symbol: s.symbol, portId: newPortIds[k], label: k});}
    if (s.variable) {assert(allVarNames.has(s.variable), s.variable); push(varTargetAdd, s.variable, k);}
  }
}
{const rem = {}; for (const [v] of lossCheck) rem[v] = (rem[v] ?? 0) + 1;
 for (const [v, left] of lossCheck) assert(left - (rem[v] - 1) + (varTargetAdd.get(v)?.length ?? 0) >= 1, 'variable would lose its last target usage ' + v);}
const ind = (xml, node) => xml.slice(xml.lastIndexOf('\n', node.start) + 1, node.start);
function setContact(open, p, spec) {
  if (spec.deactivate) {assert(/ channelInterface="Activated" deactivate1="[^"]*"/.test(open), 'deactivate needs activated ' + pkey(p)); return open.replace(/ channelInterface="Activated" deactivate1="[^"]*"/, ' channelInterface="Deactivated"');}
  if (!/ channelInterface="/.test(open)) {assert(!spec.contact, 'no contact on ' + pkey(p)); return open;} // safeDecouple / safeRs? (Rs has channelInterface)
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
// rewrite existing in-ports (Rs Set/Reset ports keep their contact when no contact is given)
for (const [k, {spec}] of inSpecs) {
  const p = ports.get(k); const i = ind(sal, p);
  const open = setContact(sal.slice(p.start, p.openEnd), p, spec);
  assert(p.children.every(c => c.tag === 'fbPortGlobalVariableReferences'), 'unexpected in-port child ' + k);
  const children = spec.symbol ? [globalsXml(i + '  ', spec.symbol, k)] : [];
  edits.push([p.start, p.end, children.length ? plainOpen(open) + children.map(c => '\n' + i + '  ' + c).join('') + '\n' + i + '</inPort>' : selfClose(open)]);
}
// rewrite existing out-ports with wire deltas
for (const k of new Set([...outDrop.keys(), ...outAdd.keys()])) {
  if (isNew(k)) continue;
  const p = ports.get(k); assert(p, k); const i = ind(sal, p);
  const drop = new Set((outDrop.get(k) ?? []).map(w => w.attr.Id)), add = outAdd.get(k) ?? [];
  const open = sal.slice(p.start, p.openEnd);
  const children = []; let tfpSeen = false;
  for (const c of p.children) {
    if (c.tag !== 'targetFunctionBlockPorts') {children.push(sal.slice(c.start, c.end)); continue;}
    tfpSeen = true;
    const kept = c.children.filter(w => !drop.has(w.attr.Id)).map(w => sal.slice(w.start, w.end));
    const all = [...kept, ...add.map(w => wireXml(i + '    ', w))];
    if (all.length) children.push('<targetFunctionBlockPorts>' + all.map(x => '\n' + i + '    ' + x).join('') + '\n' + i + '  </targetFunctionBlockPorts>');
  }
  if (!tfpSeen && add.length) children.push('<targetFunctionBlockPorts>' + add.map(w => '\n' + i + '    ' + wireXml(i + '    ', w)).join('') + '\n' + i + '  </targetFunctionBlockPorts>');
  edits.push([p.start, p.end, children.length ? plainOpen(open) + children.map(c => '\n' + i + '  ' + c).join('') + '\n' + i + '</outPort>' : selfClose(open)]);
  log.push({outPort: k, droppedWires: drop.size, added: add.map(w => w.to)});
}
// new blocks (appended at the end of their network, in plan order)
const lastByNet = new Map();
for (const nb of NEW_BLOCKS) {
  const t = blocks.get(nb.template); assert.equal(t.attr.functionName, nb.fn);
  const bk = `${nb.net}/${nb.name}`;
  const netFb = S.find(n => n.tag === 'Network' && n.attr.name === nb.net).children.find(c => c.tag === 'functionBlocks');
  const lastWrapper = netFb.children.at(-1); const wi = ind(sal, lastWrapper);
  const L = [];
  L.push(`<networkHasFunctionBlocks Id="${guid(bk + '/wrapper')}">`);
  L.push(`  <${t.tag} Id="${guid(bk + '/block')}" name="${nb.name}" instanceName="${nb.name}" orderOfExecution="@@ORDER:${bk}@@" mapState="${t.attr.mapState}" mapDiag="${t.attr.mapDiag}" functionName="${nb.fn}">`);
  assert.deepEqual(t.children.map(c => c.tag), ['inPorts', 'outPorts']);
  for (const [container, rel] of [['inPorts', 'functioBlockHasInPorts'], ['outPorts', 'functionBlockHasOutPorts']]) {
    const tc = t.children.find(c => c.tag === container);
    L.push(`    <${container}>`);
    for (const r of tc.children) {
      assert.equal(r.tag, rel);
      const tp = r.children[0];
      const {Id, channelInterface, deactivate1, ...attrs} = tp.attr;
      const pk = `${bk}/${tp.attr.name}`; const pid = newPortIds[pk];
      const a = Object.entries(attrs).map(([x, y]) => ` ${x}="${y}"`);
      let children = [];
      if (tp.tag === 'inPort') {
        const s = nb.inputs[tp.attr.name];
        const ci = s ? ` channelInterface="Activated" deactivate1="${s.contact}"` : ' channelInterface="Deactivated"';
        const at = a.findIndex(x => x.startsWith(' maxDeviation=')); assert(at > 0); a.splice(at, 0, ci);
        if (s?.symbol) children = [globalsXml(' '.repeat(wi.length + 10), s.symbol, pk)];
      }
      const add = tp.tag === 'outPort' ? (outAdd.get(pk) ?? []) : [];
      if (add.length) children.push('<targetFunctionBlockPorts>\n' + add.map(w => ' '.repeat(wi.length + 12) + wireXml(' '.repeat(wi.length + 12), w)).join('\n') + '\n' + ' '.repeat(wi.length + 10) + '</targetFunctionBlockPorts>');
      L.push(`      <${rel} Id="${guid(pk + '/rel')}">`);
      const head = `        <${tp.tag} Id="${pid}"${a.join('')}`;
      if (children.length) {L.push(head + '>'); for (const c of children) L.push('          ' + c); L.push(`        </${tp.tag}>`);} else L.push(head + ' />');
      L.push(`      </${rel}>`);
    }
    L.push(`    </${container}>`);
  }
  L.push(`  </${t.tag}>`);
  L.push('</networkHasFunctionBlocks>');
  const text = '\n' + L.map(x => wi + x).join('\n');
  lastByNet.set(lastWrapper.end, (lastByNet.get(lastWrapper.end) ?? '') + text);
  log.push({newBlock: bk, fn: nb.fn, template: nb.template, inputs: nb.inputs});
}
for (const [at, text] of lastByNet) edits.push([at, at, text]);
// SAL variables: usage removals, target additions, new variables
for (const u of varUsageRemove) edits.push([...lineRange(sal, u), '']);
const usageXml = (i, label, k, role) => {
  const mon = role === 'T' ? 'inPortMoniker' : 'outPortMoniker';
  return [`<variableUsagesHasUsages Id="${guid(label + '/vuhu')}">`, `  <fbPortUsage Id="${guid(label + '/fbpu')}">`, '    <functionBlockPort>', `      <fbPortUsageReferencesFunctionBlockPort Id="${guid(label + '/ref')}">`, `        <${mon} name="//${k}" />`, '      </fbPortUsageReferencesFunctionBlockPort>', '    </functionBlockPort>', '  </fbPortUsage>', '</variableUsagesHasUsages>'].map(x => i + x).join('\n') + '\n';
};
for (const [vn, keys] of varTargetAdd) {
  if (NEW_VARS.some(v => v.name === vn)) continue;
  const v = varsByName.get(vn); const usages = walk(v).find(n => n.tag === 'usages' && anc(n, 'targetUsages')); assert(usages, 'no target usages container ' + vn);
  const i = ind(sal, usages.children[0]);
  const closeStart = usages.end - '</usages>'.length; const at = sal.lastIndexOf('\n', closeStart) + 1;
  edits.push([at, at, keys.map(k => usageXml(i, `var/${vn}/T/${k}`, k, 'T')).join('')]);
  for (const k of keys) log.push({salVariableTargetUsageAdded: vn, port: k});
}
{
  const varsNode = S.find(n => n.tag === 'variables' && n.parent.tag === 'safetyApplication');
  const last = varsNode.children.at(-1); const i = ind(sal, last);
  let text = '';
  for (const nv of NEW_VARS) {
    const tpl = varsByName.get(nv.template); assert.equal(tpl.attr.isLocal, 'false');
    const targets = varTargetAdd.get(nv.name) ?? []; assert(targets.length, 'new variable without consumer ' + nv.name);
    assert(ports.has(nv.source) || isNew(nv.source), nv.source);
    const block = [
      `<safetyApplicationHasVariables Id="${guid('var/' + nv.name + '/sahv')}">`,
      `  <variable Id="${guid('var/' + nv.name)}" name="${nv.name}" isLocal="false">`,
      '    <sourceUsages>', `      <variableHasSourceUsages Id="${guid('var/' + nv.name + '/vhsu')}">`, `        <variableUsages Id="${guid('var/' + nv.name + '/svu')}">`, '          <usages>'];
    text += '\n' + block.map(x => i + x).join('\n') + '\n' + usageXml(i + '            ', `var/${nv.name}/S`, nv.source, 'S')
      + ['          </usages>', '        </variableUsages>', '      </variableHasSourceUsages>', '    </sourceUsages>', '    <targetUsages>', `      <variableHasTargetUsages Id="${guid('var/' + nv.name + '/vhtu')}">`, `        <variableUsages Id="${guid('var/' + nv.name + '/tvu')}">`, '          <usages>'].map(x => i + x).join('\n') + '\n'
      + targets.map(k => usageXml(i + '            ', `var/${nv.name}/T/${k}`, k, 'T')).join('')
      + ['          </usages>', '        </variableUsages>', '      </variableHasTargetUsages>', '    </targetUsages>', '  </variable>', '</safetyApplicationHasVariables>'].map(x => i + x).join('\n');
    log.push({newSalVariable: nv.name, source: nv.source, targets});
  }
  edits.push([last.end, last.end, text]);
}
// order of execution (PLAN.json mechanism.order E2b moves + head15; same as repro/proto.mjs e2b/e2e)
let seq = [...blocks.entries()].sort((a, b) => +a[1].attr.orderOfExecution - +b[1].attr.orderOfExecution).map(([k]) => k);
const insBefore = (xs, y) => {for (const x of xs) assert(!seq.includes(x)); assert(seq.includes(y), y); seq.splice(seq.indexOf(y), 0, ...xs);};
const insAfter = (xs, y) => {for (const x of xs) assert(!seq.includes(x)); assert(seq.includes(y), y); seq.splice(seq.indexOf(y) + 1, 0, ...xs);};
insBefore(['Network1/FBAndNotRunSu', 'Network1/FBOrIlRunOk'], 'Network1/FBAnd1');
insBefore(['Network3/FBAndBootFbkOff'], 'Network3/FBAnd2');
insBefore(['Network6/STAGE_LVON', 'Network6/FBAndLvEmg', 'Network6/FBOrStep4'], 'Network6/FBDecouple1');
insBefore(['Network3/FBOrS12Reset'], 'Network3/FBRs1');
insAfter(['Network3/G10_EXIT'], 'Network1/FBEstop1');
insBefore(['RndPhysicalCompact/GATE_SPOIL_R', 'RndPhysicalCompact/GATE_SPOIL_S'], 'RndPhysicalCompact/GATE_029'); // v7.3
const HEAD15 = ['Network3/FBOr2', 'Network3/FBOr1', 'Network3/FBOrS12Reset', 'Network3/FBOr16', 'Network3/FBOr13', 'Network3/FBOr5', 'Network3/FBOr7', 'Network3/FBOr9', 'Network3/FBRs1', 'Network3/FBRs8', 'Network3/FBRs7', 'Network3/FBRs3', 'Network3/FBRs4', 'Network3/FBRs5', 'Network3/FBRs6'];
seq = [...HEAD15, ...seq.filter(s => !HEAD15.includes(s))];
assert.equal(seq.length, EXP.fb); assert.equal(new Set(seq).size, EXP.fb);
const orderMap = [];
seq.forEach((k, i) => {
  const n = String(i + 1);
  if (isNew(k)) {orderMap.push({block: k, from: null, to: i + 1}); return;}
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
  assert(anc(us[0], 'TargetUsages'));
  assert(v.children.find(c => c.tag === 'TargetUsages').children.length - 1 + sgvlAdd.filter(a => a.symbol === r.symbol).length >= 1, 'symbol would lose last consumer ' + r.symbol);
  gEdits.push([...lineRange(gvl, us[0]), '']);
  log.push({sgvlTargetUsageRemoved: r.symbol, portId: r.portId, why: r.why});
}
const addBySym = new Map();
for (const a of sgvlAdd) push(addBySym, a.symbol, a);
for (const [sym, list] of addBySym) {
  const v = symbolsByName.get(sym); const tu = v.children.find(c => c.tag === 'TargetUsages');
  const first = tu.children[0]; assert(first, 'symbol without target usage ' + sym);
  const i = ind(gvl, first);
  const closeStart = tu.end - '</TargetUsages>'.length; const at = gvl.lastIndexOf('\n', closeStart) + 1;
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
const result = {source: EXPECT, plan: PLAN, planFilesAreCurrent: planArchived, staged: {sal: hash(sal), sgvl: hash(gvl), diagram: hash(dia)}, expected: EXP,
  newBlocks: NEW_BLOCKS.map(b => ({path: `${b.net}/${b.name}`, fn: b.fn, id: guid(`${b.net}/${b.name}/block`), inputs: b.inputs})), newVariables: NEW_VARS.map(v => ({...v, id: guid('var/' + v.name), targets: varTargetAdd.get(v.name)})),
  removedWires: [...removedWireIds], addedWires, connectorsRemoved, inputs: INPUTS.map(([k, s, why]) => ({port: k, ...s, why})), orderMap, log,
  crc: 'stored CRC attributes unchanged in staging; native writers regenerate them'};
fs.writeFileSync(path.join(outDir, '..', 'STAGING.json'), JSON.stringify(result, null, 1) + '\n');
console.log(JSON.stringify({staged: result.staged, removedWires: removedWireIds.size, addedWires: addedWires.length, connectorsRemoved, sgvlRemoved: sgvlRemove.length, sgvlAdded: sgvlAdd.length, varUsagesRemoved: varUsageRemove.length, varTargetsAdded: [...varTargetAdd.values()].flat().length}, null, 1));
