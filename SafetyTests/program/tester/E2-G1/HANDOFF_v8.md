# HANDOFF v8 — E2-G1 (ревью G1 v7: N16, N17, m-15, m-16, m-18; дополнения ведущего: REL01-e2-LATE/TD-07, TD-08, TD-09, TD-10, D-E2d-1, E2d-COV-1, M-E2b-21, пины подграфов, путь mentee)

Срез / роль / дата: E2 G1 v8 / v2-tester / 2026-10-22.

## Источник
- Canonical F1 не менялся: SAL `04b45456…d28a3`, SGVL `dc103abe…a9104`, diagram `de02bbff…a603`. HEAD `dbca5dd`.
- Oracle (SHA256):
  - analyst E2-G1-v7-q/CRITERIA.md `4f6d2916…6e65` — §1 очистка 2 с; §3 FBK-05/06-W/-NEG/-POS/-CMD; §4 STP-006, IL-05d(1), STP-I;
  - analyst E2-G1-v7-m/CRITERIA.md `c61c334a…f68f641` — REL01-e2-LATE, TD-07; m-17: база boot Safe подтверждена, не менялась;
  - analyst E2b-dev/CRITERIA.md `142b2b9d…` — TD-08 (точка A), D-E2d-1, E2d-COV-1;
  - analyst E2-v73-q/CRITERIA.md `2ee04ebb…f9bfe` — TD-09 (t_a = `linkRunDownOwner`), TD-10 (L2-SU);
  - SCENARIO_DECISIONS.md `5a148eed…` (TD-07…TD-10);
  - reviewer/E2-G1-v7/G1_REVIEW.md `1a9e89ba…5138`;
  - architect PLAN.md v7.3/v7.4 и MUTATION_PLAN_E2b.json — только цели мутаций и имена маркеров, не oracle.
