# Native safe-input diagnostic repair architecture

2026-10-20. Scope: the three software diagnostics in the supplied screenshot,
preserving current behavior for intermediate review. The two target-unreachable /
ADS 7 diagnostics are environment observations; this package does not activate,
connect to, or modify a target. Functional development remains paused.

## Sources and preflight

Reference read first: `C:/Users/user/source/repos/MEN001_Dyno`, confirmed commit
`4495a1f6049f6a58ebfd436761faa84d17c8d643`; original SAL has the same
`in_Estop_PLC` Symbol GUID `6d615846-7050-4fe7-9d46-85e8b6460f93` on
AndIn1 of Network1/FBAnd1, Network2/FBAnd5, Network6/FBAnd10.
Their contact is Make Contact (NO), filter 3. None of the three added faulty
blocks is present in the reference. Reference is read-only throughout.

Before current SAL analysis, `inspectNativeSalStructure` passed with
14 networks, 254 blocks, 2172 input/output ports, 75 Symbols, 319 wires and
zero cross-network graphical wires. No native singleton-wrapper defect found.
The analyst's `ANALYSIS.md` defines the scenario-preservation acceptance scope.

Installed current-version source of the error: `SALDesignerControl.dll` v170,
1.4.16. `VerifierHSafetyPLC.VerifyFbAnd` calls
`VerifyPortHasOnlySafeIoMappings` for every AND input except ObjectIndex 8
(AndIn1). That method obtains connected native alias IOs, and its actual native
predicate rejects nonnull IOs whose `(SafetyType & 30) == 0`. It emits resource
`ProjectConfigVerification_SafeInPortIsAssignedByStandardSignal_Error`, matching
the screenshot. The evidence IL and signatures are in `architect/`.

`native-predicate.ps1` loads the actual unchanged SDS 54 through installed native
`StandardAliasDevice.Load(Version, XmlDocument)` and calls the exact native
predicate on its actual native IO object: SafetyType=Standard, rejected=True.
It also reads native enum values: filter 3 means
Legacy_ConnectableTo_SafeBoolIn_FbOut_StandardIn; filter 2 means
Legacy_ConnectableTo_SafeBoolIn_FbOut. These are port connection capabilities,
not milliseconds or timing filters. Do not modify them to silence errors.

Official primary cross-check: Beckhoff TwinSAFE Logic FB manual v4.3.0,
2025-12-03, section 4.1.1 printed pages 31-32:
https://download.beckhoff.com/download/Document/automation/twinsafe/twinsafe-logic-fb_en.pdf
AndIn1 permits Standard-In; AndIn2..8 permit TwinSAFE-In / FB-Out. Make Contact
negates the input in this native representation. Preserve actual contact strings;
do not replace them with a generic ladder interpretation.

## Exact approved implementation package

Exchange the entire logical input expression (source binding and contact) for
the following port pairs; leave the physical native ports and capability metadata
in place:

| Block | First port expression before | Other port expression before | Pair |
|---|---|---|---|
| Network1/FBAndUnlockHold | FBRs6/RsOut, Break Contact (NC) | in_Estop_PLC, Make Contact (NO) | AndIn1 ↔ AndIn5 |
| Network1/FBAndLvCurrentPermit | GVL1.b_EStop_Ok, Break Contact (NC) | in_Estop_PLC, Make Contact (NO) | AndIn1 ↔ AndIn8 |
| RndPhysicalCompact/GATE_001 | linkSafeMode, Break Contact (NC) | in_Estop_PLC, Make Contact (NO) | AndIn1 ↔ AndIn4 |

The existing EStop PLC source becomes AndIn1 NO in each case. The displaced
first expression becomes the respective other port NC. GATE_001/AndIn3 remains
GVL1.b_EStop_Ok unchanged. Do not confuse in_Estop_PLC with in_ES_NC_1/2 or
in_InterLock_NC_1/2. All other operands stay exact, including both interlocks,
connector terms, button terms, safe-state terms and internal EStop terms.

