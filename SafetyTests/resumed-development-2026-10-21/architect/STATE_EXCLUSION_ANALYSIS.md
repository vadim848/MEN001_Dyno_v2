# Safe / Armed state exclusion — technical source input only

2026-10-21. Exploratory source trace for root/analyst, not a new requirement, implementation plan or accepted global reachability proof. StateConflict destination remains undecided. Architect edits no source/shared decision file. Current working SAL59bf... and pairedGVLc31e... pass source-firstnative structure and typed binding audits; the P0 resource proposal preserves these functional state equations.

## Exact native state and producer cones

Safe=b_Step1, Network3/FBRs1(order20 before P0 rerank). Reset comes from FBOr1: bStep1Reset (N4liveorphan), Step2Set path viaFBOr4, bStep12, bStepRnd. Set comes from FBOr2: bStep1Set(N4liveorphan), initialnone-state FBAnd1, bStep1Set2(Network9 Step6 completion), bStep1Set3(Network5 failure return), and bStep2Set2(Network12 LVdown completion). NativeRS is reset-dominant.

Armed/Run=b_Step3, Network3/FBRs3(order48). Reset comes from FBOr5: bStep3Reset(N4liveorphan), actualStep4 and bStep12Set2. Set comes from FBOr6: bStep3Set3(originalStep2/Network5 completion) and bStep3Set2(Network12 RnD launch confirmation). RunSet does not directly appear in SafeReset FBOr1; SafeSet does not directly appear in RunReset FBOr5. Therefore the source has no general symmetric last-writer interlock proving Safe AND Run impossible for arbitrary input requests.

Meaningful actual producer constraints are stronger than arbitrary request injection:

- Network12 LVdown completion bStep2Set2 requires actualdown request AND C1FBKOFF AND C1commandOFF AND C2commandOFF AND C2FBKOFF plus currentpermits/Mentee/False guards.
- Network12 Runconfirmation bStep3Set2 requires actualRnDup chain,0.1s qualification,C2FBKON and sourceHVHealthy predicate. Hence simultaneouscurrent-scan C2feedback conditions are contradictory under stable-per-scan inputs, but early/late native publication and a retained previous RunSet require chronological proof, not a static same-scan Boolean claim.
- OriginalStep2 Runconfirmation depends actualStep2/retainedtimers/Healthy/STO confirmations. SafeReset includes Step2 ownership, but reset dominance and exact source timing still need real producer-cone proof through startup/return.
- Safe completion through Step6 is downstream of protective stopping and C2OFF; original state latches/reset routes constrain actual overlap. A fixture directly setting SafeSet and RunSet bypasses this evidence.
- N4 unsourced outputs can syntactically assert both requests, but no nativeunbound input value has been proved. Such a condition is unsupported/conditional, not proven legal external-input reachability. The liveN6 unsourced transition channel is another separate source gap.

Root reported three explored actualproducer paths with no overlap, versus a STATE test that explicitly injects Set1+Set3_2. Those bounded results do not prove wholeBOOT/allinput exclusion and must stay labeled accordingly. This file does not reinterpret an injected counterexample as a demonstrated operating defect, nor declare the missing structural guarantee acceptable.

## Required next analytical frame

Separate stable Safe, stableRnD, stableRun and allowed transitional gaps; enumerate all actualSet/Reset producer cones, their physical/PLC acceptance constraints and writer order. Test source-derived histories from declared entry, every acceptedphasehandoff and relevant feedback/criticalcoincidence without postentry owner seeds. Preserve current conditionalSTATE test as an independent safety-boundary probe. Any program repair must preserve known complete sequence, reset dominance/priority and all native group/hardware metadata, and must not choose Emergency versus TransitionFault merely to satisfy a test.

Root/independent analyst owns expected-state/recovery decisions before any exclusion repairplan. No source change or requirement extension is proposed by this technical note.
