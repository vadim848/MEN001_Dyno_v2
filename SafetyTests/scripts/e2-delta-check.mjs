// Exact multi-slice native delta proof (stand D2, reviewer G1 v7 §3/D2, 2026-10-22).
// Extends the approach of scripts/f1-delta-check.mjs (P0 -> F1) to the E2 slice chain
// F1 -> R1 -> E2a-core -> E2a-RC -> E2b -> E2c -> E2d. For every consecutive pair (base, candidate) of a slice:
//   expected = plan items of that slice (program/architect/E2-status/PLAN.json) applied to the BASE model only;
//   the candidate is loaded and compared, it never contributes expectations (src/native-delta-plan.mjs).
// Checked per pair: physical aliases (SAL alias/group-port usages, alias ports), wires, SGVL Symbols/usages and
// declarations, SAL variables, PLC fanout, port states, blocks, counts (model and plan-stated), the usage ledger
// (every missing usage belongs to a planned deletion/rebinding, every new one to a planned addition), execution
// order rules, native identity (ids, wrappers, retained usage order) and diagram structure (one shape per element).
// Usage:
//   node scripts/e2-delta-check.mjs [--plan <PLAN.json>] [--out <report.json>] --chain F1=<dir> R1=<dir> E2a-core=<dir> ...
//   node scripts/e2-delta-check.mjs [--plan ...] --pair <slice> <baseDir> <candidateDir> [--pair ...]
// A dir is a flat triple folder (TwinSafeGroup1.sal, TwinSafeGroup1.sal.diagram, GVL1.sgvl) or a Safety_Dyno folder.
// Exit: 0 all pairs PASS; 1 some pair FAIL; 2 tool error; 64 usage.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadSource, sha256, walk } from '../src/native-delta-model.mjs';
import { nativeDiff, counts } from '../src/native-delta-diff.mjs';
import { abstractModel, buildExpected, modelCounts, CHAIN } from '../src/native-delta-plan.mjs';

const standRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const planPath = path.resolve(opt('--plan') ?? path.join(standRoot, 'program/architect/E2-status/PLAN.json'));
const pairs = [];
for (let i = 0; i < args.length; i++) if (args[i] === '--pair') { pairs.push({ slice: args[i + 1], base: path.resolve(args[i + 2]), cand: path.resolve(args[i + 3]) }); i += 3; }
const ci = args.indexOf('--chain');
if (ci >= 0) { const steps = []; for (let i = ci + 1; i < args.length && !args[i].startsWith('--'); i++) { const [k, ...v] = args[i].split('='); steps.push({ id: k, dir: path.resolve(v.join('=')) }); }
  for (const s of steps) if (!CHAIN.includes(s.id)) { console.error(`unknown chain step ${s.id}; known ${CHAIN.join(', ')}`); process.exit(64); }
  for (let i = 1; i < steps.length; i++) { if (CHAIN.indexOf(steps[i].id) !== CHAIN.indexOf(steps[i - 1].id) + 1) { console.error(`chain must be consecutive: ${steps[i - 1].id} -> ${steps[i].id}`); process.exit(64); } pairs.push({ slice: steps[i].id, base: steps[i - 1].dir, cand: steps[i].dir, baseId: steps[i - 1].id }); } }
