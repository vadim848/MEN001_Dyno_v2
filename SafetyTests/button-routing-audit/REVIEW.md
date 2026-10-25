# Independent review: button routing, 2026-10-20

Verdict: **FAIL — universal unambiguous per-attempt routing is not established.** The audit correctly identifies a demonstrated Run gesture defect and a separate conditional opposing-request conflict. No implementation changes were made in this verification cycle.

## Source and independent checks

Reviewed AGENTS/WORKFLOW, analyst and architect handoffs, latest scenario decisions, the confirmed read-only original SAL, current actual SAL/SGVL, tester fixture and probe code, results and `tester/REPORT.md`. Current SAL SHA256 is `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`; SGVL is `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b`. Final hashes remain unchanged.

Before source tracing, reviewer independently reran whole-source native-serialization preflight: PASS, 14 networks, 254 blocks, 2172 ports, 75 Symbols, 319 wires, zero cross-network graphical wires. Required usage singleton/wrapper checks pass. Full typed SAL/SGVL binding audit independently passes. These are software structure checks, not native CRC or IDE/Target verification.

## Findings

1. **Confirmed: Run BOTH can become green-down without a fresh attempt.** `SafeResumption/MODE` enables the common recognizer only in Step1/RnD. Run instead consumes raw green through `Network6/FBTon2` (500 ms), `FBAnd24`, `FBAnd23` with blue OFF, and `FBOr5`. The timer can mature while both buttons are held; releasing blue then permits down. Tester reproduces both failed-short-chord orders and valid full chords with delta0/delta250. Reviewer independently replayed simultaneous BOTH held1100 ms using the actual-source fixture: blue release at8518 produces physical-down at8518 and HV-reset request at8520, without neutral/rearm; no demanded inputs were unbound. This contradicts approved Run BOTH-ignore/full-clear ownership. The multiple failing cases are manifestations of the same bypass, not evidence of multiple independent defects.

2. **Conditional conflict: retained green-down and PLC11 can request opposing operations.** Direct source inspection confirms separate Network12 up/down OR consumers without shared opposing-command arbitration. Tester accepts physical green, keeps C1 feedback ON, then applies PLC11: both requests TRUE2620; component HV output TRUE2629 with LV output FALSE and LV reset/discharge requests retained. This is a valid software witness under the declared phase/input boundaries. Standalone PLC acceptance and handshake policy remains unanswered; the evidence does not prove complete startup reachability, real PLC production of the sequence, or physical equipment energization. Resolving Q-PLC-REQUEST is required before defining a corrective normal-operation policy.

3. **Full lifecycle ownership remains unproved.** Passing Step1/RnD component cases do not prove complete boot, Network4/group behavior, cross-mode owner cleanup, fresh StartingRun abort and full transition completion. The baseline conflicting injected Set requests likewise shows a conditional state-owner weakness, not legal external-history reachability. No extra expected fault destination can be inferred from this test.

## Assessment of evidence and scope

Accept `tester/REPORT.md` as a bounded RED verification report: baseline current443/445, targeted82/84, RnD component69/69 and additional two valid-Run-chord failures are kept distinct. Passing original/harness tests are not implementation acceptance. The tester's reported limitations appropriately constrain the actual SAL component replay with explicit Network3 cuts and host Error stub. Reviewer reproduced the key Run failure independently; other counts are reviewed tester evidence, not a second full-suite run.

A single accepted up request intentionally fans out to C2 and both early torque permissions; this is coordinated action, not automatically a duplicate button command. Raw green's separate Reset and immediate Unlock-suppression roles must also remain distinct from normal command classification. Deterministic RS priority alone would not establish absence of opposing operational requests.

The user's requested all-clear cannot be given. This review authorizes no functional edit and makes no native CRC, target/ADS resolution, online timing, hardware or safety acceptance claim. Only this REVIEW.md was written by the reviewer.
