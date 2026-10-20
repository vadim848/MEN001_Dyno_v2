# Independent test plan: user decisions 2026-10-20

Status: PLAN READY for independent review; behavioral execution NOT RUN.
Owner: independent tester `/root/tester_decisions`. Only this directory is
writable by this role. No SAL, SGVL, runtime, official test or oracle changes.

Requirements: latest SCENARIO_DECISIONS, SOFTWARE_ACCEPTANCE_SCOPE and
USER_DECISIONS_2026_10_20_HANDOFF. Reference operations were read in
REFERENCE_PHASE_MAPPING and the original reference blocks must be inspected
before final baseline. Latest decisions override historical pending QR/QT/LV.

## Source and observation contract

Read current canonical SAL/SGVL on every run; record SHA256 and whole binding
audit PASS before closure. Expected baseline SAL72f42daf… / SGVLde0fa993… .
Do not select source by an environment override. Use 1ms observed samples and
retain all intermediate transitions. Record original input values, writer IDs,
execution order, native effective EStop pairs and declared boundaries. No owner,
phase or output writes after a protocol begins. No hidden runtime fallback.
Conditional initial Safe/Run component boundaries are declared as such, never
full BOOT/reachability. Seven inactive N4 globals remain explicit limitations.

Reuse reviewed `test/helpers/rnd-down-source.js` for actual owner lifecycle
where its closure suffices. Its old 'no healthy Step2-to-Safe endpoint oracle'
statement is historical for these NEW tests; the helper and old tests remain
unchanged. Derive an additive observer fixture only inside this directory if
StartingRun/normal stop needs additional demanded writers. Never use a seeded
Run phase to claim StartingRun acceptance or abort.

## L: healthy RnD down completes Safe

Start declared Safe; actual fresh BOTH→LV on→given C1feedbackON→actual RnD;
bothOFF+2000; actual fresh green500; observe actual LV reset/outputOFF first.
L1: feedback staysON: no premature Safe; then given feedbackFALSE: actual Safe.
L2: feedbackFALSE already at actual completion check: same valid endpoint,
without skipping LV commandOFF. Observe Step1/Step2/RnD, down/SG/down-owner,
actual LV/HV outputs and permitted Set from before acceptance through endpoint.
No upward energy request/output during shutdown or feedback restoration.
L3: held green/release/healthy raw restoration cannot generate another request.
After actual Safe: complete neutral2000 and fresh correct BOTH; verify real
Safe→RnD again. Do not seed Safe to manufacture cycle. Pair ordinary initial
Step2 controls with generic discharge FALSE/TRUE to preserve original startup.
Observation budgets are diagnostics; exhaustion reports NOT VERIFIED/FAIL with
last real writer trace, never creates an invented physical deadline.

## R: Run BOTH ignored and attempt stays consumed

Use existing reviewed `createSafeRunFixture('Run')`, explicitly conditional
phase boundary with real prior Step2 output preparation. Neither initial owner
boundary nor phase forcing proves normal-cycle reachability.
Both orders delta249/250 plus simultaneous; continuous BOTH1000 and longer;
no physical Run down or four fanout requests, Safe/RnD single/Unlock/up, energy
change or gesture-caused fault. Release either button, hold other >500: no
single from same attempt. BothOFF2000 then fresh green500 must still produce
the real Run-down fanout. Pair >250-before-single and short chord→green with
same no-single rule. Report existing short-chord defects as FAIL, not relax
oracle. Monitor continuously rather than final FALSE snapshots.

## T: StartingRun fresh green starts existing normal stop

Actual Safe→RnD→new accepted BOTH/SU; observe real early STO permission and
leave confirmation pending by declared C2/HVHealthy raw conditions. Release
both2000; prove accepted launch still active, Run confirmation incomplete.
Fresh green: <500 no down; at500 plus explicit SAL causal propagation initiate
same existing Run-down stop owner and normal SS1/STO/coast/discharge request
sequence. Compare source writers/order with normal Run-green control.
Cover C2 notON and C2ON/Healthy unconfirmed contexts separately if real source
permits them. Never force RnD/Run or SU/SG to construct an accepted abort.
Then late launch feedback must not revive cancelled launch or create upward
energy; a later launch requires a new accepted gesture. Held original attempt,
shortgreen, uncleared attempts, invalidchord→green and repeated hold reject.
Emergency coincidence uses existing protection priority and existing timers.
Do not require immediate contactorOFF, immediateRnD or invent HV completion;
full endpoint stays NOT VERIFIED if its independent contract remains open.

## Handoff/gates

Review this plan and architect's exact source ledger first. Then execute honest
baseline RED/positive controls, writing reproducible script, compact result and
source/audit inventory here. Root hands RED evidence to architect/editor; tester
does not patch implementation. Rerun the identical tests on exact candidate
after self-checks and retain source hashes, coverage limits and unresolved FAIL.
