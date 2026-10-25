// Historical pinned SAL reproduction; this is not candidate acceptance.
import { baselineSalPath } from "../../src/baseline-fixture.js";
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSalFile, buildDependencyGraph, findPath } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sal = baselineSalPath;
const model = parseSalFile(sal);
const graph = buildDependencyGraph(model);

function selectedModel(selection) {
  return {
    ...model,
    networks: model.networks
      .filter(network => selection[network.name])
      .map(network => ({
        ...network,
        blocks: network.blocks.filter(block => selection[network.name].includes(block.name))
      }))
  };
}

const safeCoverModel = selectedModel({
  Network1: ["FBOr3", "FBOr4", "FBRs6"],
  Network2: ["FBDecouple3", "FBAnd7", "FBAnd8"]
});

const rndCoverModel = selectedModel({
  Network1: ["FBOr3", "FBOr4", "FBRs6"],
  Network12: ["FBAnd1", "FBAnd2", "FBAnd3", "FBTon2", "FBAnd11", "FBAnd17"]
});
const rndFullModel = selectedModel({
  Network1: ["FBOr3", "FBOr4", "FBRs6"],
  Network12: network12Names()
});

function network12Names() {
  return model.networks.find(network => network.name === "Network12").blocks.map(block => block.name);
}

test("V2-COVER01 Safe blue button has a direct untimed path to unlock latch", () => {
  const pathToSet = findPath(graph, "var:in_Relase_Door_PB", "var:b_Set_Door_Unlock");
  assert.ok(pathToSet);
  assert.equal(pathToSet.some(node => node.includes("FBTon")), false);
});

test("V2-COVER02 Safe unlock remains latched after blue release while door monitor stays locked", () => {
  const runtime = new SalRuntime(safeCoverModel).setInputs({
    b_Step1: true,
    in_Relase_Door_PB: true,
    in_Door_Monitor: true
  }).runFor(50);
  assert.equal(runtime.get("out_Door_Unlock_Solonoeid"), true);
  runtime.setInputs({ in_Relase_Door_PB: false }).runFor(1000);
  assert.equal(runtime.get("out_Door_Unlock_Solonoeid"), true,
    "records current v2 latch behavior; requirement expects OFF after release");
});

test("V2-COVER03 Safe unlock resets when locked feedback drops", () => {
  const runtime = new SalRuntime(safeCoverModel).setInputs({
    b_Step1: true,
    in_Relase_Door_PB: true,
    in_Door_Monitor: true
  }).runFor(50);
  runtime.setInputs({ in_Door_Monitor: false }).runFor(50);
  assert.equal(runtime.get("out_Door_Unlock_Solonoeid"), false);
});

test("V2-COVER04 R&D blue release resets unlock while locked feedback remains present", () => {
  const runtime = new SalRuntime(rndCoverModel).setInputs({
    b_Step_RnD: true,
    in_False_SI2_CH8: false,
    in_Reset_PB: false,
    in_Relase_Door_PB: true,
    in_Door_Monitor: true
  }).runFor(550);
  assert.equal(runtime.get("out_Door_Unlock_Solonoeid"), true);
  runtime.setInputs({ in_Relase_Door_PB: false }).runFor(50);
  assert.equal(runtime.get("out_Door_Unlock_Solonoeid"), false);
});

test("V2-COVER05 current v2 can retain unlock while accepting an upward gesture", () => {
  const runtime = new SalRuntime(rndFullModel).setInputs({
    b_Step_RnD: true,
    b_ResetPB_Lock: false,
    in_False_SI2_CH8: false,
    in_Reset_PB: false,
    in_Relase_Door_PB: true,
    in_Door_Monitor: true,
    inPLC_RnD_Mode: false,
    inPLC_RnD_Mode_2: false,
    in_HV_C2_FBK: false,
    in_HV_Healthy_FBK: true
  }).runFor(550);
  assert.equal(runtime.get("out_Door_Unlock_Solonoeid"), true);

  // Cover opens while blue remains held, then blue is released. The R&D reset
  // branch requires the locked feedback, so the latch remains set while open.
  runtime.setInputs({ in_Door_Monitor: false }).runFor(50);
  runtime.setInputs({ in_Relase_Door_PB: false }).runFor(100);
  assert.equal(runtime.get("out_Door_Unlock_Solonoeid"), true);

  // Operator closes the cover while already holding both buttons. The blue
  // input suppresses the reset branch, while the locked feedback permits StepUp.
  runtime.setInputs({
    in_Door_Monitor: true,
    in_Reset_PB: true,
    in_Relase_Door_PB: true
  }).runFor(1050);
  assert.equal(runtime.get("b_Set_Transition_3"), true);
  assert.equal(runtime.get("out_Door_Unlock_Solonoeid"), true,
    "records current v2 conflict: unlock and upward transition coexist");
});
