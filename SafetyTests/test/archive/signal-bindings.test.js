import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../../src/sal-parser.js";
import { readAliasDescriptors, signalBindings } from "../../src/signal-bindings.js";
const root = new URL("../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/", import.meta.url);
const model = parseSalFile(fileURLToPath(new URL("TwinSafeGroup1.sal", root)));
const rows = signalBindings(model, readAliasDescriptors(fileURLToPath(new URL("Alias Devices/", root))));

test("BIND01 door monitor standard alias is distinguished from physical FSoE button alias", () => {
  const door = rows.find(r => r.signal === "in_Door_Monitor");
  assert.equal(door.alias.sdsId, "16");
  assert.equal(door.descriptor.kind, "StandardAliasDevice");
  assert.match(door.interpretation, /not independently proven/);
  const green = rows.find(r => r.signal === "in_Reset_PB");
  assert.equal(green.descriptor.kind, "SafetyAliasDevice");
  assert.equal(green.descriptor.connectionType, "FSoE");
  assert.equal(green.electricalPolarity, "UNVERIFIED");
});

test("BIND02 group RunStop and ErrAck targets are preserved without claiming mode recovery", () => {
  assert.deepEqual(rows.find(r => r.signal === "in_Safety_Run").groupPorts, ["//RunStop"]);
  assert.deepEqual(rows.find(r => r.signal === "GroupPort_ErrAck").groupPorts, ["//ErrAck"]);
  assert.match(rows.find(r => r.signal === "in_Safety_Run").interpretation, /not qualified actual/);
});
