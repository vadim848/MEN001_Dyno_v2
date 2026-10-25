# S1 stand report (v2-stand-engineer, 2026-10-23)

Archived: 93 tests -> test/archive/ (git mv; relative imports patched to ../../src, ../helpers). Legacy gating script -> scripts/archive/software-check-legacy.js.
Kept in test/ (53 tests, all PASS): stand-fb-semantics (FB semantics), sal-runtime + sal-semantics (runtime), stand-e2-delta-check (delta),
boot-preflight (native preflight/source inventory), stand-no-runtime-git (reproducibility: no git/sibling at runtime).
test/helpers untouched (still imported by archived tests).

New: scripts/structure-check.js (npm run check:structure), scripts/catalog-check.js (check:catalog), scripts/native-crc.ps1 (reload-only
Beckhoff SALDesigner CRC+validation, generic; STRUCT_SKIP_NATIVE=1 -> NOT VERIFIED). check:software = catalog + structure + kept self-checks.
No test/catalog yet -> "catalog: 0 tests -> FAIL".

Structure results (preflight / typed binding audit / FB<=512 / native CRC+validation):
- F1 canonical sha256 04b45456...60d28a3: PASS all; networks 14, blocks 242, ports 2076, symbols 75, wires 307, crossNetworkWires 0; native CRC valid.
- E2d candidate sha256 c2f9ccd7...3689: PASS all; networks 14, blocks 230, ports 1947, symbols 79, wires 295; native CRC valid.
Isolated copy without .git: check:software runs identically (structure PASS, self PASS 53/53).
Note: boot-preflight source manifest is pinned to F1 revision, so it is only a self-check, not used on candidates.
