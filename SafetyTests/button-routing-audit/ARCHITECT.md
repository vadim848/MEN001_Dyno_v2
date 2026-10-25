# Button routing architecture audit — 2026-10-20

Scope: read-only audit of actual working SAL. No SAL/SGVL, hardware, group/target, timer, download or equipment changes. This report distinguishes source facts from conditional execution and unverified lifecycle behavior.

## Source and preflight

- Working SAL: `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`, SHA256 `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`.
- Working SGVL: `MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl`, SHA256 `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b`.
- Read-only original SAL examined at `C:/Users/user/source/repos/MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`; authorized reference identity is Prodoction/4495a1f6049f6a58ebfd436761faa84d17c8d643. No checkout/branch mutation.
- Before any functional trace: `inspectNativeSalStructure` PASS, 14 networks, 254 blocks, 2172 ports, 75 local Symbols, 319 wiredLinks, zero cross-network graphical wires. Required singleton usage/relationship wrappers checked. `parseSalFile` full typed SAL/SGVL binding audit PASS, no errors. This is software structure evidence, not native CRC/IDE/target acceptance.
- Requirements read: AGENTS.md, WORKFLOW.md, SCENARIO_DECISIONS.md and SOFTWARE_ACCEPTANCE_SCOPE.md, including current D-CHORD250/D-Q500/D-LATE-SECOND, D-RUN-BOTH-IGNORE, D-STARTINGRUN-GREEN-DOWN and newest stop/reset answers. Historical status/SHA/counts in acceptance history are not current evidence.

## Actual four-layer routing

1. Physical inputs: green=`in_Reset_PB`; blue=`in_Relase_Door_PB` (existing spelling). Green is also native EStop Restart; it is not exclusive to the gesture recognizer.
2. `RndPhysicalCompact`: release preparation and 2s RELEASE; WINDOW=250ms; GREEN/BLUE=0.5s; BOTH=1s, snapshot states A/T/L/C and previous inputs. Single and chord qualification feed separate latches.
3. Context/acceptance: SafeResumption.MODE is Step1 OR RnD, CONNECTOR_SCOPE is Step1 OR both connector interlocks. GATE_001 combines mode, connector scope, EStopOK and current PLC-stop permissive. SAFE_UP_SCOPE additionally needs Step1 and linkLvCurrentPermit. RND_SCOPE additionally needs RnD.
4. Consumers: Network2/Network12 create phase requests; Network3 owns phase RS latches. Network1 merges actuator requests through OR/Set gates and RS memories. Not every action needs a phase change; Unlock is a held action within Step1/RnD.

## Per-command trace

| Context and gesture | Source route | Effects / ownership |
|---|---|---|
| Step1 blue | BLUE -> STATE_BA/recRndC_BA -> Network2/FBAnd7 | b_Set_Door_Unlock -> Network1 FBOr4/FBRs6 -> FBAndUnlockHold -> solenoid. Raw blue release or green assertion resets/blocks Unlock; EStop/PLC guard remains. |
| Step1 green | GREEN -> SG_OWNER_SET requires NOT Step1 | Does not acquire recRndC_SG and cannot issue the RnD-down command from Step1. It still directly participates in EStop Restart, Reset lock and unlocking gates. |
| Step1 both | BOTH/linkRndBothQualified -> Network2/FBAnd4#144 AND ready and linkSafeUpScope -> linkSafeAcceptedUpSet -> SafeResumption/SAFE_ACCEPTED_UP#145 | linkSafeAcceptedUp -> Network2/FBOr1#239 -> b_Step12_Set and transition/reset-lock requests -> Network3/FBRs8 -> Step12 -> Network11 PreRnD C1/LV actions -> RnD confirmation. |
| RnD blue | STATE_BA -> Network12/FBAnd2 | Requests Unlock only with RnD, green OFF and existing DoorMonitor condition; final hold gate also applies. |
| RnD green | GREEN/linkRndGreenQualified -> SG_OWNER_SET#166 -> STATE_SG#167 | recRndC_SG -> Network12/FBOr2#201 -> FBDecouple1#202: C3/RBM resets, LV discharge, C1 reset, transition2. And15 waits for C1/C2 command and feedback OFF plus permits, then b_Step2_Set_2 (name is historical; current Network3 routes this into Step1). |
| RnD both | GATE_020 -> STATE_SU#168 | recRndC_SU -> Network12/FBOr1 -> C2/up chain and directly Network1/FBOr8+FBOr10 for early STO release through current Set permissions. This is intentional coordinated fanout: same accepted up requests C2 and torque permission. Later feedback path still confirms Step3 and has STO requests of the same direction. |
| Run/Step3 green | Separate raw input -> Network6/FBTon2#209 (0.5s) -> FBAnd24#251 (!ResetLock) -> FBAnd23#245 (Step3 and !blue) -> FBOr5#213 | Dedicated HV-down route: STO requests, HV discharge and C2 reset, then 0.2s/feedback -> Step12. This route does not use recognizer A/T/L/C or release/rearm memory. It is not in the original reference SAL Network6, whose ordinary stop is separate permissive-loss -> Step4. |
| Run both / failed chord | SafeResumption.MODE excludes Run, while independent raw Run timer remains | Cannot certify the shared gesture exclusivity across Run with the RnD recognizer evidence. Existing current acceptance records already retain two Run invalid-chord FAILs. Tester must repeat exact current source cases. |

