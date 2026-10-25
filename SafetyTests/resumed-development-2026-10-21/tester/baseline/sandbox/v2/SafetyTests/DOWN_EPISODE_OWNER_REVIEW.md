# Independent down-episode owner review

2026-10-20. **Isolated build reviewed; working SAL HOLD.**

Actual candidate SAL SHA256 `f6d4fb7fa4f2ee0d29f19f8e43a87fca657ddf329bab0a7afb54e50b87cd6966` and SGVL `ab0f0ef25e29b4bf82722fcefc783daf8b01157c6c6d228f0e6948b4a568452a` independently confirmed. Fresh complete SAL parse with explicit SGVL: bindings PASS, zero errors.

Actual order is Step2 RS22, episode owner RS26, Network5 And1 order27. Owner Set is actual Network12 Decouple1 DecOut3; Reset is inverted actual Step2. N5And1 input4 is inverted owner; prior three power-on guards remain. This implements the planned first-Step2-scan capture before the energization qualifier. Runtime proof of late down-request availability, retention, exit/re-entry and legacy startup compatibility remains required.

SG order167 now uses direct GREEN TON and inverted RND_SCOPE reset. The previously reported arbitrary Safe&&RnD non-equivalence remains an open finding until source phase/guard proof or a preserving redesign closes it. Global onehot assumption is insufficient. Normal protocol evidence alone is not an assertion about all conflicting histories. No conflict oracle is selected here.

Require independent same-protocol no-reenergization baseline/Safe255/mitigation comparison, actual output and permitted Set observations, unchanged Step2 startup positive, episode reset/re-entry, prior Safe controls, full69 RnD and88 earlySTO, and review of all raw full-check failures. Full healthy Safe completion remains a separate mandatory gap; no hardware/native/fullBOOT claim follows.

## v2 preserving SG: technical construction gate

**READY for isolated v2 build/replay.** Retain SG_OWNER_SET and original SG Reset=!E; do not accept v1's arbitrary-conflict non-equivalence. Fund owner RS by retiring pure GATE019 and applying De Morgan at its sole inverted consumer GATE023: AndIn4=!GREEN TON, activate free AndIn5=!BLUE TON. Both TONs execute before the consumer. Under the already reviewed FinishG/FinishB-to-current-TON replacement, !(G OR B)=!G AND !B for every Boolean valuation, independent of mode/state/onehot assumptions. This removes v1's SG-specific conflict change by construction; generated actual bindings remain to be checked.

Independent source audit found GATE019 order146, sole canonical consumer GATE023.AndIn4 with inverted contact, output global bindings0 and alias usages0. Raw XML output-moniker references0 and SGVL output-ID usages0; its own source-side wire supplies the single consumer. GATE023 has unused input5 and native eight-input AND capacity. Require raw retirement usages, one canonical new wire per pair, input activation/inversion and full binding audit on generated candidate.

The proposed raw fault-component owner-exit test is acceptable: after actual down-owned Step2 with LV/HV feedback OFF, given FalseInput TRUE and ESNC1 FALSE may exercise actual EStopFALSE/N5And7 SafeSet3, actual N3 Step2 reset and then owner clear. This is explicitly a conditional fault-branch technical reset proof, not normal discharge/Safe completion or full Emergency behavior acceptance. Manual real restart/fullneutral/freshBOTH may test subsequent source re-entry if actual guards admit it. No phase/owner seeding after protocolstart and no invented physical response or new timing oracle.

## Frozen v2 actual static verdict

**Static SG finding CLOSED; execution/full-check migration gates remain HOLD for working SAL.** Independently confirmed actual SAL `72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e` and SGVL `de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56`. Fresh whole-source audit PASS0,255 blocks.

STATE_SG native identity, complete ports, Set/Reset bindings and outputs match accepted Safe255 exactly except numeric order. SG_OWNER_SET166 explicitly remains GreenTON AND !Safe. Thus v1's SG conflict change is removed without assuming onehot. GATE019 is absent; all its input/output native IDs and path references are absent from full generated SAL/SGVL. Original sole-consumer usage proof remains applicable.

Actual GREEN TON141 and BLUE TON142 precede GATE023152. GATE023 retains prior inputs1..3, has activated inverted GREEN on input4 and activated inverted BLUE on input5. This is native De Morgan composition with correct current-scan order. Episode owner26 still precedes N5And127 with inverted owner gate and actual Step2/current-down bindings. No new static finding in these changes.