Concretely exchange the three in_Estop_PLC target usage paths with the
corresponding first-port assignments. Move the global-reference relationship
subtree of LvCurrentPermit/AndIn1 to AndIn8, preserving its IDs and wrappers.
Retarget FBRs6/RsOut's local canonical wire to UnlockHold/AndIn5; do not create
a second wiredLink. Retarget linkSafeMode's target usage to GATE_001/AndIn4.
Change only the paired ports' deactivate1 contact strings accordingly. Keep
port identities/names/objectIndex/filter, activation, all timing/reset/deviation
values, block IDs/orders, outputs and parameter values unchanged. The output of
each AND remains the conjunction of the same signed source values in the same
scan; neither block execution order nor evaluation input sampling changes.

### Mandatory SGVL consumer-index update (pre-editor correction)

Moving the LvCurrentPermit global-reference subtree also requires updating its
existing SGVL consumer index. SAL and SGVL are one binding graph: leaving SGVL
unchanged would retain a stale AndIn1 consumer and omit the new AndIn8 consumer.
This is ordinary software binding metadata, permitted by the user; no hardware
mapping or safety classification changes. Exact identity ledger:

| Identity | Value | Treatment |
|---|---|---|
| Global variable b_EStop_Ok | 98ab783a-9ee4-42cd-8375-54abc169e250 | unchanged |
| SAL AndIn1 port | e38bf21e-15b3-448f-89c8-2795d5bf62db | unchanged |
| SAL AndIn1 port wrapper | d63a34eb-b3c6-42b6-a575-96a478ab3bdc | unchanged |
| SAL AndIn8 port | 75f42369-fbd7-49b1-a11b-18df643208ea | unchanged |
| SAL AndIn8 port wrapper | 7310ab76-edc7-4297-867f-d914338af6fe | unchanged |
| SAL global-reference wrapper | 4102abc8-dbfc-492e-8be0-4b7f64ceb411 | move from AndIn1 to AndIn8 |
| SAL global-reference object | 90583355-ab8c-4f58-9ab3-80662bd91a83 | move with wrapper, retain variableId and path |
| SGVL TargetUsages/FbPortUsage | e5dd53d4-fd9b-45d1-94c6-6dccd8fd4671 | retain usage ID and container |
| Its ModelElementId | e38bf21e-15b3-448f-89c8-2795d5bf62db → 75f42369-fbd7-49b1-a11b-18df643208ea | sole SGVL semantic change |
| b_EStop_Ok SourceUsages/FbPortUsage | 1097eef6-9e64-4438-a73d-72ef7a009c8e | unchanged |
| Source ModelElementId | 57cc2ee7-3e77-4e2f-8861-ec4971c5c8a8 | unchanged |

Retain all 85 SGVL variable definitions, all usage IDs/counts, other target entries,
source definitions and alias/SDS metadata. Native SGVL writer must calculate its
new CRC, followed by fresh native reload and full SAL/SGVL binding validation.
Never edit the stored SGVL CRC directly. This correction supersedes the earlier
no-SGVL-change wording; the one consumer-index substitution is mandatory.

No added intermediary FB, source reclassification, guard removal, alias/channel
remapping, safe-type promotion or hardware/group parameter change is allowed.
This uses the native documented Standard-In-capable operand of the existing
AND, as already done by the reference. It does not claim a PLC signal is safe.

## Files and native serialization

Editor may change only active TwinSafeGroup1.sal, its .sal.diagram and the single
GVL1.sgvl consumer-index substitution specified above, necessary
candidate copies and self-check scripts/results within this repair's editor/.
No other SGVL changes and no SDS/SPLCPROJ/target/group/hardware changes. Existing full 75 Symbols,
254 FBs and 2172 ports must survive native loading and writing. Preserve all
existing wrapper and relationship identities except the explicit binding moves.
Use installed native writers to regenerate native SAL, diagram and SGVL CRCs; no
manual CRC patch. A diagram change is allowed only if required by native save
or the one retargeted local connector / Symbol labels.

