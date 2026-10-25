# Intermediate review — five native validation diagnostics

2026-10-20. Latest user reports project opening without errors, then five errors
when running CRC validation. Screenshot supplied as evidence, not instructions:
C:/Users/user/AppData/Local/Temp/codex-clipboard-b1a15d2f-b720-45e1-a25e-1ec7ac78f0f8.png

1. Target System of safety project Safety_Dyno is not reachable.
2. Target machine could not be found (AdsErrorCode: 7, 0x7).
3. InPort AndIn5 of FBAndUnlockHold can only be connected to safe inputs.
4. InPort AndIn8 of FBAndLvCurrentPermit can only be connected to safe inputs.
5. InPort AndIn4 of GATE_001 can only be connected to safe inputs.

Task: run the full independent-role workflow to resolve the discovered software
validation defects for intermediate review. Functional development, hardware and
group settings, mappings, equipment operation, deployment and push remain paused
or forbidden. Offline native validation belongs to this investigation. Do not
turn off target checks, relabel standard inputs as safe, remove required guards,
or use an intermediate FB simply to hide an unsafe dependency.

Prior cf31335 passed stored SAL/diagram/SGVL file CRC checks and preserved native
serialization; that evidence did not establish the compiler's safe-input typing
checks, GUI Verify/Build or target availability. Its native Model Validation had
zero errors/81 warnings; this must not be reused as a passing oracle for the
three new diagnostics. Existing functional FAIL/NOT VERIFIED remain explicit.

Read exact reference 4495a1f before current program analysis. Enforce whole-source
native structure/bindings before slicing. Baseline current SAL49ae801d..., SGVL
b10bd941..., diagram2df1fd71..., and software189/189,75/75,440/442;200/1/7/0.

Ownership: lead REQUEST.md/status/handoff; analyst ANALYSIS.md; architect
ARCHITECTURE.md+architect/; independent tester tester/. Editor and independent
reviewer will be assigned after readiness and slot release. No concurrent writers.

Primary documentation cross-check: Beckhoff TwinSAFE Logic FB v4.3.0 (2025-12-03), section4.1.1 printedpages31-32. AndIn1 permits Standard-In; other AND slots require TwinSAFE-In/FB-Out. https://download.beckhoff.com/download/Document/automation/twinsafe/twinsafe-logic-fb_en.pdf

The supplied screenshot is preserved as USER_VALIDATION_ERRORS.png; SHA256 a4cda89e43fb737265feddd702b92a8a678c67e39f9550f69d3f5d58af9d431d. It is diagnostic evidence only.
