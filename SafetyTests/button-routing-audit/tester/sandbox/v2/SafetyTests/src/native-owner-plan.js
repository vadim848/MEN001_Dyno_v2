export const ownerRoutes = ["SafeToRnD", "RnDToRun", "RunToRnD", "RnDToSafe"];
const routeModes = { SafeToRnD: "Safe", RnDToRun: "RnD", RunToRnD: "Run", RnDToSafe: "RnD" };
export function buildNativeOwnerPlan() {
  const memories = [...ownerRoutes, "Emergency", "PrevUp", "PrevDown", "PrevAck"];
  const blocks = [], externalInputs = new Set();
  const ref = signal => ({ signal, inverted: false });
  const ext = s => { externalInputs.add(s); return ref(`Input.${s}`); };
  const snap = s => ref(`Snapshot.${s}`);
  const not = r => ({ ...r, inverted: !r.inverted });
  function gate(type, ...inputs) {
    if (inputs.length < 2 || inputs.length > 8) throw new Error("Native gate fan-in unsupported");
    const name = `OWNER_GATE_${blocks.length + 1}`;
    blocks.push({ name, type, inputs }); return ref(`${name}.Out`);
  }
  const and = (...x) => gate("safeAnd", ...x), or = (...x) => gate("safeOr", ...x);
  const up = ext("StepUp"), down = ext("StepDown"), ack = ext("ManualRecovery");
  const modes = ["Safe", "RnD", "Run"].map(m => ext(`Mode${m}`));
  const modeConflict = or(and(modes[0], modes[1]), and(modes[0], modes[2]), and(modes[1], modes[2]));
  const modeValid = and(or(...modes), not(modeConflict));
  const ownershipPairs = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) ownershipPairs.push(and(snap(memories[i]), snap(memories[j])));
  const conflict = or(or(...ownershipPairs.slice(0, 5)), or(...ownershipPairs.slice(5)));
  const event = or(ext("Emergency"), ext("Fault"), ext("InvalidState"), not(modeValid), conflict);
  const edgeUp = and(up, not(snap("PrevUp"))), edgeDown = and(down, not(snap("PrevDown")));
  const edgeAck = and(ack, not(snap("PrevAck")));
  const idle = not(or(...memories.slice(0, 5).map(snap)));
  const completion = Object.fromEntries(ownerRoutes.map(r => [r, ext(`Complete.${r}`)]));
  const timeout = or(...ownerRoutes.map(r => and(snap(r), ext(`Timeout.${r}`), not(completion[r]))));
  const takeover = or(event, timeout);
  const recover = and(snap("Emergency"), ext("HazardRemoved"), edgeAck, not(takeover));
  const nextEmergency = and(or(snap("Emergency"), takeover), not(recover));
  const accepted = {}, completed = {}, next = { Emergency: nextEmergency, PrevUp: up, PrevDown: down, PrevAck: ack };
  for (const r of ownerRoutes) {
    const isDown = ["RunToRnD", "RnDToSafe"].includes(r);
    const direction = isDown ? edgeDown : and(edgeUp, not(edgeDown));
    accepted[r] = and(idle, modeValid, not(takeover), ext(`Mode${routeModes[r]}`), direction,
      ext(isDown ? "AllowDown" : "AllowUp"), not(completion[r]));
    completed[r] = and(snap(r), completion[r], not(takeover), not(snap("Emergency")));
    next[r] = and(or(snap(r), accepted[r]), not(completion[r]), not(takeover), not(snap("Emergency")));
  }
  for (const state of memories) blocks.push({ name: `OWNER_STATE_${state}`, type: "safeRs",
    set: next[state], reset: not(next[state]), output: `State.${state}` });
  const requests = Object.fromEntries(ownerRoutes.map(r => [r, and(ref(`State.${r}`), not(ref("State.Emergency")), not(takeover))]));
  const busy = or(...memories.slice(0, 5).map(s => ref(`State.${s}`)));
  blocks.forEach((b, i) => { b.relativeExecutionOrder = i + 2; });
  return { kind: "isolated native-style owner plan; no deployment aliases or SAL CRC",
    snapshot: { name: "OWNER_SNAPSHOT", type: "safeDecouple", relativeExecutionOrder: 1,
      channels: memories.map(s => ({ input: `State.${s}`, output: `Snapshot.${s}` })) },
    memories, externalInputs: [...externalInputs], blocks,
    outputs: { accepted, completed, recovery: recover, requests, emergency: ref("State.Emergency"), busy },
    unresolved: ["native initialization", "timeout producers and approved deadlines", "qualified completion and guard bindings",
      "safe Emergency sequencer and interrupted-context diagnostics", "editor capacity/order/Verify/CRC"] };
}

export class NativeOwnerPlanRuntime {
  constructor() {
    this.plan = buildNativeOwnerPlan();
    // Explicit host initialization; not a claimed TwinSAFE startup encoding.
    this.memory = new Map(this.plan.memories.map(s => [`State.${s}`, false]));
  }
  scan(inputs) {
    const v = new Map(this.memory);
    for (const name of this.plan.externalInputs) {
      if (typeof inputs[name] !== "boolean") throw new Error(`Missing explicit Boolean input ${name}`);
      v.set(`Input.${name}`, inputs[name]);
    }
    for (const c of this.plan.snapshot.channels) v.set(c.output, v.get(c.input));
    const read = r => {
      if (!v.has(r.signal)) throw new Error(`Unresolved plan signal ${r.signal}`);
      return r.inverted ? !v.get(r.signal) : v.get(r.signal);
    };
    for (const b of this.plan.blocks) {
      if (b.type === "safeRs") {
        const q = !read(b.reset) && (read(b.set) || this.memory.get(b.output));
        this.memory.set(b.output, q); v.set(b.output, q);
      } else {
        const values = b.inputs.map(read);
        v.set(`${b.name}.Out`, b.type === "safeAnd" ? values.every(Boolean) : values.some(Boolean));
      }
    }
    const mapped = obj => Object.keys(obj).filter(k => read(obj[k]));
    return { accepted: mapped(this.plan.outputs.accepted), completed: mapped(this.plan.outputs.completed),
      requests: mapped(this.plan.outputs.requests), recovery: read(this.plan.outputs.recovery),
      emergency: read(this.plan.outputs.emergency), busy: read(this.plan.outputs.busy) };
  }
}
