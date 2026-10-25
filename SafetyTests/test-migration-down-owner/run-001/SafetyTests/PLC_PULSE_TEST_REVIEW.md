# Independent review — LV/HV PLC pulse red tests

2026-10-19. **FINAL ACCEPT red package / READY for honest checkpoint.**
Editor READY/STOP confirmed in PLC_PULSE_TESTS_READY.md. Current source remains
unchanged; this is not acceptance of the unimplemented PLC pulse guard.
No implementation/test edits by reviewer.

Read accepted bounded plan review, PLC_PULSE_SET_REQUIREMENTS, test source and
current audited model. Independently reproduced48 tests:36 PASS /12 FAIL,
zero skips, exit1. The12 failures observe actual outputTRUE on first raw
recovery, not import/binding/infrastructure errors. Full source binding audit
precedes component cuts. Current SAL/runtime and existing oracles are unchanged.

Primary traces cover LV Step12 and HV retry real producers at fixed1/2/5/10;
independent legacy Network5 AND1/Decouple route covers both domains at1/10.
They require actual aggregateTRUE/outputFALSE before first pending consumption
and genuine main manual Restart. Fault/healthy preparations are identical
until the one PLC sample. Fault sample verifies stale EStopOKTRUE and updated
PLCproducerFALSE; first recovery observes EStopOKFALSE but erroneous outputTRUE.
Every later sample is recorded, so a brief Set cannot hide behind final state.

Healthy positives demonstrate actual Set availability. Held fault/recovery
plus accepted new manual Restart, forbidden high-only Restart and latched
output/ResetFALSE controls distinguish inhibit, fault memory and forceReset.
ResetFALSE and Network3/state/upstream cuts are explicit component boundaries;
these are not full emergency Reset or phase reachability claims. Other-route
request cuts cannot replace the selected real producer.

FalseInput checks preserve its actual !PLC&&!False producer role and manual
Restart semantics, without claiming an unapproved immediate raw-False ban.
They initially also assert PLCstop to isolate that operand check from the
separately exposed pulse Set defect. Existing48 cases exercise valid behavior
on unchanged source; no new timing/user policy is invented.

Requested metadata clarification: boundary `value` describes initialization,
but HV retry later explicitly injects FBAnd4TRUE; LVStep12/legacyStep2 also
activate. Record initial values distinctly and actual prehistory route/cut
values so the evidence ledger does not present HVupstreamFALSE while executing
TRUE. The injection is explicit in code; this is evidence honesty, not an
oracle or program-logic change. Clarification is now implemented and reviewed:
initialValue is separate, prehistory stores actual typed boundary values, and
each frame exposes Step12/Step2/HVretrySource/ResetSource. R1 is closed.

Final test SHA256
`6a3929a9af9e3529ce3ef03026d92ef3753d379ff2f365609bce2bc5925f1133`
independently checked. Baseline records44 chain rows plus4 real producer
truth-table rows,48 total36/12/0. Source a50e24af… and runtime14d50f18… retain
the accepted R3 implementation. No hidden healthy seed, forced latch state,
timer change or reduced forbidden interval was introduced.

Reviewer writes STOP. Reviewed red checkpoint can precede implementation.
