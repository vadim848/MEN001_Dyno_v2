# SAL trainer (VIS)

## Quick start
- Requirement: Node.js 22 or newer (developed on 22.x; package.json declares no "engines"). No `npm install` needed: package.json has no dependencies, the server is plain `node:http`.
- Get the repo: `git clone https://github.com/vadim848/MEN001_Dyno_v2.git`, then `git checkout Safety-Develop_2_Cloud`.
- Run: `cd SafetyTests` then `npm run visualizer`.
- Open http://127.0.0.1:8642/ (local only; set the `VIS_PORT` environment variable to change the port).
- Stop with Ctrl+C.
- This is a model of the program, not Verify/TwinCAT and not hardware.

Local model-only tool (VIS-Q1..Q6, plan `program/architect/VIS_PLAN.md`). It is NOT Verify/TwinCAT and NOT hardware; the FBK plant is simplified.

Start: `cd SafetyTests; npm run visualizer` -> http://127.0.0.1:8642/ (override with `VIS_PORT`). Binds 127.0.0.1 only.
Exam workers: `VIS_WORKERS` (default CPUs-1, max 8) catalog workers + 1 structure worker; a full exam is a few minutes.

Tabs (English UI): Program (canonical or uploaded .sal/.sgvl[/.diagram/Alias Devices]), Name mapping, Exam, Manual mode.

API (JSON): `GET /api/info`, `POST /api/target/canonical`, `POST /api/target {files:[{name,base64}]}`,
`GET /api/mapping?target=ID`, `PUT /api/mapping {target,table}`, `POST /api/exam {target,table}`, `GET /api/exam/:job`,
`GET /api/exam/:job/scenario/:id`, `GET /api/exam/:job/report.html`, `POST /api/manual/{start,cmd,inputs,hold}`, `GET /api/manual/state?since=t`.

Notes
- Exam = part 1 `structureCheck()` (file as is, mapping not applied) + part 2 all catalog scenarios (no section M); part 2 runs even if part 1 FAILs.
- Scenario touching an unmapped signal = NOT CHECKED (never FAIL). No polarity inversion in the mapping.
- Divergence point = first difference from the canonical SAL trace of the same scenario (diagnostic; catalog check messages are the oracle).
- Instrumentation of `SalRuntime.prototype` lives only in exam workers (`trace.js`), never in the server / `check:software` process.
- Uploaded files are parsed only; temp dir `os.tmpdir()/men001-vis/<id>`; request limit ~20 MB.

## VIS-3 (button-filter readiness, English UI)
Manual mode shows, under Reset / Unlock / Both, a model countdown of p.9 (both buttons released continuously 1000 ms of model time, requirement constant per p.9 / TMR-1; the SAL RELEASE preset is shown separately so a wrong RELEASE timer shows as DIVERGED)
and the SAL flag `//RndPhysicalCompact/RELEASE/TonOut` (found by block path + `safeTon`; "NOT CHECKED" if absent or if the button inputs are unmapped).
API: `state.filter` (see `SafetyTests/program/editor/VIS-3/NOTES.md`). Display only. UI, report and server messages are in English.

## VIS-LED (display only)
Manual mode shows the Red/Green/Blue dashboard LEDs (off / on / blink slow 1.5 s / blink fast 0.5 s / fault-alternate 200 ms) from `led.js`: a JS replica of PLC act_LED_Control (`test/independent/act-led-control.mjs`, variant `new`), fed after each SAL scan (dt 1 ms). Not PLC execution. SolenoedMonitor = constant FALSE (legacy, Q-LED-5). `state.led` in the manual API. Unmapped LED inputs read FALSE and are listed in the panel.
