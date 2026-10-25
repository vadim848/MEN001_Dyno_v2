# E2-G1 v2 — что не написано и почему (v2-tester, 2026-10-21)

SCENARIO_DECISIONS рабочая копия bdf55216…86fe (ответы Вадима Q-E2Q-01/02, Q-RC-12/15/16/17/19, Q-ARCH-04,
Q-REL-AFTER-PERMIT учтены). BLOCKED.md (v1) — история.

## Разблокировано и написано в v2
| Критерий | Где |
|---|---|
| EMGREF-LV вариант (2), момент C1 OFF (Q-E2Q-01 «А») | helpers/e2-emergency.js (Safe->R&D: q−1/q+1 как в Run) |
| SafetyFault в E2-02(L) (Q-E2Q-02 «А») | current-e2a-race.test.js — NV (todo) до появления символа |
| Q-RC-16 «А»: STP-I(4), гонка E2-Q1 с возвратом LV | current-e2c-stp-i.test.js (STP-I(4)), current-e2a-race.test.js (вариант Lr) |
| IL-05d(1)(3) (Q-RC-17 «Б») | current-e2b-cover-transitions.test.js |
| Q-REL-AFTER-PERMIT «А» | current-e2d-release-permit.test.js |

## Не написано
| Критерий / вариант | Причина | Этап / что нужно |
|---|---|---|
| E2-02 / IL-01 / IL-02 / IL-02b(b), EMG6-01 «CMD_*/Bypass удерживаются», HLT-03(e) — варианты PLC | E4 на полном пересмотре | E4 |
| IL-01 запрет Config (CFG-02), IL-04, IL-05c, EMG4-01, IL-05d(4) (откат Config) | Config — E4 | E4 |
| IL-05b(4), IL-05d(2) (откат WDG-01/02/03, Q-RC-12) | откаты watchdog — E6 (в canonical нет) | E6 |
| STP-H (Q-RC-15 «Б»: LV в SS1 → STO, R&D→Safe + SafetyFault) | E3 (нужна фаза SS1 STOP v2); вне путей поручения current-e2* | E3 |
| STP-G4/G5, STP-D+, STP-A/B/C/F (Q-RC-16 для защитного спуска из Run) | E3 | E3 |
| HLT-03 цепной после Run→R&D (Q-E2Q-02 «А» теперь задан) | наблюдается только через SafetyFault; переходная часть = HLT-03 на Safe | E3/E5 при появлении SafetyFault |
| Q-RC-19 «В» (FBK пропал при команде ON → Emergency) | новый критерий, аналитик ещё не разложил по фазам | аналитик → E5/E6 |
| Q-ARCH-04 «А» (Unlock в Safe при открытой крышке) | не E2 (Unlock) | срез Unlock/E5 |
| Q-RC-13 «Б» общий бит Fault | имя/сигнал — архитектор | E5/E6 |
| E2-03; E2-04 «во время работы» | структурное доказательство (ревьюер) | архитектура кандидата |
| POL-01(a) | структурно, покрыт сценариями | — |
| MU11 и эквивалентности N7/FBAnd8.AndIn5, N6/FBAnd18.AndIn4 | ревьюер, G4 | — |
| IL-02 граница N=u (UP в том же скане) | IL-02 называет её нормативной (отклонён), IL-05a — наблюдение (c=u); написана как наблюдение | аналитику |
