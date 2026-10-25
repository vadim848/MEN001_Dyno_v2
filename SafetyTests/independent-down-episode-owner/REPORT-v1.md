# Independent owner-candidate v1 evidence

2026-10-20. Frozen f6d4fb7fa4f2ee0d29f19f8e43a87fca657ddf329bab0a7afb54e50b87cd6966
SAL / ab0f0ef25e29b4bf82722fcefc783daf8b01157c6c6d228f0e6948b4a568452a SGVL.
This candidate remains HOLD for changed SG conflict semantics; owner mitigation
results alone do not authorize promotion. Previous checkpoint evidence is intact.

- Accepted RnD green-down route uses actual Step12/RnD/Step2 writers. New owner
  is TRUE on first Step2 scan and before N5And1 evaluation, stays after SG/request
  clears, and blocks renewed permitted LV/HV Set and outputs for2500ms. PASS.
- Immutable baseline and priorSafe255 reproduce2501 renewed-energy samples each
  in the same observation interval. They are EXPECTED RED controls.
- Explicit initialStep2/genericLVdischargeTRUE/noRnDdown component positives PASS
  on all three sources: old N5 requests, permitted Sets and LV/HV outputs remain
  available, while new owner remains FALSE. These are not BOOT-reachability claims.
- Actual given FalseInputTRUE plus ESNC1FALSE takes the existing fault branch
  through N5SafeSet3 and actual state writers. Step2 exit clears owner before N5.
  Actual manual Restart/neutral release and a fresh Safe→RnD→green episode capture
  owner again. PASS. This establishes a fault-branch component reset/reentry;
  normal shutdown-to-Safe and complete emergency endpoint remain unproved.
- Explicit simultaneousSafe/RnD typed-component probe: priorSG FALSE, v1SG TRUE
  after green qualification. No global onehot is assumed. Both ESNC1 and external
  InterLock NC2 faults remove SG availability in the v1 probe. The changed healthy
  conflict reaction is recorded for review; no new conflict endpoint is invented.

Tester oracle correction: an initial conflict script incorrectly required
InterLock loss to drop the native main EStop output. The assertion stopped before
that case was written. This assumption conflated in_InterLock_NC with in_ES_NC,
contrary to AGENTS. It was removed: ESNC1 retains its actual EStop assertion;
InterLock is observed through actual program availability/energy guards instead.
Final traces retain both input identities and actual results. This is a tester
error, not a candidate safety exception. No failed initial InterLock trace was
saved before the thrown assertion; no evidence is reconstructed.

Tests use unchanged software parser/runtime copies and full SAL/SGVL audits
before dependency selection. Seven explicit inactive Network4 ID boundaries and
initial component states are recorded. No program phase/owner writes occur after
protocol start in lifecycle tests; the separate conflict probe deliberately uses
typed external phase boundaries and does not claim actual conflicting reachability.
Native/hardware execution, pending PLC endpoints and healthy Safe completion are
outside these proofs. Full unchanged RnD69/69 and earlySTO88/88 independent replay
PASS, recorded separately in regression-results.json. Subsequent preserved-SG
candidate evidence is isolated under v2; v1 traces remain immutable.
