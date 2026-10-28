# VIS-3 — SAL trainer: button-filter readiness + English UI (architect, 2026-10-28)

Binding: SCENARIO_DECISIONS.md "## VIS-3" (VIS-3-Q1 = В, VIS-3-Q2). Base: VIS_PLAN.md, VIS-2 commit 23290bb.
Canonical (read-only, in v2): `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`
sha256 `53e9a6d8220c3407002a2ade8d9292d9c11e13270b9307f0cbb3e0d65a6b8fbb`; `GVLs/GVL1.sgvl` `8a3d452c3d671bae6e003896543aaa2378c4da7a9ec1285ff8479d118a632ff9`.
Display-only stage: no SAL/SGVL, stand (`src/**`, `test/helpers/**`, `test/catalog/**`), catalog or exam-logic changes.

## 1. SAL flag found (Q1)
- Block `//RndPhysicalCompact/RELEASE`, `safeTon`, preset **2 s**, ooe 216. Flag = port `//RndPhysicalCompact/RELEASE/TonOut`
  (wire only, **no Symbol**). Runtime read: `x.r.get("//RndPhysicalCompact/RELEASE/TonOut")`; own progress: `x.r.memory.get("//RndPhysicalCompact/RELEASE").elapsedMs`.
- Polarity: TRUE = re-armed/ready (release pause complete). Consumers: GATE_014/AndIn1, GATE_016/AndIn4 (STATE_A set = step attempt), STATE_PF/Reset, SF_ACK/AndIn2, SF_ACKC/Reset.
- TonIn = GATE_008/AndOut (Symbol `recRndC_P`) = GATE_001 (permit: NOT in_Estop_PLC, b_EStop_Ok, linkSafeMode, linkSafeConnectorScope)
  AND GATE_002 (NOT in_Reset_PB AND NOT in_Relase_Door_PB; "Make Contact (NO)" = negated in this encoding) AND NOT recRndC_SG (prev scan, via SNAP_0/DecOut6).
- Relation to p.9: TonOut TRUE on the scan where both buttons have been released continuously 2000 ms (first released scan elapsed=0;
  TRUE at first-released-scan + 2000). Measured on canonical (scratch sim, 1 ms scan): green 100 / BOTH Safe->R&D / BOTH R&D->Run /
  long hold 3 s: edge exactly release+2000. Cover loss 300 ms and LV-connector loss 300 ms during the pause do not reset it (matches K-09).
  Differs from p.9 by construction: FALSE while permit absent (Emergency, boot before Restart) -> see §3 scope.

## 2. Countdown source
- Computed **server-side in manual.js per scan** (polling in app.js would miss scans). Time = virtual model time `x.t`
  (1 scan = 1 ms, advances only by scans: run x speed / step / advance N), **not wall clock**.
- pressed(scan) = applied values `x.r.get("in_Reset_PB") || x.r.get("in_Relase_Door_PB")` after the scan (not the queue).
  relT = t of first scan with both released after the last pressed scan; session start counts as released from scan 1.
  modelReady = !pressed && (t - relT) >= 2000; progress = min(1,(t-relT)/2000). Constant 2000 ms = p.9 / K-08, not read from SAL.
- If in_Reset_PB or in_Relase_Door_PB is unmapped/absent: filter.available=false, "not checked" (buttons already disabled by VIS-2).

## 3. SAL flag for foreign SAL, divergence rule
- Lookup by structural identity in the loaded model: block path `//RndPhysicalCompact/RELEASE` with functionName `safeTon`
  (preset shown, not required to be 2 s). Not found -> SAL flag "not checked" (reason shown).
  Note: name mapping (mapping.js) cannot address it because the flag has no Symbol; applyMapping does not rename block paths,
  so a mapped foreign SAL with the same structure is found. Extending the mapping namespace with a pseudo-name = out of scope (open option).
- compared = filter.available && SAL flag found && status is exactly one of SAFE / RND. Otherwise "not compared (status X)".
  Reason: in EMG/boot the SAL flag is FALSE by permit (sim: 1011 / 3510 / 2001-scan mismatches all in EMG); p.9 governs
  button acceptance in Safe/R&D (K-08/K-09); in RUN BOTH is ignored (K-10).
