// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../src/sal-parser.js";
import { SalRuntime } from "../src/sal-runtime.js";

const model = parseSalFile(baselineSalPath);
const selected = { ...model, networks: model.networks.filter(n => n.name === "Network1").map(n =>
  ({ ...n, blocks: n.blocks.filter(b => ["FBAnd1", "FBEstop1"].includes(b.name)) })) };
const delayed = "//Network1/FBEstop1/EStopDelOut";
function ready() {
  return new SalRuntime(selected).setInputs({ in_Reset_PB: false, in_ES_NC_1: true,
    in_ES_NC_2: true, in_Mentee_EStop:false, in_Estop_PLC: false, in_False_SI2_CH8: false }).runFor(100);
}
function enable(r) {
  r.runFor(30, { in_Reset_PB: true });
  r.scan(10); // held high still cannot enable
  assert.equal(r.get("b_EStop_Ok"), false);
  r.runFor(10, { in_Reset_PB: false });
  assert.equal(r.get("b_EStop_Ok"), true);
  assert.equal(r.get(delayed), true);
}

test("V2-ESTOP01 healthy levels and held restart cannot enable without falling edge", () => {
  const r = ready();
  assert.equal(r.get("b_EStop_Ok"), false);
  r.runFor(500, { in_Reset_PB: true });
  assert.equal(r.get("b_EStop_Ok"), false);
  r.runFor(10, { in_Reset_PB: false });
  assert.equal(r.get("b_EStop_Ok"), true);
  assert.equal(r.get(delayed), true, "no on-delay at restart");
  assert.ok([...r.limitations].some(x => x.includes("no-EDM assumption")));
});

test("V2-ESTOP02 emergency output drops immediately and delayed output drops at 100 ms", () => {
  const r = ready();
  enable(r);
  r.runFor(10, { in_ES_NC_1: false });
  assert.equal(r.get("b_EStop_Ok"), false);
  assert.equal(r.get(delayed), true);
  r.runFor(90); // 90ms elapsed since separately observed first loss sample
  assert.equal(r.get(delayed), true);
  r.runFor(10);
  assert.equal(r.get(delayed), false);
});

test("V2-ESTOP03 emergency recovery alone cannot restore the output", () => {
  const r = ready();
  enable(r);
  r.runFor(120, { in_ES_NC_1: false });
  r.runFor(500, { in_ES_NC_1: true });
  assert.equal(r.get("b_EStop_Ok"), false);
  enable(r);
});

test("V2-ESTOP04 restart release while unsafe is rejected", () => {
  const r = ready();
  r.runFor(50, { in_ES_NC_1: false, in_Reset_PB: true });
  r.runFor(50, { in_Reset_PB: false });
  r.runFor(100, { in_ES_NC_1: true });
  assert.equal(r.get("b_EStop_Ok"), false);
});

test("V2-ESTOP05 active EDM fixture is rejected instead of silently passing", () => {
  const fixture = structuredClone(selected);
  fixture.networks[0].blocks.find(b => b.name === "FBEstop1").inputs.find(p => p.name === "EDM1").channelInterface = "Activated";
  assert.throws(() => new SalRuntime(fixture).scan(), /EDM is not implemented/);
});
