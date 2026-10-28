# EMG-OFF plan (architect, 2026-10-27)
Base: canonical `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal` SHA256 9e5bfb15fc39fdacdbc0f926123f333d665ec5ceb5d7da78605f81980b67762d (E6w).
Req: SCENARIO_DECISIONS `## EMG-OFF`, EMG-OFF-Q1 = A; catalog E-11 (tests E-11a/b/c in test/catalog/lib/e.js).

## Root cause
Step4 (emergency chain entry, `b_Step4_Set`) = Network6/FBOrStep4 = FBAnd2 OR FBAndLvEmg.
- FBAndLvEmg = (Step12 | Step_RnD | linkCfgActive) AND NOT b_EStop_Ok -> any Emergency incl. WD_EMG. Covers R&D->Safe and Config exit.
- FBAnd2 (Step3 branch) = Step3 AND NOT Network6/FBAnd9; FBAnd9 = out_EStop_Status(raw ES_NC_1/2, Estop_PLC, Mentee) AND LV/HV
  connector interlocks AND HEALTH_GUARD. It does NOT see b_EStop_Ok / linkWdEmg.
- WD_EMG (RndPhysicalCompact, OFF/LOSS terms) -> linkWdEmg -> Network1/FBAnd1 !AndIn5 -> FBEstop1 -> b_EStop_Ok=FALSE (Emergency status)
  but in Step3 no Step4_Set. Stage leaves Step3 only via Network6/FBAnd18 (b_Step12_Set_2, needs !in_HV_C2_FBK) -> Step_RnD -> FBAndLvEmg.
  Hence "chain starts only after C2_FBK OFF". EStop works because out_EStop_Status drops FBAnd9.
- Stand on canonical: E-11a FAIL (LV discharge none, C1 OFF none); E-11b PASS; E-11c PASS.
- Same root cause, NOT in EMG-OFF-Q1: WDC1_LOSS/WDC2_LOSS in steady Run -> Emergency at +2 ms but Step3 kept, C1/C2 ON, STO released
  indefinitely (trace: Run, hold in_HV_C2_FBK=false or in_LV_C1_FBK=false). See question Q-EMGOFF-A1.

## Change (candidate copy only; no new FB, no new wire, no timer change)
Variant B (recommended, pending Q-EMGOFF-A1): reuse existing Symbol `linkWdEmg`.
1. Network6/FBAnd9 (Id 235d440c-…, o95) port AndIn2 (Id d0cb4c5a-915d-4ac0-abab-36405be0a6c8): channelInterface Deactivated ->
   `Activated` + `deactivate1="Make Contact (NO)"` (negated, same as Network1/FBAnd1/AndIn5). Other attrs unchanged.
2. SAL variable `linkWdEmg` (Id 7c893ade-…): add ONE `variableUsagesHasUsages/fbPortUsage/fbPortUsageReferencesFunctionBlockPort`
   with `<inPortMoniker name="//Network6/FBAnd9/AndIn2" />` inside the existing single targetUsages/variableHasTargetUsages/
   variableUsages/usages (fresh GUIDs; keep singleton wrappers). sourceUsages unchanged (WD_EMG/OrOut).
