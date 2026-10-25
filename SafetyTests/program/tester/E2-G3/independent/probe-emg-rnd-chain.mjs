// E2-G3 diagnostic probe (not an oracle): steady R&D, in_ES_NC_1 FALSE 100 ms; when is the chain end (b_Step6, energy off, FBK off)?
import * as L from '../snapshot/test/helpers/e2-lifecycle.js';
const x = L.cached('RnD'); const e = x.t + 1; x.step({ in_ES_NC_1: false }, 100); x.step({ in_ES_NC_1: true }, 15000);
const s6 = x.log.find(s => s.t >= e && s.stages.includes('b_Step6'))?.t;
const off = x.log.find(s => s.t >= e && L.ENERGY.every(k => !s.out[k]) && !s.c1fbk && !s.c2fbk)?.t;
const y = L.cached('RnD'); y.step({ in_ES_NC_1: false }, 100); y.step({ in_ES_NC_1: true }, 6000); L.restart(y); y.step({}, 3000);
console.log(JSON.stringify({ src: process.env.E2_SOURCE_ROOT?.slice(-6), S6: s6 == null ? null : s6 - e, energyOff: off == null ? null : off - e, restartAt6100: y.stageSet(), status: y.statusSet() }));
