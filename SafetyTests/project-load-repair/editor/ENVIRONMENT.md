# Native load investigation — 2026-10-20

Tools execute successfully after the quota reset. Functional P0 work is stopped;
its candidate is not promoted. No SAL/SGVL/program/hardware change was made by
this investigation.

## Confirmed installed environment

- Native executable: `C:/Program Files/Beckhoff/TcXaeShell/Common7/IDE/TcXaeShell.exe`.
  Executable FileVersion/ProductVersion:17.0.0.0. This identifies the shell
  executable, not the TwinCAT build by itself.
- Actual shell UI reports **Build4026.27(Default)**.
- Safety VSIX manifest: extension identity9d1c2038-1880-43d6-b49f-db604855f2a9,
  version1.4.16, VS17 amd64 target. Installed Safety Common components including
  GlobalVariableList/SafetyTransformationLib/Utils report1.4.16.13.
- Safety version manifest MinVersion3.1.4024.11. This alone does not establish
  that every current serialized enum/context is valid.
- Solution `MEN001_Dyno.sln` declares VisualStudioVersion17.10.35827.194 and
  references `MEN001_Dyno/MEN001_Dyno.tsproj`. That file declares
  TcVersion3.1.4026.27 and its nested `Safety_Dyno/Safety_Dyno.splcproj`.
  Safety project SPlcProjVersion1.8.0.0; SAL dslVersion1.5.0.0.

## Actual proper-project opening reproduced

Used computer-use skill through node_repl/@oai/sky. Selected the actual returned
TwinCAT window; launched the installed executable after the previous window
disappeared. Navigated **File→Open→Project/Solution**, selected the exact canonical
`C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno.sln`.
No direct SAL/Miscellaneous Files opening was used.

During **Loading project1of3: MEN001_Dyno**, a native TcXaeShell error modal
visibly reports:

> Error(s) while loading or creating safety project 'Safety_Dyno'.
> Single-Channel 1 mode Break Contact (NC) is unknown or not supported.

This is a reproduced native load failure, not an inference from the XML parser.
Acknowledged the error with Return; next native state was Preparing Solution.
No Build, Verify, CRC computation, online login, download, configuration activation
or equipment command was invoked. No Save action was invoked.

## Tool observations and limits

Initial state capture of the older window failed `foreground window did not
report a process id`; a fresh inventory subsequently had no shell window. A new
installed-shell launch produced a capturable native window. Modal accessibility
indexes431 were rejected as unavailable despite appearing in the tree; focused
element text lagged the actual dialog focus. Screenshot-backed filename focus
and native text entry successfully selected the solution. Screenshots in the
tool conversation show the exact path and native error; this is not a claim that
the earlier helper failure meant TwinCAT was absent.

No ActivityLog file was found by the limited read-only search of the matching
Roaming/Beckhoff/TcXaeShell profiles. A native error dialog was sufficient to
reproduce the user's failure. Installed component version/source enum analysis
is assigned separately to architecture; a version incompatibility is not proven.

Canonical source bytes remained:

- SAL b7096fa3cf7349ea0be08f347180deb071a0f6b75612c4e5c8a7f45cf0557161
- SGVL4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5

Current verdict: **native opening FAIL reproduced; repair not yet applied or
verified**. Await independently reviewed minimal serialization repair. No global
NC/NO substitution or hardware/timer change is authorized by this finding.

Follow-up observation: solution title became MEN001_Dyno - TcXaeShell. A second modal says Cannot load the canonical TwinSafeGroup1.sal: Single-Channel 1 mode Break Contact (NC) is unkown or not supported. The UI contains a restored document pane with <MiscFiles> in its ID; this was restored by the IDE session during/after proper .sln load, not a direct SAL Open File action in this investigation. The first Safety_Dyno error was already reproduced during loading project1of3. Source hashes rechecked unchanged b7096/4eb26. Awaiting reviewed isolated attr-only cleanup candidate before further opening tests.

## Isolated 143-attribute candidate native attempt

