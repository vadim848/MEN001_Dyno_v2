// S1: ONE structural check on the target program (CATALOG_SAL_DIR aware).
// native preflight (singleton usages/wrappers, no graphical inter-network wire) + typed binding audit
// + native CRC/validation (Beckhoff SALDesigner reload-only, scripts/native-crc.ps1) + FB count <= 512.
// Exit: 0 PASS, 1 FAIL, 3 ERROR. No new semantics: reuses src/sal-native-structure.js, src/sal-parser.js.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { inspectNativeSalStructure } from "../src/sal-native-structure.js";
import { parseSalFile } from "../src/sal-parser.js";
import { inputRuleCheck } from "../src/sal-input-rule.js";

const root = fileURLToPath(new URL("../", import.meta.url));
export const FB_LIMIT = 512;
export function targetPaths() {
  const dir = path.resolve(process.env.CATALOG_SAL_DIR || path.join(root, "../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1"));
  const sal = path.join(dir, "TwinSafeGroup1.sal");
  let sgvl = path.join(dir, "GVL1.sgvl");
  if (!fs.existsSync(sgvl)) sgvl = path.join(dir, "../GVLs/GVL1.sgvl");
  return { dir, sal, sgvl, diagram: sal + ".diagram" };
}
const sha = f => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

export function structureCheck() {
  const t = targetPaths();
  const r = { target: t.dir, sal: t.sal, salSha256: null, sgvlSha256: null, checks: [], status: "PASS" };
  const add = (name, status, detail) => { r.checks.push({ name, status, detail }); if (status !== "PASS" && r.status !== "ERROR") r.status = status; };
  for (const f of [t.sal, t.sgvl]) if (!fs.existsSync(f)) { add("files", "ERROR", `missing ${f}`); return r; }
  r.salSha256 = sha(t.sal); r.sgvlSha256 = sha(t.sgvl);
  const nat = inspectNativeSalStructure(fs.readFileSync(t.sal, "utf8"));
  r.counts = nat.counts;
  add("native preflight (singleton usages/wrappers, no inter-network wiredLink)", nat.status === "PASS" ? "PASS" : "FAIL", nat.status === "PASS" ? `crossNetworkWires=${nat.counts.crossNetworkWires}` : nat.errors.slice(0, 10));
  try {
    const m = parseSalFile(t.sal, { bindingMode: "current", sgvlPath: t.sgvl });
    r.recordedCrc = m.crc;
    add("typed binding audit", m.bindingAudit.status === "PASS" ? "PASS" : "FAIL", { status: m.bindingAudit.status, errors: m.bindingAudit.errors.slice(0, 10), globalReferences: m.bindingAudit.globalRefs.length, canonicalWires: m.bindingAudit.edges.length });
    const ir = inputRuleCheck(m, t.dir);
    r.inputRule = { aliasOrigin: ir.aliasOrigin, errors: ir.errors };
    add("native input rule (safe-only in-ports, AND >=2 active inputs)", ir.status, ir.errors.map(e => `${e.kind}: ${e.network}/${e.block}${e.port ? "." + e.port : ""}${e.symbol ? " <- " + e.symbol : ""}`));
  } catch (e) { add("typed binding audit", "FAIL", String(e.message).split("\n").slice(0, 5)); }
  const blocks = nat.counts?.blocks ?? -1;
  add(`FB count <= ${FB_LIMIT}`, blocks >= 0 && blocks <= FB_LIMIT ? "PASS" : "FAIL", blocks);
  if (process.env.STRUCT_SKIP_NATIVE === "1") add("native CRC", "NOT VERIFIED", "skipped by STRUCT_SKIP_NATIVE=1");
  else if (!fs.existsSync(t.diagram)) add("native CRC", "ERROR", `missing diagram ${t.diagram}`);
  else {
    const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "native-crc-")), "r.json");
    const p = spawnSync("powershell", ["-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-File", path.join(root, "scripts/native-crc.ps1"), "-SalPath", t.sal, "-DiagramPath", t.diagram, "-ResultPath", out], { encoding: "utf8", timeout: 300000 });
    let n = null; try { n = JSON.parse(fs.readFileSync(out, "utf8").replace(/^﻿/, "")); } catch {}
    if (!n) add("native CRC", "ERROR", `native host failed: ${(p.stderr || p.stdout || p.error?.message || "").slice(0, 300)}`);
    else {
      r.native = { crcValid: n.nativeCrcValid, calculatedCrc: n.nativeCalculatedCrc, recordedCrc: r.recordedCrc, networks: n.networks, blocks: n.blocks, symbols: n.symbols, inPorts: n.inputPorts, outPorts: n.outputPorts, validationErrors: n.validationErrors, validationWarnings: (n.validationWarnings ?? []).length, salUnchanged: n.salUnchanged };
      add("native CRC + native validation", n.status === "PASS" && n.salUnchanged ? "PASS" : n.status === "ERROR" ? "ERROR" : "FAIL", { status: n.status, crcValid: n.nativeCrcValid, calculated: n.nativeCalculatedCrc, recorded: r.recordedCrc, validationErrors: n.validationErrors, exception: n.exception?.slice(0, 200) });
    }
  }
  return r;
}
export function printStructure(r) {
  console.log(`structure target: ${r.target}`);
  console.log(`structure SAL SHA256: ${r.salSha256}`);
  if (r.counts) console.log(`structure counts: networks=${r.counts.networks} blocks=${r.counts.blocks} ports=${r.counts.ports} symbols(variables)=${r.counts.variables} wires=${r.counts.wires}${r.native ? ` | native: networks=${r.native.networks} blocks=${r.native.blocks} symbols=${r.native.symbols} ports=${(r.native.inPorts ?? 0) + (r.native.outPorts ?? 0)}` : ""}`);
  for (const c of r.checks) console.log(`structure ${c.status}: ${c.name}${c.status === "PASS" ? "" : " -> " + JSON.stringify(c.detail)}`);
  console.log(`structure: ${r.status}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = structureCheck(); printStructure(r);
  if (process.env.STRUCTURE_OUT) fs.writeFileSync(process.env.STRUCTURE_OUT, JSON.stringify(r, null, 1));
  process.exitCode = r.status === "PASS" ? 0 : r.status === "ERROR" ? 3 : 1;
}
