# VIS-3 editor notes (2026-10-28)

Plan: program/architect/VIS3_PLAN.md. Display only; SAL canonical sha256 53e9a6d8...a6b8fbb unchanged (not touched). No commits.

## API: manual state `GET /api/manual/state` -> `filter`
```
filter = { available, reason, presetMs:2000, relT, elapsed, progress(0..1), modelReady, pressed,
  sal: { found, path, presetMs, value, elapsed, reason? } , compared, notComparedReason, diverged, lastDivergedT }
```
- Time = model time x.t (scans). relT = t of first scan with both in_Reset_PB/in_Relase_Door_PB (applied values) FALSE after last pressed scan; null while pressed;
  session start: relT = t0+1. elapsed = t-relT (0 while pressed). modelReady = !pressed && elapsed >= 2000 (constant, p.9/K-08).
- available=false (reason set, everything else zero/null) when either button input is unmapped.
- sal: block path `//RndPhysicalCompact/RELEASE` + functionName `safeTon`; value = r.get(path + "/TonOut"); found=false -> reason "NOT CHECKED ...", value null.
- compared = sal.found && status is exactly SAFE or RND. diverged = modelReady != sal.value on >= 2 consecutive compared scans (live; resets when not).
  lastDivergedT = t of latest diverged scan; sticky, cleared on next press (pressed scan).
- UI: big Reset/Unlock/Both buttons get progress bar + chip, `disabled`/class `wait` while !modelReady and not held (A-VIS3-1); raw checkboxes untouched.

## Assumptions
- A-VIS3-1: "button inactive" = big momentary buttons disabled while !modelReady and not currently held; raw input checkboxes remain usable.
- A-VIS3-2: comparison only in SAFE/RND, tolerance 1 scan (streak >= 2).
- Initial relT = t0+1 (session start counts as released).

## Files changed (SafetyTests/visualizer)
manual.js (filter tracker + English errors), app/app.js, app/index.html, app/style.css, report.js, server.js, catalog.js, exam-worker.js,
mapping.js, target.js, svg.js, trace.js, README.md. Token "НЕ ПРОВЕРЕНО" -> "NOT CHECKED" (catalog.js, server.js totals, report.js, app.js).
Note: app.js status label for TODO unchanged ("TODO (NOT VERIFIED)"). No Cyrillic left in visualizer/*.js and app/** (checked by grep).

## Self-check (not a requirement PASS)
- Smoke (canonical, plant on): boot EMG -> green 100 ms -> release at t=3101: modelReady true at 5101..5105 sampled, SAL flag true (<=5105), compared in SAFE, diverged never, lastDivergedT null.
  In EMG: sal=false, compared=false, diverged=false.
- node --test visualizer/test/*.test.js: see below.
  38 tests, 20 pass, 18 fail (counting subtests). Failing top-level: vis-buttons #2 (Russian chrome strings), vis-exam-canonical #3 (report text), vis-exam-mutants #4 (report text),
  vis-manual #5 (speed-limit message "скорость 0.1…10" now "speed 0.1..10"), vis-mapping-patterns #6 and vis-mapping #7 ("НЕ ПРОВЕРЕНО" token -> "NOT CHECKED"),
  vis-static #10 (Russian tab names). Expected: Russian-string assertions, tester to update.
  Not caused by VIS-3: vis-regress #8 (asserts stale canonical SAL SHA 9e5bfb15..., current is 53e9a6d8... after EMG-OFF), #9 (check:software baseline compare; not re-verified here, same EMG-OFF cause suspected).
- No new FAIL in npm run check:software expected (stand untouched); not re-run by editor.

## VIS-3-Q3 update (2026-10-28)
- A-VIS3-1 WITHDRAWN. Big Reset/Unlock/Both buttons are never disabled by the filter (no `disabled`, no `wait`); only class `cnt` (orange inset outline, non-blocking) while counting and not held.
  `disabled` remains only for unmapped/constant signals (VIS-2). Press/pointer handlers unchanged.
- Press/release semantics (probe with the real server, canonical, step-wise; scratchpad vis3_probe.mjs): every applied press -> relT=null, elapsed=0, lastDivergedT cleared;
  every release -> relT = release scan, ready exactly at relT+2000 (green 100 ms; press at +1000 of a running countdown then release -> restarts, ready at new release+2000; Both hold 1100 ms -> ready release+2000). Chip text now "N ms left of 2000".
- "3 s timer" investigation: the filter countdown itself is 2000 ms of model time (FILTER_MS constant, progress = elapsed/2000, model time not wall clock; the speed selector cannot make it 3 s at x1).
  Concrete 3000-ms sources visible in the same manual page: (a) generic Timers panel lists SAL timers //Network1/HB_T_HI and HB_T_LO (heartbeat, preset 3000 ms, e.g. "HB_T_LO 499/3000" in SAFE/EMG) -
  most likely what was seen as "a 3-second timer"; (b) Both: 1 s hold + 2 s = ~3 s from press to ready; (c) the RELEASE safeTon in the Timers panel keeps elapsed counting above its preset (e.g. 4103/2000) and starts only after permit (EMG->SAFE), so in the boot-restart case the SAL flag can lag the model by 1 scan.
  No code defect found in the 2 s countdown (verified: ready = release+2000 in all probed cases). Not conclusive about the demo snapshot; if Vadim saw it in the filter chip/bar, please get the exact screen/speed. Display changes made: chip says "left of 2000".

## server.js exam race fix
Exam worker failure "worker process exited with code 0" while a manual session runs at x10: `child.on("exit")` can fire before the pending IPC result message is delivered
(parent loop busy with manual tick, up to MAX_PER_TICK=2000 synchronous scans). Fixed: server.js startExam now uses `child.on("close", ...)` (after IPC channel closed and messages delivered);
non-zero code and missing-result are still both failures. No other 'exit' listeners on children in visualizer/*.js. Manual tick is not redesigned (a tick blocks the loop for the scan time only; exam is a separate process).
