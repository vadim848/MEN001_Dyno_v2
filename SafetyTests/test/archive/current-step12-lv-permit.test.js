import * as V2 from '../helpers/v2-structural.js';
import test from "node:test";
import assert from "node:assert/strict";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";
const model = parseSalFile(V2.salUrl, V2.parseOptions);
const all = model.networks.flatMap(n => n.blocks);
const get = p => all.find(b => b.path === p);
const permit = get("//Network1/FBAndLvCurrentPermit"), set = get("//Network1/FBAndLvSetPermit");
const rs = get("//Network1/FBRs1"), or = get("//Network1/FBOr17");
const healthy = { b_EStop_Ok:true,in_ES_NC_1:true,in_ES_NC_2:true,in_InterLock_NC_1:true,in_InterLock_NC_2:true,
  in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,in_Estop_PLC:false };
function make(blocks) { const r = new SalRuntime({ ...model, networks:[{ blocks }] }, { unconnectedInput:false }).setInputs(healthy); r.values.set("//Network1/FBAnd1/AndOut",true); // Explicit excluded PLCproducer healthy boundary; pulse suite executes the actual producer.
 return r; }
function noReset(r) { r.values.set(rs.inputs.find(p => p.name === "Reset").path,false); }
function seed(r,value) { r.memory.set(rs.path,{ value }); r.write(rs.outputs[0],value); }

test("LV LV254 sole Set path and original aggregate sources, reviewed222 order", () => {
 // Approved baseline+explicit v2 delta; no source masking.
 V2.energy('LV');


});

// G1 v8 (lead 2026-10-22; analyst E2b-dev §2.3, D-E2d-1; V14-Q7 "Б1", Q-RC-03(b1), IL-05b(2)): NC1/NC2 rows on the shared LV aggregate are
// route-dependent (Step12 = Safe->R&D: Set executes; legacy Network5 b_Step2: forbidden) - judged in the paired-producer test, not here.
const ROUTE_DEP=new Set(["in_InterLock_NC_1","in_InterLock_NC_2"]);
test("LV current SAL: permission truth table and preserved already-latched LV", () => {
  for (const aggregate of [false,true]) for (const fault of [null,...Object.keys(healthy)]) {
    if (fault && ROUTE_DEP.has(fault) && aggregate) continue; // G1 v9 (review G1 v8 m-20): rows 'aggregate FALSE + NC' kept (no Set either way)
    const r = make([permit,set,rs]); noReset(r);
    r.values.set(or.outputs[0].path,aggregate);
    if (fault) r.setInputs({ [fault]:!healthy[fault] });
    r.scan(); assert.equal(r.get("out_LV_C1"),aggregate && !fault,`${aggregate}/${fault}`);
  }
  for (const fault of Object.keys(healthy)) {
    const r = make([permit,set,rs]); noReset(r); seed(r,true);
    r.values.set(or.outputs[0].path,true); r.setInputs({ [fault]:!healthy[fault] }).scan();
    assert.equal(r.get("out_LV_C1"),true,`Set gating does not introduce Reset: ${fault}`);
  }
});

test("LV current SAL: paired real producer prehistory denies stale Set on first fault scan", () => {
  const producer = get("//Network11/FBAnd1");
  for (const route of ["Step12","legacy-Network5"]) for (const fault of [null,...Object.keys(healthy)]) {
    const r = make([permit,set,rs,or,...(route === "Step12" ? [producer] : model.networks.find(n => n.name === "Network5").blocks)]); noReset(r);
    r.setInputs({ in_False_SI2_CH8:false,b_Step12:route === "Step12",b_Step2:route !== "Step12" });
    for (let scan = 0; scan < 100 && !r.get(or.outputs[0].path); scan++) r.scan();
    assert.equal(r.get(or.outputs[0].path),true,`producer prehistory ${route}`);
    assert.equal(r.get("out_LV_C1"),false,`LV not yet latched ${route}`);
    if (fault) r.setInputs({ [fault]:!healthy[fault] });
    const allowed = !fault || (route === "Step12" && ROUTE_DEP.has(fault)); // V14-Q7 on Safe->R&D only
    r.scan(); assert.equal(r.get("out_LV_C1"),allowed,`identical prehistory next scan ${route}/${fault}`);
  }
});
