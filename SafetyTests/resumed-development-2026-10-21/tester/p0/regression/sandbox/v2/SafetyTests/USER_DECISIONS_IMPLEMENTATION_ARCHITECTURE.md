# Implementation architecture for the 2026-10-20 decisions

Working source: SAL `72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e`,
SGVL `de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56`.
Requirements: USER_DECISIONS_2026_10_20_HANDOFF, latest SCENARIO_DECISIONS
and SOFTWARE_ACCEPTANCE_SCOPE. Reference4495a1f original Step2 startup and
full removal were already read and mapped in REFERENCE_PHASE_MAPPING and
DISCHARGE_PROGRAM_CONTRACT; no cancelled reference access was retried.

**First handoff READY for independent plan review: LV_COMPLETION_COUNTED_PLAN.json,
version lv-completion-v1-254, in user-decisions-architecture/.** It contains
all254 ordered native rows, actual block/port IDs and exact binding changes.
No SAL/tests/runtime were edited. Build only an independently reviewed isolated
candidate after the honest baseline; no software acceptance is inferred here.
Run/StartingRun below form a separate next iteration, not a dependency of LV.

## 1. Source proof and priority of LV completion

Independent baseline8PASS/12FAIL/2NOT VERIFIED has a source-bound L absence
ledger. The finite observation budget is not a normative deadline. Healthy
normal-down completion currently writes b_Step2_Set_2 and enters original
Step2. Its four Safe Set sources do not provide the required healthy return:
N4 is explicitly inactive in the component fixture; original all-zero fallback
is inhibited by active Step2; N9 requires Step6 and direct False input; N5
Safe return requires Step2, direct False and !EStopOK. This is absence in the
declared conditional protocol, not a claim about unmodeled whole-group BOOT.

The new user decision supplies the missing completion oracle: actual LV
command OFF plus LV contactor feedback OFF is sufficient; preserve existing
LV loads/battery/BMS/discharge/reset actions, no additional timer or input.
Final Safe and a real fresh Safe→Rnd cycle are now required. Merely retaining
the no-reenergization Step2 owner forever would not implement this decision.

## 2. Exact first LV native package: 255−1+0=254

### Completion writer and current fault guard

Retain actual N12/And15 native ID `5de7d7d4-f500-4ccd-b40c-62d980cafff3`.
Move it from its late position to **after real LV/HV output RS4/6, before
N3/Safe Set OR2 and Safe RS**. Preserve every other retained relative order.
Its eight existing native input ports are sufficient:

| Input | Exact logical source | Purpose |
| --- | --- | --- |
| 1, retained | N12/Decouple1.DecOut4 | Actual LV shutdown command source; includes accepted-down origin |
| 2, retained inverted | in_LV_C1_FBK | User-approved LV OFF feedback completion |
| 3, inverted | N1/FBRs1.RsOut | Actual LV command must already be OFF, including FBK-already-OFF entry |
| 4, inverted | N1/FBRs2.RsOut | Preserve HV command-OFF prerequisite of stable Rnd down |
| 5, inverted | in_HV_C2_FBK | Preserve C2-OFF prerequisite; this is not invented HV-discharge completion |
| 6, direct | N1/FBAndLvCurrentPermit.AndOut, order2 | Current ES NC/ExternalNC/connectors/PLC and EStop memory, before Safe publisher |
| 7, inverted | in_Mentee_EStop | Current Mentee before main EStop evaluation; no stale first-fault Safe publication |
| 8, inverted | in_False_SI2_CH8 | Existing healthy program condition; do not bypass fault-state exclusions |

All three relevant actual command outputs have real producers. Use direct
canonical wires from their actual RS output ports, not seeded aliases or
convenient globals. Exact reused target port IDs are in the counted JSON.
All existing native port polarity/contact attributes must be set explicitly.

Safe RS evaluates before main EStop in the current source. That is why merely
feeding yesterday's completion into Safe Set would be insufficient: fault
could arrive between completion publication and consumption. The moved And15
uses current permit/current Mentee before Safe Set; NC2, ExternalNC, connectors
and PLC are read currently through permit2, Mentee directly. After an NC2 or
Mentee fault, raw restoration without Restart leaves EStop memory/permit FALSE.
This package does not claim full emergency/group completion.

### Routing, owners and preserved actions

