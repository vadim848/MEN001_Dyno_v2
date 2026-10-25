import fs from "node:fs";
import { buildNativeRecognizerPlan } from "../src/native-recognizer-plan.js";
const plan = buildNativeRecognizerPlan();
if (process.argv.includes("--write")) fs.writeFileSync(new URL("../NATIVE_RECOGNIZER_PLAN.json", import.meta.url), JSON.stringify(plan, null, 2) + "\n");
console.log(JSON.stringify({ gates: plan.booleanBlocks, stateLatches: 7,
  relativeBlocksIncludingSnapshot: plan.blocks.length + 1, unresolved: plan.unresolved }, null, 2));
