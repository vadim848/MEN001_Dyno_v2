# Emergency chain execution — 2026-10-18

Source: v2 SAL CRC `872783435`. Tests: `sal-emergency-chain.test.js`.

## Scope and explicit preconditions

All parsed networks **except Network4** execute in global block-number order.
Network4 is excluded because its used unconnected channels remain unresolved.
The E-Stop block executes with the partial no-EDM assumption described in
`ESTOP_SEMANTICS_REPORT.md`. Group fault/lifecycle and discrepancy behavior
remain outside the adapter.

After combinational warmup, Step3, LV/C2, both STO latches and the E-Stop
enabled memory are seeded ON to represent an established armed condition.
This is not proof that startup can reach that condition. Raw main/external
interlocks, LV/C2 feedback and door feedback start TRUE; raw Healthy inputs
and SDS62/channel15 start FALSE. Other declared source-less inputs start FALSE.
No contacts or motors are driven: observed outputs are SAL command bits.

## Executed scenarios

| Test | Stimulus | Observations |
|---|---|---|
| CHAIN01 | Main NC1 FALSE | EStop OK FALSE within one 10 ms adapter scan. By 100 ms Step3/Armed clear, Step4 sets, both SS1 bits are FALSE, both STO bits and C2 remain TRUE, unlock FALSE. Same assertions pass with unconnected fallback TRUE and FALSE. |
| CHAIN02 | NC1 FALSE for 100 ms, then restored for 500 ms without Reset | EStop OK and Run/Armed remain FALSE; Step4 remains active. |
| CHAIN03 | PLC emergency TRUE for 100 ms | EStop OK clears, Step3 clears and Step4 sets. |
| CHAIN04 | NC1 remains FALSE; supply staged feedback | After 8 s STO bits are FALSE but Step4 waits for the omitted drive feedback. Supplying both STO feedbacks TRUE advances to Step5, discharge ON with C2 still ON. Another 2.2 s turns C2 command OFF while Step5 still waits for C2 feedback. C2 feedback OFF advances to Step6, with Safe not reached and unlock FALSE. |

CHAIN04 confirms the feedback gates in this stimulus, not an approved stopping
time. C2 removal remains timer-driven without a distinct safe-HV completion
input. CHAIN01's retained STO bit must not be interpreted as failed physical
braking without validating AX5805 polarity and SS1 semantics.

The tested NC1 restoration does not cancel the early stop phase. Other recovery
timings, physical channels, modes, Healthy-loss combinations and emergency
events in other phases still need their own traces.

## Additional channels and Healthy — CHAIN05–12

Six additional cases independently change main NC2, Mentee E-Stop, LV/HV
connector contacts and external NC1/NC2 from the seeded armed condition.
Each executes with both unconnected-input assumptions. By 100 ms all six
select Step4, clear Step3/Armed and change both SS1 bits to FALSE, with cover
unlock FALSE. `b_EStop_Ok` stays TRUE: these events use independent protective
paths rather than the active FBEstop inputs. Restoring each event for 500 ms
does not restore Step3 or cancel Step4.

This qualifies the earlier direct-FBEstop input findings: NC2 and Mentee are
not proved absent from the overall protective logic. Their expected reporting,
redundancy, discrepancy handling and full removal behavior remain unvalidated.

CHAIN11 changes raw `in_HV_Healthy_FBK` from FALSE to TRUE. It selects Step4
without clearing EStop OK. STO bits remain TRUE through the 1.9 s checkpoint
and are FALSE by 2.3 s. CHAIN12 returns that raw input FALSE after 100 ms:
at the same 2.3 s checkpoint STO bits remain TRUE, then are FALSE after another
5.5 s. Step4 remains established and Run does not return. Thus the branch
selection is live rather than latched from the initial Healthy event.

Raw levels are deliberately stated: these tests do not establish which
electrical level means healthy, validated stop/coast time, or actual motor
standstill. They do establish a difference between the two input traces in
the current scoped adapter.

## Updated next work

Extend loss/recovery to non-Run and transition phases with explicit state
preconditions. Complete requirement IDs and positive/negative coverage before
planning implementation changes. Confirm Healthy polarity and permitted coast
behavior; preserve the no-EDM and excluded-Network4 validation boundary.

- EStopOut loss is now executed through downstream state/output consumers,
  rather than supplied as an external Boolean precondition.
- Excluding Network4 and assuming no EDM prevent full-project acceptance.
- Step6's blocked return and timer-based HV removal reproduce earlier gaps
  in a broader chain. The tests preserve those discrepancies, not acceptance.
- Next execute main NC2, Mentee E-Stop, connector/external-interlock loss and
  Healthy-loss/recovery through this same scoped chain. Separate direct
  FBEstop paths from independent Network6 protective paths.
