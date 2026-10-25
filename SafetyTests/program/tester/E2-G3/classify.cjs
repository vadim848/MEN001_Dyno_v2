// E2-G3 FAIL classifier (v2-tester). Input regression/matrix.json (statuses of every current test on every root).
// Classes: a = known and explained; b = superseded by Q76 (v9); c = blocked by G1 v8 N18/N19 (incl. TD-14 convention);
// d = unexplained / open; L = later slice (norm not yet in force for this candidate); S = structural pin (F1 identity /
// F1 subgraph, HANDOFF_v8 "не сделано" п.1), not behaviour. Rules are textual (names/errors), ordered; first match wins.
// usage: node classify.js <regression dir> <out json>
const fs = require('fs');
const [G, OUT] = process.argv.slice(2);
const X = JSON.parse(fs.readFileSync(G + '/matrix.json'));
const ROOTS = ['F1', 'R1', 'E2a', 'E2a-RC', 'E2b', 'E2c', 'E2d741', 'E2d'];
const LEVEL = { F1: 0, R1: 0.5, E2a: 1, 'E2a-RC': 1.5, E2b: 2, E2c: 3, E2d741: 4, E2d: 4 };
const SL = { E2a: 1, E2b: 2, E2c: 3, E2d: 4 };
const sliceOf = n => SL[(n.replace(/^DIAG \S+( \S+)*? (?=E2[a-d] )/, '').match(/^(E2[a-d]) /) || [])[1]];
const rules = [
  ['b', 'superseded by Q76 «Б», v9 (DOOR06 existing-PLC-levels в позитивном контроле)', (m, e, c) => c === 'E2d' && /existing-PLC-levels/.test(e)],
  ['a', 'TD-10 RED (L2-SU эталон in_Estop_PLC в SU: Discharge +7006 vs Run +7010) — вопрос 1 HANDOFF_v8', (m, e) => /L2-SU/.test(e)],
  ['a', 'HLT-03 SafetyFault/квитирование — knownFail E2c «HLT-03 SafetyFault until E5»', (m) => /HLT-03/.test(m.name)],
  ['a', 'FBK-10 k3/k4 (квитирование, Q-V7-04 «Б», TD-04) — knownFail E2d «until E5/E6» (D5-2)', (m) => /FBK10-K4|FBK-10 \((S1|S2|R)\) (k3|steady (Safe|R&D), C[12]_FBK TRUE for 1 scan)/.test(m.name)],
  ['a', 'FBK-06-W откат по окну WDG-01 — knownFail E2a-RC «window end without FBK -> rollback + SafetyFault — E6»', (m) => /FBK-06-W/.test(m.name)],
  ['S', 'F1 identity / F1 structural pin (V2ID, UNLOCK07 configuration, PLCPULSE producer role)', (m) => /^V2ID|^UNLOCK07 existing|PLCPULSE existing PLCproducer/.test(m.name)],
  ['L', 'DIS-HOLD / RUN-CONF timing: норма E2a-RC (PLAN E2a-core knownFail «E2a-RC timing until E2a-RC»)', (m, e, c) => c === 'E2a' && /DIS-HOLD|RUN-CONF/.test(m.name)],
  ['L', 'предусловие требует E3 (STP-G protective descent / STP-006, STP-I abort StartingRun; план E2c knownFail «STP-I until E3»)', (m, e) => /STP-G protective descent|STP-006 abort|IL-05d\(1\)/.test(m.name) && /precondition/.test(e)],
  ['a', 'FBK-10 K3-ACK (BOTH только квитирует) — knownFail E2d «FBK-10 k3/k4 until E5/E6»', (m) => /K3-ACK/.test(m.name)],
  ['S', 'F1 identity pin (structural)', (m, e) => /F1 identity pin/.test(e)],
  ['S', 'F1-subgraph pin not rewritten (HANDOFF_v8 не сделано п.1: plc-pulse/R3PAIR/safe-run-gestures/SAFEINPUT/hv/step12/MENTEE legacy-Network5/EARLYSTO/f1-lock/rnd-down)', (m, e) => !/^current-e2/.test(m.file) && /Undeclared source cut|preparation failed|other old producer inactive|real upstream producer|legacy-Network5|reading 'outputs'|R3PAIR|GATE_001|SAFEINPUT|actual old BOTH|MENTEE05 original|RNDCOMPACT|LV254/.test(m.name + ' ' + e)],
  ['b', 'superseded by Q76 «Б», v9 (DOOR06 existing-PLC-levels)', (m) => /existing-PLC-levels/.test(m.name)],
  ['a', 'EARLYSTO DIS-HOLD known FAIL (норма 73 «А», как в v7/v8)', (m, e, c) => /^EARLYSTO/.test(m.name) && m.st.F1 && m.st.F1.startsWith('FAIL')],
  ['a', 'rnd-down D-ARCH-POL known FAIL (как в v8)', (m, e, c) => /rnd-down/.test(m.file) && m.st.F1 && m.st.F1.startsWith('FAIL')],
  ['a', 'D-E2d-1 / V14-Q7 (MENTEE05/step12 Step12 NC) — норма E2d', (m, e, c) => /Step12|paired real producer/.test(m.name) && /mentee|step12/.test(m.file) && LEVEL[c] < 4],
  ['c', 'blocked by G1 v8 N18 (REL01-e2-LATE R&D, a по b_Step3)', (m) => /REL01-e2-LATE R&D/.test(m.name)],
  ['c', 'blocked by G1 v8 N19 / TD-14 (FBK-05, STP-I: StartingRun как «не R&D»)', (m) => /FBK-05|STP-I\b/.test(m.name)],
  ['c', 'blocked by G1 v8 N19 / TD-14 §1.4 S2 (B51-01 SAFE-NOENERGY: Safe→R&D = Safe с C1 ON допустимо)', (m, e) => /B51-01/.test(m.name) && /SAFE-NOENERGY/.test(e)],
  ['a', 'K-2 / K-2b (WDG-02, MOD-001, CVR-001) — known candidate defect E2c, fixed in E2d v7.6 (V76-D)', (m, e, c) => ['E2c', 'E2d741', 'E2d'].includes(c) && (/FBK-06-(NEG|POS)/.test(m.name) || (m.st.E2b === 'PASS' && /LV Faulty|LV Healthy|in_LV_Faulty/.test(m.name + e) && /Safe->R&D|from Safe|C1 ON/.test(m.name + e)))],
  ['b', 'superseded by Q76 «Б», v9 (FBK10-PLC-B / FBK10-PLC-REG(2) / KF-5 / KF-3-DESC (1,1) / FFS legacy (1,1) и прочие маршруты (1,1))', (m, e, c) => /FBK10-PLC-B|FBK10-PLC-REG steady R&D|KF-5|KF-3-DESC|FFS .*legacy|legacy.*\(1,1\)|\(1,1\)/.test(m.name) && LEVEL[c] >= 4 && c === 'E2d'],
  ['a', 'known FAIL KF-1…KF-4 (план E2d knownFail / G1 v7–v8 §3; до E4/E5/E6)', (m) => m.kf],
  ['a', 'ES06-01/BOOT-C held legacy level — coincides with KF-3 until E4 (имя теста)', (m) => /coincides with known FAIL KF-3/.test(m.name)],
  ['a', 'EMG-RD-L / Run-down: честный RED до E3 (E2-v73-q §1.4; HANDOFF_v8)', (m, e) => /EMG-RD-L|Run-down|rd-sweep|rundown|IL-05d\(3\)/.test(m.name + ' ' + m.file + ' ' + e)],
  ['a', 'TD-10 RED (L1-SU / IL-05a-A +7006 vs +7010) — вопросы 1–2 HANDOFF_v8 аналитику', (m, e) => /L1-SU|IL-05a-A/.test(m.name + ' ' + e)],
  ['a', 'E2a-RC knownFail: потеря FBK после окна → Emergency (Q-RC-19) — до E6', (m) => /RC-7|FBK-01 \(v7/.test(m.name)],
  ['a', 'E2a-core knownFail: Emergency/energy outside Run — до E2b', (m, e, c) => ['E2a', 'E2a-RC'].includes(c) && /EMGREF|EMG4|EMG6-01|E2-01 one stage|connector|in_ES_NC|in_Mentee|Emergency/.test(m.name)],
  ['L', 'норма более позднего среза (по префиксу/плану)', (m, e, c) => { const s = sliceOf(m.name); return s != null && s > Math.floor(LEVEL[c]); }],
  ['L', 'E2-02 LV Healthy lost → R&D→Safe: HLT-001, норма E2c', (m, e, c) => /E2-02 LV Healthy lost/.test(m.name) && LEVEL[c] < 3],
  ['L', 'REL01-e2 control V14-Q7 — норма E2d', (m, e, c) => /REL01-e2 control.*V14-Q7|V14-Q7/.test(m.name) && LEVEL[c] < 4],
  ['L', 'R&D/Run путь недостижим на F1/R1 (покрытие, D-ARCH-POL)', (m, e, c) => LEVEL[c] < 1 && /precondition not reached|unreachable|stages=b_Step12/.test(e)],
  ['d', 'DIS-HOLD: стимул Restart на e+6100 до конца цепочки (S6 на e+8006 на E2b/E2d, проба independent/probe-emg-rnd-chain.mjs) — вероятно стимул теста, v9; не доказанный дефект', (m, e) => /DIS-HOLD/.test(m.name) && /Safe after Restart/.test(e)],
  ['d', 'B43-02: stand precondition «chain complete … before the Restart press» не достигнут', (m, e) => /B43-02/.test(m.name) && /stand precondition/.test(e)],
  ['a', 'K-1: принятие жеста при эпизоде [f−300, f+10) (REL01-e2) — fixed in E2d v7.6; на E2b присутствует тоже', (m, e, c) => /REL01-e2 .*\[f-300, f\+10\)/.test(m.name)],
  ['d', 'L2/L3 timing −1/+2 scan (EMGREF R&D/Safe→R&D L2 C1 +2004 vs +2005; Run L3 Discharge +7010 vs ref +7008)', (m, e) => /L[23] Del/.test(e)],
];
const out = {};
for (const c of ROOTS) {
  const rows = [];
  for (const m of X) {
    const s = m.st[c] || ''; if (!s.startsWith('FAIL')) continue;
    const e = m.err[c] || '';
    let cls = s.endsWith('-ERR') ? ['a', 'ERROR stand (TD-08/09 маркер; классификатор m-24)'] : null;
    if (!cls) for (const [k, lab, f] of rules) if (f(m, e, c)) { cls = [k, lab]; break; }
    if (!cls) cls = ['d', 'unexplained'];
    rows.push({ name: m.name, file: m.file, cls: cls[0], label: cls[1], error: e.slice(0, 220), trend: ROOTS.map(r => (m.st[r] || '-')[0]).join('') });
  }
  const sum = {}; for (const r of rows) { const k = r.cls + ' | ' + r.label; sum[k] = (sum[k] || 0) + 1; }
  out[c] = { counts: Object.fromEntries(['a', 'b', 'c', 'd', 'L', 'S'].map(k => [k, rows.filter(r => r.cls === k).length])), byLabel: sum, rows };
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
for (const c of ROOTS) console.log(c, JSON.stringify(out[c].counts));
