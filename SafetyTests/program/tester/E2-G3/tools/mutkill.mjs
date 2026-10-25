// G3 targeted mutation kill harness (v2-tester E2-G3). Same kill rule as scripts/sal-mutation-check.js
// (src/sal-mutation-kill.js failureClass): a test that is ok on the UNMUTATED candidate (regression run)
// and not ok with ERR_ASSERTION on the mutant kills, if its name matches the plan behaviouralTests and is
// not excluded from the kill base. Mutations are applied/verified by the snapshot src/sal-mutations.js.
// Difference from the stand runner: tests are run one per process (--test-name-pattern) in relevance order,
// and a mutant stops after the first batch containing a kill (early stop). A SURVIVED verdict means the
// complete eligible kill base was executed on the mutant.
// usage: node mutkill.mjs --root <candidate root> --plan <plan json> --base <regression jsonl> --map <test-file-map.json>
//        --out <dir> [--ids a,b] [--lanes 3] [--par 5] [--exclude <json of regex strings>] [--hints <json id->[regex]>]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const root = path.resolve(opt('--root')), planPath = path.resolve(opt('--plan')), out = path.resolve(opt('--out'));
const snap = path.resolve(opt('--snap'));
const { applyMutation, verifyMutation, operatorNames } = await import('file:///' + snap.replace(/\\/g, '/') + '/src/sal-mutations.js');
const { parseTap } = await import('file:///' + snap.replace(/\\/g, '/') + '/src/stand-sandbox.js');
const { failureClass } = await import('file:///' + snap.replace(/\\/g, '/') + '/src/sal-mutation-kill.js');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const base = fs.readFileSync(opt('--base'), 'utf8').trim().split('\n').map(JSON.parse).filter(r => r.stage === 'current');
const fmap = JSON.parse(fs.readFileSync(opt('--map'), 'utf8'));
const lanes = +(opt('--lanes') ?? 3), par = +(opt('--par') ?? 5);
const excl = (opt('--exclude') ? JSON.parse(fs.readFileSync(opt('--exclude'), 'utf8')) : []).map(s => new RegExp(s));
const incl = (opt("--include") ? JSON.parse(fs.readFileSync(opt("--include"), "utf8")) : null)?.map(x => new RegExp(x));
const hints = opt('--hints') ? JSON.parse(fs.readFileSync(opt('--hints'), 'utf8')) : {};
const ids = opt('--ids')?.split(',');
const behav = plan.behaviouralTests.map(s => new RegExp(s));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const SAL = 'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal', SGVL = 'MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl';
const original = fs.readFileSync(path.join(root, SAL), 'utf8'), sgvlXml = fs.readFileSync(path.join(root, SGVL), 'utf8');
const sourceSha = sha(fs.readFileSync(path.join(root, SAL)));
if (plan.sourceSha256 && plan.sourceSha256 !== sourceSha) { console.error(`plan targets ${plan.sourceSha256}, root has ${sourceSha}`); process.exit(3); }
fs.mkdirSync(out, { recursive: true });
const eligibleAll = base.filter(r => (r.status === 'PASS' || r.status === 'NV') && !r.diag && !r.kf && behav.some(rx => rx.test(r.name)));
const excluded = eligibleAll.filter(r => excl.some(rx => rx.test(r.name)));
const eligible = eligibleAll.filter(r => !excl.some(rx => rx.test(r.name)) && (!incl || incl.some(rx => rx.test(r.name))));
console.log(`source ${sourceSha.slice(0, 12)} eligible kill base ${eligible.length} (excluded ${excluded.length})`);
const esc = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
const STOP = new Set('the a an of and or in to with by on at no not is be from for as then'.split(' '));
const toks = s => new Set(String(s).toLowerCase().split(/[^a-z0-9&+-]+/).filter(w => w.length > 1 && !STOP.has(w)));
function rank(m) {
  const mt = toks([m.killingScenario, m.oracle, m.rationale, m.guard].join(' '));
  const hr = (hints[m.id] ?? []).map(s => new RegExp(s));
  return eligible.map(r => { const nt = toks(r.name); let s = 0; for (const w of nt) if (mt.has(w)) s++; if (hr.some(rx => rx.test(r.name))) s += 1000; return { r, s }; })
    .sort((a, b) => b.s - a.s).map(x => x.r);
}
function runOne(dir, r) {
  const file = fmap[r.name]?.[0]; if (!file) return Promise.resolve({ name: r.name, status: 'nofile' });
  return new Promise(resolve => {
    const child = spawn(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=^${esc(r.name)}$`, `test/${file}`], { cwd: path.join(dir, 'SafetyTests'), env: (({ NODE_TEST_CONTEXT, ...e }) => ({ ...e, NODE_OPTIONS: '' }))(process.env), windowsHide: true });
    let so = ''; const timer = setTimeout(() => child.kill(), 900000);
    child.stdout.on('data', d => so += d); child.stderr.on('data', () => {});
    child.on('close', () => { clearTimeout(timer); const tap = parseTap(so); const res = tap.results.find(x => x.name === r.name);
      resolve({ name: r.name, file, status: res ? res.status : 'absent', cls: res ? failureClass({ ...res }) : 'absent', message: res?.message ?? '', fileLevel: tap.results.filter(x => x.name !== r.name && x.status === 'fail').map(x => x.name) }); });
  });
}
const known = new Set(operatorNames());
const muts = plan.mutations.filter(m => !ids || ids.includes(m.id));
const results = []; let next = 0;
async function lane(k) {
  const dir = path.join(out, 'lane' + k);
  if (!fs.existsSync(dir)) fs.cpSync(root, dir, { recursive: true });
  while (next < muts.length) {
    const m = muts[next++]; const row = { id: m.id, op: m.op, block: m.block, port: m.port, value: m.value };
    if (!known.has(m.op)) { row.verdict = 'NOT-RUN'; row.reason = `operator ${m.op} not implemented by the stand`; results.push(row); console.log(`NOT-RUN ${m.id}`); continue; }
    try {
      const { xml, change, sgvl } = applyMutation(original, m, { sgvlXml });
      row.verification = verifyMutation(original, xml, change, { sgvlXml, mutantSgvlXml: sgvl });
      row.mutantSha256 = sha(Buffer.from(xml, 'utf8'));
      fs.writeFileSync(path.join(dir, SAL), xml); if (sgvl !== undefined) fs.writeFileSync(path.join(dir, SGVL), sgvl);
      const order = rank(m); row.ran = []; row.killedBy = []; row.nonKill = [];
      for (let i = 0; i < order.length && !row.killedBy.length; i += par) {
        const batch = await Promise.all(order.slice(i, i + par).map(r => runOne(dir, r)));
        for (const b of batch) { row.ran.push(b.name);
          if (b.cls === 'assertion' && !b.fileLevel.length) row.killedBy.push({ name: b.name, file: b.file, message: b.message.slice(0, 300) });
          else if (b.status !== 'pass') row.nonKill.push({ name: b.name, status: b.status, cls: b.cls, message: b.message.slice(0, 200) }); }
      }
      row.verdict = row.killedBy.length ? 'KILLED' : row.nonKill.length ? 'STRUCTURAL-ONLY' : 'SURVIVED';
      row.ranCount = row.ran.length; row.eligible = order.length; delete row.ran;
    } catch (e) { row.verdict = 'INVALID'; row.error = e.message; }
    finally { fs.writeFileSync(path.join(dir, SAL), original); fs.writeFileSync(path.join(dir, SGVL), sgvlXml); }
    results.push(row);
    console.log(`${row.verdict.padEnd(15)} ${m.id} ${m.op} ${m.block}/${m.port ?? ''} ${row.killedBy?.length ? '<- ' + row.killedBy[0].name.slice(0, 120) : row.error ?? ''} (ran ${row.ranCount ?? 0}/${row.eligible ?? 0})`);
    fs.writeFileSync(path.join(out, 'partial.json'), JSON.stringify(results, null, 1));
  }
}
await Promise.all(Array.from({ length: Math.min(lanes, muts.length) }, (_, k) => lane(k)));
const rep = { generatedAt: new Date().toISOString(), tool: 'scratchpad/tools/mutkill.mjs (v2-tester E2-G3)', plan: planPath, planSha256: sha(fs.readFileSync(planPath)), sourceSha256: sourceSha,
  killBase: { eligible: eligible.length, excluded: excluded.map(r => r.name), excludeRegex: excl.map(String) }, behaviouralTests: plan.behaviouralTests,
  summary: Object.fromEntries(['KILLED', 'SURVIVED', 'STRUCTURAL-ONLY', 'INVALID', 'NOT-RUN'].map(v => [v, results.filter(r => r.verdict === v).length])), results };
fs.writeFileSync(path.join(out, 'mutkill-report.json'), JSON.stringify(rep, null, 1) + '\n');
for (let k = 0; k < lanes; k++) fs.rmSync(path.join(out, 'lane' + k), { recursive: true, force: true });
console.log(JSON.stringify(rep.summary));
