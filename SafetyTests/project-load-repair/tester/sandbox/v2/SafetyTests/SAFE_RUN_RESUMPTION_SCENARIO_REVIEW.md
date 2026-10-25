# Scenario review: bounded Safe|RnD resumption

2026-10-20. Analyst handoff. **READY for isolated candidate construction and
technical replay; NOT production SAL READY or functional acceptance.**

Read AGENTS.md, WORKFLOW.md, WORK_STATUS_AND_PLAN.md, SCENARIO_DECISIONS.md,
SAFE_RUN_GESTURE_SOURCE_REVIEW.md, test requirements and independent plan review,
and revised SAFE_RUN_RESUMPTION_ARCHITECTURE.md (255-node correction).
Directly read reference Network2 And3/TON3/And4 and its native relationships:
original feedback readiness is ANDed with current physical qualification before
the energy request. Reference has no added RnD recognizer. Reference identity
is the user-confirmed Prodoction4495a1f; fresh git HEAD verification was denied
by sandbox and its escalation was cancelled, so no fresh HEAD assertion is made.
Current SAL SHA256 observed: 0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909.

## B2: permitted partial boundary

The revised Safe|RnD-only scope is scenario-compatible in principle. Retaining
the complete current Run physical branch (TON2, And24, And23, raw button inputs,
consumers and chronology) avoids introducing the rejected shared recognizer's
new consume/ignore behavior for qualified BOTH in Run. MODE excludes stable
Run. Run invalid-short-chord failures remain mandatory known failures, not
waived tests. This is a partial improvement, not acceptance of current Run.

QT is not resolved: StartingRun must retain its existing RnD request owner
interval and SG/SU behavior, including both early-STO fanouts, until actual RnD
exit. An early Run latch rise is not authorization to clear SU. QP remains
unresolved: preserving PLC branch text alone is insufficient if shared owners,
guards or execution ordering alter its behavior. Actual source diff and normal
owner overlap replay must establish the claimed unchanged boundary.

No new user question arises from the bounded split itself. Existing QR/QT/QP
questions in SCENARIO_DECISIONS.md remain pending. The split must not introduce
their answers through owner resets, new routing or retained pending requests.
If replay exposes such a change, dependent implementation returns HOLD rather
than treating missing endpoint assertions as neutrality.

## B1: known scenario acceptance criteria

- Stable Safe, all relevant permissions except original And3 readiness true:
  qualify valid BOTH, release before And3 becomes ready, wait until old/current
  BOTH timer clears, then restore readiness. No delayed physical Step12 request
  may arise from that unaccepted attempt. Fresh correctly armed gesture with
  readiness present is a required positive control.
- Same initial unready guard, but retain BOTH continuously after qualification:
  readiness may enable the original physical request while still held. Do not
  incorrectly consume the attempt merely because BOTH timed out before And3.
- Preserve the original feedback/permission chain and actual And4 conjunction;
  Safe accepted-owner Set must follow that conjunction, not bare timer expiry.
  Its lifetime after acceptance requires ordered technical evidence.
- Safe green single stays Safe; raw main-EStop Restart remains separate.
  After complete neutral release/filter a new blue500 gesture must be available.
- Safe connector absence alone does not prohibit qualified blue access under
  existing Door/grant conditions and does prohibit new energy advance. This is
  not permission to bypass external InterLock/EStop/PLC Stop/Mentee guards.
- Valid Safe BOTH window is <=250ms, continuous both1000ms from second input;
  single500ms, existing neutral release2000ms. No timer changes are authorized
  by this resumption. Existing late-second, no chord-to-single and held-entry
  requirements remain unchanged.

## Owner and verification limits

Replay must cover Safe->RnD, bounded RnD->Step2 exit and RnD/Run overlap with actual
phase writers and unseeded recognizer state. A MODE OR is not proof of a neutral
scan. Conditional Network4 inactive boundaries must be enumerated; they do not
prove BOOT/group lifecycle or hardware behavior. Preserve retained native
relative order except the explicitly justified Safe And4 move. Restore original
FinishUp sample chronology via retained scoped FinishUp as revised architecture
requires; one output edge cannot replace the accepted internal-sample oracle.

Required technical gate remains independent review of full SAL/SGVL bindings,
RnD69/earlySTO88 regressions, paired B1 cases, first fault/restart/rearm and
listed normal owner lifecycle traces. EStop first fault must suppress commands;
restoring an input without permitted Restart is not automatic acceptance.
Do not infer a complete emergency endpoint from that bounded recognizer check.
All known FAIL and mandatory NOT VERIFIED stay visible. No source/test changes
were made by this analyst review; questions and technical design remain separate.

## Correction: healthy Step2 is not a demonstrated route to Safe

