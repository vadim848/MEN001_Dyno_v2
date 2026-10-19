// Design-level replay of the proposed native netlist. NOT working SAL acceptance.
// Run: node SafetyTests/scripts/check-compact-plan.js (also works from SafetyTests).
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const plan = JSON.parse(fs.readFileSync(process.argv[2] ?? fileURLToPath(new URL("../03B_COMPACT_NETLIST_PLAN.json", import.meta.url)), "utf8"));
const stateSources = new Map(plan.sgvlDeclarations.map(d => [d.id, d.sourcePort]));
const results = [];
function replay(dt, events, duration) {
  const values = new Map(), memory = new Map(), observations = [];
  const raw = { in_Reset_PB: false, in_Relase_Door_PB: false, in_False_SI2_CH8: false,
    in_Mentee_EStop: false, in_InterLock_NC_1: true, in_InterLock_NC_2: true };
  const counts = { green: 0, blue: 0, up: 0 };
  function read(source) {
    let value;
    if (source.kind === "salAliasTargetUsage") value = raw[source.name];
    else if (source.kind === "existingSgvlReference") {
      if (source.name !== "GVL1.b_Step_RnD") throw new Error(`Unknown external global ${source.name}`);
      value = true; // Explicit R&D boundary for this design-level replay.
    } else if (source.kind === "newSgvlReference") {
      if (!stateSources.has(source.id)) throw new Error(`Unknown state GUID ${source.id}`);
      value = values.get(stateSources.get(source.id));
    } else if (source.path === "//Network1/FBAndLvCurrentPermit/AndOut") {
      // Declared cut: all other active real Permit inputs healthy. The two
      // InterLock inputs retain their source-defined dependency, not a free TRUE.
      value = raw.in_InterLock_NC_1 && raw.in_InterLock_NC_2;
    }
    else if (source.path) value = values.get(source.path);
    else throw new Error(`Unresolved planned source ${JSON.stringify(source)}`);
    return source.inverted ? !value : Boolean(value);
  }
  const blocks = [...plan.blocks].sort((a, b) => a.order - b.order);
  const first = 2200; // Neutral startup, release2s and explicit helper preparation.
  for (let time = 0; time <= first + duration; time += dt) {
    for (const event of events.filter(e => e.at === time - first)) Object.assign(raw, event.input);
    for (const block of blocks) {
      const input = block.inputs.map(i => read(i.source)), previous = memory.get(block.name);
      let output;
      switch (block.type) {
        case "safeAnd": output = [input.every(Boolean)]; break;
        case "safeOr": output = [input.some(Boolean)]; break;
        case "safeDecouple": output = input; break;
        case "safeRs":
          output = [input[0] ? false : input[1] ? true : previous ?? false];
          memory.set(block.name, output[0]);
          break;
        case "safeTon": {
          const enabled = input[0], prior = previous ?? { enabled: false, age: 0 };
          const age = enabled ? prior.enabled ? prior.age + dt : 0 : 0;
          const delay = Number(block.parameters[0].timing) * 1000;
          if (!Number.isFinite(delay)) throw new Error(`Invalid TON parameter ${block.name}`);
          memory.set(block.name, { enabled, age });
          output = [enabled && age >= delay];
          break;
        }
        case "safeEstop": {
          // Explicit no-EDM, discrepancy0 component; no group lifecycle simulation.
          const safe = read(block.nativeInputs.EStopIn1), restart = read(block.nativeInputs.Restart);
          const prior = previous ?? { enabled: false, delayed: false, armed: false, age: 0 };
          const enabled = safe && (prior.enabled || (prior.armed && !restart));
          const age = enabled ? 0 : prior.enabled ? 0 : prior.age + dt;
          const delay = Number(block.parameters[0].timing);
          const delayed = enabled || (prior.delayed && age < delay);
          memory.set(block.name, { enabled, delayed, armed: safe && restart, age });
          output = [false, enabled, delayed];
          break;
        }
        default: throw new Error(`Unsupported planned block ${block.type}`);
      }
      block.outputs.forEach((port, i) => values.set(port.path, Boolean(output[i])));
    }
    if (time < first) continue;
    for (const [name, symbol] of [["green", "FinishG"], ["blue", "FinishB"], ["up", "FinishUp"]]) {
      if (read(plan.symbols[symbol])) counts[name]++;
    }
    if (events.some(e => e.observe === time - first)) observations.push({ time: time - first, ...states() });
  }
  function states() {
    return Object.fromEntries(["SG", "SU", "BA", "L", "T"].map(s => [s, Boolean(values.get(`//${plan.network}/STATE_${s}/RsOut`))]));
  }
  return { counts, observations, ...states() };
}
function check(id, dt, events, duration, expected) {
  const actual = replay(dt, events, duration);
  results.push({ id, dt, status: expected(actual) ? "PASS" : "FAIL", actual });
}
for (const dt of [1, 2, 5, 10]) for (const order of ["green", "blue"]) {
  const first = order === "green" ? "in_Reset_PB" : "in_Relase_Door_PB";
  const second = order === "green" ? "in_Relase_Door_PB" : "in_Reset_PB";
  for (const delta of [250 - dt, 250, 250 + dt]) {
    check(`window:${order}:${delta}`, dt, [{ at: 0, input: { [first]: true } },
      { at: delta, input: { [second]: true } }], delta + 1100,
    r => r.SU === (delta <= 250) && r.counts.up === (delta <= 250 ? 1 : 0) && !r.counts.green && !r.counts.blue);
  }
}
for (const order of ["green", "blue"]) {
  const first = order === "green" ? "in_Reset_PB" : "in_Relase_Door_PB";
  const second = order === "green" ? "in_Relase_Door_PB" : "in_Reset_PB";
  for (const delta of [300, 500, 600]) {
    check(`late:${order}:${delta}`, 1, [{ at: 0, input: { [first]: true } },
      { at: delta, input: { [second]: true } }], 1800,
    r => !r.counts.up && r.counts[order] === (delta >= 500 ? 1 : 0) && !r.counts[order === "green" ? "blue" : "green"]);
  }
  check(`piano:${order}`, 1, [{ at: 0, input: { [first]: true } },
    { at: 100, input: { [first]: false, [second]: true } }], 1000,
  r => !r.counts.green && !r.counts.blue && !r.counts.up && r.L);
  check(`short-off:${order}`, 1, [{ at: 0, input: { [first]: true } },
    { at: 100, input: { [first]: false } }, { at: 200, input: { [second]: true } }], 1000,
  r => !r.counts.green && !r.counts.blue && !r.counts.up && r.L);
  check(`flicker:${order}`, 1, [{ at: 0, input: { [first]: true } },
    { at: 100, input: { [second]: true } }, { at: 700, input: { [second]: false } },
    { at: 701, input: { [second]: true }, observe: 1700 }, { observe: 1701 }], 1800,
  r => r.counts.up === 1 && !r.counts.green && !r.counts.blue &&
    r.observations[0]?.SU === false && r.observations[1]?.SU === true);
}
const summary = { kind: "DESIGN NETLIST ONLY; NOT working SAL/native validation", clock: "observed-edge fixed samples",
  cases: results.length, PASS: results.filter(r => r.status === "PASS").length,
  FAIL: results.filter(r => r.status === "FAIL").length,
  countedBlocks: plan.blocks.length, finalBlockCount: plan.sequence.length, limit: 255 };
console.log(JSON.stringify(summary, null, 2));
for (const row of results.filter(r => r.status === "FAIL")) console.error(JSON.stringify(row));
if (summary.FAIL || plan.sequence.length > 255) process.exitCode = 1;
