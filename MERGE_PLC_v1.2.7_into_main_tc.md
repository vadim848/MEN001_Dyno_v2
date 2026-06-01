# Merge: operational PLC (v1.2.7 `PLC_motion`) → `main_tc` `PLC_Dyno`

This file documents a **content-level** merge of the operational PLC application from
tag **`v1.2.7`** (solution `mtb_test_bench_ctrl`, PLC project `PLC_motion`) into the
sub-contractor's **`main_tc`** branch (solution `MEN001_Dyno`, PLC project `PLC_Dyno`).

> **Why content-level and not `git merge`:** `main_tc` and `main`/`v1.2.7` have **no common
> git ancestor** (different root commits) and the projects were renamed
> (`mtb_test_bench_ctrl`→`MEN001_Dyno`, `PLC_motion`→`PLC_Dyno`). A normal merge would treat
> every shared file as an add/add conflict. `PLC_Dyno` was written from scratch for safety
> testing and shares no lineage with `PLC_motion`.

The goal (per decision): **combine into one PLC project** — `PLC_motion`'s operational objects
live alongside `PLC_Dyno`'s safety objects in a single `PLC_Dyno` project. This commit brings in
**source files only**; project registration and physical I/O linking are done in the TwinCAT XAE IDE.

---

## 1. What this commit added (28 objects from v1.2.7 `PLC_motion`)

All files are byte-identical to `v1.2.7` (UTF-8 BOM preserved). They were placed under
`MEN001_Dyno/PLC_Dyno/{DUTs,GVLs,POUs}/`.

**DUTs (12, all net-new):** `E_ControlMode`, `E_MotorState`, `ST_AnalogInData`, `ST_EncoderData`,
`ST_IOData`, `ST_MenteeMotorCmd`, `ST_MenteeMotorStatus`, `ST_MotorCommand`, `ST_MotorStatus`,
`ST_SyncSnapshot`, `ST_UartBridgeCmd`, `ST_UartBridgeStatus`

**GVLs (7 net-new):** `GVL_AnalogIn`, `GVL_Commands`, `GVL_Encoder`, `GVL_MenteeMotor`,
`GVL_Status`, `GVL_Sync`, `GVL_UartBridge`

**POUs (7 net-new):** `FB_AnalogInHandler`, `FB_EncoderHandler`, `FB_IOHandler`,
`FB_MenteeMotorHandler`, `FB_MotorControl`, `FB_TorqueControl`, `FB_UartBridgeHandler`

**2 conflict objects — brought in as `*_v127`, NOT overwriting `PLC_Dyno`'s versions:**
- `POUs/MAIN_v127.TcPOU`   (internal object name still `MAIN`)
- `GVLs/GVL_IO_v127.TcGVL` (internal object name still `GVL_IO`)

Nothing belonging to `PLC_Dyno` was modified or deleted. The existing safety objects
(`GVL_Safety`, `ST_TwinSAFE_IN/OUT`, `ST_Safety_Speps`, the visualization, `MAIN`, `GVL_IO`),
the `Safety_Dyno` TwinSAFE project, and the EtherCAT hardware config are untouched.

> Project/task files from `PLC_motion` (`PLC_motion.plcproj`, `.tmc`, `PlcTask.TcTTO`) were
> intentionally **not** copied — they would create a second project / overwrite `PLC_Dyno`'s task.

---

## 2. Register the source in the `PLC_Dyno` project (IDE)

For each net-new object: in Solution Explorer, right-click the `DUTs` / `GVLs` / `POUs` folder
under `PLC_Dyno` → **Add → Existing Item…** → select the new files. (Or add `<Compile Include=…>`
entries to `PLC_Dyno.plcproj`.) **Do not** add the two `*_v127` files as-is — they would create
duplicate object names. Resolve them first (section 3), then delete the `*_v127` files.

---

## 3. Resolve the 2 collisions (manual)