Follow-up source review, 2026-10-20. The previous required
`RnD->Step2->Safe` lifecycle replay incorrectly presumed a healthy final leg.
That presumption is withdrawn, not converted into a fixture input sequence.
Current native Network5/And7 (order111, ID ee289571-21dc-4190-8db0-07683a54b7b0)
has direct Step2, direct input2 and inverted EStopOK input3; it writes
Step1_Set_3. Network9/And1 (order92, ID65699bc4-ccd2-4394-a933-22b49aa7e40f)
has direct Step6 and input2, writing Step1_Set_2. The architect's actual binding
trace identifies both input2 sources as FalseInput; at the declared healthy
FalseInputFALSE neither is a demonstrated Safe completion producer.
Network5/And1 instead consumes Step2, inverted input2 and direct EStopOK and
fans out to the original power-on sequence. The previously read reference
mapping independently identifies Step2 as that original LV/HV/Run sequence.
Do not rename Step2 a shutdown state or toggle FalseInput/EStop to manufacture
a healthy shutdown completion. This is a source/requirement discrepancy, not
proof of a fully reachable automatic restart under all current guards.

Permitted bounded trace: initial stable RnD with explicit healthy component
conditions, already-safe HV/C2 as required by SPEC11, physical buttons neutral
for full release filter; new green alone500ms; real SG -> Network12 OR2 /
Decouple1 reset-LV/discharge request -> And15 when LV_C1_FBK goes OFF ->
actual Step2_Set_2 / Step2 latch -> actual RnD reset -> first recognizer scan
outside Safe|RnD -> SG clear. Continue recording source outputs; do not assert
Safe arrival or accepted LV-discharge completion. No phase or owner assignment
after initial component setup may substitute for these writers. Maintaining
declared feedback conditions to stop after this boundary is a bounded protocol,
not proof of the whole required RnD->Safe transition.

SPEC11 already defines the intended endpoint and order: new green in stable
RnD, HV discharged/C2 off, disable LV loads, battery/BMS relays, required LV
discharge, feedback off, then Safe. No user decision between Safe and Run is
needed. Architecture must first map that agreed sequence to the original
shutdown path and identify any missing current producers/guards. A new user
question is warranted only if source/approved requirements leave an exact
completion reaction unspecified; do not ask permission to preserve known
incorrect routing. If needed, the precise remaining question is: during this
RnD-down scenario after LV commands are off and LV_C1_FBK is OFF, which of the
already-defined program inputs/sequence confirms LV discharge completion before
Safe? No new input, timeout value or hardware investigation is implied.

The partial recognizer candidate remains READY for isolated bounded exit/SG
replay, not for a claimed full normal shutdown PASS. Full RnD->Safe coverage
remains mandatory and open separately; narrowing a lifecycle proof does not
waive it. New same-phase or return-to-Safe owner leakage must still be checked
under an explicitly valid source route, and cannot be hidden by the shortened
trace. Production SAL readiness remains the independent review decision.

### Normative conditional negative: no re-energization during RnD down

Architect follow-up establishes a narrower source route than Run completion.
Initial stable RnD, HV already safe/C2OFF, permitted new green500 leads through
actual SG/LV-off request; LV_C1_FBK then becomes OFF, actual Step2 is accepted
and RnD exits. Thereafter keep buttons OFF, PLC00, NC permissions healthy,
FalseInputFALSE and both LV/HV contactor feedbacks FALSE. No fresh BOTH or
other agreed upward command occurs. SPEC11 requires continued shutdown toward
Safe: **no new LV/HV Set request or rise of their commanded outputs** may be
created by this route. Outputs already driven OFF by down must remain OFF.
This oracle does not require LV discharge completion: missing completion
cannot authorize re-energization. Observe actual permission producers,
Set guards and RS writers continuously; distinguish raw upstream proposals
from actual permitted Set/command, and report which layer violates the oracle.

Current Network5/And1 has the known Step2 && !FalseInput && EStopOK power-on
fanout, making this an inherited routing-defect candidate with a source-bound
conditional negative test, not merely missing final-state coverage. Tester
must compare baseline and isolated candidate under the same declared conditions.
Until replay, no executed violation is asserted here. Even if Set/output rises
are observed, **do not claim Run reached**: feedbacks stay FALSE and no Run
completion oracle is used. Retain any reproduced inherited FAIL in partial
acceptance evidence; do not attribute it automatically to recognizer edits.
The remaining possible user criterion, separately, is existing-input evidence
of LV discharge completion before Safe; it does not block this no-up oracle.

### Independent RED evidence reviewed

Reviewed independent-safe-resumption/no-reenergization.mjs, lifecycle-fixture.mjs,
no-reenergization-results.json and both raw trace artifacts. Both protocols
completed and failed the same normative assertion (not fixture ERROR):
baseline first observed violating sample5825ms, candidate5824ms, each1001
violating samples over the recorded1000ms interval. First samples show actual
permitted LV/HV Set TRUE, HV commandTRUE, Step2TRUE, RnDFALSE, SGFALSE,
buttonsOFF, PLC00 and both feedbacksFALSE; LV command is stillFALSE at that
first sample. Subsequent output rises must be read from continuous trace,
not inferred from this first snapshot. No Run endpoint is asserted.

