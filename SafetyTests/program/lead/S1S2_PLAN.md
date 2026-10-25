# S1 + S2 — lead plan (D-RESUME-S1S2, 2026-10-23)

Lead: new lead session (replaces local_248478bf…). Process: WORKFLOW.md «ДЕЙСТВУЮЩИЙ ПРОЦЕСС — компактный».
Catalog: program/lead/SCENARIO_CATALOG.md. Decisions: program/DECISIONS_DIGEST.md → SCENARIO_DECISIONS.md (grep by ID).

## File ownership (one writer per path; enforced by .claude/hooks/path-guard.mjs)

| Role | Owns in S1/S2 |
|---|---|
| v2-tester | `SafetyTests/test/catalog/**`, `SafetyTests/test/helpers/**`, `SafetyTests/program/tester/S1/**` |
| v2-stand-engineer | `SafetyTests/src/**`, `SafetyTests/scripts/**`, `SafetyTests/package.json`, `SafetyTests/test/archive/**` (moves via `git mv`), stand self-check tests, `SafetyTests/program/stand/S1/**` |
| v2-architect | `SafetyTests/program/architect/E2-S2/**` |
| v2-editor | `SafetyTests/candidates/E2e/**`, `SafetyTests/program/editor/E2e/**` (E2d v7.7 stays frozen) |
| v2-runner | `SafetyTests/program/runs/**` |
| v2-reviewer | `SafetyTests/program/reviewer/S2/**` |

Canonical `MEN001_Dyno/Safety_Dyno/**` is NOT touched until Vadim's OK.

## S1 interface contract (tester ⇄ stand engineer)

- Catalog tests: `SafetyTests/test/catalog/*.test.js`, `node:test`.
- Target program selected by env `CATALOG_SAL_DIR` = folder with `TwinSafeGroup1.sal`, `GVL1.sgvl`
  (default: canonical `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1`). Report header prints path + SAL SHA256.
- Each test name starts with `[<Stage>] <ID>` (e.g. `[E2] K-01 …`). Stage filter via env
  `CATALOG_STAGES=E2` (comma list); tests of other stages are skipped (reported as skip, not pass).
- Mutations (catalog section M): `SafetyTests/test/catalog/mutations.test.js` (tester) — each of 12
  mutations applied in memory to the target SAL, its killing scenario must FAIL; name `[M] M-xx …`.
- `npm run check:software` (stand) = catalog (all stages, exit≠0 on any FAIL — honest) + ONE structural
  check (native preflight incl. singleton usages/wrappers and no inter-network wiredLink, native CRC,
  FB count ≤ 512) + kept stand self-checks (FB semantics, runtime, delta/CRC). Also
  `npm run check:catalog` with `CATALOG_SAL_DIR` / `CATALOG_STAGES` pass-through. Output summary JSON
  to `SafetyTests/program/runs/` only when run by the runner.
- On canonical F1 many E2+ scenarios are expected to FAIL (not implemented yet): that is the honest baseline.

## S2

1. Architect: short fix plan for the 4 E2d v7.7 defects → `program/architect/E2-S2/PLAN.md`.
2. Editor: copy `candidates/E2d/native` → `candidates/E2e/native`, implement plan there.
3. After S1 ready: runner runs `CATALOG_SAL_DIR=candidates/E2e/native CATALOG_STAGES=E2` + structural + M.
4. One reviewer pass (plan + diff E2d→E2e and F1→E2e + catalog results) → gate → package to coordinator.