Reviewed exact byte-deletion candidate built and audited: SAL ffd6c64e567131cb4fd5c4dd58816e0e5e8bb4f60777142d7959d9cc591ef0d1; unchanged SGVL 4eb263924e8ca5d77a4017c7f82b0a13396d981d881158be8c8f2a169d393ee5. EXACT_DELTA.json records 143 removals and whole native-binding PASS. Minimal native-solution copy contains all three project-relative subtrees, 129 source files, no SafetyTests tree or .vs session.

Proper Open Project/Solution selected editor/candidate/native-solution/MEN001_Dyno.sln. Native shell displayed Review Project And Solution Changes: Unsupported YT Scope Project1/YT Scope Project1.tcmproj. It warns that information will be written to upgrade log in solution directory. No candidate Safety-specific error has yet appeared; Safety project/designer successful opening is NOT established.

Attempt to acknowledge this modal with Return was automatically rejected before execution: possible upgrade-log or isolated-solution modifications were not authorized. Parent notified; no workaround or repeat attempted. Current UI remains at this unsupported-scope modal. Canonical source not modified; candidate pair remains frozen. Acknowledgement requires authority covering possible isolated upgrade side effects, or a reviewed smaller solution entrypoint.

## Native candidate result (current)

Reviewed isolated SafetyLoadReview.sln SHA8848fe534999e3d1ccb96d3e45492de8c0c0abde2aa393af13086830e28513db removes only Scope Project/EndProject and its18configuration lines. Original copied solution fdf0ebb481039f2e9cb33fa35aa34ace28749af0ee4e445dd57fb92f2261afc9 retained. Unsupported Scope modal cancelled, not accepted. Reviewer independently approved the wrapper before opening.

The wrapper loaded main and DriveManager projects. No NC-mode error appeared. Native loader automatically reported: "The calculated CRC checksum for the diagram file of the TwinSAFE group 'Safety_Dyno.TwinSafeGroup1' do not match the saved CRC checksum. Please verify their configuration." Informational OK acknowledged; NO Verify/Build/recalculate/save performed. This remains a separate OPEN finding; error-free native opening is not claimed.

After acknowledgement actual Solution Explorer contains Safety_Dyno Project/Instance, GVLs, User FBs and TwinSafeGroup1. Opened TwinSafeGroup1.sal by double-clicking its actual project tree node. Native graphical designer displayed Network1, yellow FBOr22 and FBRs1 with connecting wires; Variable Mapping populated. No MiscFiles pane or NRE. Screenshot logs/candidate-sal-designer-0.jpg proves this bounded success. CRC warning screenshot logs/candidate-crc-warning-1.jpg retained. CRC toolbar indicator is red.

UI navigation initially appeared stale because default click did not activate tabs; explicit mouse_button:left and click_count:1 switched Solution Explorer. No additional source repair was needed.

Native automatic side effects were observed honestly. Context manifest129files:128 remained byte-identical; isolated PLC_Dyno/Visualization Manager.TcVMO changed07fd84a6253a328491c46924b415b1dbfa91a629af2fdd2af08dcf8ea520528c→ac2011e59f7bd12fe57f530d76f46a77a49c925a3a3295728328cb06703ef41e. NATIVE_CONTEXT_AFTER.json records comparison. No context file is promoted. Parent also detected canonical solution auto-write while switching away from the baseline:36SafetyGUID configuration lines removed. Parent preserved that snapshot and restored the proven original solution fdf0ebb...; editor did not restore/write canonical. Thus earlier statements that no explicit Save was invoked do not mean no automatic IDE side effect occurred.

Current verdict: exact143 serialization repair eliminates reproduced NC-mode load failure and allows actual native Safety project/SAL graphical designer opening in reviewed isolated context. Native load is NOT error-free because saved diagram CRC mismatch remains OPEN. CRC metadata not changed; no hardware validation, Build, Verify, deployment or online operation. Editor candidate pair remains frozen ffd6/4eb26. Canonical transfer is owned by parent, not editor.