This verdict does not approve silent migration of old structural/hash/order test assertions or convenient fixture FALSE defaults. Independent migration review and honest raw-suite accounting, owner capture/reset/re-entry/legacy controls, Safe/69/88 regression and actual no-renewed-energy evidence are still required before working-source handoff. Full Safe endpoint and the retained Run failures remain separate gaps.

## v2 independent execution review

**ACCEPT bounded fix evidence; working-source handoff still waits for independent full-suite migration review.** Editor self69/88 and exact-proof logs are supporting evidence; independent tester separately reran unchanged69 RnD and88 earlySTO with PASS and no FinishUp remapping. Independent same-protocol down comparison reproduces2501 renewed-energy samples on baseline/prior and0 on v2 over2500ms. These duration counts are not event counts.

Read independent runner/fixture/re-entry scripts and inspected raw evidence: down trace8312frames, re-entry12648frames, all1ms continuous, zero demanded fallback. First actual Step2 sample5823 has ownerTRUE and no subsequent permitted LV/HV Set or LV/HV output. Intra-block observer tests owner before N5 power qualifier. Owner falls6326 on actual fault-branch Step2 exit and recaptures12159 after actual manual restart/fullneutral/freshBOTH/down cycle. No phase/owner writes occur after protocolstart.

The three baseline/prior/v2 initial-Step2+generic-discharge controls prove local legacy startup remains permitted without an RnD-down origin; this is a declared initial-state control, not BOOT reachability. Actual raw fault-exit/re-entry proves technical owner clearing and future fresh-cycle availability. It does not establish healthy normal RnD→Safe completion or full Emergency handling. SPEC11 negative energy requirement is repaired within this tested source boundary; complete section11 sequence remains separately uncovered.

SG conflict equivalence is additionally supported by independent typed conflict/ES/interlock availability comparisons; the static exact SG preservation proof already avoids using those seeded conflict states as normal reachability claims. Native De Morgan actual four combinations/every-scan checks complement static composition proof.

No new substantive finding in this bounded mitigation evidence. Final Safe boundary runner/report and independent migrated full check must remain attributable to exact frozen72f42/de0fa pair. Raw previous full RED results are preserved; no inventory/hash/fixture migration is implicitly approved by this section.

## Independent full-suite migration: first fixture/CVR review

Read test-migration-down-owner PLAN/run.mjs. Adding actual SafeResumption blocks to the three named energy fixture closures preserves their existing assertions. Dynamic Safe preparation for Unlock uses actual producers/restart/fullrelease/qualified positive; retaining instantaneous raw-blue preparation would contradict approved500ms behavior. Runtime/parser/effective ESTOP identity checks are appropriate.

CVR replacement correctly removes obsolete instantaneous grant expectation, retains499-negative/500-positive/release-firstscan and DoorMonitor/ESNC1/ESNC2/PLC negatives. Finding M1: endpoint-only499 and600 checks do not exclude transient earlier grant/output. Requested continuous existing-frame assertions before500 and throughout fault attempts, including first input sample. This is a test sufficiency issue, not an observed SAL defect. First-stage migration remains conditional until M1 is closed; exact structural17 migration is separately pending. No blanket skip/hash refresh is approved as functional evidence.

## CVR timing source-ledger correction

The first migrated final-output-at500 assertion is not justified by approved500 qualification. Actual frozen v2 order: SafeAnd7=100; BLUE TON=142; BA=169; grant OR4=174; grant RS6=175; final Unlock=255. When BLUE/BA qualify at500, SafeAnd7 has already run and consumes BA on next scan501; downstream grant/final can then rise in that same501 scan. Recorded final rise501 is consistent with this source chronology. Require exact native qualification at500, no output/grant on any earlier sample, and actual next-consumer positive501. This distinguishes qualification from measured downstream transfer without inventing grace intervals or physical timing.

PLCPULSE fixture's new owner source-cut error must be repaired with actual producer dependency closure. Seeding owner FALSE would suppress the implementation under review and is not an acceptable migration.

## Functional migration follow-up gate

**READY reviewed functional edits for immutable isolated full execution; structural migration review pending.** Read current runner and copied PLCPULSE fixture. M1 is closed: all saved samples before500 exclude SafeBlue/grant/Unlock; native BLUE/BA are required at500, grant/final at source-consumer501, release clears first scan. Fault attempts include first input sample and every recorded grant/output sample.

