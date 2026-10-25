# Independent tester: initial RED handoff — 2026-10-21

Owner: independent tester; files only under this directory. No source or shared tests/reports changed. Full development resumption does not authorize hardware, group/target settings, download or push. Read WORKFLOW, latest Vadim SCENARIO_DECISIONS, acceptance scope, original reference and source before designing tests. Reference4495a1f remains read-only.

## Frozen source and baseline

Frozen copied source SAL `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`, SGVL `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b`. Snapshot `baseline/sandbox/v2` contains only current src/scripts/test/fixtures/top-level SafetyTests files and current Safety_Dyno; reference Safety_Dyno copied separately at expected relative path. No old task trees copied. Canonical reports untouched.

Initial full run native preflight PASS then binding PASS:14N/254FB/2172ports/75Symbols/319wires/0cross. Harness189PASS and historical75PASS. Current438/442 had2 genuine Run failures plus2 **fixture environment failures**: Git rejected read-only historical show because sandbox account differs from repo owner. Original logs preserved `baseline/baseline.log`. This is not a clean normative baseline. A second unchanged-source full run uses only process-local `GIT_CONFIG_COUNT` with two exact safe.directory paths; no global config or repo mutation. Its evidence is `baseline/baseline-process-git-read.log` and sandbox SOFTWARE_CHECK_RESULTS. No oracle/test assertion changed.

## First RED package ready for architecture/editor

`run-gesture-red.mjs` executes20 independent actual-SAL cases, freezes full compressed scan observations and source scopes in `run-gesture-red-results.json`:10PASS/10FAIL/0ERROR. Cases include both button orders, simultaneous and250-inclusive valid chords,251/300 invalid late attempts, each button retained after BOTH, failed short chord and green/blue minimum500 controls. All inputs observed at1ms; fresh neutral2100 is preparation exceeding existing release2000, not a new parameter. Correct Run positives remain available. The oracle is latest Vadim confirmations1–11, not current raw-green bypass behavior.

This is **command-component RED coverage** with explicit Network3 Step3 ownership cut after real Step2 energy preparation, not a full Run-reachability proof. Freshgreen acceptance tests assert physical stop-request availability; they do not require the legacy simultaneous STO/discharge/C2off fanout as normative stop sequencing. Root can checkpoint this honest RED package before editor changes.

`lifecycle-red.mjs` supplies additional actual Network3-owner execution after a declared initialSafe and seven explicit inactiveNetwork4 cuts. Initial6 cases:1PASS/4FAIL/1fixtureERROR. Standalone new PLCup with physicalbuttonsOFF PASS; newPLCdown00 FAIL. Physicalgreen500 plusPLC11 creates up/down and HVwhileLVdown FAIL. Real accepted StartingRun after cleanup/newgreen fails torque inhibit, discharge initiation and cancellation in both C2OFF/C2ON contexts. NormalRun setup failed because actual state had already left to protectiveStep4 before the normalgreen probe: **fixture ERROR**, not an asserted normalstop defect; preserves last continuous trace. Updated10-case run additionally checks each pressedbutton rejects eitherPLCrequest before500 and ignoredheldcode cannot queue on release. This second run is pending final results.

## Independent acceptance gaps still open

| Required area | Existing evidence / gap | Next obligation |
|---|---|---|
| BTN001–008 | RnD69 accepted component controls, Safe qualification, newRun20 RED; common lifecycle incomplete | Preserve RnD69; integrate Run into one gesture owner; release1999/2000,500late priority, entryheld, acceptedcross-mode command persistence with real phase writers |
| MOD001/005/STP005 | Working LV completion/newcycle component tests already exist | Re-run on candidate, preserve actual Safe→RnD→Safe/newentry and ordinaryStep2 action order; no finalphase seeds |
| MOD002/004/STP001–004/EMG008–010 | Real StartingRun abort RED; normalRun fixture cannot yet hold intended phase; SS1/coast/discharge timing missing full observer | Resolve Healthy phase/polarity and observer closure; normalSS1 full2s, HealthyLossSTO/full5s even restore, existing dischargehold beforeC2off, feedbackOFF completion, abort noSS1/no5s, lateconfirmation cannot revive |
| MOD003/007 / QP | Newly approved standalonePLC with bothbuttonsOFF; pressedbutton/noqueue criteria added | Real newrequest/heldlevel oneevent; bothpress channels and release after ignoredcode; no event from rawheldcode or guard restoration. Blink-only qualification pending root clarification |
| MOD006/EMG012 | Conditional conflictingSet scenario currentlyFAIL | Implement actual invalidownership detector after architect/analyst choose allowed phase sets; exact destination/reset still requires user decision. Do not remove original conditional failure as inconvenient |
| HealthyLost/softwareSafetyFault reset | Required retained HealthyLost and confirmed rollbackFault reset markers absent | Architect defines actual latches/producers/observation marker; fault not reset by unchangedhold/PLCrawrestore. Confirmed startupFault anybuttonPRESS clears immediately and consumes attempt until bothOFF2000; HealthyLost reset is separate narrower edge rule. Test real failure/rollback context, not seeded latch as sole proof |
| EMG001–007/011/CVR001–006 | Existing EStop,SetPermit,Unlock component suites and40paired emergency cases; allphase ownership/completion incomplete | Each applicablefault/firstscan and recovery-no-autoup, concurrentcommands, actualphase states, DoorMonitor solenoidonly and InterLockNC energy guards; do not merge normal blocker with fault |
| BOOT001/002 | Native inventory preflight explicitlyNOT VERIFIED for N4unbound/group lifecycle | Need authoritative native software semantics or reviewed complete programmodel; cuts/fallbackfalse and rawRestart cannot close fullBOOT/group. Source parser/nativeCRC are different evidence |
| ExternalFault/lamps | Tentative futurePLC presentation, not included by assumption | Required internalFault behaviors proceed; no new200msSAL timer, no binaryencoder/alias/hardware mapping changes |

All41 acceptance IDs remain obligatory. Prototype/model PASS, seeded owners and finite diagnostic-budget exhaustion do not close mandatory current-source behavior. Any unresolved deadline/destination limits only dependent endpoint work; independent editor work may start after reviewed slice/checkpoint. No whole-program allgreen claim is available yet.

## Reproduction

```powershell
$env:MEN001_TEST_ROOT="$PWD/SafetyTests/resumed-development-2026-10-21/tester/baseline/sandbox/v2"
node SafetyTests/resumed-development-2026-10-21/tester/run-gesture-red.mjs
node SafetyTests/resumed-development-2026-10-21/tester/lifecycle-red.mjs
```

For a candidate use an isolatedroot containing its SAL/SGVL and reviewed corresponding helpers/runtime; retain this baseline unchanged. Every selected fixture full-audits SAL/SGVL, and the runners require native-serialization preflight before execution. Evidence distinguishes fixtureERROR from requirementFAIL and source limits.