if (!pairs.length) { console.error('usage: node scripts/e2-delta-check.mjs [--plan PLAN.json] [--out report.json] (--chain F1=<dir> R1=<dir> ... | --pair <slice> <base> <cand> ...)'); process.exit(64); }
const outPath = opt('--out') ? path.resolve(opt('--out')) : path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'e2-delta-check-')), 'E2_DELTA_CHECK.json');
for (const role of ['tester', 'reviewer', 'architect', 'analyst', 'editor', 'lead', 'runs'])
  if ((outPath.toLowerCase() + path.sep).startsWith(path.join(standRoot, 'program', role).toLowerCase() + path.sep)) { console.error(`refusing to write into program/${role} (role-owned)`); process.exit(64); }

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
// SHAs the plan itself declares for slice sources (base of R1 = plan.source = F1).
// Only plan.source declares candidate SHAs: sal (F1), r1Candidate, e2aCoreCandidate, e2aRcCandidate and the
// unambiguous map source.candidates.{E2b,E2c,E2d} (value: SHA256 or "<path> SAL <sha256>"). Addenda are not read.
const sha64 = v => typeof v === 'string' ? v.match(/[0-9a-f]{64}/)?.[0] : undefined;
const declared = { F1: plan.source?.sal, R1: sha64(plan.source?.r1Candidate), 'E2a-core': sha64(plan.source?.e2aCoreCandidate), 'E2a-RC': sha64(plan.source?.e2aRcCandidate) };
for (const [sl, v] of Object.entries(plan.source?.candidates ?? {})) { if (!CHAIN.includes(sl)) { console.error(`plan.source.candidates: unknown slice ${sl}`); process.exit(64); } if (declared[sl] && declared[sl] !== sha64(v)) { console.error(`plan.source declares two SHAs for ${sl}`); process.exit(64); } declared[sl] = sha64(v); }
// Addenda (top-level keys addendum*) may carry structural changes outside slices[].
const addenda = Object.keys(plan).filter(k => /^addendum/i.test(k));
// Slices whose structural changes are partly stated in addenda: those addenda are not interpreted by this tool,
// so such a pair cannot PASS (reported as plan FAIL). r1Addendum (R1 D-1..D-3) is covered by the generic checks
// (empty network container, deleted Symbols/usages, geometry not compared).
const addendumSlices = sl => addenda.filter(k => k !== 'r1Addendum').filter(k => { const a = plan[k]; return a?.slice === sl || Object.keys(a ?? {}).some(x => x.includes('_' + sl.replace(/-/g, '') + '_')) || (k === 'addendum72' && sl === 'E2d'); });
const report = { generatedAt: new Date().toISOString(), tool: 'SafetyTests/scripts/e2-delta-check.mjs', toolSha256: sha256(fileURLToPath(import.meta.url)),
  libs: Object.fromEntries(['native-delta-model.mjs', 'native-delta-diff.mjs', 'native-delta-plan.mjs'].map(f => [f, sha256(path.join(standRoot, 'src', f))])),
  plan: { path: path.relative(standRoot, planPath).replace(/\\/g, '/'), sha256: sha256(planPath), planVersion: plan.planVersion, slice: plan.slice }, pairs: [] };

const J = x => JSON.stringify(x);
const PLC = /PLC/;

