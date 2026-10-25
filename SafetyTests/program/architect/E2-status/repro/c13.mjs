// L3 (G3Q-2): steady Run, in_Estop_PLC TRUE at e; first scans of Del outputs per candidate. k = scan index relative to e (input seen in scan e).
import { cand, toRnd } from './cand.mjs';
const OFF = { in_Reset_PB: false, in_Relase_Door_PB: false };
const SIG = { EOk: 'b_EStop_Ok', EStat: 'out_EStop_Status', S3: 'b_Step3', S4: 'b_Step4', S5: 'b_Step5', S6: 'b_Step6', C1: 'out_LV_C1', C2: 'out_HV_C2', STO1: 'STO_DR1', STO2: 'STO_DR2', SS1: 'out_SS1_DR1', HVD: 'out_HV_Discharge_Request', LVD: 'out_LV_Discharge_Request' };
const extra = (process.argv[3] ?? '').split(',').filter(Boolean);
for (const x of extra) SIG[x.split('/').slice(-2).join('.')] = x;
const names = (process.argv[2] ?? 'E2a-RC,E2b,E2c,E2d').split(',');
for (const n of names) {
  const r = cand(n); toRnd(r); r.step(2100); r.step(1, { in_Reset_PB: true, in_Relase_Door_PB: true }); r.step(1100); r.step(1, OFF); r.step(4000);
  if (!r.get('b_Step3')) { console.log(n, 'Run not reached', r.ph()); continue; }
  const prev = {}; for (const [k, v] of Object.entries(SIG)) prev[k] = +!!r.get(v);
  const ch = [];
  for (let k = 0; k < 9000; k++) { r.step(1, k === 0 ? { in_Estop_PLC: true } : undefined); for (const [kk, v] of Object.entries(SIG)) { const c = +!!r.get(v); if (c !== prev[kk]) { ch.push(`${kk}${c ? '↑' : '↓'}@${k}`); prev[kk] = c; } } }
  console.log(n.padEnd(8), ch.join(' '));
}
