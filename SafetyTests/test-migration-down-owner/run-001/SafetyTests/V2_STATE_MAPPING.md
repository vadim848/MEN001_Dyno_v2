# V2 state mapping checkpoint — 2026-10-18

## Source boundary

- Working repository: `vadim848/MEN001_Dyno_v2`, branch `Safety-Develop_2`,
  base checkpoint `4bb8703`.
- Reference only: sibling `vadim848/MEN001_Dyno`, branch **`Prodoction`**
  (exact Git spelling), commit `4495a1f`, observed during resume verification.
  Do not edit, switch branches, commit or deploy from that reference repository.
- An earlier workstation's reference branch was not recorded in the handoff;
  the branch above is the user's designated reference on this workstation.
- Analyzed V2 SAL: `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`,
  embedded CRC `872783435`.

## Latch ownership and interpretation

All eight step latches are in Network3. Names below describe structural roles;
they do not assert physical energy status or approved operator-mode semantics.

| Latch | Owner | Export | Interpretation and qualification |
|---|---|---|---|
| `b_Step1` | `FBRs1` | `out_Step1` | Base/Safe candidate; physical de-energization still requires feedback checks |
| `b_Step2` | `FBRs2` | `out_Step2` | Shared sequence step; entered by both `b_Step2_Set` and R&D exit `b_Step2_Set_2`; not exclusively StartingRun |
| `b_Step3` | `FBRs3` | `out_Step3`, `out_Safety_Armed` | Armed/Run candidate |
| `b_Step4` | `FBRs4` | `out_Step4` | Stop/Healthy/STO sequence in Network7 |
| `b_Step5` | `FBRs5` | `out_Step5` | HV discharge/C2 sequence in Network8 |
| `b_Step6` | `FBRs6` | `out_Step6` | Terminal removal step; automatic exit requires further investigation |
| `b_Step_RnD` | `FBRs7` | `outPLC_RnD` | R&D candidate |
| `b_Step12` | `FBRs8` | `out_Step12` | Shared entry/re-entry to R&D, not exclusively Safe -> R&D |

`out_TransitionStep` is a separate RS latch at `Network1/FBRs8`, not a
ninth exclusive step. No dedicated Emergency step exists among these eight
latches. Do not equate absence of a step with a validated Emergency state.

## Evidence for the shared routes

1. Network2/FBOr1 writes `b_Step12_Set`. Network3/FBOr16 accepts that request
   **or** `b_Step12_Set_2` to set Step12.
2. Network6/FBAnd18 writes `b_Step12_Set_2`. That same request resets Step3
   through Network3/FBOr5. Network11/FBAnd5 writes `b_Step_RnD_Set`;
   Network3/FBOr14 sets R&D, and FBOr15 resets Step12.
3. Network12/FBAnd15 writes `b_Step2_Set_2` after its LV OFF feedback branch.
   Network3/FBOr4 sets Step2 and FBOr13 clears R&D for this request.
   Network5/FBAnd7 writes `b_Step1_Set_3` on a separate Step2 branch involving
   inverted `b_EStop_Ok`; its physical meaning must be resolved before calling
   the complete R&D -> Safe sequence correct.
4. Network6/FBDecouple2 has distinct outputs for STO reset, HV discharge
   request and C2 reset on the return-to-R&D path. The Step4/5/6 route is
   therefore not the only energy-removal route requiring analysis.
5. Network9/FBAnd1 writes `b_Step1_Set_2` from Step6 AND
   `in_False_SI2_CH8` without inversion. If the latter is physically constant
   FALSE as its name suggests, this automatic exit is blocked. Its physical
   value is not proved by the name; flag for mapping/runtime confirmation.

## Executed checks

`test/sal-state-baseline.test.js` executes the real Network3 block subset with
internal request pulses and verifies exclusive settled ownership, the exported
step, and `out_Safety_Armed` at each checkpoint:

- STATE01: Step1 -> Step12 -> R&D -> Step3.
- STATE02: Step3 -> Step12 -> R&D.
- STATE03: R&D -> Step2 -> Step1.
- STATE04: Step3 -> Step4 -> Step5 -> Step6 -> Step1.

These tests inject internal requests. In particular STATE03 and STATE04 do
not prove the upstream conditions can generate the exit requests. They do not
prove one-hot behavior within every scan, arbitrary simultaneous requests,
physical feedback polarity, timing, or an end-to-end machine cycle.

## Next binding work

Continuation: `V2_SAFE_EXIT_REPORT.md` now records exact Step2/Step6 exit
equations and five static/partial dynamic checks. The suspected FALSE gate is
a physical alias (SDS62/channel15). With its raw value FALSE, the tested Step6
exit is blocked; Step2 can generate LV/HV set requests with EStop OK TRUE.
The complete Network12 down-command and competing emergency paths remain next.

1. Bind Network6's return-to-R&D path independently of Network7/8's stop path;
   trace SS1, STO, discharge and C2 ordering for both.
2. Resolve Network5's Step2 branches and Network9's constant-input gate.
3. Establish PLC mode-bit paths as well as physical-button paths; do not infer
   operator control solely from the button network.
4. Then execute complete SAL sequences with explicit physical input traces,
   classify mismatches, and retain the Beckhoff/runtime validation boundary.
