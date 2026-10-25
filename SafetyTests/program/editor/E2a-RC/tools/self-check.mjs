// E2a-RC editor self-check (NOT an acceptance oracle; does not replace G3).
// node self-check.mjs <sourceDir E2a-core> <stagedDir> <nativeDir> <out.json>
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parse, walk, anc} from './xmlpos.mjs';
import {netlist, files} from './netlist.mjs';
import {inspectNativeSalStructure} from '../../../../src/sal-native-structure.js';
import {validateSalBindings} from '../../../../src/sal-binding-validator.js';

const [srcDir, stagedDir, nativeDir, outFile] = process.argv.slice(2);
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';
const src = netlist(srcDir), stg = netlist(stagedDir), nat = netlist(nativeDir);
const report = {generatedAt: new Date().toISOString(), note: 'editor self-check, not a requirement PASS', sha: {}, checks: []};
for (const [k, d] of [['source', srcDir], ['staged', stagedDir], ['native', nativeDir]]) report.sha[k] = Object.fromEntries(Object.entries(files(d)).map(([f, x]) => [f, hash(x)]));
const check = (id, ok, detail) => {report.checks.push({id, status: ok ? 'PASS' : 'FAIL', detail}); console.log(ok ? 'PASS' : 'FAIL', id, typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 400));};
const NEW = ['Network11/WIN_C1', 'Network12/WIN_C2'];
const DEL_SYMS = ['b_Reset_HV_Discharg_Req2', 'b_Reset_LV_Discharge_Req2'];

check('source-is-E2a-core-candidate', report.sha.source['TwinSafeGroup1.sal'] === '5648e31cec9fea6d82ed2392a4be21a26c599eb4872969f5adab2ef3b87fd40b' && report.sha.source['GVL1.sgvl'] === 'e60698840e556dbd6d838958eadb8545735a81aaff8efbfceabc3613a4e08010' && report.sha.source['TwinSafeGroup1.sal.diagram'] === '27d7f20d890d48fc175fbd25af21a5b0c874ce4cf248b37ac73df26fe0624785', report.sha.source);
const strip = n => JSON.stringify({blocks: n.blocks, variables: n.variables, symbols: n.symbols, networks: n.networks});
check('native-equals-staged-semantics', strip(stg) === strip(nat), 'blocks/ports/attrs/order/wires/global refs/SAL usages/SGVL usages identical; only CRC/formatting differ');
const ns = inspectNativeSalStructure(nat.sal); check('native-structure-preflight', ns.status === 'PASS' && ns.counts.crossNetworkWires === 0, ns);
report.sourcePreflight = inspectNativeSalStructure(src.sal);
const ba = validateSalBindings(nat.sal, nat.gvl); check('binding-audit', ba.status === 'PASS' && ba.errors.length === 0, {status: ba.status, errors: ba.errors});
// counts
const portCount = n => Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).filter(p => p.tag !== 'parameterPort').length, 0);
const wireCount = n => Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).reduce((x, p) => x + p.wires.length, 0), 0);
const counts = n => ({networks: n.networks.length, fb: Object.keys(n.blocks).length, ports: portCount(n), symbols: Object.keys(n.symbols).length, salVariables: Object.keys(n.variables).length, wires: wireCount(n),
  globalRefs: Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).reduce((x, p) => x + p.globals.length, 0), 0), sgvlUsages: Object.values(n.symbols).reduce((a, s) => a + s.source.length + s.target.length, 0),
  salFbUsages: Object.values(n.variables).reduce((a, v) => a + v.usages.filter(u => u.kind === 'fbPortUsage').length, 0), aliasUsages: Object.values(n.variables).reduce((a, v) => a + v.usages.filter(u => u.kind !== 'fbPortUsage').length, 0),
  safeTon: Object.values(n.blocks).filter(b => b.attrs.functionName === 'safeTon').length});
