# E-Stop restart / EDM audit — 2026-10-18

## Reference

[Beckhoff TwinSAFE Logic FB manual, v4.3.0](https://download.beckhoff.com/download/document/automation/twinsafe/twinsafe-logic-fb_en.pdf),
sections 4.4.1–4.4.4, printed pages 45–53:

- Restart requires a press/release sequence before leaving the safe state.
- EStopOut drops immediately on a safety request; EStopDelOut drops after its
  configured delay. This is an off-delay, not an on-delay.
- EDM monitoring is configurable and its restart faults require group-level
  acknowledgement. These behaviors cannot be inferred from a floating input.

## SAL evidence

`Network1/FBEstop1`: Restart uses `in_Reset_PB`; active EStopIn1 uses
`in_ES_NC_1`, EStopIn3 is driven by Network1/FBAnd1. Remaining channel
assignments are described in `V2_BASELINE_REPORT.md`. Delay parameter is
explicitly **Delay Time (ms) = 100**. Delayed output is not wired to a variable
or target in this SAL, so the corrected delay alone does not change actual
connected energy-command paths.

EDM1/EDM2 have no explicit producer or channelInterface activation attribute
in the parsed ports. Absence of those attributes does not by itself establish
the editor/build configuration. No-EDM operation remains an adapter assumption,
requiring confirmation in the TwinSAFE editor/export.

## Adapter corrections

Previous behavior incorrectly enabled on held-high Restart and modeled the
100 ms as an on-delay. The corrected partial no-EDM adapter enables only on
the release after a qualified held Restart and models delayed shutdown.
It records the no-EDM/group-lifecycle/discrepancy limitation in `limitations`.
Explicit active or connected EDM raises an unsupported-configuration error
instead of fabricating a successful result.

## Tests

`test/sal-estop-runtime.test.js` executes the real FBAnd1/FBEstop1 subset:

- ESTOP01: healthy levels and held Reset do not enable; release enables both outputs.
- ESTOP02: NC1 loss immediately removes EStopOut; delayed output drops at
  100 ms in the 10 ms adapter scan.
- ESTOP03: input restoration alone does not re-enable; a new Reset cycle does.
- ESTOP04: Reset release while unsafe is not accepted.
- ESTOP05: an injected active EDM configuration is rejected.

This is not an emergency matrix for the complete project. EDM error/restart
rules, group RUN/STOP/ERR_ACK, paired-channel discrepancy handling, physical
feedback and restart input safety integrity are not validated. Existing selected
chains that supply `b_EStop_Ok` externally do not become full E-Stop tests.

## Next

Trace established EStopOut loss through the selected state/output consumers
with explicit seeded preconditions; report competing paths and omitted producers.
Keep Network4 and unconnected-input assumptions visible. Obtain editor/runtime
evidence before accepting complete-project emergency or hardware behavior.
