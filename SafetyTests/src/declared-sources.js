// Declared source identities (stand E2-stand-g3, 2026-10-23). Read-only at run time: the record is
// fixtures/declared-sources/E2_DECLARED_SOURCES.json, built from the architect's PLAN by
// scripts/build-declared-sources.mjs. No PLAN, git or sibling repository is read here.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const DECLARED_SOURCES_FILE = fileURLToPath(new URL("../fixtures/declared-sources/E2_DECLARED_SOURCES.json", import.meta.url));
const digest = b => crypto.createHash("sha256").update(b).digest("hex");
const normalized = b => b.toString("utf8").replaceAll("\r\n", "\n");

let cache;
export function declaredSources() {
  cache ??= JSON.parse(fs.readFileSync(DECLARED_SOURCES_FILE, "utf8"));
  return cache;
}

/** Declared source whose SAL raw or portable (CRLF->LF) SHA equals the given one; null if none. */
export function declaredBySalSha(sha) {
  if (!sha) return null;
  return declaredSources().sources.find(s => s.rawSha256.sal === sha || s.normalizedSha256.sal === sha) ?? null;
}

/** Declared source of SAL bytes (raw or LF-normalized identity). */
export function declaredBySalBytes(bytes) {
  return declaredBySalSha(digest(bytes)) ?? declaredBySalSha(digest(normalized(bytes)));
}

/**
 * Lineage of a parsed model for normative case selection:
 *  1. the model's SAL file is a declared source -> that source;
 *  2. else SAL_LINEAGE_SHA256 names a declared source (a mutant/patch of it, set by the mutation runner) -> that source;
 *  3. else null (undeclared: callers must not guess a norm).
 */
export function lineageOf(model, env = process.env) {
  const file = model?.file instanceof URL ? fileURLToPath(model.file) : model?.file;
  let fileSha = null;
  if (file && fs.existsSync(path.resolve(file))) {
    const bytes = fs.readFileSync(path.resolve(file));
    const own = declaredBySalBytes(bytes);
    if (own) return { source: own, via: "file", fileSha256: digest(bytes) };
    fileSha = digest(bytes);
  }
  const declaredBase = declaredBySalSha(env.SAL_LINEAGE_SHA256);
  if (declaredBase) return { source: declaredBase, via: "SAL_LINEAGE_SHA256", fileSha256: fileSha };
  return { source: null, via: null, fileSha256: fileSha };
}
