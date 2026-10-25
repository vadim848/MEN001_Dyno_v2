# Run / StartingRun counted design

Version `run-startingrun-counted-v1`. **READY for technical review only, NOT
execution ready.** Base is now the actual frozen isolated LV254 candidate:
SAL `b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161`,
SGVL `4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5`.
Its fresh explicit-pair binding audit is PASS; independent acceptance is pending.
RUN_STARTINGRUN_COUNTED_PLAN.json records the actual base hashes, LV plan hash,
255 rebased exact ordered rows, retained target IDs and new native IDs.
Rebase again if the accepted LV pair changes before construction. Do not
modify or merge anything into the LV first package under its current review.

Read latest analyst handoff and USER_DECISIONS_BASELINE_REVIEW. Independent
RED baseline is8PASS/12FAIL/2NOT VERIFIED/0ERROR. R has10 proved bounded failures;
T has two actual launch/cleanup/fresh-green failures with late feedback reviving
the old Run confirmation. L's finite budget is not a normative deadline. The
baseline archives remain frozen; this document changes no test expectations.

## Count and native structure

From planned LV254, retire Run raw Green TON2 and pure G027/G028, add three
ANDs plus one RS: **254−3+4=255**. The additions are LAUNCH_EXIT,
ABORT_CAPTURE, NORMAL_LV_DOWN and ABORT_OWNER. Existing SG_OWNER_SET AND is
reused as an SG scope gate, retaining its native ID and historical name.
All remaining timer parameters/IDs and all hardware/group settings are retained.

Retired Run TON2 and retained shared GREEN each have actual native timing
`0.5`. JSON records both native block/parameter IDs and sole Run-TON consumer.
The shared timer still requires500ms from the first observed fresh enabled
green sample; only approved attempt/chord/rearm eligibility changes. A chord
captured before500 makes SingleEnable FALSE and resets the single timer, so
partial release cannot inherit qualification. At second-button delta500 the
current Green TON can qualify before late detection, preserving Q500 priority.
Release2000, window250 and BOTH1000 native parameter identities/values remain
untouched. Removing the duplicate TON for capacity does not authorize any
rounding, shorter single or changed physical setting. Both positive500 and
before500/failed-chord/rearm boundaries must be independently repeated.

The JSON contains the complete order and per-port changes; symbolic references
name new blocks only. New functional block/port GUIDs are allocated uniquely
there. Ordinary relationship/usage GUIDs still require unique recorded native
serialization in the generated artifact. Exact global IDs and aliases must be
resolved from the accepted matching base pair, not fabricated as new globals.

### Arbitrary-flag Boolean proof of the two-slot recovery

Original G025 is FallGreen, G026 is FallBlue. G027 ORs them; G028 ANDs that
result with current SingleEnable. G028's sole consumer is LSet G029.OrIn5.
G025/G026 outputs have no other consumers, output globals or alias usages.

Add current SingleEnable to free input3 of each native G025/G026 AND. Connect
qualified G025 directly to LSet.OrIn5 and qualified G026 to free LSet.OrIn4;
retire G027 and G028. Exact target native IDs are in JSON. Identity:

`S && (Fg || Fb) == (S && Fg) || (S && Fb)`.

All eight arbitrary Boolean assignments are evaluated and recorded in JSON;
none assumes onehot phases, button history or timer state. SingleEnable is
evaluated before G025/G026 and is not rewritten before LSet. Both edge outputs
are current before original G027/G028/LSet. No snapshot or flag update intervenes.
Therefore LSet receives the same current truth value and state-update timing.
Do not call this a De Morgan fold: the original OR is positive. Whole native
usage/global/alias audit must confirm sole consumers before actual retirement;
retain all Q500/primary-swap/flicker/short-neutral regression checks.

## Shared E, phase entry and SG ownership

