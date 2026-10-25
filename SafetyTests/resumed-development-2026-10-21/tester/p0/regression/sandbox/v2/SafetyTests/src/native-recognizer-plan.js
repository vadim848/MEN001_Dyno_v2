import { recognizerGraph } from "./button-cover-prototype.js";

// Connection plan only. Signal references are symbolic, not SAL monikers.
export function buildNativeRecognizerPlan() {
  const states = Object.keys(recognizerGraph);
  const boundaries = ["inhibit", "off", "releaseDone", "greenOnly", "blueOnly", "singleDone",
    "both", "candidate", "within", "bothDone", "primaryLost"];
  const blocks = [];
  const ref = (signal, inverted = false) => ({ signal, inverted });
  function lower(expr) {
    if (typeof expr === "string") {
      if (!states.includes(expr) && !boundaries.includes(expr)) throw new Error(`Unbound fact ${expr}`);
      return ref(states.includes(expr) ? `Snapshot.${expr}` : `Boundary.${expr}`);
    }
    const [op, ...args] = expr;
    if (op === "NOT") { const r = lower(args[0]); return { ...r, inverted: !r.inverted }; }
    if (!["AND", "OR"].includes(op) || args.length < 2 || args.length > 8) throw new Error("Unsupported native gate fan-in");
    const inputs = args.map(lower);
    const name = `REC_GATE_${String(blocks.length + 1).padStart(3, "0")}`;
    blocks.push({ name, type: op === "AND" ? "safeAnd" : "safeOr", inputs });
    return ref(`${name}.Out`);
  }
  const next = Object.fromEntries(Object.entries(recognizerGraph).map(([s, expr]) => [s, lower(expr)]));
  const booleanBlocks = blocks.length;
  for (const [state, set] of Object.entries(next)) {
    blocks.push({ name: `REC_STATE_${state}`, type: "safeRs", set,
      reset: { ...set, inverted: !set.inverted }, output: `State.${state}` });
  }
  blocks.forEach((b, i) => { b.relativeExecutionOrder = i + 2; });
  return {
    kind: "non-deployable native connection plan; no aliases or SAL CRC",
    snapshot: { name: "REC_SNAPSHOT", type: "safeDecouple", relativeExecutionOrder: 1,
      channels: states.map(s => ({ input: `State.${s}`, output: `Snapshot.${s}` })) },
    boundaries: boundaries.map(name => ({ name: `Boundary.${name}`, status: "requires reviewed producer; never default TRUE/FALSE" })),
    booleanBlocks, next, blocks,
    unresolved: ["boundary producers and their global schedule", "inclusive 500 ms chord encoding",
      "explicit verified startup", "safe-energy/access and emergency proof bindings",
      "request-owner integration and qualified bindings", "target capacity/build/CRC validation"]
  };
}
