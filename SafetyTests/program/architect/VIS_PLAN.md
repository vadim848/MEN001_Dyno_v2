# VIS — SAL trainer/visualizer: implementation plan (architect, 2026-10-25)

Binding: SCENARIO_DECISIONS.md "## VIS" VIS-Q1..Q6. Model only: not Verify/TwinCAT, not hardware; FBK plant simplified (A2).

## 0. Principles
- New code ONLY in `SafetyTests/visualizer/**` + one script line in `SafetyTests/package.json`:
  `"visualizer": "node visualizer/server.js"`. No new deps (node:http, node:fs, node:crypto, node:child_process, vanilla JS).
- NO stand refactor needed. Everything is reachable via existing exports:
  `structureCheck()` (scripts/structure-check.js, reads `CATALOG_SAL_DIR`), `programFromModel`, `runScenario`,
  `SCENARIOS` (test/helpers/catalog-program.js), `parseSalFile`, `assertNativeSalStructure`, `SalRuntime`.
  Stand/catalog files are not edited (VIS-Q1). If the editor finds a hard need, stop and return to architect.
- Never `import` `test/catalog/*.test.js` (they call `node:test` `test()` → auto-run). Import only
  `test/catalog/lib/{k,c,e,u,d,h,w,p,g}.js` (same list as mutations.test.js); `def()` fills `SCENARIOS`.
- Bind only on localhost (`127.0.0.1`, port 8642 or `VIS_PORT`).

