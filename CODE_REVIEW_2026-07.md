# End-to-End Code Review — mtb_test_bench_ctrl @ v1.3.3

**Date:** 2026-07-12 · **Scope:** entire repo at detached HEAD `944723f` (tag `v1.3.3`) — all POUs/GVLs/DUTs, tsproj/plcproj/task config, TwinSAFE project (structure), git topology.
**Method:** five parallel deep-review passes (motion core, Mentee EtherCAT layer, profiles/recording, I/O & safety, project config/repo hygiene); every critical claim re-verified directly against the source and the tsproj `<Mappings>` table (240 links dumped and filtered).

---

## TL;DR

The **application layer is genuinely good** — the trajectory generator, GVL_Sync snapshot, recorder, and slot-2 pipe show careful engineering with exceptional comments. The **problem is the layer under it**: the PLC's software safety path is decorative (phantom E-stop input, TwinSAFE state gates nothing, stops freeze-and-keep-streaming the last setpoint), several PLCopen FBs are mis-driven (MC_Home/MC_Reset can never re-trigger), and the recent 1 ms → 250 µs retiming silently broke the slot-2 binding-walk margins. Today the bench is safe **only because the TwinSAFE hardware chain (EL1918 → AX5805 STO + EL2904 contactors) works underneath the PLC** — everything software-side would let a fault through. Repo-side: the current release tag sits on **no branch**, and there are two case-colliding tag series.

**Counts:** 4 critical · ~30 major · ~35 minor/info. Top-10 action list at the end.

---

## 1. System inventory (verified facts)

### Tasks & runtime

| Task | Cycle | Priority | Content |
|---|---|---|---|
| PlcTask | **250 µs** | 2 | `MAIN` then `PRG_Motion` (sequential, same task → no PLC-internal races) |
| NC-Task 1 SAF | **250 µs** | 4 | NC axes 1 & 2 |
| NC-Task 1 SVB | 10 ms | 8 | — |
| VISU_TASK | 200 ms | 30 | HMI only |

RTime: 1 isolated core (CPU 1), base time 250 µs, all RT tasks on it. Target `192.168.1.50.1.1`, 64-bit. The v1.3.3 commit really did move both PLC and NC SAF to 250 µs (verified in tsproj + TcTTO + PLC instance context — all three agree).

### Hardware (EtherCAT)

AX5112 + AX5125 drives (each with AX5805 STO card) · 2× EL1918 (one hosts the safety logic) · 3× EL2904 safe outputs · 2× EL1859 D-I/O · EL3002 (present, **zero links**) · 2× EL3702 oversampling AI · 2× EL5112 encoder · EL5042 BiSS-C · EL2502 PWM · custom **"MNT" Motor Slave** (flexible PDO, slot-1 legacy + slot-2 debug pipe). There is **no EL1008/EL2008/EL4002** anywhere — relevant below.

### Architecture

Host (Python over ADS) ↔ command/status GVLs ↔ handler FBs (`AT %I*/%Q*` scalars) → `PRG_Motion` orchestration → `GVL_Sync.stSnapshot` single-read telemetry + `FB_HighRateRecorder` chunked ring buffer. Load motors via NC/PLCopen (MC_*), DUT motor via the slot-2 debug-PDO pipe.

---

## 2. CRITICAL findings

### C1 — The software E-stop and all limit switches are phantom inputs (circular self-feed)
`PRG_Motion.TcPOU:68-85`, `FB_IOHandler.TcPOU:38,48`, `GVL_IO.TcGVL:12` — **independently confirmed by two review passes and re-verified by hand.**

`bEStopActive := GVL_IO.stIO.bDI_EmergencyStop`, but `fbIO` is fed `nRawDigitalIn := GVL_IO.stIO.nDigitalInputs` — a value `fbIO` itself wrote the previous cycle. `GVL_IO.stIO` has no `AT %I*`, the tsproj has **zero links** to `fbIO` or `stIO`, and the EL1008/EL2008 the FB's comments reference don't exist in the rack. Consequences:

- The "1. SAFETY — runs before everything else" block in PRG_Motion can never fire from hardware.
- All four limit-switch interlocks (`PRG_Motion:203-214`) are dead.
- Brake outputs `bDO_BrakeRelease_M1/M2` are computed every cycle and sent nowhere.
- `GVL_Sync.stSnapshot.bEStopActive` reports this dead signal to the host — the UI shows "E-stop OK" **regardless of reality**. The snapshot carries no TwinSAFE fields at all.

### C2 — TwinSAFE status gates nothing in the motion path
`GVL_Safety.TcGVL`, `MAIN.TcPOU:62-111` — `stTwinSAFE_IN` (EStop_Ok, STO_1/2, Safety_Armed, HV/LV_Healthy…) is correctly linked to the EL1918 mirror, but is consumed **only by the LED-blinking action in MAIN**. Neither PRG_Motion, FB_MotorControl, FB_TorqueControl, nor any Mentee handler reads a single TwinSAFE bit. On a safety trip the PLC keeps streaming torque targets, trajectory setpoints and slot-2 injections; the Beckhoff axes stop only because the hardware STO kills the drives underneath the NC, and the DUT motor stops only because its supply contactor drops — its **command stream is never interrupted**, so when power returns it can re-energize into a stale setpoint (device-firmware-dependent).

Also in this cluster: `stTwinSAFE_OUT.EstopPLC` is linked into the safety logic but **never written by any POU** — the PLC has no path to request a safety stop even when it detects a fault itself.

### C3 — The stop flag can only ever work once per boot
`FB_MotorControl.TcPOU:10,173` — **re-verified by hand.** `stCmd` is a by-value `VAR_INPUT`; `stCmd.bStop := FALSE` in READY clears the FB-local copy, never `GVL_Commands.stMotorX_Cmd.bStop`. Once PRG_Motion latches `bStop := TRUE` (E-stop/limit path), it stays TRUE in the GVL forever; `rtStop` consumed its single rising edge, so **every later stop assertion produces no edge and MC_Stop never triggers again** until the host explicitly writes FALSE. (Currently masked only because the inputs feeding it are dead per C1.) Fix: make `stCmd` `VAR_IN_OUT`, or clear the GVL flag from PRG_Motion.

