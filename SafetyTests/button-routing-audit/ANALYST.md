# Button routing: requirements and actual-source analysis

Date: 2026-10-20. Role: independent requirements/scenario analyst. Verification only; no SAL, SGVL, runtime, tests or shared status files edited.

## Source identity and method

- Working SAL: `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`, SHA256 `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`.
- Working SGVL: `MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl`, SHA256 `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b`.
- Read-only reference SAL: `C:/Users/user/source/repos/MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`, SHA256 `efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334`, matching recorded confirmed Prodoction/4495a1f reference. This role did not change or switch its checkout.
- Read WORKFLOW, current plan, latest SCENARIO_DECISIONS, reference mapping, user-decision handoff, prior gesture/resumption analyses, current checks and test source. Directly parsed relevant reference blocks, then actual working SAL. Working parser performs whole-source typed bindings before selection; parsed actual paths, global IDs and Symbols, not basename-only matching. Native structural preflight and dynamic execution remain independent tester responsibilities.
- Source inventory below is static. Earlier PASS counts are historical evidence until the independent tester reruns this exact hash. Fixed state-owner component checks do not prove complete group/startup reachability.

## Meaning of unambiguous routing

One physical attempt may produce at most one normal operation classification (blue, green, BOTH). A single accepted operation can legitimately fan out to multiple coordinated actions: C2 request and both torque-permission requests for accepted R&D launch, for example. Multiple wires or multiple consumers alone are not duplicate commands.

Separate normal acceptance, retained ownership, phase changes and output actuation. A held command level is not a new command on every scan. Green raw input additionally serves the existing EStop Restart and immediate Unlock suppression; these roles cannot be removed to force all raw input consumers through the normal gesture recognizer. Emergency can override an accepted normal command.

## Approved invariants / required scenarios

1. Single green/blue requires continuous 500 ms. BOTH requires second input within inclusive 250 ms, symmetric first-button order; continuous BOTH1000 begins with the second input.
2. An attempt cannot degrade from attempted BOTH to single. A new attempt needs both OFF and the existing full release filter (2000 ms currently retained; no new parameter is proposed).
3. Late second before single acceptance invalidates the attempt without fault. Late second after acceptance neither rolls back nor interrupts that command and creates no additional command. At 500 ms single priority applies. Green still suppresses held Unlock immediately.
4. Safe/Step1 green single does not launch energy. Safe blue remains permitted with missing connector alone under existing access conditions. Energy advance still requires its own guards and feedback readiness.
5. Accepted R&D launch retains its ownership while it is pending, including approved early torque release. Release of the original buttons does not cancel it. Its final mode-exit cleanup must prevent reuse in the next mode.
6. Latest D-RUN-BOTH-IGNORE: fresh valid BOTH in established Run is ignored, and releasing one afterwards cannot create a single command. Fresh green after full neutral remains normal down.
7. Latest D-STARTINGRUN-GREEN-DOWN plus later abort refinement: a genuinely new green500 after full cleanup during unfinished StartingRun aborts launch. This differs from a late second of the original launch. Abort uses STO → Discharge → existing discharge delay → C2 OFF → feedback OFF; no SS1/coast for this abort. Feedback arriving later cannot restart the cancelled launch.
8. R&D new green normal down must reach Safe after ordered LV-off actions and LV feedback OFF; no fresh energy-up can arise without a fresh accepted request. D-LV-OFF-COMPLETE is answered, not a pending user question.
9. Fault/permission restoration cannot itself substitute for manual restart or a fresh required operation. Mutually incompatible modes/requests must not be accepted together. Exact invalid-state fault destination remains a separate unresolved policy.

Sources: current AGENTS/WORKFLOW, SCENARIO_DECISIONS (latest direct answers precede historical pending tables), USER_DECISIONS_2026_10_20_HANDOFF, USER_STOP_SEQUENCE_HANDOFF. No new expected behavior is inferred from present implementation.

## Actual working paths