## 1. Modules (`SafetyTests/visualizer/`)
| file | responsibility |
|---|---|
| server.js | node:http server, static `app/`, JSON API, job registry, spawns exam workers |
| target.js | target store: canonical default or uploaded files → temp dir `os.tmpdir()/men001-vis/<salSha8>/` laid out as `TwinSafeGroup1.sal`, `GVL1.sgvl`, optional `TwinSafeGroup1.sal.diagram`, optional `Alias Devices/**.sds`; SHA256 of SAL/SGVL from the uploaded bytes |
| model.js | load model exactly like `program()` does: `assertNativeSalStructure(xml)`; `parseSalFile(sal,{bindingMode:'current',sgvlPath})`; bindingAudit must be PASS; then `applyMapping(m,table)`; then `programFromModel(m,identity)` |
| mapping.js | name table: auto-match, candidates, `applyMapping` (model rename), `unmapped` set, load/save JSON table |
| catalog.js | enumerate scenarios (import lib/*.js; `[...SCENARIOS.values()]` in insertion order), catalog version, per-scenario run + trace capture + "не проверено" |
| trace.js | SalRuntime prototype instrumentation (scan/get/setInputs), per-runtime timelines, first divergence |
| exam-worker.js | child process (`fork`) with env `CATALOG_SAL_DIR=<target dir>`: part 1 `structureCheck()`, part 2 all scenarios; streams progress via IPC; catalog part runs even if structure FAIL/ERROR (VIS-Q2) |
| manual.js | manual session: one runtime `x=P.create()`, virtual clock, run/pause/step/advance/speed, input queue, ring-buffer timeline |
| report.js | standalone HTML report (inline CSS + inline SVG diagrams, no external refs) |
| app/index.html, app/*.js, app/style.css | Russian UI: tabs «Программа», «Соответствие имён», «Экзамен», «Ручной режим»; permanent banner: «Это модель программы, не Verify/TwinCAT и не оборудование. Модель обратной связи (FBK) упрощена.» |
| test/*.test.js | tester-owned |

## 2. HTTP API (JSON unless noted)
- `GET /` static page. `GET /api/info` → {canonical:{dir,salSha256,sgvlSha256}, catalogVersion, scenarioCount}.
- `POST /api/target` multipart or JSON `{files:[{name,base64}]}` (sal, sgvl required; diagram, alias .sds optional) → {targetId, salSha256, sgvlSha256, blocks, parseError?}. `POST /api/target/canonical` → canonical target.
- `GET /api/mapping?target=ID` → {rows:[{our, kind:'input'|'output'|'internal', loaded|null, auto:bool}], loadedNames:[...]}.
- `PUT /api/mapping` {target, table:{our:loaded}} → validated (1:1, loaded name must exist, no duplicates) → {unmapped:[...]}.
  Table save/load = browser download/upload of the same JSON `{format:'vis-mapping-1', table}` (no server file).
- `POST /api/exam` {target, table} → {jobId}. `GET /api/exam/:jobId` → {state:'running'|'done', progress:{done,total}, result?}.
  `GET /api/exam/:jobId/scenario/:id` → full traces for one scenario (lazy, keeps result payload small).
- `GET /api/exam/:jobId/report.html` → standalone HTML (Content-Disposition attachment) — "Сохранить отчёт".
- Manual: `POST /api/manual/start` {target, table, plant:true}; `POST /api/manual/cmd` {cmd:'run'|'pause'|'step'|'advance', ms?, speed?};
  `POST /api/manual/inputs` {name:value,...} (queued; applied before the next scan); `POST /api/manual/hold` {name:value|null} (FBK override);
  `GET /api/manual/state?since=t` → {t, running, speed, inputs, outputs, status, stages, timers, changes since t}.
  Client polls ~100 ms (no SSE needed).

## 3. Exam
Part 1 structure: `structureCheck()` unchanged in worker with `CATALOG_SAL_DIR`; checks shown one by one
(native preflight, typed binding audit, input rule, FB<=512, native CRC). Native CRC row reported as returned
(ERROR "missing diagram" if no .diagram uploaded) — shown separately, not hidden. Mapping is NOT applied to
the structure part (it judges the file as is).
Part 2 catalog: if model load throws (preflight/audit) → every scenario FAIL with that message (same as TAP: each
test calls `program()` and fails). Else per scenario: `ctx=runScenario(id,P)`; status:
`FAIL` if `ctx.fails.length`; else `TODO/NV` if `ctx.nv.length` (TAP `# TODO`); else `PASS`; overridden to
`НЕ ПРОВЕРЕНО` when it touches an unmapped signal (§5) — strict: touched-unmapped ⇒ «не проверено» regardless of
fails (VIS-Q5; fail messages still shown as info). No CATALOG_STAGES filter (all stages). No section M,
no HDR row. Totals per part. ±50 ms tolerance lives inside the scenarios (TOL) — not re-implemented.
Catalog version = sha256 over sorted contents of `test/catalog/lib/*.js` + `test/helpers/catalog-program.js`
(+ short git hash of last commit touching them, if git available).

## 4. Traces and first divergence
trace.js wraps `SalRuntime.prototype.scan` once (in visualizer process only): after each scan push
`{inputs of interest}` into `WeakMap<runtime, rows>`; outputs/status/stages already in `x.log` (snap). Each runtime
in `ctx.xs` (incl. forks; fork copies log, input rows copied by the same index) = one timeline lane-set.
Signals: all RAW0 inputs + heartbeat/PLC cmds present, OUT list, STO, st (status), stg, fault, plcFault, cover.
Divergence (FAIL only): checks have no per-signal expected trace, so "expected" = trace of the same scenario on the
canonical SAL (cached per catalogVersion+canonical SHA; computed once in a worker on server start / first exam).
Compare runtime k vs canonical runtime k scan by scan over outputs+status+stages; first differing
`{lane k, t, signal, expected(canonical), actual}`. Shown with the failing check messages (the real oracle) and
labelled «эталон = поведение канонической программы на той же стимуляции». If canonical also FAILs the scenario, or
lane counts differ, mark divergence «недоступно» with reason. Diagram window: [t-500, t+1500] ms, change-encoded.
OPEN (to analyst via lead, non-blocking): confirm that "точка расхождения" = vs canonical trace (proposed above).

## 5. Name mapping (VIS-Q5)
"Our" names = RAW0 keys + OUT + STS_* + names the catalog resolves by pattern (P.sym kinds) on canonical +
`signalName` renames (in_*_Faulty_FBK). Auto: identical name in loaded model (variables + output globals).
Candidates for unmatched: all loaded names (UI select, filtered by kind: inputs = vars with targetPorts and no
sourcePorts). Apply = model rename BEFORE `programFromModel` (runtime keys by `var:<name>`): deep-walk the parsed
model and replace exact `loaded` → `our` in `variables[].name` and `port.globals[].resolvedName`/`lastKnownPath`
tail and any `var:`-prefixed string; afterwards assert no remaining occurrences of renamed loaded names and no
collision with an existing different name (else mapping error, exam refused). Polarity inversion: no option, not
representable in the table format.
Unmapped U = our names absent from the renamed model. «Не проверено» detection: trace.js also wraps
`get(name)` and `setInputs(values)`; a scenario touches s∈U if it reads s, or drives s to a value different from
RAW0 default (initial `create()` setInputs excluded). Cached steady states (`P.safe/rnd/run/...`) are shared across
scenarios: wrap `P.cached` (assignable property) to record the touched set per kind during the build and merge it
into every scenario that uses that kind. Report lists table + U + per-scenario touched-unmapped names.
Note: x.snap() reads all OUT each scan ⇒ an unmapped OUT signal makes every scenario «не проверено» — intended.

## 6. Manual mode (VIS-Q3)
Session = `x=P.create()` (catalog plant A2: FBK follow outputs after 20 ms, STO FBK = NOT STO one scan later,
heartbeat 500 ms auto; toggle «модель FBK» off ⇒ FBK inputs driven only by user via x.hold). Scan = 1 ms (A4,
`SalRuntime scanMs:1` as in catalog). Virtual clock t = scans executed. Run loop: `setInterval(20ms)`;
due = (wallΔ·speed) accumulated, executes floor(due) scans, cap 2000 scans/tick (lag shown). Speed 0.1..10.
Pause: loop idle. «Шаг» = 1 scan; «Вперёд на N мс» = N scans (pause kept). Inputs set on pause are queued and
applied via `x.set()` at the start of the next scan (x.set rejects in_Safety_Run / in_False_SI2_CH8 — shown as
constants). Observed: outputs, STS_*/derived status, stages, SafetyFault/Fault/cover symbols, b_EStop_Ok,
timers (read-only view of `r.memory` entries of TON/TOF blocks: elapsed vs preset, format as in sal-runtime.js).
Timeline: ring buffer of changes for last 120 s virtual time; SVG lanes on the page. No session recording.
Unmapped inputs are greyed out (cannot drive).

## 7. Report (VIS-Q4)
On page: part 1 table, part 2 table (id, stage, title from catalog as is, status, messages), FAIL row expands to
diagram with divergence marker. "Сохранить отчёт" → standalone HTML: date, SAL/SGVL SHA256 (+file names), catalog
version, canonical-vs-target note, banner text, mapping table + U, totals per part, all FAIL with messages,
divergence and inline SVG; «не проверено» list. No JSON export.

## 8. Tests for the tester (`visualizer/test/`, run `node --test visualizer/test/*.test.js`; not added to check:software)
1. Canonical equality: run `node scripts/catalog-check.js` with `CATALOG_TAP_OUT` and `STRUCTURE_OUT` /
   `structureCheck()`; exam on canonical: per-ID status set equal to TAP ok/not ok/todo for all non-M non-HDR rows;
   structure check list/status equal; scenario ID set == union of IDs registered by test/catalog/*.test.js (minus M/HDR).
2. `npm run check:software` result identical before/after (summary line + counts) — proves no stand change; `git diff
   --stat` touches only visualizer/** and package.json script line.
3. Mutated scratch copy (tester's temp dir): e.g. deactivate one known guard input (use M-xx locators from
   mutations.test.js as text edits of a copy) → exam FAILs at least the M row's kill scenario; divergence present.
   Structure-breaking copy (add a graphical inter-network wiredLink) → structure FAIL, catalog still executed.
4. Renamed signals: copy with in_Reset_PB→X_Green (SAL+SGVL text) → auto leaves it unmapped; affected scenarios
   «не проверено»; set table X_Green → in_Reset_PB → results equal canonical; save/load table round-trip.
5. Unmapped never FAIL: unmapped scenario status is «не проверено», not FAIL, totals counted separately.
6. Manual: step = +1 ms; advance 1000 = +1000 scans; input on pause takes effect on the next scan only; a known
   timer (single green 0.5 s Unlock-release / BOTH 1 s) fires at the catalog-expected scan ±1; speed does not change
   virtual-time results (same input script at x0.1 and x10 gives identical trace).
7. Report HTML: standalone (no http(s) refs), contains both SHA256, catalog version, mapping table, every FAIL id.
8. Server binds 127.0.0.1 only; banner text present.

## 9. Risks
- Prototype instrumentation of SalRuntime is process-global — run exams in a forked worker; never in the
  check:software process.
- Model rename may miss a name-bearing field → post-rename residual-name assert (fail closed, exam refused).
- Exam duration (full catalog, many ms-scans) — worker + progress; canonical reference traces cached.
- Divergence vs canonical is a diagnostic, not an oracle (adaptive `until` stimuli may diverge after the first point).
- `catalog-program.js` module-level cache `programs` and `currentCtx` — use `programFromModel` per target, one exam
  per worker process.
- Uploaded files are untrusted: parse only, never execute; temp dir per SHA; size limit 20 MB.
