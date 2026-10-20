# Independent bounded Safe tests

2026-10-20. Fifteen cases PASS on frozen revised255 SAL
64fec23446e0c321b7e7a2b864b5f5bcfb440492ea76a26e94b7695205a14560,
SGVL1981d66fb889882a75346a58c789a5f03c9b4bd03f68d0fe01022d68c6838476.
Own isolated harness copies unchanged source runtime. Three documented Safe
diagnostic bindings map retired nodes to actual BOTH TON. Helper hash is
4385b79546a8cdf0d76dd633767fd1a957b2b419c384186b69bfad6d15d68c8c.

Initial run was14PASS/1FAIL; retained in initial-oracle-fail.json. The tester
incorrectly required a visible Safe blue request at simultaneous green arrival
on500ms. AGENTS Q-500 explicitly says not to invent visible same-scan impulse
duration; green still removes Unlock. Direct diagnostic showed BLUE.TonOutTRUE,
STATE_CTRUE and STATE_TFALSE at500ms, then BLUEFALSE with C retained. Corrected
oracle observes actual single qualification/consumption and no chord conversion,
plus no subsequent energy request. This is a documented tester-oracle correction,
not a candidate fix or waived defect. The symmetric green case uses the same
internal observations. Final results.json retains all scan frames and scopes.

This is bounded component evidence, not overall acceptance. Lifecycle, held entry,
piano/rearm breadth and other PLAN.md gaps remain open. Two existing Run failures
remain mandatory. Native/hardware execution, fullBOOT and group semantics are
outside this proof. Reviewer must independently review this oracle correction.

## Conditional lifecycle and renewed-energy counterexample

Independent lifecycle fixture includes actual Network3 writers and all demanded
normal producers. It declares only initial Safe (real RS memory/output), leaves
recognizer state unseeded, performs actual main Restart and neutral arming, and
then enforces program-input-only writes. Seven exact Network4 output/global ID
boundaries are enumerated FALSE; no native value is inferred.

Safe→Step12→RnD and MODE gap PASS. RnD green→actual LV off→given LV feedback off
→actual Step2→RnD exit→SG clear PASS. Healthy Step2→Safe is NOT VERIFIED.
Normal RnD accepted up→HV output→given HV feedback confirmation→Run PASS,
with SU held through the final RnD recognizer scan and cleared by the first
recognizer evaluation after actual RnD exit. Architect corrected the proposed
overlap oracle: normal direct Step3Set2 resets RnD on the confirmation scan;
Run RS sees it next scan. An overlap is not a required normal-path result.
The initial overlap check failed; subsequent diagnostic assertion also exposed
a tester timestamp bug (wait-for-false returned observation time after waiting
for Run, not first false sample). Final assertion uses the recorded first RnD
false sample. Latest failed diagnostic trace is retained; earlier iterations
used the same failure filename and were overwritten, not reconstructed.

The additional SPEC11 no-new-energy check FAILS on both candidate and current
production baseline with the same conditional protocol. After actual SG/LV-off/
feedback-off/Step2/RnD-exit and buttons OFF, N5 requests propagate through actual
N1 permitted Set writers. Candidate trace shows HV output TRUE at5824 and LV
TRUE at5825; baseline at5825/5826. Source differences cause a one-scan alignment
shift; both reproduce renewed LV/HV outputs without a fresh command. The check
does not treat upstream raw proposals alone as violations, does not assert a
Run/discharge endpoint, and does not imply physical/native validation. This
is an inherited conditional software counterexample requiring architect/editor
resolution; Safe improvements are not overall acceptance.

Reproduce from repository root: run prepare.mjs in this directory, then run.mjs
with the three frozen SAL/SGVL/helper hashes above; lifecycle.mjs; and
no-reenergization.mjs (expected nonzero until defect resolution). pack.mjs produces
lossless gzip for complete traces and verifies decompressed byte count/SHA256.
trace-index.json records raw/compressed hashes and sizes. Raw copies remain local;
do not add large sandbox or raw JSON to a checkpoint. Gzip evidence retains every
sample, including initial tester-oracle failure and diagnostic attempts.

Checkpoint provenance correction: baseline replay now reads the immutable pair
under fixtures/baseline, with both full hashes enforced (SAL0fc397… and
SGVL06010caf…). This pair is byte-identical to the production files used in the
recorded baseline trace. The path/pinning change does not alter inputs, source
bytes or assertions; previous traces were retained without rerunning behavior.
package-identity.json records current script/fixture/archive SHA256. Historical
trace identity remains in trace-index.json; current fixture code differs solely
in baseline location and explicit identity enforcement since those trace runs.
