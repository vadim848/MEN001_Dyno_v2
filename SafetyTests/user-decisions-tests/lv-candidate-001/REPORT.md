# Independent LV254 candidate result

**READY for independent implementation review.** Exact isolated source pair:
SAL b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161,
SGVL 4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5.
Candidate hashes match before/after. Whole binding audit and exact254/native
manifest/order/binding/timer/parameter/alias/group identity gates PASS.
NATIVE_PORTS.json preserves native port identities and canonical edges.

| Coverage | Result |
|---|---|
| Both LV feedback histories, actual healthy Safe and real fresh Safe→Rnd | 2/2 PASS |
| First eligible completion NC1/NC2/Mentee/PLC/external1/external2 | 6/6 PASS |
| Actual Rnd-clear/Safe-not-published gap, same six current faults | 6/6 PASS |
| Original-start Step2, generic discharge FALSE/TRUE | 2/2 PASS |
| Full accepted-SG interval no Step2/no energy Set/no OFF→ON replay | 14/14 PASS |
| Retained Safe gesture suite | 15/15 PASS |
| Unchanged physical Rnd suite | 69/69 PASS |
| Unchanged early-STO suite | 88/88 PASS |
| Retained A1/A2 fault/current-Set suite | 40/40 PASS |
| SG conflicting phase/fault availability baseline comparison | 3/3 paired PASS |

Both healthy positives execute actual initial Safe→Rnd→green shutdown→LV output
OFF→actual Safe→full neutral→new BOTH→actual Rnd. FeedbackON blocks premature
Safe; feedback alreadyOFF does not skip LV commandOFF. No terminal phase or
owner is seeded. Fault cases release green while active before raw restoration;
no manual Restart is introduced, and no stale completion or energy replay
occurs. The Rnd-clear gap is a real sampled interval, not a fabricated phase.
NC1 was added explicitly to check the first current-fault consumer, rather
than assuming NC2 equivalence. ExternalNC checks use actual permit/scope;
they do not assert NC2's main-EStop latch policy.

The retired down-Step2 owner is absent, not mapped to FALSE. Its old requirement
is migrated to the reviewed route plus continuous no-down-origin-Step2,
proposal/permitted-Set and actual output transition evidence from real SG
acceptance until the next fresh gesture. Native Set/Reset values are passively
captured immediately before actual RS evaluation. Original startup controls
remain positive. Completed final core run has16PASS/0FAIL/0ERROR; earlier
unmodified observer pass14 and NC1 supplement are superseded by this final16.

Retained tests run in a separately copied sandbox whose SHA256 inputs remained
unchanged. Safe15 has only reviewed255→254 structural-count migration.
Rnd69/earlySTO88 test assertions/files are byte-identical to working inputs.
A1/A2 removes the retired-owner observer and replaces only ordinary-start
ownerFALSE with real downFALSE plus independent proof that normal down cannot
set Step2; its fault/permission/RS assertions remain unchanged. Three SG
comparison cases retain original conflict/fault availability expectations.
REGRESSION_INPUTS.json documents this narrow migration.

Reproduce from repository root using explicit candidate paths:

```
node SafetyTests/user-decisions-tests/lv-candidate-001/structural.mjs SafetyTests/candidates/lv-completion/TwinSafeGroup1.sal SafetyTests/candidates/lv-completion/GVL1.sgvl
node SafetyTests/user-decisions-tests/lv-candidate-001/run.mjs SafetyTests/candidates/lv-completion/TwinSafeGroup1.sal SafetyTests/candidates/lv-completion/GVL1.sgvl
node SafetyTests/user-decisions-tests/lv-candidate-001/audit-evidence.mjs
```

Core source-bound traces are one lossless gzip per case. RESULTS.json contains
checks/marks; ACCEPTED_DOWN_AUDIT.json independently checks full intervals.
safe15.log/rnd69.log/early88.log/a1a2.log and SG_RESULTS.json record retained
suite outcomes. prepare-regression.mjs reconstructs the sandbox from the stated
source pair; safe15.mjs takes the three recorded source/helper hashes. Runtime,
parser, binding, clock and native pair identities are recorded in the audit.

Limits: declared initial component Safe/Step2 or Run boundaries, seven inactive
N4 globals, shared software runtime; no full BOOT/group/native/hardware proof.
No hardware/Build/CRC/deployment/push performed. This narrow LV result does not
close remaining Run/StartingRun defects, full438 structural migration, all41
requirements, or the independently unresolved HV completion contract.
No working source, candidate source or frozen RED artifact was written.

All runtime processes have completed. ALLWRITESSTOP after package manifest.
