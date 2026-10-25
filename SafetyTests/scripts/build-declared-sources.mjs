// Explicit maintenance (stand E2-stand-g3, 2026-10-23), never called by checks at run time.
// Builds fixtures/declared-sources/E2_DECLARED_SOURCES.json: the SAL/SGVL/diagram identities that the
// architect's PLAN(s) declare for the F1 base, the E2 chain candidates and the frozen E2d builds, plus
//  - the BOOT full-source inventory digest of each declared candidate (src/boot-preflight.js accepts a
//    candidate root only if its files and inventory equal this record; F1 keeps BOOT_PREFLIGHT_SOURCE_MANIFEST),
//  - the STATE grant norm of the source lineage (src/state-grant-norms.js), taken from PLAN slices, not from the SAL.
// SHAs are read only from PLAN.source (sal/sgvl/diagram, r1Candidate, e2aCoreCandidate, e2aRcCandidate,
// candidates.*, candidatesE2dFiles, frozenMutantSources.*). Files are located under candidates/** by SAL SHA and
// every declared SHA (full or prefix) must match the located files, else the build fails.
// Usage: node scripts/build-declared-sources.mjs --plan <PLAN.json> [--plan <PLAN.json>]...
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseSalFile } from '../src/sal-parser.js';
import { inventoryBootSource } from '../src/boot-source-inventory.js';

const standRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const plans = args.flatMap((a, i) => a === '--plan' ? [path.resolve(args[i + 1])] : []);
if (!plans.length) { console.error('usage: node scripts/build-declared-sources.mjs --plan <PLAN.json> [--plan ...]'); process.exit(64); }
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
const lf = b => b.toString('utf8').replaceAll('\r\n', '\n');
const sha64 = v => typeof v === 'string' ? v.match(/[0-9a-f]{64}/)?.[0] : undefined;
const prefix = (v, label) => typeof v === 'string' ? v.match(new RegExp(label + ' ([0-9a-f]{8,})'))?.[1] : undefined;

// STATE grant norm per lineage (src/state-grant-norms.js). Citations are PLAN fields, verified below to exist.
const NORM = {
  F1: { norm: 'F1', cite: 'canonical F1: original STATE injection points (b_Step1_Set, b_Step3_Set_3, b_Step1_Set_2 present)' },
  R1: { norm: 'R1', cite: 'slices[R1] (Q-ARCH-06 A): Network4/Network5/Step2 removed; F1 grants otherwise unchanged (b_Step12_Set_2 -> FBRs8)' },
  'E2a-core': { norm: 'E2a', cite: 'slices[E2a-core].changes: FBOr16.OrIn1 := b_Step_RnD_Set; FBRs7.Set := wire FBOr16 (g6 S3->SR); mechanism.grants g1..g9; no g10' },
  'E2a-RC': { norm: 'E2a', cite: 'as E2a-core (Network3 unchanged by E2a-RC)' },
  E2b: { norm: 'E2b', cite: 'slices[E2b].newBlocks: Network3/G10_EXIT (g10 S6->S1), Network3/FBAndBootFbkOff (FBAnd1.AndIn3), Network3/FBOrS12Reset' },
  E2c: { norm: 'E2b', cite: 'E2b Network3 grants (E2c changes SafeResumption/RndPhysicalCompact only)' },
  E2d: { norm: 'E2b', cite: 'E2b Network3 grants (E2d changes Network12/RndPhysicalCompact/Network11)' }
};
const normFor = id => NORM[id] ?? (id.startsWith('E2d-') ? NORM.E2d : undefined);

const declared = new Map(); // id -> { sal, sgvl?, diagram?, sgvlPrefix?, diagramPrefix?, declaredIn: [] }
const note = (id, rec, where) => {
  const cur = declared.get(id) ?? { declaredIn: [] };
  for (const k of ['sal', 'sgvl', 'diagram', 'sgvlPrefix', 'diagramPrefix']) if (rec[k]) {
    if (cur[k] && cur[k] !== rec[k]) throw Error(`${id}: plans declare different ${k} (${cur[k]} vs ${rec[k]})`);
    cur[k] = rec[k];
  }
  cur.declaredIn.push(where); declared.set(id, cur);
};
const planInfo = [];
for (const file of plans) {
  const bytes = fs.readFileSync(file), plan = JSON.parse(bytes), s = plan.source ?? {};
  const pid = `${path.relative(standRoot, file).replace(/\\/g, '/')}@${digest(bytes).slice(0, 12)}`;
  planInfo.push({ path: path.relative(standRoot, file).replace(/\\/g, '/'), sha256: digest(bytes), planVersion: plan.planVersion });
  note('F1', { sal: s.sal, sgvl: s.sgvl, diagram: s.diagram }, `${pid} source.sal/sgvl/diagram`);
  if (s.r1Candidate) note('R1', { sal: sha64(s.r1Candidate) }, `${pid} source.r1Candidate`);
  if (s.e2aCoreCandidate) note('E2a-core', { sal: sha64(s.e2aCoreCandidate) }, `${pid} source.e2aCoreCandidate`);
  if (s.e2aRcCandidate) note('E2a-RC', { sal: sha64(s.e2aRcCandidate) }, `${pid} source.e2aRcCandidate`);
  for (const [id, v] of Object.entries(s.candidates ?? {})) {
    const files = id === 'E2d' && s.candidatesE2dFiles ? { sgvl: s.candidatesE2dFiles.sgvl, diagram: s.candidatesE2dFiles.diagram } : {};
    // The E2d chain candidate of one plan becomes the frozen E2d-v7.7 of the next: same identity, one record.
    const sal = sha64(v), frozenAs = Object.entries(s.frozenMutantSources ?? {}).find(([, f]) => sha64(f) === sal)?.[0];
    note(frozenAs ?? (id === 'E2d' ? `E2d@${sal.slice(0, 8)}` : id), { sal, ...files }, `${pid} source.candidates.${id}${id === 'E2d' ? ' + candidatesE2dFiles' : ''}`);
  }
  for (const [id, v] of Object.entries(s.frozenMutantSources ?? {}))
    note(id, { sal: sha64(v), sgvlPrefix: prefix(v, 'SGVL'), diagramPrefix: prefix(v, 'diagram') }, `${pid} source.frozenMutantSources.${id}`);
  for (const sl of ['R1', 'E2a-core', 'E2b']) if (!plan.slices?.some(x => x.id === sl)) throw Error(`${pid}: slices[${sl}] missing (norm citation)`);
}
// E2d chain candidate of a plan that is also listed as frozen E2d-v7.7 in a later plan: merge.
for (const [id, rec] of [...declared]) if (id.startsWith('E2d@')) {
  const same = [...declared].find(([k, r]) => k !== id && r.sal === rec.sal);
  if (same) { const [k, r] = same; for (const f of ['sgvl', 'diagram']) if (rec[f]) r[f] = rec[f]; r.declaredIn.push(...rec.declaredIn); declared.delete(id); }
}

