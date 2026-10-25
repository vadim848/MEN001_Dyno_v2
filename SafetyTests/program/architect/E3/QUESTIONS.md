# E3 architect questions (2026-10-24)

## Q-E3-1 — Unlock (blue 0.5 s) during StartingRun and its abort

Start: R&D→Run accepted (STO released, C2 ON or switching on, Run not yet confirmed), or the StartingRun abort is running
(discharge/hold/C2 OFF). Both buttons released for 2 s, then the operator holds blue for 0.5 s.
Why it is open: Q-ARCH-04/10 allow Unlock in Safe and R&D and forbid it in Run/Config/Emergency. TD-14 says StartingRun is a phase
inside the main state R&D, so a literal reading would allow Unlock. In canonical E2 this cannot happen, because the gesture filter does
not release in StartingRun. E3 must enable that release so that green can abort (D-STARTINGRUN-GREEN-DOWN), so blue becomes reachable.
Options:
- А (recommended, implemented in the plan): no Unlock in StartingRun or during its abort (`N12/FBAnd2` gated by ¬recRndC_SU and
  ¬linkAbortActive). After the abort ends in R&D, the normal R&D Unlock rule applies. Reason: HV is energised and STO is released.
  Opening the cover there is an Emergency (C-05, Q-RC-17(1)). This also keeps today's behaviour (D-TEAM-DEFAULTS: safety first).
- Б: allow Unlock in StartingRun as in R&D (literal TD-14 reading). If the cover is then opened, the result is an Emergency.
- В: allow Unlock only during the abort, not in StartingRun itself.
Affected: only N12/FBAnd2.AndIn5/AndIn6 (2 ports). The rest of the plan does not depend on this answer.

## Assumption A-E3-1 (not a question) — length of the discharge hold

D-HV-TIMED-COMPLETE says to use the "existing discharge hold". In the reference Step5 chain (Network8), C2 OFF comes about 1 s after
the Discharge command (`FBTon2` 1 s, started by FBAnd2 one scan after the request). `FBTon1` 1 s runs in parallel and does not add time.
Canonical E2 shows the same: E-01 HVD 7009, C2 OFF 8010. The plan therefore uses a new 1 s TON (DN_T_HOLD). The catalog only checks
C2 OFF ≥ DIS + 50 ms. If Vadim instead means 2 s (FBTon1 + FBTon2 in series), only that one timer parameter changes.