Add actual Run b_Step3 to existing MODE OR. Preserve Safe-specific connector
access scope, current ExternalNC and raw PLC permission, effective main EStop
and explicit current Mentee Set guards. Use the last free E input for inverted
LAUNCH_EXIT = snapshotSU && !actualRnd, placed after snapshots before MODE/E.
This forces one recognizer cleanup at actual Rnd exit even if MODE remains TRUE
because Run has risen. It does not clear SU during StartingRun while Rnd is
still active. Actual normal confirmation clears Rnd before Run rises next scan;
there is no requirement to manufacture an overlapping Run+Rnd state.

Repurpose SG_OWNER_SET as SG_SCOPE = E && !Safe && !ResetPB_Lock && !False,
evaluated immediately after E. STATE_SG.Set becomes current GREEN.TonOut;
Reset becomes !SG_SCOPE. Reset dominance prevents Safe Green owning SG and
prevents retaining a rejected Run/StartingRun Green request until a lock later
opens. Keep original N6 And24 !Lock/!False and And23 Run guards downstream.

**Required source proof, not an arbitrary-cut equivalence claim:** original
Lock RS is reset through actual And13 while raw green is OFF; Set is through
And14 and the original three SetLock sources (Safe up, confirmed Run, completed
Run down). The full2000 neutral filter in a stable allowed Rnd/Run/StartingRun
attempt must show actual Lock FALSE before qualification; those SetLock sources
must be inactive throughout it. Current StartingRun is unconfirmed by definition.
This plan adds current lock gating before owner creation rather than silently
queueing a blocked request. Verify stable-Rnd preservation through real writers;
if a permitted fresh stable-Rnd attempt with Lock TRUE is actually possible,
return that technical counterexample to architecture before implementation.
Do not infer permission from a phase cut or override Lock to force a positive.

## Rearm while SU remains held

Deactivate only snapshotSU inhibition on G008.AndIn4 (release enable) and
G014.AndIn4 (full-reset eligibility). Keep SG inhibition and all actual timers:
neutral2000, single500, window<=250 and continuous BOTH1000 from second.
SU stays latched; neutral may now clear attempt C/T/L for a new StartingRun
green. No accepted launch is cancelled merely by late second or release.

Add !snapshotSU to BLUE-enable G010 input3 and BOTH-enable G012 input4. Thus
the newly armed attempt can qualify Green, but cannot create a fresh Blue/Up
while the previous launch remains active. Chord capture T remains active:
a short invalid chord still cannot degrade to Green. A partial chord cannot
become another command until both are OFF through the unchanged full filter.
Existing FinishUp G020 and its same-scan CSet consumption remain intact.

The first scan accepting SU still sees prior snapshotSU FALSE, so the original
BOTH threshold, SU Set and both early-STO OR3 paths are not delayed. On later
scans SU inhibits new BOTH qualification, not the accepted request lifetime.
Re-run the entire actual Rnd69/earlySTO88 and exact late500 controls.

## Abort capture, cancellation and original normal-down route

ABORT_CAPTURE is current SG && snapshotSU && current GREEN.TonOut && RND_SCOPE.
Place it after STATE_SG and before ABORT_OWNER, both before STATE_SU and the
late N12 HV qualifier/Run confirmation. Current qualification must be present;
an old retained SG cannot later turn into a queued abort. SG_SCOPE supplies
the current E/Lock/False acceptance guard. ABORT_OWNER is a native RS set from
ABORT_CAPTURE, reset from actual b_Step_RnD_Set produced by Network11 completion.

That reset signal must be proved FALSE when the new abort is captured: after
real launch and full neutral, the old Step12 completion cannot still be active.
Record its real writer in both C2OFF and C2ON/Healthy-unconfirmed cases. Do not
seed it FALSE or replace it by a guessed feedback. During abort it remains
held independently of raw Green, SU or Rnd; only the real normal-stop→Step12
→Rnd completion resets it. Emergency may strengthen removal; no new emergency
endpoint or HV-completion decision is implied by this owner equation.

Explicit current-owner effects:

- Existing RND_SCOPE adds !ABORT_OWNER, cancelling SU at its next scope update.
  The capture scan's scope was evaluated earlier; record that ordered lag,
  rather than pretending the reset occurs before its producer exists.
