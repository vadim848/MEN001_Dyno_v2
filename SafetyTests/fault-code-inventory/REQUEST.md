# Request — count software fault / stop-reason variants

Date: 2026-10-21. Requester: Vadim, conveyed by coordinator. Architecture and inventory only.

## Task

Inventory the errors and protective stop reasons implied by the present approved requirements, then show whether a future binary diagnostic number to PLC could fit4bits (0=no fault,15 nonzero reasons), or would benefit from5bits (31 nonzero). Explain which reason stopped a transition/system, distinguish unavailable current detection from implemented fault memory, and avoid claiming a final exact number when semantic grouping remains open.

## Sources and boundaries

Read exact original commit4495a1f6049f6a58ebfd436761faa84d17c8d643 first; latest Vadim decisions in SCENARIO_DECISIONS.md supersede historical proposals/spec wording. All Niv behavioral proposals are canceled. Continue approved single500/BOTH1000/window250/release2000, DoorMonitor-only solenoid role, current NC guards and existing timers. Most recent confirmation includes press-only immediate acknowledgement of the described rolled-back upward-transition SafetyFault, with acknowledgement attempt consumed and bothOFF2s/new attempt before any normal command.

No fault-code implementation, SAL/SGVL/PLC source edits, mappings, hardware/group/target settings, timer changes, equipment, download, native validation or push. This request does not authorize implementing a Fault latch or diagnostic arbitration. Existing IDE validation/CRC/ADS issues are not the requested operating-fault catalogue.

## Deliverables

- ARCHITECT.md: source/SHA/preflight evidence; enumerated cause families and optional detail split; detection/reset/stop consequence status; exclusions; bit-capacity alternatives and narrow unresolved semantics.
- Independent analyst reconciliation of requirement taxonomy and verifier check of catalogue count/dedup/source limits; owned separately.
- Provisional semantic row labels only. Future numeric assignments, trigger limits, fault retention and simultaneous-error selection require later decisions; none adopted here.
