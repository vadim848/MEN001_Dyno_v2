# Independent plan review — PLC pulse Set guards and early STO

2026-10-19. **ACCEPT bounded approach / conditional READY after R3 acceptance.**
This approves preparation of tests and an exact follow-up package, not current
SAL, permission to bypass the R3 hold, or complete emergency/StartingRun acceptance.

Read `PLC_PULSE_SET_GUARD_REVIEW.md`, `PLC_PULSE_SET_REQUIREMENTS.md`, probe
source, and `EARLY_STO_ORDER_REVIEW_PLAN.md`. The latter is the selected plan;
older tail relocation/same-scan text in EARLY_STO_PROGRAM_PLAN is historical.
Program sources/port identities must be refreshed after accepted R3.

## PLC pulse reasoning

Early gates consume previous EStopOK before main EStop21, which itself reads
previous PLCproducer95. A one-sample raw PLC fault is blocked currently, but
on raw restoration the early gate can see stale EStopOK TRUE. Adding the
existing previous PLCproducer to the two free direct AndIn4 ports closes
that precise gap: raw guard blocks faultN, producerFALSE blocks recoveryN+1,
then EStop memory blocks N+2 until manual Restart. No added block, timer,
reordering or forced Reset is needed. Existing guard ports1–3 remain intact.

The real producer is `Network1/FBAnd1`, not Network12/FBAnd1, and equals
!PLCstop AND !FalseInput. Preserve both operands. Tests for FalseInput must
describe its actual program role; this is not authorization to declare its
physical meaning or claim a new immediate raw-False guard. CurrentPermit
contains rawPLC but no raw-False input, so the proposed fourth input alone
does not prove first-sample blocking for arbitrary FalseInput changes.

Paired real producers must establish aggregateTRUE/outputFALSE before fault,
with actual manual Restart and explicit ResetFALSE component boundary.
Observe every fault/recovery scan, delayed restore and new manual Restart
positive; already-latched preservation does not waive full emergency Reset
requirements. Scope cuts and source hashes must remain explicit.

## Early STO reasoning

Two inserted four-input ANDs raise253 to255 blocks, preserving every old
relative order. Each guards the complete existing Set OR with CurrentPermit,
!rawMentee and previous PLCproducer. This covers both new physical SU and
old Set writers; guarding SU alone would leave stale aggregate bypasses.
Use proper alias fanout for Mentee and canonical existing producer wires.
Reset OR wiring and current late completion/discharge/Step3 actions stay.

Accepted physical SU occurs after early OR/RS. OR sees SU at N+1, and early
RS consumes that OR through its guard at N+2. This is program propagation,
not a new time delay or a same-scan output guarantee. It removes dependence
on C2/HV Healthy without inventing PLC-only launch policy. Tests must bind a
real accepted physical request, prove its lifetime through phase handoff,
and observe N through N+2; seeded SU alone is insufficient. If actual phase
exit clears the request before the OR captures it, return to architecture.

Before SAL changes require reviewed red tests: each drive, every actual old
producer/new SU, stale aggregate, first raw fault and pulse/recovery, healthy
positives, manual Restart, latched state, Reset/Set collision. Compare old
Reset/output/Network10 indication waveforms under identical traces. Preserve
all timer values and verify full binding structure before cuts. Changing
block numbers by insertion is not evidence that old semantics were preserved.

No new user policy is needed for this scoped correction: raw recovery cannot
cancel required emergency memory, and accepted StartingRun does not wait
for C2/HV Healthy. Full lifecycle, earliest physical timing, hardware safety
and native Verify/Build remain outside this plan's proof. R3 must be accepted
before following implementation authorization; neither plan closes the other.

Reviewer writes STOP. No source/test/runtime changes.
