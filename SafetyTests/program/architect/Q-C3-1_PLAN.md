# Q-C3-1 architect plan: C3/BMS ON only on a new command

Date 2026-10-29. Process D-COMPACT. Inputs: `program/analyst/Q-C3-1_CRITERIA.md` (CR-1..8, C3-01..19), catalog section N.
Canonical: `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal` SHA256 `f81b1a5e565dc5d9c5893dff9b2f7c25f27712c45be442905e3f6835706544f4` (verified), diagram `aaf08b15...5dc9`.
Candidate: `SafetyTests/candidates/NIV-SAL/native/` (copy of canonical). Machine-readable: `Q-C3-1_PLAN.json`.
Note: Q-C3-1 is not in TRACE_MATRIX.json yet (lead to add).

## 1. Current Network6 facts (ooe = orderOfExecution, global, contiguous 1..346)

| Signal | Block (ooe) | Meaning |
|---|---|---|
| G | FBOr1.OrOut (294) | (b_Step3 AND NOT in_False) OR (b_Step_RnD AND NOT in_False), via FBAnd1 (59) / FBAnd11 (295) |
| S_C3 | FBAnd8.AndOut (92) | in_C3_Manual_Set (AndIn1) AND NOT in_False |
| R_C3 | FBAnd7.AndOut (91) | in_C3_Manual_Reset AND NOT in_False |
| S_B | FBAnd21.AndOut (325) | in_RBM_Manual_Set AND NOT in_False |
| R_B | FBAnd22.AndOut (326) | in_RBM_Manual_Reset AND NOT in_False |
| C3 Set | FBAnd4 (63) = FBOr1 AND FBAnd8 -> FBRs1.Set (64) | AndIn3..8 free |
| BMS Set | FBOr4 (298) = FBAnd6 (66: FBAnd1 AND raw in_RBM_Manual_Set; AndIn3 free) OR FBAnd14 (299: b_Step_RnD AND FBAnd21 AND NOT AndIn3; AndIn4 free) -> FBRs2.Set (67) | |
| Resets | FBOr3 -> FBRs1.Reset, FBOr2 -> FBRs2.Reset | slots: OrIn2 = b_C3_BetReset / b_RBN_Bat_Reset, OrIn4 = *_2 (Symbols) |

Existing paths already read later-ordered outputs (FBAnd4 reads FBOr1/FBAnd8 from the previous scan; manual reset reaches FBRs with 2-3 scan lag). The design must not depend on exact lag alignment.

## 2. Design: one RS "armed" latch per channel (Niv idea, modified)

ARM = RS (reset-dominant):
- Set = G AND NOT S   (command observed FALSE while gate open)
- Reset = NOT G OR autoReset OR autoReset_2 OR (S AND R)
- ARM.RsOut is an extra AND term in the existing Set path.

Why RS, not a 1-scan delay (D) edge: a D edge must align with the lagged FBAnd4/FBOr4 path and with the 2-3 scan manual-reset lag; with PLC complementary pairs (OFF->ON swaps Set/Reset in one scan) the D pulse can be eaten by the lagged reset. The RS stays armed until the latch is ON, so the positive edge fires whatever the lag. Held direction is lag-proof: if raw Set is TRUE the whole time G is open, `G AND NOT S` is never TRUE.

Deviations from Niv's literal idea (justified):
- Do NOT reset ARM with the manual reset (FBOr3/FBOr2 as a whole): PLC sends cmd OFF as Set=F/Reset=T. Reset-dominant ARM would be FALSE at the swap scan and then never arm, so C3-04/C3-12 fail. Only the automatic resets plus the term (S AND R) are used.
- Reset ARM when G is closed (NOT G): needed so that an arm left from R&D does not survive into Safe (C3-06/07, C3-10).
- (S AND R) consumes the arm when a Set arrives while manual Reset is active (C3-19, optional row). PLC swaps both in the same scan, so this term stays FALSE in normal operation (FBAnd7/FBAnd8 are consecutive, 91/92; FBAnd21/22 are 325/326).
- No reset by FBRs ON (not needed, per lead).

## 3. Blocks to add (all in Network6, appended; existing ooe unchanged)

Types already in the project: safeAnd, safeOr, safeRs. Negated input = `deactivate1="Make Contact (NO)"` (already used on OR inputs (6x) and RS ports (13x)). AND inputs use only FB-Out sources, so the native AndIn1 standard-input rule (HSafetyPLC.VerifyFbAnd) is not involved.

