import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const baselineSha256 = "B1FA361F5647EBA2A5BB8436E4853D8773BA7F6B0ACBF1E7F96C519196251DAA";
export function assertBaselineBytes(bytes) {
  const hash = crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
  if (hash !== baselineSha256) throw new Error("Pinned v2 baseline SHA256 mismatch; do not refresh baseline to match candidate changes");
}
export const baselineSalPath = fileURLToPath(new URL("../fixtures/v2-4bb8703/TwinSafeGroup1.sal", import.meta.url));
assertBaselineBytes(fs.readFileSync(baselineSalPath));
