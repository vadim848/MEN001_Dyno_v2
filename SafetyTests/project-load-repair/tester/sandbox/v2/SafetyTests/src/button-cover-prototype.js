// Isolated conceptual block graph. Not generated SAL or a TwinSAFE runtime.
const and = (...x) => ["AND", ...x];
const or = (...x) => ["OR", ...x];
const not = x => ["NOT", x];
export const recognizerGraph = {
  W: or("inhibit", and("W", not("releaseDone")), and("off", or("G", "B", "T", "U", "L"))),
  A: and(not("inhibit"), or(and("W", "releaseDone"), and("A", "off"))),
  G: and(not("inhibit"), or(and("A", "greenOnly"), and("G", "greenOnly", not("singleDone")))),
  B: and(not("inhibit"), or(and("A", "blueOnly"), and("B", "blueOnly", not("singleDone")))),
  T: and(not("inhibit"), or(and("A", "both"), and("candidate", "both", "within"), and("T", not("off"), not("bothDone")))),
  U: and(not("inhibit"), or(and("B", "blueOnly", "singleDone"), and("U", "blueOnly"))),
  L: and(not("inhibit"), or(and("G", "greenOnly", "singleDone"), and("T", "bothDone"),
    and("candidate", "both", not("within")), and("primaryLost", not("off")),
    and("U", not("off"), not("blueOnly")), and("L", not("off"))))
};
function evaluate(expr, facts) {
  if (typeof expr === "string") return Boolean(facts[expr]);
  const [op, ...args] = expr;
  if (op === "AND") return args.every(x => evaluate(x, facts));
  if (op === "OR") return args.some(x => evaluate(x, facts));
  if (op === "NOT") return !evaluate(args[0], facts);
  throw new Error(`Unsupported graph operator ${op}`);
}

export class ButtonCoverPrototype {
  constructor() {
    this.q = Object.fromEntries(Object.keys(recognizerGraph).map(s => [s, s === "W"]));
    this.timers = { release: 0, single: 0, firstAge: 0, both: 0 };
    this.previousMode = null;
  }
  tick(dt, input) {
    if (!(dt > 0 && dt <= 10)) throw new Error("Prototype requires samples of 1–10 ms");
    const { green = false, blue = false, mode = "Safe", emergency = false,
      fault = false, transition = false, safeEnergyForAccess = false } = input;
    const q = { ...this.q };
    const invalid = Object.values(q).filter(Boolean).length !== 1;
    const modeChanged = this.previousMode !== null && mode !== this.previousMode;
    this.previousMode = mode;
    const access = ["Safe", "R&D"].includes(mode) && !emergency && !fault && !transition && safeEnergyForAccess;
    const inhibit = invalid || emergency || fault || transition || modeChanged || ((q.B || q.U) && !access);
    const off = !green && !blue, both = green && blue;
    const greenOnly = green && !blue, blueOnly = blue && !green;
    const within = this.timers.firstAge <= 500;
    const timers = inhibit ? { release: 0, single: 0, firstAge: 0, both: 0 } : {
      release: q.W && off ? this.timers.release + dt : 0,
      single: ((q.G && greenOnly) || (q.B && blueOnly)) ? this.timers.single + dt :
        q.A && (greenOnly || blueOnly) ? dt : 0,
      firstAge: q.G || q.B ? this.timers.firstAge + dt : q.A && !off ? dt : 0,
      both: q.T && both ? this.timers.both + dt :
        both && (q.A || ((q.G || q.B) && within)) ? dt : 0
    };
    const facts = { ...q, inhibit, off, both, greenOnly, blueOnly, within,
      candidate: q.G || q.B, primaryLost: (q.G && !green) || (q.B && !blue),
      releaseDone: timers.release >= 2000, singleDone: timers.single >= 1000,
      bothDone: timers.both >= 2000 };
    const next = Object.fromEntries(Object.entries(recognizerGraph).map(([s, expr]) => [s, evaluate(expr, facts)]));
    const stepDown = !inhibit && q.G && greenOnly && facts.singleDone;
    const stepUp = !inhibit && q.T && both && facts.bothDone;
    this.q = next; this.timers = timers;
    if (Object.values(next).filter(Boolean).length !== 1) throw new Error("Prototype graph ownership conflict");
    return { state: Object.keys(next).find(s => next[s]), stepUp, stepDown,
      unlock: !inhibit && next.U && blueOnly && access, recognizerFault: invalid };
  }
}