| Function | Actual route | Interpretation |
|---|---|---|
| Normal classifier scope | `SafeResumption/MODE` (`b_Step1 OR b_Step_RnD`) → Symbol `linkSafeMode` → `RndPhysicalCompact/GATE_001` | Common classifier scope excludes established Run. It is inaccurate to describe all Run button handling as passing through this network. |
| Safe blue | `RndPhysicalCompact/STATE_BA` → global `recRndC_BA` → `Network2/FBAnd7` → `b_Set_Door_Unlock` → Network1 grant/hold | Current source no longer uses the historical direct-raw-blue Safe producer. Door/reset/held-blue/green/EStop gates remain downstream. |
| R&D blue | same `recRndC_BA` → `Network12/FBAnd2` → `b_Set_Door_Unlock_1` → Network1 | Different mode consumer of the same classification; not automatically duplicate acceptance. |
| Safe physical up | `RndPhysicalCompact/BOTH` → Symbol `linkRndBothQualified` → `Network2/FBAnd4` with original `FBAnd3` readiness → `linkSafeAcceptedUpSet` → `SafeResumption/SAFE_ACCEPTED_UP` → `linkSafeAcceptedUp` → `Network2/FBOr1` → `b_Step12_Set` and transition/ResetPB-lock fanout | Qualified button time alone is insufficient for acceptance. The actual readiness conjunction owns acceptance. Accepted owner resets on loss of Safe-up scope. |
| R&D physical up | `RndPhysicalCompact/GATE_020` → `STATE_SU` → global `recRndC_SU` → `Network12/FBOr1` → launch fanout; also `Network1/FBOr8/OrIn3` and `FBOr10/OrIn3` | Direct early-STO fanout is deliberate approved behavior, not necessarily double operation. All three consumers and cleanup must be observed. |
| R&D physical down | `linkRndGreenQualified` → `SafeResumption/SG_OWNER_SET` (`!Step1`) → `STATE_SG` → `recRndC_SG` → `Network12/FBOr2` → Decouple1/down actions → `FBAnd15` → `b_Step2_Set_2` | Request ownership, phase owner, completion and inherited original Step2 power-on must be audited separately. Existing dedicated down owner is not itself proof of full Safe completion. |
| Run physical down | raw `in_Reset_PB` → `Network6/FBTon2` → `FBAnd24` → `FBAnd23` (Run qualifier, `!blue`) → `FBOr5` → `FBDecouple2` | Separate level/timer route outside common classifier. No common irreversible BOTH-attempt or release ownership is imposed by this branch. |
| Raw green safety/reset | `Network1/FBEstop1/Restart` plus raw consumers in Network1 and phase networks | Intended separate roles; distinguish reset acknowledgment and output hold from normal classified commands. |
| PLC independent routes | `Network2/FBAnd61/81/91` → `FBOr1`; `Network12/FBAnd8/9/10` → `FBOr1`, `FBAnd12/13/14` → `FBOr2`; `Network6/FBAnd15/16/17` → `FBOr5` | Parallel sources exist. Physical-only proofs must disable these explicitly and cannot establish their independent acceptance policy. |

The input inventory confirms raw blue also directly suppresses Run down through `Network6/FBAnd23/AndIn3`; raw green and blue remain immediate Unlock/reset consumers. Therefore a blanket assertion that no downstream block reads physical buttons is false and is not an approved requirement.

## Findings and limits

**No unconditional all-clear is justified.** Existing exact-hash SOFTWARE_CHECK_RESULTS records 443/445 current assertions and 200 PASS / 1 FAIL / 7 NOT VERIFIED scenarios. Specifically, Run failed-short-chord scenarios with green remaining produce a forbidden normal-down request. The current Run path above independently explains why: its raw green TON can mature while blue is also ON, then `!blue` becomes true on release. The two button-order failures are two scenario manifestations, not automatically two independent defects. Fresh independent replay is requested from tester.

ACC-B01 explicitly leaves complete recognizer/reset ownership across Safe/R&D/Run unbound. `LATE:NO-ROLLBACK` and `LATE:NO-FAULT` component coverage do not observe complete transition/group behavior. Boot/group lifecycle and eight unbound Network4 Decouple inputs remain unproved; no full startup claim can be made from this role.

Existing conflict-state test reports simultaneous Safe and Run under conflicting injected Set requests. This demonstrates a conditional state-owner weakness, not reachability from legal external input history. Do not turn the test's injected precondition into a proven reachable hazard. Exact destination/recovery on invalid state requires the existing Q-FAULT-DESTINATION answer if implemented.

Latest Run BOTH-ignore, fresh StartingRun abort, and down-completion decisions supersede older QR/QT/LV pending tables but are not made implemented merely by being answered. Their retained-owner/reset paths must be executed through actual writers by independent tester; no new clarification needed for those already specified operations.

## Minimal remaining user clarification

Q-PLC-REQUEST is still unresolved. In stable R&D, both buttons released and all guards healthy, PLC makes a **new** 10→11 request: should that alone start R&D→Run, or wait for a new physical BOTH gesture? Conversely, should a new PLC00 request alone start R&D→Safe, or require new green? These are normal-operation acceptance decisions, not a choice of internal marker.

The user's demand for a single-valued route per physical gesture does not forbid independently authorized PLC requests. Neither delete independent PLC routes nor approve their existing held-level behavior from this new wording. Where physical and PLC operations conflict in the same interval, retain emergency priority and do not invent a normal-command arbitration policy without the applicable contract.

## Handoff

Independent tester should rerun current software suite; prove exact-hash Safe/R&D gesture invariants and expose known Run chord-to-single fail, then separately test latest valid Run BOTH-ignore and StartingRun fresh-green abort including owner cleanup and output request rises. Observe all normal operation producers and downstream fanouts per scan, not only final status; count acceptance events separately from held TRUE samples. Keep PLC policy and group/native limits visible. This analysis authorizes no functional changes and does not claim native/target/hardware validation.
