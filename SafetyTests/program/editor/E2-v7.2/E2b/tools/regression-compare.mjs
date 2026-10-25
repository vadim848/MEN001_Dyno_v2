// Compare two SOFTWARE_CHECK_RESULTS.json (baseline canonical vs candidate) per test name and per SAL case.
// node regression-compare.mjs <baseline.json> <candidate.json> <out.json>
import fs from 'node:fs';
const [A, B, OUT] = process.argv.slice(2);
const load = f => JSON.parse(fs.readFileSync(f, 'utf8'));
function parseTap(out) {
  const res = [], lines = out.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(ok|not ok) \d+ - (.*)$/); if (!m) continue;
    let loc = '', err = '';
    for (let j = i + 1; j < Math.min(lines.length, i + 60); j++) {
      const x = lines[j]; if (/^\s*(ok|not ok) \d+ - /.test(x) || /^\s*# Subtest/.test(x)) break;
      const lm = x.match(/location: '.*\\\\(test\\\\[^:']+)/); if (lm && !loc) loc = lm[1].replaceAll('\\\\', '/');
      if (/^\s*error: /.test(x) && !err) {const e = x.replace(/^\s*error: /, ''); err = e.startsWith('|') ? (lines[j + 1] || '').trim() + ' ' + (lines[j + 3] || '').trim() : e.trim(); err = err.replace(/file:\/\/\/\S+/g, '').slice(0, 220);}
    }
    res.push({ind: m[1].length, name: m[3], status: m[2] === 'ok' ? 'PASS' : 'FAIL', loc, err});
  }
  // file-level crash reasons: "# <stderr>" block preceding "# Subtest: test\\file"
  const crashes = {};
  const re = /((?:^# .*\n)+)# Subtest: (test\\\\[^\n]+)\nnot ok/gm; let m;
  while ((m = re.exec(out))) {const msg = m[1].split('\n').map(l => l.replace(/^# /, '')).filter(l => /Error|actual|expected|^\s*[+-] /.test(l)).slice(0, 6).join(' | ').replace(/file:\/\/\/\S+/g, ''); crashes[m[2].replaceAll('\\\\', '/')] = msg.slice(0, 400);}
  return {tests: res, crashes};
}
const stage = (r, n) => {const s = r.stages.find(x => x.name === n); return {status: s.status, counts: s.counts, files: s.files, ...(s.diagnostics ? parseTap(s.diagnostics.stdout) : {tests: null, crashes: {}})};};
const a = load(A), b = load(B);
const result = {baseline: {file: A, sha256: a.sha256, sgvl: a.sgvlSha256, summary: a.summary}, candidate: {file: B, sha256: b.sha256, sgvl: b.sgvlSha256, summary: b.summary}, stages: {}, cases: []};
for (const n of ['harness', 'historical', 'current']) {
  const x = stage(a, n), y = stage(b, n);
  const top = s => s.tests ? new Map(s.tests.filter(t => t.ind === 0 && !/^test[\\/]/.test(t.name)).map(t => [t.name, t])) : null;
  const ta = top(x), tb = top(y);
  const names = new Set([...(ta ? ta.keys() : []), ...(tb ? tb.keys() : [])]);
  const transitions = [];
  for (const nm of names) {
    const sa = ta ? (ta.get(nm)?.status ?? 'ABSENT') : 'PASS(stage)', sb = tb ? (tb.get(nm)?.status ?? 'ABSENT') : 'PASS(stage)';
    if (sa !== sb) transitions.push({name: nm, from: sa, to: sb, loc: tb?.get(nm)?.loc || ta?.get(nm)?.loc || '', err: tb?.get(nm)?.err || ''});
  }
  // tests that disappeared because their file crashed at load
  result.stages[n] = {baseline: {status: x.status, counts: x.counts}, candidate: {status: y.status, counts: y.counts}, fileCrashesCandidate: y.crashes, fileCrashesBaseline: x.crashes,
    transitionCounts: transitions.reduce((o, t) => {const k = `${t.from}->${t.to}`; o[k] = (o[k] ?? 0) + 1; return o;}, {}), transitions};
}
const ca = Object.fromEntries(a.cases.map(c => [c.id, c])), cb = Object.fromEntries(b.cases.map(c => [c.id, c]));
for (const id of new Set([...Object.keys(ca), ...Object.keys(cb)])) {const x = ca[id]?.status ?? 'ABSENT', y = cb[id]?.status ?? 'ABSENT'; if (x !== y) result.cases.push({id, from: x, to: y, candidate: cb[id] ? JSON.stringify(cb[id]).slice(0, 600) : null});}
fs.writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n');
for (const [n, s] of Object.entries(result.stages)) {
  console.log(`== ${n}: ${s.baseline.status} ${JSON.stringify(s.baseline.counts)} -> ${s.candidate.status} ${JSON.stringify(s.candidate.counts)} ${JSON.stringify(s.transitionCounts)}`);
  for (const [f, m] of Object.entries(s.fileCrashesCandidate)) if (!s.fileCrashesBaseline[f]) console.log('  file crash', f, '::', m.slice(0, 200));
  const g = {}; for (const t of s.transitions) {const k = `${t.from}->${t.to} ${t.loc.split(':')[0]} :: ${t.err.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, '<id>').slice(0, 110)}`; g[k] = (g[k] ?? 0) + 1;}
  for (const [k, v] of Object.entries(g).sort((p, q) => q[1] - p[1])) console.log(`  ${v} ${k}`);
}
console.log('== SAL cases', JSON.stringify(result.baseline.summary), '->', JSON.stringify(result.candidate.summary));
for (const c of result.cases) console.log(`  ${c.from}->${c.to} ${c.id}`);
