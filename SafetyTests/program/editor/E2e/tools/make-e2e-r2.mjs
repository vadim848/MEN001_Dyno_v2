// E2e staging: PLAN E2-S2 (4 fixes, +7 FB) over frozen candidate E2d v7.7. Same engine as make-e2d.mjs.
// Stored CRC values are NOT touched; native writers regenerate them.
// Usage: node make-e2e.mjs <sourceDir E2d> <stagedDir>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse, walk, anc, lineRange, applyEdits} from './xmlpos.mjs';

const [srcDir, outDir] = process.argv.slice(2);
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const read = f => fs.readFileSync(path.join(srcDir, f), 'utf8');
let sal = read('TwinSafeGroup1.sal'), gvl = read('GVL1.sgvl'), dia = read('TwinSafeGroup1.sal.diagram');
const EXPECT = {sal: '325e3c4c2656ee4b6bd6b4206fb6104b8f0f06c258cda131b367e59b9b478e6e', sgvl: '0083ec7653f70f2d0bd2915698a8b6047738d3769bbb70d2ddb5a2a76ef4c52f', diagram: 'abfad8f8376464cd234a7784fe3eec52a068b100036f97b60f5616e3dd2a709f'}; // E2e r1
assert.equal(hash(sal), EXPECT.sal); assert.equal(hash(gvl), EXPECT.sgvl); assert.equal(hash(dia), EXPECT.diagram);
const PLAN = {md: 'ea6b43e9b7848c877cdc0c90be71f7dc620dc5bf7384b1404c97a6c366e48051', json: ''}; // PLAN_ADD_D04
const planFile = f => fs.readFileSync(new URL('../../../architect/E2-S2/' + f, import.meta.url));
const planArchived = [['PLAN_ADD_D04.md', PLAN.md]].every(([f, h]) => hash(planFile(f)) === h);
assert(planArchived, 'PLAN E2-S2 hash mismatch');
const guid = label => {const h = hash('E2e-r2/' + label); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${'89ab'[parseInt(h[16], 16) & 3]}${h.slice(17, 20)}-${h.slice(20, 32)}`;};
const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';
const AND = 'Network6/FBAnd9', OR = 'Network6/FBOr5'; // native templates (as E2a-core)

// ---------------- plan (E2d, PLAN v7.5: addendum v7.1, v7.4; v7.2 FBOrFbk10C2 cancelled; v7.5 legacy (1,1) R&D->Run removed) ----------------
// input spec: {wire: outPortKey}|{symbol}|{variable: SAL variable name}|{deactivate:true}; contact required for activated ports
// v7.5: FBOrFbk10C2 (v7.2) cancelled. v7.6 K-1: attempt memory STATE_PF (permit lost while any button pressed)
const NEW_BLOCKS = [
  {net: 'RndPhysicalCompact', name: 'SG_S12_SCOPE', fn: 'safeAnd', template: AND, inputs: {AndIn1: {variable: 'linkRndGatePermit', contact: NC}, AndIn2: {symbol: 'b_Step12', contact: NC}}},
  {net: 'RndPhysicalCompact', name: 'SG_SCOPE', fn: 'safeOr', template: OR, inputs: {OrIn1: {variable: 'linkSafeRndScope', contact: NC}, OrIn2: {wire: 'RndPhysicalCompact/SG_S12_SCOPE/AndOut', contact: NC}}},
];
const DELETE_BLOCKS = [];
const NEW_VARS = [];
const INPUTS = [
  ['RndPhysicalCompact/STATE_SG/Reset', {wire: 'RndPhysicalCompact/SG_SCOPE/OrOut', contact: NO}, 'D-04 item 3'],
  ['Network3/FBOrS12Reset/OrIn3', {symbol: 'b_Step2_Set_2', contact: NC}, 'D-04 item 4'],
];
const EXP = {fb: 239, ports: 2022, symbols: 63, salVariables: 79};

const log = [];
const S = walk(parse(sal));
const blockOf = p => anc(p, 'networkHasFunctionBlocks')?.children[0];
const pkey = p => `${anc(p, 'Network').attr.name}/${blockOf(p).attr.name}/${p.attr.name}`;
const blocks = new Map(S.filter(n => n.parent?.tag === 'networkHasFunctionBlocks').map(b => [`${anc(b, 'Network').attr.name}/${b.attr.name}`, b]));
assert.equal(blocks.size, 237);
const ports = new Map(S.filter(n => n.tag === 'inPort' || n.tag === 'outPort').map(p => [pkey(p), p]));
assert.equal(ports.size, 2004);
const G0 = walk(parse(gvl));
const gtext = n => gvl.slice(n.openEnd, n.end - `</${n.tag}>`.length).trim();
const symbolsByName = new Map(G0.filter(n => n.tag === 'Variable').map(v => [gtext(v.children.find(c => c.tag === 'Name')), v]));
assert.equal(symbolsByName.size, 63);
const varsByName = new Map(S.filter(n => n.tag === 'variable').map(v => [v.attr.name, v]));
assert.equal(varsByName.size, 79);
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
// v7.5 block deletion: wrappers removed; wires out of / into them dropped; SAL-variable and SGVL usages on their ports removed
const deletedPortKeys = new Set(), deletedLog = [];
for (const k of DELETE_BLOCKS) {
  const b = blocks.get(k); assert(b, k);
  for (const p of walk(b).filter(n => n.tag === 'inPort' || n.tag === 'outPort')) deletedPortKeys.add(pkey(p));
}
for (const k of DELETE_BLOCKS) {
  const b = blocks.get(k);
  for (const wl of walk(b).filter(n => n.tag === 'wiredLink')) {removedWireIds.add(wl.attr.Id); const to = wl.children[0].attr.name.slice(2); assert(deletedPortKeys.has(to) || inSpecs.get(to)?.spec.deactivate, 'deleted block feeds a retained input not deactivated by the plan: ' + to);}
  for (const p of walk(b).filter(n => n.tag === 'inPort')) {
    const key = pkey(p);
    for (const {w, from} of wires.filter(x => x.to === key)) {removedWireIds.add(w.attr.Id); if (!deletedPortKeys.has(from)) push(outDrop, from, w);}
    for (const r of walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference')) sgvlRemove.push({symbol: r.attr.lastKnownPath.replace('GVL1.', ''), portId: p.attr.Id, why: 'deleted ' + k});
    for (const m of varTargetsOf(key)) {const u = anc(m, 'variableUsagesHasUsages'); const v = anc(m, 'variable'); const left = walk(v).filter(n => n.tag === 'variableUsagesHasUsages' && anc(n, 'targetUsages')).length - 1; lossCheck.push([v.attr.name, left]); varUsageRemove.push(u); log.push({salVariableTargetUsageRemoved: v.attr.name, port: key, why: 'deleted ' + k});}
  }
  for (const p of walk(b).filter(n => n.tag === 'outPort')) {
    assert(!walk(p).some(n => n.tag === 'fbPortGlobalVariableReference'), 'deleted block writes a Symbol ' + pkey(p));
    assert(!S.some(n => n.tag === 'outPortMoniker' && !anc(n, 'networkHasFunctionBlocks') && n.attr.name === '//' + pkey(p)), 'deleted block writes a SAL variable ' + pkey(p));
  }
  edits.push([...lineRange(sal, b.parent), '']);
  log.push({deleteBlock: k});
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
  if (spec.estop) {assert(/ channelInterface="Both Deactivated"/.test(open) && !/ deactivate1=/.test(open), 'estop port ' + pkey(p)); return open.replace(' channelInterface="Both Deactivated"', ' channelInterface="Single-Channel 1 Activated" deactivate1="Break Contact (NC)"');}
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
  if (isNew(k) || deletedPortKeys.has(k)) continue;
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
// order of execution (v7.5: only renumbering after deletions)
let seq = [...blocks.entries()].sort((a, b) => +a[1].attr.orderOfExecution - +b[1].attr.orderOfExecution).map(([k]) => k);
const insBefore = (xs, y) => {for (const x of xs) assert(!seq.includes(x)); assert(seq.includes(y), y); seq.splice(seq.indexOf(y), 0, ...xs);};
const insAfter = (xs, y) => {for (const x of xs) assert(!seq.includes(x)); assert(seq.includes(y), y); seq.splice(seq.indexOf(y) + 1, 0, ...xs);};
seq = seq.filter(k => !DELETE_BLOCKS.includes(k)); // v7.5: deleted blocks leave the sequence, relative order kept
insBefore(['RndPhysicalCompact/SG_S12_SCOPE','RndPhysicalCompact/SG_SCOPE'], 'RndPhysicalCompact/STATE_SG');
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
const delNames = new Set(DELETE_BLOCKS.map(k => '//' + k)); const removedShapeIds = new Set(); let shapesRemoved = 0;
for (const n of D.filter(n => /^fB\w+Shape$/.test(n.tag))) {const mon = n.children.find(c => c.tag.endsWith('Moniker')); if (delNames.has(mon.attr.name)) {dEdits.push([...lineRange(dia, n), '']); shapesRemoved++; for (const x of walk(n)) if (x.attr.Id) removedShapeIds.add(x.attr.Id);}}
assert.equal(shapesRemoved, DELETE_BLOCKS.length);
for (const c of D.filter(n => n.tag === 'wiredLinkConnector')) {
  const wid = c.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id;
  if (removedWireIds.has(wid)) {dEdits.push([...lineRange(dia, c), '']); connectorsRemoved++;}
}
assert.equal(connectorsRemoved, removedWireIds.size, 'every removed wire had exactly one connector');
for (const c of D.filter(n => n.tag === 'wiredLinkConnector')) if (!removedWireIds.has(c.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id)) for (const x of walk(c).filter(x => x.tag.endsWith('PortShapeMoniker'))) assert(!removedShapeIds.has(x.attr.Id), 'kept connector references a removed shape');
dia = applyEdits(dia, dEdits);

fs.mkdirSync(outDir, {recursive: true});
for (const [f, x] of [['TwinSafeGroup1.sal', sal], ['GVL1.sgvl', gvl], ['TwinSafeGroup1.sal.diagram', dia]]) fs.writeFileSync(path.join(outDir, f), x);
const addedWires = [...outAdd.entries()].flatMap(([from, ws]) => ws.map(w => ({id: w.id, from, to: w.to})));
const result = {source: EXPECT, plan: PLAN, planFilesAreCurrent: planArchived, staged: {sal: hash(sal), sgvl: hash(gvl), diagram: hash(dia)}, expected: EXP,
  newBlocks: NEW_BLOCKS.map(b => ({path: `${b.net}/${b.name}`, fn: b.fn, id: guid(`${b.net}/${b.name}/block`), inputs: b.inputs})), newVariables: NEW_VARS.map(v => ({...v, id: guid('var/' + v.name), targets: varTargetAdd.get(v.name)})),
  deletedBlocks: DELETE_BLOCKS, removedWires: [...removedWireIds], addedWires, connectorsRemoved, inputs: INPUTS.map(([k, s, why]) => ({port: k, ...s, why})), orderMap, log,
  crc: 'stored CRC attributes unchanged in staging; native writers regenerate them'};
fs.writeFileSync(path.join(outDir, '..', 'STAGING.json'), JSON.stringify(result, null, 1) + '\n');
console.log(JSON.stringify({staged: result.staged, removedWires: removedWireIds.size, addedWires: addedWires.length, connectorsRemoved, sgvlRemoved: sgvlRemove.length, sgvlAdded: sgvlAdd.length, varUsagesRemoved: varUsageRemove.length, varTargetsAdded: [...varTargetAdd.values()].flat().length}, null, 1));