Add existing `b_Step2_Set_2` reference to free N3/FBOr2.OrIn5 (Safe Set).
Deactivate N3/FBOr4.OrIn2 (Step2 Set), removing its old reference and matching
SGVL usage. Retain N3/FBOr13's existing direct completion input to reset Rnd.
Keep the historical global name/ID to avoid unrelated declaration renaming;
document its new normal-down completion consumers explicitly.

Retire `//SafeResumption/RND_DOWN_STEP2_OWNER`, native ID
`8e0c7ae7-10dd-48f6-9ead-cff78d3f1886`, and deactivate only its N5/And1 input4
consumer. Retire its Set/Reset relationships and b_Step2 usage index. This is
permitted only together with removal of the normal-down Step2 Set route:
that route's elimination is the replacement no-reenergy proof. Original N5
Step2/!False/EStop power-on and its full output fanout are otherwise unchanged.
Legitimate original startup no longer encounters a stale down-episode veto.

Change existing STATE_SG.Reset from !E to **!RND_SCOPE**. Retain SG_OWNER_SET
and its !Safe qualification. Rnd→Safe can be continuous in MODE=Safe|Rnd;
without this owner-specific reset SG would survive into Safe, keep old LV
shutdown active and block release/rearm. Scope reset clears it after actual
Rnd exit while preserving its accepted request throughout Rnd. This is an
intentional consequence of the newly agreed normal Safe completion, not a
global onehot assumption or an unrelated SG optimization.

N12/Decouple1 battery/BMS reset, LV-discharge request, ResetLV and Transition2
fanouts remain exactly as before. No timer, physical setting, group parameter,
hardware alias or native metadata is modified. Every remaining timer/parameter
ID/value is preserved. The retired RS has no parameters.

### Ordered proof and required independent tests

While LV is still commanded ON, moved And15 is FALSE even if feedback already
says OFF. The accepted down request issues its original actions; only after
actual RS command OFF and feedback OFF can completion become TRUE. Safe RS
remains reset-dominant while Rnd is still TRUE. The same completion clears
Rnd through its real late reset writer, then actual Safe can establish; SG
clears via !RND_SCOPE. There is no Step2 power-on episode to reenergize LV/HV.
Observation must include the first relevant command-off and state samples.

The exact new sequence is the JSON manifest1..254, not a guessed fixed scan
delay. Existing And15 is the sole moved retained FB; all other retained relative
orders remain. No source behavior is accepted by editing historical assertions
to new counts without this identity/routing proof.

Before implementation acceptance independently check:

- Real Rnd down with LV FBK changing OFF after actual command OFF reaches actual
  Safe; FBK-already-OFF variant cannot skip command OFF.
- FBK held ON cannot complete Safe. Pair the source absence/rejection with a
  feedback-OFF positive; do not fabricate a timeout from observation budget.
- NC2/Mentee/current PLC/ExternalNC on the pending completion sample prevents
  Safe completion/new energization. Restoration must not replay a stale request.
- No renewed LV/HV Set/output rise during SG clear, delay or raw restoration.
  Observe all real aggregate/SetPermit/RS/Reset writers, not a missing request.
- Actual Safe, full existing neutral2000 and fresh valid BOTH with original
  And3 readiness return through actual Step12 to Rnd. Never seed Safe to prove
  the cycle. Held green cannot produce another accepted action or prevent rearm.
- Original-start Step2 control with down request absent preserves original
  power-on; all current Rnd69, earlySTO88 and Safe gesture regressions remain.
- Full fresh SAL/SGVL binding audit, canonical edges, usage indices, manifest
  count/order and unchanged timer/alias/group identities precede behavioral cuts.

The old no-autoenergy owner regression must migrate to its replacement routing
invariant, not disappear. Preserve original RED baseline and separately record
current-candidate output evidence. Full normal HV completion remains open.

## 3. Next iteration: StartingRun fresh-green abort, separate from LV

Current source release enable G008 and full-reset G014 both explicitly inhibit
release/cleanup while SU is held. Thus fresh green cannot qualify in StartingRun.
The new baseline observes no SG/normal-down after the fresh attempt, and late
C2/Healthy feedback subsequently confirms Run. That is not an accepted abort.

Known required technical changes for a later counted reviewed graph:

- Allow full neutral/release and reset of attempt C/T/L while SU retains the
  accepted launch. Remove only the SU inhibition in G008/G014; retain SG
  transition inhibition and all existing timing parameters.
