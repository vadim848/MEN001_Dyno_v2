// E2-G3 independent probe of surviving E2a mutants (v2-tester; not a G1 test, not a runner kill).
//  P18 (M-E2a-18, Network12/FBAnd6.AndIn2): R&D->Run by BOTH with in_HV_C2_FBK pinned FALSE (never ON) -> no Run at any time
//      (RUN-CONF: Run only after C2_FBK confirmation, question 68 "Б"; WDG-01 rollback itself is E6 and not asserted here).
//  P04 (M-E2a-04, Network3/FBOr13.OrIn2): Run->R&D by green 600 ms with C2_FBK held ON, in_ES_NC_1 FALSE 2 scans before C2_FBK
//      is released -> never two stages at once (E2-01 / MOD-006).
// usage: E2_SOURCE_ROOT=<root> node probe-survivors-e2a.mjs <label>
import * as L from '../snapshot/test/helpers/e2-lifecycle.js';
const out = {};
try { const x = L.cached('RnD'); x.hold = { in_HV_C2_FBK: false }; const p = x.t + 1; x.step(L.BOTH, 1100); x.step(L.OFF, 3000);
  out.P18 = { runAt: (x.log.find(s => s.t >= p && s.stages.includes('b_Step3'))?.t ?? null) && x.log.find(s => s.t >= p && s.stages.includes('b_Step3')).t - p, c2On: x.log.some(s => s.t >= p && s.out.out_HV_C2) }; } catch (e) { out.P18 = { error: e.message.slice(0, 160) }; }
try { const r = []; for (const d of [1, 2, 3]) { const x = L.cached('Run'); x.hold = { in_HV_C2_FBK: true }; x.step(L.GREEN, 600); x.step(L.OFF);
    const c2off = x.log.find(s => s.t > x.t - 601 && !s.out.out_HV_C2)?.t; while (x.t < (c2off ?? x.t) + 300) x.step();
    const rel = x.t + 1; const p = rel - d; // ES_NC_1 FALSE d scans before the C2_FBK release
    const y = L.cached('Run'); y.hold = { in_HV_C2_FBK: true }; y.step(L.GREEN, 600); y.step(L.OFF); while (y.t < p - 1) y.step(); y.step({ in_ES_NC_1: false }); while (y.t < rel - 1) y.step(); y.hold = {}; y.step({}, 3000);
    r.push({ d, multi: y.log.filter(s => s.stages.length > 1).slice(0, 2).map(s => s.t - rel + ':' + s.stages.join('+')) }); }
  out.P04 = r; } catch (e) { out.P04 = { error: e.message.slice(0, 200) }; }
console.log(JSON.stringify({ label: process.argv[2], out }));