## Memory ownership / resets

- recRndC_C means an attempt was consumed; further qualifications are inhibited until release/reset logic clears it. GATE_030 also receives linkSafeAcceptedUp, consuming the accepted Step1 attempt.
- recRndC_SG and recRndC_SU are action-owner latches, not pulses. Both reset when linkSafeRndScope becomes false. SG sets from qualified green AND not Step1; SU sets from qualified BOTH. This preserves accepted commands after ordinary button release/late second while context remains valid.
- recRndC_BA resets via GATE_031, including blue OFF or green ON; final Unlock also requires blue ON/green OFF. This removal of held Unlock is intended and does not cancel an already accepted transition.
- linkSafeAcceptedUp resets when SAFE_UP_SCOPE becomes false (scope/permissive lost, or Step1 ended), not simply on button release. This is a pending acceptance memory for the next phase, not an endlessly held advance token across RnD.
- Scope loss is also a consequence of emergency/permission logic, distinct from late-second cancellation rules.

## Non-unique producers requiring explicit attention

### A. Independent PLC routes exist (source fact)

- Step1: Network2/FBAnd61+FBAnd81+FBAnd91 -> FBOr1 joins linkSafeAcceptedUp. With PLC10 and Step1 it requests Step12 without the physical BOTH qualification/ReadyForStep2 path. Actual actuator Set guards still apply. SAL lines 2909 onward.
- RnD up: PLC11 -> Network12/FBAnd8+FBAnd9+FBAnd10 -> FBOr1 joins recRndC_SU. SAL line 8708 onward.
- Run down: PLC01 -> Network6/FBAnd15+FBAnd16+FBAnd17 -> FBOr5 joins raw green route.
- RnD PLC00 down branch contains `in_False_SI2_CH8` positively at FBAnd14.AndIn4 while FBAnd12/13 require it negatively. With one consistent input value this branch is unsatisfiable; do not describe it as an active automatic down path.

These are not three physical recognizer outputs with one exclusive dispatcher. Whether PLC-only commands are allowed, must accompany a gesture or require an edge/handshake remains a documented policy question. Source existence alone does not determine its approved reaction.

### B. Conditional opposite request collision (source fact; tester witness requested)

At RnD with accepted green SG held, maintaining C1 feedback ON keeps the down completion from leaving the context. If PLC becomes11 while interlocks remain true, Network12/FBOr1 simultaneously requests up while FBOr2 continues down. Resulting requests include C2 Set / transition3 and C1 Reset / LV-discharge / transition2. No shared opposing-command arbiter is present between these OR outputs. Relevant actual SAL: FBAnd4 line8502, FBOr1 line8708, FBAnd14 line8963, FBOr2 line9004, And15 line9154. This is a conditional software request conflict; it is not proof of reachable full-system actuator energization, and exact conflict destination/policy must not be invented.

### C. Separate Run recognizer path (source fact)

The raw green timer in Run can retain timing while blue was also ON; after blue is released it can qualify the down route without the shared recognizer rearm. Current source anchors FBTon2 line6570, FBAnd23 line6809, FBAnd24 line6850. Requirements D-RUN-BOTH-IGNORE and failed-attempt full-clear must be evaluated on this branch, not only the RnD recognizer. No functional repair is proposed in this verification-only audit.

### D. One action may have several same-direction requests

Up -> C2 request, early STO release and later Run confirmation is intentional fanout per D-STO-LAUNCH. Two same-direction STO request producers do not by themselves establish duplicate accepted gestures. Conversely, determinism from RS priority alone is insufficient evidence that contradictory operational requests have been avoided.

## Verdict and limits

Cannot approve universal one-to-one physical-gesture routing. The Step1/RnD recognizer has explicit consumed-attempt and owner memories, but independent raw green Run and PLC paths bypass that dispatcher. Conditional opposing PLC/green requests are statically identifiable; current Run failed-chord coverage and transition owner lifecycle remain material gaps/findings. Independent tester/reviewer must supply execution evidence and final classification. No full BOOT/group lifecycle, native timing/CRC/IDE/target, physical equipment or hardware safety claim follows from this report.
