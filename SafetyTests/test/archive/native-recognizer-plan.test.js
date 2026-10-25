import test from "node:test";
import assert from "node:assert/strict";
import { buildNativeRecognizerPlan } from "../../src/native-recognizer-plan.js";
import { recognizerGraph } from "../../src/button-cover-prototype.js";
function expected(e, f) {
  if (typeof e === "string") return f[e];
  const [op, ...args] = e;
  if (op === "NOT") return !expected(args[0], f);
  return op === "AND" ? args.every(x => expected(x, f)) : args.some(x => expected(x, f));
}
test("NATIVE01 Boolean contact lowering preserves next-state equations across varied contexts", () => {
  const plan = buildNativeRecognizerPlan();
  const facts = plan.boundaries.map(x => x.name.slice(9));
  for (const state of Object.keys(recognizerGraph)) for (let pattern = 0; pattern < 2 ** facts.length; pattern++) {
    const context = Object.fromEntries(Object.keys(recognizerGraph).map(s => [s, s === state]));
    facts.forEach((f, i) => { context[f] = Boolean(pattern & (1 << i)); });
    const values = new Map(Object.entries(context).map(([s, v]) => [Object.keys(recognizerGraph).includes(s) ? `Snapshot.${s}` : `Boundary.${s}`, v]));
    const read = r => { assert.ok(values.has(r.signal), r.signal); return r.inverted ? !values.get(r.signal) : values.get(r.signal); };
    for (const b of plan.blocks.filter(b => b.type !== "safeRs")) {
      const args = b.inputs.map(read);
      values.set(`${b.name}.Out`, b.type === "safeAnd" ? args.every(Boolean) : args.some(Boolean));
    }
    for (const [s, out] of Object.entries(plan.next)) assert.equal(read(out), expected(recognizerGraph[s], context));
    for (const b of plan.blocks.filter(b => b.type === "safeRs")) assert.notEqual(read(b.set), read(b.reset));
  }
});
test("NATIVE02 schedule has contiguous relative order and keeps all latch writes after next-state gates", () => {
  const p = buildNativeRecognizerPlan();
  assert.deepEqual([p.snapshot.relativeExecutionOrder, ...p.blocks.map(b => b.relativeExecutionOrder)],
    Array.from({ length: p.blocks.length + 1 }, (_, i) => i + 1));
  assert.equal(p.blocks.slice(-7).every(b => b.type === "safeRs"), true);
  assert.equal(p.blocks.slice(0, -7).every(b => b.inputs.length >= 2 && b.inputs.length <= 8), true);
  assert.ok(p.unresolved.includes("inclusive 500 ms chord encoding"));
});
