// E2-R1 staging: textual, structure-preserving edit of canonical F1 per
// program/architect/E2-status/PLAN.md section 3 R1 + PLAN.json slices[R1]
// + lead decision C-R1-2(a) (drop b_Step6 binding from N3/FBRs6.RsOut).
// Stored CRC values are NOT touched here; native writers regenerate them.
// Usage: node make-candidate.mjs <sourceDir> <stagedDir>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse, walk, anc, lineRange, applyEdits} from './xmlpos.mjs';

const [srcDir, outDir] = process.argv.slice(2);
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const read = f => fs.readFileSync(path.join(srcDir, f), 'utf8');
let sal = read('TwinSafeGroup1.sal'), gvl = read('GVL1.sgvl'), dia = read('TwinSafeGroup1.sal.diagram');
const EXPECT = {sal: '04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3', sgvl: 'dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104', diagram: 'de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603'};
assert.equal(hash(sal), EXPECT.sal); assert.equal(hash(gvl), EXPECT.sgvl); assert.equal(hash(dia), EXPECT.diagram);
// deterministic GUIDs (reproducible staging)
const guid = label => {const h = hash('E2-R1/' + label); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${'89ab'[parseInt(h[16], 16) & 3]}${h.slice(17, 20)}-${h.slice(20, 32)}`;};

const PLAN = JSON.parse(fs.readFileSync(new URL('../../../architect/E2-status/PLAN.json', import.meta.url), 'utf8')).slices.find(s => s.id === 'R1');
const N5 = ['FBAnd1', 'FBDecouple1', 'FBTon1', 'FBAnd2', 'FBTon2', 'FBAnd3', 'FBDecouple2', 'FBTon3', 'FBDecouple3', 'FBAnd5', 'FBTon4', 'FBAnd7', 'FBDecouple4', 'FBOr2', 'FBAnd10'].map(b => 'Network5/' + b);
const DELETE = [...N5, ...PLAN.delete.filter(x => !x.startsWith('Network5/'))];
assert.equal(DELETE.length, 27);
const DEACT = PLAN.deactivate; assert.equal(DEACT.length, 19);
const DEL_SYMS = new Set(PLAN.deleteSymbols); assert.equal(DEL_SYMS.size, 19);
const UNBIND = [['Network3/FBRs6/RsOut', 'b_Step6']]; // C-R1-2(a), lead decision

const log = [];
// ---------------- SAL ----------------
let S = walk(parse(sal));
const blockOf = p => anc(p, 'networkHasFunctionBlocks')?.children[0];
const pname = p => `//${anc(p, 'Network').attr.name}/${blockOf(p).attr.name}/${p.attr.name}`;
const blocks = new Map(S.filter(n => n.parent?.tag === 'networkHasFunctionBlocks').map(b => [`${anc(b, 'Network').attr.name}/${b.attr.name}`, b]));
assert.equal(blocks.size, 242);
const delBlocks = DELETE.map(k => {const b = blocks.get(k); assert(b, k); return b;});
const delPortIds = new Set(), delPortNames = new Set();
for (const b of delBlocks) for (const p of walk(b).filter(n => n.tag === 'inPort' || n.tag === 'outPort')) {delPortIds.add(p.attr.Id); delPortNames.add(pname(p));}
assert.equal(delPortIds.size, 244);
const portsByName = new Map(S.filter(n => n.tag === 'inPort' || n.tag === 'outPort').map(p => [pname(p), p]));
const edits = [];
const removedWireIds = new Set();
// 1. delete block wrappers (wires owned by their outPorts go with them)
for (const b of delBlocks) {
  const w = b.parent; assert.equal(w.tag, 'networkHasFunctionBlocks');
  for (const wl of walk(b).filter(n => n.tag === 'wiredLink')) removedWireIds.add(wl.attr.Id);
  edits.push([...lineRange(sal, w), '']);
}
// 2. wires owned by surviving outPorts that target deleted ports
const REUSE_WIRE_TARGET = '//Network1/FBOr12/OrIn2';
let reusedWire = null;
const survivingOutEdits = new Map(); // outPort node -> list of wires to drop
for (const wl of S.filter(n => n.tag === 'wiredLink')) {
  const owner = wl.parent.parent; const ownerDeleted = delPortIds.has(owner.attr.Id);
  const target = wl.children[0].attr.name;
  if (ownerDeleted) {if (target === REUSE_WIRE_TARGET) reusedWire = wl; continue;}
  if (delPortNames.has(target)) {removedWireIds.add(wl.attr.Id); if (!survivingOutEdits.has(owner)) survivingOutEdits.set(owner, []); survivingOutEdits.get(owner).push(wl);}
}
assert(reusedWire, 'FBAnd3->FBOr12 wire');
assert.equal(pname(reusedWire.parent.parent), '//Network1/FBAnd3/AndOut');
removedWireIds.delete(reusedWire.attr.Id); // its Id is kept and re-owned by N1/FBAnd2.AndOut
// generic element rewrite helper for surviving ports (collapses empty containers)
function rewritePort(port, {dropChildren = [], attrs = null}) {
  // returns [start,end,replacement] for whole port element
  const indent = sal.slice(sal.lastIndexOf('\n', port.start) + 1, port.start);
  let open = sal.slice(port.start, port.openEnd);
  if (attrs) open = attrs(open);
  const keep = port.children.map(c => {
    if (dropChildren.includes(c)) return null;
    if (c.tag === 'targetFunctionBlockPorts') {
      const kept = c.children.filter(w => !dropChildren.includes(w));
      if (!kept.length) return null;
      if (kept.length === c.children.length) return sal.slice(c.start, c.end);
      const ci = sal.slice(sal.lastIndexOf('\n', c.start) + 1, c.start);
      return '<targetFunctionBlockPorts>' + kept.map(w => '\n' + ci + '  ' + sal.slice(w.start, w.end)).join('') + '\n' + ci + '</targetFunctionBlockPorts>';
    }
    return sal.slice(c.start, c.end);
  }).filter(Boolean);
  const selfClosingOpen = open.endsWith('/>') ? open : open.slice(0, -1).replace(/\s*$/, '') + ' />';
  const plainOpen = open.endsWith('/>') ? open.slice(0, -2).replace(/\s*$/, '') + '>' : open;
  if (!keep.length) return [port.start, port.end, selfClosingOpen];
  return [port.start, port.end, plainOpen + keep.map(k => '\n' + indent + '  ' + k).join('') + '\n' + indent + `</${port.tag}>`];
}
const portEdits = new Map(); // port -> {dropChildren:[], attrs:fn[]}
const pe = p => {if (!portEdits.has(p)) portEdits.set(p, {dropChildren: [], attrs: []}); return portEdits.get(p);};
for (const [owner, wires] of survivingOutEdits) pe(owner).dropChildren.push(...wires);

// 3. deactivate ports that lose their source
const symRefOf = p => walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference');
for (const k of DEACT) {
  const p = portsByName.get('//' + k.replace(/\./, '/')); assert(p, k);
  assert.equal(p.attr.channelInterface, 'Activated', k);
  assert.equal(p.attr.filter, '2', k + ' filter (all canonical deactivated ports use filter=2)');
  const refs = symRefOf(p).map(r => r.attr.lastKnownPath.replace('GVL1.', ''));
  for (const r of refs) assert(DEL_SYMS.has(r), `${k} still bound to surviving symbol ${r}`);
  const incoming = S.filter(n => n.tag === 'wiredLink' && n.children[0].attr.name === '//' + k.replace(/\./, '/'));
  for (const w of incoming) assert(delPortIds.has(w.parent.parent.attr.Id), `${k} has surviving wire source`);
  assert(refs.length + incoming.length === 1, `${k} expected exactly one source, got ${refs.length}+${incoming.length}`);
  const e = pe(p);
  e.dropChildren.push(...p.children.filter(c => c.tag === 'fbPortGlobalVariableReferences'));
  e.attrs.push(o => o.replace(/ channelInterface="Activated" deactivate1="[^"]*"/, ' channelInterface="Deactivated"'));
  log.push({deactivate: k, previousSource: refs[0] ? 'GVL1.' + refs[0] : 'wire ' + pname(incoming[0].parent.parent)});
}
// 4. C-R1-2(a): remove b_Step6 binding on FBRs6.RsOut
for (const [k, sym] of UNBIND) {
  const p = portsByName.get('//' + k); const r = p.children.filter(c => c.tag === 'fbPortGlobalVariableReferences');
  assert.equal(r.length, 1); assert.deepEqual(symRefOf(p).map(x => x.attr.lastKnownPath), ['GVL1.' + sym]);
  pe(p).dropChildren.push(r[0]);
  log.push({unbindSymbol: sym, port: k, keptWires: walk(p).filter(n => n.tag === 'wiredLink').map(w => w.children[0].attr.name)});
}
// 5. rewire N1/FBAnd2.AndOut -> N1/FBOr12.OrIn2 (re-own the FBAnd3 wire element)
{
  const p = portsByName.get('//Network1/FBAnd2/AndOut');
  const tfp = p.children.find(c => c.tag === 'targetFunctionBlockPorts'); assert(tfp && tfp.children.length === 1);
  const wtext = sal.slice(reusedWire.start, reusedWire.end); assert(wtext.includes(`name="${REUSE_WIRE_TARGET}"`));
  const last = tfp.children.at(-1); const ind = sal.slice(sal.lastIndexOf('\n', last.start) + 1, last.start);
  edits.push([last.end, last.end, '\n' + ind + wtext]);
  log.push({rewire: 'Network1/FBAnd2.AndOut -> Network1/FBOr12.OrIn2', wiredLinkId: reusedWire.attr.Id, note: 'wire Id of deleted FBAnd3->FBOr12 kept; owner moved to FBAnd2.AndOut'});
}
// apply port rewrites
for (const [p, e] of portEdits) {
  const r = rewritePort(p, {dropChildren: e.dropChildren, attrs: o => e.attrs.reduce((a, f) => f(a), o)});
  edits.push(r);
}
// 6. SAL variable usages: drop usages of deleted ports; add 2 new target usages
const varEdits = [];
for (const v of S.filter(n => n.tag === 'variable')) {
  for (const u of walk(v).filter(n => n.tag === 'variableUsagesHasUsages')) {
    const m = walk(u).find(n => n.tag === 'inPortMoniker' || n.tag === 'outPortMoniker');
    if (m && delPortNames.has(m.attr.name)) {
      const usages = u.parent; assert.equal(usages.tag, 'usages');
      const remaining = usages.children.filter(x => !(walk(x).find(n => n.tag.endsWith('PortMoniker') && delPortNames.has(n.attr.name))));
      assert(remaining.length > 0, `variable ${v.attr.name} would lose all usages in one role`);
      edits.push([...lineRange(sal, u), '']);
      log.push({salVariableUsageRemoved: v.attr.name, port: m.attr.name, role: anc(u, 'targetUsages') ? 'target' : 'source'});
    }
  }
}
function addTarget(varName, port) {
  const v = S.find(n => n.tag === 'variable' && n.attr.name === varName); assert(v, varName);
  const tu = v.children.find(c => c.tag === 'targetUsages'); const usages = walk(tu).find(n => n.tag === 'usages');
  const last = usages.children.at(-1); const ind = sal.slice(sal.lastIndexOf('\n', last.start) + 1, last.start);
  const g = l => guid(`${varName}${port}/${l}`);
  const text = `<variableUsagesHasUsages Id="${g('u')}">\n${ind}  <fbPortUsage Id="${g('p')}">\n${ind}    <functionBlockPort>\n${ind}      <fbPortUsageReferencesFunctionBlockPort Id="${g('r')}">\n${ind}        <inPortMoniker name="${port}" />\n${ind}      </fbPortUsageReferencesFunctionBlockPort>\n${ind}    </functionBlockPort>\n${ind}  </fbPortUsage>\n${ind}</variableUsagesHasUsages>`;
  edits.push([last.end, last.end, '\n' + ind + text]);
  log.push({salVariableTargetAdded: varName, port});
}
addTarget('in_False_SI2_CH8', '//Network3/FBDecouple2/DecIn2');
addTarget('out_EStop_Status', '//Network6/FBAnd9/AndIn1');
// sanity: both rewire target ports must lose their wire source (owned by deleted blocks)
for (const t of ['//Network3/FBDecouple2/DecIn2', '//Network6/FBAnd9/AndIn1', REUSE_WIRE_TARGET]) {
  const inc = S.filter(n => n.tag === 'wiredLink' && n.children[0].attr.name === t);
  assert.equal(inc.length, 1); assert(delPortIds.has(inc[0].parent.parent.attr.Id), t);
}
// 7. orderOfExecution: compact 1..215 preserving relative F1 order
const survivors = [...blocks.values()].filter(b => !delBlocks.includes(b)).sort((a, b) => +a.attr.orderOfExecution - +b.attr.orderOfExecution);
assert.equal(survivors.length, 215);
const orderMap = [];
survivors.forEach((b, i) => {
  const o = b.attr.orderOfExecution, n = String(i + 1);
  if (o !== n) {
    const open = sal.slice(b.start, b.openEnd); const at = open.indexOf(` orderOfExecution="${o}"`); assert(at > 0);
    edits.push([b.start + at, b.start + at + ` orderOfExecution="${o}"`.length, ` orderOfExecution="${n}"`]);
  }
  orderMap.push({block: `${anc(b, 'Network').attr.name}/${b.attr.name}`, from: +o, to: i + 1});
});
sal = applyEdits(sal, edits);

// ---------------- SGVL ----------------
const G = walk(parse(gvl));
const gEdits = [];
const removedRefsPorts = new Set([...delPortIds]);
// ports whose global refs are removed but port survives: deactivated + unbind
for (const k of DEACT) {const p = portsByName.get('//' + k.replace(/\./, '/')); if (symRefOf(p).length) removedRefsPorts.add(p.attr.Id);}
for (const [k] of UNBIND) removedRefsPorts.add(portsByName.get('//' + k).attr.Id);
const symbolsAfter = [], deletedSymbols = [];
for (const v of G.filter(n => n.tag === 'Variable')) {
  const nameNode = v.children.find(c => c.tag === 'Name'); const name = gvl.slice(nameNode.openEnd, nameNode.end - '</Name>'.length).trim();
  const use = role => v.children.find(c => c.tag === role).children.filter(c => c.tag === 'FbPortUsage');
  const idOf = u => {const m = u.children.find(c => c.tag === 'ModelElementId'); return gvl.slice(m.openEnd, m.end - '</ModelElementId>'.length).trim();};
  const src = use('SourceUsages'), tgt = use('TargetUsages');
  const dropS = src.filter(u => removedRefsPorts.has(idOf(u))), dropT = tgt.filter(u => removedRefsPorts.has(idOf(u)));
  const keepS = src.length - dropS.length, keepT = tgt.length - dropT.length;
  if (keepS === 0 && keepT === 0) {gEdits.push([...lineRange(gvl, v), '']); deletedSymbols.push(name); continue;}
  assert(keepS > 0 && keepT > 0 || (name === 'b_Step6' && false), `symbol ${name} would become half-bound S${keepS}/T${keepT}`);
  for (const u of [...dropS, ...dropT]) {gEdits.push([...lineRange(gvl, u), '']); log.push({sgvlUsageRemoved: name, role: dropS.includes(u) ? 'source' : 'target', modelElementId: idOf(u)});}
  symbolsAfter.push(name);
}
const expectedDeleted = [...DEL_SYMS, 'b_Step6'].sort();
assert.deepEqual([...deletedSymbols].sort(), expectedDeleted);
gvl = applyEdits(gvl, gEdits);

// ---------------- diagram ----------------
const D = walk(parse(dia));
const dEdits = [];
const delBlockNames = new Set(DELETE.map(k => '//' + k));
const removedShapeIds = new Set();
for (const n of D.filter(n => /^fB\w+Shape$/.test(n.tag))) {
  const mon = n.children.find(c => c.tag.endsWith('Moniker'));
  if (delBlockNames.has(mon.attr.name)) {dEdits.push([...lineRange(dia, n), '']); for (const s of walk(n)) if (s.attr.Id) removedShapeIds.add(s.attr.Id);}
}
assert.equal(dEdits.length, 27);
const fbAnd2Out = D.find(n => n.tag === 'outPortShape' && n.children[0].attr.name === '//Network1/FBAnd2/AndOut');
const fbAnd3Out = D.find(n => n.tag === 'outPortShape' && n.children[0].attr.name === '//Network1/FBAnd3/AndOut');
let connectorsRemoved = 0;
for (const c of D.filter(n => n.tag === 'wiredLinkConnector')) {
  const wid = c.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id;
  const nodes = walk(c).filter(x => x.tag.endsWith('PortShapeMoniker')).map(x => x.attr.Id);
  if (wid === reusedWire.attr.Id) {
    const open = dia.slice(c.start, c.openEnd); assert(open.includes('edgePoints="[(12.8 : 30.565); '));
    const om = walk(c).find(x => x.tag === 'outPortShapeMoniker'); assert.equal(om.attr.Id, fbAnd3Out.attr.Id);
    dEdits.push([c.start, c.openEnd, open.replace('edgePoints="[(12.8 : 30.565); ', 'edgePoints="[(5.8 : 30.565); ')]);
    const omText = dia.slice(om.start, om.end); dEdits.push([om.start, om.end, omText.replace(fbAnd3Out.attr.Id, fbAnd2Out.attr.Id)]);
    continue;
  }
  if (removedWireIds.has(wid)) {dEdits.push([...lineRange(dia, c), '']); connectorsRemoved++; continue;}
  for (const id of nodes) assert(!removedShapeIds.has(id), `connector ${c.attr.Id} references removed shape but wire kept`);
}
assert.equal(connectorsRemoved, removedWireIds.size, 'every removed wire had exactly one connector');
dia = applyEdits(dia, dEdits);

fs.mkdirSync(outDir, {recursive: true});
for (const [f, x] of [['TwinSafeGroup1.sal', sal], ['GVL1.sgvl', gvl], ['TwinSafeGroup1.sal.diagram', dia]]) fs.writeFileSync(path.join(outDir, f), x);
const result = {source: EXPECT, staged: {sal: hash(sal), sgvl: hash(gvl), diagram: hash(dia)}, deletedBlocks: DELETE, deletedPorts: delPortIds.size, removedWires: removedWireIds.size, reusedWire: reusedWire.attr.Id, connectorsRemoved, deletedSymbols, symbolsAfter: symbolsAfter.length, orderMap, log, crc: 'stored CRC attributes unchanged in staging; native writers regenerate them'};
fs.writeFileSync(path.join(outDir, '..', 'STAGING.json'), JSON.stringify(result, null, 1) + '\n');
console.log(JSON.stringify({staged: result.staged, deletedPorts: result.deletedPorts, removedWires: result.removedWires, connectorsRemoved, deletedSymbols: deletedSymbols.length, symbolsAfter: symbolsAfter.length}, null, 1));