// Locate files by SAL SHA under candidates/*/native (and canonical for F1).
const roots = fs.readdirSync(path.join(standRoot, 'candidates')).map(d => path.join(standRoot, 'candidates', d, 'native')).filter(d => fs.existsSync(path.join(d, 'TwinSafeGroup1.sal')));
const bySal = new Map();
for (const d of roots) { const s = digest(fs.readFileSync(path.join(d, 'TwinSafeGroup1.sal'))); if (!bySal.has(s)) bySal.set(s, []); bySal.get(s).push(d); }
const runtimeNormalized = digest(lf(fs.readFileSync(path.join(standRoot, 'src/sal-runtime.js'))));
const sources = [];
for (const [id, rec] of declared) {
  const dirs = bySal.get(rec.sal) ?? [];
  if (!dirs.length) throw Error(`${id}: no candidates/*/native with declared SAL ${rec.sal}`);
  const dir = dirs[0], read = f => fs.readFileSync(path.join(dir, f));
  const salB = read('TwinSafeGroup1.sal'), sgvlB = read('GVL1.sgvl'), diaB = read('TwinSafeGroup1.sal.diagram');
  const raw = { sal: digest(salB), sgvl: digest(sgvlB), diagram: digest(diaB) };
  for (const f of ['sgvl', 'diagram']) {
    if (rec[f] && rec[f] !== raw[f]) throw Error(`${id}: ${f} ${raw[f]} != declared ${rec[f]}`);
    if (rec[f + 'Prefix'] && !raw[f].startsWith(rec[f + 'Prefix'])) throw Error(`${id}: ${f} ${raw[f]} != declared prefix ${rec[f + 'Prefix']}`);
  }
  const n = normFor(id); if (!n) throw Error(`${id}: no STATE norm lineage`);
  const model = parseSalFile(path.join(dir, 'TwinSafeGroup1.sal'), { bindingMode: 'current', sgvlPath: path.join(dir, 'GVL1.sgvl') });
  const inventory = inventoryBootSource(model, salB.toString('utf8'), sgvlB.toString('utf8'));
  sources.push({ id, location: dirs.map(d => path.relative(standRoot, d).replace(/\\/g, '/')),
    rawSha256: raw, normalizedSha256: { sal: digest(lf(salB)), sgvl: digest(lf(sgvlB)) },
    declared: { sal: 'full', sgvl: rec.sgvl ? 'full' : rec.sgvlPrefix ? 'prefix' : 'not declared by PLAN (measured)', diagram: rec.diagram ? 'full' : rec.diagramPrefix ? 'prefix' : 'not declared by PLAN (measured)' },
    declaredIn: rec.declaredIn, stateNorm: n.norm, stateNormCitation: n.cite,
    boot: id === 'F1' ? { manifest: 'BOOT_PREFLIGHT_SOURCE_MANIFEST.json (reviewed checkpoint 0391fae, unchanged)' }
      : { inventorySha256: digest(JSON.stringify(inventory)), blocks: inventory.blocks.length, networks: inventory.networks.length, runtimeNormalizedSha256: runtimeNormalized } });
}
const order = ['F1', 'R1', 'E2a-core', 'E2a-RC', 'E2b', 'E2c', 'E2d-v7.4.1', 'E2d-v7.5', 'E2d-v7.6', 'E2d-v7.7'];
sources.sort((a, b) => (order.indexOf(a.id) + 1 || 99) - (order.indexOf(b.id) + 1 || 99));
const out = { schema: 'declared-sources-v1', generatedBy: 'SafetyTests/scripts/build-declared-sources.mjs', plans: planInfo,
  note: 'Run-time checks read only this file (no PLAN, no git). A source is identified by its SAL SHA; SGVL/diagram must equal the record. F1 BOOT stays on BOOT_PREFLIGHT_SOURCE_MANIFEST.json.',
  sources };
const target = path.join(standRoot, 'fixtures/declared-sources/E2_DECLARED_SOURCES.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out, null, 1) + '\n');
console.log(`declared sources: ${sources.map(s => `${s.id}=${s.rawSha256.sal.slice(0, 8)}(${s.stateNorm})`).join(' ')}\n-> ${path.relative(standRoot, target)}`);
