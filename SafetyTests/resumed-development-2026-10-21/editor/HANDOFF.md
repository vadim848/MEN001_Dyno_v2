# Editor P0 handoff — frozen isolated 241-FB candidate

Implemented only reviewed P0/P0b–f resource identities, not optional P0g and not functional changes. Canonical source, reference, runtime, tests, requirements and hardware/group/target settings unchanged. All candidate writes stopped; native directory frozen for independent tester/reviewer.

## Exact delivered files

Directory: `SafetyTests/candidates/resumed-p0/native/`.

| File | SHA256 |
|---|---|
| TwinSafeGroup1.sal | 34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b |
| GVL1.sgvl | 517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635 |
| TwinSafeGroup1.sal.diagram | 7b5eb79439011cdf9a3206aa815dec4349a35cf8155bfac7492b7ffd75e578ce |

Inputs exactly ledger SAL59bf4ec1… / SGVLc31e1290… / diagram449ea8ca…. Read reference through `git -C <reference> -c safe.directory=<reference> show 4495a1f6049f6a58ebfd436761faa84d17c8d643:...sal`; no checkout/config mutations.

## Implementation and invariants

`build-p0.ps1` clones current complete XML with preserved relationship containers, checks all three source hashes, moves actual reference containers and exact SGVL use records, updates four alias reader monikers, retires two redundant complementary reset alias consumers, removes only 13 reviewed native FB wrappers and 21 wires, adds eight approved canonical local wires, compacts retained order by exact ledger. All unrelated collections, Symbols and nonprogram usages remain intact. The older parser serializer/builder was not used.

Only five new AND/OR slots acquire Activated/directNC: GATE025.AndIn3, GATE026.AndIn3, GATE029.OrIn4, Network7.FBAnd8.AndIn3/4. No DECOUPLE contact attributes added. New DecIn6/7 are ordinary paired channels with existing attributes unchanged; three global writers moved and five global readers replaced as ledger specifies. Original reference/relationship GUIDs reused for moved records; new wire GUIDs from reviewed ledger. Native-generated new diagram connector IDs may differ on regeneration; freeze uses actual final hashes above.

Diagram retains all 2344 remaining absolute-bound shapes, including existing port/parameter shapes. Only retired block shapes and removed wire connectors deleted; native FixUpDiagram invoked only for eight new wire presentations. No full diagram regeneration/layout.

## Reproduction and selfchecks

Run from repository root:

```
pwsh -NoProfile -File SafetyTests/resumed-development-2026-10-21/editor/build-p0.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File SafetyTests/resumed-development-2026-10-21/editor/native-p0.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File SafetyTests/resumed-development-2026-10-21/editor/native-p0.ps1 -Reload
node SafetyTests/resumed-development-2026-10-21/editor/check-p0.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File SafetyTests/resumed-development-2026-10-21/editor/native-source-rule-p0.ps1 -SalPath SafetyTests/candidates/resumed-p0/native/TwinSafeGroup1.sal -SgvlPath SafetyTests/candidates/resumed-p0/native/GVL1.sgvl -ResultPath SafetyTests/resumed-development-2026-10-21/editor/NATIVE_SOURCE_RULE.json
```

All final checks PASS:

- Full native singleton/wrapper/typed-binding preflight: 14 networks,241 FB,2066 ports,75 Symbols,206 global references,306 wires,0 cross-network.
- Exact final edge set and retained order agree with approved ledger.
- 5633 retained native ID attributes preserved except explicit order/contact delta.
- All75 complete Symbol declaration/relationship trees match baseline under only four alias substitutions/two retired reset records. All76 nonprogram usages preserved exactly, including group/device references.
- Complete85-variable SGVL agrees with original under exact program-use substitutions/deletions only (native CRC excepted). No declaration/source/hardware changes.
- All2344 retained shape bounds preserved exactly in XML and within1e-9 on native fresh reload.
- Installed native SaveModelAndDiagram + SGVL SaveToMemoryStream used. Fresh separate-process reload reports valid SAL/diagram CRC and no SGVL FileCrcMismatch; no manually calculated/edited CRC.
- Actual native unsafe-source predicate/slot subrule PASS for all six in_Estop_PLC consumers in AndIn1; native attributes preserved.

Staged edited XML naturally starts with stale stored CRC; only native output is delivered. The first invocation of the old source-rule runner stopped at its hardcoded254/2172 inventory guard. The isolated editor copy was adapted to241/2066 (both guards, preserving actual predicate/oracle) and then passed. Early selfcheck script errors were document-root/wrapper/reference-ID indexing and were corrected in the checker; no candidate rewrites were made in response. Native serialization succeeded first attempt without object loss.

## Limits and next gate

These are editor selfchecks, not independent semantic equivalence acceptance. Tester received exact frozen files/hashes. Paired consumer/RS/TON/SNAP proof and complete relevant regression remain tester/reviewer gates. Known functional Run/stop/PLC/fault/BOOT issues remain expected after this identity-only slice. No whole IDE Verify/Build, Target/ADS resolution or hardware safety claim. Do not promote candidate or weaken tests based only on this handoff.
