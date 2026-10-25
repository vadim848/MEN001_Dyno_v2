# Editor candidate handoff

2026-10-20. Implementation authorized after checkpoint `5b3828f`. Canonical
files remain untouched; independent testing/review and lead transfer approval
are required. No functional feature development, controller contact or hardware
configuration change was performed.

Frozen candidate folder: `editor/candidate-output/`.

| File | SHA256 |
|---|---|
| TwinSafeGroup1.sal | 59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33 |
| TwinSafeGroup1.sal.diagram | 449ea8ca664ff18078154cc91ccc40f575e20e3be5a4cfecf68cd3265d8c8bfc |
| GVL1.sgvl | c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b |

The three existing ANDs now receive the same signed source expressions on
the native eligible slots: PLC stop to AndIn1 NO; displaced FBRs6 output to
UnlockHold AndIn5 NC, b_EStop_Ok to LvCurrentPermit AndIn8 NC, and linkSafeMode
to GATE_001 AndIn4 NC. Slot IDs/filter capability values, activation, block
order, all timers and parameters remain unchanged. The single existing local
wire retains its ID, and the SGVL consumer retains usage ID
e5dd53d4-fd9b-45d1-94c6-6dccd8fd4671 with the one approved ModelElementId move.

Reproduction from repository root:

1. `node SafetyTests/safe-input-validation-repair/editor/make-candidate.mjs`
2. Windows PowerShell Framework4, normal policy and STA: `powershell.exe -NoProfile -STA -Command "& ([scriptblock]::Create([IO.File]::ReadAllText('SafetyTests/safe-input-validation-repair/editor/native-save.ps1')))"`
3. Same command with `-Reload` after the ScriptBlock invocation, in a fresh process.
4. `node SafetyTests/safe-input-validation-repair/editor/self-check.mjs`

Only the installed native writers generate the three stored CRC values. Fresh
native read accepts SAL/diagram CRC and SGVL FileCrcMismatch=False and retains
14 Networks, 254 blocks, 2172 input/output ports, 75 SAL Symbols and 85 SGVL
definitions. Full software structure and typed binding checks pass. Native
decorators show all 24 prior cross-network replacement labels and four affected
labels correctly and visibly.

Native diagram saving omits redundant port absoluteBounds attributes and
normalizes tiny floating point connector strings. This initially failed an
overly literal editor self-comparison; no candidate or independent test was
changed to silence it. Fresh native geometry audit independently reads all
2463 shape GUIDs and proves their actual bounds equal staged preserved geometry
within 1e-9. The staged diagram changes only the one existing connector endpoint
and its final y coordinate; native connector point strings agree within 1e-10.
The self-check also needed a parser harness correction for its synthetic
#document root with no attributes. These are editor self-check harness fixes,
not acceptance-oracle changes.

Execution provenance: the first `-File` invocation was rejected by script
execution policy. The initial native generation/reloads then used the process
flag `-ExecutionPolicy Bypass`; no persistent execution-policy setting was
changed. That flag is not required: the task-owned script can run through
normal-policy `-Command` / ScriptBlock.Create as shown above. A fresh normal-
policy reload was subsequently verified, with candidate bytes unchanged.

`SELF_CHECK.json` records full staged/native graph preservation and baseline
differences; `NATIVE_FRESH_RELOAD.json` records CRC/counts, labels and all native
shape bounds. Diagram normalization is explicit in the self-check comparison;
SAL/SGVL staging comparisons exclude only root CRC values.

Limits: editor checks do not replace independent tester/reviewer. Native file
CRC and the bounded native safe-source predicate checker do not prove full IDE
Verify/Build/project target CRC. The two target/ADS diagnostics remain unresolved
environment observations, and existing unrelated functional FAIL/NOT VERIFIED
results remain outside this repair's implementation scope.