### 3a. `GVL_IO` — merge declarations into one list
The two versions declare **different variables** under the same global name:

| `PLC_Dyno` `GVL_IO` (keep — hardware-linked) | `v1.2.7` `GVL_IO_v127` (add) |
|---|---|
| `RedLED, GreenLED, BlueLED, b_MotorCooling : BOOL AT %Q*` | `stIO : ST_IOData;` (OPC-exposed for ADS/Python) |

**Action:** add `stIO : ST_IOData;` into the existing `GVL_Dyno` `GVL_IO`, keep the `AT %Q*`
outputs, keep both attribute pragmas (`{attribute 'qualified_only'}` and
`{attribute 'TcGvlVarFlags' := 'OPC'}` — compatible). Then delete `GVL_IO_v127.TcGVL`.

### 3b. `MAIN` — two unrelated programs
- **`PLC_Dyno.MAIN`** (safety testing): TwinSAFE ACK reset, door monitor, battery/BMS relay
  commands, and `act_LED_Control` driving Red/Blue/Green LEDs from TwinSAFE state.
- **`MAIN_v127`** (operational): the full motion application — `FB_MotorControl`/`FB_TorqueControl`
  ×2, `FB_IOHandler`, encoders, analog, Mentee motor & UART bridge, limit-switch interlocks,
  brake release, status LEDs, and the `GVL_Sync.stSnapshot` DC-synchronized snapshot for Python.

**Action — both must run, but only one POU can be `PROGRAM MAIN`.** Recommended: rename the
operational one to `PRG_Motion` (or keep it as `MAIN` and rename the safety one to `PRG_Safety`),
then call both from the PLC task. Then delete `MAIN_v127.TcPOU`.

> ⚠ **LED double-drive:** `act_LED_Control` writes `GVL_IO.RedLED/GreenLED/BlueLED` (TwinSAFE-driven),
> while the operational code writes `GVL_IO.stIO.bDO_StatusLED_Green/Red`. Decide which scheme owns
> the physical LEDs so they don't fight.

---

## 4. Resolve references, libraries, task & I/O links (IDE)

1. **Libraries:** ensure `PLC_Dyno` references what the operational code needs — `Tc2_MC2`
   (for `AXIS_REF` and MC function blocks) and `Tc2_EtherCAT`/`Tc2_System`
   (for `F_GetCurDcTaskTime64`). Add any missing references.
2. **NC axes:** `MAIN` declares `Axis1, Axis2 : AXIS_REF`. Create/link NC axes in the Motion
   config and map them to the motor drives in `main_tc`'s EtherCAT chain.
3. **Physical I/O:** link `ST_IOData` members (digital in/out, analog in, brake outputs, limit
   switches) and `GVL_AnalogIn`/`GVL_Encoder` to the corresponding EtherCAT terminals. These
   links did not survive the project rename and **must be re-created** against the new hardware.
4. **Mentee UART bridge / Mentee motor:** link `GVL_UartBridge` / `GVL_MenteeMotor` to the
   corresponding EtherCAT slave(s) in `main_tc`'s chain.
5. **Task:** the snapshot logic assumes a DC-synchronized PLC task. Verify the `PlcTask` cycle
   time / DC settings and that the chosen MAIN program(s) are called from it.

---

## 5. Integrate operational safety with TwinSAFE (important)

In `v1.2.7` the E-Stop was a plain digital input (`GVL_IO.stIO.bDI_EmergencyStop` →
`bEStopActive` in `MAIN`). In `main_tc` the E-Stop is handled by **TwinSAFE**, exposed via
`GVL_Safety.stTwinSAFE_IN.EStop_Ok` / `EStop_Status`. Route the operational safety reaction off
the TwinSAFE status (e.g. set `bEStopActive := NOT GVL_Safety.stTwinSAFE_IN.EStop_Ok`) rather than
the old raw DI, so the motion application reacts to the real safety chain.