| ooe | name (=instanceName) | type | inputs (slot: source, contact) | output -> |
|---|---|---|---|---|
| 347 | C3_ARM_SET | safeAnd | AndIn1: FBOr1.OrOut NC; AndIn2: FBAnd8.AndOut **NO** | C3_ARM.Set |
| 348 | C3_ARM_CONS | safeAnd | AndIn1: FBAnd8.AndOut NC; AndIn2: FBAnd7.AndOut NC | C3_ARM_RST.OrIn3 |
| 349 | C3_ARM_RST | safeOr | OrIn1: FBOr1.OrOut **NO**; OrIn2: Symbol GVL1.b_C3_BetReset NC; OrIn3: C3_ARM_CONS NC; OrIn4: Symbol GVL1.b_C3_BetReset_2 NC | C3_ARM.Reset |
| 350 | C3_ARM | safeRs | Set: C3_ARM_SET NC; Reset: C3_ARM_RST NC | FBAnd4.AndIn3 |
| 351 | BMS_ARM_SET | safeAnd | AndIn1: FBOr1.OrOut NC; AndIn2: FBAnd21.AndOut **NO** | BMS_ARM.Set |
| 352 | BMS_ARM_CONS | safeAnd | AndIn1: FBAnd21.AndOut NC; AndIn2: FBAnd22.AndOut NC | BMS_ARM_RST.OrIn3 |
| 353 | BMS_ARM_RST | safeOr | OrIn1: FBOr1.OrOut **NO**; OrIn2: Symbol GVL1.b_RBN_Bat_Reset NC; OrIn3: BMS_ARM_CONS NC; OrIn4: Symbol GVL1.b_RBN_Bat_Reset_2 NC | BMS_ARM.Reset |
| 354 | BMS_ARM | safeRs | Set: BMS_ARM_SET NC; Reset: BMS_ARM_RST NC | FBAnd6.AndIn3, FBAnd14.AndIn4 |

The Symbol slots copy FBOr3/FBOr2 (OrIn2, OrIn4). Port metadata (portNum/objectIndex/varId/filter) is the native default of each slot, copied from the same block type (e.g. FBOr3, FBRs1). Do not invent new values.

Ordering: append after 346 so all 346 existing ooe stay the same. ARM_SET/CONS read producers that are already updated in the scan (91, 92, 294, 325, 326 < 347). The latch is order-tolerant: FBAnd4 (63) / FBAnd6 (66) / FBAnd14 (299) read the previous-scan ARM. Fires on the new edge: ARM is TRUE from earlier scans and stays TRUE through the edge. Held command never fires: ARM is never set.

## 4. Existing-block changes (activation only; no contact/ooe/wire removal)

- FBAnd4.AndIn3: Deactivated -> Activated, Break Contact (NC), source C3_ARM.RsOut.
- FBAnd6.AndIn3: Deactivated -> Activated, NC, source BMS_ARM.RsOut.
- FBAnd14.AndIn4: Deactivated -> Activated, NC, source BMS_ARM.RsOut.
- FBOr1.OrOut, FBAnd8.AndOut, FBAnd7.AndOut, FBAnd21.AndOut, FBAnd22.AndOut: new wiredLink targets added (fan-out only).

## 5. Wires and Symbols

wiredLinks (intra-Network6, one per port pair, stored on the source outPort like the existing ones): 19 in total.
- C3 (9): FBOr1->C3_ARM_SET.AndIn1, FBAnd8->C3_ARM_SET.AndIn2, FBAnd8->C3_ARM_CONS.AndIn1, FBAnd7->C3_ARM_CONS.AndIn2, FBOr1->C3_ARM_RST.OrIn1, C3_ARM_CONS->C3_ARM_RST.OrIn3, C3_ARM_SET->C3_ARM.Set, C3_ARM_RST->C3_ARM.Reset, C3_ARM.RsOut->FBAnd4.AndIn3.
- BMS (10): the same pattern with FBAnd21/FBAnd22, plus BMS_ARM.RsOut->FBAnd6.AndIn3 and ->FBAnd14.AndIn4.
- No cross-network wiredLink. Cross-network inputs only via existing Symbols.

Symbols: no new SGVL variables and no new GVL/PLC entries. 4 new consumer references to existing variables:
- b_C3_BetReset (variableId d9e0fc7a-6da0-4421-8c02-f441b4362549) -> C3_ARM_RST.OrIn2
- b_C3_BetReset_2 (97b9d7ee-f6f0-4b79-9499-47abe82e23e3) -> C3_ARM_RST.OrIn4
- b_RBN_Bat_Reset (e0f34103-fb8a-48f8-ba48-3e8b312d0370) -> BMS_ARM_RST.OrIn2
- b_RBN_Bat_Reset_2 (8f098b42-8a6c-4651-8bcb-c852274ce765) -> BMS_ARM_RST.OrIn4

Each needs a SAL `fbPortGlobalVariableReference` (inside a singleton `functionBlockPortHasFbPortGlobalVariableReferences` wrapper) and a new `<FbPortUsage>` in the GVL1.sgvl `<TargetUsages>` of that variable (ModelElementId = new port Id). Existing SourceUsages and declarations are not changed. Diagram: add 8 shapes and 19 connectors in Network6 only.

## 6. Budget

| | before | after | limit |
|---|---|---|---|
| FB (orderOfExecution count) | 346 | 354 | 512 (lead); the old 255 note in the role prompt is already exceeded by canonical, so 512 is the limit in force |
| Network6 FB | 59 | 67 | - |
| new active in-ports | - | +20 new + 3 activated | - |
| new out-ports | - | +8 | - |
| wiredLinks | - | +19 | - |
| SGVL variables | unchanged | unchanged | - |
| SGVL TargetUsages | - | +4 | - |
| alias/hardware mappings, timers, group/target, tsproj/xti, PLC | unchanged | unchanged | - |

