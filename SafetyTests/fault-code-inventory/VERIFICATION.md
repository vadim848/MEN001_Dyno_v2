# Independent fault-code inventory verification — 2026-10-21

Scope: architecture/catalogue only. No SAL/SGVL/PLC implementation, hardware configuration, timers or mapping changes. No native CRC/IDE/Target/hardware PASS claim. No full functional regression was needed because source is unchanged.

## Evidence and actual current implementation

Read AGENTS.md, current SCENARIO_DECISIONS (including Vadim's supersession of Niv proposals), SAFETY_STATE_MACHINE_SPEC, EMERGENCY_REQUIREMENTS, reference source/documentation and current SAL/SGVL/PLC status declarations. Confirmed reference HEAD read-only `4495a1f6049f6a58ebfd436761faa84d17c8d643`.

Current SAL SHA256 `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`; SGVL `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b`.

`node SafetyTests/fault-code-inventory/VERIFY_inventory.mjs` passes full native serialization preflight and full SAL/SGVL binding before inspection:14 networks,254 blocks,2172 ports,75 Symbols,319 wires,0 cross-network graphical wires. This is software structural evidence only. Output: `VERIFY_inventory.json`.

- No `Fault`/`Error`/`Diag` named software memory or fault-code encoder is declared in current SGVL. Requested semantic errors are a proposed catalogue, not currently implemented independent detectors/latches.
- SAL has two FB `Error` outputs: `Network1/FBEstop1/Error` and `RndPhysicalCompact/WINDOW/Error`. Both have no connected target or global reference. All FB `mapDiag`/`mapState` XML attributes are false.
- SAL group ports include `ModuleFault`, `FbErr`, `ComErr`, `OutErr`, `OtherErr`, along with group lifecycle ports. These are distinct native group diagnostic categories. Their declarations do not prove an existing PLC/HMI numerical software-fault interface or encode root causes. No diagnostic configuration was changed.
- `out_DR1_ErrorACK` and `out_DR2_ErrorACK` are acknowledgement output commands, not error identities. `out_EStop_Ok_Plc` and `out_EStop_Status` are Boolean statuses, not a catalogue encoder.
- Network10 forwards raw/condition statuses including C1/C2 feedback, EStop inputs, Healthy and connector/STO status. `PLC_Dyno/DUTs/ST_TwinSAFE_IN.TcDUT` contains these statuses and steps; it has no named software fault-code field. `ST_TwinSAFE_OUT` includes ErrACK/Restart commands, which must not be conflated with software transition-fault acknowledgement or its distinct agreed button-edge semantics.
- PLC motion/axis handlers contain their own native/motion error IDs. Those are separate subsystem diagnostics and do not establish a TwinSAFE sequence fault-code catalogue.

## Encoding arithmetic — PASS

| Payload | Total enum values | Named error IDs if0=no error | Independent bitmask flags |
|---|---:|---:|---:|
|4 bits|16|15|4|
|5 bits|32|31|5|
|6 bits|64|63|6|

An N-bit **enum** carries one selected integer ID at a time, so its capacity is `2^N−1` errors when0 is reserved. An N-bit **bitmask** carries N independently simultaneous flags, not `2^N−1` independent causes. Its `2^N` combinations are subsets, not cause count. To retain simultaneous causes, use separate latches/bitmask/history or explicitly specify selection priority; merely adding enum bits does not solve arbitration/history.

No unique universal count of all possible faults can be derived from these Boolean combinations: one physical cause may create several symptoms, the same input can be a normal blocker in Safe and a fault after energization, and some proposed monitors need unapproved timeout/context criteria. Missing connectors in Safe, legitimately open cover in Safe/RnD and invalid button attempts are explicitly not faults under current decisions. Catalogue rows must preserve those distinctions.

## Catalogue review — PASS as a provisional semantic inventory

Independently reviewed `ARCHITECT.md`. Reproducible script verifies15 distinct IDs F01–F15, no duplicate IDs, and detailed-row counts `2+1+1+2+1+1+1+1+1+2+2+4+1+1+1 =22`. Adding the two SPEC-named but unbound driver/watchdog reasons gives17 grouped/24 detailed. The native5-summary optional envelopes20/27 and22/29 are also arithmetically correct, but are not accepted required/current fault counts.

Semantic boundaries are adequate for this inventory: F08 explicitly excludes SS1, F09 retains the separately required SS1-loss reason; F15 is an unclassified fallback only and must not be counted as a second independent incident alongside a known F04/F07/F08/F10/F11/F12 cause. F10/F11/F12 distinguish software command/feedback inconsistencies, not proven welded components or diagnosed physical root causes. Their ON/OFF/drive subdivisions are optional categories; no current separate latch or approved failure deadline follows from raw feedback observability. F07 correctly flags conflicting raw LVHealthy polarity usage rather than imposing one global physical meaning. Success hold timers are not proof of a failure detector.

The15/22 result is a chosen grouping, not the unique number of possible faults. Analyst's11 grouped/17 illustrative distinctions use broader startup-failure categories and a different expansion. Both counts are conditional granularities; they must not be added together or presented as competing measured implementation counts. Use architect's explicit15/22 table for the main catalogue, with driver/watchdog unbound candidates separated. Four-bit enum fits15 grouped exactly without spare; five-bit fits22 or24 with spare. No enum is currently implemented.

Code-label uniqueness does not imply root-cause mutual exclusivity: an incident can activate several correctly distinct symptoms. Diagnostic arbitration/first-cause/history still require a separate decision, even though existing protective action priority is specified. No code-selection policy was approved here.

Latest user steering to a possible single Boolean Fault and PLC-owned lamp indication does not change internal cause counts. It removes the immediate need to allocate binary codes; no encoding, lamp timing, output mapping or fault/reset implementation is authorized by this report. Green/blue software acknowledgement and group/FB reset remain distinct.

Final conclusion: structural/source checks and architecture arithmetic PASS. Runtime detector completeness, root-cause observability, fault-memory/reset implementation, PLC transport and all proposed code assignments remain NOT VERIFIED/not implemented. Source hashes remain identical to those above; no full regression or native validation has been claimed.
