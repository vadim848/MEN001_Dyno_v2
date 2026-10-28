# EMG-OFF editor notes (variant B)
Candidate: SafetyTests/candidates/EMG-OFF/native (copy of canonical, SAL base 9e5bfb15...762d).
Diff (SAL only): Network6/FBAnd9/AndIn2 Deactivated -> Activated + deactivate1="Make Contact (NO)";
linkWdEmg targetUsages: +1 variableUsagesHasUsages (fresh GUIDs) -> //Network6/FBAnd9/AndIn2. Encoding/BOM/CRLF kept.
SHA256 (hand-edited, CRC NOT yet regenerated): SAL 4baa320a...2fc0, diagram ccd67dee... (unchanged), sgvl 8a3d452c... (unchanged).
check:structure: preflight/binding/input-rule/FB<=512 PASS (blocks 346, symbols 105, ports 2800, wires 466);
native CRC FAIL (recorded 3573125357 stale, calculated 4151414716) -> needs native writer save (E2-R1 tools/native-save.ps1 adapted);
that powershell run was denied by auto-mode classifier; not done.
check:catalog: started in background on the hand-edited SAL (log catalog.log); CRC-independent.