- program/editor/** не читал.
- Кандидат E2b v7.2 (`candidates/E2-v7.2/E2b/native`, SAL `386e208b…`) запускался только в sandbox вне репозитория:
  - поиск убийцы M-E2b-21;
  - проверка, что код TD-08/09/10 исполняется.

## Сделано (SHA256, 12 знаков)

| Файл | Изменение |
|---|---|
| current-e2d-fbk-window-abort f1babb2835a7 | **N16, переписан целиком.** **-W** (12): стимул v7 против X0 (те же входы без зелёной). Выходы, стадии и статусы равны X0 в [u, w+3000+T_DIS] и на всей трассе. Откат окна: в [u, w−1] нет, начало ≤ w+1; 05 — последовательность STP-E/Q-RC-12, 06 — откат в Safe. Нет Emergency, SafetyFault ≤ w+1 (NV). **-NEG** (10): варианты (a)/(b)/(c). **-POS**: 6 норм. + DIAG rb+2000 + аварийные сочетания (3 норм. + 1 DIAG). **-CMD** (12): todo «BLOCKED-E4» → NV |
| current-e2a-dis-hold eb36382f2f35 | **N17:** STP-006 — пауза OFF 2100 мс |
| current-e2b-cover-transitions 951411ad3524 | **N17:** IL-05d(1) green — пауза 2100. **TD-08:** точка A по `recRndC_SU` ∨ C2 ON ∨ STO снят; без Symbol — ERROR. c=A−1 → отказ; c=A → дизъюнкция; IL-05a-A c=A+1 (×3), подъём в самом c — FAIL. **COV-1** (9): NC1/NC2/обе × {u−1, u, u+1}. **TD-09:** t_a = `linkRunDownOwner`, отката к t_a(obs) нет — ERROR. t_a−1 (×3), c=t_a — дизъюнкция (×3), t_a+1 (×3, добавлен NC2); TA-OWNER §1.2 (q_G−1/q_G+1, 499 мс). **TD-10:** L2 эталона StartingRun по окну [d−1, d+1]; для причины в SU нижняя граница d−1 |
| current-e2c-stp-i 9088f67083e0 | **N17:** только имя («BOTH remainder …») |
| current-e2b-rel01-e2 870458c24a25 | **REL01-e2-LATE (TD-07):** s ∈ {Q, Q+1, Q+2, Q+401, l0, l0+1}. **Убийцы M-E2b-42…45:** эпизод 200 мс при удержании BOTH → нет подъёма до rb+2100; новый жест → Run / R&D (4 теста) |
| current-e2d-fbk-unsolicited ecce4dfa17a2 | **m-16:** KF-5 — поскановые запреты в [t+10000, t+25000] |
| current-native-structure 15ce8f1dcd45 | **m-15:** чтение через `V2.salUrl` / `V2.gvlUrl` |
| current-e2b-connector-safe 571c57150416 | **TD-08:** A = b_Step12 ∨ C1 ON; строки A−1, A (дизъюнкция), A+1 (EMGREF-LV, C1 ни в одном скане ≥ e); строка u+1 оставлена |
| current-mentee-set-permit 614ac40d87dd | Путь через `V2.salUrl` + `parseOptions`. **D-E2d-1:** LV-строки NC1/NC2 судятся по маршруту: Step12 → Set (V14-Q7); legacy Network5 → запрет (4 теста). HV-строки без изменений |
| current-step12-lv-permit fb71ca02f49f | **D-E2d-1:** то же для truth table и paired producer |
| current-e2d-first-fault-scan 3f584dc1d526 **новый** | **Пины подграфов (D-E2b-4), поведенческий аналог.** Маршруты: BOTH R&D→Run, legacy (1,1) R&D→Run, BOTH Safe→R&D. Причины — 8 входов в скане e = u: нового выхода подъёма нет; Safe→R&D + NC → как без события. Окно — до конца трассы (EMGREF(2)). Исключение — legacy + NC: окно [e, e+299], потому что A = u (наблюдение TD-08), а позднее исполнение уровня — это KF-3 (24 теста) |
| current-e2d-fbk-k3ack 1bd0c9e9e15a | **M-E2b-21:** новый тест FBK10-K4: BOTH-1 квалифицирован при FBK ON (p=g−2000), удержан через FBK OFF до g+2000, отпущен на 2100 мс → в [p, r+2099] нет подъёма и нет перехода (Q-V7-04 «Б», E6-Q2, п.13). 3 теста |
| current-e2a-emg-anchor 88b1cbe698b2 | Самотесты: **TD-10** (−2/−1/0/+1/+2/never/absent; L1-SU нижняя граница) и **TD-09** (маркер, отсутствие → ERROR, never → null). Синтетика C4: маркер на 3 скана раньше выходов |
| helpers/e2-rule-l ad058f31c00d | `L2su` (TD-10), `L1suLower`. Промежуточный `L2pending` (NV «ждёт V73-B») удалён после ответа аналитика |
| helpers/e2-emergency d2ea093e8930 | `downTa` = первый `owner` TRUE (TD-09). Без Symbol — throw ERROR; `downTaObs` — только diagnostic. StartingRun: `L2su` + `L1suLower` |
| helpers/e2-lifecycle 8ad7381da2a5 | В snapshot добавлено поле `owner` (`linkRunDownOwner`, undefined без Symbol) |

- current-e2*.test.js: 27 → **28** файлов.
- **m-18:** база вне E2 в HANDOFF_v7 — **479** (baseline-v6), а не 481.

## M-E2b-21 (GATE_030.OrIn5) — убийца найден
- **Метод.** Sandbox вне репозитория: E2b v7.2 base и мутант (`applyMutation` deactivate-input). Перебрано 35 сценариев (`scratchpad m21/run.mjs`).
- **Расхождение на двух сценариях:**
  1. Safe, C1_FBK ON без команды 3000 мс, BOTH от f+1000 удержан через FBK OFF. Мутант: b_Step12 на f+4001; база остаётся Safe.
  2. R&D, крышка открыта, BOTH, повторное нажатие без 2 с очистки. На v7.3 это гасит SPOIL_R, убийцей не считается.
- **Убийца:** «E2d FBK10-K4 (S1)/(S2) BOTH-1 qualified while … ON (p=g-2000 …) … attempt consumed».
  - Base E2b: `ok # TODO` (NV по SafetyFault, наблюдаемые проверки PASS).
  - Мутант: FAIL (ERR_ASSERTION, подъём на g+102).
  - (R) на base E2b падает: FBK-10 в R&D до E2d не гейтирован. Это не убийца на E2b.
- **Перенос на v7.3 — допущение, не измерено.** SPOIL_S требует `!linkConnectorsOk`, а connectors здесь TRUE. Значит, SPOIL неактивен, и результат должен перенестись на v7.3. Самого кандидата v7.3 в candidates нет — перепроверить на G3.
- **Без расхождений (кандидаты в equivalentBySearch для остальных путей):** late second 300 мс (обе очерёдности, Safe/R&D); single + добавленная вторая; BOTH на r+1999 и r+500; HV/LV Faulty при удержании; BOTH во время спусков R&D→Safe и Run→R&D; BOTH в Run; удержание принятого BOTH в следующее состояние; EStop/ES_NC_1 с BOTH через Restart; legacy (1,0)/(1,1) с BOTH; BOTH 999 мс; δ=250/251; Unlock + green; C3 manual; Mentee 1 скан; STO FBK; крышка в Safe; крышка в R&D без повторного нажатия; C2_FBK-10 в R&D.

## ID матрицы и их новый статус (только факт)
Ничего не закрыто. Затронуты:
- WDG-001, WDG-003, MOD-008 (CMD — BLOCKED-E4);
- BTN-001/002/003/006/007;
- MOD-001/002/004/005/006;
- STP-001/004/005/006;
- EMG-001/002/003/004/005/011;
- CVR-004/006;
- WDG-004.

## Команды воспроизведения
```
cd SafetyTests
node --test --test-reporter=tap test/current-e2*.test.js > e2.tap && node program/tester/E2-G1/summarize.mjs e2.tap
node --test --test-reporter=tap $(ls test/current-*.test.js | grep -v current-e2) > non-e2.tap
npm run check:software
# DIAG, не нормативно: E2_LV_HEALTHY_MODE=split node --test test/current-e2d-fbk-window-abort.test.js test/current-e2d-first-fault-scan.test.js
# кандидат: корень с MEN001_Dyno/Safety_Dyno из candidates/E2-v7.2/E2b/native (вне репозитория), затем
E2_SOURCE_ROOT=<root> node --test test/current-e2b-cover-transitions.test.js test/current-e2b-connector-safe.test.js test/current-e2d-first-fault-scan.test.js test/current-e2a-emg-run.test.js
```
baseline-v8/ (финальный прогон): e2-g1v8.normative.tap, e2-g1v8.summary.jsonl (999), non-e2.tap, check-software-v8.out, e2-time.txt.

## Результаты (canonical F1)

### E2 — 999 тестов (v7: 888)
Удалено или переименовано 44, добавлено 155. У сохранённых имён статус не изменился (0).

| Класс | PASS | FAIL | NV |
|---|---|---|---|
| нормативные (938) | 94 | 796 | 48 |
| DIAG (39) | 39 | — | — |
| KF (22) | 0 | 22 | — |

Классификатор FAIL (воспроизводимый):
- ERROR = «ERROR stand» в ошибке;
- покрытие = `precondition not reached|unreachable|stages=b_Step12`;
- остальное — содержательный RED.

**FAIL 796 = 2 ERROR + 618 покрытие + 176 содержательных RED.**

- **ERROR TD-09 на F1 (2):** «E2b TA-OWNER …» ×2 — `linkRunDownOwner absent`.
  - Остальные потребители TD-09 на F1 падают раньше, на недостижимости Run/R&D (покрытие). Это IL-05b(1)/t_a−1/t_a, rd-sweep, emg-rundown.
  - На F1 они дали бы тот же ERROR. Ни PASS, ни FAIL логики.
- **Содержательные RED: 176.**
  - Тот же классификатор на v7 даёт 140. Минус 4 FBK-06 v7 (N16: недействительная зелёная) — база 136.
  - Новые и изменённые:
    - FBK-06-W (6) — нет WDG-01 на F1;
    - FBK-06-NEG (5), FBK-06-POS (3+1) — F1 объявляет R&D при LV Faulty TRUE. Условная атрибуция D-ARCH-POL;
    - REL01-e2-LATE Safe (15) — подъём после восстановления / без Emergency;
    - REL01-e2 Safe эпизод 200 мс (2);
    - EMG4-03 A/A+1 (4);
    - FFS Safe→R&D (4): NC — V14-Q7 не на F1; connectors — C1 ON после снятия причины без Restart;
    - FBK10-K4 «qualified while ON» S1/S2 (2) — F1 поднимает после FBK OFF.
- R&D-зависимые новые тесты (IL-02-A, IL-05a-A, COV-1, TD-09, FBK-05, FFS R&D, REL01-e2 R&D) — покрытие.

### Вне E2 — 487 / 466 / 21 fail
- 16 EARLYSTO и 2 rnd-down — как в v7.
- Новые содержательные RED F1 против V14-Q7 (D-E2d-1): MENTEE05 paired LV/Step12 NC1/NC2 (2) и «LV current SAL: paired real producer …» (pass→fail).

### check:software — exit 4
- harness 284/284, historical 75/75.
- current 1484 / 597 / 839. SAL {199, 1, NV 7}. case IDs 0/0.
- tests: missing 33, added 672, statusChanged 4: EMG6-01 fail→pass (как v7), 2 rnd-down (как v7), paired producer (D-E2d-1).
- expected deltas 34 / explained 26 / **unexplained 8** — все переименования, фрагмент ниже. Exit 4 только из-за них.

### Кандидат E2b v7.2 (справка, не приёмка; sandbox)
- PASS:
  - TD-08: connector (A−1/A/A+1/u+1), c=A, c=A−1;
  - TD-09: t_a−1/t_a/t_a+1, TA-OWNER;
  - COV-1 c=u+1, IL-05b(1);
  - FFS: BOTH R&D→Run все причины; legacy — 6/8.
- **RED по нормам TD-10 (передать аналитику и архитектору):**
  - IL-05a-A c=A+1 и COV-1 c=u−1/u: HV Discharge при `in_Estop_PLC` и NC на +7006 против Run +7010 (−4). При e ≤ u C2 ещё не ON.
  - emg-run ES_NC_1/ES_NC_2/Mentee в StartingRun: C1 OFF +2003 против Run +2005 (−2, нижняя граница L1-SU).
- rd-sweep / Run-down: EMG-RD-L STO +3 против W_N t_a+2000 — честный RED до E3 (E2-v73-q §1.4). L2 Run-down C1 OFF −1 — FAIL (TD-10 только для SU).
- FFS legacy NC1/NC2: C2 ON после восстановления крышки при удержанной (1,1) — KF-3. После сужения окна до [e, e+299] эти два теста повторно не прогонялись.
- IL-05a c=r+1: «SS1@0» был артефактом моего расширения «c vs c−1». Исправлено: правило применяется только к строкам TD-08. Повторно на кандидате не прогонялось.

## Допущения и пределы
- A1–A9, A12. Скан 1 мс, программная модель. Native/IDE/Target/hardware не проверялись.
- FBK-05/06:
  - StartingRun = C2 ON при снятом STO и ни Run, ни R&D (конвенция STP-I);
  - «не Safe» = нет b_Step1 и C1 ON;
  - моменты Emergency в аварийных сочетаниях — diagnostic;
  - T_DIS = 1000.
- REL01-e2-LATE: a — по стадиям подъёма. Момент Emergency здесь не ограничен.
- KF-5: «вне перехода» = сканы ≥ t+10000.
- FFS: причина снимается в e+300 без Restart; legacy+NC — окно [e, e+299].
- M-E2b-21: перенос на v7.3 выведен рассуждением (SPOIL неактивен при connectors OK), не измерен.
- Внутренних инъекций нет, все стимулы — входы программы. Маркеры `linkRunDownOwner` и `recRndC_SU` — точки наблюдения по TD-08/09, не oracle.

## Не сделано / остаток
1. Пины подграфов не переписаны:
   - plc-pulse «Undeclared source cut FBOrIlRunOk»;
   - R3PAIR (current-estop-native-pairs);
   - safe-run-gestures;
   - SAFEINPUT GATE_001 (current-safe-input-slots);
   - hv «stale aggregate» и step12 «paired producer» — остаются на F1-подграфе.
   
   Поведенческий аналог последних двух — FFS, кроме маршрута AND6 (NV: стимул на уровне входов не выведен). Структурные пины (ID портов, «242 блока», `model.crc` в MENTEE05 original) по сути F1-identity. Предлагаю перенести их в V2ID по образцу S2 — решение ведущего и стенда.
2. PRIORITY:Step12:ExternalNC1/NC2 «no new LV command» (src/current-code-checks.js) — файл стенда; заменить по E2b-dev §2.3.
3. TD-09: строки Healthy (HV/LV Faulty при t_a−1/t_a/t_a+1 — STP-G против STP-D/H, нормы E3) не написаны. `in_Estop_PLC`/ES_NC_1 на t_a±1 покрыты rd-sweep через `downTa` по маркеру.
4. Мутационный прогон (G3) не выполнялся. Повторно на кандидате не прогонялись FFS legacy и IL-05a r+1 после последних правок.

## Вопросы аналитику (через ведущего)
1. **TD-10, e ≤ u.**
   - Исходно: StartingRun, точка A (SU) поставлена, C2 ещё не ON и STO не снят.
   - Событие: `in_Estop_PLC` (или NC) в e ∈ {A+1, u}.
   - Факт E2b: HV Discharge +7006 против Run +7010.
   - По TD-10 это FAIL (−4). Применим ли d_Run Run-эталона к Discharge, когда C2 ещё не включён?
2. **TD-10, L1-SU.** ES_NC_1/2 и Mentee в StartingRun на E2b дают C1 OFF +2003 при Run +2005 и `in_Estop_PLC` в SU +2004. По нижней границе это FAIL. Подтвердить.
3. **Маршрут AND6** (existing-retry) для HV-строки §2.3: какой входной стимул его задаёт?

## Что передать следующему и кому
- **Ведущему/стенду — фрагмент expected-deltas F1 (04b45456…json, `tests.current`, 8 записей):**
```json
[{"name":"E2b IL-05d(1) StartingRun (HV Faulty TRUE holds it) aborted by green 600 ms, NC1 FALSE 100 ms after the abort -> Emergency (rule L vs in_Estop_PLC in the same phase), Restart -> only Safe","reason":"Review G1 v7 N17 / analyst E2-G1-v7-q §1/§4: the abort green 200 ms after the BOTH release is invalid (full 2 s clearing required); stimulus pause 2100 ms, renamed 'E2b IL-05d(1) StartingRun (HV Faulty TRUE holds it) aborted by green 600 ms after a 2100 ms full clearing, NC1 FALSE 100 ms after the abort -> Emergency (rule L vs in_Estop_PLC in the same phase), Restart -> only Safe'. Oracle unchanged; F1 coverage FAIL before and after.","proposedBy":"v2-tester"},
 {"name":"E2c STP-I green 600 ms pressed during the abort (c=u+50, press c+10): not executed - C1 not dropped before C2_FBK OFF","reason":"Review G1 v7 N17 / analyst E2-G1-v7-q §4: rename only - the stimulus is the BOTH remainder, not a fresh green; new name 'E2c STP-I BOTH remainder during the abort (c=u+50): blue released at c+10, green kept from the BOTH gesture (not a fresh green) -> not executed - C1 not dropped before C2_FBK OFF'. Stimulus/oracle unchanged; F1 coverage FAIL before and after.","proposedBy":"v2-tester"},
 {"name":"E2b IL-05b boundary: NC1 FALSE in t_a-1 (before the down is accepted) -> IL-03 Emergency (rule L vs in_Estop_PLC), no normal R&D, Restart -> only Safe","reason":"TEAM-DEFAULT TD-09 (analyst E2-v73-q §1.3): t_a = linkRunDownOwner; renamed 'E2b IL-05b boundary: NC1 FALSE in t_a-1 (t_a = linkRunDownOwner, TD-09; before the down is accepted) -> IL-03 Emergency (rule L vs in_Estop_PLC), no normal R&D, Restart -> only Safe' (+ NC2, both rows). Oracle unchanged; on F1 FAIL (Run unreachable; without the marker the test is ERROR by TD-09) before and after.","proposedBy":"v2-tester"},
 {"name":"E2b EMG4-03 boundary: LV connector FALSE in u-1 (one scan before Safe->R&D acceptance) -> EMG-003: UP rejected, no Emergency","reason":"TD-08 (analyst E2b-dev §1.4): boundary moved to A-1 (A = first b_Step12 or C1 ON scan); renamed 'E2b EMG4-03 boundary: LV connector FALSE in A-1 (one scan before the first Safe->R&D acceptance sign, TD-08) -> EMG-003: UP rejected, no S12, no Emergency' (stricter). PASS on F1.","proposedBy":"v2-tester"},
 {"name":"E2b EMG4-03 boundary: HV connector FALSE in u-1 (one scan before Safe->R&D acceptance) -> EMG-003: UP rejected, no Emergency","reason":"TD-08: as the LV row; renamed '… HV connector FALSE in A-1 …'. PASS on F1.","proposedBy":"v2-tester"},
 {"name":"E2d IL-02 boundary NC1 FALSE in N=u-1 (UP qualifies in N+1): UP rejected - no C2 ON / STO release, R&D and LV kept, no Emergency; not executed after the cover closes","reason":"TD-08 (analyst E2b-dev §1.3/§1.5): refusal boundary moved to c=A-1; renamed 'E2d IL-02 boundary NC1 FALSE in c=A-1 (A = first acceptance sign, TD-08): …'. Oracle unchanged; F1 coverage FAIL before and after.","proposedBy":"v2-tester"},
 {"name":"E2d IL-02/IL-05a boundary N=c=u (NC1 FALSE in the UP acceptance scan): normative disjunction - (i) UP rejected, R&D, no Emergency, or (ii) Emergency by rule L with EMGREF-RUN; never Run","reason":"TD-08 (analyst E2b-dev §1.3): the disjunction moved to c=A; renamed 'E2d IL-02/IL-05a boundary c=A (NC1 FALSE in the first acceptance-sign scan, TD-08): …'. Logic unchanged; F1 coverage FAIL before and after.","proposedBy":"v2-tester"},
 {"name":"E2d IL-02/IL-05a boundary N=c=u (both FALSE in the UP acceptance scan): normative disjunction - (i) UP rejected, R&D, no Emergency, or (ii) Emergency by rule L with EMGREF-RUN; never Run","reason":"TD-08: as the NC1 row; renamed '… c=A (both FALSE …)'.","proposedBy":"v2-tester"}]
```
  - statusChanged (информационно): «LV current SAL: paired real producer prehistory denies stale Set on first fault scan» pass→fail — D-E2d-1 / V14-Q7.
- **Стенду:** PRIORITY Step12 NC (п. 2 остатка); решение по переносу структурных пинов в V2ID (п. 1).
- **Архитектору (C5, G3):**
  - testFiles = 28 (+ current-e2d-first-fault-scan.test.js).
  - Убийцы:
    - M-E2b-21 — «E2d FBK10-K4 (S1)/(S2) BOTH-1 qualified while … attempt consumed»;
    - M-E2b-42 — REL01-e2 R&D NC1/NC2 «permit FALSE 200 ms …» и REL01-e2-LATE R&D;
    - M-E2b-43 — то же для Safe connector;
    - M-E2b-44/45 — положительная часть этих тестов и REL01-e2 r=f−1;
    - M-E2b-46 — «E2b REL01-e2 control …» (стек E2d);
    - M-E2d-17…22 — «E2d COV-1 …» и «E2d FFS R&D->Run … NC1/NC2».
  - FBK-05/06-W/NEG/POS теперь можно включать в kill-базу.
  - TD-10 RED на E2b — см. вопросы 1–2.
- **Аналитику:** вопросы 1–3.
- **Ревьюеру:** N16, N17, m-15, m-16, m-18; REL01-e2-LATE; TD-08/09/10 (вкл. самотесты); COV-1; D-E2d-1; FFS; M-E2b-21.