PLCPULSE adds the real70-block owner cone, retains48 existing positive/fault assertions, declares new phase/raw boundaries and throws on unknown demanded inputs. Owner is not replaced by FALSE. DECOUPLE demand checking follows selected actual output consumers, leaving other unbound channels inventoried outside the demanded cone; this is conditional component evidence, not native-unused/channel-FALSE proof. Existing explicit ResetFALSE and upstream/phase cuts remain visible.

Candidate-button-cover observer change adds actual compact/SafeResumption producers and full neutral preparation before Safe blue controls. Expectations are unchanged. Existing typed RS/EStop memory preparation remains a diagnostic component limitation and cannot become phase reachability/BOOT evidence by passing. State-conflict failures and mandatory NOT VERIFIED coverage remain open.

Previous full subprocess whose helper changed during execution is diagnostic only. Before citing a final run, use a fresh immutable cold copy and record all source/test/helper/runtime/manifest identities before and after. No mutation during execution and no reuse of stale canonical diagnostics as production tests. Exact structural tuple migration requires its own review before functional full-check acceptance.

## Structural migration ledger review

Ledger authority is reviewed downEpisodeOwnerCandidateV2, not a new behavioral oracle. Independently recomputed whole-source quantities: baseline→v2 FB255→255, networks13→14, ports2180→2175, edges338→342, FB global refs196→201, stateful52→53, TON21→20, parameter ports23→22, alias targets183→178. Independently compared actual canonical edge sets against the ledger table: exactly20 removed and24 added, no discrepancy.

The proposed migration architecture is acceptable for a reviewable implementation: frozen baseline plus explicit approved delta, specialised per-row assertions, historical contracts still checked against baseline, actual retained critical IDs/orders/polarities/fanouts and negative mutation rejection retained. Do not replace17 bodies by generic PASS or refresh expectations from the candidate at runtime. Actual test/helper diff and complete native inventory projection must still be reviewed before final execution. BOOT inventory migration may remove SOURCE_COVERAGE_MISMATCH only for the independently checked exact native tuple; functionalBootPass0 and both unsupported Network4/group NOT VERIFIED outcomes remain unchanged.

## Actual structural/BOOT migration implementation gate

**READY for immutable final isolated execution after integrating the separately reviewed new regression.** Read structural-helper/spec/application proposal, mutation tests and BOOT manifest/test generator. Seventeen stale bodies map to relevant specialised proof subsets: exact ordered255 graph, frozen baseline+explicit wire/alias/SGVL deltas, retained native IDs/port attributes/timers, new eight primitive templates and polarities, and retained early-STO/energy/final/PLC/Door invariants. Existing Door truth tables and historical deterministic early-STO manifest checks remain against historical baseline. No generic PASS/skip mechanism was found.

Six added negative controls mutate actual current parsed wire set, retained native ID, early-STO polarity, timer list, owner execution order and output alias source, and require rejection. They complement unchanged source-revision/input/metadata mutation checks. The frozen source hash is an identity guard, not the sole structural proof.

BOOT manifest generator invokes all specialised delta checks before generating a full native inventory, including per-block/port attributes, actual bindings, alias/global declarations/usages and group bindings. It is not count-only acceptance. BOOT test diff changes only stateful52→53; rejection tests, functionalBootPass0, execution.performed=false and two unsupported Network4/group capability outcomes remain. Updating that reviewed source inventory may remove identity ERROR but grants no functional BOOT PASS.

Require final immutable copy/input hashes start and end, all remaining actual failures/NOT VERIFIED visible, and canonical no-renewed-energy regression integrated into the automatic package. No working SAL transfer is approved by this migration-preparation gate alone.

## Canonical automatic no-renewed-energy regression review

**READY for integration into immutable final full run.** Reviewed proposed current-rnd-down-no-reenergy.test.js and helpers/rnd-down-source.js. Four tests exercise first-Step2 owner capture/intra-block power veto plus2500ms retention/no renewed Set/output, ordinary initialStep2 startup with generic discharge FALSE and TRUE, and actual conditional fault-branch exit/manual restart/fullneutral/fresh down recapture.

Helper always reads the actual canonical working SAL and explicit matching SGVL, computes hashes and performs fresh full binding audit before dependency selection. No candidate/archive/environment source switch exists. Every demanded path must have an actual writer or enumerated raw boundary; seven exact Network4 outputs and initial state are declared. Runtime phase/owner injection is forbidden after protocolstart. Evidence environment variable selects output directory only.

