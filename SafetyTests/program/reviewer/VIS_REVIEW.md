# VIS review (reviewer, 2026-10-26)

Scope: HEAD 0eb79ea + uncommitted. Changed: visualizer/** (new), package.json (+1 script line), path-guard (VIS-PG, approved),
SCENARIO_DECISIONS/DIGEST/HANDOFF (lead). No changes under src/, scripts/, test/ (git status clean there).

## Verdict: REJECT (one blocking finding; rest ACCEPT-quality)

## Blocking
B1 (VIS-Q5, false PASS with unmapped signal) -> editor + tester.
Pattern-resolved symbols (P.sym kinds: CMD_*, HEARTBEAT, SAFETYFAULT=linkSafetyFault, FAULT=STS_FAULT, COVER_LOCKED, CFG)
are read via target P.sym(kind), not by the canonical name. If unmapped, target sym=null -> no r.get/setInputs of the
canonical name -> trace.js never records a touch.
Reproduced (scratch, in-process evaluate, same code path as exam-worker): copy of canonical with
CMD_SAFE_TO_RND->Xcmd_A, linkSafetyFault->Xlink_B; autoTable leaves both unmapped (unmapped list correct), but
- C-02, C-01: PASS, touched=[] (C-02 asserts "no fault" via s.fault===true; s.fault undefined -> vacuous PASS);
- G-03: FAIL "NOT IMPLEMENTED: SAFE_TO_RND", W-01: FAIL "SafetyFault not observable" (should be «не проверено», not FAIL).
Plan §5 intent ("unmapped OUT read by snap => every scenario «не проверено»") not met for these kinds.
Fix direction (editor): in worker, for kinds whose canonical Pc.sym(kind) is in U and target P.sym(kind) is null,
record a touch of the canonical name whenever sym(kind) is used / snap reads fault/plcFault/cover (e.g. wrap P.sym;
create() calls it -> covers forks and cached states). Tester: add rename cases for a pattern symbol (SafetyFault, one CMD,
HEARTBEAT) and for one OUT (e.g. out_LV_C1): affected scenarios must be «не проверено», none PASS/FAIL.

## Checked OK
- Reuse, no forks: parser/runtime/native preflight/structureCheck/runScenario/SCENARIOS/OUT imported from stand;
  model.parseTarget mirrors program() (3 lines, same calls). TAP semantics: fails->FAIL, else nv->TODO, matches register().
- Exam: structure part (mapping not applied) + catalog part run separately, catalog runs on structure FAIL/ERROR;
  CATALOG_STAGES/SYM_/FAULT_/PLANT_ env stripped; list = lib exports B..W (no M, no HDR); TODO and «не проверено»
  counted separately from PASS; touched => «не проверено» overrides FAIL (fails shown as info).
- Mapping: name->name only, 1:1, loaded name must exist, collision/residual-name fail-closed; no polarity field.
  Note: no kind check (our input may be mapped to a loaded output/internal) - user-visible, non-blocking.
- Divergence labelled diagnostic vs canonical trace, oracle = check messages; «недоступно» with reason when canonical FAILs
  or lanes differ. Report: banner, both SHA256, catalog version, mapping + U, FAIL details, inline SVG, no scripts; esc() used.
- Security: listen(127.0.0.1); static path resolve + prefix check (403); upload: base64 -> fixed file names in
  tmpdir/men001-vis/<id>, .sds rel path rejects ../. and drive; 28 MB body cap; uploaded content parsed only.
  Notes: no Host/Origin check (CSRF/DNS-rebinding from a browser page could start exams/uploads; no code exec);
  tmp dirs never cleaned; target id ignores .sds rel names.
- Instrumentation (SalRuntime.prototype patch) only installed in forked exam workers.

## Non-blocking notes
N1 Manual speed: x10 reaches ~x1.3-4; each 2000-scan tick blocks the server event loop ~1.5 s (inputs/polls delayed).
   Lag is shown honestly; suggest time-budgeted ticks (e.g. <=50 ms per tick). VIS-Q3 range nominal only.
N2 UI DOM/download not browser-tested beyond lead smoke.
N3 Model only; not Verify/TwinCAT, not hardware safety.

## Re-review of delta (2026-10-26) - Verdict: ACCEPT-WITH-NOTES
- B1 CLOSED. trace.wrapProgram(P, symCanon) wraps P.sym (exam-worker SYM_KINDS = all 10 pattern kinds, canonical names from
  Pc0.sym); create()/fork() resolve via P.sym, so cached states and forks are covered. Reviewer re-ran the same scratch probe
  (CMD_SAFE_TO_RND->Xcmd_A, linkSafetyFault->Xlink_B): C-01, C-02, G-03, W-01 all «НЕ ПРОВЕРЕНО» with the correct touched
  names (fail messages kept as info). setInputs touch after the first scan is conservative (more «не проверено», never a false PASS).
- Mapping kind check (input<->input only; output/internal never to a loaded input) present in validateTable. Host/Origin
  allow-list (127.0.0.1/localhost:port) -> 403 otherwise. Upload temp-dir sweep skips current upload and running jobs.
- Tester's vis-mapping-patterns.test.js (lead-reported 29/29, canonical exam == TAP 88/88, check:software == baseline) not
  re-run by the reviewer; scope is still clean (no changes in src/scripts/test).
- Remaining notes: N1 (manual x10 ~x1.3-4, ~1.5 s event-loop blocking per tick, lag shown), N2 (UI not browser-tested beyond
  smoke), N3 (model only; not Verify/TwinCAT, not hardware safety).

## VIS-2 review (2026-10-27) - Verdict: ACCEPT-WITH-NOTES
- Diff limited to visualizer/manual.js (setInputs: validate-all then apply = all-or-nothing), app/app.js, index.html,
  style.css + new test/vis-buttons.test.js. Exam/model/trace/catalog code untouched; checkboxes kept.
  test/catalog/lib/e.js change is the parallel EMG-OFF work, not VIS-2.
- Atomic pairs: one POST per pair; non-FBK lines go into the queue, which is applied by one x.set at the start of the next scan;
  FBK lines go into x.hold, applied in the same step. The handler is synchronous, so a run tick cannot interleave.
- b_EStop_Ok: not in PAIRS; it is an output, not in inputNames, so the server rejects it ("неизвестный вход").
- Momentary Reset/Unlock/«Обе»: pointerdown -> active; pointerup/leave/cancel -> release once (pressed flag); per-button
  promise chain keeps press/release order. Unmapped/constant lines disable the button. Split pair shown as «разошлись».
- Notes: (a) the STO FBK pair sets a persistent hold that overrides the FBK plant model until released via the per-signal hold
  control; it is not shown in `pending` (tester note, cosmetic). (b) No setPointerCapture or window-blur release; a lost pointerup
  outside the page could leave Reset/Unlock pressed (visible as «нажата»). (c) Pair composition is the coordinator's
  recommendation per VIS-2; Vadim may change it. Tests not re-run by the reviewer (tester 9/9, suite 36/36 reported).
