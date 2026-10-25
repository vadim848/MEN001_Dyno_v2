# Independent implementation review — early STO

2026-10-19. **FINAL ACCEPT — scoped physical early-STO software package.**
Compare accepted red checkpoint2ddafef. Reviewer changed no implementation/tests.

Independent source checks confirm253 old block IDs survive with the approved
order mapping, zero mismatches, and255 unique positions. New safeAnd guards
are10/12 immediately before old STO RS11/13. Every original block and native
port attribute is preserved apart from order and the two approved OR8/10.In3
activations/direct contacts. All original timer parameter identities/values
survive; SGVL and runtime are unchanged.

Whole source audit PASS. Canonical edge diff removes exactly old OR8→RS3.Set
and OR10→RS4.Set, adds exactly ten reviewed edges: two accepted SU→OR.In3,
two OR→guard, two CurrentPermit→guard, two previous PLCproducer→guard, two
guard→RS. Each gate has aggregate/current permit/!Mentee/previousPLC with
proper typed native indices. Two normal alias consumer usages add Mentee
fanout through full wrappers; no hardware descriptor/global configuration
change. No alternate old Set path bypasses these guards. Existing Reset and
Run confirmation/discharge/ResetPB completion paths remain.

The source-bound generator uses deterministic unique IDs; the manifest binds
baseline/result/SGVL and all new GUIDs. Read independent preservation tests:
all old native attributes, complete canonical edge union, old relative order,
parameters, unchanged SGVL and exact new contacts/manifest are asserted.
Independently executed native preservation4/4 PASS.

Independently executed accepted unchanged early-STO suite88/88 PASS, zero
skips, against current source. This closes56 actual red cases while retaining
the32 positives. Actual recognizer SU is observed, not seeded. Full physical
N/N+1/N+2 and later feedback/confirmation are uncut. Only legacy completion
Setguard component pairs suppress the two parallel early consumers through
the reviewed exact fixture read boundary; their source/closure remain whole.
Ordinary routes and real Reset/status waveforms/collisions are uncut.

Initial semantic implementation SHA256 independently confirmed:
`aea1c70b7a90bec9cfec9600bafd2d2ca87028179daeefa6a6a3317852ea5e59`.
Final whitespace cleanup source SHA256:
`0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909`.
Reviewer repeated native preservation4 plus assumption/mutation3 on that final
source:7/7 PASS. SALINPUT02 still removes OR8 and demands its exact missing
producer error, now at the actual new guard input rather than old direct RS
input. This is a corrected structural target, not weakened detection.
Metadata-only updates to old count/order/fanout assertions follow the approved
insertion; no qualitative timing/fault oracle change is justified. No source,
runtime, SGVL, accepted88 test or red baseline change beyond this package is
claimed. Editor ALL WRITES STOP confirmed; final implementation report read.

Current evidence `EARLY_STO_CURRENT_RESULTS.json` SHA256
`454366a5224152834773776b2f5adace9c280bde4d1516ac98302132eda155e6`
has matching final source/model/test/manifest and current software/standalone
artifact hashes; reviewer checked every recorded hash with zero mismatches.
Final source is0fc39751… as recorded above; SGVL remains06010caf….
Fresh final-source88 traces all pass, exact56 red→green. Reviewer separately
compared all eight Step4/Step1/Reset-Set-collision full frameSpan waveforms to
accepted red: byte-identical, including actual status copies and Reset timing.
Default69 current physical scenarios retain the accepted R3 cases hash
`0a48467429553fd86a579afa575955bbec790d83e91924fc71e2e11f96a12a53`.

Reported full stages178 harness /75 historical /413 current all pass;
functional201 PASS /1 FAIL /5 NV /0 ERROR, standalone47/0/5. Independent
comparison of each functional case ID/status against2ddafef gives zero changes.
Full pipeline is editor evidence; independent actual88, preservation4 and
final mutation/preservation7 executions are identified above.

This accepts torque permission on the observed physical request at N+2 without
waiting C2/Healthy while preserving tested completion and old Reset paths.
It does not certify full BOOT, complete state reachability, PLC-only launch
policy, EDM/group lifecycle, native Error or physical zero-time response.
Existing internal Network3 conflicting-set FAIL and five NV remain visible;
the complete41-requirement project is not declared accepted. No native
Build/Verify/CRC, hardware validation, deployment or push was performed.

No open substantive finding in this package. Reviewer writes STOP.
