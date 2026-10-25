# splcproj Project Crc (S6) - native, no hand computation

## Finding
- The splcproj `<Project Crc="...">` is a file CRC over the splcproj XML itself (not SAL/SGVL/sds CRCs).
  Code: `SALDesignerControl.dll` (TwinCAT Safety 1.4.16\v170), namespace
  `Beckhoff.SALDesigner.TC3CustomCode.SafetyProject.UInt32BasedSerialization`:
  `ProjectFileCrcVerifier` (open: SafetyProjectNode.GetProjectMemoryStreamCrcChecking -> the "calculated CRC ... project file" dialog),
  `ProjectFileCrcWriter` (save: SetProjectMemoryStreamCrcInserting: remove `Crc` attr, `XmlDocument.Save(ProjectFileCrcWriter)` inserts CRC).
  Base classes in Utils.dll (`CrcProtectedXml*<uint>`). Source of IL: ildasm of the DLL (read-only).
- Cause: E4 changed splcproj content (items/NextSdsId) in commit 2494ead without CRC rewrite. IDE Save All writes only dirty items, so it never rewrites it.
- Evidence (script verifier, same code as IDE): splcproj at 9c0a9ad, bea98e6, a0238cd, 795d346, 156207f -> verifyOK=True;
  at 2494ead (canonical now) -> False.

## Offline fix (a) - done in scratch only
`scripts/project-crc.ps1 -Splcproj <in> [-OutPath <out>]` (never overwrites input): verifies, then rewrites via the native writer.
Scratch result for canonical file: Crc 1975831473 -> **37841189**, verifyOK(out)=True; diff vs input = only the `Crc` attribute
(file +2 bytes = digit count; no missing precalculated CRCs reported). Output scratchpad: ...\scratchpad\out.splcproj (not committed).
Apply (editor/lead, needs path ownership of MEN001_Dyno): run with `-OutPath` to temp, copy over
MEN001_Dyno/Safety_Dyno/Safety_Dyno.splcproj, check `git diff` = one line (line 2, Crc attr), re-run script on it -> verifyOK=True.
NOTE: CRC depends on file bytes; any later splcproj edit (e.g. P2b rename, new sds) requires re-running it. Not IDE-verified yet (needs S6 re-open).

## IDE procedure (b) - fallback, untested
1. Close solution, back up splcproj; open MEN001_Dyno_v2.sln, press OK on the CRC dialog.
2. In Solution Explorer select Safety_Dyno -> Properties; change a harmless property (e.g. a description/name field if present), apply, then change it back; (or add and remove a blank/ no-op item). This marks the project node dirty.
3. File -> Save All (Ctrl+Shift+S).
4. `git diff MEN001_Dyno/Safety_Dyno/Safety_Dyno.splcproj`: only the `Crc="..."` attribute on line 2 may change; anything else -> revert and stop.
5. Run `scripts/project-crc.ps1 -Splcproj <file>` -> verifyOK=True; reopen solution -> no CRC dialog.
Risk: IDE may reformat the file or touch other items; prefer (a).
