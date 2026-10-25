// E0 stand: frozen copies of historical/reference sources that tests used to
// obtain at runtime via `git show <commit>:<path>` or from the sibling
// reference checkout. The suite must not depend on .git or on another repo.
// Every read verifies the exact SHA256 recorded in fixtures/pinned/MANIFEST.json
// and the manifest's own expected SHA below; there is deliberately NO fallback
// to git or to the sibling repository.
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const pinnedDir = new URL("../fixtures/pinned/", import.meta.url);
const manifestUrl = new URL("MANIFEST.json", pinnedDir);
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

// Expected manifest identity, so a refreshed manifest cannot silently re-pin.
export const PINNED_MANIFEST_SHA256 = "8d55c261d33b8d7546592aa2c78a27c2649c1c91315bdc0d0768a17ff7c6fd06";

let cache = null;
function manifest() {
  if (cache) return cache;
  if (!fs.existsSync(manifestUrl)) throw new Error(`Pinned source manifest missing: ${fileURLToPath(manifestUrl)}`);
  const bytes = fs.readFileSync(manifestUrl);
  if (sha(bytes) !== PINNED_MANIFEST_SHA256)
    throw new Error("Pinned source manifest SHA256 mismatch; do not refresh pins to match a changed source");
  cache = JSON.parse(bytes.toString("utf8"));
  return cache;
}

function entry(select) {
  const found = manifest().entries.filter(select);
  if (found.length !== 1) throw new Error(`Pinned source lookup must match exactly one entry (got ${found.length})`);
  return found[0];
}

function load(e) {
  const url = new URL(e.file, pinnedDir);
  if (!fs.existsSync(url)) throw new Error(`Pinned source file missing: ${e.file}`);
  const bytes = fs.readFileSync(url);
  if (sha(bytes) !== e.sha256) throw new Error(`Pinned source SHA256 mismatch for ${e.id}`);
  return { bytes, path: fileURLToPath(url), entry: e };
}

/** Exact replacement for `git show <commit>:<repoPath>` (commit may be abbreviated, >=7 hex). */
export function pinnedGitShow(commit, repoPath, encoding = "utf8") {
  if (!/^[0-9a-f]{7,40}$/i.test(commit)) throw new Error(`Invalid commit id ${commit}`);
  const e = entry(x => x.kind === "git-blob" && x.repository === "MEN001_Dyno_v2" &&
    x.commit.toLowerCase().startsWith(commit.toLowerCase()) && x.repoPath === repoPath);
  const { bytes } = load(e);
  return encoding ? bytes.toString(encoding) : bytes;
}

/** Frozen copy of the reference SAL (vadim848/MEN001_Dyno, Prodoction, 4495a1f, working-tree bytes). */
export function pinnedReferenceSalPath() {
  return load(entry(x => x.kind === "reference-working-tree" && x.repoPath === "MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal")).path;
}

export function pinnedManifest() { return manifest(); }
