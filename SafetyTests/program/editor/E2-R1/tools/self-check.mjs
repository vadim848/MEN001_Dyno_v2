// E2-R1 editor self-check (not an acceptance oracle).
// node self-check.mjs <sourceDir> <stagedDir> <nativeDir> <out.json>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parse, walk, anc} from './xmlpos.mjs';
import {inspectNativeSalStructure} from '../../../../src/sal-native-structure.js';
import {validateSalBindings} from '../../../../src/sal-binding-validator.js';

const [srcDir, stagedDir, nativeDir, outFile] = process.argv.slice(2);
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const files = d => Object.fromEntries(['TwinSafeGroup1.sal', 'GVL1.sgvl', 'TwinSafeGroup1.sal.diagram'].map(f => [f, fs.readFileSync(path.join(d, f), 'utf8')]));
const text = (xml, n) => xml.slice(n.openEnd, n.end - `</${n.tag}>`.length).trim();

function netlist(dir) {
  const F = files(dir), sal = F['TwinSafeGroup1.sal'], gvl = F['GVL1.sgvl'];
  const S = walk(parse(sal)), G = walk(parse(gvl));
  const symById = new Map(G.filter(n => n.tag === 'Variable').map(v => [v.attr.Id, text(gvl, v.children.find(c => c.tag === 'Name'))]));
  const pn = p => `//${anc(p, 'Network').attr.name}/${anc(p, 'networkHasFunctionBlocks').children[0].attr.name}/${p.attr.name}`;
  const blocks = {}, portIdToName = new Map();
  for (const b of S.filter(n => n.parent?.tag === 'networkHasFunctionBlocks')) {
    const key = `${anc(b, 'Network').attr.name}/${b.attr.name}`;
    const ports = {};
    for (const p of walk(b).filter(n => ['inPort', 'outPort', 'parameterPort'].includes(n.tag))) {
      if (p.tag !== 'parameterPort') portIdToName.set(p.attr.Id, pn(p));
      const {Id, ...attrs} = p.attr;
      ports[p.attr.name] = {tag: p.tag, Id, attrs,
        globals: walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference').map(r => ({symbol: symById.get(r.attr.variableId) ?? `DANGLING:${r.attr.variableId}`, path: r.attr.lastKnownPath})),
        wires: walk(p).filter(n => n.tag === 'wiredLink').map(w => ({Id: w.attr.Id, to: w.children[0].attr.name}))};
    }
    const {orderOfExecution, ...battrs} = b.attr;
    blocks[key] = {tag: b.tag, order: +orderOfExecution, attrs: battrs, ports};
  }
  const variables = {};
  for (const v of S.filter(n => n.tag === 'variable')) {
    variables[v.attr.name] = {Id: v.attr.Id, usages: walk(v).filter(n => n.tag === 'variableUsagesHasUsages').map(u => {
      const m = walk(u).find(n => n.tag.endsWith('Moniker')); const k = u.children[0];
      return {role: anc(u, 'targetUsages') ? 'T' : 'S', kind: k.tag, ref: m ? m.attr.name : JSON.stringify({sdsId: k.attr.sdsId, channelId: k.attr.channelId, functionId: k.attr.functionId})};
    })};
  }
  const symbols = {};
  for (const v of G.filter(n => n.tag === 'Variable')) {
    const use = r => v.children.find(c => c.tag === r).children.map(u => {const id = text(gvl, u.children.find(c => c.tag === 'ModelElementId')); return portIdToName.get(id) ?? `DANGLING:${id}`;});
    symbols[symById.get(v.attr.Id)] = {Id: v.attr.Id, source: use('SourceUsages'), target: use('TargetUsages')};
  }
  const networks = S.filter(n => n.tag === 'Network').map(n => ({...n.attr, blocks: walk(n).filter(x => x.parent?.tag === 'networkHasFunctionBlocks').length}));
  return {F, sal, gvl, blocks, variables, symbols, networks, crc: {sal: S.find(n => n.tag === 'safetyApplication').attr.Crc, sgvl: G.find(n => n.tag === 'GlobalVariables').attr.Crc}};
}
const src = netlist(srcDir), stg = netlist(stagedDir), nat = netlist(nativeDir);
const report = {generatedAt: new Date().toISOString(), sha: {}, checks: []};
for (const [k, d] of [['source', srcDir], ['staged', stagedDir], ['native', nativeDir]]) report.sha[k] = Object.fromEntries(Object.entries(files(d)).map(([f, x]) => [f, hash(x)]));
const check = (id, ok, detail) => {report.checks.push({id, status: ok ? 'PASS' : 'FAIL', detail}); console.log(ok ? 'PASS' : 'FAIL', id, typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 300));};