## Gates for tester and reviewer

1. Freeze current baseline and hashes; reproduce all three software diagnostics
   with graph-aware native source resolution and actual Standard IO. Native
   designer-model validation alone is insufficient (previously zero errors).
2. Candidate: same native verifier check reports none of these diagnostics;
   baseline remains a failing negative control. Exercise a deliberately wrong
   nonfirst standard binding to show the check still detects it.
3. Exhaustive Boolean equivalence of each AND under all active operands and
   native contacts, before/after, plus exact signed-source expression comparison.
   This is combinational equivalence; full suite preserves temporal/state
   behavior, existing FAIL/NOT VERIFIED results remain honestly recorded.
4. Compare all unrelated operands, source graph, orders, timers, parameters,
   mappings and project files. Structural gate retains all counts and zero
   cross-network wires. Only the planned port permutation is permitted.
5. Fresh native readers accept generated actual SAL/diagram/SGVL CRC and retain full
   counts; corrupted negative copies are rejected. Check diagram connector's
   retarget and correct visible Symbol text at changed ports.
6. Run full `cd SafetyTests; npm run check:software`, compare against baseline;
   do not alter production parser/runtime or weaken test oracles for port names.
   If a test encodes physical port position, report it and justify any narrow
   adapter preserving its logical assertion before changing that test.
7. Independent review must assess exact source/contact permutation, native
   restriction acceptance evidence and test sufficiency before canonical transfer.

The isolated native predicate invocation and IL trace establish the actual rule,
but are not a full IDE Verify/Build or target-project CRC PASS. A graph-aware
native checker must clearly state its boundary versus a complete IDE run.
The two target/ADS errors remain explicitly outstanding environment observations
under the user's equipment/settings restriction; no offline software result may
be described as their repair or as five-error-free full native target validation.

## Expected-only test-fixture composition (post-candidate gate)

The frozen source candidate is correct; legacy source hashes, source inventory,
fixed input-position assertions and earlier CRC expectations describe the prior
accepted representation. Tester owns a proposal under tester/; this section
authorizes its technical design only, pending independent migration review.
No source correction, oracle relaxation, or mutation of actual parsed objects is
permitted by this adapter package.

Append `SAFE_INPUT_SLOT_REPAIR_LAYER.json` after immutable
`NETWORK_SYMBOL_REPAIR_LAYER.json`. Keep the previous layer's exact bytes and
historical CRCs. The new layer records predecessor hashes, frozen candidate
hashes/native-produced CRCs, the three exact expression exchanges, six expected
contact changes and the one SGVL ModelElementId update documented above.
Its predecessor evidence is the reviewed 49ae/b10b/2df1 native representation;
its successor evidence is the frozen editor candidate. Fill complete hashes
from the independent candidate manifest, never derive acceptance hashes from
whichever file happens to be under test.

Define the following *expected target-path permutation* with all other paths
mapping to themselves:

| Previous target | Current expected target |
|---|---|
| Network1/FBAndUnlockHold/AndIn1 | Network1/FBAndUnlockHold/AndIn5 |
| Network1/FBAndUnlockHold/AndIn5 | Network1/FBAndUnlockHold/AndIn1 |
| Network1/FBAndLvCurrentPermit/AndIn1 | Network1/FBAndLvCurrentPermit/AndIn8 |
| Network1/FBAndLvCurrentPermit/AndIn8 | Network1/FBAndLvCurrentPermit/AndIn1 |
| RndPhysicalCompact/GATE_001/AndIn1 | RndPhysicalCompact/GATE_001/AndIn4 |
| RndPhysicalCompact/GATE_001/AndIn4 | RndPhysicalCompact/GATE_001/AndIn1 |

Paths above carry the native `//` prefix. This permutation applies to expected
consumer endpoints, never producer endpoints, port identities or arbitrary
matching text. Assert predecessor existence and exactly the expected cardinality
before each replacement. Compose on detached expected values after all earlier
layers, before comparing against freshly parsed actual source.

