# Independent review — Safe/Run gesture plans

2026-10-20. Source0fc39751…/SGVL06010caf…. Plan only; no source/test edits.

**Known test requirements: ACCEPT / READY for independent red preparation.**
**Counted255 candidate: HOLD / NOT READY for SAL implementation.**
The nine native retirement IDs match actual source, all named templates exist,
and255−9+9=255. This disproves a blanket resource-impossibility claim; it does
not prove the proposed composition's behavior. Historical260 text is not the
current candidate. The following blockers do not delay known red tests.

## B1 — Safe qualification retained before original guards accept

SAFE_QUALIFIED_BOTH.Set=BOTH.TonOut; Reset=!SAFE_UP_SCOPE, where that scope is
E&&Safe&&CurrentPermit. Original And3 feedback permission is only downstream
in relocated And4. Thus qualification can latch while And3 is FALSE, despite
the RS explicitly not representing an accepted energy transition.

Concrete conditional design trace: stable Safe, healthy E/CurrentPermit,
STO_DR1_FBK FALSE (actual And3 input2, absent from E/CurrentPermit), valid chord
held full1000ms. Safe qualification latches but actual energy request is FALSE.
Release both for at least two settled source scans, then restore STO feedback.
Original And10(order238)→TON3(order26) has reset after release and cannot issue
the physical Step12 request. Proposed retained Safe RS remainsTRUE and And3
can now enable And4 without held buttons. This is a changed pending-request
policy, not implied by no-rollback for an already accepted launch.

Before SAL handoff require source-preserving redesign/proof or analyst/user
adjudication of this exact scenario. Do not silently count qualification as
accepted launch or pick retention/drop behavior for budget. Also cover guards
becoming ready while BOTH is still held; that is a separate original behavior.

## B2 — valid Run BOTH implicitly gets an endpoint

In Run, qualified BOTH drives C.Set while STATE_SU and Safe-qualified RS are
reset by their mode scopes. No endpoint is routed, and the attempt is consumed
until release. That concretely behaves as ignore/consume even though QR is
unresolved. Omitting an endpoint assertion does not make the program neutral.
Analyst must settle the allowed partial boundary or obtain the user decision
before enabling that shared graph on these inputs. QT/StartingRun and QP PLC
likewise must not acquire new behavior through changed ownership implicitly.

## B3 — ordered proof and handoff coverage still absent

Removing FinishG/B is plausible on the current source ordering: enables132/133
precede TON137/138, and finish144/145 before owner flags. Current TON TRUE
implies current enable and raw primary. FinishUp additionally needs an inductive
T invariant: valid capture sets T on the first chord sample; no reset can occur
during the continuous1s that qualifies BOTH. FullReset/off and !E are incompatible
with a current qualified BOTH. These are conditional causal arguments, not
independent arbitrary-Boolean truth tables or a ready replacement manifest.

An ordered native plan must preserve enables→TON→all replacement consumers,
reset/contact polarity, snapshot/update ordering and current E fault handling.
Replay the complete accepted R&D69 and earlySTO88, including first fault,
rearm, expiry and late-button cases. R&D SU may not gain a scan of delay or
be cleared by early Run rise. OWNER_EXIT(snapshotSU&&!Rnd) is a reasonable
proposal for that overlap but still needs an actual handoff trace, not just
onehot assumptions or seeded epoch flags.

Prove all relevant normal mode changes, including SG/down paths back to Safe,
not only Safe→RnD and Run→RnD. A continuous MODE can retain SG and suppress
release if a gap is assumed rather than observed. This is a proof obligation,
not a claim that an arbitrary conflicting phase cut is a reachable defect.
Full BOOT need not be solved to test a bounded declared normal-phase protocol,
but that protocol and its limitations must be recorded.

Actual SafeAnd4 has exactly one consumer SafeOR1, no output globals/aliases;
its proposed move can be reviewed, with the original feedback guards intact.
Mentee removal from late E is plausible because main EStop21 evaluates its
effective inverted channel before E123; confirm that order in the new manifest.
Safe connector-absence access needs the proposed scoped permissions; energy
advance still requires connectors and original guards. No shared R&D energy
permission may silently become the Safe solenoid access guard.

## Independent work allowed now

