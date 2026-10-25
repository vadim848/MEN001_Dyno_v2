# Independent review — BOOT capability preflight A

2026-10-19. **FINAL ACCEPT — report-only capability package A.**
No implementation/test/runtime edits by reviewer. Compare a0b0d38.

## R1: null custom SGVL silently falls back

Current API checks custom path key presence, then uses nullish fallback. Thus
`preflightWorkingProgram({salPath: workingSalPath, sgvlPath:null})` returns
NOT VERIFIED using the default working SGVL rather than rejecting the missing
explicit pair value. Reviewer reproduced this exact result. Undefined has
the same issue. Reject invalid/null/undefined custom values before defaults;
add explicit paired negatives. Default options{} should remain unchanged.
This is the promised no-hidden-SGVL-fallback boundary, not a new scope.

R1 correction reviewed: own custom pairs now require nonempty string paths or
file URLs before any file reads, with explicit custom/default branches rather
than nullish fallback. Added paired invalid-value negatives cover both sides.
Independent corrected unit run **15/15 PASS**, zero skips. R1 is closed.
The analogous direct parser option also now falls back only for omitted/
undefined optional SGVL; explicit null rejects. Reviewer read that final diff
and repeated15/15 PASS with the added parser-null assertion.

## Completed checks

Independent unit run14/14 PASS before R1 correction. Entry point owns file
reads, fresh current-mode parse/full SAL+explicit SGVL audit, computes raw
evidence hashes and portable LF-normalized identity. Caller model/audit/seeds/
fallback/trust overrides reject. Runtime is not executed by the preflight.
The repository manifest binds accepted checkpointa0b0d38 and full inventory;
raw line endings do not act as a cross-station trust pin. Unsupported source
or adapter revisions reject rather than silently fabricate capability.
Reviewer independently compared manifest normalized SAL/SGVL/runtime digests
to local accepted a0b0d38 Git blobs:3/3 match. No reference checkout or external
research was used.

Reviewer independently enumerated native XML ports against reported inventory:
1725 inputs,455 outputs and23 parameters, **zero missing native IDs**. Inventory
has255 blocks/13 networks,85 global writers,37 outward outputs and52 stateful
blocks. Network3/4 and all writers remain included, with real alias/global/
canonical source relationships. Descriptive inventory cannot itself accept
a supplied filtered model; the acceptance entry remains file-only.

Exact Network4 result inventories8 unbound inputs,7 used phase writers/readers
and unused channel8 with UNSPECIFIED values. Group RunStop/ErrAck declarations
and bindings are reported separately, without Boolean group status, invented
group memory or native Error inference. These yield2 NOT VERIFIED cases and
functionalBootPass0. Green capability unit tests are not functional BOOT PASS.
Parser's optional SGVL argument preserves existing defaults outside this API;
the preflight must always pass its explicit audited pair after R1 validation.

Software-check integration appends those capability cases and preserves
existing component cases; full-source inventory is distinct from their phase
cuts. No SAL/SGVL/runtime or group emulator change is present.

Editor final ALL WRITES STOP confirmed. Manifest builder is separate explicit
maintenance, not called by the checker; it checks local files against accepted
a0b0d38 normalized Git blobs before producing trusted inventory. No automatic
manifest regeneration or caller trust override can bless filtered source.

Final preflight report SHA256
`b9824c7b2ad51e0cdcb58c45ac9cb370279a5f523dc34c19f566192acc4d1602`;
manifest `bdab886ebb9b3282dc3d8e83ac29a90c0919137961fc9f41be0160563797b8dd`.
Reviewer verified report/module hashes, raw SAL/SGVL/runtime evidence against
disk, and exact equality of standalone preflight with full.bootPreflight.
Unchanged source/runtime raw identities are0fc39751…/06010caf…/14d50f18….

Reported full stages193 harness /75 historical /413 current all PASS. Reviewer
independently reproduced15 preflight unit tests, including portability and
source-rejection mutations. Functional software count is201 PASS /1 FAIL /
7 NOT VERIFIED /0 ERROR. Independent per-case comparison to a0b0d38 finds no
changed or removed old cases and exactly the two named BOOT capability NV
additions. Unit193 is not functional BOOT PASS: functionalBootPass remains0.

No remaining substantive finding. Acceptance is accurate capability reporting,
not resolution of Network4/group semantics or full BOOT acceptance. Existing
component evidence and known FAIL/NV remain. No further external/SDK research,
native execution, hardware validation or state-machine emulation was performed.
Reviewer writes STOP.
