// Generic editor self-check driven by STAGING.json of the slice (NOT an acceptance oracle; does not replace G3).
// node self-check.mjs <slice> <sourceDir> <stagedDir> <nativeDir> <out.json>
// Checks every planned input (source + contact) independently of the staging script by reading the native netlist.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse, walk, anc} from './xmlpos.mjs';
import {netlist, files} from './netlist.mjs';
import {inspectNativeSalStructure} from '../../../../src/sal-native-structure.js';
import {validateSalBindings} from '../../../../src/sal-binding-validator.js';

const [slice, srcDir, stagedDir, nativeDir, outFile] = process.argv.slice(2);
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const ST = JSON.parse(fs.readFileSync(path.join(stagedDir, '..', 'STAGING.json'), 'utf8'));
const src = netlist(srcDir), stg = netlist(stagedDir), nat = netlist(nativeDir);
const report = {slice, generatedAt: new Date().toISOString(), note: 'editor self-check, not a requirement PASS', sha: {}, checks: []};
for (const [k, d] of [['source', srcDir], ['staged', stagedDir], ['native', nativeDir]]) report.sha[k] = Object.fromEntries(Object.entries(files(d)).map(([f, x]) => [f, hash(x)]));
const check = (id, ok, detail) => {report.checks.push({id, status: ok ? 'PASS' : 'FAIL', detail}); console.log(ok ? 'PASS' : 'FAIL', id, typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 400));};
const NEW = ST.newBlocks.map(b => b.path).sort();
const EXP = ST.expected;
const ORDER_RULES = {
  E2b: ord => {
    const pos = k => ord.indexOf(k); const next = (a, b) => pos(b) === pos(a) + 1;
    return {
      head15: JSON.stringify(ord.slice(0, 15)) === JSON.stringify(['Network3/FBOr2', 'Network3/FBOr1', 'Network3/FBOrS12Reset', 'Network3/FBOr16', 'Network3/FBOr13', 'Network3/FBOr5', 'Network3/FBOr7', 'Network3/FBOr9', 'Network3/FBRs1', 'Network3/FBRs8', 'Network3/FBRs7', 'Network3/FBRs3', 'Network3/FBRs4', 'Network3/FBRs5', 'Network3/FBRs6']),
      L1_FBAnd16_CONNECTORS_SCOPE_NotRunSu_IlRunOk_before_N1FBAnd1: JSON.stringify(ord.slice(pos('Network1/FBAnd1') - 5, pos('Network1/FBAnd1'))) === JSON.stringify(['Network12/FBAnd16', 'SafeResumption/CONNECTORS', 'SafeResumption/CONNECTOR_SCOPE', 'Network1/FBAndNotRunSu', 'Network1/FBOrIlRunOk']),
      FBEstop1_G10_EXIT_BootFbkOff_N3FBAnd2_N3FBAnd1: next('Network1/FBEstop1', 'Network3/G10_EXIT') && next('Network3/G10_EXIT', 'Network3/FBAndBootFbkOff') && next('Network3/FBAndBootFbkOff', 'Network3/FBAnd2') && next('Network3/FBAnd2', 'Network3/FBAnd1'),
      G10_EXIT_before_PrevG_writer_N6FBDecouple2: pos('Network3/G10_EXIT') < pos('Network6/FBDecouple2'),
      N6_STAGE_LVON_FBAndLvEmg_FBOrStep4_FBDecouple1: next('Network6/STAGE_LVON', 'Network6/FBAndLvEmg') && next('Network6/FBAndLvEmg', 'Network6/FBOrStep4') && next('Network6/FBOrStep4', 'Network6/FBDecouple1') && pos('Network6/FBAnd2') < pos('Network6/STAGE_LVON'),
    };
  },
};
ORDER_RULES.E2c = ord => {const pos = k => ord.indexOf(k); const seqOk = ks => ks.every((k, i) => i === 0 || pos(k) === pos(ks[i - 1]) + 1);
  return {STATE_SU_SG_OWNER_SET_HLT_LV_GATE_SG_SET_STATE_SG: seqOk(['RndPhysicalCompact/STATE_SU', 'SafeResumption/SG_OWNER_SET', 'SafeResumption/HLT_LV', 'RndPhysicalCompact/GATE_SG_SET', 'RndPhysicalCompact/STATE_SG'])};};
