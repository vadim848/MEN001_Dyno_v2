# E6v (S6-fix) implementation - editor self-check, not tester PASS
Plan: architect/S6 PLAN.md f81be509, PLAN.json fd568d80 (hash-checked in tools/make-e6v.mjs). Q-S6-1 "A": S6_TRUE = in_ES_NC_1 OR NOT in_ES_NC_1, one safeOr block (B = change S6_TRUE.OrIn2 / its source only).
Base: canonical E5 SAL 4c4be64b, SGVL 27864ca3, diagram 7ad25ee8 (source/). Build: `node tools/make-e6v.mjs source staged` + `tools/native-save-e6v.ps1` (native writers regenerate CRC) -> native/ = candidates/E6v/native. Canonical untouched, no commit.
## Output (candidates/E6v/native)
- SAL 9209319039fc555e77e5dfc626deafd507a14058cfd96847f0eb29dccb3469ef
- SGVL 27864ca301abf9c651527c66ff15194ef802a9016e344f02ec3e6b1681995db1 (unchanged)
- diagram 1b3f3468b6fd8452b790d15b85ddbfe7beb71b4677cad4c273e3089e2fd5f441
## Inventory (E5 -> E6v)
networks 14; FB 337 -> 344 (+7); SAL variables 105; SGVL symbols 63; ports 2725 -> 2788; orders contiguous 1..344; wires +23 (local, Network1); 0 inter-network wires; 16 offending var target usages removed, 9 added. No timer/hardware/group/target change.
## Self-checks
- NATIVE_FRESH_RELOAD.log: nativeCrcValid=True, SGVL FileCrcMismatch=False, 14/105/344/2788/63, 28 label checks (2 label probes retargeted to new gates S6_G_HB/S6_G_BYP AndIn1, as the old ports are now wires).
- STRUCTURE_CHECK.log: PASS incl. native input rule (0 errors), preflight, CRC.
- catalog-all.tap (TRIGGER_EMG=in_Estop_PLC, SAFETYFAULT=linkSafetyFault): 126 tests, 124 pass, 1 fail, 1 todo.
  Fail: [M] M-04 "cover (NC) removed from Run guards" SURVIVED (C-04 passes on mutant). Cause: mutant deactivates FBAnd1.AndIn3 and HEALTHY_OK.AndIn3 (linkCoverClosed); the PLAN min-2 fix HEALTHY_OK.AndIn4 <- linkCoverClosed (AND(x,x)=x) still carries the cover. Not a logic deviation; the M-04 mutation spec (tester) must also deactivate HEALTHY_OK.AndIn4.
  All other [M] rows killed.
- Not run: check:software.
## Deviations
None from the plan. Expected 125/0/1 not met only due to M-04 mutation definition above.
