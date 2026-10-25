# TwinSAFE v2 baseline report

**Latest update:** `SAL_ADAPTER_SEMANTICS.md` corrects adapter block ordering.
The legacy R&D-down lost handoff is withdrawn under corrected order; the
selected chain instead reaches Step2 and raises LV/HV commands. 94 tests pass,
none skipped; model mutations 5/5. Earlier scan timing is historical unless
asserted by current tests. Unconnected-port assumptions remain unvalidated.

Date: 2026-10-17  
Source: `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`  
Source CRC recorded by SAL: `872783435`  
Method: read-only parsing, dependency analysis and independent partial execution.

## Result summary

This is a baseline of the unmodified v2 project. A green result below means that
the tested behavior was calculated from the SAL graph. It does not mean that the
complete safety function has been validated or certified.

| Area | Result | Evidence / limitation |
|---|---|---|
| SAL integrity and inventory | PASS | 12 networks, 205 function blocks, 64 variables parsed |
| Supported function-block vocabulary | PASS | AND, OR, RS, TON, Decouple and E-Stop are recognized; no unknown block type remains |
| LV/HV connector physical mapping | PASS | SDS 61 channels 9 and 11 |
| External interlock physical mapping | PASS | SDS 62 channels 9 and 11 |
| Interlock dependency path to both drive STO reset chains | PASS | Static paths exist for both connector contacts and both external-interlock contacts |
| Connector qualification behavior | PASS (partial chain) | Dynamic execution proves immediate drop and 100 ms stable recovery at Network2/FBAnd1 -> FBTon1 |
| Complete button recognizer against B01-B15 | FAIL / PARTIAL | Network12 is now bound: blue-alone is 0.5 s, green-alone is 0.5 s, two-button is 1 s, and no 2 s neutral-release timer exists in Network12. These do not match the agreed 1 s / 1 s / 2 s plus 2 s release filter |
| Cover behavior against C01-C10 | FAIL / PARTIAL | Safe and R&D unlock paths are now bound and behave differently; Safe has no hold timer and remains latched after blue release while locked feedback stays present |
| Complete Safe/R&D/Run cycle | NOT VERIFIED | Step outputs exist, but their semantic mapping to the agreed states is not yet established |
| SS1/Healthy/STO sequence | FAIL / PARTIAL | SS1 state paths are identified. Both HV Healthy branches in Step4 are blocked by a common 2 s TON, so this chain cannot react immediately during that interval |
| Confirmed HV discharge completion | NOT PROVABLE FROM CURRENT INPUTS | No distinct `DischargeComplete` or `HV_Safe` input was found in the SAL variable inventory |
| Complete E-Stop state matrix | NOT VERIFIED | E-Stop block can be executed by the adapter, but its complete restart/EDM behavior requires validation against Beckhoff runtime semantics |

## Automated run

- Full regression: 69/69 tests pass. The added tests preserve the actual
  v2 button behavior; they intentionally expose requirement mismatches in this report.
- Of these, 32 execute the independent specification model.
- 8 are static conformance checks against the real v2 SAL.
- 5 execute real v2 SAL blocks dynamically, plus two structural button checks.
- Mutation check: 5/5 injected model defects are detected.

The 32 specification-model tests must not be reported as v2 passes until each
scenario is bound to actual SAL inputs, internal states and outputs.

## Button baseline: Network12

| Requirement | Actual v2 | Result |
|---|---|---|
| Blue alone requires 1 s stable hold | `FBTon2 = 0.5 s` | FAIL |
| Green alone requires 1 s stable hold | `FBTon4 = 0.5 s` | FAIL |
| Both buttons require 2 s stable hold | `FBTon1 = 1 s` | FAIL |
| Both released continuously for 2 s before re-arming | No 2 s TON exists in Network12 | FAIL |
| Both buttons suppress blue-only unlock | Verified dynamically | PASS |
| Blue release removes the set condition | Reset branch exists; final latch/output behavior still needs full-network execution | PARTIAL |
| Failed two-button attempt never degrades to blue unlock | Both held 0.3 s, then green released: unlock request becomes active at 0.51 s | FAIL, dynamically reproduced |
| Failed two-button attempt never degrades to green/down | Both held 0.3 s, then blue released: down-transition request becomes active at 0.51 s | FAIL, dynamically reproduced |

## Current SAL signal inventory relevant to the contract