function checkPair(pair) {
  const checks = [], fail = [];
  const check = (group, name, ok, detail) => { const st = ok === null ? 'NV' : ok ? 'PASS' : 'FAIL'; checks.push({ group, name, status: st, ...(detail === undefined ? {} : { detail }) }); if (st === 'FAIL') fail.push(`${group}: ${name}`); };
  const A = loadSource(pair.base), B = loadSource(pair.cand);
  const baseId = pair.baseId ?? CHAIN[CHAIN.indexOf(pair.slice) - 1];
  const res = { slice: pair.slice, baseId, base: { dir: pair.base, sha256: A.sha }, candidate: { dir: pair.cand, sha256: B.sha } };
  // ---- inputs
  if (declared[baseId]) check('inputs', `base SAL is the plan-declared ${baseId} (${declared[baseId].slice(0, 8)})`, A.sha['TwinSafeGroup1.sal'] === declared[baseId], A.sha['TwinSafeGroup1.sal']);
  else check('inputs', `plan declares no SHA for base ${baseId}`, null, A.sha['TwinSafeGroup1.sal']);
  if (declared[pair.slice]) check('inputs', `candidate SAL is the plan-declared ${pair.slice} (${declared[pair.slice].slice(0, 8)})`, B.sha['TwinSafeGroup1.sal'] === declared[pair.slice], B.sha['TwinSafeGroup1.sal']);
  else check('inputs', `plan declares no SHA for candidate ${pair.slice}`, null, B.sha['TwinSafeGroup1.sal']);
  if (pair.slice === 'R1') check('inputs', 'plan.source SGVL/diagram equal the F1 base', A.sha['GVL1.sgvl'] === plan.source.sgvl && A.sha['TwinSafeGroup1.sal.diagram'] === plan.source.diagram);
  // ---- plan -> expected model (base only)
  const MA = abstractModel(A), MB = abstractModel(B);
  check('model', 'base model has no binding anomalies', MA.anomalies.length === 0, MA.anomalies);
  check('model', 'candidate model has no binding anomalies', MB.anomalies.length === 0, MB.anomalies);
  const { applier: E, slice, ignoredFields } = buildExpected(plan, MA, pair.slice);
  const M = E.M;
  res.planItems = E.items; res.ignoredSliceFields = ignoredFields;
  const unint = E.items.filter(i => i.status !== 'APPLIED');
  check('plan', `every structural plan item of ${pair.slice} is interpreted (${E.items.length})`, unint.length === 0, unint);
  const adds = addendumSlices(pair.slice);
  check('plan', `no plan addendum carries structural changes for ${pair.slice} outside slices[] (not interpreted by this tool)`, adds.length === 0, adds);
  for (const a of E.asserts.filter(a => a.phase === 'base')) check('plan-assert', a.name, a.status === 'PASS', a.detail);
  for (const a of E.asserts.filter(a => a.phase === 'final')) { const r = a.fn(MB); check('plan-assert', a.name, r.ok, r.detail); }

  // ---- expected model vs candidate model
  const setDiff = (x, y) => ({ missing: [...x].filter(k => !y.has(k)), unexpected: [...y].filter(k => !x.has(k)) });
  const bd = setDiff(new Set(M.blocks.keys()), new Set(MB.blocks.keys()));
  check('blocks', 'block set equals base with planned deletions/additions', !bd.missing.length && !bd.unexpected.length, bd);
  const blockIssues = [];
  for (const [p, e] of M.blocks) { const b = MB.blocks.get(p); if (!b) continue;
    if (e.fn !== b.fn || e.tag !== b.tag || e.network !== b.network) blockIssues.push({ p, what: 'fn/tag/network', e: [e.fn, e.tag, e.network], b: [b.fn, b.tag, b.network] });
    const keys = e.templateKeys ? [...e.templateKeys, 'name', 'instanceName'] : [...new Set([...Object.keys(e.attrs), ...Object.keys(b.attrs)])];
    for (const k of keys) if (e.attrs[k] !== b.attrs[k]) blockIssues.push({ p, attr: k, expected: e.attrs[k], candidate: b.attrs[k] });
    if (e.templateKeys) { const extra = Object.keys(b.attrs).filter(k => !keys.includes(k)); if (extra.length) blockIssues.push({ p, what: 'attributes not in template', extra }); }
    if (J(e.ports) !== J(b.ports)) blockIssues.push({ p, what: 'port list', expected: e.ports.map(x => x.name), candidate: b.ports.map(x => x.name) }); }
  check('blocks', 'block attributes (all except orderOfExecution) and port lists: retained unchanged, new = native template of the same functionName', blockIssues.length === 0, blockIssues);
  const portAttrIssues = [], stateIssues = [], wireIssues = [], symIssues = [], varying = [];
  const cmpAttrs = (p, e, b) => { const keys = e.isNew ? Object.keys(e.attrs) : [...new Set([...Object.keys(e.attrs), ...Object.keys(b.attrs)])];
    for (const k of keys) if (e.attrs[k] !== b.attrs[k]) portAttrIssues.push({ p, attr: k, expected: e.attrs[k], candidate: b.attrs[k] });
    if (e.isNew) { const extra = Object.keys(b.attrs).filter(k => !(k in e.attrs) && !(e.varying ?? []).includes(k)); if (extra.length) portAttrIssues.push({ p, what: 'attributes absent in template', extra }); if (e.varying?.length) varying.push({ p, keys: e.varying, candidate: Object.fromEntries(e.varying.map(k => [k, b.attrs[k]])) }); } };
  for (const coll of ['inPorts', 'outPorts', 'params']) { const d = setDiff(new Set(M[coll].keys()), new Set(MB[coll].keys())); if (d.missing.length || d.unexpected.length) portAttrIssues.push({ coll, ...d }); }
  for (const [p, e] of M.inPorts) { const b = MB.inPorts.get(p); if (!b) continue; cmpAttrs(p, e, b);
    if (e.ci !== b.ci || e.contact !== b.contact) stateIssues.push({ p, expected: { ci: e.ci, contact: e.contact }, candidate: { ci: b.ci, contact: b.contact } });
    const ew = e.src.filter(s => s.k === 'wire'), bw = b.src.filter(s => s.k === 'wire'), es = e.src.filter(s => s.k === 'sym'), bs = b.src.filter(s => s.k === 'sym');
    if (J(ew) !== J(bw)) wireIssues.push({ to: p, expected: ew.map(s => s.from), candidate: bw.map(s => s.from) });
    if (J(es) !== J(bs)) symIssues.push({ port: p, expected: es.map(s => s.name), candidate: bs.map(s => s.name) }); }
  for (const [p, e] of M.outPorts) { const b = MB.outPorts.get(p); if (!b) continue; cmpAttrs(p, e, b); if (J(e.syms) !== J(b.syms)) symIssues.push({ port: p, expected: e.syms, candidate: b.syms }); }
  for (const [p, e] of M.params) { const b = MB.params.get(p); if (b) cmpAttrs(p, e, b); }
  check('ports', 'port sets and native port attributes (portNum/objectIndex/varId/filter/type/timing ...) as planned', portAttrIssues.length === 0, portAttrIssues);
  if (varying.length) check('ports', 'new ports: attributes that differ among base template blocks (not compared, listed)', null, varying);
  check('ports', 'input states (channelInterface, contact NC/NO) as planned', stateIssues.length === 0, stateIssues);
  check('wires', 'every wire (driver -> input) equals base with planned changes; nothing else', wireIssues.length === 0, wireIssues);
  check('symbols', 'every Symbol binding (inputs read, outputs write) equals base with planned changes', symIssues.length === 0, symIssues);
  // ---- SGVL / SAL variables / aliases
  const sg = setDiff(new Set(M.sgvl.keys()), new Set(MB.sgvl.keys()));
  check('sgvl', `SGVL Symbols: base ${MA.sgvl.size} - deleted ${E.touched.symbolsDeleted.size ? [...E.touched.symbolsDeleted].filter(n => MA.sgvl.has(n)).length : 0} + created ${[...E.touched.symbolsAdded].filter(n => M.sgvl.has(n)).length} = ${M.sgvl.size}; candidate ${MB.sgvl.size}`, !sg.missing.length && !sg.unexpected.length, sg);
  const declIssues = [...M.sgvl].filter(([n, e]) => MB.sgvl.has(n) && e.rest !== null && J(e.rest) !== J(MB.sgvl.get(n).rest)).map(([n]) => n);
  check('sgvl', 'retained SGVL declarations unchanged (type/initial/attributes)', declIssues.length === 0, declIssues);
  const sv = setDiff(new Set(M.salVars.keys()), new Set(MB.salVars.keys()));
  check('aliases', `SAL variables: expected ${M.salVars.size}, candidate ${MB.salVars.size}; names (incl. planned renames) equal`, !sv.missing.length && !sv.unexpected.length, sv);
  const aliasIssues = [];
  for (const [n, e] of M.salVars) { const b = MB.salVars.get(n); if (!b) continue;
    if (e.attrs !== null && J(e.attrs) !== J(b.attrs)) aliasIssues.push({ n, what: 'attributes', expected: e.attrs, candidate: b.attrs });
    if (J(e.alias) !== J(b.alias)) aliasIssues.push({ n, what: 'alias device / group port usages', expected: e.alias, candidate: b.alias }); }
  check('aliases', 'physical aliases: every SAL variable keeps its alias-device and group-port usages (ids, sdsId, channelId, functionId) and attributes', aliasIssues.length === 0, aliasIssues);
  const id = d => d.atoms.filter(a => a.t === 'non-program');
  const D = nativeDiff(A, B);
  check('aliases', 'alias ports / non-program SAL records byte-canonical identical', id(D).length === 0, id(D));
  // ---- PLC fanout
  const plcView = (MM, n) => ({ consumers: [...MM.inPorts].filter(([, p]) => p.src.some(s => s.k === 'sym' && s.name === n)).map(([k]) => k).sort(), producers: [...MM.outPorts].filter(([, p]) => p.syms.includes(n)).map(([k]) => k).sort() });
  const plcNames = [...new Set([...M.salVars.keys(), ...MB.salVars.keys()])].filter(n => PLC.test(n)).sort();
  const plcIssues = [], plcChanges = [];
  for (const n of plcNames) { const e = plcView(M, n), b = plcView(MB, n); if (J(e) !== J(b)) plcIssues.push({ n, expected: e, candidate: b });
    const baseName = [...E.touched.renamed].find(([, to]) => to === n)?.[0] ?? n; const a = plcView(MA, baseName); if (J(a) !== J(e)) plcChanges.push({ n, base: a, expected: e }); }
  check('plc', `PLC fanout: ${plcNames.length} PLC alias variables - consumers and producers equal base with planned changes`, plcIssues.length === 0, { issues: plcIssues, plannedChanges: plcChanges });
  const n1 = '//Network1/FBAnd1';
  if (M.blocks.has(n1)) { const e = [...M.inPorts].filter(([k]) => k.startsWith(n1 + '/')).map(([k, p]) => [k, p.ci, p.contact, p.src]), b = [...MB.inPorts].filter(([k]) => k.startsWith(n1 + '/')).map(([k, p]) => [k, p.ci, p.contact, p.src]);
    check('plc', 'PLC producer Network1/FBAnd1: inputs, contacts and sources as planned', J(e) === J(b), { expected: e, candidate: b }); }
  // ---- counts
  const cB = counts(B), cE = modelCounts(M), cA = counts(A);
  res.counts = { base: cA, expectedFromPlan: cE, candidate: cB };
  const ck = ['fb', 'ports', 'params', 'salVars', 'sgvlSymbols', 'wires', 'globalRefs'];
  check('counts', 'candidate counts equal the plan-applied base model (fb/ports/params/salVars/sgvlSymbols/wires/globalRefs)', ck.every(k => cB[k] === cE[k]), ck.filter(k => cB[k] !== cE[k]).map(k => ({ k, expected: cE[k], candidate: cB[k] })));
  const stated = { fb: slice.fbAfter, ports: slice.portsAfter, sgvlSymbols: slice.sgvlAfter, salVars: slice.salVarsAfter };
  if (pair.slice === 'R1' && plan.baselineResources?.base === 'R1') Object.assign(stated, { fb: stated.fb ?? plan.baselineResources.fb, ports: stated.ports ?? plan.baselineResources.ports, sgvlSymbols: stated.sgvlSymbols ?? plan.baselineResources.sgvlSymbols, salVars: stated.salVars ?? plan.baselineResources.salVariables });
  if (plan.budget?.exact?.[pair.slice] !== undefined) stated.fbBudget = plan.budget.exact[pair.slice];
  for (const [k, v] of Object.entries(stated)) { if (v === undefined) { check('counts', `plan states no ${k} for ${pair.slice}`, null); continue; } const key = k === 'fbBudget' ? 'fb' : k; check('counts', `${key} = ${v} (plan ${k === 'fbBudget' ? 'budget.exact' : 'slice'} ${pair.slice})`, cB[key] === v, cB[key]); }
  // ---- usage ledger (identity layer: by native usage id)
  const T = E.touched, onDeletedBlock = p => [...T.blocksDeleted].some(b => p.startsWith(b + '/')), onNewBlock = p => [...T.blocksAdded].some(b => p.startsWith(b + '/'));
  const portOf = a => (a.port ?? a.at ?? '').replace(/^port:/, '');
  const renamedFrom = new Map([...T.renamed].map(([f, t]) => [t, f]));
  const explainRemoved = (port, sym) => onDeletedBlock(port) ? 'deleted block' : T.symbolsDeleted.has(sym) ? 'deleted Symbol' : (T.inPorts.has(port) || T.outPorts.has(port)) ? 'planned rebinding' : null;
  const explainAdded = (port, sym) => onNewBlock(port) ? 'new block' : T.symbolsAdded.has(sym) ? 'new Symbol' : (T.inPorts.has(port) || T.outPorts.has(port)) ? 'planned binding' : null;
  const ledger = [], unexplained = [];
  for (const a of D.atoms) { let why = null, kind = null;
    switch (a.t) {
      case 'block-removed': kind = 'removed'; why = T.blocksDeleted.has(a.path) ? 'planned deletion' : null; break;
      case 'block-added': kind = 'added'; why = T.blocksAdded.has(a.path) ? 'planned addition' : null; break;
      case 'sgvl-removed': case 'salvar-removed': kind = 'removed'; why = T.symbolsDeleted.has(a.name) ? 'planned Symbol deletion' : null; break;
      case 'sgvl-added': case 'salvar-added': kind = 'added'; why = T.symbolsAdded.has(a.name) ? 'planned Symbol creation' : null; break;
      case 'salvar-attr': kind = 'changed'; why = a.attr === 'name' && T.renamed.get(a.a) === a.b ? 'planned rename' : null; break;
      case 'port-attr': kind = 'changed'; why = T.inPorts.has(a.path) ? 'planned port state' : null; break;
      case 'wire-removed': kind = 'removed'; why = onDeletedBlock(a.from) || onDeletedBlock(a.to) ? 'deleted block' : T.inPorts.has(a.to) ? 'planned rebinding' : null; break;
      case 'wire-added': kind = 'added'; why = onNewBlock(a.to) ? 'new block' : T.inPorts.has(a.to) ? 'planned binding' : null; break;
      case 'gref-removed': case 'sgvl-usage-removed': kind = 'removed'; why = explainRemoved(portOf(a), a.symbol ?? a.name); break;
      case 'gref-added': case 'sgvl-usage-added': kind = 'added'; why = explainAdded(portOf(a), a.symbol ?? a.name); break;
      case 'salusage-removed': kind = 'removed'; why = a.kind === 'port' ? explainRemoved(portOf(a), a.name) : null; break;
      case 'salusage-added': kind = 'added'; why = a.kind === 'port' ? explainAdded(portOf(a), renamedFrom.get(a.name) ?? a.name) : null; break;
      case 'salusage-changed': kind = 'moved'; { const ra = explainRemoved(portOf(a), a.name), ad = explainAdded(a.bAt.replace(/^port:/, ''), a.name); why = ra && ad ? `${ra} + ${ad}` : null; } break;
      case 'gref-changed': case 'sgvl-usage-changed': kind = 'moved'; { const ra = explainRemoved(a.port, a.symbol ?? a.name), ad = explainAdded(a.bPort, a.bSymbol ?? a.name); why = ra && ad ? `${ra} + ${ad}` : null; } break;
      case 'network-container': kind = 'container'; why = a.emptyInB && a.b === 0 ? 'empty network serialized without functionBlocks (R1 D-1)' : null; break;
      default: kind = 'identity'; why = null; }
    const row = { ...a, kind, explainedBy: why }; ledger.push(row); if (!why) unexplained.push(row); }
  res.ledgerSummary = Object.fromEntries(Object.entries(ledger.reduce((m, r) => { (m[r.t] ??= { total: 0, explained: 0 }).total++; if (r.explainedBy) m[r.t].explained++; return m; }, {})));
  const usageTypes = /^(gref|salusage|sgvl-usage)-/;
  check('ledger', `usage ledger: every missing SAL/SGVL usage belongs to a deleted block/Symbol or a planned rebinding (${ledger.filter(r => usageTypes.test(r.t) && r.kind !== 'added').length})`, !unexplained.some(r => usageTypes.test(r.t) && r.kind !== 'added'), unexplained.filter(r => usageTypes.test(r.t) && r.kind !== 'added'));
  check('ledger', `usage ledger: every new SAL/SGVL usage belongs to a new block/Symbol or a planned binding (${ledger.filter(r => usageTypes.test(r.t) && r.kind === 'added').length})`, !unexplained.some(r => usageTypes.test(r.t) && r.kind === 'added'), unexplained.filter(r => usageTypes.test(r.t) && r.kind === 'added'));
  check('ledger', 'every other native difference (blocks, Symbols, wires, port states, renames, identity) is a planned item', !unexplained.some(r => !usageTypes.test(r.t)), unexplained.filter(r => !usageTypes.test(r.t)));
  res.ledger = ledger;
  // ---- native identity of retained elements
  const idAtoms = D.atoms.filter(a => ['root-attr', 'networks', 'block-identity', 'port-identity', 'port-other', 'port-removed', 'port-added', 'salvar-wrappers', 'salusage-order', 'sgvl-usage-order', 'sgvl-decl', 'sgvl-root-attr', 'sgvl-other', 'block-attr'].includes(a.t));
  check('identity', 'retained blocks/ports/variables/usages keep ids, relationship wrappers and usage order; root (except Crc) and networks unchanged', idAtoms.length === 0, idAtoms);
  const ids = walk(B.sal.x).map(n => n.attr.Id).filter(Boolean);
  check('identity', 'all candidate SAL object/relationship Ids unique', new Set(ids).size === ids.length, ids.length);
  // SGVL usages <-> SAL references, with side
  const sgSal = new Set(B.sal.globals.map(g => `${g.variableId}|${g.portId}|${B.sal.ports.get(g.portId)?.kind === 'outPort' ? 'source' : 'target'}`));
  const sgGvl = new Set([...B.sgvl.vars].flatMap(([vid, v]) => [...v.source.map(u => `${vid}|${u.port}|source`), ...v.target.map(u => `${vid}|${u.port}|target`)]));
  const sgd = setDiff(sgSal, sgGvl);
  check('sgvl', 'candidate SGVL FbPortUsages equal SAL fbPortGlobalVariableReferences (variable, port, side)', !sgd.missing.length && !sgd.unexpected.length, sgd);
  // ---- graph sanity on the candidate
  const net = p => p.split('/')[2];
  check('wires', 'no cross-network graphical wiredLink in candidate', B.sal.wires.every(w => net(w.from) === net(w.to)), B.sal.wires.filter(w => net(w.from) !== net(w.to)));
  const multi = [...MB.inPorts].filter(([, p]) => p.src.length > 1).map(([k, p]) => ({ k, src: p.src }));
  check('wires', 'no input has more than one source (wire or Symbol)', multi.length === 0, multi);
  const touchedBad = [...T.inPorts].filter(p => MB.inPorts.has(p)).map(p => [p, MB.inPorts.get(p)]).filter(([, p]) => (p.ci !== 'Deactivated') !== (p.src.length === 1)).map(([k, p]) => ({ k, ci: p.ci, src: p.src }));
  check('wires', 'every input touched by the plan: active (not Deactivated) <=> exactly one source', touchedBad.length === 0, touchedBad);
  const dangling = mm => [...mm.inPorts].filter(([, p]) => (p.ci !== 'Deactivated') !== (p.src.length === 1)).map(([k]) => k).sort();
  const da = dangling(MA), db = dangling(MB);
  check('wires', `inputs violating active <=> one source: base ${da.length}, candidate ${db.length}; none new`, db.every(k => da.includes(k)), { base: da, candidate: db });
  // ---- execution order
  const ord = p => MB.blocks.get(p)?.order;
  const orders = [...MB.blocks.values()].map(b => b.order).sort((a, b) => a - b);
  check('order', `candidate orderOfExecution is a permutation 1..${MB.blocks.size}`, orders.every((o, i) => o === i + 1));
  const exempt = new Set();
  for (const c of E.order) {
    if (c.kind === 'head') { c.blocks.forEach(b => exempt.add(b)); const got = c.blocks.map(ord); check('order', `head (${c.source}): ${c.blocks.length} blocks occupy orders 1..${c.blocks.length} in the listed sequence`, got.every((o, i) => o === i + 1), c.blocks.map((b, i) => [b, got[i]])); }
    else if (c.kind === 'chain') { c.blocks.forEach(b => exempt.add(b)); const got = c.blocks.map(ord); check('order', `chain ${c.text} (${c.source})`, got.every((o, i) => o !== undefined && (!i || o > got[i - 1])), c.blocks.map((b, i) => [b, got[i]])); }
    else { c.subjects.forEach(b => exempt.add(b)); const t = ord(c.target), got = c.subjects.map(ord); check('order', `${c.text} (${c.source})`, t !== undefined && got.every(o => o !== undefined && (c.kind === 'before' ? o < t : o > t)), { target: [c.target, t], subjects: c.subjects.map((b, i) => [b, got[i]]) }); }
  }
  const retained = [...MA.blocks.entries()].filter(([p]) => MB.blocks.has(p) && !exempt.has(p)).sort(([, a], [, b]) => a.order - b.order).map(([p]) => p);
  const inv = retained.filter((p, i) => i && ord(p) < ord(retained[i - 1])).map(p => p);
  check('order', `relative execution order of the ${retained.length} retained blocks not moved by the plan is preserved`, inv.length === 0, inv.slice(0, 40));
  // ---- plan negative statements
  if (E.newBlockOutputsNoSymbol) { const bad = [...MB.outPorts].filter(([k, p]) => T.blocksAdded.has(p.block) && p.syms.length).map(([k, p]) => ({ k, syms: p.syms })); check('plan-assert', 'no Symbol on the outputs of the new blocks of the slice', bad.length === 0, bad); }
  for (const n of E.absentSymbols) check('plan-assert', `cancelled Symbol ${n} absent in candidate`, !MB.sgvl.has(n) && !MB.salVars.has(n));
  // ---- diagram structure (geometry is not compared: R1 D-2 / E2a addendumV6 D_2)
  const shapes = [...B.diagram.shapes.values()], perMon = new Map();
  for (const s of shapes) if (s.moniker && s.tag !== 'wiredLinkConnector') perMon.set(s.moniker, (perMon.get(s.moniker) ?? 0) + 1);
  const elems = [...B.sal.blocks.values()].map(b => b.path).concat([...B.sal.ports.values()].map(p => p.path));
  check('diagram', `every candidate block/port has exactly one shape (${elems.length})`, elems.every(e => perMon.get(e) === 1), elems.filter(e => perMon.get(e) !== 1).slice(0, 30));
  const elemSet = new Set(elems), stale = [...perMon.keys()].filter(m => m.startsWith('//') && !elemSet.has(m) && m.split('/').length > 3);
  check('diagram', 'no shape references a block/port absent from the candidate', stale.length === 0, stale.slice(0, 30));
  const con = shapes.filter(s => s.tag === 'wiredLinkConnector'), conIds = con.map(c => c.moniker), wids = new Set(B.sal.wires.map(w => w.id));
  check('diagram', `one connector per wire (${B.sal.wires.length}) and connector nodes reference existing shapes`, con.length === B.sal.wires.length && new Set(conIds).size === conIds.length && conIds.every(i => wids.has(i)) && con.every(c => c.nodes.length === 2 && c.nodes.every(n => B.diagram.shapes.has(n))), { connectors: con.length, wires: B.sal.wires.length });

  res.checks = checks; res.failed = fail;
  res.status = fail.length ? 'FAIL' : 'PASS';
  res.nv = checks.filter(c => c.status === 'NV').map(c => `${c.group}: ${c.name}`);
  return res;
}