report.counts = {source: counts(src), native: counts(nat)};
const c = report.counts.native, c0 = report.counts.source;
check('counts-217-1836-63-75-14', c.fb === 217 && c.ports === 1836 && c.symbols === 63 && c.salVariables === 75 && c.networks === 14, report.counts);
check('wire-delta-minus9-plus11', c.wires === c0.wires - 9 + 11, {source: c0.wires, native: c.wires});
check('global-refs-equal-sgvl-usages', c.globalRefs === c.sgvlUsages && c.globalRefs === c0.globalRefs - 4 + 3, {native: c.globalRefs, sgvl: c.sgvlUsages, source: c0.globalRefs, expected: 'source -2 source refs (deleted symbols) -2 old target refs (N1/FBOr5, N1/FBOr1) +3 target refs'});
check('sal-usage-counts-unchanged', c.salFbUsages === c0.salFbUsages && c.aliasUsages === c0.aliasUsages, {source: [c0.salFbUsages, c0.aliasUsages], native: [c.salFbUsages, c.aliasUsages]});
// dangling / pairing / cardinality
const allPorts = new Set(Object.entries(nat.blocks).flatMap(([k, b]) => Object.keys(b.ports).map(p => `${k}/${p}`)));
const dangling = [
  ...Object.entries(nat.symbols).flatMap(([s, v]) => [...v.source, ...v.target].filter(x => x.startsWith('DANGLING')).map(x => `sgvl ${s} ${x}`)),
  ...Object.entries(nat.blocks).flatMap(([k, b]) => Object.entries(b.ports).flatMap(([p, x]) => [...x.globals.filter(g => g.symbol.startsWith('DANGLING')).map(g => `ref ${k}/${p} ${g.symbol}`), ...x.wires.filter(w => !allPorts.has(w.to)).map(w => `wire ${k}/${p} -> ${w.to}`)])),
  ...Object.values(nat.variables).flatMap(x => x.usages.filter(u => u.kind === 'fbPortUsage' && !allPorts.has(u.ref)).map(u => `var ${x.name} ${u.ref}`)),
  ...DEL_SYMS.filter(s => nat.sal.includes(s) || nat.gvl.includes(s) || nat.F['TwinSafeGroup1.sal.diagram'].includes(s)).map(s => 'deleted symbol name still present ' + s),
  ...DEL_SYMS.map(s => src.symbols[s].Id).filter(id => nat.sal.includes(id) || nat.gvl.includes(id)).map(id => 'deleted symbol Id still referenced ' + id)];
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
check('every-symbol-has-source-and-consumer', Object.values(nat.symbols).every(s => s.source.length && s.target.length), Object.entries(nat.symbols).filter(([, s]) => !s.source.length || !s.target.length).map(([n]) => n));
check('every-symbol-single-source', Object.values(nat.symbols).every(s => s.source.length === 1), Object.entries(nat.symbols).filter(([, s]) => s.source.length !== 1).map(([n]) => n));
const symIds = (n, skip = []) => Object.entries(n.symbols).filter(([k]) => !skip.includes(k)).map(([k, s]) => k + '=' + s.Id).sort();
check('symbol-set-equals-source-minus-2-same-ids', JSON.stringify(symIds(nat)) === JSON.stringify(symIds(src, DEL_SYMS)) && DEL_SYMS.every(d => !(d in nat.symbols) && d in src.symbols), Object.keys(src.symbols).filter(k => !(k in nat.symbols)));
const sym = (n, s) => n.symbols[s];
const plus = (s, t) => JSON.stringify({...sym(src, s), target: [...sym(src, s).target, t]});
const CHANGED_SYMS = {b_Set_HV_C2_1: 'Network1/FBOr5/OrIn2', b_Step12_Set: 'Network1/FBOr1/OrIn2', b_EStop_Ok: 'Network2/FBAnd91/AndIn4'};
check('symbol-usages-planned', Object.entries(CHANGED_SYMS).every(([s, t]) => JSON.stringify(sym(nat, s)) === plus(s, t))
  && Object.keys(nat.symbols).filter(s => !(s in CHANGED_SYMS)).every(s => JSON.stringify(sym(nat, s)) === JSON.stringify(sym(src, s))),
  {...Object.fromEntries(Object.keys(CHANGED_SYMS).map(s => [s, sym(nat, s)])), deletedInSource: Object.fromEntries(DEL_SYMS.map(d => [d, sym(src, d)]))});
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
  const [nn, bb, pp] = key.split('/'); for (const g of n.blocks[`${nn}/${bb}`].ports[pp].globals) r.push('sym:' + g.symbol);
  for (const v of Object.values(n.variables)) for (const u of v.usages) if (u.ref === key && u.role === 'T') r.push('var:' + v.name);
  return r;
};
const portOf = (n, key) => {const [a, b, p] = key.split('/'); return n.blocks[`${a}/${b}`].ports[p];};
const DEC = undefined; // safeDecouple inputs carry no contact attributes
const EXPECT_IN = {
  'Network12/WIN_C2/TonIn': ['wire:Network12/FBAnd4/AndOut', NC],
  'Network12/FBAnd6/AndIn1': ['wire:Network12/WIN_C2/TonOut', NC], 'Network12/FBAnd6/AndIn2': ['var:in_HV_C2_FBK', NC], 'Network12/FBAnd6/AndIn3': ['var:in_HV_Faulty_FBK', NO],
  'Network12/FBTon3/TonIn': ['wire:Network12/FBAnd6/AndOut', NC],
  'Network12/FBDecouple2/DecIn1': ['wire:Network12/FBTon3/TonOut', DEC], 'Network12/FBDecouple2/DecIn2': ['wire:Network12/FBTon3/TonOut', DEC],
  'Network12/FBDecouple2/DecIn3': ['wire:Network12/FBTon3/TonOut', DEC], 'Network12/FBDecouple2/DecIn4': ['wire:Network12/FBTon3/TonOut', DEC],
  'Network11/WIN_C1/TonIn': ['wire:Network11/FBAnd1/AndOut', NC],
  'Network11/FBAnd4/AndIn1': ['wire:Network11/WIN_C1/TonOut', NC], 'Network11/FBAnd4/AndIn2': ['var:in_LV_C1_FBK', NC], 'Network11/FBAnd4/AndIn3': ['var:in_LV_Faulty_FBK', NO],
  'Network11/FBTon1/TonIn': ['wire:Network11/FBAnd4/AndOut', NC], 'Network11/FBAnd5/AndIn1': ['wire:Network11/FBTon1/TonOut', NC],
  'Network1/FBOr5/OrIn2': ['sym:b_Set_HV_C2_1', NC], 'Network1/FBOr1/OrIn2': ['sym:b_Step12_Set', NC], 'Network2/FBAnd91/AndIn4': ['sym:b_EStop_Ok', NC],
  // unchanged neighbours
  'Network12/FBAnd4/AndIn1': ['wire:Network12/FBAnd1/AndOut', NC], 'Network12/FBAnd4/AndIn2': ['wire:Network12/FBAnd16/AndOut', NC], 'Network12/FBAnd4/AndIn3': ['wire:Network12/FBDecouple3/DecOut1', NC],
  'Network2/FBAnd91/AndIn1': ['wire:Network2/FBAnd61/AndOut', NC], 'Network2/FBAnd91/AndIn2': ['wire:Network2/FBAnd81/AndOut', NC], 'Network2/FBAnd91/AndIn3': ['wire:Network2/FBAnd11/AndOut', NC],
  'Network2/FBAnd91/AndIn5': [null, null], 'Network2/FBAnd91/AndIn6': [null, null], 'Network1/FBOr5/OrIn1': [null, null], 'Network1/FBOr1/OrIn1': [null, null],
  'Network1/FBRs5/Reset': ['wire:Network1/FBOr1/OrOut', NC], 'Network1/FBRs7/Reset': ['wire:Network1/FBOr5/OrOut', NC],
};
const planBad = [];
for (const [k, [srcExp, contact]] of Object.entries(EXPECT_IN)) {
  const got = inSrcOf(nat, k), port = portOf(nat, k);
  if (srcExp === null) {if (got.length || port.attrs.channelInterface !== 'Deactivated') planBad.push({k, got, ci: port.attrs.channelInterface}); continue;}
  const contactOk = contact === undefined ? !('channelInterface' in port.attrs) : port.attrs.channelInterface === 'Activated' && port.attrs.deactivate1 === contact;
  if (got.length !== 1 || got[0] !== srcExp || !contactOk) planBad.push({k, expected: [srcExp, contact], got, ci: port.attrs.channelInterface, contact: port.attrs.deactivate1});
}
check('plan-input-sources-and-contacts', planBad.length === 0, planBad);
const outs = k => ({k, wires: portOf(nat, k).wires.map(w => w.to).sort(), globals: portOf(nat, k).globals.map(g => g.symbol)});
const EXP_OUT = [
  {k: 'Network12/WIN_C2/TonOut', wires: ['Network12/FBAnd6/AndIn1'], globals: []},
  {k: 'Network12/FBAnd4/AndOut', wires: ['Network12/WIN_C2/TonIn'], globals: ['b_Set_HV_C2_1']},
  {k: 'Network12/FBAnd6/AndOut', wires: ['Network12/FBTon3/TonIn'], globals: []},
  {k: 'Network12/FBTon3/TonOut', wires: ['Network12/FBDecouple2/DecIn1', 'Network12/FBDecouple2/DecIn2', 'Network12/FBDecouple2/DecIn3', 'Network12/FBDecouple2/DecIn4'], globals: []},
  {k: 'Network11/WIN_C1/TonOut', wires: ['Network11/FBAnd4/AndIn1'], globals: []},
  {k: 'Network11/FBAnd1/AndOut', wires: ['Network11/WIN_C1/TonIn'], globals: ['b_Set_LV_C1_1']},
  {k: 'Network11/FBAnd4/AndOut', wires: ['Network11/FBTon1/TonIn'], globals: []},
  {k: 'Network11/FBTon1/TonOut', wires: ['Network11/FBAnd5/AndIn1'], globals: []},
];
const gotOut = EXP_OUT.map(e => outs(e.k));
check('planned-output-fanout-exact', JSON.stringify(gotOut) === JSON.stringify(EXP_OUT), gotOut);
// new block template conformity (native safeTon; only difference: timing 0.5 s)
const sig = (b, timing) => JSON.stringify([b.tag, b.attrs.functionName, b.attrs.mapState, b.attrs.mapDiag, Object.entries(b.ports).map(([n, p]) => {const {channelInterface, deactivate1, ...a} = p.attrs; if (p.tag === 'parameterPort' && timing) a.timing = timing; return [n, p.tag, a];})]);
const tplOk = [['Network12/WIN_C2', 'Network12/FBTon3'], ['Network11/WIN_C1', 'Network11/FBTon1']].map(([nb, t]) => ({nb, ok: sig(nat.blocks[nb]) === sig(src.blocks[t], '0.5') && nat.blocks[nb].ports['Delay Time (s)'].attrs.timing === '0.5' && nat.blocks[nb].attrs.instanceName === nb.split('/')[1]}));
check('new-blocks-native-safeTon-signature-timing-0.5', tplOk.every(x => x.ok), tplOk);
const instNames = Object.values(nat.blocks).map(b => b.attrs.instanceName);
check('instance-names-unique', new Set(instNames).size === instNames.length, instNames.length);
// surviving ports: only planned deltas
const planned = new Set([...Object.keys(EXPECT_IN), ...EXP_OUT.map(e => e.k)].filter(k => !NEW.some(n => k.startsWith(n + '/'))));
const unexpected = [];
for (const [k, b] of Object.entries(nat.blocks)) {
  const a = src.blocks[k]; if (!a) continue;
  if (a.tag !== b.tag || a.Id !== b.Id || JSON.stringify(a.attrs) !== JSON.stringify(b.attrs)) unexpected.push({block: k, kind: 'block'});
  for (const [p, y] of Object.entries(b.ports)) {
    const x = a.ports[p]; const key = `${k}/${p}`;
    if (!x || x.Id !== y.Id) {unexpected.push({port: key, kind: 'id'}); continue;}
    const changed = JSON.stringify(x.attrs) !== JSON.stringify(y.attrs) || JSON.stringify(x.globals) !== JSON.stringify(y.globals) || JSON.stringify(x.wires) !== JSON.stringify(y.wires);
    if (changed && !planned.has(key)) unexpected.push({port: key, from: {a: x.attrs, g: x.globals, w: x.wires}, to: {a: y.attrs, g: y.globals, w: y.wires}});
    // only N2/FBAnd91.AndIn4 changes attributes (Deactivated -> Activated NC); all other planned ports keep their attributes
    if (changed && planned.has(key) && JSON.stringify(x.attrs) !== JSON.stringify(y.attrs) && key !== 'Network2/FBAnd91/AndIn4') unexpected.push({port: key, kind: 'attrs changed', from: x.attrs, to: y.attrs});
  }
}
const a91 = [portOf(src, 'Network2/FBAnd91/AndIn4').attrs, portOf(nat, 'Network2/FBAnd91/AndIn4').attrs];
const {channelInterface: _c1, deactivate1: _d1, ...r91a} = a91[0], {channelInterface: _c2, deactivate1: _d2, ...r91b} = a91[1];
if (JSON.stringify(r91a) !== JSON.stringify(r91b) || a91[0].channelInterface !== 'Deactivated') unexpected.push({port: 'Network2/FBAnd91/AndIn4', kind: 'unexpected attrs', a91});
check('surviving-port-deltas-only-planned', unexpected.length === 0, unexpected);
const wl = n => new Set(Object.entries(n.blocks).flatMap(([k, b]) => Object.entries(b.ports).flatMap(([p, x]) => x.wires.map(w => `${k}/${p}>${w.to}`))));
const W0 = wl(src), W1 = wl(nat);
const wRemoved = [...W0].filter(x => !W1.has(x)).sort(), wAdded = [...W1].filter(x => !W0.has(x)).sort();
const expRemoved = ['Network12/FBAnd4/AndOut>Network12/FBTon3/TonIn', 'Network12/FBTon3/TonOut>Network12/FBAnd6/AndIn1', ...[1, 2, 3, 4].map(i => `Network12/FBAnd6/AndOut>Network12/FBDecouple2/DecIn${i}`), 'Network11/FBAnd1/AndOut>Network11/FBTon1/TonIn', 'Network11/FBTon1/TonOut>Network11/FBAnd4/AndIn1', 'Network11/FBAnd4/AndOut>Network11/FBAnd5/AndIn1'].sort();
const expAdded = ['Network12/FBAnd4/AndOut>Network12/WIN_C2/TonIn', 'Network12/WIN_C2/TonOut>Network12/FBAnd6/AndIn1', 'Network12/FBAnd6/AndOut>Network12/FBTon3/TonIn', ...[1, 2, 3, 4].map(i => `Network12/FBTon3/TonOut>Network12/FBDecouple2/DecIn${i}`), 'Network11/FBAnd1/AndOut>Network11/WIN_C1/TonIn', 'Network11/WIN_C1/TonOut>Network11/FBAnd4/AndIn1', 'Network11/FBAnd4/AndOut>Network11/FBTon1/TonIn', 'Network11/FBTon1/TonOut>Network11/FBAnd5/AndIn1'].sort();
check('wire-delta-exact', JSON.stringify(wRemoved) === JSON.stringify(expRemoved) && JSON.stringify(wAdded) === JSON.stringify(expAdded), {wRemoved, wAdded});
check('sal-variables-unchanged', JSON.stringify(src.variables) === JSON.stringify(nat.variables), '');
// order
const ord = Object.entries(nat.blocks).sort((a, b) => a[1].order - b[1].order).map(([k]) => k);
const pos = k => ord.indexOf(k);
const consecutive = ks => ks.every((k, i) => i === 0 || pos(k) === pos(ks[i - 1]) + 1);
const ordChecks = {
  contiguous: Object.values(nat.blocks).map(b => b.order).sort((a, b) => a - b).every((o, i) => o === i + 1),
  N12_FBAnd4_WIN_C2_FBAnd6_FBTon3_FBDecouple2: consecutive(['Network12/FBAnd4', 'Network12/WIN_C2', 'Network12/FBAnd6', 'Network12/FBTon3', 'Network12/FBDecouple2']),
  N11_FBAnd1_WIN_C1_FBAnd4_FBTon1_FBAnd5: consecutive(['Network11/FBAnd1', 'Network11/WIN_C1', 'Network11/FBAnd4', 'Network11/FBTon1', 'Network11/FBAnd5']),
};
const moved = new Set([...NEW, 'Network12/FBAnd6', 'Network11/FBAnd4']);
ordChecks.relativeOrderOfOtherBlocksPreserved = ord.filter(k => !moved.has(k)).join('|') === Object.entries(src.blocks).filter(([k]) => !moved.has(k)).sort((a, b) => a[1].order - b[1].order).map(([k]) => k).join('|');
report.order = ord.map((k, i) => `${i + 1}:${k}`);
check('order-of-execution-per-plan', Object.values(ordChecks).every(Boolean), ordChecks);
const params = n => JSON.stringify(Object.entries(n.blocks).filter(([k]) => k in src.blocks).map(([k, b]) => [k, Object.entries(b.ports).filter(([, p]) => p.tag === 'parameterPort').map(([pn, p]) => [pn, p.attrs])]));
check('existing-timer-and-parameter-ports-unchanged', params(src) === params(nat), '');
check('safeTon-count-15-plus-2', c0.safeTon === 15 && c.safeTon === 17, {source: c0.safeTon, native: c.safeTon});
check('networks-unchanged-attrs', JSON.stringify(src.networks.map(({blocks, ...n}) => n)) === JSON.stringify(nat.networks.map(({blocks, ...n}) => n)), nat.networks.map(n => `${n.name}:${n.blocks}`));
check('staged-kept-source-crc-native-new-crc', stg.crc.sal === src.crc.sal && stg.crc.sgvl === src.crc.sgvl && nat.crc.sal !== src.crc.sal && nat.crc.sgvl !== src.crc.sgvl, {source: src.crc, staged: stg.crc, native: nat.crc});
// diagram
const D = walk(parse(nat.F['TwinSafeGroup1.sal.diagram'])), DS = walk(parse(src.F['TwinSafeGroup1.sal.diagram']));
const dcount = d => Object.fromEntries(['fBAndShape', 'fBOrShape', 'fBRsShape', 'fBTonShape', 'fBDecoupleShape', 'fBEstopShape', 'inPortShape', 'outPortShape', 'paramPortShape', 'wiredLinkConnector', 'networkSwimLane'].map(t => [t, d.filter(n => n.tag === t).length]));
report.diagramCounts = {source: dcount(DS), native: dcount(D)};
const dn = report.diagramCounts.native;
const fbShapes = Object.entries(dn).filter(([t]) => /^fB/.test(t)).reduce((a, [, v]) => a + v, 0);
check('diagram-shapes-match-model', fbShapes === 217 && dn.fBTonShape === 17 && dn.inPortShape + dn.outPortShape === 1836 && dn.paramPortShape === report.diagramCounts.source.paramPortShape + 2 && dn.wiredLinkConnector === c.wires, report.diagramCounts);
const shapeIds = new Set(D.filter(n => /Shape$/.test(n.tag)).map(n => n.attr.Id));
const badConn = D.filter(n => n.tag === 'wiredLinkConnector').flatMap(cc => walk(cc).filter(x => x.tag.endsWith('PortShapeMoniker') && !shapeIds.has(x.attr.Id)).map(() => cc.attr.Id));
const wireIds = new Set(Object.values(nat.blocks).flatMap(b => Object.values(b.ports).flatMap(p => p.wires.map(w => w.Id))));
const connWire = D.filter(n => n.tag === 'wiredLinkConnector').map(cc => cc.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id);
check('diagram-connectors-resolve-one-per-wire', badConn.length === 0 && connWire.every(id => wireIds.has(id)) && new Set(connWire).size === wireIds.size && connWire.length === wireIds.size, {badConn, connectors: connWire.length, wires: wireIds.size});
const blockShapeLane = D.filter(n => /^fB\w+Shape$/.test(n.tag)).map(n => ({b: n.children[0].attr.name.slice(2), lane: walk(anc(n, 'networkSwimLane')).find(x => x.tag === 'networkMoniker').attr.name.slice(2)}));
check('diagram-lane-membership', blockShapeLane.every(x => x.b.split('/')[0] === x.lane) && new Set(blockShapeLane.map(x => x.b)).size === 217, blockShapeLane.filter(x => NEW.includes(x.b)));
fs.writeFileSync(outFile, JSON.stringify(report, null, 1) + '\n');
const fails = report.checks.filter(x => x.status !== 'PASS');
console.log(`\n${report.checks.length - fails.length}/${report.checks.length} self-checks PASS`);
process.exitCode = fails.length ? 1 : 0;
