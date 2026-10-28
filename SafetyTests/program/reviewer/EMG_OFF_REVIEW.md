# EMG-OFF review (reviewer, 2026-10-27)
Verdict: ACCEPT-WITH-NOTES (model/software only; no hardware safety claim).

SHA: canonical HEAD SAL 9e5bfb15...762d; working SAL 53e9a6d8...8fbb; SGVL 8a3d452c... unchanged (git diff empty).
Candidate copy SAL 4baa320a (pre-CRC hand edit); working SAL differs from it by CRC re-save in TcXaeShell (diagram re-serialized, per lead only CRC+name attr after bounds strip; not re-verified by reviewer).

## G4 diff vs plan
- SAL diff = exactly plan items 1-2: Network6/FBAnd9/AndIn2 Deactivated -> Activated + "Make Contact (NO)" (same polarity as Network1/FBAnd1/AndIn5); one new fbPortUsage in existing linkWdEmg targetUsages singleton wrapper (now 2 targets: //Network1/FBAnd1/AndIn5, //Network6/FBAnd9/AndIn2); sourceUsages unchanged (WD_EMG/OrOut); moniker occurs once. Crc attr changed (native save). No new FB/variable/wire/timer.
- Matches EMG-OFF-Q1=A and Q-EMGOFF-A1=B ("существующий Symbol linkWdEmg на аварийный выход FBAnd9, без новых FB/таймеров").
- Side effects: FBAnd9 drops only when WD_EMG=1; WD_EMG already latches Emergency via FBAnd1/FBEstop1, so the new Step4 trigger is a subset of existing Emergency conditions in Step3 (no new Emergency causes). EStop path inputs AndIn1/4/5/6 untouched. Full catalog 137/138 pass (1 todo) per lead.

## G1 tests
- E-11a, E-12a/b: oracles from EMG-OFF-Q1/Q-ARCH-01 (C3/BMS+LVdis <=50 ms, C1 OFF 2000+-50, single Emergency state, STO held, FBK pinned). RED on canonical, GREEN now.
- M1 (remove new usage) run by reviewer on scratch copy: E-11a FAIL, E-12a FAIL, E-12b FAIL (killed). Extra M1b (revert AndIn2 to Deactivated): same kills. E-11b/c PASS under both (expected: FBAndLvEmg path).

## Notes (non-blocking)
N1 E-11b/E-11c do not discriminate this change (PASS on canonical); they are regression guards for FBAndLvEmg (M3/M4 per plan). Tester should confirm M3/M4 kills.
N2 E-11b: C1 already OFF at entry -> "C1 OFF +2 s" branch not exercised (logically correct); E-11c: if C3/BMS already OFF in Config, C3/LVdis "at once" checks may pass trivially (first() from ev-1). Acceptable, but not evidence of chain start in those cases beyond Emergency+LVdis.
N3 E-12 comment says "after the 500 ms window" but check is Emergency <= loss+50 ms (consistent with E-09 emgWithin); wording only.
N4 SafetyTests/SOFTWARE_CHECK_RESULTS.md is stale (2026-10-22, SAL 04b45456); current check:software PASS (SAL 53e9a6d8) is lead-reported, not persisted there. Stand/lead: regenerate or record result path.
N5 STO/C2 timing inside chain for E-12 not specified -> only occurrence/hold checked (honest, per comment).
N6 Diagram re-serialization (2826 lines) accepted on lead's normalization check + Vadim Verify 0 errors; not independently re-verified.
Limits: model of SAL only; native CRC/validation per check:structure; Verify in TcXaeShell reported by Vadim; no Target/hardware.
