import { loadSal, loadSgvl } from '../../src/native-delta-model.mjs';
import { nativeDiff } from '../../src/native-delta-diff.mjs';
const A = { sal: loadSal('../MEN001_Dyno/Safety_Dyno'), sgvl: loadSgvl('../MEN001_Dyno/Safety_Dyno') };
const B = { sal: loadSal('candidates/NIV-SAL/native'), sgvl: loadSgvl('candidates/NIV-SAL/native') };
const R = nativeDiff(A, B); const d = R.atoms; console.log("order changes", R.order.length);
const by = {}; for (const r of d) by[r.t] = (by[r.t]||0)+1;
console.log(JSON.stringify(by));
for (const r of d) if (!['block-added'].includes(r.t)) console.log(JSON.stringify(r).slice(0,400));
for (const r of d) if (r.t==='block-added') console.log(JSON.stringify(r));
