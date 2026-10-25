// E2a-rename stand slice (lead item 4): operator rebind-global. One input read from exactly one
// global Symbol reads another EXISTING Symbol; SAL reference and SGVL TargetUsage change together
// and nothing else. Works on whatever source sits on the canonical paths (F1, R1, E2a sandbox).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { applyMutation, verifyMutation, sgvlVariables, operatorNames } from "../../src/sal-mutations.js";
import { validateSalBindings } from "../../src/sal-binding-validator.js";
import { parseSalFile } from "../../src/sal-parser.js";

const xml = fs.readFileSync(fileURLToPath(new URL("../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url)), "utf8");
const sgvlXml = fs.readFileSync(fileURLToPath(new URL("../../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl", import.meta.url)), "utf8");
const vars = sgvlVariables(sgvlXml);

// Candidate inputs (from the stand parser, which handles self-closing Networks/ports): inPort with
// exactly one global reference, no input-side wire and no wire/alias moniker naming it.
function globalInputs() {
  const model = parseSalFile(fileURLToPath(new URL("../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url)), { bindingMode: "fixture" });
  return model.networks.flatMap(n => n.blocks.flatMap(b => b.inputs.map(p => ({ block: b.path, port: p.name, p }))))
    .filter(({ p }) => p.globals.length === 1 && !p.sources.length)
    .map(x => ({ ...x, portId: x.p.Id, variable: vars.find(v => v.id === x.p.globals[0].variableId) }))
    .filter(x => x.variable && !xml.includes(`<inPortMoniker name="${x.block}/${x.port}"`));
}
const candidates = globalInputs();
const otherSymbol = cur => vars.find(v => v.id !== cur.id && v.sources.length && v.targetsClose >= 0).name;

function check(pick) {
  const m = { id: "T-REBIND", op: "rebind-global", block: pick.block, port: pick.port, value: { global: otherSymbol(pick.variable) } };
  const r = applyMutation(xml, m, { sgvlXml });
  assert.equal(typeof r.sgvl, "string");
  const v = verifyMutation(xml, r.xml, r.change, { sgvlXml, mutantSgvlXml: r.sgvl });
  assert.deepEqual(v.parsedDelta, [`${pick.block}/${pick.port}`]);
  assert.equal(v.bindingValidation, "PASS");
  assert.equal(validateSalBindings(r.xml, r.sgvl).status, "PASS");
  assert.equal(r.change.after, `GVL1.${m.value.global}`);
  assert.equal(applyMutation(xml, m, { sgvlXml }).sgvl, r.sgvl, "deterministic");
  // The mutant SAL with the ORIGINAL SGVL is inconsistent: the SGVL edit is load-bearing.
  assert.notEqual(validateSalBindings(r.xml, sgvlXml).status, "PASS");
  return r;
}

test("REBIND-1: rebind-global is a stand operator; exact SAL+SGVL delta, binding PASS (shared and last-reader Symbol)", () => {
  assert.ok(operatorNames().includes("rebind-global"));
  const shared = candidates.find(c => c.variable.targets.length > 1);
  const last = candidates.find(c => c.variable.targets.length === 1);
  assert.ok(shared && last, "source has both kinds of global readers");
  assert.equal(check(shared).change.oldSymbolOrphaned, false);
  assert.equal(check(last).change.oldSymbolOrphaned, true);
});

test("REBIND-2: refusals — no SGVL, unknown/same Symbol, wired input, symbol without writer; tampered delta is rejected", () => {
  const pick = candidates[0];
  const base = { op: "rebind-global", block: pick.block, port: pick.port };
  assert.throws(() => applyMutation(xml, { ...base, value: { global: otherSymbol(pick.variable) } }), /needs the SGVL text/);
  assert.throws(() => applyMutation(xml, { ...base, value: { global: "NoSuchSymbol_x" } }, { sgvlXml }), /not found in SGVL/);
  assert.throws(() => applyMutation(xml, { ...base, value: { global: pick.variable.name } }, { sgvlXml }), /no-op/);
  assert.throws(() => applyMutation(xml, { ...base, value: { global: "temporary SAL variable on X" } }, { sgvlXml }), /needs value.global/);
  const wired = xml.match(/<wiredLink\b[^>]*>\s*<inPortMoniker name="(\/\/[^/"]+\/[^/"]+)\/([^"]+)"/);
  assert.throws(() => applyMutation(xml, { op: "rebind-global", block: wired[1], port: wired[2], value: { global: otherSymbol(pick.variable) } }, { sgvlXml }), /exactly one global Symbol reference|moniker/);
  const noWriter = sgvlXml.replace(new RegExp(`(<Name>${otherSymbol(pick.variable)}</Name>\\s*<SourceUsages>)[\\s\\S]*?(</SourceUsages>)`), "$1$2");
  assert.throws(() => applyMutation(xml, { ...base, value: { global: otherSymbol(pick.variable) } }, { sgvlXml: noWriter }), /no writer/);
  const r = applyMutation(xml, { ...base, value: { global: otherSymbol(pick.variable) } }, { sgvlXml });
  assert.throws(() => verifyMutation(xml, r.xml, r.change, { sgvlXml, mutantSgvlXml: sgvlXml }), /SGVL delta mismatch/);
  assert.throws(() => verifyMutation(xml, r.xml, r.change, { sgvlXml, mutantSgvlXml: r.sgvl.replace("<Name>", "<Name>x") }), /SGVL delta mismatch|binding/);
});