Prepare exact known-red SafeBlue500/held-entry/release/late/access and SafeBOTH
249/250/251/flicker/piano scenarios, with original guard-ready positives.
Prepare RunGreen500, held-entry, invalid short chord→one button and recovery
positives. Observe qualification, actual writer and final output continuously;
keep raw main Restart distinct from normal StepDown. Avoid full valid Run
BOTH, StartingRun new-command or standalone PLC endpoint oracles.

Source-identity/binding checks and a separate retirement audit of the three
proved pure dead ANDs are independent. Removing live timers/finish blocks or
installing the shared recognizer waits for the above behavioral/ordered proof.
Unknown outcomes return to the analyst/user; no new timer, hardware or full
native-emulator investigation is required by this review. Reviewer writes STOP.

## Separate editor test-plan verdict

2026-10-20: `SAFE_RUN_GESTURE_TEST_PLAN.md` **ACCEPT / READY for RED-only
implementation**, limited to its first bounded package. The broader matrix
is a later coverage backlog, not a hidden requirement to expand this handoff.
This does not lift the counted native candidate HOLD above.

The new helper is appropriately separated from automatic R&D preparation.
Fresh file-derived full SAL/explicit SGVL audit precedes dependency selection;
real output-owner/alias/global indices and effective ESTOP/DECOUPLE selection
prevent convenient missing-producer fallback. Typed phase cuts and PLC00 are
recorded. Main Restart and Run preparation use real producers; ResetPB_Lock
must be made FALSE through its actual writer or returned as a fixture issue.
No energy outputs, grants, commands or accepted markers are seeded.

The proposed direct-port observations bind actual native writers and include
parallel branches/consumers. Before500/no-BOTH-before1000 are normative lower
bounds; qualification and actual consumption have separate measured causal
delays. Current latency must be recorded from source chronology rather than
an arbitrary grace interval or a new normative old-order delay. Every sample,
including first entry/press/recovery, participates in pulse checks; positive
controls establish actual producer availability.

The And3-notready test preserves a demonstrated source behavior: qualify while
STO feedback holds And3FALSE, release long enough for actual old TON3 reset,
then restore readiness. No delayed Step12 launch is permitted from that prior
unaccepted attempt; a fresh ready-guard gesture is its positive control. This
directly distinguishes B1's proposed qualification queue without inventing a
new accepted-event flag. It is safe to prepare before deciding how to repair
the native candidate.

Run short failed chords use less than1000ms of simultaneous hold, both first
orders and both remaining buttons. They do not choose the full Run BOTH QR
endpoint. Safe/Run full-state completion, StartingRun new-green QT, PLC QP,
QF/QD and full BOOT/group semantics remain excluded rather than falsely PASS.
Unexpected setup failures must be ERROR/returned to architecture, not red SAL
behavior. After targeted tests/evidence, independent review and honest red
checkpoint still precede any native source implementation. Reviewer writes STOP.

## B1 proposal correction reviewed

The revised MD/JSON moves actual And3 readiness and Safe scope ahead of the
new Safe request RS: current BOTH→existing And4→SAFE_ACCEPTED_UP→late SafeOR1.
CSet no longer consumes raw BothDone; it consumes previous R&D SU and current
Safe accepted RS, leaving a not-ready held chord eligible for later readiness.
**ACCEPT as the bounded B1 design correction**, conditional on the specified
same-scan order. It addresses the concrete pre-guard queue counterexample:
no owner is set before And3, release resets current BOTH before And4, and
later readiness cannot queue that released attempt. Readiness becoming valid
while BOTH remains held can still produce the original request.

No extra block is needed: four CSet OR inputs fit the existing primitive,
and the overall proposed count remains255. R&D SU Set and early STO wiring
are unchanged; its CSet observes SU one scan later. T must remain TRUE across
that lag, prohibiting SingleEnable even if one button is released. Actual
ordered replay must verify this and all retained R&D/early-STO cases; a counted
symbolic proposal is not the executable proof.

This closes B1's initial proposal defect at design level only. It does not
approve the broader Safe accepted-owner lifetime/handoff, Run Lock-before-owner
semantics or the QR/QT/QP policies. B2/B3 HOLD remains; no SAL handoff is granted.
