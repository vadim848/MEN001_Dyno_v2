# Safe/Run resumption architecture, 2026-10-20

Status: **technical partial candidate for independent review, NOT SAL READY**.
Current SAL SHA256 `0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909`.
Reference read directly from the confirmed sibling project, without modifications.
Current source contains 255 blocks; reference Safe And4 preserves the conjunction
of physical BOTH qualification and original And3 feedback readiness. Reference
has neither the added compact recognizer nor the later Run And23/And24 split;
current approved contracts therefore remain necessary for those intentional changes.

## Revised 255-node candidate after the first replay

The first isolated254 candidate produced RnD67/69, with two material failures.
The short-neutral assertion counts TRUE samples at native FinishUp, not rising
edges. Replacing FinishUp by BOTH while CSet reads previous SU stretches
qualification to two consecutive TRUE samples: at threshold CSet precedes SU,
so C is still FALSE; the next scan still sees Eligible TRUE and only then CSet
sees SU. Up/HV already latched and therefore rises only once. Output-edge PASS
does not establish internal causal equivalence.

Correction uses the spare native slot: **retain GATE_020 FinishUp**, preserve
its original4 inputs and original relative order147, activate input5 with
RND_SCOPE direct. STATE_SU.Set stays current FinishUp, and CSet.OrIn3 consumes
current FinishUp in the same scan, restoring original RnD acceptance chronology.
Safe And4 remains on current BOTH TON, not scoped FinishUp; CSet.OrIn4 remains
current Safe accepted owner. Thus Safe not-ready qualification does not consume
C, but RnD FinishUp and its original observation path need no replacement.
Count **255-7+7=255**; corrected ordered manifest is in JSON. The earlier254
count and C-lag discussion below are historical construction reasoning only.

At RnD threshold, original Eligible/both/T/TON conditions are TRUE and added
RND_SCOPE is implied by E and RnD, so scoped FinishUp equals original FinishUp.
At the next scan snapshotC TRUE makes Eligible FALSE, resetting BOTH before
FinishUp: one TRUE sample. In Safe, RND_SCOPE FALSE prevents FinishUp setting
C or SU. BOTH remains eligible until existing And3 readiness accepts Safe
owner, including readiness arriving while held. A released unaccepted chord
resets TON before And4 and cannot queue. This is the revised causal argument;
editor replay must verify it without weakening the oracle or remapping FinishUp.

The editor's native binding audit and B1 paired tests passed on the first
candidate; they do not cover this revision. EarlySTO88 also passed there.
Lifecycle traces, full revised bindings and RnD69 replay remain mandatory.

### Exact candidate build instruction

The editor builder has hardcoded replacement bindings in addition to JSON.
Remove its GATE_020→BOTH replacement-map entry; bind GATE_020.AndIn5 to
RND_SCOPE direct; keep STATE_SU.Set on GATE_020; bind CSet.OrIn3 to GATE_020.
Use revised JSON retire/order lists. Replay may map retired Green/Blue internal
observations explicitly, but FinishUp must use its retained actual native path.

### Bounded lifecycle fixture contract for review

Include actual Network3 state writers and original chronological sequence;
do not cut all phase variables as in the initial component fixture. A conditional
normal-phase replay may explicitly hold only the seven actual Network4/Decouple1
global outputs FALSE, with their native port/global IDs recorded. DecOut1..7
write Step3_Reset, Step4_Reset, Step5_Reset, Step6_Reset, Step1_Reset,
Step1_Set and Step2_Set respectively. DecOut8 has no global output. This is an
external inactive-lifecycle boundary, not a claim about group semantics.
Record a stable initial component phase explicitly; recognizer owner/flags must
start zero and arm through actual full neutral release. Once the protocol
starts, phase/owner flags must not be written by the fixture. Use real normal
writers, including Network5/And7(order111) and Network9/And1(order92) on routes
back to Safe, rather than direct Step2→Safe assignments. Every demanded input
must resolve or be an enumerated boundary; no convenient missing-producer FALSE.
Such traces can establish conditional normal-mode chronology and lack of owner
leakage. They cannot establish full BOOT, Network4 or hardware/group behavior.

## B2: a bounded route that does not select QR

Do **not** install the earlier Safe|RnD|Run candidate while QR is unresolved.
An independent iteration can extend the recognizer to **Safe|RnD only** and
leave the entire current Run physical branch intact, including Network6/TON2,
And24, And23, their raw button bindings and original consumer chronology.
Run short-invalid-chord failures remain expected. They are not hidden or waived.
The candidate targets the five observed Safe failures; it does not claim full
Safe coverage from those five tests alone.

This is a technical split, not a new Run BOTH policy. MODE has only Safe and
RnD inputs. Stable Run still clears the compact recognizer as before. Neither
Run BOTH nor Run Green gets routed through its C, SG or SU. StartingRun remains
the existing RnD owner interval: SU Set, direct Network12/OR1 fanout and both
early STO OR3 fanouts keep their original ordering. PLC branches are untouched.
Normal phase overlap must nevertheless be replayed before this can be accepted.

