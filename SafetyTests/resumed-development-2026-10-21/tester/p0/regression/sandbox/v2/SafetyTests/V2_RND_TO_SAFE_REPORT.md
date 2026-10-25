# R&D -> Safe linked-path baseline — 2026-10-18

**Superseded execution-order finding:** see `SAL_ADAPTER_SEMANTICS.md`.
The lost handoff below is now reproduced only in explicit legacy-network
mode (RNDSAFE02). With default global block order, RNDSAFE05 reaches Step2
and raises LV/HV output commands in the selected chain. Do not report the
legacy lost-handoff result as behavior under the corrected ordering.

Source: v2 SAL, embedded CRC `872783435`.
Tests: `test/sal-rnd-safe-outputs.test.js`, RNDSAFE01–04.

## Execution boundary

Networks3/5/12 and Network1 except `safeEstop` are executed. `b_EStop_Ok`
is an externally supplied TRUE precondition, not an executed emergency result.
Source-less declared variables are initialized FALSE, LV feedback/Healthy and
door feedback TRUE. After combinational warmup, RS memories are seeded with
LV ON and R&D ON; other RS memories are cleared. HV starts OFF.

This binds the physical green input to output commands in a selected SAL
chain, not the entire project. Networks2/4/6/7/8/9/10/11, physical wiring and
real contactor dynamics are excluded. Feedback changes are supplied by tests.
The adapter currently executes networks in file order and orders blocks only
within each network. Beckhoff execution order has not been established.

## Observations

| Scenario | Result in the adapter |
|---|---|
| Green held 650 ms, LV feedback still ON | LV command drops; LV discharge latches ON; battery/BMS reset requests rise. R&D status remains active pending LV OFF feedback. HV stays OFF. |
| LV feedback then turns OFF while green remains held | Network12 generates `b_Step2_Set_2`; next Network3 evaluation has both Set and Reset TRUE on FBRs2. Reset-dominant execution clears R&D without establishing Step2. After 200 ms all eight step latches are FALSE; LV/HV commands remain OFF and LV discharge TRUE. |
| Green released before LV feedback OFF | The down request disappears; when LV feedback later turns OFF, R&D remains active with LV command OFF, discharge ON and no Step2. |

### Correction to the previous partial-route interpretation

`V2_SAFE_EXIT_REPORT.md` EXIT03 holds an **internal** Step2 set request long
enough to establish Step2 and demonstrate its LV/HV set branches. In the newly
linked button path the request is short-lived because it depends on R&D,
which is cleared by that same request. The adapter instead reproduces a lost
handoff. The earlier result does not prove physical-green-triggered LV/HV
re-energization in the complete project.

Both tests retain value, but their scopes and stimulus durations differ.
The linked result is execution-order-sensitive and must not be presented as
a verified TwinSAFE runtime defect without runtime/ordering confirmation.

## Network4 clarification

Network4's display name is `Network4ToBeDeleted`. Its sole Decouple block's
eight inputs have no source monikers, global references, incoming output
targets or declared-variable targets in the parsed SAL. Its outputs reference
step set/reset globals. No explicit emergency input connection is established.

The adapter's default TRUE for an unconnected port would assert these globals
if this network were included. That is an adapter assumption, not evidence
of the Beckhoff runtime value. The network must neither be silently included
with assumed constants nor described as validated emergency logic.

## Next work before expanding execution claims

1. Audit the adapter's block execution order, unconnected-port initialization,
   RS semantics and input-level interpretation against authoritative Beckhoff
   behavior or observed TwinSAFE traces.
2. Make execution assumptions explicit and test sensitivity of short handoffs
   to order/initialization. Retain the current tests as partial baselines.
3. Then bind the complete emergency/Healthy-loss paths and regenerate the
   requirement-to-evidence matrix. TwinSAFE edits remain a later phase.
