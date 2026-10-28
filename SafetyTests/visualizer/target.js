// VIS target store: canonical program (default) or uploaded SAL/SGVL (+diagram, alias devices) in a temp dir.
// Uploaded files are untrusted: parsed only, never executed. Size limit 20 MB per request (server.js).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { resolveTarget, DEFAULT_DIR } from "../test/helpers/catalog-program.js";

const sha = buf => crypto.createHash("sha256").update(buf).digest("hex");
const targets = new Map();

export function canonicalTarget() {
  if (targets.has("canonical")) return targets.get("canonical");
  const t = resolveTarget(process.env.VIS_CANONICAL_DIR || DEFAULT_DIR);
  const salB = fs.readFileSync(t.sal), sgvlB = fs.readFileSync(t.sgvl);
  const rec = { id: "canonical", canonical: true, dir: t.dir, sal: t.sal, sgvl: t.sgvl, salName: path.basename(t.sal), sgvlName: path.basename(t.sgvl),
    salSha256: sha(salB), sgvlSha256: sha(sgvlB), hasDiagram: fs.existsSync(t.sal + ".diagram") };
  targets.set("canonical", rec); return rec;
}

// files: [{name, base64}]. Roles by extension: .sal, .sgvl, .diagram, .sds (alias devices; relative path kept).
export function storeUpload(files) {
  if (!Array.isArray(files) || !files.length) throw new Error("no files");
  let sal, sgvl, diagram; const sds = [];
  for (const f of files) {
    if (typeof f?.name !== "string" || typeof f.base64 !== "string") throw new Error("invalid file format");
    const buf = Buffer.from(f.base64, "base64"); const n = f.name.replace(/\\/g, "/");
    const lower = n.toLowerCase();
    if (lower.endsWith(".diagram")) diagram = { name: path.basename(n), buf };
    else if (lower.endsWith(".sal")) sal = { name: path.basename(n), buf };
    else if (lower.endsWith(".sgvl")) sgvl = { name: path.basename(n), buf };
    else if (lower.endsWith(".sds")) {
      const parts = n.split("/").filter(Boolean); const i = parts.findIndex(p => p.toLowerCase() === "alias devices");
      const rel = (i >= 0 ? parts.slice(i + 1) : parts.slice(-1));
      if (!rel.length || rel.some(p => p === ".." || p === "." || /^[a-zA-Z]:$/.test(p))) throw new Error("invalid path: " + f.name);
      sds.push({ rel, buf });
    } else throw new Error("unknown file type: " + f.name);
  }
  if (!sal || !sgvl) throw new Error("both .sal and .sgvl files are required");
  const salSha256 = sha(sal.buf), sgvlSha256 = sha(sgvl.buf);
  const id = sha(Buffer.concat([Buffer.from(salSha256), Buffer.from(sgvlSha256), diagram?.buf ?? Buffer.alloc(0), ...sds.map(s => s.buf)])).slice(0, 12);
  const dir = path.join(os.tmpdir(), "men001-vis", id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "TwinSafeGroup1.sal"), sal.buf);
  fs.writeFileSync(path.join(dir, "GVL1.sgvl"), sgvl.buf);
  if (diagram) fs.writeFileSync(path.join(dir, "TwinSafeGroup1.sal.diagram"), diagram.buf);
  for (const s of sds) { const p = path.join(dir, "Alias Devices", ...s.rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s.buf); }
  const rec = { id, canonical: false, dir, sal: path.join(dir, "TwinSafeGroup1.sal"), sgvl: path.join(dir, "GVL1.sgvl"), salName: sal.name, sgvlName: sgvl.name,
    salSha256, sgvlSha256, hasDiagram: !!diagram };
  targets.set(id, rec); return rec;
}
export function getTarget(id) {
  if (!id || id === "canonical") return canonicalTarget();
  const t = targets.get(id); if (!t) throw new Error("unknown target: " + id); return t;
}
export function removeTarget(id) { const t = targets.get(id); if (!t || t.canonical) return; targets.delete(id); try { fs.rmSync(t.dir, { recursive: true, force: true }); } catch { /* best effort */ } }
export const uploadIds = () => [...targets.values()].filter(t => !t.canonical).map(t => t.id);
