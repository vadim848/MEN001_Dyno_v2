# Independent A1/A2 results — READY for result review

2026-10-20. **40 PASS / 0 FAIL / 0 fixture errors** on fresh working SAL
72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e and SGVL
de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56.
No SAL, canonical tests, runtime or prior accepted package was changed.

The reviewer plan gate NEXT_EMERGENCY_PLAN_REVIEW.md preceded this execution.

| Matrix | Healthy controls | Fault/restore cases | Result |
|---|---:|---:|---|
| A1 Safe/RnD final access |2|8|PASS|
| A2 Safe-Step12 LV, RnD HV/STO1/STO2, original Step2 LV/HV |6|24|PASS|

A1 establishes actual fresh blue qualification, grant and sole final Unlock
before NC2 or Mentee loss. Blue remains TRUE and green FALSE throughout fault
and restoration. Each input is tested for one observed scan and ten held scans.
Final Unlock and actual main EStop are FALSE on first fault, first restoration
and200ms restored observation without Restart. The two no-fault controls retain
final access. This extends actual consumers beyond R3 main-channel truth tables.

A2 prepares the actual aggregate TRUE while the relevant output is still FALSE,
without seeding request/owner/output latches. Paired controls consume the real
native RS Set and produce the expected output. Each route/domain independently
tests NC2 and Mentee for one/ten scans. All four current Set gates and actual
native RS Set inputs remain FALSE during fault/clean restoration; no previously
OFF energy/torque output rises. Already latched contactors are not required to
drop instantly. Actual Reset inputs and outputs remain observed.

For A2, both buttons release on the first fault sample. Thus green FALSE is
observed while the fault is active even for a one-sample pulse; restoration is
only the fault input and cannot accidentally arm manual Restart. A1 never uses
this release, since it would mask the held-blue final access test.

All traces include the first setup sample0, actual manual main Restart, declared
initial Safe/originalStep2 component state, real Network3 writers and seven exact
inactive Network4 output/global-ID boundaries. RnD/Step12 paths use actual Safe
predecessor/feedback chronology; Step2 is explicitly original-start component
coverage. No phase/owner writes are accepted after protocol start. Every demanded
input resolves; outside-cone DECOUPLE channels and runtime unconnected reads are
inventoried separately, not called native-FALSE or dead. Source paths/hashes,
native selected-block IDs, critical Set/Reset/Restart port IDs, canonical-wire
count/hash and runtime/parser/pair-resolver/clock identities are recorded.

Run metadata uses short EMG001/CVR001 aliases; VERIFIED_REPORT maps them to exact
registry IDs EMG-001/-005/-007/-011 and CVR-001/-002 without changing archived
samples. Passing this matrix supplies bounded evidence, not full closure of each
requirement or all41 IDs. A3 external interlocks, fullBOOT/group semantics,
emergency destinations/completion and hardware/native validation are not claimed.
New user decisions about LV completion/Run BOTH/StartingRun green do not alter
this narrow fault matrix and are outside its commands.

Reproduce from repository root: node SafetyTests/next-emergency-tests/run.mjs,
then node SafetyTests/next-emergency-tests/verify.mjs. The latter verifies each
gzip against raw/compressed hashes, native IDs, case counts, exact fault duration,
paired positive references and observer chronology, then writes VERIFIED_REPORT
and PACKAGE_IDENTITY. Full samples stay in per-case lossless gzip. The initial
40PASS metadata-light run and its exact code snapshots remain in diagnostic-001;
the final run adds provenance/ledger details with the same behavioral assertions.
