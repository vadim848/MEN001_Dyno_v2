# Network6 Run -> R&D baseline — 2026-10-18

Source: v2 `TwinSafeGroup1.sal`, embedded CRC `872783435`.
Executed by `test/sal-rundown-baseline.test.js`: real Network6 blocks only,
10 ms adapter scan, externally held Step3, explicit raw inputs, 100 ms warmup.
No TwinSAFE source or reference-repository files were modified.

## Results

| Requirement / question | Observed v2 structure and partial execution | Classification |
|---|---|---|
| Green requires the agreed 1 s | Network6/FBTon2 is 0.5 s; first removal requests occur within 500–550 ms in the adapter | FAIL against agreed gesture timing |
| SS1 then STO, discharge, finally C2 OFF | FBOr5 feeds FBDecouple2 DecIn1–4 from the same source; STO reset requests, discharge request and C2 reset request rise on the same adapter scan | FAIL at internal-request ordering; final physical-output ordering NOT VERIFIED |
| C2 reset waits for discharge completion | `b_Reset_HV_C2_4` rises with `b_Set_HV_Discharge_Request_3`; no intervening completion gate | FAIL at request level |
| C2 OFF feedback gates return to Step12 | FBAnd18 combines FBTon1 (0.2 s) with inverted `in_HV_C2_FBK`; request stays OFF with feedback ON and rises after feedback OFF | PASS for this partial branch; no separate safe-HV confirmation |
| New physical gesture is required | PLC mode bits `inPLC_RnD_Mode=FALSE`, `inPLC_RnD_Mode_2=TRUE` activate the same branch without physical green | Alternate level-driven command path confirmed; protocol/authorization conformance NOT VERIFIED |
| Accepted sequence survives green release | Network6's four removal requests disappear after green release | Nonlatched requests confirmed; completion/abort behavior of downstream latches NOT VERIFIED |

The tests preserve observed v2 behavior, including mismatches. Green test results
are not safety acceptance results.

## Exact route

Physical green path:

`in_Reset_PB -> FBTon2 (0.5 s) -> FBAnd24 -> FBAnd23 -> FBOr5`.

FBAnd24 also requires NOT `b_ResetPB_Lock` and NOT `in_False_SI2_CH8`.
FBAnd23 also requires Step3 qualification through FBAnd1 and blue released.

PLC path:

`FBAnd15 (NOT mode1) + FBAnd16 (mode2) + FBAnd1 -> FBAnd17 -> FBOr5`.

FBOr5 fans out to FBDecouple2 DecIn1–4:

- DecOut1: `b_Reset_STO_DR2_4`.
- DecOut2: `b_Reset_STO_DR1_4`.
- DecOut3: `b_Set_HV_Discharge_Request_3`.
- DecOut4: `b_Reset_HV_C2_4`, also starts FBTon1 (0.2 s).

`FBTon1 -> FBAnd18`, with C2 OFF feedback, writes `b_Step12_Set_2`.
Network3 then clears Step3 and sets Step12; Network11 can set R&D.
The latter networks were not included in these four dynamic tests.

FBDecouple2 DecOut5 writes `b_Set_Transition_4`, but DecIn5 has no explicit
signal source in this SAL. The adapter defaults unconnected inputs to TRUE.
Its actual Beckhoff constant semantics must be checked before interpreting
`out_TransitionStep` or using it as evidence of transition ownership.

## Limits and next step

Raw Healthy levels FALSE satisfy the steady Network6/FBAnd9 gate in these
tests; this records XML inversion, not validated electrical polarity.
Network6/FBAnd2 can request Step4 when that gate drops. The normal-return
branch and Step4 emergency branch therefore require separate traces.

Next: bind the request consumers in Network1, state handoffs in Network3 and
R&D qualification in Network11. Observe final C2/discharge/STO/SS1 outputs,
green release, PLC-bit recovery and Healthy loss. Confirm actual scan order,
unconnected-port constants and feedback polarity with Beckhoff tools before
treating adapter timing or command names as physical safety behavior.

## Output-chain continuation — 2026-10-18

Four additional checks in `test/sal-rundown-outputs.test.js` connect Network6
to Network1's energy/SS1 latches, Network3's state ownership and Network11's
R&D qualification. These refine the NOT VERIFIED output-chain entries above.

### Explicit starting conditions and scope

The harness warms the combinational paths, then seeds Step3, LV/C2 and both
STO latch memories ON to represent an already armed installation. This is
not a startup trace. All source-less declared variables start FALSE, with
explicit overrides for emergency/interlock/contactor feedback. Raw LV/HV
Healthy are initially FALSE to satisfy Network6's inverted healthy gate.

Network1 includes the energy latch consumers, SS1 branch and C1/C2 bypass
gates (bypass input FALSE). Its E-Stop, button-lock, cover and transition-latch
blocks are excluded. Networks2/4/5/7/8/9/10/12 are excluded. Thus no conclusion
is drawn about their competing writes, emergency sequence, full button-lock
handshake, cover output, or the complete project's reachable states.

The adapter scans networks in file order and blocks by orderOfExecution inside
each network. This is not yet validated against Beckhoff's actual global
execution order. Millisecond intervals below are adapter observations only.

### Observed output and state behavior

| Check | Trace / result |
|---|---|
| OUT01 physical-green path | After qualification, `out_HV_Discharge_Request` rises and `out_HV_C2` falls within 0–20 ms of it in the adapter, without a completion input. Both STO output bits fall. Both SS1 bits stay at their initial TRUE level throughout the 650 ms trace while C2 feedback is held ON. This branch supplies no SS1 bit transition before removal. |
| OUT02 early green release | Green held 650 ms, then released for 300 ms; C2 feedback subsequently set OFF for 300 ms. C2 and both STO bits remain FALSE; discharge remains TRUE through their downstream RS memories. Step3 and `out_Safety_Armed` remain TRUE; Step12 does not start because its nonlatched request/timer was lost. This is a concrete partial-chain stranded-status reproduction. |
| OUT03 held green | Green held 850 ms; C2 feedback OFF permits Step12. Step3 and SS1 bits clear. Setting raw LV Healthy TRUE with LV contactor feedback TRUE then qualifies R&D through Network11. HV command remains OFF and discharge remains ON; no distinct safe-HV feedback is supplied. |
| OUT04 PLC mode 01 | With no physical green press, mode1 FALSE / mode2 TRUE changes both SS1 bits to FALSE and drops C2/STO while asserting discharge. It does not require the 0.5 s physical-green qualification. |

### Interpretation

- The simultaneous Network6 requests propagate to output command bits; the
  downstream latches do not insert an approved discharge-completion wait.
- Releasing green removes internal requests but does **not** undo the latched
  energy removal in this scope. It can prevent the state handoff despite
  later C2 OFF feedback.
- The physical-green and PLC-mode paths have different SS1 bit behavior.
  Electrical polarity and AX5805 semantics are still unvalidated; do not label
  TRUE/FALSE as completed braking or actual motor standstill.
- LV Healthy TRUE is required by Network11, while the steady Network6 gate
  used here accepts raw LV Healthy FALSE. This is another reason to validate
  phase-dependent signal meaning before accepting an end-to-end trace.

Next examine Network5 Step2 exit and Network9 Step6 exit, then extend the
combined trace to competing emergency/Healthy-loss branches. Resolve execution
order, constants and input polarity before making TwinSAFE implementation
changes based on these findings.