## 7. Row coverage (C = C3; BMS is symmetric)

- C3-01, C3-15 (Emergency): FBRs reset by b_*_BetReset is unchanged. ARM is reset by NOT G and autoReset. Edges during the chain cannot set ARM: autoReset dominates and G is closed.
- C3-02, C3-17 (held through Emergency/start): G is closed until R&D, ARM stays 0; at R&D, Set is held, so `G AND NOT S` = 0 and ARM stays 0, so the output is OFF for good. Release (ARM=1) then press fires (C3-04).
- C3-03, C3-14 (R&D->Safe): b_*_2 resets FBRs (unchanged) and ARM (dominant). After that G closes, so ARM=0. Held at R&D gives OFF.
- C3-04, C3-07, C3-18, C3-11: Set is FALSE while G is open, so ARM=1. The edge makes FBAnd4 (G,S,ARM) TRUE and the output is ON within a few scans (same reset lag as today), well under 50 ms.
- C3-05 (R&D<->Run): ARM only acts in the Set path. FBRs latch and reset are untouched, so there is no drop. A one-scan G dip would only reset ARM, which does not matter while the output is ON.
- C3-06, C3-10 (cmd in Safe / Safe->R&D): G is closed, so FBAnd4 is blocked and ARM=0. At R&D, Set is held, so it stays OFF.
- C3-08 (Run edge), C3-09 (held through StartingRun/Run): G is continuous, and ARM follows Set as in C3-04/C3-02.
- C3-12, C3-13 (independence): separate latches, each from its own Set/Reset. The shared G is unchanged.
- C3-16 (cmd OFF): reset path is unchanged.
- C3-19: Set and Reset both TRUE gives CONS=1, so ARM=0. When Reset falls with Set held: no fire.

## 8. Invariants and evidence

- All 346 existing FB, ooe, contacts, wires and Symbols are byte-identical except the 3 activated AND slots and the added fan-out wires. Evidence: native-structure preflight plus structural diff (`src/native-delta-diff.mjs`) against canonical f81b1a5e.
- FBRs1/FBRs2 stay reset-dominant, and reset sources are unchanged. Evidence: diff plus rows C3-01/03/16.
- Singleton sourceUsages/targetUsages, relationship wrappers, canonical wire edges, no cross-network wiredLink: native-structure preflight PASS.
- CRC only from native tooling or IDE Verify (Vadim). No manual CRC. Software PASS does not mean native/IDE PASS.

## 9. Editor boundaries

Write only: `SafetyTests/candidates/NIV-SAL/native/**` (copy of TwinSafeGroup1.sal, .sal.diagram, GVL1.sgvl). No edits to canonical `MEN001_Dyno/**`, PLC (MAIN.TcPOU), alias devices, tsproj/xti/TargetSystemConfig, timers. Transfer to canonical only after gates (lead).

## 10. G3 mutations (for tester)

| ID | Mutation | Expected killer |
|---|---|---|
| MQ1 | FBAnd4.AndIn3 deactivated (C3 ARM bypass, level Set) | C3-02, C3-17, C3-07 |
| MQ2 | FBAnd14.AndIn4 deactivated (BMS R&D path bypass) | C3-02 (BMS) |
| MQ3 | FBAnd6.AndIn3 deactivated (BMS Step3 path bypass) | C3-09 (BMS, held into Run) |
| MQ4 | C3_ARM_SET.AndIn2 NO->NC (arm on Set TRUE) | C3-04 (no ON), C3-02 |
| MQ5 | C3_ARM_RST.OrIn1 removed (no NOT G reset) | C3-06/07, C3-10; may be equivalent if autoResets always cover G exits. Tester to report |
| MQ6 | C3_ARM_RST.OrIn3 removed (no CONS) | C3-19 |
| MQ7 | C3_ARM_RST.OrIn4 removed (no b_C3_BetReset_2) | C3-14; may be equivalent depending on b_*_2 vs G fall timing |
| MQ8 | ARM reset uses FBOr3.OrOut (Niv literal, manual reset included) | C3-04, C3-12 |
| MQ9 | C3_ARM moved before C3_ARM_SET in order (ooe swap 347/350) | expected equivalent (latch order-tolerant), so documented as an equivalent mutant |
| MQ10 | BMS_ARM.RsOut wired to C3 FBAnd4 instead (cross-channel) | C3-12, C3-13 |
| MQ11-13 | MQ4/MQ6/MQ7 on the BMS chain | same rows (BMS) |

## 11. Risks / open

- R1: The native verifier may reject a negated OR slot (OrIn1 NO) or an RS Set/Reset from FB-Out. Precedent exists (6 OR NO, 13 RS NO in canonical). If it rejects, move NOT G to an AND-free form only after an architect re-plan.
- R2: R&D status edge vs FBOr1 lag (<=1 scan). C3-10b/C3-11 have a +/-50 ms margin. Not a behaviour question.
- R3: Equivalent mutants MQ5/MQ7/MQ9 must be reported as equivalent, not hidden.
- No analyst questions. No E2/E4 impact (PLC unchanged).