ORDER_RULES.E2d = ord => {const pos = k => ord.indexOf(k); return {FBOrFbk10C2_right_before_N12FBAnd10: pos('Network12/FBOrFbk10C2') === pos('Network12/FBAnd10') - 1};};
const CHANGED_ORDER = {E2b: [], E2c: ['SafeResumption/SG_OWNER_SET', 'RndPhysicalCompact/STATE_SG'], E2d: []};

check('source-sha-is-staging-source', report.sha.source['TwinSafeGroup1.sal'] === ST.source.sal && report.sha.source['GVL1.sgvl'] === ST.source.sgvl && report.sha.source['TwinSafeGroup1.sal.diagram'] === ST.source.diagram, report.sha.source);
check('staged-sha-is-staging-result', report.sha.staged['TwinSafeGroup1.sal'] === ST.staged.sal && report.sha.staged['GVL1.sgvl'] === ST.staged.sgvl, '');
const strip = n => JSON.stringify({blocks: n.blocks, variables: n.variables, symbols: n.symbols, networks: n.networks});
check('native-equals-staged-semantics', strip(stg) === strip(nat), 'blocks/ports/attrs/order/wires/global refs/SAL usages/SGVL usages identical; only CRC/formatting differ');
const ns = inspectNativeSalStructure(nat.sal); check('native-structure-preflight', ns.status === 'PASS' && ns.counts.crossNetworkWires === 0, ns);
const ba = validateSalBindings(nat.sal, nat.gvl); check('binding-audit', ba.status === 'PASS' && ba.errors.length === 0, {status: ba.status, errors: ba.errors});
const portCount = n => Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).filter(p => p.tag !== 'parameterPort').length, 0);
const wireCount = n => Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).reduce((x, p) => x + p.wires.length, 0), 0);
const counts = n => ({networks: n.networks.length, fb: Object.keys(n.blocks).length, ports: portCount(n), symbols: Object.keys(n.symbols).length, salVariables: Object.keys(n.variables).length, wires: wireCount(n),
  globalRefs: Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).reduce((x, p) => x + p.globals.length, 0), 0), sgvlUsages: Object.values(n.symbols).reduce((a, s) => a + s.source.length + s.target.length, 0),
  salFbUsages: Object.values(n.variables).reduce((a, v) => a + v.usages.filter(u => u.kind === 'fbPortUsage').length, 0), aliasUsages: Object.values(n.variables).reduce((a, v) => a + v.usages.filter(u => u.kind !== 'fbPortUsage').length, 0),
  safeTon: Object.values(n.blocks).filter(b => b.attrs.functionName === 'safeTon').length});
report.counts = {source: counts(src), native: counts(nat)};
const c = report.counts.native, c0 = report.counts.source;
check(`counts-${EXP.fb}-${EXP.ports}-${EXP.symbols}-${EXP.salVariables}-14`, c.fb === EXP.fb && c.ports === EXP.ports && c.symbols === EXP.symbols && c.salVariables === EXP.salVariables && c.networks === 14, report.counts);
check('wire-count-delta-equals-staging', c.wires === c0.wires - ST.removedWires.length + ST.addedWires.length, {source: c0.wires, native: c.wires, removed: ST.removedWires.length, added: ST.addedWires.length});
check('global-refs-equal-sgvl-usages', c.globalRefs === c.sgvlUsages, {native: c.globalRefs, sgvl: c.sgvlUsages, source: c0.globalRefs});
check('alias-usage-count-unchanged', c.aliasUsages === c0.aliasUsages, {source: c0.aliasUsages, native: c.aliasUsages});
// dangling / pairing / cardinality
const allPorts = new Set(Object.entries(nat.blocks).flatMap(([k, b]) => Object.keys(b.ports).map(p => `${k}/${p}`)));
const dangling = [
  ...Object.entries(nat.symbols).flatMap(([s, v]) => [...v.source, ...v.target].filter(x => x.startsWith('DANGLING')).map(x => `sgvl ${s} ${x}`)),
  ...Object.entries(nat.blocks).flatMap(([k, b]) => Object.entries(b.ports).flatMap(([p, x]) => [...x.globals.filter(g => g.symbol.startsWith('DANGLING')).map(g => `ref ${k}/${p} ${g.symbol}`), ...x.wires.filter(w => !allPorts.has(w.to)).map(w => `wire ${k}/${p} -> ${w.to}`)])),
  ...Object.values(nat.variables).flatMap(x => x.usages.filter(u => u.kind === 'fbPortUsage' && !allPorts.has(u.ref)).map(u => `var ${x.name} ${u.ref}`))];