let toolError = false;
for (const p of pairs) {
  try { report.pairs.push(checkPair(p)); }
  catch (e) { toolError = true; report.pairs.push({ slice: p.slice, base: p.base, candidate: p.cand, status: 'ERROR', error: String(e.stack) }); }
}
report.status = toolError ? 'ERROR' : report.pairs.every(p => p.status === 'PASS') ? 'PASS' : 'FAIL';
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 1) + '\n');
console.log('PLAN', report.plan.path, report.plan.sha256);
for (const r of report.pairs) {
  console.log(`\n== ${r.baseId ?? '?'} -> ${r.slice}: ${r.status}  base SAL ${r.base?.sha256?.['TwinSafeGroup1.sal']?.slice(0, 8) ?? r.base} cand SAL ${r.candidate?.sha256?.['TwinSafeGroup1.sal']?.slice(0, 8) ?? r.candidate}`);
  if (r.error) { console.log('ERROR', r.error.split('\n')[0]); continue; }
  for (const c of r.checks) console.log(`  ${c.status.padEnd(4)} [${c.group}] ${c.name}`);
}
console.log(`\nE2-DELTA ${report.status}: ${report.pairs.map(r => `${r.slice}=${r.status}`).join(' ')}\nreport: ${outPath}`);
process.exitCode = toolError ? 2 : report.status === 'PASS' ? 0 : 1;
