// Exact native delta between FROZEN E2d builds (stand E2-stand-g3, 2026-10-23).
// The frozen builds are not chain steps of scripts/e2-delta-check.mjs; their deltas are declared in
// PLAN.json slices[E2d].rationale.v75.declaredDelta.<key> as text items. This tool turns every declared
// item into exact native atoms (src/native-delta-diff.mjs) and requires: observed atoms == declared atoms
// (nothing missing, nothing extra), plan-stated counts before/after, declared SHAs of both sides, the
// E2d order rules/notes that concern the step, preserved relative order of retained blocks, and diagram
// structure (one shape per block/port, one connector per wire). A declared item it cannot interpret is a FAIL.
// Usage: node scripts/e2-frozen-delta-check.mjs [--plan PLAN.json] [--out report.json]
//          --pair <declaredKey> <baseDir> <candDir> [--pair ...]
//   declaredKey: vsFrozenE2dV741 | vsFrozenE2dV75 | vsFrozenE2dV76
// Exit: 0 all PASS; 1 some FAIL; 2 tool error; 64 usage.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadSource, sha256 } from '../src/native-delta-model.mjs';
import { nativeDiff, counts } from '../src/native-delta-diff.mjs';

const standRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const planPath = path.resolve(opt('--plan') ?? path.join(standRoot, 'program/architect/E2-status/PLAN.json'));
const pairs = [];
for (let i = 0; i < args.length; i++) if (args[i] === '--pair') { pairs.push({ key: args[i + 1], base: path.resolve(args[i + 2]), cand: path.resolve(args[i + 3]) }); i += 3; }
if (!pairs.length) { console.error('usage: node scripts/e2-frozen-delta-check.mjs [--plan PLAN.json] [--out report.json] --pair <vsFrozenE2dV741|vsFrozenE2dV75|vsFrozenE2dV76> <baseDir> <candDir> ...'); process.exit(64); }
const outPath = opt('--out') ? path.resolve(opt('--out')) : path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'e2-frozen-delta-')), 'E2_FROZEN_DELTA_CHECK.json');
for (const role of ['tester', 'reviewer', 'architect', 'analyst', 'editor', 'lead', 'runs'])
  if ((outPath.toLowerCase() + path.sep).startsWith(path.join(standRoot, 'program', role).toLowerCase() + path.sep)) { console.error(`refusing to write into program/${role} (role-owned)`); process.exit(64); }

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const e2d = plan.slices?.find(s => s.id === 'E2d');
const declaredDeltas = e2d?.rationale?.v75?.declaredDelta ?? {};
const sha64 = v => typeof v === 'string' ? v.match(/[0-9a-f]{64}/)?.[0] : undefined;
// Declared identities (PLAN.source only): frozen builds and the E2d chain candidate (v7.7).
const frozen = plan.source?.frozenMutantSources ?? {};
const ident = {
  'E2d-v7.4.1': { sal: sha64(frozen['E2d-v7.4.1']) },
  'E2d-v7.5': { sal: sha64(frozen['E2d-v7.5']) },
  'E2d-v7.6': { sal: sha64(frozen['E2d-v7.6']), sgvlPrefix: frozen['E2d-v7.6']?.match(/SGVL ([0-9a-f]{8,})/)?.[1], diagramPrefix: frozen['E2d-v7.6']?.match(/diagram ([0-9a-f]{8,})/)?.[1] },
  // v7.7 is the chain E2d of PLAN v7.7 (c71f9a54: source.candidates.E2d + candidatesE2dFiles) and a frozen
  // source from PLAN v7.8 on (frozenMutantSources["E2d-v7.7"], SGVL/diagram by prefix).
  'E2d-v7.7': plan.source?.candidates?.E2d
    ? { sal: sha64(plan.source.candidates.E2d), sgvl: plan.source?.candidatesE2dFiles?.sgvl, diagram: plan.source?.candidatesE2dFiles?.diagram }
    : { sal: sha64(frozen['E2d-v7.7']), sgvlPrefix: frozen['E2d-v7.7']?.match(/SGVL ([0-9a-f]{8,})/)?.[1], diagramPrefix: frozen['E2d-v7.7']?.match(/diagram ([0-9a-f]{8,})/)?.[1] }
};
const STEP = { vsFrozenE2dV741: ['E2d-v7.4.1', 'E2d-v7.5'], vsFrozenE2dV75: ['E2d-v7.5', 'E2d-v7.6'], vsFrozenE2dV76: ['E2d-v7.6', 'E2d-v7.7'] };
// orderNotes of slices[E2d] (verbatim text in the report) as exact contiguous sequences ending at GATE_029.
const CONTIGUOUS = {
  vsFrozenE2dV75: { note: 0, seq: ['GATE_SPOIL_R', 'GATE_SPOIL_S', 'GATE_PF_SET', 'STATE_PF', 'GATE_SPOIL_PF', 'GATE_029'] },
  vsFrozenE2dV76: { note: 2, seq: ['GATE_SPOIL_R', 'GATE_SPOIL_S', 'GATE_PHASE', 'GATE_PF_SET', 'STATE_PF', 'GATE_SPOIL_PF', 'GATE_029'] }
};

