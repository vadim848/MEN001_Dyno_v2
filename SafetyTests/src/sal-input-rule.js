// S6: native input-rule check (Beckhoff HSafetyPLC verifier, as traced in safe-input-validation-repair/architect/*IL.txt):
//  (a) VerifyPortHasOnlySafeIoMappings: an in-port whose connected alias-device IO is Standard (non-safe) is an ERROR
//      "InPort <port> of <FB> can only be connected to safe inputs". VerifyFbAnd skips objectIndex==8 (AndIn1) only;
//      every other FB type / port is checked. FB outputs are safe, so there is no propagation through FBs.
//  (b) VerifyFbAnd: fewer than 2 Activated+connected input ports -> ERROR (applied to safeAnd only; safeOr with one
//      input is not reported by the native verifier on canonical E5 - see program/stand/S6/INPUT_RULE_CHECK.md).
// Standard-vs-safe alias device is read from "<SAL dir>/Alias Devices/**/*.sds" when present, else from the pinned
// fixtures/alias-safety-map.json (built by scripts/build-alias-safety-map.mjs from the same SDS files).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { elements } from "./sal-parser.js";

const root = fileURLToPath(new URL("../", import.meta.url));
export function loadAliasSafety(salDir) {
  const live = path.join(salDir, "Alias Devices");
  if (fs.existsSync(live)) {
    const map = {};
    (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith(".sds")) { const t = fs.readFileSync(p, "utf8"); const id = t.match(/<SDSID>(\d+)<\/SDSID>/)?.[1]; if (id) map[id] = { name: e.name, standard: /<StandardAliasDevice\b/.test(t) }; } } })(live);
    return { origin: live, devices: map };
  }
  const f = path.join(root, "fixtures/alias-safety-map.json");
  return { origin: f, devices: JSON.parse(fs.readFileSync(f, "utf8")).devices };
}

export function inputRuleCheck(model, salDir) {
  const alias = loadAliasSafety(salDir);
  const feeders = new Map();
  for (const v of model.variables) for (const t of v.targetPorts) { if (!feeders.has(t)) feeders.set(t, []); feeders.get(t).push(v); }
  const errors = [];
  for (const n of model.networks) for (const b of n.blocks) {
    const connected = p => p.sources.length || p.globals.length || feeders.has(p.path);
    for (const p of b.inputs) {
      if (b.type === "fBAnd" && p.objectIndex === "8") continue;
      for (const v of feeders.get(p.path) ?? []) {
        if (!v.alias || v.sourcePorts.length) continue; // alias with an FB writer = safe/standard OUTPUT symbol read back, not an input source
        const d = alias.devices[v.alias.sdsId];
        if (!d) errors.push({ kind: "unknown-alias-device", block: b.name, network: n.name, port: p.name, symbol: v.name, sdsId: v.alias.sdsId });
        else if (d.standard) errors.push({ kind: "safe-input-only", block: b.name, network: n.name, port: p.name, symbol: v.name, device: d.name, message: `InPort ${p.name} of ${b.instanceName ?? b.name} can only be connected to safe inputs` });
      }
    }
    if (b.type === "fBAnd") {
      const active = b.inputs.filter(p => p.channelInterface === "Activated" && connected(p)).length;
      if (active < 2) errors.push({ kind: "min-2-active-inputs", block: b.name, network: n.name, active, message: `${b.instanceName ?? b.name} does not have at least 2 input ports active and connected` });
    }
  }
  return { status: errors.length ? "FAIL" : "PASS", aliasOrigin: alias.origin, errors };
}