On an older source lacking the owner, fixture throws No writer; that is an honest fixture availability diagnostic, not a fabricated ownerFALSE or archival source execution. Historical paired RED evidence remains the separate proof of prior behavior. Automatic tests are intended for the actual new working pair after handoff. Scope explicitly excludes healthy Safe completion/fullBOOT/native/hardware validation.

Additional retained native FB-attribute comparison in structural helper strengthens identity preservation without changing the expected delta or functional oracle. Final execution/harness hash-start/end review remains before working-source transfer.

## Final immutable run-001 and local working handoff verdict

**READY for bounded local working-source/test handoff of the exact24-file transfer manifest.** This accepts the Safe qualification/no-renewed-energy mitigation package, not overall project/41-requirement acceptance. No deployment/push/native Verify/Build/CRC/hardware action is authorized by this review.

Independent integrity verification rehashed every one of280 run inputs against run-001-inputs.json and every24 transfer source against its proposed newSHA: all match. Manifest-file SHA5625dba72f4248f87d2227d93cfb737de3adcf80502027dc9f1d51c1337f718b differs legitimately from input-array SHA4b8cd24540f55d066fd4193f072eb5fd10223bb4e4680059257549e22157c346: the former hashes pretty JSON wrapper file, the latter compact JSON.stringify(files). Both independently recomputed; before-array and after-array digests equal. Transfer manifest SHA `bcaba17c54a0e6beb88f108d2182efce26d07c798333788dabb5f6fac705f74a` independently confirmed.

Actual raw full result agrees: harness189/189PASS; historical74PASS/1skip of75; current436PASS/2FAIL of438. Both failures are retained Run invalid-short-chord degradation cases. Case summary199PASS/1known STATE-conflict FAIL/8NOT VERIFIED/0ERROR; BOOT remains unsupported Network4/group, functionalPass0, execution false. Exit1 is expected and must remain visible. No new unexplained failure or concealed error in this reviewed full result.

Primary four actual-working-source regression tests and six structural mutation controls are included. Runtime/parser/native-pair/clock/binding engines remain unchanged. Physical RnD helper only remaps retired Green/Blue internal Finish observations to current native TONs; actual retained FinishUp remains observed. New source/test fixtures and inventory changes are the reviewed explicit deltas, not a claim that model/hardware is complete.

Transfer only exact manifest sources, check destination oldSHA preconditions/new-file absence and source newSHA before copying, then verify working pair/test identities and rerun canonical software check with honest RED statuses. If any destination has drifted, return for investigation rather than overwrite unrelated changes. Final normal RnD→Safe completion, overall state conflict, retained Run defects and mandatory NOT VERIFIED coverage remain open after handoff.

## Actual working-source post-transfer final verdict

**ACCEPT bounded working implementation and test migration. Overall project acceptance remains RED.** Independently rehashed actual24 transferred files, six protected core files and three canonical reports: all match FINAL_WORKING_EVIDENCE. Actual canonical source pair is72f42/de0fa; actual npm check reports189/189 harness,75/75 historical with reference available,436/438 current with the two unchanged Run invalid-chord failures. Cases200PASS/1STATE-conflict FAIL/7NOT VERIFIED/0ERROR; BOOT functionalPass0/no execution remain explicit. Input integrity report records all280 files unchanged through canonical execution.

Compared case IDs/statuses against git103a2bd saved software report. Exactly one case disappears: TIMER://Network2/FBTon3, oldPASS1000ms. No case IDs were added and no remaining case status changed. This timer was explicitly retired by the reviewed native delta; replacement TIMER://RndPhysicalCompact/BOTH remainsPASS1000ms with before-threshold/interruption/reset/fullinterval/hold/release observations. Actual Safe/BOTH integration is separately covered by reviewed behavioral tests. PASS201→200 therefore reflects removal of a retired component test, not a silently removed mandatory requirement.

Remaining independent work: repair retained Run invalid-short-chord degradation without choosing unresolved full-BOTH endpoint; analyse/fix STATE conflicting requests under approved priorities; establish normal RnD shutdown completion into Safe and complete mandatory transition/guard/fault/restart coverage. Existing late no-fault/no-rollback and full-phase cases remain NOT VERIFIED. Unknown QR/QT/QP reactions require reference/requirements analysis and an addressed user question only where those sources remain ambiguous. Native/group capability gaps remain explicit limits, not hidden hardware gates or permission to infer native safety.

No new substantive finding in the accepted bounded source fix. This closes review of its actual implementation in working SAL; it does not close all41 requirements, authorize push/deployment or claim hardware validation.
