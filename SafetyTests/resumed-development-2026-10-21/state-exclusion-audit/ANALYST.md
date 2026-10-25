# Safe / Armed exclusion: independent scenario criteria

2026-10-21. Explicit additional audit authorized by Vadim within the resumed full workflow. Requirements/scenario role only; no source, tests, runtime, root scripts/findings or architect files edited. StateConflict recovery destination is deliberately unchosen. This audit does not require an enum representation or authorize invented Emergency/TransitionFault behavior.

## Sources and identity

Read current AGENTS/WORKFLOW and WORK_STATUS formal checklist, latest SCENARIO_DECISIONS (Niv cancellation, Vadim confirmations, QP alone/buttons/Fault and no LED-blinking gate), SPEC13–14/EMG012/MOD006/BOOT criteria and reference behavior. Read root SOURCE_TRACE/FINDINGS/COMPONENT_PATHS/COMPETING_PATHS and architect STATE_EXCLUSION_ANALYSIS. Then directly inspected exact reference state latches/start fallback before canonical, with full native-structure preflight before parse.

Reference SAL `efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334` at confirmed Prodoction4495a1f, native-structure PASS. Canonical SAL `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`, SGVL `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b`; native-structure and typed binding PASS. These are software structure/source facts, not CRC/target/hardware or startup acceptance. No reference checkout modification.

## Exact normative meaning

- Safe for the current STATE check is actual `b_Step1`, written by `Network3/FBRs1.RsOut`, order20. Armed/Run is actual `b_Step3`, written by `Network3/FBRs3.RsOut`, order48. Both are internal phase memories, not measurements of voltage or motor torque.
- Exported `out_Step1/out_Step3` and `out_Safety_Armed` have separate Decouple publication times (orders102/52 respectively). Observe their values directly; do not synthesize Safe from `!Armed` or assume status publication coincides with state update.
- SPEC13–14/EMG012/MOD006 forbid conflicting stable ownership. Exactly one intended main mode is required once a valid operating state has been established; legitimate startup/transition phases must be enumerated before classifying all-zero as invalid. A raw count over every Step1–6/Step12 is not the approved main-mode one-hot invariant: those include transition phases.
- A Safe status is not proof all commanded/physical energy is already removed; its required meaning must be checked against commanded outputs and given feedback. Conversely a commanded contactor retained during controlled removal is not automatically a new energy rise or a mode conflict.
- Expected reaction to genuinely invalid ownership is a safe fault, but Emergency versus TransitionFault and its recovery have not been selected. Audit exclusion and actual consequences without asserting either destination as an oracle.

## What the current evidence establishes

The standalone STATE check cuts to Network3 and injects `b_Step1_Set` and `b_Step3_Set_2` concurrently. The actual upstream program writers are absent. It establishes that two reset-dominant RS instances do not mutually exclude arbitrary contradictory Set requests at that boundary; both statuses can remain true under those injected preconditions. It does **not** establish a legal external-input history reaching them.

Actual source does not supply unconditional direct SafeSet→RunReset and RunSet→SafeReset or shared exclusive storage. Other states and original producer constraints may nevertheless exclude conflicting requests in every admissible history. Therefore neither “no symmetric cross-reset, so reachable defect” nor “three traces passed, so impossible” is a valid conclusion.

Root's three actual-producer paths (normalcycle/down, EStopduringlaunch/restore, HealthylossRun) and three competingPLCgreen paths observed no Safe+Run overlap. They begin with declared Safe and seven inactive N4 writers, then allow raw inputs only and execute real producers. This is useful bounded evidence, not fullBOOT or exhaustive exclusion. PLCwhilegreen stimulus is an admissible **external stimulus** even though the required response is ignore; the current competing-request behavior is independently inconsistent with latest QP, not proof of simultaneous Safe+Run.

## Admissible initialization and stimuli

