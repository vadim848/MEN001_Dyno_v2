# Additional resource stage — exact10-block proposal after frozen P0

READY for independent source-plan review, not accepted equivalence or editor instruction. `RESOURCE_EXTENSION10_PLAN.json` is frozen; its generator allocates new wire IDs if rerun, invalidating the freeze. It targets only native P0 SAL34b5b850... /SGVL517fdadd..., independently from the frozen F1 graph. Rebase onto F1 later by explicit combined ledger; do not apply two independent wire/order manifests blindly.

Exactly7relay retirements and3duplicateAND retirements give **241->231FB**,2066->1927data ports,75Symbols and206globalrefs retained,306->286localwires,0cross-network. No timer/stateful functional memory removed. Ordinaryglobal writers move to identical upstream outputs; output may carry several existing globalrefs.

Installed native cardinality evidence: `probes/multiple-global/RESULT.json` shows two existing writerrefs moved through native API onto one AndOut, validation0errors before/after, savePASS and independent-store CRC-valid reload retains both original GUIDs/all254FB/all75Symbols. It is not a timing proof or general5ref native-candidate acceptance; actual candidate with all source-port/GVL counterpart changes must pass native/typed checks again.

## Per-reader cyclic timing proof

Producer p, relay r, reader c refer to actual native order. Old producer sample age at reader = (p<r?0:1)+(r<c?0:1); direct producer age = (p<c?0:1). Every proposed reader has equal ages in JSON. A reader outside numeric min/max alone would not prove this across scan wrap. The JSON records each actual output/global target rather than one representative.

| Retire | Keep producer | Proved consumer ages | First scan obligation |
|---|---|---|---|
| N6Decouple1 | N6And2 |0|Producer and both publishers before retained Step4 RS reader; rawsourceTRUE must work firstscan. |
| N2Decouple2 | N2And2 |0|Both before STOreset consumer. Existing upstream output retains original STO1global plus movedSTO2global. |
| N5Decouple1 | N5And1 |0|Both before LV/HVSet consumers; move two globals, no step/cycle assumption. |
| N7Decouple1 | N7And1 |0 and1|Late clock/AND readers consume current production; early C3/RBM/LVdischarge global readers consume unchanged initial/previous global value before either publisher. |
| N8Decouple1 | N8And1 |0 and1|TON consumes current; early discharge global consumer sees unchanged firstscan initial/previous value. |
| N12Decouple2 | N12And6 |0 and1|Real current P0 producer precedes relay. C2confirmation→Step3Reset and ResetLock current readers retaincurrent; early STO/Step3Set readers retainprevious. Upstream already writes HVdischarge reset; move4extra refs. |
| N12Decouple1 | N12Or2 |0 and1|CurrentP0 producer precedesrelay (verified directly, not assumed from name). Early LVcompletion input and C3/RBM/LVreset consumers retainprevious; transition consumer afterboth retaincurrent. |
| N1And10 | N1And9 |1|Same raw expression, both after their actual consumers; native pre-evaluation output replacementValue0 must equal. |
| N1And12 | N1And11 |1|Same proof, unchanged firstscan output0; no raw writer between equivalent reads. |
| N12And17 | N12And11 |1|Same DoorMonitor/!False expression, both aftertheir consumers; original three Door consumers preserved semantically despite sharedproducer. |

For c<p<r global readers, the first read is the same preserved declared global value in both variants, before either writes: do not replace it by guessed FALSE. For direct prior-output reads, independently verify each retained/retired output native replacementValue0; inject source inputsTRUE on firstscan as well as FALSE, proving no instantaneous TRUE leaks before the old relay would have evaluated. Complement arbitrary prior published histories only under explicitly corresponding software state; do not claim reachable BOOT from arbitrary inconsistent flags.

Rejected counterexamples: N6Decouple2 sourceOr5 runs afterrelay, so early Set/Reset consumers read TWO-cycle history; direct bypass givesONE. N5Decouple2 has readers betweenproducer andrelay. N12Decouple3 has transitionreader betweenproducer andrelay. They are deliberately not in this resource stage. N6Decouple2 liveorphan input5 is also preserved here, not assigned a fake value.

## Required independent execution and native gate

Pair actual source/candidate rawchanges every scan, one-scan pulses, all physical edge orders, firstTRUE inputs, each earlier/later reader, actualSet/Reset/output, unchanged TONenables and timer state, snapshots, outward export and fault propagation. Compare globals at actual readers and final publication only where finalpublication is supposed equal; producer→relay move may intentionally publish earlier but not change any consumed value. General native sampling is still outside the stable-within-scan model claim.

Preserve every75Symbol declaration/nativeusage and76nonprogram record; only retire exact old program-port uses, substitute sourceportIDs on85GVL counterparts, and remove3duplicateAND rawalias reader sets. Native maxrefs/type restrictions, stable current source-slot safety format, retained diagramgeometry, changed shapes and fresh model/diagram/SGVL CRC count all required. Allocation/group/hardware settings unchanged. No source promotion based solely on algebra or native collection cardinality.

This stage is independent technical resource preparation; full normalstop/Fault/PLC/BOOT requirements remain open until their corresponding functional candidate and independent tests pass.