Raw baseline SHA256:64a2d1b27ee478331b3d639e35d101664405ce6104bc40f22a3d4a4b2dd08625.
Raw candidate SHA256:916230793719b63dcf0cd6ebdd9221f1e1849b409aa39cf4ddb6f9628a1628e9.
These identify reviewed evidence files, not target SAL versions.

Exact inactive Network4/FBDecouple1 boundaries are all FALSE:

| Port | Native port ID | Global |
|---|---|---|
| DecOut1 |4442b65f-bfeb-4046-ab68-34041704a02f|b_Step3_Reset|
| DecOut2 |43ed1c45-ca86-4e43-9eef-f1584343e498|b_Step4_Reset|
| DecOut3 |8602413a-9bec-40e4-81c9-c205a02428c5|b_Step5_Reset|
| DecOut4 |5436764d-91b4-4573-987d-42fdd60bc96a|b_Step6_Reset|
| DecOut5 |a480cd1f-b294-48ae-8688-b0589ad8ab6d|b_Step1_Reset|
| DecOut6 |9e9908c9-c3d3-45b5-be4e-06e933b9eaab|b_Step1_Set|
| DecOut7 |78906ddf-53e8-42a7-bb5e-5e95119b3853|b_Step2_Set|

Fixture declares initial Safe through its actual state writer once, after
real main-EStop Restart; recognizer and energy outputs are not seeded.
Then raw protocol establishes Safe->RnD before green-down; phase/owner writes
are forbidden after protocol start. Full binding audit precedes selection;
demanded unresolved fallback is rejected. Thus RED is conditional software
evidence with these seven cuts and initial state, not BOOT/group or hardware
validation. It reproduces on baseline as well as candidate: inherited defect.

Future fix positives, without adding a completion oracle:

- Preserve a fresh valid Safe BOTH after full neutral2000ms, <=250ms chord,
  continuous1000ms with original guards ready: actual Step12/LV request must
  remain available. Paired original-guard not-ready/while-held tests still apply.
- Preserve accepted RnD fresh valid BOTH/early-STO behavior with its existing
  permissions and confirmations (RnD69/earlySTO88). A no-up patch must not
  disable all legitimate energy Set requests or rewrite unrelated Run routes.
- After the tested down request no fresh command occurs: no-up remains required
  throughout the bounded interval. Do not create a new command merely from
  restored feedback, elapsed time, PLC00 level, or clearing SG.
- A future fresh request after genuinely completed return to Safe needs real
  completion/source proof first. Do not inject Safe during the failing trace to
  claim that cycle is repaired; independent initially-Safe positive controls
  preserve known functionality without inventing the missing completion.

Exact user question if source mapping still leaves LV completion undefined:
"Исходно устойчивый R&D, HV уже разряжен и C2 выключен. После новой одиночной
зелёной500мс выполняется отключение LV; команды LV выключены и LV_C1_FBK уже
FALSE. Какой из существующих программных входов либо какой существующий таймер
с его условием запуска/завершения подтверждает окончание LV discharge перед
завершением перехода в Safe?" Endpoint Safe уже определён §11. Этот вопрос
не разрешает добавлять новый сигнал/число timeout и не задерживает no-up fix.

### Discharge-veto proposal: source-preservation HOLD

Proposed zero-new-block mitigation adds !LVDischargeRS5 and !currentRnDDown
to spare Network5/And1 inputs. Its narrow no-up motivation is valid: current
down request can cover the scan before the discharge RS writer, and the retained
RS can cover SG clearing. This does not approve its broader policy.

The no-up contract applies to accepted down with no subsequent fresh accepted
upward request. It does not state that every asserted discharge memory prohibits
an explicitly accepted original start. Architect source trace identifies an
original Network4 direct Step2 entry that can precede the original sequence's
later discharge reset. Blanket !RS5 may suppress that path when RS5 is TRUE.
Preserved Safe BOTH->Step12 positive controls alone do not prove preservation
of all original starts. Seven FALSE Network4 boundaries make this effect
untested, not authorized. QP pending neither approves a PLC start nor cancels it.

**HOLD for broad guard production handoff.** Technical architecture must first
distinguish actual ongoing accepted-down/no-new-start history from a legitimate
accepted explicit original start, or provide source-based proof the affected
start history is excluded by an already agreed requirement. No-auto-UP is not
that proof by itself. Unknown/unbound Network4 lifecycle may not be assigned
a convenient meaning to approve or reject the guard. No new endpoint or timer
oracle is needed for the known conditional RED scenario.

No additional user question is yet justified: the material missing fact is
the accepted-start meaning and lifetime of the original Network4 Step2 writer,
to be investigated from available program/source documentation within scope.
If those sources remain insufficient, ask a scenario distinct from QP only
after identifying the actual program event: initially de-energized original
Safe/startup with LV-discharge memory TRUE, an explicit identified legacy start
event sets Step2, and no prior RnD-down attempt is active. Should that accepted
start execute the preserved original start/discharge-reset sequence, or must
it wait for a different existing completion condition? Do not present this
hypothetical as an established reachable event or ask the user about native
port IDs instead of the real event. Network4 group/hardware investigation
remains outside scope; missing program contract is reported honestly.
