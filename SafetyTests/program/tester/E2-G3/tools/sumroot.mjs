// usage: node sumroot.mjs <SOFTWARE_CHECK_RESULTS.json> <out.jsonl> <out.current.tap>
import fs from 'node:fs';
const [,, src, out, tapOut] = process.argv;
const r = JSON.parse(fs.readFileSync(src, 'utf8'));
const KF = /^(DIAG \[[^\]]*\] )*KF-/;
const rows = [];
for (const st of r.stages) {
  const stdout = st.diagnostics?.stdout;
  if (!stdout) { for (const t of st.tests ?? []) rows.push({ stage: st.name, name: t.name ?? t, status: t.status ?? 'PASS?' }); continue; }
  if (st.name === 'current' && tapOut) fs.writeFileSync(tapOut, stdout);
  const lines = stdout.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(not ok|ok) (\d+) - (.*)$/); if (!m) continue;
    let name = m[3], dir = null; const d = name.match(/^(.*?) # (TODO|SKIP)\b.*$/); if (d) { name = d[1]; dir = d[2]; }
    let error = '', loc = '';
    for (let j = i + 1; j < Math.min(lines.length, i + 60); j++) {
      if (/^(not ok|ok) \d+ - /.test(lines[j])) break;
      const l = lines[j].match(/^\s+location: '(.*)'$/); if (l && !loc) loc = l[1].replace(/\\/g, '/').replace(/^.*\/test\//, '').replace(/:\d+:\d+$/, '');
      if (m[1] === 'not ok' && !error) { const e = lines[j].match(/^\s+error: (.*)$/); if (e) { error = e[1] === '|-' ? (lines[j + 1] ?? '').trim() : e[1].replace(/^'|'$/g, ''); const plus = lines.slice(j + 2, j + 10).find(x => /^\s+\+\s+'/.test(x)); if (plus) error += ' :: ' + plus.trim(); } }
    }
    const status = dir === 'SKIP' ? 'SKIP' : dir === 'TODO' ? (m[1] === 'ok' ? 'NV' : 'FAIL-TODO') : (m[1] === 'ok' ? 'PASS' : 'FAIL');
    rows.push({ stage: st.name, file: loc, status, stand: status === 'FAIL' && /ERROR (stand|precondition)/.test(error), diag: /^(DIAG |E2-STAND )/.test(name) && !KF.test(name), kf: KF.test(name), name, error: error.slice(0, 400) });
  }
}
fs.writeFileSync(out, rows.map(x => JSON.stringify(x)).join('\n') + '\n');
const cnt = {}; for (const x of rows) { const k = x.stage + ':' + x.status; cnt[k] = (cnt[k] || 0) + 1; }
console.log(JSON.stringify({ sal: r.modelSourceSha256 ?? r.sha256, cnt, summary: r.summary }));