- N3 Rnd reset OR13 free input1 reads ABORT_OWNER in the capture scan.
- N12 HV Set qualifier And4 free input4 and Run-confirmation And6 free input4
  both read **!current ABORT_OWNER**, after owner evaluation. They prevent new
  HV requests and old late feedback from completing the cancelled launch,
  including the same qualification/feedback handling interval.
- N6 normal-down OR5 free input3 reads ABORT_OWNER and retains all original
  physical/PLC inputs and original output fanout. The same existing Down
  Decouple/ResetSTO/discharge/ResetC2/TON0.2/C2OFF/Step12/LV/Rnd path executes.
  No Run flag is injected and no contactor/phase is assigned by the fixture.

Late N6 OR5 and its earlier consumer naturally create the original source
propagation chronology. Derive and report it from the actual candidate;
do not add a physical grace timer or demand an impossible zero-scan output.
Old SU/OR8/OR10 values may still be observed during that chronology, but direct
abort gates prevent old HV/Run resurrection and actual Reset remains dominant.
Observe every actual per-drive Set/Reset/RS/output. Existing critical fault
permissions still dominate all new energy Sets.

NORMAL_LV_DOWN = SG && actualRnd && !currentSU && !ABORT_OWNER, evaluated after
SU and before N12 OR2. It replaces only that OR's physical SG source. Stable
Rnd Green retains original LV shutdown. StartingRun Green captures abort and
cannot also switch LV OFF; even after SU clears, retained abort owner excludes
that route. The original N12 PLC input is not altered or reinterpreted.

## Run BOTH ignore and normal Green

Run remains in the common classifier. Qualified BOTH cannot set SU (Rnd scope)
or Safe owner (Safe scope), nor SG. Irreversible T blocks all singles from
partial release; full both-OFF release sets/clears the original invalid/consumed
attempt machinery and rearms. No new endpoint, fault or energy change occurs
from Run BOTH itself. Test simultaneous and249/250 both orders, both retained
remainders, late300, short chords and fresh Green after full neutral.

N6 And24 input3 becomes actual accepted SG, replacing retired raw TON2. Keep
its native Lock/False inputs and And23's Run qualifier. Deactivate only raw
!Blue And23 input3 **after SG owns a qualified command**, so a late second
cannot cancel already accepted normal down. This does not authorize a single
from an incomplete/failed chord: the common T/L/C classifier prevents it.

## Acceptance gates and unresolved implementation obligations

JSON count/order/GUID/Boolean checks pass as a plan. No generated native
graph or behavioral PASS is claimed. Before editor construction:

1. Accept and identify actual LV254 base; rebase this full manifest and all
   retained port IDs. Current JSON is pinned to the actual b7096/4eb263 isolated
   candidate, but its independent acceptance is not yet assumed.
2. Independently review native G025/26/27/28 usages and the ordered distribution
   proof, SG current-lock-before-owner/source-neutral proof, abort reset lifetime
   and simultaneous feedback/fault priorities. Resolve technical counterexamples
   through source analysis; do not ask the user for ordinary gate design.
3. Generate a separate candidate and whole matching SAL/SGVL audit before cuts.
   No hardware/group metadata or surviving timer parameter changes are allowed.
4. Independently run the frozen L/R/T baseline expectations and additional T
   no-cleanup, <500, invalid-chord, repeated-hold, original-attempt late-second,
   emergency and late-feedback rejection controls. Preserve source chronology
   and no-demanded-fallback checks; no injected Run/SU/SG/output acceptance.
5. Run all accepted regressions and review implementation/test sufficiency.

Full agreed normal HV shutdown/coast/discharge completion and timeout policy
remain separate open contracts. Preserve the actual existing normal-down route
and verify known initiation/owner/no-resurrection now; do not declare its final
Rnd arrival equivalent to a newly invented safe-HV completion. QP, invalid-mode
destination and full N4/group BOOT are likewise not selected here.

Only these two new Run/StartingRun architecture files were written. The LV
review package, working SAL, tests, shared runtime/parser and frozen evidence
were not changed.