// 1. staged == native semantically (native only normalises formatting + CRC)
const strip = n => JSON.stringify({blocks: n.blocks, variables: n.variables, symbols: n.symbols, networks: n.networks});
check('native-equals-staged-semantics', strip(stg) === strip(nat), 'blocks/ports/attrs/order/wires/global refs/SAL usages/SGVL usages identical; only CRC/formatting differ');
// 2. native structure + binding audit on native
const ns = inspectNativeSalStructure(nat.sal); check('native-structure-preflight', ns.status === 'PASS', ns);
const ba = validateSalBindings(nat.sal, nat.gvl); check('binding-audit', ba.status === 'PASS' && ba.errors.length === 0, {status: ba.status, errors: ba.errors, globalRefs: ba.globalRefs?.length, edges: ba.edges?.length});
// 3. counts
const portCount = n => Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).filter(p => p.tag !== 'parameterPort').length, 0);
const wireCount = n => Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).reduce((x, p) => x + p.wires.length, 0), 0);
const counts = n => ({networks: n.networks.length, fb: Object.keys(n.blocks).length, ports: portCount(n), symbols: Object.keys(n.symbols).length, salVariables: Object.keys(n.variables).length, wires: wireCount(n), globalRefs: Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).reduce((x, p) => x + p.globals.length, 0), 0), sgvlUsages: Object.values(n.symbols).reduce((a, s) => a + s.source.length + s.target.length, 0)});
report.counts = {source: counts(src), native: counts(nat)};
check('counts-215-1832-65', report.counts.native.fb === 215 && report.counts.native.ports === 1832 && report.counts.native.symbols === 65 && report.counts.native.salVariables === 75 && report.counts.native.networks === 14, report.counts);
check('global-refs-equal-sgvl-usages', report.counts.native.globalRefs === report.counts.native.sgvlUsages, report.counts.native);
// 4. no dangling: SGVL usages resolve, global refs resolve, SAL usages resolve, wires resolve
const allPorts = new Set(Object.entries(nat.blocks).flatMap(([k, b]) => Object.keys(b.ports).map(p => `//${k}/${p}`)));
const dangling = [
  ...Object.entries(nat.symbols).flatMap(([s, v]) => [...v.source, ...v.target].filter(x => x.startsWith('DANGLING')).map(x => `sgvl ${s} ${x}`)),
  ...Object.entries(nat.blocks).flatMap(([k, b]) => Object.entries(b.ports).flatMap(([p, x]) => [...x.globals.filter(g => g.symbol.startsWith('DANGLING')).map(g => `ref //${k}/${p} ${g.symbol}`), ...x.wires.filter(w => !allPorts.has(w.to)).map(w => `wire //${k}/${p} -> ${w.to}`)])),
  ...Object.entries(nat.variables).flatMap(([v, x]) => x.usages.filter(u => u.kind === 'fbPortUsage' && !allPorts.has(u.ref)).map(u => `var ${v} ${u.ref}`))];