3. Diagram: no change (inPortShape for //Network6/FBAnd9/AndIn2 already exists). SGVL: no change (linkWdEmg is SAL-only).
Effect: Step3 AND WD_EMG -> FBAnd9=0 -> FBAnd2 -> b_Step4_Set (1 scan; FBAnd9 o95 after FBAnd2 o61 as for EStop).
Variant A (OFF-only, if analyst says LOSS out of scope): two new SAL variables `linkWdc1OffEmg` (source //RndPhysicalCompact/WDC1_OFF/TonOut),
`linkWdc2OffEmg` (source WDC2_OFF/TonOut) -> Network6/FBAnd9 !AndIn2, !AndIn3. 0 FB, +2 variables, +2 ports.
Budget (B): FB 346 -> 346 (<=512 structure-check limit), variables 105 -> 105, active ports +1, wires 466 -> 466, cross-network wires 0.
Prototype (scratchpad, B): native preflight PASS, counts above; trace (a): EMG t0, Step4 +1, LVdis +2, C3/BMS OFF +3, C1 OFF +2003, STO held.
Full catalog `node --test test/catalog/*.test.js`: canonical 136 tests / 134 pass / 1 fail (E-11a); prototype B 136 / 135 / 0 fail.
Native CRC NOT run on the prototype (editor/stand runs check:structure on the real candidate).

## Invariants (proof)
- One stage RS / one main status per scan: catalog rule A9 per-scan check (all catalog tests); Step4_Set resets Step3/Step_RnD/Step12/CFG as for EStop.
- EStop path unchanged: FBAnd9 AndIn1/4/5/6, FBAndLvEmg, Network7/8 untouched; E-01..E-08 unchanged vs canonical.
- Timer presets unchanged (WDCx_OFF 0.5 s, Network7/FBTon1 2 s, FBTon2/3 5 s, Network8 1 s): structure diff = only items 1-2.
- STO held: Run->R&D STO already active before C2 OFF; Step4 chain never releases STO (E-11 check "STO held").
- Inter-network only via Symbol linkWdEmg (RndPhysicalCompact -> Network6); singleton usages; crossNetworkWires=0: structure-check.
- Hardware/alias/group/target, SGVL, PLC (E4) untouched.

## Cases
(a) Run->R&D, C2_FBK stuck ON: E-11a must PASS (was FAIL). (b) R&D->Safe, C1_FBK stuck: E-11b PASS (unchanged path FBAndLvEmg).
(c) Config exit, C2_FBK stuck: E-11c PASS (FBAndLvEmg via linkCfgActive). Plus E-10, E-09 (Emergency timing) unchanged.

## Editor scope
Write `SafetyTests/candidates/EMG-OFF/native/{TwinSafeGroup1.sal,TwinSafeGroup1.sal.diagram,GVL1.sgvl}` (copy canonical SAL+diagram,
`MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl`; Alias Devices not needed: input-rule falls back to fixtures/alias-safety-map.json) and
`SafetyTests/program/editor/EMG-OFF/**`. Edit only SAL items 1-2. No canonical edit before gates.

## Checks against candidate (from SafetyTests/)
- `CATALOG_SAL_DIR=candidates/EMG-OFF/native npm run check:structure` (native preflight + binding audit + input rule + native CRC
  via scripts/native-crc.ps1 + FB<=512).
- `CATALOG_SAL_DIR=candidates/EMG-OFF/native npm run check:catalog` (or `node --test test/catalog/*.test.js`; `CATALOG_STAGES=E6` for E-rows);
  compare FAIL set with canonical run: expected delta = E-11a FAIL->PASS only.
- `npm run check:software` with CATALOG_SAL_DIR set, summary only.

## G3 mutations (tester)
M1 delete linkWdEmg usage at //Network6/FBAnd9/AndIn2 -> E-11a fails. M2 NO->NC on FBAnd9/AndIn2 -> Run unreachable / E-0x fail.
M3 delete //Network6/FBAndLvEmg/AndIn2 (!b_EStop_Ok) -> E-11b/c fail. M4 delete STAGE_LVON/OrIn2 -> E-11b; /OrIn3 -> E-11c.
M5 WDC2_OFF 0.5->0.6 s -> E-10/E-11a timing. M6 Network7/FBTon1 2->2.1 s -> E-11 "C1 OFF +2 s". M7 delete Network6/FBOrStep4/OrIn1 -> E-11a, E-01.
M8 order: move FBAnd9 (o95) before FBAnd2 (o61): 1-scan shift, below TOL 50 ms -> expected equivalent (record, not a gap).

## Question for analyst (via lead), blocks only the B/A choice
Q-EMGOFF-A1: Run steady, C1 or C2 FBK drops while commanded ON (WDCx_LOSS, E-09) -> Emergency, but canonical keeps Step3, C1/C2 ON,
STO released indefinitely. Must this Emergency also start the common EStop chain (Variant B fixes both), or keep EMG-OFF limited to
OFF failures (Variant A)? No assumption made.
