import test from "node:test";
import assert from "node:assert/strict";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";
const model = parseSalFile(new URL("../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal",import.meta.url));

test("Current SAL TON adapter preserves configured millisecond boundaries at dt1", () => {
  for(const block of model.networks.flatMap(n=>n.blocks).filter(b=>b.functionName==="safeTon")) {
    const r=new SalRuntime({ ...model,networks:[{ blocks:[block] }] },{ scanMs:1 });
    const input=block.inputs[0];
    const drive=value=>{const raw=input.deactivate1==="Make Contact (NO)"?!value:value;
      r.values.set(input.path,raw);for(const p of input.sources)r.values.set(p,raw);
      for(const g of input.globals)r.setInputs({ [g.lastKnownPath.split(".").at(-1)]:raw });
      const v=r.variableTargets.get(input.path);if(v)r.setInputs({ [v]:raw });};
    const delay=Number(block.parameters.find(p=>p.timing).timing)*1000;
    assert.equal(Number.isInteger(delay),true);
    drive(true);r.scan();r.runFor(delay-1);assert.equal(r.get(block.outputs[0].path),false,block.path);
    r.scan();assert.equal(r.get(block.outputs[0].path),true,block.path);
    r.scan();assert.equal(r.get(block.outputs[0].path),true,block.path);
    drive(false);r.scan();assert.equal(r.get(block.outputs[0].path),false,block.path);
    drive(true);r.scan();r.runFor(delay-1);assert.equal(r.get(block.outputs[0].path),false,block.path);
    r.scan();assert.equal(r.get(block.outputs[0].path),true,block.path);
  }
});
