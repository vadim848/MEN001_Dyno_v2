import fs from "node:fs";
import { IntegratedControlPrototype } from "../src/integrated-control-prototype.js";
const p = new IntegratedControlPrototype(), trace = [];
let last = "";
function run(label, ms, changes = {}) {
  for (let t = 0; t < ms; t += 10) {
    const out = p.tick(10, { mode: "R&D", allowDown: true, allowUp: true, safeEnergyForAccess: true, ...changes });
    const sample = { label, timeMs: out.timeMs, state: out.buttons.state, requests: out.owner.requests,
      accepted: out.owner.accepted, completed: out.owner.completed, emergency: out.owner.emergency,
      unlock: out.unlock, recoveryTarget: out.recoveryTarget, interruptedContext: out.interruptedContext };
    const signature = JSON.stringify({ ...sample, label: undefined, timeMs: undefined });
    if (signature !== last) { trace.push(sample); last = signature; }
  }
}
run("neutral qualification", 2000);
run("qualified down command", 1000, { green: true });
run("blue held during accepted transition", 1200, { blue: true });
run("fault during transition", 10, { blue: true, emergency: true, energyContext: { energySafe: false } });
run("fault source restored; ownership remains", 200, { blue: true });
run("manual recovery after supplied proof", 10, { blue: true, hazardRemoved: true, manualRecoveryPulse: true });
run("held blue after Safe recovery", 1200, { blue: true, mode: "Safe" });
run("new neutral interval", 2010, { mode: "Safe" });
run("fresh permitted blue", 1200, { mode: "Safe", blue: true });
const report = { kind: "isolated conceptual recognizer + native-style owner; not candidate SAL acceptance",
  sampleMs: 10, assumptions: "Host timers/initialization, external proof/guards/modes; no physical output or safe-energy validation", trace };
if (process.argv.includes("--write")) fs.writeFileSync(new URL("../INTEGRATED_CONTROL_TRACE.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ changedFrames: trace.length, final: trace.at(-1) }, null, 2));