- While snapshot SU is active, inhibit BLUE TON enable and BOTH TON enable
  through free inputs. Green single remains available after real cleanup.
  Irreversible chord T still prevents invalid chord→single degradation.
- Route stable-Rnd green through the original LV-down source only when no
  launch/abort is active. StartingRun green must not also trigger LV shutdown.
- Capture an abort owner from actual newly qualified SG while SU is active;
  hold it across Rnd exit and normal Run→Rnd processing. Original Step2 owner
  is retired by LV, so its capacity can be reused in this separate graph.
- Feed that owner into the original N6 normal-down OR5, preserving its original
  reset-STO/discharge/C2-OFF/TON/feedback/Step12/LV/Rnd producer sequence. Do not
  turn abort into immediate Rnd or an invented contactor-drop/SS1 bypass.
- Cancel the old launch via owner-specific Rnd scope and explicit direct abort
  inhibition on N12 HV Set qualifier **and Run confirmation And6**. Late C2
  or Healthy feedback after acceptance must not resurrect the old launch.
- Actual N3 Rnd reset must observe accepted abort, while abort owner persists
  independently until real new-Rnd completion. Accepted abort cannot be a
  single scan pulse whose later release allows the old confirmation to win.

Exact reset source/placement and all simultaneous-fault priority traces require
the separate counted manifest/review. No new HV completion/timeout decision is
made; known abort qualification, owner initiation and no-resurrection are
independently implementable/testable. Current LV254 handoff is not delayed.

## 4. Next iteration: Run BOTH ignore and shared recognition

The baseline has six valid-Run-BOTH→remaining-green failures, plus late300 and
short failed-chord failures. Retained raw Run TON2/!blue path allows a single
after release of blue from an ignored chord. Merely masking the full BOTH
threshold would not implement irreversible attempt/rearm requirements.

The later graph should extend MODE to Run, route qualified SG through original
N6 And24/And23 with lock/False/Run guards, and retire raw Run TON2. Run BOTH
has no energy/access endpoint: T owns the attempt through partial release;
full neutral/filter rearm is still required. Rnd FinishUp remains Rnd-scoped;
Safe completion remains guarded. Remove raw !blue only after accepted SG
ownership protects late-second/no-rollback; retain all other Run guards.

Generic MODE continuity across Rnd→Run needs an explicit exit cleanup based on
previous SU and actual Rnd exit. Actual normal confirmation clears Rnd before
Run rises next scan; do not demand a fabricated overlapping interval. Same-mode
StartingRun fresh cleanup must remain possible before that actual exit.

### Concrete resource direction; not yet implementation READY

After LV254, a combined later graph needs four additional primitives: abort
RS, stable-Rnd LV-down qualifier AND, abort capture AND and launch-exit cleanup
AND. Retiring old Run TON2 recovers one slot. Two further slots can be recovered
without a onehot assumption by distributing the existing falling-edge expression:

`SingleEnable AND (FallGreen OR FallBlue)`
equals `(SingleEnable AND FallGreen) OR (SingleEnable AND FallBlue)`.

Current G025/G026 each have a free third AND input, both read only by G027;
G027 is a positive OR read only by G028; G028 is the qualifying AND read only
by LSet OR G029. Add SingleEnable to each G025/G026, connect their qualified
outputs directly to two free/repurposed LSet OR inputs, retire G027 and G028.
This is distribution, **not** an invalid De Morgan fold of a positive OR.
SingleEnable is evaluated before both edge blocks and LSet, so the exact
same-scan Boolean expression can be preserved for arbitrary input/phase values.
Full native usage audit and all Q500/flicker/swap/rearm cases must prove it.

Count direction: **LV254 − RunTON2 − G027 − G028 + four primitives =255**.
The existing SG-owner AND can become SG scope E&&!Safe with SG.Set=current
GreenTON and Reset=!that scope, allowing accepted Run SG but excluding Safe.
This is not part of the LV first manifest; its full native IDs/order/reset
manifest and independent proof must be supplied before editor handoff.

## Workflow boundary

Review and implement the frozen LV254 package first in an isolated directory.
Do not mix future reset/Run proposals into it. Then separately finish/count/
review StartingRun and Run changes, preserving the independent RED evidence and
testing known initiation/no-resurrection even while HV completion remains open.
All41 requirements remain mandatory; no partial PASS closes BOOT/group,
standalone PLC, invalid-state destination or full emergency/HV completion.
