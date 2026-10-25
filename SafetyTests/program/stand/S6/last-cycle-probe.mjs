// Probe: simulator reads previous-scan value when producer's orderOfExecution > consumer's.
import fs from "node:fs";
import { parseSalFile } from "../../../src/sal-parser.js";
import { SalRuntime } from "../../../src/sal-runtime.js";
const sal = new URL("../../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url);
const model = parseSalFile(sal, { bindingMode: "current" });
const md = fs.readFileSync(new URL("../../lead/S6/VERIFY_RESULT_3.md", import.meta.url), "utf8");
const blocks = new Map(model.networks.flatMap(n => n.blocks).map(b => [b.instanceName ?? b.name, b])); console.log("blocks", blocks.size, model.networks.flatMap(n=>n.blocks).length);
const wl = [...md.matchAll(/WiredLink connects the OutPort (\w+) of FunctionBlock (\w+) and the InPort (\w+) of FunctionBlock (\w+)/g)].map(m => ({ kind: "WiredLink", prod: m[2], out: m[1], cons: m[4], inp: m[3] }));
const vr = [...md.matchAll(/Variable (\w+) is used at (\w+) of FunctionBlock (\w+) which .*? assigned by (\w+) of FunctionBlock (\w+)/g)].map(m => ({ kind: "Variable", v: m[1], cons: m[3], inp: m[2], prod: m[5], out: m[4] }));
console.log("warnings parsed", wl.length, vr.length);
// static: simulator order agrees with Verify for ALL warnings?
let agree = 0, bad = [];
for (const w of [...wl, ...vr]) { const p = blocks.get(w.prod), c = blocks.get(w.cons); (c && p && c.orderOfExecution < p.orderOfExecution ? agree++ : bad.push(w)); }
console.log("order agrees (consumer<producer) for", agree, "of", wl.length + vr.length, "mismatch", bad.length);
// dynamic probe
const pick = [wl[0], wl[2], vr[0], vr[1], vr[3]];
const inVars = [...new Set(model.networks.flatMap(n => n.blocks).flatMap(b => b.inputs).flatMap(p => p.globals.map(g => g.resolvedName ?? g.lastKnownPath?.split(".").at(-1))).filter(Boolean))];
const rt = new SalRuntime(model, { scanMs: 10 });
let curScan = 0; // force each producer output to toggle (inputs alone leave deep producers constant)
const origWrite = rt.write.bind(rt); rt.write = (port, value) => origWrite(port, targets.some(x => x.prod === port) ? (curScan % 3 === 0) : value);
const origRead = rt.read.bind(rt);
const targets = pick.map(w => { const b = blocks.get(w.cons); return { w, port: b.inputs.find(p => p.name === w.inp), prod: blocks.get(w.prod).outputs.find(p => p.name === w.out) }; });
rt.read = port => { const v = origRead(port); for (const t of targets) if (t.port === port) t.read = v; return v; };
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (const t of targets) { t.prevWritten = false; t.lagOK = 0; t.sameScanDiff = 0; t.n = 0; }
for (let s = 0; s < 20000; s++) {
  if (s % 5 === 0) { const inp = {}; const bias = rnd(); for (const v of inVars) inp[v] = rnd() < bias; rt.setInputs(inp); }
  curScan = s;
  const before = targets.map(t => rt.values.get(t.prod.path));
  rt.scan();
  targets.forEach((t, i) => { // raw read of port (before NO inversion) vs producer previous/current
    const prevP = Boolean(before[i]), curP = rt.get(t.prod.path); const readRaw = t.port.deactivate1 === "Make Contact (NO)" ? !t.read : t.read;
    if (s > 0) { t.n++; if (readRaw === prevP) t.lagOK++; if (prevP !== curP) { t.sameScanDiff++; if (readRaw === curP && readRaw !== prevP) t.sameScanRead = (t.sameScanRead ?? 0) + 1; } }
  });
}
for (const t of targets) console.log(JSON.stringify({ kind: t.w.kind, prod: t.w.prod + "." + t.w.out, prodOrd: blocks.get(t.w.prod).orderOfExecution, cons: t.w.cons + "." + t.w.inp, consOrd: blocks.get(t.w.cons).orderOfExecution, scans: t.n, readEqualsPrevScanProducer: t.lagOK, scansWhereProducerChanged: t.sameScanDiff, readEqualsCurrentScanWhenChanged: t.sameScanRead ?? 0 }));