- Commands: `in_Reset_PB`, `in_Relase_Door_PB`, `in_Safety_Run`.
- Cover: `in_Door_Monitor`, `out_Door_Unlock_Solonoeid`.
- Energy and feedback: `in_LV_C1_FBK`, `in_HV_C2_FBK`,
  `in_LV_Healthy_FBK`, `in_HV_Healthy_FBK`, `out_LV_C1`, `out_HV_C2`.
- Drives: `out_SS1_DR1`, `out_SS1_DR2`, `STO_DR1`, `STO_DR2`,
  `in_STO_DR1_FBK`, `in_STO_DR2_FBK`.
- Discharge commands: `out_LV_Discharge_Request`,
  `out_HV_Discharge_Request`.
- Interlocks: `in_LV_Connector_Interlock`, `in_HV_Connector_Interlock`,
  `in_InterLock_NC_1`, `in_InterLock_NC_2`.
- Emergency: `in_ES_NC_1`, `in_ES_NC_2`, `in_Mentee_EStop`,
  `in_Estop_PLC`.

## Cover baseline

| Requirement | Actual v2 | Result |
|---|---|---|
| Safe and R&D use the same blue-button policy | Safe is direct/untimed; R&D uses 0.5 s TON | FAIL |
| Solenoid is active only while blue is held | In Safe the RS latch remains set after release if Door Monitor remains locked | FAIL, dynamically reproduced |
| Loss of locked feedback removes unlock request | Safe reset branch clears the latch when Door Monitor drops | PASS for tested Safe branch |
| Blue release removes unlock in R&D | R&D reset branch clears the latch while Door Monitor remains locked | PASS for tested R&D branch |
| Unlock is prohibited in Run and transition phases | State paths identified; full state-map execution still pending | NOT VERIFIED |
| Open/unlocked cover blocks every upward transition | Structural paths exist; full state-map execution still pending | NOT VERIFIED |
| Unlock and upward transition can never coexist | Unlock in R&D, open/release, then close while holding both preserves unlock and asserts `b_Set_Transition_3` | FAIL, dynamically reproduced |

## Preliminary state mapping

Resume update (2026-10-18): see `V2_STATE_MAPPING.md` and the four
`sal-state-baseline` tests. Step12 is shared by entry and return to R&D;
Step2 also participates in R&D exit. The simplified roles in the table below
must not be treated as a complete state map. Internal-request execution confirms
settled latch handoffs, not the complete physical sequence.

| SAL latch/output | Interpreted role | Evidence |
|---|---|---|
| `b_Step1` / `out_Step1` | Safe/base step | Network2 resets energy permits and contains Safe cover controls |
| `b_Step12` / `out_Step12` | Safe -> R&D transition | Set from Network2; Network11 energizes LV and sets R&D |
| `b_Step_RnD` / `outPLC_RnD` | R&D | Network12 contains R&D buttons, cover and up/down branches |
| `b_Step2` / `out_Step2` | Energization/transition step | Network5 commands contactors/STO and waits for feedback |
| `b_Step3` / `out_Step3` | Safety armed / operational energy step | Directly drives `out_Safety_Armed` |
| `b_Step4..6` | Energy-removal sequence | Networks7-9 issue discharge/contact-off and return to Step1 |

This interpretation is strongly supported by connectivity but still requires
manual comparison with the TwinSAFE diagram and online runtime values before it
is treated as the authoritative operator-state naming.

## Preliminary gap requiring a design decision

The agreed contract requires C2 to remain energized until safe HV has been
confirmed. The current SAL exposes a discharge command but no separate safe-HV
confirmation input. A timer-only implementation can be tested for timing, but it
cannot prove that the DC bus is actually safe. Before editing TwinSAFE, determine
whether a certified safe-voltage indication is physically available, or formally
approve and validate a time-based discharge procedure.

## Energy-removal baseline

Resume update (2026-10-18): the separate Network6 return-to-R&D path is now
partially executed in four tests; see `V2_RUN_TO_RND_REPORT.md`. It raises STO
reset, HV discharge and C2 reset requests together, and has a PLC mode-bit
entry path. The Step4/5 findings below do not cover this alternate route.
Four further output-chain tests now connect selected Networks1/3/6/11:
C2/STO output commands drop without discharge completion, and early green
release can strand Step3/Armed. See the output-chain section of that report
for scope, raw input levels and seeded initial conditions. Current suite:
81 passed, 0 skipped; model mutations detected 5/5.