### C4 — The running release (v1.3.3) exists on no branch
`git branch -a --contains v1.3.3` → nothing. `RBTC-4667/feature/slot2-debug-pipe` stops at v1.3.2; the v1.3.3 commit (the 250 µs retiming — what's presumably on the bench) is reachable only through the tag. The annotated tag *is* pushed, so it won't be GC'd, but any new work started from a branch silently omits the current running configuration. Fast-forward the feature branch (or cut a release branch) to `944723f`.

---

## 3. MAJOR — Safety & stop semantics

| # | Where | Finding |
|---|---|---|
| S1 | `FB_MotorControl.TcPOU:223-230` | **HOMING has no abort path** — ignores E-stop/bStop/bEnable; power stays enabled; homing motion continues until hardware STO. |
| S2 | `FB_MotorControl.TcPOU:223-230` | **MC_Home is never re-armed** (`Execute` never falls). Second homing request instantly "succeeds" on the stale `Done` — position reference silently wrong for all subsequent absolute moves. |
| S3 | `FB_MotorControl.TcPOU:232-239` | **MC_Reset called for one scan only, never with `Execute:=FALSE`** — first NC fault may reset; every later one can't. Recovery then requires PLC restart. Same latch defect in the SoE reset path (`bSoeResetExec` sticks if the FB errors before raising Busy). |
| S4 | `FB_TorqueControl.TcPOU:24-36`, `PRG_Motion:294-308` | **Torque mode bypasses the state machine, E-stop and limits entirely** — level-driven `bTorqueExecute` + `ContinuousUpdate`, unclamped `fTargetTorque`. Mitigated by the drive-side S-0-0092 limit, which IS genuinely PDO-linked (good). E-stop clears `bEnable` but not `bTorqueExecute` → torque resumes the instant the axis is re-enabled. |
| S5 | `FB_TrajectoryGen.TcPOU:75-77`, `PRG_Motion:127-176,275-289`, `FB_LoadMotorProfile` | **"Stop" freezes the last setpoint and keeps streaming it.** Aborting a velocity profile at its peak leaves the DUT spinning at peak velocity (RxPDO still carries the frozen value every cycle); stopping a torque profile at ±50 % leaves the load motor pushing 50 % torque until the host writes 0. Zero the field on stop/done, or document hold-on-stop as an explicit contract. |
| S6 | `PRG_Motion.TcPOU:68-75` | E-stop branch (even if its input worked) touches only the two Beckhoff axes — never pulses `bStopSync`/`stCsv.bStop`, never gates the Mentee stream. |
| S7 | `PRG_Motion.TcPOU:203-214` | Limit interlock tests the **sign of `fTargetVelocity`**, which is a magnitude in position mode and 0 in torque mode — wrong check even once the inputs are wired. |
| S8 | `MAIN.TcPOU:21-24` | **`ErrACK` initializes TRUE and is held 10 s at every PLC boot** — any pending TwinSAFE group/FSoE error is auto-acknowledged with no operator action. (The safe E-stop function itself does require the physical reset PB — verified in the .sal — so this applies to group-level errors.) |
| S9 | tsproj:2835-2862 | **Dangling safety mappings** (`HV_Inhibit_cmd`, `LV_Inhibit_Cmd`, `Discharge_Cmd`, `act_Velocity_DR1/DR2`…) flagged `ANotFound` — struct members deleted, safety-logic standard inputs now frozen at constants. Purge or re-link. |
| S10 | `GVL_Safety` + all handlers | **No WcState/AL-state monitoring** on the safety mirror, encoders, or analog terminals — a terminal dropping off the bus freezes telemetry indistinguishably from a quiet signal. (The pattern exists: the slot-2 path monitors `nSlaveState`; apply it to the rest.) |

**Bottom line on safety:** a physical E-stop does stop both load motors and cuts the DUT's supply — but 100 % of that is the TwinSAFE hardware chain. The reviewed PLC code contributes nothing today, reports a dead E-stop bit to the operator, and can neither see nor request a safety stop.

---

## 4. MAJOR — Motion state machine & error reporting

| # | Where | Finding |
|---|---|---|
| M1 | `FB_MotorControl.TcPOU:204-214` | Mode switch while MOVING falls to READY **without stopping the axis** (dropping `Execute` on MC_MoveVelocity doesn't stop it) — axis keeps spinning, unsupervised; VELOCITY↔POSITION mid-move retriggers the other MC FB (both aborting) → setpoint jump, not bumpless transfer. |
| M2 | `FB_MotorControl.TcPOU:85-87,236,251-261` | `stStatus.bError` recomputed live each cycle from six self-clearing FB outputs — it **overwrites latched errors in the same scan** and excludes `fbSetPosition`/`fbSoeReset` errors entirely. Host can see `bError=FALSE, eState=ERROR, nErrorID≠0`. |
| M3 | `FB_MotorControl.TcPOU:254-261` | `nErrorID` is the **arithmetic sum** of simultaneous ErrorIDs — produces nonexistent error codes. Use priority-select. |
| M4 | `FB_TorqueControl.TcPOU:42-45` | `bError` latches TRUE **forever** (no reset path sees it) — one rejected torque command forces the red LED / error flag on until PLC restart. |
| M5 | `FB_MotorControl.TcPOU:161-168` | ENABLING has no timeout — drive left in STO ⇒ stuck in ENABLING indefinitely with `bError=FALSE`. |
| M6 | `FB_MotorControl.TcPOU:78-84` | `MC_SetPosition` executes on the edge with **no state guard** (comment claims "only in READY") — can shift the coordinate system mid-move. |

---

## 5. MAJOR — Mentee slot-2 pipe (DUT motor)

The dominant risk cluster here compounds: a missed bind strobe is *more likely* after the 250 µs retiming (P2), is *silently accepted* (P1), and whatever did bind gets fed *stale setpoints* (P3).

| # | Where | Finding |
|---|---|---|
| P1 | `FB_Slot2PipeHandler.TcPOU:149-161` | **Bind handshake ack is un-sequenced** — `i_last_op` has no sequence/toggle, so during 10 consecutive identical BIND ops, the echo of command N−1 passes as N's ack. A missed strobe → lane silently unbound while `bPipeActive=TRUE` → the app believes it commands the motor while the slave receives nothing. (`nVarCount` from 0x6001:0B is already read — checking it at walk end is a cheap fix.) |
| P2 | `FB_Slot2PipeHandler.TcPOU:87` | `WAIT_CYCLES := 5` counts **cycles, not time**, calibrated for 1 kHz ("// 1 kHz bus"). At 250 µs every margin shrank 4×; the strobe-low gap is now ~500 µs ≈ 2 ticks of the 4 kHz slave — edges can be missed outright. Derive waits from `fTaskCycleS` (the pattern PRG_Motion already uses). |
| P3 | `FB_Slot2PipeHandler.TcPOU:97-115,185-211` | `q_inject[]` never cleared on configure and frozen on BS_ERROR — freshly bound inject slots receive the **previous session's setpoints** (slave copies bound inject slots every cycle) before the app writes anything; position step hazard with the motor enabled. |
| P4 | `FB_Slot2PipeHandler.TcPOU:243-290` | The "mirror ALL unwritten slots" fix (commit c6dfa2e) exists **only in the STANDARD branch** — TORQUE view never mirrors slot 9 (frozen `sample_idx=0`), which after ~22 h of slave uptime trips the recorder's wrap heuristic on **every frame** → runaway timestamps in every TORQUE recording. Exactly the failure mode the STANDARD branch's own comment describes. |
| P5 | `FB_Slot2PipeHandler.TcPOU:165-170` | The walk-advance `REPEAT..UNTIL` indexes `aMonAddr[-10..-1]` and `[10..20]` because IEC `AND/OR` **don't short-circuit** — saved only by CheckBounds' clamp, and it pollutes the only OOB diagnostic counters every configure. Use `AND_THEN` or `LIMIT` the index. |
| P6 | `PRG_Motion.TcPOU:120-126` + pipe :242 | Trajectory anchors to `fLatestPos`, which only updates in `BS_RUN` — a position profile started while the pipe is idle/faulted anchors to stale/0.0 → setpoint jump on (re)bind. |
| P7 | slot-1 path | `FB_MenteeMotorHandler` has **zero staleness detection** (no heartbeat/toggle/WcState) — a hung slave app in OP leaves `theta`/torque frozen at plausible values. |

Verified-correct (worth knowing): all bit masks/shifts, PDO subindex arithmetic (s0..s9 ↔ 0x6001:03..:2A, inject ↔ 0x7001:07..:10, 100 sample lanes), and the WORD↔REAL union punning are right; the shift-by-division status decode is exact. One doc contradiction to settle against MASTER_INTERFACE §4.4: `ST_MenteeMotorV32OsSample.TcDUT:9` says GROUP_ID is `[14:12]` while three other sources decode `[15:13]`.

---

## 6. MAJOR — Profiles, CSV player, recorder

| # | Where | Finding |
|---|---|---|
| G1 | `FB_CsvPlayer.TcPOU:126` | `LREAL_TO_DINT` **rounds to nearest, not floor** (comment says floor) — verified. Upper half of every sample interval back-extrapolates the wrong segment (step transitions arrive half a sample early, ramps deleted); every pass also ends up to `fSampleDt/2` early. Use `TRUNC`. |
| G2 | `FB_CsvPlayer.TcPOU:100-102` | `nCount` unvalidated against the 20 000-element arrays — oversize counts are silently absorbed by CheckBounds clamping (plays 20 000 samples then holds a stale value for the phantom remainder). One-line reject. |
| G3 | `FB_CsvPlayer.TcPOU:177-216` | Restart mid-run with a different `nLoadMotor` **strands MC_ExtSetPointGen enabled on the old axis** (no off edge) while the new run silently never feeds (no on edge) — old axis hijacked indefinitely, new run plays to nowhere, no error anywhere. |
| G4 | `FB_CsvPlayer.TcPOU:190-197`, `FB_LoadMotorProfile:196-197` | Numeric velocity feed-forward `(pos−prev)/fDt` is **unclamped**: a 10° offset at start or loop-wrap → 40 000 °/s commanded for one cycle. Repetitive POSITION-domain RAMP/STEP snaps back to anchor **every repetition** (90° step + FF spike each rep). |
| G5 | `FB_CsvPlayer` decl, `FB_LoadMotorProfile:187-225` | **Ext-setpoint failures are completely silent** — `MC_ExtSetPointGenEnable.Error` ignored, FBs have no `bError` output. Load axis not ready ⇒ the Mentee half plays the whole file solo, nothing reports it. (Ironically the throwaway `FB_ExtSetpointProbe` surfaces errors properly.) |
| G6 | `FB_CsvPlayer.TcPOU:152` | `fElapsed : REAL` accumulated by 2.5e-4: playback runs ~2.3 % slow past ~2 048 s and **freezes (never terminates) past ~8 192 s**. Make it LREAL. Same pattern in FB_LoadMotorProfile. |
| G7 | `PRG_Motion.TcPOU:160-176` | CSV routing uses the **live** ADS config (`stCsv.nMenteeField/nLoadMotor/...`) instead of the FB's latched copy — the exact race the project already fixed for FB_TrajectoryGen (`nFieldOut`, with an explanatory comment 30 lines above). Pre-writing the next run's config mid-play injects samples into the wrong field/motor. |
| G8 | `FB_HighRateRecorder.TcPOU:104-110` | Ring overrun is **counted but not prevented** — the slot the host may be mid-read (each chunk ≈ 1 MB over ADS) is overwritten; the torn chunk has a valid-looking `nCount` and can't be identified. Host must re-check `nChunkSeq` after each bulk read, or FB should drop-newest instead. Host has ~1.5 s slack and must sustain ≈ 2.1 MB/s at 250 µs. |

Sync answer (asked of the design): the two channels **cannot drift** (one clock, one FB, same-cycle application) — the real desync modes are the 1–2-cycle ext-setpoint enable latency at start and, worst, G3/G5's *silent total absence* of one channel.

---

## 7. MAJOR — I/O & peripherals

| # | Where | Finding |
|---|---|---|
| H1 | tsproj links | **EL3702 channel 2 unlinked on both terminals** — `fCh2_Voltage` permanently 0.0 in GVL, snapshot and recorder; indistinguishable from a real 0 V. (`ST_AnalogInData.bError` is declared and never written by anything.) |
| H2 | tsproj | **EL3002 physically present, zero links** — invisible to the PLC; FB_IOHandler's analog path is circular like its digital one. |
| H3 | `FB_EncoderHandler.TcPOU:43-45` | 32-bit counter treated as **unsigned** — one count below zero reads +4.29e9. Needs `DWORD_TO_DINT` + rollover extension. |
| H4 | `FB_EncoderHandler` + tsproj | Encoder **status word/state byte not linked** — `bError/bCounterOverflow/bCounterUnderflow` permanently FALSE; frozen or faulted encoder looks healthy. Also `fbEncoder1`→A19 / `fbEncoder2`→A18 (reverse of rack order) — confirm intentional. |
| H5 | tsproj | **Entire UART bridge handler unlinked** — runs every cycle against zeros, host gets a plausible all-zero "healthy idle" status for hardware that isn't wired. Link it or remove the call + snapshot field. |
| H6 | `FB_UartBridgeHandler.TcPOU:100-121` | No comms watchdog — `nPacketCount`/`nTimestamp` read but unused for staleness; a hung bridge flatlines as valid data. One-cycle command pulses (250 µs) may also be missed by the slow UART firmware — retiming quadrupled that risk. |

---

## 8. Repo, config & hygiene

- **Tags:** two case-colliding series — capital `V1.x` (post-merge Dyno line) and lowercase `v1.x` (which *jumps histories*: v1.0.0–v1.2.7 on the unrelated `main`/PLC_motion lineage, v1.3.0+ on the main_tc line). On the Windows box that actually runs this (tagger `control@CONTROL-WIN`), `refs/tags/V1.1.0` vs `v1.1.0` collide on the case-insensitive filesystem. Retire one series (e.g., re-namespace capital tags to `dyno-V1.x`).
- **Dead files:** `POUs/MAIN_v127.TcPOU` and `GVLs/GVL_IO_v127.TcGVL` are on disk but not in the build — the only disk↔build discrepancies. Both declare the *same internal names* (`MAIN`, `GVL_IO`) as live objects; re-adding either silently collides. The merge doc's own checklist says to delete them — the last unfinished item. Also delete `FB_ExtSetpointProbe` (self-labeled "TEMPORARY, delete after verification"; carries the repo's only hardcoded cycle time, 1 ms).
- **No README** — the only doc is the (excellent) merge record. Nothing explains the two unrelated histories, tag scheme, target IP, or build/activate procedure.
- **No task watchdog** configured on any task; PlcTask at 250 µs runs with cycle-overrun unmonitored.
- **PlcTask (prio 2) preempts NC SAF (prio 4)** — inverted vs. Beckhoff convention (SAF normally highest). Both at 250 µs on one isolated core: deliberate or not, document it and check real-time headroom (double-check `LREAL_TO_DINT` etc. exec margins after the 4× retiming).
- **Floating library versions** (`Tc2_*, *`) — builds not reproducible across XAE installs; pin them.
- Small stuff: `UpgradeLog.htm` committed; orphan `Mantee Scope/` project not referenced by the .sln (duplicate of YT Scope, plus "Mantee/Mentee" spelling drift); `IO_Backups/…AX5112-0000-0214…xti` is a stale backup of a different drive revision than the live -0216; stale `*** MAP THESE AS PDO ***` TODO in tsproj for links that are in fact done; local `main_tc` one commit behind origin; `.claude/` untracked and not ignored; typos hostile to grep in a safety context (`SolonoidStatus`, `SolenoedMonitor`, `InitSysytem`, `Speps`).
- **CheckBounds** clamps silently and its violation counters are `VAR_STAT`-only — surface `nIndexUnderflow/nIndexOverflow` in the snapshot; they're currently the only sign of contract violations like G2/P5.

**Genuinely good hygiene (verified):** proper Beckhoff .gitignore (no generated files tracked on this lineage), `WriteLineIDs=False`, sorted XML, CheckBounds registered, no absolute paths, all tags pushed, no large binaries, and all plcproj Compile items exist on disk.

---

## 9. What's good (worth protecting)

- **FB_TrajectoryGen** is the strongest POU: config latched at start, latched `nFieldOut` routing with the race documented, `MAX(x,1E-6)` guards on every division, exact end-value landing, position anchoring, P2P forced non-repetitive with reasoning. Use it as the house style.
- **GVL_Sync snapshot pattern** — single-cycle assembly, `nCycleCount` + DC timestamp, recorder runs last on the assembled snapshot: coherent one-read telemetry with gap detection.
- **Live cycle-time pickup** (`_TaskInfo[GETCURTASKINDEXEX()].CycleTime` with 0-guard) — every profile/trajectory FB auto-tracked the 250 µs retiming with zero code edits. (The slot-2 pipe's `WAIT_CYCLES` is the one place that didn't get this — P2.)
- **Drive-level torque limit is real**: `fCurrentLimit_pct` clamped 0–100 %, scaled, and verified linked to both AX5000 "Bipolar torque/force limit value" MDT PDOs — a hardware-enforced cap that survives PLC bugs.
- **Recorder design** (SoA chunks for flat ADS reads, correct data→count→idx→seq publish order, partial-flush on disable, honest `nDropped` accounting).
- **The TwinSAFE hardware architecture itself is sound**: EL1918-hosted logic, safeEstop with restart on a *physical* pushbutton, EDM feedback, AX5805 STO on both drives, EL2904 contactor outputs. The gaps are all on the standard-PLC side of the fence.
- **Comment/documentation density is exceptional** for PLC code — ADS contracts, unit conventions, ordering rationale, firmware lock-step constants, and a genuinely high-quality merge record (`MERGE_PLC_v1.2.7_into_main_tc.md`).

---

## 10. Recommended action plan (ordered)

1. **Wire safety into motion (C1+C2):** gate enable/torque/trajectory/slot-2 streaming on `GVL_Safety.stTwinSAFE_IN.EStop_Ok` (+ Safety_Armed); on trip, pulse `bStopSync`/`stCsv.bStop` and zero the Mentee setpoint fields; put TwinSAFE state (not the dead bit) into `GVL_Sync.stSnapshot`; write `EstopPLC` from PLC-detected faults. Delete or genuinely link the fbIO digital path (EL1859 channels exist).
2. **Fix stop semantics (C3+S5):** `stCmd` → `VAR_IN_OUT` (or clear `bStop` in PRG_Motion); zero torque/velocity command fields when a profile stops or completes.
3. **Re-arm PLCopen FBs (S1–S3):** call MC_Home/MC_Reset cyclically with proper Execute handshakes; add abort conditions and a timeout to HOMING/ENABLING.
4. **Slot-2 walk robustness (P1–P5):** time-based waits from `fTaskCycleS`; verify `nVarCount` at walk end (already in the PDO); clear `q_inject` on configure and neutralize on error; copy the mirror-all fix into the TORQUE branch; `AND_THEN` the walk-advance condition.
5. **CSV/profile correctness (G1–G7):** `TRUNC` instead of round; validate `nCount`/`nLoadMotor`/shape/field with a visible reject flag; clamp the FF derivative; add `bError/nErrorID` outputs wired from the MC ext-gen FBs; `fElapsed` → LREAL; route CSV by latched selectors.
6. **Fix error reporting (M2–M4):** latch `bError` in the ERROR state (clear only on reset), include all FBs, priority-select `nErrorID`.
7. **Encoder & analog (H1–H4):** signed cast + rollover; link encoder status words and EL3702 Ch2 (or delete the fields); decide the EL3002's fate.
8. **UART bridge (H5–H6):** link it or remove it; add packet-count staleness watchdog; stretch command pulses to a time-based width.
9. **Repo:** branch for v1.3.3; retire the capital-V tag series; delete `*_v127` + probe FB + `UpgradeLog.htm` + orphan scope project; add a README (architecture, tag scheme, two-history explanation, deploy steps); pin `Tc2_*` versions.
10. **Runtime safety net:** configure task watchdogs; revisit PLC-vs-SAF priority; surface CheckBounds counters in the snapshot; extend the `nSlaveState`-style liveness pattern to safety mirror, encoders and slot-1.

---

## Not covered

The TwinSAFE `.sal` logic was reviewed structurally (FB inventory, safeEstop restart wiring, EDM) but not exhaustively verified block-by-block; the HMI visualization, NC axis parameterization details, and the Python host application (not in this repo) were out of scope. Findings on slave-firmware behavior (Mentee, UART bridge) are inferences from the PLC-side contract and worth confirming against MASTER_INTERFACE docs — notably the GROUP_ID bit-position contradiction (§5).