Count: retain RunTON2 (one fewer retirement), omit RND_SG and OWNER_EXIT.
`255 - 8 + 7 = 254`. SG_OWNER_SET = GREEN.Done AND !Safe; under this bounded
MODE, it admits RnD ownership only. Existing Network12/OR2 keeps direct SG.
No Run-specific ownership, lock-before-owner policy or endpoint is introduced.

## B1 order and guard-ready while-held trace

Required local execution sequence is current BOTH TON, relocated existing
Safe And4, SAFE_ACCEPTED_UP, CSet. And4 retains original And3 and adds current
SAFE_UP_SCOPE. Safe owner Reset is !SAFE_UP_SCOPE and remains reset dominant.
CSet reads GreenDone, BlueDone, previous SU and current Safe owner.

Consider an already qualified valid Safe chord with original And3 FALSE.
Safe owner and C remain FALSE, so Eligible remains TRUE while BOTH is held;
T stays TRUE, both TON stays TRUE, and SingleEnable stays FALSE. If original
And3 becomes TRUE during this same continuous hold, And4 becomes TRUE when
it executes, owner sets immediately afterwards, and late Safe OR1 sees that
accepted request in the same scan. Original readiness can still release the
request. If the buttons are released first, BothEnable and TON clear before
And4; later And3 readiness cannot set the owner. This is a causal design proof,
not a claimed executed candidate trace. Both paired cases must be tested.

FinishG/FinishB removal is valid only with enables before their TON and all
replacement consumers after the TON. Finish includes primary raw input, but
current enabled TON TRUE already implies current primary input TRUE in the
declared software TON semantics. FinishUp additionally needs prior T TRUE:
capture sets T at the first valid chord sample, a whole continuous 1000 ms
elapses before BOTH.Done, and neither !E nor full off-release reset can occur
inside that interval. Loss of E resets Both TON before any replacement use.
The C lag for RnD SU cannot enable a single: T remains TRUE in that lag scan.
Native/hardware timer precision is outside this proof.

## B3: source order ledger and remaining proof

Actual current main EStop executes at order **23**, not historical order21.
Current E executes123. Its paired inverted Mentee channel is evaluated by the
current main EStop before E; remove the explicit late Mentee input only with
this actual current binding/order proof. Current PLC Stop remains explicit
because its other producer executes after main EStop.

Safe to RnD normal route: physical request reaches Safe OR1 order239;
Step12 RS185 cannot see it until a later scan; Safe RS19 then sees Step12 and
resets before recognizer123; the Step12-to-RnD producer120 and RnD RS182 only
establish RnD after that recognizer execution. There is a real sampled MODE=0
interval. This is not a global onehot assumption.

RnD down to Safe is **not** the Run-to-Step12 route. Its actual path is SG163,
Network12 OR2(199), Decouple1(200), And15(201), Step2 Set_2, Step2 RS22,
RnD reset OR13(180)/RS182. After RnD clears, Step2 remains a non-MODE phase;
the recognizer clears before Safe can be entered through the existing normal
Step2/down sequence. Do not replace this ledger with a presumed direct RnD-to-Safe
edge. Full Step2 discharge/endpoint reachability is not established here.

RnD to Run: Run RS49 can rise while RnD RS182 has not yet cleared. Preserve SU
through that overlap. OWNER_EXIT = snapshotSU AND !RnD disables E only on the
first recognizer scan after actual RnD exit; SU must not reset from early Run
rise. Bounded MODE Safe|RnD already goes FALSE at exit, so OWNER_EXIT is
omitted for this particular split. This does not license the full Run candidate.

Before any SAL handoff, editor/reviewer must establish an executable candidate
with fresh native IDs and mandatory wrappers, full SAL/SGVL binding audit, all
retained relative orders (except the declared single-consumer And4 move), and
replay accepted RnD69/earlySTO88 suites. Also required: guard-ready while-held,
guard-ready after release, Safe green/full-release/blue, connector-absent Safe
blue versus blocked energy advance, first fault/rearm, Safe-to-RnD,
RnD-to-Step2-to-Safe, and RnD/Run overlap with unseeded recognizer owner state.
No arbitrary native delay oracle or phase onehot seed replaces these traces.

## Concrete handoff state

The counted JSON now records an exact ordered partial candidate and unchanged
Run boundary. It is a patch specification, **not generated SAL or executed
native graph**. B2 is avoided only for this bounded iteration; the full shared
candidate remains HOLD. B3 replay is unfinished, so no SAL READY is asserted.
Next independent work is candidate construction/replay against this manifest;
the remaining uncertainty is technical, not a request to invent QR/QT/QP.
Only the three assigned architecture documents were edited.
