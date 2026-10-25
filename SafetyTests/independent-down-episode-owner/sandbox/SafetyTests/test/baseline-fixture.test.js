import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { baselineSalPath, assertBaselineBytes } from "../src/baseline-fixture.js";

test("BASELINE01 pinned SAL is intact and modified baseline bytes are rejected", () => {
  const bytes = fs.readFileSync(baselineSalPath);
  assert.doesNotThrow(() => assertBaselineBytes(bytes));
  const altered = Buffer.from(bytes);
  altered[0] ^= 1;
  assert.throws(() => assertBaselineBytes(altered), /SHA256 mismatch/);
});
