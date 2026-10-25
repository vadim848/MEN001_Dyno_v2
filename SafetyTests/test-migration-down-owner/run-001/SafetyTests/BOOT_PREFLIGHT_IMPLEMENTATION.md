# BOOT package A — whole-source capability preflight

2026-10-19. Implements BOOT_SOFTWARE_MODEL_PLAN / BOOT_PREFLIGHT_PLAN_REVIEW after accepted early-STO checkpoint a0b0d38. Report-only diagnostic; no SAL, SGVL, timer, runtime emulator or group configuration change. Group emulator B and the unproven coincident Restart hypothesis are not implemented.

## File-only trust boundary

preflightWorkingProgram accepts no model, supplied audit, inventory, manifest, phase cut, seed, fallback or group-state option. Default reads the configured full SAL and matching SGVL. Relocated custom files require both explicit nonempty path strings/fileURLs; null/undefined/invalid values cannot silently choose canonical files. It reads bytes itself, freshly invokes parser in current-source mode against the exact requested SGVL, and detects files changing during the operation.

Parser adds only optional sgvlPath for current binding validation. Existing undefined/default behavior is unchanged; explicit null no longer silently selects the canonical SGVL. Valid relocated pair and deliberately mismatched SGVL tests exercise the actual requested file.

BOOT_PREFLIGHT_SOURCE_MANIFEST.json is a reviewed source inventory for a0b0d38. Portable trust compares full native inventory and accepted SAL/SGVL/runtime LF-normalized SHA256. Only CRLF→LF is normalized: BOM, whitespace, attributes, namespaces, declarations, relationships, usage indices and producer records are retained. Raw SHA values are evidence, not cross-station byte pins. Changed/masked/filtered source or unsupported adapter revision returns ERROR rather than capability green. The maintenance builder is separate from the preflight and hard-bound to accepted a0b0d38; preflight never regenerates trust or accepts caller expected counts.

Complete inventory:255blocks/13networks,1725inputs/455outputs,85globalwriters,37outwardoutputs,52statefulblocks. It includes every block/port/parameter ID and native attributes, global writers/readers, alias source/target uses, SGVL usage indices and group declarations/bindings, with no Network3/4 cuts. Effective EStop input classification reuses the shared SDK-faithful pair resolver. Inventory module is descriptive, not a model-taking acceptance path.

## Two distinct NOT VERIFIED results, zero functional BOOT PASS

UNSUPPORTED_UNBOUND_PROGRAM_INPUT records all8 actual Network4 DecIn IDs and their corresponding outputs. Seven output writers/readers remain explicit: Step3/4/5/6 Reset, Step1 Reset/Set, Step2 Set. Channel8 is unused, not an eighth used phase writer or reason to discard the block. Native unbound values stay UNSPECIFIED, never coerced to FALSE/TRUE.

UNSUPPORTED_GROUP_LIFECYCLE independently records real RunStop/in_Safety_Run and ErrAck/GroupPort_ErrAck typed declarations/bindings. Runtime has no group lifecycle/error/memory engine; requested Run is not actual group RUN, numeric status is not Boolean RUN, and main EStop Restart is not group ErrAck. ErrorFALSE adapter stub does not prove group no-fault. Preflight executes no startup trace and returns functionalBootPass0. Green unit tests prove accurate unsupported detection, not BOOT acceptance.

Main software-check appends exactly these2 NV capability cases and structured gaps while retaining all component scopes and prior results. It writes fresh BOOT_PREFLIGHT_RESULTS.json alongside the existing software report. Candidate acceptance was not changed or regenerated; program source and its component policy did not change.

## Verification

15 meaningful diagnostic tests cover fresh full inventory/hashes, exact8/7 Network4 readers, typed RunStop/ErrAck limitations, filtered model/copied audit rejection, portable relocated LF/CRLF pairs, exact requested SGVL audit, invalid/null custom pairs, source Network4 removal/masking, real writer drop, foreign namespace, metadata/native revision changes, trusted inventory entry removal and unsupported runtime revision. Targeted15/15PASS; initial combined diagnostic/native/early-binding group38/38PASS before the final pair-boundary strengthening. All final required suites and per-case delta are recorded below.

Independent review found the initial explicit-null SGVL fallback path. It was corrected in preflight and the direct new parser option, with paired negative controls. In-progress stale full runs were stopped; the final report comes from stable corrected code. No expectations were weakened and no source defect was declared from this diagnostic correction.

Commands: cd SafetyTests; npm run audit:boot (writes report and intentionally returns NOT VERIFIED), npm run check:software. Source/audit/coverage rejection is ERROR; established unsupported capability is NOT VERIFIED. Native Build/Verify/CRC, hardware validation, downloads and reference re-research are outside this package.

## Final stable report and writer stop

Full check: harness 193/193 PASS; historical 75/75 PASS; current 413/413 PASS. Software cases {"PASS":201,"FAIL":1,"NOT VERIFIED":7,"ERROR":0}. Previous cases changed: []; removed: []; new capability cases: [{"id":"BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT","status":"NOT VERIFIED"},{"id":"BOOT:UNSUPPORTED_GROUP_LIFECYCLE","status":"NOT VERIFIED"}]. Existing STATE:conflicting-set-requests FAIL and allfive previous NOT VERIFIED cases remain. Unit count increase178→193 is diagnostic coverage, not functionalBOOTPASS.

BOOT_PREFLIGHT_RESULTS.json is exactly the fullreport.bootPreflight object and records functionalBootPass0, bothNOT VERIFIED categories, current raw/portable digests, manifest/tool/parser SHA and allsourceinventory. Full report SHA256 ada51f2c3bd3fc2580a928dce45a3fb922e3b54806f4b5bd3fcc87d049a4cb3f; preflight report SHA256 b9824c7b2ad51e0cdcb58c45ac9cb370279a5f523dc34c19f566192acc4d1602; trusted manifest SHA256 bdab886ebb9b3282dc3d8e83ac29a90c0919137961fc9f41be0160563797b8dd.

Unchanged raw source: SAL 0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909; SGVL 06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5; runtime 14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e. No candidate artifact change.

Files in this package:
- SafetyTests/src/sal-parser.js
- SafetyTests/src/boot-source-inventory.js
- SafetyTests/src/boot-preflight.js
- SafetyTests/scripts/build-boot-manifest.js
- SafetyTests/scripts/boot-preflight.js
- SafetyTests/scripts/software-check.js
- SafetyTests/package.json
- SafetyTests/test/boot-preflight.test.js
- SafetyTests/BOOT_PREFLIGHT_SOURCE_MANIFEST.json
- SafetyTests/BOOT_PREFLIGHT_RESULTS.json
- SafetyTests/BOOT_PREFLIGHT_IMPLEMENTATION.md
- SafetyTests/SOFTWARE_CHECK_RESULTS.json
- SafetyTests/SOFTWARE_CHECK_RESULTS.md

Source/candidate diff is empty, gitdiffcheck passes. Own temporary logs removed. Editor ALL WRITES STOP pending independent review; no Safe/Run or group-emulation package started.
