# Independent technical review — BOOT package A

2026-10-19. **READY with the file-only contract below replacing the proposed
`wholeProgramPreflight(model)` API.** This approves a small capability-preflight
package, not group emulator B or functional BOOT acceptance. No source, tests,
runtime or hardware changes were made by reviewer. No external research needed.

## Required minimal correction to the plan

Do not accept a caller-provided parsed/filtered model, even with copied
`bindingAudit.status=PASS`. The concrete entry point must own full-file reading:
for example `preflightWorkingProgram()` with configured working SAL and SGVL
paths, followed by fresh `parseSalFile` in current-source mode/full binding
validation. A CLI such as `scripts/boot-preflight.js` calls that entry point.
Do not export a model-taking acceptance path or let a caller opt into trusted
phase cuts/current-audit bypass. Test paths, if supported, must undergo the
same identity, audit and coverage checks as the working files.

Compute SAL/SGVL raw SHA256 from the bytes actually read for evidence, not a
cross-station raw-byte trust pin: Git CRLF/LF checkout differences are valid.
Portable trust uses the reviewed native inventory plus a defined canonical
XML digest or LF-normalized accepted Git blob digest. Normalization must not
discard program attributes, namespace relationships, indices or producers.
Check full source coverage against a reviewed repository-owned
inventory/source identity, not caller-supplied expected counts or a copied
audit object. For the current package that inventory comes from the accepted
255-block accepted early-STO source (raw local evidence0fc39751…) and unchanged
SGVL (raw local evidence06010caf…). It must cover block/port
IDs, all state/global writers and outward outputs, Network3/4 presence and
the known Network4 channel relationships. Deliberately filtered models are
rejected at the API boundary; filtered/missing-source files must fail identity
or coverage before capability classification. Future reviewed source changes
can update that inventory explicitly;255 is not a universal vendor constant.

This closes the sole substantive plan-boundary issue: a generic structural
audit alone can accept a syntactically valid smaller graph and cannot prove
that the caller supplied the whole working program.

## Scope of honest results

The entry point inventories every source port and all writers without Network3/
Network4 phase cuts, seeds, runtime fallback or invented memory. Shared native
ESTOP activation is used where active-port classification is needed. Structural
validation and source coverage are distinct from capability support.

Report exact Network4/FBDecouple1 DecIn1..8 unbound identities. Distinguish the
seven used channels/output writers (including v2 DecOut7→b_Step2_Set) from
unused channel8; do not report eight used writers, silently discard the block,
or assign TRUE/FALSE to its absent sources. Reference's six used channels and
v2's seven are already documented facts, not grounds to reopen hardware work.

Independently report unsupported group lifecycle: actual RunStop/ErrAck typed
interfaces are inventoried but runtime does not implement their contract.
Do not equate Run request with qualified groupRUN, numeric status with BOOL,
main EStop Restart with ErrAck, or ErrorFALSE stub with group no-fault.
Neither unsupported reason yields functional BOOT PASS. Source/audit failures
are ERROR/coverage rejection; established unsupported semantics are explicit
NOT VERIFIED/capability results, with zero functional BOOT PASS claims.

Unit tests can PASS by proving accurate unsupported detection; keep that green
test count separate from the BOOT requirement's NOT VERIFIED status. Existing
component test evidence continues under its recorded boundaries. Package A
does not execute a full-startup trace, guess DecIn values, simulate group memory,
invalidate the original project or reopen accepted early-STO without evidence.

## Minimal tests and acceptance

- Real configured full-source entry point produces fresh matching hashes,
  full binding audit and complete port/writer inventory.
- Current source produces both precise unsupported categories, seven used
  Network4 outputs and the eighth unused channel, without functional PASS.
- A filtered model with copied auditPASS cannot be accepted; removal/masking
  of Network4, a state writer or coverage entry from file/inventory fails
  closed rather than turning the gap green.
- No caller fallback values, phase/state/output seeds or group-memory policy
  are inputs to this capability check. Current component cases remain intact.

This is sufficient for a bounded tests-first package A. Native Build/Verify,
equipment validation, group-state emulation and further downloads/SDK/reference
research are neither required nor authorized by this review. Reviewer writes STOP.