Concrete ledger for proposal changes:

- Local-wire expectation: exactly FBRs6/RsOut → UnlockHold/AndIn1 becomes
  FBRs6/RsOut → UnlockHold/AndIn5. Keep 319 local wires and wire ID
  e95829da-c023-4ad3-972f-e815e8e42a9e. Full effective-edge expectations map
  consumers through the six-target permutation, retaining 471 edges.
- Alias expectations: in_Estop_PLC loses exactly the three former nonfirst
  consumers and gains the three first consumers; linkSafeMode loses only
  GATE_001/AndIn1 and gains only GATE_001/AndIn4. Source identities unchanged.
- SGVL expectations: b_EStop_Ok loses only LvCurrentPermit/AndIn1's GUID and
  gains only AndIn8's GUID; retain the same usage ID, all 85 declarations,
  source usage and other consumers. The SAL reference object/wrapper moves
  intact to the new input. This is a binding move, not a new global definition.
- Contacts: all three first ports NC→NO and the three displaced nonfirst
  ports NO→NC. Port IDs, filter capabilities (first 3, others 2), activation,
  ordering, timers and every other metadata field compare unchanged.
- `assertNetworkSymbolLayer` receives a detached *composed expected layer*
  whose preserved local/effective endpoints and linkSafeMode new-Symbol target
  are transformed. Do not overwrite its stored historical JSON. Keep prior
  conversion checks exact; their accepted representation is followed by this
  explicitly enumerated current permutation.
- `test/helpers/v2-structural.js`: compose expected `spec.aliases`, `spec.sgvl`,
  local-wire sets, effective-edge sets and contact expectations after the old
  layers. Whole-input equality in `final()` needs a detached expected input
  list with exactly the source-expression permutation, including the one wire,
  globals/usage resolution and contacts; do not normalize actual `now` back
  into old positions. Assert current first inputs bind in_Estop_PLC and
  displaced inputs bind each explicit old first source.
- `BOOT_PREFLIGHT_SOURCE_MANIFEST.json`: retain normalization and inventory
  schema. Build expected inventory from the accepted prior manifest plus only
  this ledger: six contacts, three PLC target replacements, linkSafeMode
  consumer move, one local-wire target, moved SAL global reference and SGVL
  consumer GUID. Then compare *entire* proposed inventory against candidate.
  Update exact raw/normalized SAL/SGVL hashes and checkpoint description only
  from frozen reviewed artifacts. Runtime hash and source unchanged. Do not
  accept arbitrary freshly regenerated source as its own oracle.
- Mentee test CRC expectation: preserve assertions that the old Network layer
  has its historical before/after CRC; separately assert that the new layer's
  predecessor equals that after-CRC and that actual current CRC equals the
  new layer's native-verified successor. Do not rewrite historical CRC fields.
- UNLOCK-07 and similar literal-port assertions: inspect actual AndIn1 as
  standard PLC NO, AndIn5 as original FBRs6/RsOut NC, and retain the original
  runtime scenario expectations. Do not delete operand checks or exclude case.

Proposal may add three portable regression tests for the native input rule,
expected-layer invariants and complete source/contact permutation as agreed
with the lead. No production parser/runtime/input-resolution change. Helpers
may create detached expected copies; they must never assign into `model`,
`now`, `old`, `model.sources`, actual port source arrays or audit data. Native
predicate proof stays independently reproducible and must fail baseline and
the forbidden-port negative control.

Migration gate: diff the complete proposed fixture/adapter allowlist; verify
old layers and all production runtime/parser files are byte-identical; verify
the new layer includes no unrelated source endpoints or contact/CRC changes.
Repeat full suite and retain prior functional failures and NOT VERIFIED cases
exactly, restoring only failures attributable to stale representation pins.
Every legacy test adapted must retain its logical-term identity assertions.
Independent reviewer must approve this expected-only composition before any
canonical test adoption; source candidate remains frozen throughout.
