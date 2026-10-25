# Step2 / Step6 exit baseline — 2026-10-18

Source: v2 `TwinSafeGroup1.sal`, embedded CRC `872783435`.
Checks: `test/sal-safe-exit-baseline.test.js` (EXIT01–05).

## Exact conditions

Network5/FBAnd7:

`b_Step1_Set_3 = b_Step2 AND in_False_SI2_CH8 AND NOT b_EStop_Ok`.

Network9/FBAnd1:

`b_Step1_Set_2 = b_Step6 AND in_False_SI2_CH8`.

Network5/FBAnd1, followed by FBDecouple1, generates both `b_Set_LV_C1`
and `b_Set_HV_C2` when:

`b_Step2 AND NOT in_False_SI2_CH8 AND b_EStop_Ok`.

The name `in_False_SI2_CH8` does not establish its physical value. SAL maps
it to an alias input, SDS **62**, channel **15**, function **1618018561**.
No software Boolean constant is proved by this mapping. Wiring and online
value must establish whether FALSE is guaranteed and what fault behavior applies.

## Executed results

| Check | Scope and result |
|---|---|
| EXIT01 | Network5 only: all four combinations of the raw input and EStop OK match the equations above |
| EXIT02 | Networks3/9: Step6 remains active for 1 s with the raw input FALSE; changing it to TRUE generates the exit and settles Step1 active / Step6 inactive |
| EXIT03 | Networks3/5: internal R&D exit request `b_Step2_Set_2` clears R&D and selects Step2; with raw input FALSE and EStop OK TRUE, LV/HV set requests rise and no Step1 request appears during the 1 s observation |
| EXIT04 | Networks3/5: losing EStop OK while in Step2 removes those set requests but does not generate Step1 while the raw input stays FALSE; Step2 remains active for the observed 1 s |
| EXIT05 | Static alias check confirms SDS 62 / channel 15 rather than a literal constant |

These are baseline reproductions, not acceptance tests for the desired behavior.
EXIT03 demonstrates a conflict with interpreting this partial route as a
normal energy-reducing R&D -> Safe sequence; it does not establish final
contactor outputs in the complete project.

## Boundary

The tests execute real SAL blocks with explicit raw inputs and internal state
set requests. Combinational paths are warmed, then Network3 RS memories are
cleared to establish a defined idle precondition. This avoids treating the
adapter's uninitialized links as a validated TwinSAFE power-up trace.

Networks1/4/6/7/8/11/12 and their competing commands are outside these tests.
Emergency block behavior, upstream button qualification, feedback timeouts,
physical energy removal, arbitrary asynchronous combinations and global
Beckhoff scan ordering remain unverified. A 1 s hold observation is not a
general proof that no other full-project path can exit the state.

## Next work

Linked-path update: see `V2_RND_TO_SAFE_REPORT.md`. The physical green path
does not reproduce EXIT03's held internal request: in the current adapter it
produces a short pulse, simultaneous Step2 Set/Reset and a lost state handoff.
Do not interpret EXIT03 as proof of physical-button-induced re-energization.
Network4 is named `Network4ToBeDeleted` and has no explicit input drivers;
the earlier proposed emergency interpretation is unconfirmed.

1. Bind the complete R&D down-command path in Network12 to Network3/5 and
   Network1's output latches; trace set/reset conflicts and final commands.
2. Trace Network4's emergency reset/set requests and Network6/7/8's competing
   removal paths against Step2 and Step6 ownership.
3. Validate physical meaning/value of SDS62 channel15 and Healthy signals,
   execution order and constants before changing TwinSAFE logic.
