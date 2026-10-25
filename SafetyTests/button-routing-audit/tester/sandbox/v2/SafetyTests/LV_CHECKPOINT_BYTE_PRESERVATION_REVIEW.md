# Independent review: checkpoint byte preservation

2026-10-20. **READY for exact-path `-text` attributes on the seven protected modules and staging their existing tested bytes.** This is a Git serialization/checkpoint approval only; it permits no implementation rewrite, normalization, oracle change or hash refresh.

Read CORE_CHECKOUT_PROJECTION.json and independently inspected working bytes, HEAD blobs, current Git clean-filter projection and actual attributes. All seven working SHA256 match the independently accepted FINAL_WORKING_EVIDENCE protected-core values. For all seven, `git hash-object --path=<path> <path>` equals the corresponding HEAD blob ID under current attributes. Independently compared LF-normalized working and HEAD content: identical for every module. `git diff --ignore-space-at-eol HEAD` for the three mixed-ending files is empty.

The raw working files differ from HEAD only for sal-runtime.js, sal-parser.js and estop-native-pairs.js; observed-samples.js, sal-binding-validator.js, boot-preflight.js and boot-source-inventory.js already equal HEAD byte-for-byte. Current effective attributes are text:auto/eol:unspecified for all seven. Thus the three prospective blob changes preserve already tested mixed CRLF/LF bytes, with no source statement/content change. Uniform CRLF checkout does not reproduce their pinned tested SHA, so that earlier projection is correctly rejected.

Approved exact paths:

- SafetyTests/src/sal-runtime.js — `14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e`
- SafetyTests/src/sal-parser.js — `fbf239e4960243e383619834a658bee23df543fdba9fc9f0e5bfd9e0e0aa195c`
- SafetyTests/src/estop-native-pairs.js — `18bcb570739e5a20abd45fc831deae612e52d74d2590191fe4eeda3eed5d6ec8`
- SafetyTests/src/observed-samples.js — `b6c731053ab99f89cc92d8fac43c0884aff246ef18cf81690cf3645129444053`
- SafetyTests/src/sal-binding-validator.js — `65b133d787077c857bceb1dfcb2ba6574745395c7830e50625807bff5fa62bb8`
- SafetyTests/src/boot-preflight.js — `937fce5d697b23791d515a86b7a494dfa48f4ff6a1d14d471115fec5d052e2d9`
- SafetyTests/src/boot-source-inventory.js — `9d2b42044907a077b4990f63eb335037b575f6b0b51ae4938a6b2c746a303ba6`

Use seven explicit `-text` entries rather than a broad rule or forced eol. Stage actual existing bytes; do not run checkout, renormalize, text rewrite or filter conversion on these files. Before committing, independently extract each index blob as bytes and verify the SHA256 above plus current working SHA, then check effective attributes and empty ignore-space-at-eol content diff. Four already-exact modules need no changed blob. Checkpoint description must disclose the three newline-only blob preservations so a reviewer does not mistake them for an LV runtime modification. Any non-newline difference requires a new implementation review.

No new behavioral run is required for unchanged working bytes. Previous canonical results and protected-core identities remain valid. Only this report was written; no attributes, index, source file, test or commit was modified by this reviewer.

## Explicit index refresh clarification

Root's index-byte verification correctly caught three old normalized blobs retained after ordinary staging. **The exact-path `git add --renormalize -- SafetyTests/src/sal-runtime.js SafetyTests/src/sal-parser.js SafetyTests/src/estop-native-pairs.js` is approved only while all three effective attributes are `-text`.** In that condition it forces re-clean/staging of the existing raw working bytes without line-ending conversion or working-file writes. The earlier “do not ... renormalize” restriction prohibits content conversion/global normalization; this explicit index-cache refresh is an exception solely to preserve the already approved bytes.

Reconfirm the three working SHA values and effective `-text` immediately before staging. Afterwards all seven index blob SHA256 values must equal the accepted working SHA list, working files must remain unchanged, and the ignore-space-at-eol content diff against HEAD must still be empty. No commit until all seven pass. Do not broaden the path list, enable a clean filter, or use renormalization with text conversion active. No additional behavioral run is needed for this index-only refresh.
