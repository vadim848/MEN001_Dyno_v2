# Independent Safe / Armed audit — actual-producer witness

2026-10-21. **FAIL of exclusion under the explicitly declared component boundary.** The independent test reproduces simultaneous actual `b_Step1` and `b_Step3` through program producers, rather than injecting their Set requests. This is not a full native startup/hardware reachability claim. No source or recovery behavior was changed.

## Identity and admissibility

Reference was inspected first, with native structure and typed binding PASS: SAL `efddc60b1263144ae73b3d5184158100ec09c4de739dc8919309ef7b1b0dc334`. Audited canonical P0 SAL `34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b`, SGVL `517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635`; whole-source native structure and typed binding PASS before execution. Frozen architecture plan SHA `3d27524bd524f1a7196f9c6fd60b27d69845d272759313ea8da17c61bf4c7919` verified. These checks are distinct from native CRC, IDE/Target and hardware validation.

The fixture copies the existing source-driven helper into this tester directory, retains its audited producer-closure logic, exposes the runtime for observation, and expands observations to actual status exports and Unlock. It uses the existing shared parser/runtime read-only; therefore this is independent scenario execution/instrumentation, not a second independently implemented PLC interpreter. Script/runtime/helper hashes are in SUMMARY.json.

The declared initial component is Safe, after actual main EStop Restart. Seven live Network4 publication outputs are explicitly held inactive as the documented unsupported lifecycle boundary. No state/Set/Reset/owner/timer memory is injected after protocol start. There are 202 actual selected blocks: every block in the architecture's 176-block owner cone is retained except the explicitly cut Network4 Decouple. Additional status, energy and Unlock producers are included. Demanded unconnected reads: zero; unsupported executed functions: zero. Undemanded Decouple channels are not treated as proof of a native default. In particular Transition status and its extra orphan N6 DecIn5 are outside the claims here.

## Independent paired reproduction

Both paired cases execute real Safe→Step12→R&D and later real Run confirmation; this positive progress rejects a fixture that merely disables every transition. The only differing raw input is existing `inPLC_BypassC1C2`.

| Observed time ms | Actual event |
|---|---|
| 3216 | R&D established through actual producers |
| 5329 | Green pressed after neutral/filter; retained through the rest of the history |
| 5832 | Accepted single/down is pending; raw PLC code changes to11 while green remains pressed; feedback deliberately holds Run confirmation pending |
| 5836 | Actual HV command observed; Bypass asserted in witness, FALSE in paired control |
| 16337 | Existing10s bypass pipeline has run; raw HV/LV Healthy become FALSE, permitting actual N12 confirmation with its existing inverted polarity; RunSet publication occurs at order170 |
| 16338 | Raw C1/C2 feedback become FALSE. Actual Safe completion order18 and Safe RS order20 run before actual Run RS order48 consumes the previous confirmation |

At16338 Safe RS consumes Set=TRUE/Reset=FALSE; Run RS consumes Set=TRUE/Reset=FALSE. The first observed internal overlap begins at Run RS order48, native RsOut ID `5609fe11-89b1-4f20-8a80-063decd44a35`. Both actual state memories remain TRUE through the captured16588 boundary, not merely an unpublished transient. The paired BypassFALSE control has Run TRUE and Safe FALSE, with no observed overlap.

Actual endscan16338 exports are `out_Step1=TRUE`, `out_Step3=TRUE`, `out_Safety_Armed=TRUE`. This establishes a real software publication contradiction within the model. The condition is not manufactured by the old Network3-only arbitrary contradictory-Set test. That old robustness detector was separately calibrated and detects its deliberately injected conflict; calibration is not used as operating reachability evidence.

PLC while green is an admissible negative input stimulus. The current code accepting that request violates the approved rejection rule; it cannot be excluded from the test environment to claim exclusion. C2 feedback changes across two scans are explicit supplied values. No physical contactor failure/reachability assumption is inferred.

## Observed consequences and limits

At first conflicting endscan, actual LV/HV commands, STO1/STO2 outputs and Unlock are all FALSE. That snapshot does **not** prove energy commands stay off: actual N1 LV/HV RS outputs rise again at16340, fall16342, and rise16344 under the retained producers/bypass reset pipeline. The ordered Set permits and command output changes are retained in SUMMARY.json and full changed-event evidence. This is commanded software behavior, not measured voltage or torque. The audit does not infer that owner overlap alone caused every pre-existing proposal/reset oscillation.

The summary inventories direct global Safe/Run readers with native port IDs and execution orders; wired/alias consumers and producer edges remain in the frozen architecture manifest. All selected block evaluations were streamed into SHA256/count evidence; every output-vector change plus critical ordered state/energy/Unlock windows is retained, including one-scan pulses. Full changed-event evidence is losslessly available as INDEPENDENT_REPRODUCE.json.gz (raw13,464,254 bytes, gzip288,334 bytes), with decompression hash equality checked. Stream hashes are deterministic evidence of this adapter run, not a native execution proof.

## Coverage and next gate

The targeted bypass/feedback sweep completed16 histories, all prepared successfully with zero demanded fallback/unsupported functions. Eight paired BypassFALSE controls have no overlap. Three BypassTRUE histories overlap: delays10000/10001/10500 produce first overlap15838/15839/16338 respectively. BypassTRUE delays9998/9999, delayed feedback-off by1/2 scans at10500, and feedback never switched OFF show no overlap in their captured suffix. This confirms publication-order sensitivity; it is not legitimate to assume current mutually exclusive feedback predicates exclude old RunSet. Exact protocol/events/hash counts are in BYPASS_BOUNDARIES.json and its lossless gzip. All recorded file provenance hashes were checked against final unchanged inputs.

This is a targeted16-history sweep, not the architecture's entire proposed nearest-boundary/all-vector matrix. Broader CTRL4/FB6/CRITICAL5/CONNECTOR3/BYPASS6/COLLISION6 exhaustive searches and full startup/group lifecycle remain NOT VERIFIED; this report does not relabel a small sweep as universal induction. A single admitted actual-producer witness already disproves universal exclusion in the declared component scope.

Repair must address conflicting accepted ownership, pending old RunSet and every Safe-entry/Run-reset producer across publication order. Rejecting PLC while a button is pressed is required independently but is not by itself a universal invariant proof. Preserve actual output ordering and approved stopping sequences; add this witness and paired control to the independent regression gate. Architect/editor/reviewer must determine the minimal native-compatible guarantee and verify it across all producers. Emergency versus TransitionFault remains an open user decision; this test neither selects it nor proposes an enum.

No hardware/group/target edits, download, push or canonical adoption were performed by this tester.