| Requirement | Actual v2 | Result |
|---|---|---|
| Step3 -> stop initiates SS1 | SS1 outputs depend on Step2/Step3; leaving the armed step changes them | Structural PASS; physical polarity requires runtime confirmation |
| Loss of HV Healthy during SS1 causes immediate STO | Both Healthy-polarity branches in Step4 require `FBTon1 = 2 s` first | FAIL: no reaction through this chain before 2 s |
| Healthy retained permits controlled SS1 before STO | One branch adds `FBTon2/3 = 5 s` after the common 2 s gate | PARTIAL; sequence exists, timing needs approval |
| Discharge starts while C2 is still connected | Step5 sets `out_HV_Discharge_Request`; C2 reset follows through Network8 timing | Structural PASS |
| C2 opens only after confirmed safe HV | No safe-HV/discharge-complete input exists; C2 reset is time/command based | NOT PROVABLE / design gap |
| R&D only after C2 OFF feedback | Step6 is set through a branch containing inverted `in_HV_C2_FBK` | Structural evidence; end-to-end execution pending |

The two Network8 timers are each configured to 1 s, but an OR path from the
discharge command can start the second timer without waiting for a separate
discharge-completion feedback. The effective delay must be confirmed against
TwinSAFE runtime scan behavior and the power-supply discharge specification.

## Emergency-input baseline

Dynamic update: CHAIN05–10 in `EMERGENCY_CHAIN_REPORT.md` confirm that NC2,
Mentee, connector and external-interlock events select Step4 through separate
protective paths while `b_EStop_Ok` remains TRUE. The direct FBEstop port
findings below must not be read as absence of overall protection. Channel
redundancy, diagnostic semantics and hardware behavior remain unvalidated.

| Input | Actual v2 connection | Result |
|---|---|---|
| `in_ES_NC_1` | Active `FBEstop1/EStopIn1`, configured `Single-Channel Both Activated` | Active path confirmed |
| `in_ES_NC_2` | Assigned to `FBEstop1/EStopIn2`, but that port is `Both Deactivated` | REVIEW REQUIRED |
| `in_Mentee_EStop` | Assigned to deactivated `FBEstop1/EStopIn4`; independent Network6 protective path | Direct FBEstop gap; separate Step4 reaction dynamically confirmed |
| `in_Estop_PLC` | Active AND path into `FBEstop1/EStopIn3` | Active path confirmed |
| External interlock NC1/NC2 | Active in STO/energy-permit networks, not direct FBEstop inputs | Active protective paths confirmed; state response still needs runtime validation |
| LV/HV connector interlocks | Active in STO/energy-permit networks | Active paths to both drive STO reset chains confirmed |

The E-Stop block input configuration is identical in the original stable SAL and
v2. That proves v2 did not introduce this arrangement, but it does not prove the
deactivated inputs meet the present requirements. In particular, the intended
meaning of `Single-Channel Both Activated` and the separate `in_ES_NC_2` alias
must be verified in the TwinSAFE editor/online view. `in_Mentee_EStop` has no
active path through the E-Stop function according to the current SAL graph.

## Next binding order

1. Map `in_Reset_PB`, `in_Relase_Door_PB` and `in_Safety_Run` to the B-series
   button scenarios and identify their internal latch outputs.
2. Bind door monitor/unlock behavior and C-series scenarios.
3. Establish the exact Step1..Step6/Step12/R&D state mapping.
4. Execute SS1, Healthy, STO, discharge and C2 sequences.
5. Execute emergency/interlock loss at every established phase.
6. Reissue this report with every scenario classified PASS, FAIL or NOT VERIFIED.

## Validation boundary

Linked R&D-down update: `V2_RND_TO_SAFE_REPORT.md` distinguishes the held
internal Step2 request from the short physical-button path. The latter loses
the state handoff in the current adapter instead of proving re-energization.
Audit execution order and unconnected inputs before extending runtime claims.

Resume continuation: see `V2_SAFE_EXIT_REPORT.md` for Step2/Step6 exit checks.
Both tested Step1-return requests require raw `in_False_SI2_CH8` TRUE;
this is an alias input, not a proved software constant. The tested Step2
path raises LV/HV set requests when that input is FALSE and EStop OK is TRUE.
Full-project command arbitration and physical outputs remain unverified.

This adapter is an independent regression aid. Final acceptance still requires
Beckhoff Verify/Build, CRC review, TwinSAFE runtime observation and hardware
validation.
