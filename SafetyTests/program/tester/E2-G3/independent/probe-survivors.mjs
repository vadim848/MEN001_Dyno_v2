// E2-G3 independent probe of surviving mutants (v2-tester; NOT a G1 test, not a kill under the runner rule).
// Runs the same input sequence on the unmutated candidate and on the mutant and prints observable differences.
// Expectations are from requirements (EMG6-01 / V14-Q6 / Q-ARCH-01 / SPEC §12 / B4-3), not from the candidate:
//  S16 (G10_EXIT.AndIn2): Restart while in_ES_NC_1 still FALSE -> stays Emergency (EMG6-01: exit only after the cause is removed).
//  S19 (G10_EXIT.AndIn5): Restart while in_LV_C1_FBK stuck TRUE -> stays Emergency (SPEC §12, EMG6-01 end state: C1/C2_FBK OFF).
//  S22 (G10_EXIT.AndIn1): Restart during the chain (C1 already OFF, +2500 ms) -> never Safe together with a chain stage; no early Safe.
//  S17 (G10_EXIT.AndIn3): early Restart during the chain, then green held 300 ms at S6 -> no Safe during the hold (exit on release, A9).
//  S41 (FBAndBootFbkOff.AndIn3): boot with C1_FBK ON, Restart, FBK OFF, then green held 300 ms -> no Safe during the press.
// usage: E2_SOURCE_ROOT=<root> node probe-survivors.mjs <label>
import * as L from '../snapshot/test/helpers/e2-lifecycle.js';
const out = {};
const tr = (x, from) => x.log.filter(s => s.t >= from);
const firstSafe = (seg) => seg.find(s => s.stages.join() === 'b_Step1' && L.statusIs({ statusMissing: [], statusSet: () => s.statuses }, 'STS_SAFE'))?.t;
function sc(name, f) { try { out[name] = f(); } catch (e) { out[name] = { error: e.message.slice(0, 160) }; } }
sc('S16 Restart with ES_NC_1 still FALSE', () => { const x = L.cached('RnD'); const e = x.t + 1; x.step({ in_ES_NC_1: false }, 12000); const r = x.t + 1; L.restart(x); x.step({}, 2000);
  const seg = tr(x, r); return { exitAt: firstSafe(seg) == null ? null : firstSafe(seg) - r, emgAll: seg.every(L.isEmg), stagesEnd: x.stageSet() }; });
sc('S19 Restart with C1_FBK stuck ON', () => { const x = L.cached('RnD'); x.hold = { in_LV_C1_FBK: true }; x.step({ in_ES_NC_1: false }, 100); x.step({ in_ES_NC_1: true }, 12000); const r = x.t + 1; L.restart(x); x.step({}, 2000);
  const seg = tr(x, r); return { exitAt: firstSafe(seg) == null ? null : firstSafe(seg) - r, emgAll: seg.every(L.isEmg), stagesEnd: x.stageSet() }; });
sc('S22 Restart at +2500 during the chain', () => { const x = L.cached('RnD'); const e = x.t + 1; x.step({ in_ES_NC_1: false }, 100); x.step({ in_ES_NC_1: true }, 2400); const r = x.t + 1; L.restart(x); x.step({}, 12000);
  const seg = tr(x, r); return { multiStage: seg.filter(s => s.stages.length > 1).map(s => s.t - r + ':' + s.stages.join('+')).slice(0, 3), exitAt: firstSafe(seg) == null ? null : firstSafe(seg) - r, stagesEnd: x.stageSet() }; });
sc('S17 early Restart, then green held 300 ms at S6', () => { const x = L.cached('RnD'); const e = x.t + 1; x.step({ in_ES_NC_1: false }, 100); x.step({ in_ES_NC_1: true }, 1000); L.restart(x); x.step({}, 11000);
  const p = x.t + 1; x.step(L.GREEN, 300); const rel = x.t + 1; x.step(L.OFF, 1000); const seg = tr(x, p); const s = firstSafe(seg); return { safeAt: s == null ? null : s - p, releaseAt: rel - p, safeDuringHold: s != null && s < rel }; });
sc('S41 boot with C1_FBK ON, Restart, FBK OFF, green held 300 ms', () => { const x = L.create(); x.hold = { in_LV_C1_FBK: true }; x.step({}, 10); L.restart(x, 300); x.step({}, 500); x.hold = {}; x.step({}, 2500);
  const p = x.t + 1; x.step(L.GREEN, 300); const rel = x.t + 1; x.step(L.OFF, 1000); const seg = tr(x, p); const s = firstSafe(seg); return { safeAt: s == null ? null : s - p, releaseAt: rel - p, safeDuringHold: s != null && s < rel }; });
console.log(JSON.stringify({ label: process.argv[2], out }));
