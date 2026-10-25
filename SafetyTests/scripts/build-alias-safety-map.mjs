// Builds fixtures/alias-safety-map.json from an "Alias Devices" folder: sdsId -> {standard, name, sha256}.
// Usage: node scripts/build-alias-safety-map.mjs "<.../TwinSafeGroup1/Alias Devices>" [out]
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
const src = process.argv[2]; const out = process.argv[3] || new URL("../fixtures/alias-safety-map.json", import.meta.url);
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : p.endsWith(".sds") && files.push(p); } })(src);
const devices = {};
for (const f of files.sort()) {
  const buf = fs.readFileSync(f); const t = buf.toString("utf8"); const id = t.match(/<SDSID>(\d+)<\/SDSID>/)?.[1]; if (!id) continue;
  devices[id] = { name: path.relative(src, f).split(path.sep).join("/"), standard: /<StandardAliasDevice\b/.test(t), sha256: crypto.createHash("sha256").update(buf).digest("hex") };
}
fs.writeFileSync(out, JSON.stringify({ source: "MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/Alias Devices", count: Object.keys(devices).length, devices }, null, 1));
console.log(Object.keys(devices).length, "devices,", Object.values(devices).filter(d => d.standard).length, "standard");
