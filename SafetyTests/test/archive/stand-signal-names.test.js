// E2a-rename stand slice: source-aware names of the four D-ARCH-POL-RENAME variables.
// Self-contained (no candidates/ dependency): a renamed source is produced in memory
// from the canonical SAL by changing ONLY the four variable name attributes, which is
// exactly the E2a rename (same Id, same alias usage).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSalFile } from "../../src/sal-parser.js";
import { SIGNAL_RENAMES, resolveSignalNames, signalName, withActualNames, SignalNameError } from "../../src/signal-names.js";
import { physicalRndSource } from "../../src/physical-rnd-source.js";

const salPath = fileURLToPath(new URL("../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal", import.meta.url));
const sgvlPath = fileURLToPath(new URL("../../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl", import.meta.url));
// The working SAL may be either generation (F1/R1 legacy, E2a+ renamed); both texts are derived from it.
const sourceText = fs.readFileSync(salPath, "utf8");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stand-signal-names-"));
let n = 0;
// Same full binding audit as the working source (bindingMode current against canonical GVL1).
const parseSalText = xml => { const f = path.join(tmp, `v${n++}.sal`); fs.writeFileSync(f, xml); return parseSalFile(f, { bindingMode: "current", sgvlPath }); };
test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
const renameAttr = (xml, from, to) => {
  const needle = ` name="${from}" `;
  assert.equal(xml.split(needle).length, 2, `exactly one declaration of ${from}`);
  return xml.replace(needle, ` name="${to}" `);
};
const sourceIsRenamed = sourceText.includes(` name="${SIGNAL_RENAMES[0].renamed}" `);
const text = sourceIsRenamed ? SIGNAL_RENAMES.reduce((xml, r) => renameAttr(xml, r.renamed, r.legacy), sourceText) : sourceText;
const renamedText = sourceIsRenamed ? sourceText : SIGNAL_RENAMES.reduce((xml, r) => renameAttr(xml, r.legacy, r.renamed), text);
const legacyModel = parseSalText(text);
const renamedModel = parseSalText(renamedText);
const fake = names => ({ variables: names.map(name => ({ name })) });

test("RENAME-1: actual SAL selects the generation; legacy on canonical, renamed after D-ARCH-POL-RENAME", () => {
  assert.deepEqual(resolveSignalNames(legacyModel).generations, ["legacy"]);
  assert.deepEqual(resolveSignalNames(renamedModel).generations, ["renamed"]);
  for (const r of SIGNAL_RENAMES) {
    assert.equal(signalName(legacyModel, r.role), r.legacy);
    assert.equal(signalName(legacyModel, r.renamed), r.legacy);
    assert.equal(signalName(renamedModel, r.legacy), r.renamed);
  }
});

test("RENAME-2: neither, both or mixed generations are an ERROR, never a silent default", () => {
  const legacy = SIGNAL_RENAMES.map(r => r.legacy), renamed = SIGNAL_RENAMES.map(r => r.renamed);
  assert.throws(() => signalName(fake(["other"]), "in_HV_Healthy_FBK"), SignalNameError);
  assert.throws(() => signalName(fake([...legacy, "in_HV_Faulty_FBK"]), "in_LV_Healthy_FBK"), /Both legacy and renamed/);
  assert.throws(() => signalName(fake(["in_LV_Healthy_FBK", "in_HV_Faulty_FBK"]), "in_LV_Healthy_FBK"), /Mixed rename generations/);
  assert.throws(() => signalName(fake(renamed), "in_unknown"), /Unknown renamed signal/);
  assert.throws(() => withActualNames(fake(renamed), { in_HV_Healthy_FBK: true, in_HV_Faulty_FBK: true }), /given twice/);
  // A source without the HV variable makes the physical R&D source fail loudly.
  const withoutHv = parseSalText(renameAttr(text, "in_HV_Healthy_FBK", "in_HV_Unknown_FBK"));
  assert.throws(() => physicalRndSource(withoutHv, 10), SignalNameError);
});

test("RENAME-3: raw values are copied, never converted (D-ARCH-POL raw TRUE = fault on every source)", () => {
  const raw = { in_LV_Healthy_FBK: true, in_HV_Healthy_FBK: false, in_ES_NC_1: true };
  assert.deepEqual(withActualNames(renamedModel, raw), { in_LV_Faulty_FBK: true, in_HV_Faulty_FBK: false, in_ES_NC_1: true });
  assert.deepEqual(withActualNames(legacyModel, raw), raw);
});

test("RENAME-4: physical R&D source gives the identical trace on legacy and renamed names of the same SAL", () => {
  const run = model => {
    const x = physicalRndSource(model, 10);
    x.sample({ in_Reset_PB: true }); x.advance(600); x.sample({ in_Reset_PB: false }); x.advance(300);
    x.sample({ in_Relase_Door_PB: true }); x.advance(600); x.sample({ in_Relase_Door_PB: false }); x.advance(300);
    const actual = (name) => signalName(model, name);
    return { frames: x.frames.map(f => ({ t: f.timeMs, s: f.signals,
      lv: f.raw[actual("in_LV_Healthy_FBK")], hv: f.raw[actual("in_HV_Healthy_FBK")] })),
      rises: x.rises, boundaries: x.scope.boundaries.map(b => `${b.name}=${b.initialValue}`) };
  };
  const a = run(legacyModel), b = run(renamedModel);
  assert.ok(a.frames.length > 10, "observed frames");
  assert.deepEqual(b.frames, a.frames);
  assert.deepEqual(b.rises, a.rises);
  const mapped = a.boundaries.map(s => SIGNAL_RENAMES.reduce((x, r) => x.replace(r.legacy + "=", r.renamed + "="), s));
  assert.deepEqual(b.boundaries, mapped);
  // R0 nominal (lead 2026-10-22): raw FALSE (healthy per D-ARCH-POL) for both PS feedbacks on both sources.
  assert.ok(a.frames.every(f => f.lv === false && f.hv === false));

});
