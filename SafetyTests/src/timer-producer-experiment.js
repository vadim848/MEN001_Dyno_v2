import { SalRuntime } from "./sal-runtime.js";

// Synthetic native-vocabulary fixture: explicit externally supplied snapshots.
// It is neither exported SAL nor a full recognizer/state-feedback execution.
export function buildTimerProducerFixture({ omitArmedStart = false, timersFirst = false } = {}) {
  const blocks = [];
  const inputNames = ["Q_W", "Q_A", "Q_G", "Q_B", "Q_T", "I_Green", "I_Blue", "Inhibit", "WithinProof"];
  function port(name, source, inverted = false) {
    return { name, path: `//TimerExperiment/${blocks.length}/${name}`, sources: [], targets: [],
      globals: [{ lastKnownPath: `Experiment.${source}` }], channelInterface: "Activated",
      deactivate1: inverted ? "Make Contact (NO)" : "Break Contact (NC)" };
  }
  function block(name, fn, sources, timing) {
    const path = `//TimerExperiment/${name}`;
    const inputs = sources.map((s, i) => port(`In${i + 1}`, s.replace(/^!/, ""), s.startsWith("!")));
    const outputs = [{ name: "Out", path: `${path}/Out`, targets: [], sources: [], globals: [{ lastKnownPath: `Experiment.${name}` }] }];
    blocks.push({ name, path, functionName: fn, inputs, outputs, parameters: timing === undefined ? [] : [{ timing: String(timing) }], orderOfExecution: blocks.length + 1 });
    return name;
  }
  const and = (name, ...s) => block(name, "safeAnd", s);
  const or = (name, ...s) => block(name, "safeOr", s);
  const off = and("BothOff", "!I_Green", "!I_Blue");
  const single = [and("GreenCandidate", "Q_G", "I_Green", "!I_Blue"), and("BlueCandidate", "Q_B", "I_Blue", "!I_Green")];
  if (!omitArmedStart) single.push(and("ArmedGreen", "Q_A", "I_Green", "!I_Blue"), and("ArmedBlue", "Q_A", "I_Blue", "!I_Green"));
  const singleRaw = or("SingleRaw", ...single);
  const singleEnable = and("SingleEnable", singleRaw, "!Inhibit");
  const armedBoth = and("ArmedBoth", "Q_A", "I_Green", "I_Blue");
  const candidate = or("Candidate", "Q_G", "Q_B");
  const chordBoth = and("CandidateChord", candidate, "I_Green", "I_Blue", "WithinProof");
  const continuedBoth = and("ContinuedBoth", "Q_T", "I_Green", "I_Blue");
  const bothRaw = or("BothRaw", armedBoth, chordBoth, continuedBoth);
  const bothEnable = and("BothEnable", bothRaw, "!Inhibit");
  const releaseEnable = and("ReleaseEnable", "Q_W", off, "!Inhibit");
  block("SingleDone", "safeTon", [singleEnable], 1);
  block("BothDone", "safeTon", [bothEnable], 2);
  block("ReleaseDone", "safeTon", [releaseEnable], 2);
  if (timersFirst) {
    const sorted = [...blocks.filter(b => b.functionName === "safeTon"), ...blocks.filter(b => b.functionName !== "safeTon")];
    sorted.forEach((b, i) => { b.orderOfExecution = i + 1; });
  }
  return { file: "synthetic timer producer experiment", variables: inputNames.map(name => ({ name, sourcePorts: [], targetPorts: [] })),
    networks: [{ name: "TimerExperiment", blocks }] };
}

export function timerExperiment(options = {}) {
  const model = buildTimerProducerFixture(options);
  const r = new SalRuntime(model, { unconnectedInput: false });
  r.setInputs(Object.fromEntries(model.variables.map(v => [v.name, false])));
  // Warm every explicit link with FALSE before applying the timed stimulus.
  r.runFor(50);
  return r;
}

export function timerContinuitySummary() {
  const rows = [];
  for (const [variant, options] of [["continuous", {}], ["missing first sample", { omitArmedStart: true }], ["timer before gates", { timersFirst: true }]]) {
    const r = timerExperiment(options);
    r.runFor(10, { Q_A: true, I_Green: true });
    r.runFor(980, { Q_A: false, Q_G: true });
    const before = r.get("SingleDone"); r.runFor(10);
    const at1000 = r.get("SingleDone"); r.runFor(10);
    rows.push({ variant, at990ms: before, at1000ms: at1000, at1010ms: r.get("SingleDone"), fallbackPorts: [...r.assumedUnconnectedPorts] });
  }
  return rows;
}