const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';
const P = s => '//' + s.trim().replace(/\.(?=[^./]+$)/, '/');           // "Net/Blk.Port" -> "//Net/Blk/Port"
const J = x => JSON.stringify(x);
const atomKey = a => J(Object.fromEntries(Object.entries(a).sort()));

/** Declared items -> exact atoms. Returns { atoms, newPortStates, uninterpreted, counts: {before, after} }. */
function expectedFrom(d) {
  const atoms = [], newPortStates = [], uninterpreted = [];
  const add = a => atoms.push(a);
  for (const b of d.blocksAdded ?? []) { const m = b.match(/^(\S+) \((safe\w+)\)$/); if (m) add({ t: 'block-added', path: '//' + m[1], fn: m[2] }); else uninterpreted.push({ field: 'blocksAdded', item: b }); }
  for (const b of d.blocksRemoved ?? []) { if (/^\S+\/\S+$/.test(b)) add({ t: 'block-removed', path: '//' + b }); else uninterpreted.push({ field: 'blocksRemoved', item: b }); }
  for (const [field, t] of [['wiresAdded', 'wire-added'], ['wiresRemoved', 'wire-removed']])
    for (const w of d[field] ?? []) { const m = w.match(/^(\S+) -> (\S+)$/); if (m) add({ t, from: P(m[1]), to: P(m[2]) }); else uninterpreted.push({ field, item: w }); }
  for (const w of d.wiresRebound ?? []) {
    const m = w.match(/^((\S+)\/[^/.]+\.\S+): (\S+) -> (\S+)$/);
    if (!m) { uninterpreted.push({ field: 'wiresRebound', item: w }); continue; }
    const net = m[2], to = P(m[1]); const full = s => s.includes('/') ? P(s) : P(net + '/' + s);
    add({ t: 'wire-removed', from: full(m[3]), to }); add({ t: 'wire-added', from: full(m[4]), to });
  }
  for (const s of [...(d.portStates ?? []), ...(d.portStateChanged ?? [])]) {
    let m;
    if ((m = s.match(/^(\S+)\.(\S+) (Activated NC|Activated NO) \(new\)$/))) {
      for (const port of m[2].split('/')) newPortStates.push({ path: P(m[1] + '.' + port), channelInterface: 'Activated', deactivate1: m[3].endsWith('NC') ? NC : NO, item: s });
    } else if ((m = s.match(/^(\S+) (NC|NO) -> (NC|NO)$/))) {
      add({ t: 'port-attr', path: P(m[1]), attr: 'deactivate1', a: m[2] === 'NC' ? NC : NO, b: m[3] === 'NC' ? NC : NO });
    } else if ((m = s.match(/^(\S+) Activated (NC|NO) -> Deactivated$/))) {
      add({ t: 'port-attr', path: P(m[1]), attr: 'channelInterface', a: 'Activated', b: 'Deactivated' });
      add({ t: 'port-attr', path: P(m[1]), attr: 'deactivate1', a: m[2] === 'NC' ? NC : NO, b: null });
    } else if ((m = s.match(/^(\S+) Deactivated -> Activated (NC|NO)$/))) {
      add({ t: 'port-attr', path: P(m[1]), attr: 'channelInterface', a: 'Deactivated', b: 'Activated' });
      add({ t: 'port-attr', path: P(m[1]), attr: 'deactivate1', a: null, b: m[2] === 'NC' ? NC : NO });
    } else uninterpreted.push({ field: 'portStates', item: s });
  }
  for (const u of d.targetUsagesRemoved ?? []) { const m = u.match(/^(\S+) -> (\S+)$/); if (m) add({ t: 'salusage-removed', name: m[1], side: 'target', kind: 'port', at: 'port:' + P(m[2]) }); else uninterpreted.push({ field: 'targetUsagesRemoved', item: u }); }
  if (typeof d.usages === 'string') {
    // "+N SGVL target usage(s)[:] sym -> Net/Blk.Port[, sym -> ...]" ; the rest of the sentence is checked as counts.
    const m = d.usages.match(/^\+(\d+) SGVL target usages?:? (.+?)(?: \(|;|$)/);
    if (!m) uninterpreted.push({ field: 'usages', item: d.usages });
    else {
      const items = m[2].split(/,\s*/).map(x => x.match(/^(\S+) -> (\S+)$/));
      if (items.some(x => !x) || items.length !== Number(m[1])) uninterpreted.push({ field: 'usages', item: d.usages });
      else for (const [, sym, port0] of items) {
        // A port without network (GATE_PHASE.OrIn1) is resolved against the added blocks of the same item set.
        const port = port0.includes('/') ? P(port0) : atoms.find(a => a.t === 'block-added' && a.path.endsWith('/' + port0.split('.')[0]))?.path + '/' + port0.split('.')[1];
        add({ t: 'gref-added', port, symbol: sym }); add({ t: 'sgvl-usage-added', name: sym, side: 'target', port });
      }
    }
  }
  const parseCounts = s => { const m = s?.match(/(\d+) FB \/ (\d+) ports \/ (\d+) wires \/ (\d+) SAL vars \/ (\d+) SGVL \/ (\d+) globalRefs/) ?? s?.match(/\((\d+) \/ (\d+) \/ (\d+) \/ (\d+) \/ (\d+) \/ (\d+)\)/);
    return m ? { fb: +m[1], ports: +m[2], wires: +m[3], salVars: +m[4], sgvlSymbols: +m[5], globalRefs: +m[6] } : null; };
  const known = new Set(['base', 'blocksAdded', 'blocksRemoved', 'ports', 'wiresAdded', 'wiresRemoved', 'wiresRebound', 'wiresNet', 'portStates', 'portStateChanged', 'targetUsagesRemoved', 'usages', 'after', 'added', 'targetUsageCounts']);
  for (const k of Object.keys(d)) if (!known.has(k)) uninterpreted.push({ field: k, item: d[k] });
  if (Array.isArray(d.added) && d.added.length) uninterpreted.push({ field: 'added', item: d.added });
  return { atoms, newPortStates, uninterpreted, counts: { before: parseCounts(d.base), after: parseCounts(d.after) } };
}

const report = { generatedAt: new Date().toISOString(), tool: 'SafetyTests/scripts/e2-frozen-delta-check.mjs', toolSha256: sha256(fileURLToPath(import.meta.url)),
  libs: Object.fromEntries(['native-delta-model.mjs', 'native-delta-diff.mjs'].map(f => [f, sha256(path.join(standRoot, 'src', f))])),
  plan: { path: path.relative(standRoot, planPath).replace(/\\/g, '/'), sha256: sha256(planPath), planVersion: plan.planVersion }, pairs: [] };

function checkPair(pair) {
  const checks = [], fail = [];
  const check = (group, name, ok, detail) => { const st = ok === null ? 'NV' : ok ? 'PASS' : 'FAIL'; checks.push({ group, name, status: st, ...(detail === undefined ? {} : { detail }) }); if (st === 'FAIL') fail.push(`${group}: ${name}`); };
  const d = declaredDeltas[pair.key], step = STEP[pair.key];
  if (!d || !step) throw Error(`PLAN slices[E2d].rationale.v75.declaredDelta has no ${pair.key} (known: ${Object.keys(STEP).join(', ')})`);
  const A = loadSource(pair.base), B = loadSource(pair.cand);
  const res = { key: pair.key, from: step[0], to: step[1], declared: d, base: { dir: pair.base, sha256: A.sha }, candidate: { dir: pair.cand, sha256: B.sha } };
  // ---- inputs: declared identities
  for (const [side, S, id] of [['base', A, step[0]], ['candidate', B, step[1]]]) {
    const want = ident[id];
    check('inputs', `${side} SAL is the plan-declared ${id} (${want.sal?.slice(0, 8) ?? 'undeclared'})`, want.sal ? S.sha['TwinSafeGroup1.sal'] === want.sal : null, S.sha['TwinSafeGroup1.sal']);
    if (want.sgvl || want.sgvlPrefix) check('inputs', `${side} SGVL is the plan-declared ${id} (${(want.sgvl ?? want.sgvlPrefix).slice(0, 8)})`, want.sgvl ? S.sha['GVL1.sgvl'] === want.sgvl : S.sha['GVL1.sgvl'].startsWith(want.sgvlPrefix), S.sha['GVL1.sgvl']);
    else check('inputs', `plan declares no SGVL SHA for ${id}`, null, S.sha['GVL1.sgvl']);
    if (want.diagram || want.diagramPrefix) check('inputs', `${side} diagram is the plan-declared ${id} (${(want.diagram ?? want.diagramPrefix).slice(0, 8)})`, want.diagram ? S.sha['TwinSafeGroup1.sal.diagram'] === want.diagram : S.sha['TwinSafeGroup1.sal.diagram'].startsWith(want.diagramPrefix), S.sha['TwinSafeGroup1.sal.diagram']);
    else check('inputs', `plan declares no diagram SHA for ${id}`, null, S.sha['TwinSafeGroup1.sal.diagram']);
  }
  const baseSha8 = d.base?.match(/\b([0-9a-f]{8})\b/)?.[1];
  check('inputs', `declared base text names ${baseSha8}`, !!baseSha8 && A.sha['TwinSafeGroup1.sal'].startsWith(baseSha8), d.base);
  // ---- declared atoms vs observed atoms
  const exp = expectedFrom(d);
  res.expectedAtoms = exp.atoms;
  check('plan', `every declared item is interpreted (${exp.atoms.length} atoms, ${exp.newPortStates.length} new-port states)`, exp.uninterpreted.length === 0, exp.uninterpreted);
  const diff = nativeDiff(A, B);
  res.observedAtoms = diff.atoms;
  const obs = new Map(diff.atoms.map(a => [atomKey(a), a]));
  // block-removed atoms from the declaration carry no fn; match them by path.
  const norm = a => a.t === 'block-removed' ? atomKey({ t: a.t, path: a.path }) : atomKey(a);
  const obsN = new Map(diff.atoms.map(a => [a.t === 'block-added' ? atomKey({ t: a.t, path: a.path, fn: a.fn }) : norm(a), a]));
  const expN = new Map(exp.atoms.map(a => [norm(a), a]));
  const missing = [...expN.keys()].filter(k => !obsN.has(k)).map(k => expN.get(k));
  const extra = [...obsN.keys()].filter(k => !expN.has(k)).map(k => obsN.get(k));
  check('delta', `every declared atom is observed (${expN.size})`, missing.length === 0, missing);
  check('delta', `no undeclared native change (${obs.size} observed atoms)`, extra.length === 0, extra);
  // ports of added blocks: declared states exact; the rest reported (not declared by the plan)
  const portOf = p => [...B.sal.ports.values()].find(x => x.path === p);
  const badNew = exp.newPortStates.filter(s => { const q = portOf(s.path); return !q || q.attr.channelInterface !== s.channelInterface || (q.attr.deactivate1 ?? null) !== s.deactivate1; });
  check('delta', 'declared states of new-block ports hold in the candidate', badNew.length === 0, badNew.map(s => ({ ...s, actual: portOf(s.path)?.attr ?? null })));
  const addedBlocks = new Set(diff.atoms.filter(a => a.t === 'block-added').map(a => a.path));
  res.addedBlockPorts = [...B.sal.ports.values()].filter(p => addedBlocks.has(p.path.split('/').slice(0, 4).join('/'))).map(p => ({ path: p.path, channelInterface: p.attr.channelInterface ?? null, deactivate1: p.attr.deactivate1 ?? null }));
  // ---- counts
  const cA = counts(A), cB = counts(B);
  res.counts = { base: cA, candidate: cB };
  for (const [label, want, got] of [['base', exp.counts.before, cA], ['after', exp.counts.after, cB]]) {
    if (!want) { check('counts', `plan states ${label} counts`, false, d[label === 'base' ? 'base' : 'after']); continue; }
    const diffs = Object.entries(want).filter(([k, v]) => got[k] !== v).map(([k, v]) => ({ k, plan: v, model: got[k] }));
    check('counts', `${label} counts equal the plan text (${Object.entries(want).map(([k, v]) => `${k} ${v}`).join(', ')})`, diffs.length === 0, diffs);
  }
  check('counts', 'SGVL FbPortUsages equal SAL globalRefs in the candidate', cB.sgvlUsages === cB.globalRefs, { sgvlUsages: cB.sgvlUsages, globalRefs: cB.globalRefs });
  // ---- execution order
  const ordB = new Map([...B.sal.blocks.values()].map(b => [b.path, +b.attr.orderOfExecution]));
  const ordA = new Map([...A.sal.blocks.values()].map(b => [b.path, +b.attr.orderOfExecution]));
  const all = [...ordB.values()].sort((x, y) => x - y);
  check('order', `candidate orderOfExecution is a permutation 1..${ordB.size}`, all.every((o, i) => o === i + 1));
  const retained = [...ordA.keys()].filter(p => ordB.has(p)).sort((x, y) => ordA.get(x) - ordA.get(y));
  const inv = retained.filter((p, i) => i && ordB.get(p) < ordB.get(retained[i - 1]));
  check('order', `relative execution order of the ${retained.length} retained blocks is preserved`, inv.length === 0, inv.slice(0, 40));
  const full = s => '//' + s;
  const rules = (e2d.order ?? []).map(t => ({ t, m: t.match(/^(\S+) (after|before) (\S+)$/) })).filter(r => r.m && ordB.has(full(r.m[1])) && ordB.has(full(r.m[3])) && (addedBlocks.has(full(r.m[1])) || addedBlocks.has(full(r.m[3]))));
  for (const r of rules) { const s = ordB.get(full(r.m[1])), t = ordB.get(full(r.m[3])); check('order', `slices[E2d].order: ${r.t}`, r.m[2] === 'after' ? s > t : s < t, { [r.m[1]]: s, [r.m[3]]: t }); }
  const cont = CONTIGUOUS[pair.key];
  if (cont) { const got = cont.seq.map(n => ordB.get('//RndPhysicalCompact/' + n));
    check('order', `slices[E2d].orderNotes[${cont.note}]: ${cont.seq.join(', ')} contiguous in this order`, got.every((o, i) => o !== undefined && (!i || o === got[i - 1] + 1)), { note: e2d.orderNotes?.[cont.note], orders: cont.seq.map((n, i) => [n, got[i]]) }); }
  // ---- diagram structure (as scripts/e2-delta-check.mjs; geometry not compared)
  const shapes = [...B.diagram.shapes.values()], perMon = new Map();
  for (const s of shapes) if (s.moniker && s.tag !== 'wiredLinkConnector') perMon.set(s.moniker, (perMon.get(s.moniker) ?? 0) + 1);
  const elems = [...B.sal.blocks.values()].map(b => b.path).concat([...B.sal.ports.values()].map(p => p.path));
  check('diagram', `every candidate block/port has exactly one shape (${elems.length})`, elems.every(e => perMon.get(e) === 1), elems.filter(e => perMon.get(e) !== 1).slice(0, 30));
  const elemSet = new Set(elems), stale = [...perMon.keys()].filter(m => m.startsWith('//') && !elemSet.has(m) && m.split('/').length > 3);
  check('diagram', 'no shape references a block/port absent from the candidate', stale.length === 0, stale.slice(0, 30));
  const con = shapes.filter(s => s.tag === 'wiredLinkConnector'), conIds = con.map(c => c.moniker), wids = new Set(B.sal.wires.map(w => w.id));
  check('diagram', `one connector per wire (${B.sal.wires.length}) and connector nodes reference existing shapes`, con.length === B.sal.wires.length && new Set(conIds).size === conIds.length && conIds.every(i => wids.has(i)) && con.every(c => c.nodes.length === 2 && c.nodes.every(n => B.diagram.shapes.has(n))), { connectors: con.length, wires: B.sal.wires.length });
  res.checks = checks; res.failed = fail; res.nv = checks.filter(c => c.status === 'NV').map(c => `${c.group}: ${c.name}`);
  res.status = fail.length ? 'FAIL' : 'PASS';
  return res;
}

let toolError = false;
for (const p of pairs) {
  try { report.pairs.push(checkPair(p)); }
  catch (e) { toolError = true; report.pairs.push({ key: p.key, base: p.base, candidate: p.cand, status: 'ERROR', error: String(e.stack) }); }
}
report.status = toolError ? 'ERROR' : report.pairs.every(p => p.status === 'PASS') ? 'PASS' : 'FAIL';
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 1) + '\n');
console.log('PLAN', report.plan.path, report.plan.sha256);
for (const r of report.pairs) {
  console.log(`\n== ${r.key} ${r.from ?? ''} -> ${r.to ?? ''}: ${r.status}  base SAL ${r.base?.sha256?.['TwinSafeGroup1.sal']?.slice(0, 8) ?? r.base} cand SAL ${r.candidate?.sha256?.['TwinSafeGroup1.sal']?.slice(0, 8) ?? r.candidate}`);
  if (r.error) { console.log('ERROR', r.error.split('\n')[0]); continue; }
  for (const c of r.checks) console.log(`  ${c.status.padEnd(4)} [${c.group}] ${c.name}${c.status === 'FAIL' ? ' :: ' + J(c.detail).slice(0, 400) : ''}`);
}
console.log(`\nE2-FROZEN-DELTA ${report.status}: ${report.pairs.map(r => `${r.key}=${r.status}`).join(' ')}\nreport: ${outPath}`);
process.exitCode = toolError ? 2 : report.status === 'PASS' ? 0 : 1;