check('no-dangling-references', dangling.length === 0, dangling);
const pairing = [];
for (const [k, b] of Object.entries(nat.blocks)) for (const [p, x] of Object.entries(b.ports)) for (const g of x.globals) {
  const s = nat.symbols[g.symbol]; const role = x.tag === 'outPort' ? 'source' : 'target';
  if (!s || s[role].filter(u => u === `${k}/${p}`).length !== 1) pairing.push(`${k}/${p} ${g.symbol} ${role}`);
  if (g.path !== `GVL1.${g.symbol}`) pairing.push(`lastKnownPath ${k}/${p} ${g.path}`);
}
for (const [s, v] of Object.entries(nat.symbols)) for (const [role, list] of [['source', v.source], ['target', v.target]]) for (const pk of list) {
  const [n, b, p] = pk.split('/'); const port = nat.blocks[`${n}/${b}`]?.ports[p];
  if (!port || port.globals.filter(g => g.symbol === s).length !== 1) pairing.push(`sgvl ${s} ${role} ${pk} without SAL ref`);
}
check('global-ref-sgvl-usage-pairing-1to1', pairing.length === 0, pairing);
check('every-symbol-single-source-and-consumer', Object.values(nat.symbols).every(s => s.source.length === 1 && s.target.length >= 1), Object.entries(nat.symbols).filter(([, s]) => s.source.length !== 1 || !s.target.length).map(([n]) => n));
check('symbol-set-and-ids-unchanged', JSON.stringify(Object.entries(src.symbols).map(([n, s]) => n + s.Id).sort()) === JSON.stringify(Object.entries(nat.symbols).map(([n, s]) => n + s.Id).sort()), '');
const linkVars = Object.values(nat.variables).filter(v => v.usages.every(u => u.kind === 'fbPortUsage'));
check('every-internal-SAL-variable-single-source-and-consumer', linkVars.every(v => v.usages.filter(u => u.role === 'S').length === 1 && v.usages.some(u => u.role === 'T')), linkVars.filter(v => !(v.usages.filter(u => u.role === 'S').length === 1 && v.usages.some(u => u.role === 'T'))).map(v => v.name));
// single source per input
const sourcesPerIn = {}; const pairs = new Set(); let dupPairs = 0;
for (const [k, b] of Object.entries(nat.blocks)) for (const [p, x] of Object.entries(b.ports)) for (const w of x.wires) {const pr = `${k}/${p}>${w.to}`; if (pairs.has(pr)) dupPairs++; pairs.add(pr); sourcesPerIn[w.to] = (sourcesPerIn[w.to] ?? 0) + 1;}
for (const x of Object.values(nat.variables)) for (const u of x.usages) if (u.role === 'T' && u.kind === 'fbPortUsage') sourcesPerIn[u.ref] = (sourcesPerIn[u.ref] ?? 0) + 1;
for (const x of Object.values(nat.symbols)) for (const t of x.target) sourcesPerIn[t] = (sourcesPerIn[t] ?? 0) + 1;
check('single-source-per-input-and-unique-wire-pairs', dupPairs === 0 && Object.values(sourcesPerIn).every(n => n === 1), {dupPairs, multi: Object.entries(sourcesPerIn).filter(([, n]) => n > 1)});
const activeNoSrc = [], deactWithSrc = [];
for (const [k, b] of Object.entries(nat.blocks)) for (const [p, x] of Object.entries(b.ports)) if (x.tag === 'inPort') {
  const n = sourcesPerIn[`${k}/${p}`] ?? 0;
  if (x.attrs.channelInterface === 'Activated' && n === 0) activeNoSrc.push(`${k}/${p}`);
  if (x.attrs.channelInterface === 'Deactivated' && (n > 0 || 'deactivate1' in x.attrs)) deactWithSrc.push(`${k}/${p}`);
}
check('activated-inputs-have-source', activeNoSrc.length === 0, activeNoSrc);
check('deactivated-inputs-have-no-source', deactWithSrc.length === 0, deactWithSrc);
// blocks
const deleted = Object.keys(src.blocks).filter(k => !(k in nat.blocks)).sort(), added = Object.keys(nat.blocks).filter(k => !(k in src.blocks)).sort();
check('no-deleted-blocks', deleted.length === 0, deleted);
check('new-blocks-equal-plan', JSON.stringify(added) === JSON.stringify(NEW), added);
const inSrcOf = (n, key) => {
  const r = [];
  for (const [k, b] of Object.entries(n.blocks)) for (const [p, x] of Object.entries(b.ports)) for (const w of x.wires) if (w.to === key) r.push('wire:' + k + '/' + p);
  const [nn, bb, pp] = key.split('/'); for (const g of n.blocks[`${nn}/${bb}`].ports[pp].globals) r.push('symbol:' + g.symbol);
  for (const v of Object.values(n.variables)) for (const u of v.usages) if (u.ref === key && u.role === 'T') r.push('variable:' + v.name);
  return r;
};
const portOf = (n, key) => {const [a, b, p] = key.split('/'); return n.blocks[`${a}/${b}`]?.ports[p];};
const expSrc = s => s.wire ? 'wire:' + s.wire : s.symbol ? 'symbol:' + s.symbol : s.variable ? 'variable:' + s.variable : null;
const planBad = [];
const planned = [...ST.inputs.map(i => [i.port, i]), ...ST.newBlocks.flatMap(b => Object.entries(b.inputs).map(([p, s]) => [`${b.path}/${p}`, s]))];
for (const [k, s] of planned) {
  const got = inSrcOf(nat, k), port = portOf(nat, k);
  if (s.deactivate) {if (got.length || port.attrs.channelInterface !== 'Deactivated') planBad.push({k, got, ci: port.attrs.channelInterface}); continue;}
  const before = portOf(src, k);
  const contactExp = s.contact ?? before?.attrs.deactivate1;
  const contactOk = contactExp === undefined ? !('channelInterface' in port.attrs) : port.attrs.channelInterface === 'Activated' && port.attrs.deactivate1 === contactExp;
  if (got.length !== 1 || got[0] !== expSrc(s) || !contactOk) planBad.push({k, expected: [expSrc(s), contactExp], got, ci: port.attrs.channelInterface, contact: port.attrs.deactivate1});
}
for (const b of ST.newBlocks) for (const [p, x] of Object.entries(nat.blocks[b.path].ports)) if (x.tag === 'inPort' && !(p in b.inputs) && x.attrs.channelInterface !== 'Deactivated') planBad.push({k: b.path + '/' + p, unplannedActive: true});
check('plan-input-sources-and-contacts', planBad.length === 0, planBad);
// new blocks: native template signature
const sig = b => JSON.stringify([b.tag, b.attrs.functionName, b.attrs.mapState, b.attrs.mapDiag, Object.entries(b.ports).map(([n, p]) => {const {channelInterface, deactivate1, ...a} = p.attrs; return [n, p.tag, a];})]);
const tpl = {safeAnd: sig(src.blocks['Network6/FBAnd9']), safeOr: sig(src.blocks['Network6/FBOr5'])};
const tplBad = ST.newBlocks.filter(b => sig(nat.blocks[b.path]) !== tpl[b.fn] || nat.blocks[b.path].attrs.instanceName !== b.path.split('/')[1]).map(b => b.path);
check('new-blocks-native-template-signature', tplBad.length === 0, tplBad);
const instNames = Object.values(nat.blocks).map(b => b.attrs.instanceName);
check('instance-names-unique', new Set(instNames).size === instNames.length, instNames.length);
// surviving ports: only planned deltas
const plannedPorts = new Set([...ST.inputs.map(i => i.port), ...ST.addedWires.map(w => w.from), ...ST.addedWires.map(w => w.to)]);
for (const w of ST.removedWires) {/* removed wire ids */}
const srcWireById = new Map(Object.entries(src.blocks).flatMap(([k, b]) => Object.entries(b.ports).flatMap(([p, x]) => x.wires.map(w => [w.Id, {from: `${k}/${p}`, to: w.to}]))));
for (const id of ST.removedWires) {const w = srcWireById.get(id); if (w) {plannedPorts.add(w.from); plannedPorts.add(w.to);}}
const unexpected = [];
for (const [k, b] of Object.entries(nat.blocks)) {
  const a = src.blocks[k]; if (!a) continue;
  if (a.tag !== b.tag || a.Id !== b.Id || JSON.stringify(a.attrs) !== JSON.stringify(b.attrs)) unexpected.push({block: k, kind: 'block'});
  for (const [p, y] of Object.entries(b.ports)) {
    const x = a.ports[p]; const key = `${k}/${p}`;
    if (!x || x.Id !== y.Id) {unexpected.push({port: key, kind: 'id'}); continue;}
    const changed = JSON.stringify(x.attrs) !== JSON.stringify(y.attrs) || JSON.stringify(x.globals) !== JSON.stringify(y.globals) || JSON.stringify(x.wires) !== JSON.stringify(y.wires);
    if (changed && !plannedPorts.has(key)) unexpected.push({port: key, from: {a: x.attrs, g: x.globals, w: x.wires}, to: {a: y.attrs, g: y.globals, w: y.wires}});
    if (changed && y.tag === 'outPort' && JSON.stringify(x.globals) !== JSON.stringify(y.globals)) unexpected.push({port: key, kind: 'out globals changed'});
  }
}
check('surviving-port-deltas-only-planned', unexpected.length === 0, unexpected);
// exact wire delta
const wl = n => new Set(Object.entries(n.blocks).flatMap(([k, b]) => Object.entries(b.ports).flatMap(([p, x]) => x.wires.map(w => `${k}/${p}>${w.to}`))));
const W0 = wl(src), W1 = wl(nat);
const wRemoved = [...W0].filter(x => !W1.has(x)).sort(), wAdded = [...W1].filter(x => !W0.has(x)).sort();
const expRemoved = ST.removedWires.map(id => srcWireById.get(id)).map(w => `${w.from}>${w.to}`).sort(), expAdded = ST.addedWires.map(w => `${w.from}>${w.to}`).sort();
check('wire-delta-exact', JSON.stringify(wRemoved) === JSON.stringify(expRemoved) && JSON.stringify(wAdded) === JSON.stringify(expAdded), {wRemoved, wAdded});
// SAL variables: existing ones keep Id/attrs/alias usages; fbPort usage delta exactly as planned
const varPlanned = {}; // name -> {add:Set, remove:Set}
const vp = n => (varPlanned[n] ??= {add: new Set(), remove: new Set()});
for (const [k, s] of planned) if (s.variable) vp(s.variable).add.add('T:' + k);
for (const v of Object.values(src.variables)) for (const u of v.usages) if (u.role === 'T' && planned.some(([k]) => k === u.ref)) vp(v.name).remove.add('T:' + u.ref);
for (const nv of ST.newVariables) vp(nv.name).add.add('S:' + nv.source);
const varBad = [];
const srcVarByName = Object.fromEntries(Object.entries(src.variables).map(([id, v]) => [v.name, {id, ...v}]));
for (const [id, v] of Object.entries(nat.variables)) {
  const a = srcVarByName[v.name]; const p = varPlanned[v.name] ?? {add: new Set(), remove: new Set()};
  const ub = new Set(v.usages.filter(u => u.kind === 'fbPortUsage').map(u => u.role + ':' + u.ref));
  if (!a) {if (!ST.newVariables.some(x => x.name === v.name && x.id === id) || JSON.stringify([...ub].sort()) !== JSON.stringify([...p.add].sort()) || v.attrs.isLocal !== 'false') varBad.push({newVar: v.name, usages: [...ub]}); continue;}
  if (a.id !== id || JSON.stringify(a.attrs) !== JSON.stringify(v.attrs)) varBad.push({var: v.name, kind: 'id/attrs'});
  const aliasA = a.usages.filter(u => u.kind !== 'fbPortUsage'), aliasB = v.usages.filter(u => u.kind !== 'fbPortUsage');
  if (JSON.stringify(aliasA) !== JSON.stringify(aliasB)) varBad.push({var: v.name, kind: 'alias usage changed'});
  const ua = new Set(a.usages.filter(u => u.kind === 'fbPortUsage').map(u => u.role + ':' + u.ref));
  const exp = new Set([...[...ua].filter(x => !p.remove.has(x)), ...p.add]);
  if (JSON.stringify([...ub].sort()) !== JSON.stringify([...exp].sort())) varBad.push({var: v.name, expected: [...exp], got: [...ub]});
  const natIds = new Set(v.usages.map(u => u.Id)); const lost = a.usages.filter(u => !p.remove.has(u.role + ':' + u.ref) && !natIds.has(u.Id));
  if (lost.length) varBad.push({var: v.name, kind: 'preserved usage Ids changed', lost});
}
check('sal-variables-only-planned-usage-delta', varBad.length === 0 && Object.keys(nat.variables).length === Object.keys(src.variables).length + ST.newVariables.length, varBad);
// Symbols usage delta
const symPlanned = {};
for (const [k, s] of planned) if (s.symbol) (symPlanned[s.symbol] ??= {add: [], remove: []}).add.push(k);
for (const [s, v] of Object.entries(src.symbols)) for (const t of v.target) if (planned.some(([k]) => k === t)) (symPlanned[s] ??= {add: [], remove: []}).remove.push(t);
const symBad = [];
for (const [s, v] of Object.entries(nat.symbols)) {
  const a = src.symbols[s]; const p = symPlanned[s] ?? {add: [], remove: []};
  const exp = [...a.target.filter(t => !p.remove.includes(t) || p.add.includes(t)), ...p.add.filter(t => !a.target.includes(t))].sort();
  if (JSON.stringify(v.source) !== JSON.stringify(a.source) || JSON.stringify([...v.target].sort()) !== JSON.stringify(exp)) symBad.push({s, expected: exp, got: v.target});
}
check('symbol-usages-only-planned-delta', symBad.length === 0, symBad);
// order
const ord = Object.entries(nat.blocks).sort((a, b) => a[1].order - b[1].order).map(([k]) => k);
const ordChecks = {contiguous: Object.values(nat.blocks).map(b => b.order).sort((a, b) => a - b).every((o, i) => o === i + 1), ...(ORDER_RULES[slice] ? ORDER_RULES[slice](ord) : {})};
const moved = new Set([...NEW, ...(CHANGED_ORDER[slice] ?? []), ...(slice === 'E2b' ? ['Network3/FBOr2', 'Network3/FBOr1', 'Network3/FBOr16', 'Network3/FBOr13', 'Network3/FBOr5', 'Network3/FBOr7', 'Network3/FBOr9', 'Network3/FBRs1', 'Network3/FBRs8', 'Network3/FBRs7', 'Network3/FBRs3', 'Network3/FBRs4', 'Network3/FBRs5', 'Network3/FBRs6'] : [])]);
ordChecks.relativeOrderOfOtherBlocksPreserved = ord.filter(k => !moved.has(k)).join('|') === Object.entries(src.blocks).filter(([k]) => !moved.has(k)).sort((a, b) => a[1].order - b[1].order).map(([k]) => k).join('|');
report.order = ord.map((k, i) => `${i + 1}:${k}`);
check('order-of-execution-per-plan', Object.values(ordChecks).every(Boolean), ordChecks);
const params = n => JSON.stringify(Object.entries(n.blocks).filter(([k]) => k in src.blocks).map(([k, b]) => [k, Object.entries(b.ports).filter(([, p]) => p.tag === 'parameterPort').map(([pn, p]) => [pn, p.attrs])]));
check('timer-and-parameter-ports-unchanged', params(src) === params(nat) && c.safeTon === c0.safeTon, {safeTon: [c0.safeTon, c.safeTon]});
check('networks-unchanged-attrs', JSON.stringify(src.networks.map(({blocks, ...n}) => n)) === JSON.stringify(nat.networks.map(({blocks, ...n}) => n)), nat.networks.map(n => `${n.name}:${n.blocks}`));
check('staged-kept-source-crc-native-new-crc', stg.crc.sal === src.crc.sal && stg.crc.sgvl === src.crc.sgvl && nat.crc.sal !== src.crc.sal, {source: src.crc, staged: stg.crc, native: nat.crc});
// diagram
const D = walk(parse(nat.F['TwinSafeGroup1.sal.diagram'])), DS = walk(parse(src.F['TwinSafeGroup1.sal.diagram']));
const dcount = d => Object.fromEntries(['fBAndShape', 'fBOrShape', 'fBRsShape', 'fBTonShape', 'fBDecoupleShape', 'fBEstopShape', 'inPortShape', 'outPortShape', 'paramPortShape', 'wiredLinkConnector', 'networkSwimLane'].map(t => [t, d.filter(n => n.tag === t).length]));
report.diagramCounts = {source: dcount(DS), native: dcount(D)};
const dn = report.diagramCounts.native;
const fbShapes = Object.entries(dn).filter(([t]) => /^fB/.test(t)).reduce((a, [, v]) => a + v, 0);
check('diagram-shapes-match-model', fbShapes === EXP.fb && dn.inPortShape + dn.outPortShape === EXP.ports && dn.wiredLinkConnector === c.wires && dn.paramPortShape === report.diagramCounts.source.paramPortShape, report.diagramCounts);
const shapeIds = new Set(D.filter(n => /Shape$/.test(n.tag)).map(n => n.attr.Id));
const badConn = D.filter(n => n.tag === 'wiredLinkConnector').flatMap(cc => walk(cc).filter(x => x.tag.endsWith('PortShapeMoniker') && !shapeIds.has(x.attr.Id)).map(() => cc.attr.Id));
const wireIds = new Set(Object.values(nat.blocks).flatMap(b => Object.values(b.ports).flatMap(p => p.wires.map(w => w.Id))));
const connWire = D.filter(n => n.tag === 'wiredLinkConnector').map(cc => cc.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id);
check('diagram-connectors-resolve-one-per-wire', badConn.length === 0 && connWire.every(id => wireIds.has(id)) && new Set(connWire).size === wireIds.size && connWire.length === wireIds.size, {badConn, connectors: connWire.length, wires: wireIds.size});
const blockShapeLane = D.filter(n => /^fB\w+Shape$/.test(n.tag)).map(n => ({b: n.children[0].attr.name.slice(2), lane: walk(anc(n, 'networkSwimLane')).find(x => x.tag === 'networkMoniker').attr.name.slice(2)}));
check('diagram-lane-membership', blockShapeLane.every(x => x.b.split('/')[0] === x.lane) && new Set(blockShapeLane.map(x => x.b)).size === EXP.fb, blockShapeLane.filter(x => NEW.includes(x.b)));
fs.writeFileSync(outFile, JSON.stringify(report, null, 1) + '\n');
const fails = report.checks.filter(x => x.status !== 'PASS');
console.log(`\n${report.checks.length - fails.length}/${report.checks.length} self-checks PASS`);
process.exitCode = fails.length ? 1 : 0;
