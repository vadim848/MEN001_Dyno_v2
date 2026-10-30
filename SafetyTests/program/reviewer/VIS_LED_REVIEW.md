# VIS-LED review (independent, one pass, 2026-10-29)

Object (uncommitted, HEAD 4522523): visualizer/led.js (new), manual.js, app/app.js, app/index.html, README.md; test visualizer/test/vis-led.test.js.
Requirement: SCENARIO_DECISIONS.md VIS-LED (l.2161), Q-LED-5 (l.2163), NIV-GAPS Q-LED-1..4; truth table program/analyst/NIV_LED_TRUTH_TABLE.md.
Run: `node --test visualizer/test/vis-led.test.js visualizer/test/vis-manual.test.js` -> 38/38 pass. Full suite / check:software not run (per instruction).

## Checks
- Display only: led.js only reads `rt.get()`; manual.js adds `this.led.scan(this.x.r)` after `x.step` and `led: this.led.state()` in state(). No writes to x.r / inputs / queue / timeline `record()`. Only importer of led.js is manual.js (+ test); exam-worker/catalog paths do not import it. Test "SAL run identical with and without panel scans" (5000 scans, all P.names, status changes) confirms. OK.
- Cost: per 1 ms scan one replica scan + ~17 `rt.get`; classification (3 throwaway replicas, dt 0) only in state(), cached by scan counter. OK.
- Bindings: test derives oracle independently from tsproj links (stTwinSAFE_IN field -> Standard Out Var N) joined to SAL aliasDeviceIoUsage sdsId N (target side; DoorMonitor via Standard In Var 16, source side) and cross-checks the lead list; stepRnD = sdsId 95 = outPLC_RnD; panel bindings deepEqual oracle. SolenoedMonitor not bound, constant FALSE (Q-LED-5); test also forces any SAL SolenoedMonitor source TRUE and blue stays blink-slow (R&D, lid closed). OK.
- Classification: probing fresh replicas with bPulse / bFaultPulse forced 0/1 at dt 0 (no TON can elapse) identifies dependence on the pulse generators; slow/fast from the live t_BlinkTimeMs (500/1500) of the same inputs; fault only when STS_FAULT and output depends on bFaultPulse. Sound for the 'new' variant logic (lines 107-120 of act-led-control.mjs). Lamp on/off equals replica on every scan (stream test).
- Missing signals: unmapped keys stay FALSE (LED_INPUT_KEYS default) and are listed in `notMapped` / "LED inputs not mapped: ..." text; never an error. OK.
- XSS: mode, caption, solenoid, notMapped escaped via esc(); LED names and colour style are code constants. Bindings (SAL names) are not rendered. OK.
- UI English; caption "PLC LED logic replica (act_LED_Control), not PLC execution" present (tested via server).
- Test oracle: modes from truth-table row IDs (LED-R1..R4, G1-G3, G6, B1-B6, B8, B9, B11, T1, F1-F4), timing 1500/500/200 ms +-1 scan; not derived from led.js.

## Notes (non-blocking)
- N1 (low) vis-led.test.js: no test of the missing-signal path (a P without e.g. outPLC_RnD -> FALSE + notMapped listed, no throw). Logic is trivially correct by reading (led.js:19-23,33-34); add a negative case when convenient.
- N2 (low) Truth-table coverage partial: LED-R5, G4/G5/G7-G9, B7/B10, F5/F6 (F5 partly via stream), T2-T4 not individually asserted. Acceptable for a display-only feature; truth-table conformance of the replica itself is the replica's own test scope.
- N3 (info) Comparison stream test uses the shared replica as oracle for on/off (equivalence to replica, by design per VIS-LED); independent timing assertions cover the phases.
- N4 (info) Classification is a static snapshot per poll; a lamp momentarily equal to its pulse value is still labelled blink (correct intent).

Limits: software display replica only; says nothing about PLC execution or hardware LEDs. No native/IDE/target claim.

## Verdict: ACCEPT WITH NOTES (N1, N2 -> tester, optional).
