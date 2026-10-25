# Physical-buttons architecture preparation — 2026-10-20

STATUS: CANCELLED PROPOSAL PREPARATION. Vadim cancelled all behavioral changes
proposed by Niv on 2026-10-20. These notes are historical only and authorize no
implementation or test-oracle changes. Prior Vadim-approved requirements govern.
The short-Reset questions below no longer require an answer for this cancelled
proposal. No source/tests were changed for it.

Read-only notes for the newly supplied physical-only policy. No implementation or test oracle changes are authorized by this document. Existing PLC transition variables/branches remain present and are deferred, not removed.

## Latest policy received from coordinator

Safe BOTH -> RnD; RnD BOTH -> Armed. Armed short Reset -> RnD; RnD short Reset -> Safe. Broken safety/EStop in Armed causes gradual down. Door may be open during Safe->RnD, must be closed for RnD->Armed. Unlock only Safe/RnD. C3 and BMS may operate in RnD and Armed. Analyst owns normative decision record; these notes do not replace user wording.

## Decision needed before implementing short Reset

The first green press in RnD is also a valid first half of BOTH when blue joins within <=250ms. The code cannot know on the green press edge whether blue will join in the future. Therefore immediate down on that edge and non-disruptive green-first BOTH cannot both be guaranteed without an explicit arbitration rule.

Preferred precise clarification to user: in RnD, green is pressed and blue joins within250ms; should the controller wait for green release to recognize a short single press while allowing BOTH in the meantime? If immediate press-edge down is required instead, the user must define whether to delay down for the chord window, suppress green-first BOTH, or interrupt an accepted down. None may be silently chosen. Existing D-LATE-SECOND prohibits rollback of an already accepted single transition and must not be overridden accidentally.

Further boundary once trigger chosen: does short mean any press/release duration, duration below a stated threshold, or existing500ms qualification with early release semantics? No new timer number may be invented. The same physical attempt must not trigger Armed->RnD and then RnD->Safe merely by remaining held through the mode change. Existing full-release/rearm and one-command-per-attempt rule should be preserved unless explicitly superseded. A fresh second Reset must be distinguishable from the first event.

Run BOTH policy already says ignore a valid BOTH and do not degrade a failed chord to single until full clear. This must be reconciled with the new short Reset recognition across both RnD and Armed, rather than implementing a second raw Reset path.

## Actual input consumers relevant to open-door RnD

Source: `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`, audit baseline SHA25659bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33. Native serialization preflight and full typed bindings passed before initial routing trace (ARCHITECT.md). All listed references resolve by exact binding, not basename.

`in_InterLock_NC_1` and `_2`, positive logic consumers:

| Consumer | Input ports NC1 / NC2 | Function |
|---|---|---|
| Network2/FBAnd1 | AndIn5 / AndIn6 | Step1 ready chain; both required before ReadyForStep2 |
| Network1/FBAndLvCurrentPermit | AndIn4 / AndIn5 | Shared current LV/HV/STO Set permission; both required |
| RndPhysicalCompact/GATE_001 | AndIn5 / AndIn6 | Shared recognizer enable; both required |
| Network12/FBAnd16 | AndIn1 / AndIn3 | RnD->Armed energy-up guard; both required |
| Network6/FBAnd9 | AndIn2 / AndIn3 | Armed safety permissive; failure starts original stop route |

`in_Door_Monitor` consumers only:

- Network2/FBAnd8.AndIn1: inverted, resets Unlock request within Step1.
- Network12/FBAnd11.AndIn1: positive, RnD Unlock set condition.
- Network12/FBAnd17.AndIn1: positive, RnD Unlock reset condition.

No hardware/channel origin inquiry is needed or authorized. Required software clarification only if approved sources do not specify it: what logical values of NC1/NC2 correspond to the newly allowed open-door Safe/RnD condition? If opening the door makes either false, the current common recognizer/ready/Set gates prohibit the newly permitted Safe->RnD or RnD operation. Moving only a DoorMonitor consumer cannot solve that; the current source already limits DoorMonitor to Unlock. Conditional phase-specific guards would need an approved architecture while preserving bothNC for RnD->Armed and Armed protection. Do not remove shared guards based on an assumed physical interpretation.

## Prepared technical scope after clarification

- One physical command acceptance/owner layer for both RnD and Armed; prohibit duplicate raw single qualification and carry-over acceptance across transitions.
- Explicit dispatch by accepted command and current stable mode, with emergency/stop precedence and no accepted up/down collision.
- Keep distinct accepted-event memory, transition-owner memory, actuator request memory and output hold conditions; consuming an attempt is not completing a transition.
- Retain early STO launch policy and agreed stop wait/discharge sequences; short Reset changes event recognition, not timer numbers or stop completion.
- Verify Safe->RnD and RnD->Armed as separate permission cases, including open/closed software inputs, fresh/repeated/held gestures and both first-button orders.
- Deferred PLC routes must be inventoried as remaining alternate producers; physical-only acceptance claims cannot silently prove absence of PLC-triggered actions while those routes remain live.

Limits: root's short Reset trigger question is pending. No source changes or new normative timing expectations should precede its answer and analyst reconciliation. Current application lacks full BOOT/group and native/target acceptance; these notes claim neither.