| Class | Allowed setup/input | What it can prove |
|---|---|---|
| Whole software startup | Actual declared initial globals/FB memories plus supported group RunStop/ErrAck lifecycle; all actual producers included; N4 inputs resolved from authoritative program semantics | BOOT/reachability from project startup if every required semantic is supported. Merely requesting groupRUN or resetting mainEStop does not establish this class. |
| Declared stable Safe component | Single explicitly seeded initialSafe/typed owner, explicit inactiveN4 boundary and other cuts; no post-entry phase/memory/internalrequest injection | Conditional preservation of exclusion from that boundary under enumerated raw protocols. Cannot claim native startup or use it to waive BOOT. |
| Declared stable R&D/Run component | Same explicit boundary discipline, actual upstream producers retained when demanded | Conditional phase-specific histories; supplement real producer entrance from earlier valid mode. |
| Contradictory internal requests | Direct Set/Reset injection, arbitrary previous RS state or corrupted ownership | Robustness/boundary response only. Not legal program-input reachability unless a real producer trace proves the same tuple. |

Starting without an active mode is not by itself a fault: actual startup fallback requires the Run/EStop permissions and absence of other phase memories. Reference also has the unsourcedN4 block. Do not assign its used channels FALSE/TRUE merely because that enables desired startup; do not remove it or invent an alias. The absent group memory/default contract remains a technical investigation, not a hardware gate or a user-choice shortcut.

“Admissible input” does not mean only successfully accepted operator commands. Raw concurrent green/blue/PLC changes, early/late feedback, safety faults and restoration are valid stimuli to the program and require defined rejection/protection. Do not exclude them to prove the invariant. Only constrain external histories by documented given-input/software scan contracts; contradictory feedback can be a required negative scenario, not automatically an impossible physical event to discard.

## Required independent scenario matrix

| Scenario family | Actual protocol / paired controls | Observation and oracle |
|---|---|---|
| Startup/mainReset | Fresh supported group entry; cause-clear before/after mainFB Restart; green held then released; groupSTOP/RUN and ErrAck separately | No autoArmed from startup/restart or stale request. Fallback creates Safe only under its source conditions. Record capabilityNV if N4/group unresolved, not inventedPASS. |
| Normal forward | Actual Safe→Step12→R&D, release2000, freshBOTH→StartingRun→Run; vary C1/C2/Healthy/STO confirmations at source boundaries | No Safe+Run at actual state publications/consumer reads; no single held gesture skips R&D. Run declaration only after actual confirmation; early torque grant remains approved separately. |
| Normal reverse | Real Run→normaldown→R&D then neutral/newgreen→LVoff/FBKOFF→Safe; include alreadyOFF feedback positive and heldON rejection | No direct two-step down from same hold; no Safe before its known completion. Actual producer staleSet deassertion must be observed through next entry. |
| Original Step2 | Legitimate originalstart route and source-specific failedreturn separately, without inventing N4activation | Retained sequence remains functional and no conflicting Safe/Run owner. Conditional originalStep2 entry labelled if source startup not proved. |
| Run confirmation versus down/Safe return | Acceptedlaunch then actual down owner, matching C2ON/OFF/Healthy changes before/on/after state-writer scans; retained previous-scanRunSet included | Current same-scan C2ON/OFF predicates may contradict, but old globalpublication can persist. Test chronology, not same-scan Boolean algebra alone. No injection of final Set tuple as sole proof. |
| PLC versus physical | New independentPLCup/down in stableR&D bothOFF positive; newrequestwhileeachpressed negative; then release with unchanged heldcode; genuine newrequest after cleanup | Required ignore while pressed/Fault and no hidden queue/repeat. No separateLEDblinking gate. Record opposingrequests separately from phaseoverlap; do not equate their presence. |
| Fault during each handoff | Each physicalEStop/externalNC/connector-afterSafe/Mentee/PLCstop, one-scan/held then rawrestore, before/on/after entry/confirmation | Protective priority, no new energy rise and no auto restoration of invalid owner. Trace all actual emergency/normal owners; mainEStopOK alone is not every emergency owner. |
| Healthy branch/abort | Actual normalSS1/Healthy loss+restore/fullcoast; freshgreenStartingRunabort C2ON and C2stillOFF; latefeedback after abort | Preserve agreed sequence/owner, no cancelledlaunch revival. No new conflict recovery policy inferred. |
| SafetyFaultack/mainRestart | In the defined rolled-backupFault case, anybuttonPRESS ack consumed until bothOFF2000; separately raw mainEStopRestart press/release | No normal command from ack attempt or stale accepted owner. Do not seed nonexistent fault memory to claim implemented rollback; unsupported current detector reported separately. |
| Corrupted internal tuple | Preserve old STATE injection and enumerate Set/Reset overlap under explicit corruptedrequest precondition | Conditionalfail/robustness evidence retained; not relabelled operatingdefect or silently removed to green suite. Recovery destination remains undecided. |