- Tolerance 1 scan: diverged = modelReady != salFlag on >= 2 consecutive compared scans (sim: single 1-scan mismatch at EMG->SAFE edge).
- Expose live `diverged` + sticky `lastDivergedT` (cleared on next press) so a transient divergence during fast run is visible.
- Assumptions to record (non-blocking, confirm via lead): A-VIS3-1 lead's reading of "кнопка неактивна" — the big momentary
  Reset/Unlock/«Обе» buttons are disabled while !modelReady and not currently held (disable never releases a held button);
  raw input checkboxes stay usable so early presses (K-08 rejection) remain testable. A-VIS3-2 comparison scope SAFE/RND + 1-scan tolerance.

## 4. Changes (editor; files `SafetyTests/visualizer/*.js`, `visualizer/app/**`)
- manual.js: per-scan filter tracker in scan1(); `state().filter = {available, reason, presetMs:2000, relT, elapsed, progress, modelReady,
  sal:{found, path, presetMs, value, elapsed}|null, compared, diverged, lastDivergedT}`. No change to queue/hold/step semantics.
- app/app.js + style.css: under Reset/Unlock/«Обе»: progress bar (model countdown) -> "ready"; SAL flag chip (ready / not ready / not checked);
  "diverged" mark same style as VIS-2 `split`. Buttons disabled per A-VIS3-1.
- English (Q2): index.html (`lang="en"`, tabs Program / Name mapping / Exam / Manual mode, banner "model, not Verify/TwinCAT, not hardware,
  FBK plant simplified"), app.js, report.js (`lang="en"`, Part 1/Part 2, mapping section, divergence section), user-visible errors in
  server.js, manual.js, mapping.js, target.js, catalog.js, svg.js ("(reference)", "(in)"), trace.js, exam-worker.js.
  Status token "НЕ ПРОВЕРЕНО" -> "NOT CHECKED" (catalog.js + UI + report); canonical exam has none, so canonical output unchanged.
  Not translated: SAL signal/block names; stand catalog data (scenario titles are already English in lib/*.js; residual Cyrillic in a
  few stand `source`/fail strings e.g. "REC-ACCEPTED (тестировщик, S1-Q7)") shown as-is — stand is read-only (VIS-Q1).
  SCENARIO_CATALOG.md is not read by the visualizer, so no catalog-text translation question arises.
- Tester (`visualizer/test/**`): update Russian assertions in vis-static, vis-buttons (static), vis-exam-canonical, vis-exam-mutants,
  vis-mapping(-patterns) ("НЕ ПРОВЕРЕНО") to the English equivalents; add vis-filter.test.js.

## 5. Tests for the tester (oracle = p.9 / K-08 / VIS-3, not the implementation)
1. Canonical, Safe: green 100 ms -> filter.modelReady false until release+2000, true at release+2000 (+-1 scan); salFlag same; diverged never.
2. BOTH Safe->R&D and R&D->Run: same timing; compared=true; no divergence.
3. Early press at release+1500 (K-08) via raw input: accepted by API while button disabled; countdown restarts at the new release.
4. Countdown is model time: paused session -> t and elapsed frozen; advance 2000 -> ready; speed has no effect on the scan count.
5. EMG (in_ES_NC pair FALSE) -> compared=false, diverged=false; after Restart to SAFE no divergence beyond 1 scan.
6. Mutant A: canonical copy with RELEASE preset 1.5 s (uploaded target) -> in SAFE after a press diverged=true, lastDivergedT set.
7. Mutant B: RELEASE block renamed / absent -> sal "not checked", diverged=false; countdown still shown.
8. Mapping: in_Reset_PB unmapped -> filter.available=false, "not checked".
9. English: page `lang="en"`, tabs/banner in English; no Cyrillic in visible UI chrome and report chrome except SAL names and stand data;
   "NOT CHECKED" token; report standalone, no external refs.
10. Regression: all existing VIS tests (after string updates) green; vis-buttons pair/momentary semantics unchanged.

## 6. Invariants
- `cd SafetyTests; npm run check:software` summary identical before/after (record both; ignore only the known uncommitted EMG-OFF catalog red if still present, stated).
- Canonical exam per-ID statuses unchanged (vis-exam-canonical vs stand TAP).
- SAL/SGVL SHA above unchanged; no edits outside visualizer/** (editor) / visualizer/test/** (tester). No push; reference repo read-only.