check('no-dangling-references', dangling.length === 0, dangling);
// global ref <-> SGVL usage pairing per port (1:1, same symbol, same role)
const pairing = [];
for (const [k, b] of Object.entries(nat.blocks)) for (const [p, x] of Object.entries(b.ports)) for (const g of x.globals) {
  const s = nat.symbols[g.symbol]; const role = x.tag === 'outPort' ? 'source' : 'target';
  if (!s || s[role].filter(u => u === `//${k}/${p}`).length !== 1) pairing.push(`//${k}/${p} ${g.symbol} ${role}`);
  if (g.path !== `GVL1.${g.symbol}`) pairing.push(`lastKnownPath //${k}/${p} ${g.path}`);
}
check('global-ref-sgvl-usage-pairing', pairing.length === 0, pairing);
const halfBound = Object.entries(nat.symbols).filter(([, s]) => !s.source.length || !s.target.length).map(([n, s]) => `${n} S${s.source.length}/T${s.target.length}`);
check('every-symbol-has-source-and-consumer', halfBound.length === 0, halfBound);
const multiSource = Object.entries(nat.symbols).filter(([, s]) => s.source.length !== 1).map(([n]) => n);
check('every-symbol-single-source', multiSource.length === 0, multiSource);
// 5. C-R1-4: none of the removed Symbols / N4 ports remain anywhere
const N4ports = Object.entries(src.blocks).filter(([k]) => k.startsWith('Network4/')).flatMap(([k, b]) => Object.values(b.ports).map(p => p.Id));
const anyN4 = N4ports.filter(id => nat.sal.includes(id) || nat.gvl.includes(id) || nat.F['TwinSafeGroup1.sal.diagram'].includes(id));
check('C-R1-4-N4-port-ids-gone', anyN4.length === 0, {n4PortIds: N4ports.length, remaining: anyN4});
const n4refs = Object.entries(src.blocks).filter(([k]) => k.startsWith('Network4/')).flatMap(([k, b]) => Object.entries(b.ports).flatMap(([p, x]) => x.globals.map(g => `${p}:${g.symbol}`)));
report.n4SourceGlobalRefs = n4refs;
const removedSyms = Object.keys(src.symbols).filter(s => !(s in nat.symbols));
const removedSymIds = removedSyms.map(s => src.symbols[s].Id);
const symLeft = removedSymIds.filter(id => nat.sal.includes(id) || nat.gvl.includes(id));
const nameLeft = removedSyms.filter(s => nat.sal.includes(`GVL1.${s}"`) || nat.gvl.includes(`<Name>${s}</Name>`));
check('removed-symbols-fully-gone', symLeft.length === 0 && nameLeft.length === 0, {removed: removedSyms, idLeft: symLeft, nameLeft});
// 6. deltas vs source limited to plan
const plan = JSON.parse(fs.readFileSync(new URL('../../../architect/E2-status/PLAN.json', import.meta.url), 'utf8')).slices.find(s => s.id === 'R1');
const deleted = Object.keys(src.blocks).filter(k => !(k in nat.blocks)).sort();
const expectedDeleted = [...['FBAnd1', 'FBDecouple1', 'FBTon1', 'FBAnd2', 'FBTon2', 'FBAnd3', 'FBDecouple2', 'FBTon3', 'FBDecouple3', 'FBAnd5', 'FBTon4', 'FBAnd7', 'FBDecouple4', 'FBOr2', 'FBAnd10'].map(b => 'Network5/' + b), ...plan.delete.filter(x => !x.startsWith('Network5/'))].sort();
check('deleted-blocks-equal-plan', JSON.stringify(deleted) === JSON.stringify(expectedDeleted) && Object.keys(nat.blocks).every(k => k in src.blocks), deleted);
check('deleted-symbols-equal-plan-plus-b_Step6', JSON.stringify(removedSyms.sort()) === JSON.stringify([...plan.deleteSymbols, 'b_Step6'].sort()), removedSyms);
// per-port diffs on surviving blocks
const portDiffs = [];
const deact = new Set(plan.deactivate.map(x => x.replace('.', '/')));
for (const [k, b] of Object.entries(nat.blocks)) {
  const a = src.blocks[k];
  assert.equal(a.tag, b.tag);
  if (JSON.stringify(a.attrs) !== JSON.stringify(b.attrs)) portDiffs.push({block: k, kind: 'block-attrs'});
  for (const [p, y] of Object.entries(b.ports)) {
    const x = a.ports[p]; const key = `${k}/${p}`;
    if (x.Id !== y.Id) portDiffs.push({port: key, kind: 'port-id'});
    if (JSON.stringify(x.attrs) !== JSON.stringify(y.attrs)) portDiffs.push({port: key, kind: 'attrs', from: x.attrs, to: y.attrs});
    if (JSON.stringify(x.globals) !== JSON.stringify(y.globals)) portDiffs.push({port: key, kind: 'globals', from: x.globals.map(g => g.symbol), to: y.globals.map(g => g.symbol)});
    if (JSON.stringify(x.wires) !== JSON.stringify(y.wires)) portDiffs.push({port: key, kind: 'wires', from: x.wires.map(w => w.to), to: y.wires.map(w => w.to)});
  }
}
report.portDiffs = portDiffs;
const allowedPort = d => {
  if (d.kind === 'attrs') return deact.has(d.port) && d.to.channelInterface === 'Deactivated' && !('deactivate1' in d.to) && JSON.stringify({...d.from, channelInterface: 'Deactivated', deactivate1: undefined}) === JSON.stringify({...d.to, deactivate1: undefined});
  if (d.kind === 'globals') return (deact.has(d.port) && d.to.length === 0 && d.from.every(s => plan.deleteSymbols.includes(s))) || (d.port === 'Network3/FBRs6/RsOut' && JSON.stringify(d.from) === '["b_Step6"]' && d.to.length === 0);
  if (d.kind === 'wires') return d.from.every(t => d.to.includes(t) || deleted.some(b => t.startsWith(`//${b}/`))) && d.to.every(t => d.from.includes(t) || (d.port === 'Network1/FBAnd2/AndOut' && t === '//Network1/FBOr12/OrIn2'));
  return false;
};
const unexpected = portDiffs.filter(d => !allowedPort(d));
check('surviving-port-deltas-only-planned', unexpected.length === 0, unexpected);
const deactDone = [...deact].filter(p => portDiffs.some(d => d.port === p && d.kind === 'attrs'));
check('all-19-deactivations-applied', deactDone.length === 19, deactDone.length);
// SAL variable usage deltas
const varDiffs = [];
for (const [v, y] of Object.entries(nat.variables)) {
  const x = src.variables[v]; const a = x.usages.map(u => JSON.stringify(u)), b = y.usages.map(u => JSON.stringify(u));
  const removed = a.filter(u => !b.includes(u)).map(u => JSON.parse(u)), added = b.filter(u => !a.includes(u)).map(u => JSON.parse(u));
  if (removed.length || added.length) varDiffs.push({variable: v, removed, added});
}
report.salVariableDiffs = varDiffs;
const okVar = varDiffs.every(d => d.removed.every(u => deleted.some(b => u.ref.startsWith(`//${b}/`))) && d.added.every(u => (d.variable === 'in_False_SI2_CH8' && u.ref === '//Network3/FBDecouple2/DecIn2' && u.role === 'T') || (d.variable === 'out_EStop_Status' && u.ref === '//Network6/FBAnd9/AndIn1' && u.role === 'T')));
const added = varDiffs.flatMap(d => d.added.map(u => d.variable + '->' + u.ref));
check('sal-variable-usage-deltas-only-planned', okVar && added.length === 2, varDiffs.map(d => ({v: d.variable, removed: d.removed.length, added: d.added.map(u => u.ref)})));
// rewires present
check('rewire-DecIn2-in_False', nat.variables.in_False_SI2_CH8.usages.some(u => u.ref === '//Network3/FBDecouple2/DecIn2' && u.role === 'T'), '');
check('rewire-FBAnd2-to-FBOr12.OrIn2', nat.blocks['Network1/FBAnd2'].ports.AndOut.wires.some(w => w.to === '//Network1/FBOr12/OrIn2'), nat.blocks['Network1/FBAnd2'].ports.AndOut.wires);
check('rewire-FBAnd9.AndIn1-out_EStop_Status', nat.variables.out_EStop_Status.usages.some(u => u.ref === '//Network6/FBAnd9/AndIn1' && u.role === 'T'), '');
// one wire per (from,to) pair; each target in-port has at most one source
const targets = {}; const pairs = new Set(); let dupPairs = 0;
for (const [k, b] of Object.entries(nat.blocks)) for (const [p, x] of Object.entries(b.ports)) for (const w of x.wires) {const pr = `//${k}/${p}>${w.to}`; if (pairs.has(pr)) dupPairs++; pairs.add(pr); (targets[w.to] ??= []).push(pr);}
const sourcesPerIn = {};
for (const t of Object.keys(targets)) sourcesPerIn[t] = targets[t].length;
for (const [v, x] of Object.entries(nat.variables)) for (const u of x.usages) if (u.role === 'T' && u.kind === 'fbPortUsage') sourcesPerIn[u.ref] = (sourcesPerIn[u.ref] ?? 0) + 1;
for (const [s, x] of Object.entries(nat.symbols)) for (const t of x.target) sourcesPerIn[t] = (sourcesPerIn[t] ?? 0) + 1;
const multi = Object.entries(sourcesPerIn).filter(([, n]) => n > 1);
check('single-source-per-input-and-unique-wire-pairs', dupPairs === 0 && multi.length === 0, {dupPairs, multi});
// Active inputs all have a source; deactivated have none
const activeNoSrc = [], deactWithSrc = [];
for (const [k, b] of Object.entries(nat.blocks)) for (const [p, x] of Object.entries(b.ports)) if (x.tag === 'inPort') {
  const n = sourcesPerIn[`//${k}/${p}`] ?? 0;
  if (x.attrs.channelInterface === 'Activated' && n === 0) activeNoSrc.push(`${k}/${p}`);
  if (x.attrs.channelInterface === 'Deactivated' && n > 0) deactWithSrc.push(`${k}/${p}`);
}
const srcActiveNoSrc = [];
for (const [k, b] of Object.entries(src.blocks)) for (const [p, x] of Object.entries(b.ports)) if (x.tag === 'inPort' && x.attrs.channelInterface === 'Activated') {
  const has = Object.values(src.blocks).some(bb => Object.values(bb.ports).some(pp => pp.wires.some(w => w.to === `//${k}/${p}`))) || x.globals.length || Object.values(src.variables).some(v => v.usages.some(u => u.ref === `//${k}/${p}`));
  if (!has) srcActiveNoSrc.push(`${k}/${p}`);
}
check('activated-inputs-have-source', activeNoSrc.length === 0, {native: activeNoSrc, canonicalBaseline: srcActiveNoSrc});
check('deactivated-inputs-have-no-source', deactWithSrc.length === 0, deactWithSrc);
// 7. order: contiguous 1..215, relative F1 order preserved
const ord = Object.entries(nat.blocks).sort((a, b) => a[1].order - b[1].order);
const contiguous = ord.every(([, b], i) => b.order === i + 1);
const rel = ord.map(([k]) => k).join('|') === Object.entries(src.blocks).filter(([k]) => k in nat.blocks).sort((a, b) => a[1].order - b[1].order).map(([k]) => k).join('|');
check('order-contiguous-and-relative-F1-order', contiguous && rel, {contiguous, relativeOrderPreserved: rel});
// 8. timers/params on surviving blocks unchanged (attrs compare covers parameterPort attrs)
const paramDiff = portDiffs.filter(d => /Delay|Time/.test(d.port ?? ''));
check('surviving-timer-params-unchanged', paramDiff.length === 0, paramDiff);
// 9. networks
check('networks-unchanged-attrs', JSON.stringify(src.networks.map(({blocks, ...n}) => n)) === JSON.stringify(nat.networks.map(({blocks, ...n}) => n)), nat.networks.filter(n => n.blocks === 0).map(n => n.name));
// 10. CRC: native-generated, differs from source, not hand-edited (staged kept source CRC)
check('staged-kept-source-crc', stg.crc.sal === src.crc.sal && stg.crc.sgvl === src.crc.sgvl, {source: src.crc, staged: stg.crc, native: nat.crc});
// 11. diagram: shapes/connectors
const D = walk(parse(nat.F['TwinSafeGroup1.sal.diagram'])), DS = walk(parse(src.F['TwinSafeGroup1.sal.diagram']));
const dcount = d => Object.fromEntries(['fBAndShape', 'fBOrShape', 'fBRsShape', 'fBTonShape', 'fBDecoupleShape', 'fBEstopShape', 'inPortShape', 'outPortShape', 'paramPortShape', 'wiredLinkConnector', 'networkSwimLane'].map(t => [t, d.filter(n => n.tag === t).length]));
report.diagramCounts = {source: dcount(DS), native: dcount(D)};
const fbShapes = Object.entries(report.diagramCounts.native).filter(([t]) => /^fB/.test(t)).reduce((a, [, v]) => a + v, 0);
check('diagram-shapes-match-model', fbShapes === 215 && report.diagramCounts.native.inPortShape + report.diagramCounts.native.outPortShape === 1832 && report.diagramCounts.native.wiredLinkConnector === report.counts.native.wires, report.diagramCounts.native);
const shapeIds = new Set(D.filter(n => /Shape$/.test(n.tag)).map(n => n.attr.Id));
const badConn = D.filter(n => n.tag === 'wiredLinkConnector').flatMap(c => walk(c).filter(x => x.tag.endsWith('PortShapeMoniker') && !shapeIds.has(x.attr.Id)).map(x => c.attr.Id));
const wireIds = new Set(Object.values(nat.blocks).flatMap(b => Object.values(b.ports).flatMap(p => p.wires.map(w => w.Id))));
const connWire = D.filter(n => n.tag === 'wiredLinkConnector').map(c => c.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id);
check('diagram-connectors-resolve', badConn.length === 0 && connWire.every(id => wireIds.has(id)) && new Set(connWire).size === wireIds.size, {badConn, connectors: connWire.length, wires: wireIds.size});
fs.writeFileSync(outFile, JSON.stringify(report, null, 1) + '\n');
const fails = report.checks.filter(c => c.status !== 'PASS');
console.log(`\n${report.checks.length - fails.length}/${report.checks.length} self-checks PASS`);
process.exitCode = fails.length ? 1 : 0;