Use same-scan and nearest preceding/following scan events for all handoffs, both green/blue order where relevant, plus held/pulse/stale Set lifetimes. Exact250/500/1000/2000 boundaries follow approved button clock contract; no new timer values or grace periods. Finite phase/reaction coverage is not universal reachability by count alone.

## Observe ordered behavior, not only end-of-scan statuses

Independent fixture must audit the whole actualSAL/SGVL before closure, retain real source IDs/canonicalwire/Symbolusage and source identity, and reject unresolved demanded fallback. Include all Safe/Run Set and Reset producer cones, timer/owner state, previous publications and active readers. Raw input values stable across a scan only under the explicit software input contract; no claim native sampling proved.

Record every FBRs1/FBRs3 update, their effective Set/Reset and current retained counterpart, exported status writes, and mode/energy/Unlock consumers at evaluation. Distinguish:

1. endscan stable overlap;
2. within-scan owner overlap and whether a real reader consumes it;
3. status export overlap due to publication chronology;
4. incompatible actual outputpermissions/Set or outputrises.

Any observed owner overlap is evidence against literal exclusion in that scope, but its operational consequence must be traced rather than assumed to mean unsafe simultaneous physical energy. Do not dismiss it solely because endscan clears, or label unpublished transient evidence as measured hardware behavior. Preserve first divergence even if endpoints converge.

## Structural/invariant proof target

The architecture can establish exclusion with native-compatible RS/guards/ownership; enum is neither mandated nor presumed available. Proposed induction must identify a justified base, then cover **every** actual Set/Reset producer with execution-order/previous-publication cases. In particular: fallbackSafe; N4SafeSet/Reset; Step6Safecompletion; originalStep2faultreturn/Runconfirmation; LVdownSafecompletion; R&DRunconfirmation; Step4/Step12Runreset; phase handoff and protective takeover. Exact current producer manifest is SOURCE_TRACE, not independent arbitrary booleans.

Either provide a bounded proof preserving `!(Safe && Run)` for all supported source/environment histories within explicit limits, or freeze a counterexample generated only through actual producers after declared entry. If full startup cannot be modelled, say exactly which conditional base was proved. Missing universal proof is not by itself evidence of a reachable fault; missing structural guarantee merits investigation, not arbitrary code redesign.

## Readiness and questions

Ready for independent tester/architect to execute this matrix and close the formal WORK_STATUS checklist within supported software scope. No new userquestion is required merely to start: forbidden ownership, buttons, door, PLC-alone/pressed rejection and noLEDgate are already defined. Emergency versus TransitionFault remains deliberately undecided and must not be chosen by testauthor. If an actual legal-source trace requires a previously unspecified normal/rollback reaction, send its exact initialstate, rawhistory and missing expected state/output to root; stop only that dependent endpoint. First exhaust N4/group software documentation/SDK investigation before asking author intent.

This role did not run the independent scenario matrix or claim exclusion acceptance. Source facts plus exploratory six paths remain preliminary. No implementation or canonical adoption recommended until separate tester/reviewer evidence and an actual reviewed repair plan if needed.
