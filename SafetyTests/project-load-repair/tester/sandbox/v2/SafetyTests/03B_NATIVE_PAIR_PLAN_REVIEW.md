# Independent review — 03B native pair repair plan

2026-10-19. Scope: `03B_NATIVE_PAIR_FIX_PLAN.md`; no source/runtime/test edits.

**ACCEPT / READY for red-test stage.** The architect incorporated the shared
closure requirement below into the plan before this verdict.
This is approval of the repair approach, not acceptance of current03B SAL.

The reviewer independently reproduced SALDesigner SDK IL for
`InPort.GetCoPartner` and `TwoChannelInPortSettings.ReloadCurrentState`, and
SALDesignerControl `VerifierHSafetyPLC.IsInPortSecondChannelOfGroupActive`.
The master controls both effective channel activation and contact polarity.
ActivatedBoth with an unconnected slave is inconsistent with the intended
single-input helper. No native unconnected BOOL value is inferred: publisher
connectivity masking and native runtime semantics are separate matters.

R3A is appropriately bounded: change only WINDOW master mode to exact
`Single-Channel 1 Activated`; keep original main EStop, all timers, source
bindings and orders. Update executable derived metadata/generator expectations;
preserve historical baseline artifacts. No dummy second source is justified.

R3B must use the same effective-pair resolver for **runtime and demanded
dependency closure**, including `src/physical-rnd-source.js`. That closure
currently filters each input's own channelInterface, so a runtime-only fix
would leave NC2/Mentee dependency discovery incorrect. Structural checks of
the new helper must use the same native pair contract. The resolver must
return raw source plus effective master contact polarity; avoid double
inversion through ordinary per-port reads. Unknown mode, unbound active
channel and unsupported Two-Channel behavior must fail explicitly rather
than synthesize an input or preserve a false green.

Required red controls before fixes:

- Exact first-only/second-only/both/deactivated matrix, master contact1/2
  direct/inverted, and slave-own-field mutations ignored by effective result.
- Current defective Both+unboundSlave rejected despite ownslaveDeactivated;
  intended first-only helper accepted with actual Restart/Ready sources.
- Actual unchanged main EStop NC2 and Mentee raw fault/healthy paired cases,
  held-entry/restart and one-sample fault followed by raw recovery without
  manual Restart. PLC95/EStop21 ordering remains unchanged.
- Closure checks demonstrate active NC2/Mentee are demanded from real typed
  sources, and missing active dependencies fail before functional execution.

Tests should establish a red checkpoint while source/runtime are unchanged.
Then separate tiny SAL repair from the faithful adapter change in the report.
Existing partial tests must explicitly supply healthy effective-active raw
inputs; no global TRUE fallback. Preserve qualitative approved expectations,
report per-case deltas caused by corrected modeling and retain unexplained
FAIL/NV. No claim of complete EDM/groupError/discrepancy lifecycle follows.

The above does not close the separately reproduced LV/HV PLC pulse/recovery
Set gap, expand hardware scope or require native Verify/Build. Final software
acceptance requires independent review of the implementation and regressions.
