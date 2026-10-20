# Working transfer — exact reviewed transfer completed

Execution update: root received final independent review READY and authorized
the definitive24 manifest (`bcaba17c…`). Exact byte transfer and full native
binding audit passed. Actual canonical check completed with all280 pinned inputs
unchanged, all24 copied hashes matching and six protected core files unchanged.
Results: harness189/189; historical75/75; current436/438 (two known Run FAIL).
Cases:200PASS/1FAIL/7NOT VERIFIED/0ERROR. Full project acceptance remains RED.
See `FINAL_WORKING_EVIDENCE.json`; no native CRC recalculation or deployment.

The following sections retain the original preparation protocol for traceability.

Authority: final immutable `test-migration-down-owner/run-001` snapshot and its
280-input manifest, followed by explicit independent review READY. The current
24-file map is provisional until the leading agent confirms the definitive
migration payload. No working file has been changed.

1. Confirm final immutable full-run result and review disposition. Known Run
   FAIL and required uncovered behavior remain visible; neither is waived here.
2. Confirm exact payload list. `PROPOSED_FILE_MAP.json` gives frozen source paths,
   current old SHA256 and proposed new SHA256. It includes canonical SAL/SGVL,
   migrated tests/helpers/observers, structural spec, BOOT capability manifest,
   and original-source historical fixtures. Reports/raw logs/sandbox trees,
   UpgradeLogs and independently updated requirement/review documents are excluded.
3. Leading agent establishes Git byte protection before transfer. Canonical
   SAL/SGVL, baseline fixtures and source-bound specs/manifests need exact bytes;
   transferred JavaScript hashes must also remain reproducible across checkout.
   Preserve the six protected runtime/parser/core files byte-for-byte.
4. Immediately before writing, recheck every current target old SHA and every
   pinned input source SHA. Canonical old pair must be SAL `0fc397…` / SGVL
   `06010c…`; new pair must be SAL `72f42d…` / SGVL `de0fa9…`. Stop on mismatch.
5. Copy only the explicitly accepted payload by exact file map, without building
   new GUIDs or serializing SAL again. Native metadata and recorded CRC are
   retained; no native CRC recalculation is claimed.
6. Rehash all transferred files, audit whole native SAL/SGVL before selection,
   then run the agreed canonical working test package and independent review.
   Refresh canonical reports through that run; never copy sandbox generated reports
   as working execution evidence. Report residual FAIL/NOT VERIFIED honestly.

The official defect regression is
`test/current-rnd-down-no-reenergy.test.js` with its
`test/helpers/rnd-down-source.js`; its four scenarios reside in the reviewed
single test file. Default source paths must resolve to the newly copied canonical
working pair, with no environment override used as acceptance evidence.
