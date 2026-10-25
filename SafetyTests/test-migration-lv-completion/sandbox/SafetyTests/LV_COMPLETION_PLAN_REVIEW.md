# Independent plan gate: LV completion 254

2026-10-20. **READY to implement the isolated LV candidate**, version `lv-completion-v1-254`. This approves the narrow design for candidate construction and testing, not working-source promotion or behavioral acceptance. Run/StartingRun sections3–4 are excluded.

Reviewed USER_DECISIONS_IMPLEMENTATION_ARCHITECTURE sections1–2, LV_COMPLETION_COUNTED_PLAN.json, the latest LV user decision and prior source-bound baseline/review. The approved target is actual commandOFF followed by sufficient LV feedbackOFF evidence and real Safe/reentry, preserving existing shutdown actions and original startup. No new physical timing or HV completion oracle is selected.

## Independent structural checks

Parsed actual SAL72f42daf… with explicit SGVLde0fa993…; full audit PASS. Read native XML IDs independently. Verified all254 manifest rows have consecutive exact order1..254, match actual block IDs/source orders, omit only the named down-owner RS and preserve every retained relative order except the explicitly moved And15. Verified all eight binding targets and two deactivated port IDs against actual source.

Moved And15 is order18: current permit2 and LV/HV command RS4/6 precede it; Safe aggregate19/RS20 follow it. Its retained input1 is actual N12 DecOut4 shutdown request and input2 inverted LV feedback. Added inputs use real LV/HV RS outputs, inverted C2 feedback, current permit, inverted Mentee and False. Polarity choices match the project's native contact convention. Permit includes current ES NC1/2, external NC1/2, both connectors and inverted PLC; direct Mentee avoids stale prior main-EStop acceptance before main EStop24.

Routing reuses completion declaration `b_Step2_Set_2` for Safe aggregate input5 and existing Rnd-reset aggregate, removes its old Step2-set input and removes the obsolete down-owner's sole N5 consumer. This replacement is essential: retiring that veto while retaining down-origin Step2 entry would reintroduce reenergization. Original Step2/!False/EStop startup inputs, fanout and shutdown battery/BMS/discharge/ResetLV/Transition2 fanouts remain unchanged.

The architecture's SG reset change is necessary and bounded. Actual RND_SCOPE is E AND Rnd, not MODE alone; !RND_SCOPE clears SG after actual Rnd exit even when Safe keeps MODE active, retaining fault reset and accepted SG while the Rnd scope survives. SG_OWNER_SET and its !Safe gate are preserved. This is an intentional owner-lifetime change, not an assumed onehot simplification.

## Ordered behavior and candidate proof obligations

While LV command remains ON, completion cannot assert, even with feedback alreadyOFF. Its earlier evaluation consumes real command state, while the original late shutdown producer and reset writers remain ordered as before. On completion the existing late Rnd reset acts; Safe RS is still reset-dominant while actual Rnd remains TRUE. A later scan can establish Safe from retained real shutdown request, then scoped SG clears. Thus a transient all-zero phase interval is expected by chronology and cannot itself be labeled an invalid conflict or full-system reachability proof.

Independent candidate tests must retain the following gates before promotion:

1. Both feedback histories reach real Safe after actual commandOFF; feedbackON rejects completion without a fabricated timeout. Actual Safe/full neutral/fresh BOTH must reach actual Step12/Rnd without phase/owner injection. Held green and later release must neither replay shutdown nor prevent valid rearm.
2. No accepted-down Step2 episode, LV/HV aggregate replay, permitted Set or OFF→ON output rise during completion, SG clear, feedback restoration or reentry preparation. Check real Set/Reset consumers, not request absence alone. Preserve the old RED baseline and explicitly migrate the retired-owner invariant to actual replacement routing/output evidence.
3. Inject current NC2, Mentee, PLC and each external interlock on the first eligible completion scan and separately in the interval **after actual Rnd reset but before Safe publishes**. Observe And15, Safe Set/Reset, main EStop, SG and real shutdown producer continuously. Release green while the fault is active before clean restoration where manual-Restart avoidance is asserted. Raw restoration must not replay a cancelled/stale completion. Do not impose NC2's main-EStop latch behavior on external interlocks.
4. Original-start Step2 with no down request remains available, including the earlier generic-discharge FALSE/TRUE controls. Rnd gesture, early-STO and Safe gesture regressions remain; direct fault availability and SG conflict behavior must not be inferred solely from normal endpoint positives.
5. Fresh candidate whole-source audit, usage indices, exact canonical edges, count/order254 and unchanged retained timer/parameter/hardware/group identities precede behavioral cuts. Tests must explicitly report initial component phase and seven inactive N4 assumptions; no BOOT/hardware claim follows.

## Serialization clarification

The manifest's “No new GUIDs ... needed” is interpreted as no new **block, port or global declaration identities**. New canonical-wire, alias usage or DSL relationship objects may require valid unique relationship GUIDs; mandatory wrappers and matching SGVL usages must not be omitted to satisfy that shorthand. The editor should record those serialization-only identities. No duplicate wire objects for opposite directions of one canonical edge are permitted. This clarification does not authorize any additional logical change.

Candidate construction is READY under these explicit obligations. Any failing priority, rearm or no-reenergy test returns to the architect before working-source promotion. The unsupported group lifecycle, full HV completion and separate Run/StartingRun defects remain open. Only this review file was written; no candidate, working SAL, SGVL or test was changed.
