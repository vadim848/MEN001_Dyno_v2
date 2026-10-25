# Intermediate review: native standard-input slot repair

2026-10-20. Scope: the five diagnostics in USER_VALIDATION_ERRORS.png. No new
functional development. Workflow: requirements analyst, architect, red tests and
checkpoint `5b3828f`, editor, independent tester and independent reviewer.

The three software safe-input diagnostics are addressed by moving the existing
`in_Estop_PLC` term to the native eligible AndIn1 slot of FBAndUnlockHold,
FBAndLvCurrentPermit and GATE_001. Each displaced source moves to the former PLC
slot together with its contact polarity. All required terms remain. This uses
the existing AND behavior, without an added block or changed filter metadata.
One existing local wire and one SGVL target usage are retargeted, preserving IDs.

The two Target System/ADS7 diagnostics remain OPEN environment observations.
No target connection, activation, reload, download or configuration change was
performed. Native stored-file CRC and the bounded native safe-source rule check
do not establish full IDE Verify/Build, whole-project CRC or hardware validation.
The screenshot is evidence, not authorization to enable equipment.

## Reviewed bytes

Paths are under MEN001_Dyno/Safety_Dyno, unless stated otherwise.

| File | SHA256 | Native stored CRC |
|---|---|---|
| TwinSafeGroup1/TwinSafeGroup1.sal | 59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33 | 3035115343 |
| GVLs/GVL1.sgvl | c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b | 2062851118 |
| TwinSafeGroup1/TwinSafeGroup1.sal.diagram | 449ea8ca664ff18078154cc91ccc40f575e20e3be5a4cfecf68cd3265d8c8bfc | 3542629618 |

Native writers produced the CRC values; separate fresh readers accept all three.
Deliberately corrupted copies of each file are rejected. All 75 SAL Symbols,
85 SGVL definitions, 14 networks, 254 blocks, 2172 program ports, 2194 diagram
port shapes and 319 local wires remain. The extra diagram shapes include native
presentation ports. All 2463 shape bounds are identical. Exactly one connector
changes target; its final four route-point Y values follow the new port anchor.
Other route differences are only native floating-point formatting.

## Evidence and limits

- `tester/REPORT.md`, final comparison and proposal manifest record independent
  tests and the exact inputs. `reviewer/FINAL_REVIEW.md` records independent review.
- `tester/CANDIDATE_EXACT_DIFF.json` proves whole SAL/SGVL preservation except the
  three signed term permutations, one SGVL usage destination and native CRCs.
  Hardware mappings, group settings, timers, block order and source types remain.
- Exhaustive local truth tables cover 416 rows; unchanged actual runtime executes
  60 before/after transition samples. Fourteen unauthorized mutants are rejected.
- Installed native StandardAliasDevice reads the unchanged SDS as Standard. The
  actual installed unsafe-source predicate plus native AND slot-index rule goes
  from exactly three violations to zero. This is a bounded source-rule test;
  it does not invoke the full project compiler or resolve target availability.
- Native model validation retains 0 errors and 81 warnings, with False return.
  Those existing warnings are not suppressed or described as an unconditional PASS.
- Full candidate regression: harness 189/189, historical 75/75, current 443/445.
  Two existing Run gesture failures remain. SAL cases: 200 PASS, 1 FAIL,
  7 NOT VERIFIED, 0 ERROR. Exit 1 is retained. Three new portable slot regressions
  pass; expected-only fixture migration preserves prior assertions and immutable
  historical layers. Parser/runtime and functional requirements are unchanged.
- The unmodified-fixture candidate run failed on stale source fingerprints and
  slot pins; its failure evidence is retained separately. Fixture changes compose
  the exact approved permutation over the committed baseline, never actual-model
  mutation or relaxed functional expectations.

Reproduction: `cd SafetyTests; npm run check:software` (known exit 1). Native
reproduction requires installed Beckhoff 1.4.16 and Framework 4 STA; see the
tester report and editor/HANDOFF.md. Equipment and push remain unauthorized.
Functional development remains stopped after this intermediate repair.

Canonical promotion is complete: TRANSFER.json records
PASS_EXACT_TRANSFER_AND_CANONICAL_PRESERVATION. All 12 destination hashes match
the independent reviewed manifest. All 26 core files remain byte-identical;
only the three approved native project files changed. The canonical full run
has the same stage counts, two known failures and all 208 scenario payloads,
including 203 observation arrays, as the independently tested candidate.
Canonical report SHA256:
edcae40251523bbeaf4f5bf152ecf06d1d8a5833b8722d9e06a26ddddd00b1d1.
Independent post-transfer checks are in tester/CANONICAL_ADOPTION.json.
Its status is PASS_INDEPENDENT_CANONICAL_ADOPTION: fresh native CRC/source-rule,
labels, shape geometry and SGVL checks pass on the actual canonical paths;
127 project-file inventory changes only the three approved native files.
The lead independently matched all 12 reviewed destination hashes and confirmed
no SafetyTests/src changes. All actors stopped writing before final local commit.
Generated sandbox copies and duplicate multi-megabyte native logs are excluded;
the complete JSON evidence, frozen candidate, proposals, scripts and failure
history are retained. No push was performed.
