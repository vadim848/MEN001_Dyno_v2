import fs from "node:fs";
import { buildNativeOwnerPlan } from "../src/native-owner-plan.js";
const p = buildNativeOwnerPlan();
if (process.argv.includes("--write")) fs.writeFileSync(new URL("../NATIVE_OWNER_PLAN.json", import.meta.url), JSON.stringify(p, null, 2) + "\n");
console.log(JSON.stringify({ relativeBlocks: p.blocks.length + 1,
  gates: p.blocks.filter(b => b.inputs).length, memories: p.memories.length,
  externalInputs: p.externalInputs.length, unresolved: p.unresolved }, null, 2));
