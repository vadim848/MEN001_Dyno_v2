# HANDOFF v3 — E2-G1 (тесты до кода, доработка по G1_REVIEW v2 N1/N2/M-a/m-b/m-c/m-d и CRITERIA_DELTA_v4)

Срез / роль / дата: E2 G1 v3 / v2-tester / 2026-10-21.

Источник (canonical F1, не менялся; HEAD b580920):
SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3,
SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104, diagram de02bbff…a603.
Oracle:
- SCENARIO_DECISIONS.md рабочая копия **ff59e2f8372c873926dce18a2e6551176e3a8de9a497f97c6a651cf9329ca645**
  (на старте bdf55216…86fe; затем 8fcf168e…1802 с Q-RC-RUNCONF-01 «В»; затем ff59e2f8… с Q-ARCH-10 «А»);
- CRITERIA_DELTA_v4.md (рабочая копия 2b405938d002…) и QUESTIONS.md в program/analyst/E2-G1-v2-questions;
- program/analyst/E2-runconf/CRITERIA.md (9607276bce6f…) — RC-1…RC-7, далее поправлено ответом «В»;
- G1_REVIEW v2 (N1, N2, M-a, m-b…m-f).
Reference 4495a1f: SAL из fixtures/pinned (efddc60b…0dc334, проверка SHA в src/pinned-sources.js);
SGVL — копия git blob в test/helpers/e2-ref-4495a1f/GVL1.sgvl (8020e3d6…b5e757, SHA проверяется в helper).
Соседний репозиторий в рантайме не читается.
Node v22.22.0. Код программы, стенд, scripts, src не трогал.

## Сделано

| Файл (SHA256, 12 знаков) | Что изменено |
|---|---|
| test/helpers/e2-rule-l.js (9942ab6ea609) **новый** | правило L: профиль τ(o), L1, L2, L3, L4, защёлка без абсолютной границы; REF_RUN_PLC — закреплённые числа reference |
| test/helpers/e2-lifecycle.js (8c0f7ddf3e83) | create({source:'ref'}) для reference (A12); m-d — частичная публикация STS_* → statusMissing → FAIL; m-e — неоднозначный SafetyFault → чтение x.sf бросает ошибку |
| test/helpers/e2-emergency.js (44d6eafad8e6) | общий timeline (кандидат и reference); emergencyChecks и свип по правилу L; no-event продолжение (A11/L4); M-a: отказной Restart на e+1000 при C1_FBK ON и для 1-скановых причин, вариант «снята на e+500, Restart e+1000»; refAnchorProfile() |
| test/helpers/e2-ref-4495a1f/GVL1.sgvl (8020e3d679f9) **новый** | закреплённая копия SGVL reference |
| test/current-e2a-emg-anchor.test.js (9307a8f014c9) **новый** | `E2-STAND L3 …` — повторное измерение reference = REF_RUN_PLC (проверка стенда, вне ^E2[a-d] ) |
| test/current-e2a-emg-rnd.test.js (689fd43ae786), -emg-run (f8ad2b8bdc5d) | + 6+6 тестов M-a (R&D, Run; PLC, ES1, ES2, Mentee, LVC, HVC) |
| test/current-e2a-sweep-estop.test.js (242113d7638a) | + свип in_Estop_PLC (база L1 для прочих причин, L2 против Run) |
| test/current-e2b-interlock-run.test.js (51b88a51a235) | IL-03: L1 вместо поскановного равенства; L4; защёлка |
| test/current-e2b-cover-transitions.test.js (82b4f9911f1f) | IL-05a: L1 против in_Estop_PLC в тот же скан той же траектории + L2 для эталонной трассы; IL-02/IL-05a N=u — нормативная дизъюнкция (NC1, both); IL-05b граница t_a−1 и IL-05d — L1/L4 |
| test/current-e2b-connector-safe.test.js (76fc7038691e) | EMG4-03 u+1: L1/L4 вместо «Emergency с u+2» |
| test/current-e2c-stp-i.test.js (747d283c71da) | m-b: tc — первый C2_FBK OFF после спада команды C2 |
| test/current-e2a-run-conf.test.js (529cbcb9ed60) | RC-1…RC-7 по E2-runconf + Q-RC-RUNCONF-01 «В»: RC-2 (нет Run ≤ u+99), RC-5 «нет Run на k+99» нормативно, RC-6 (HV Faulty 1 скан на k+50 → нет Run ≤ (k+51)+99, Run на (k+51)+101), RC-7 (C2_FBK FALSE 1 скан на t_f+1 / t_f+50 → Emergency) |
| test/current-e2d-release-permit.test.js (b65c9bef5373) | REL-01(b) connector LV/HV/оба; (d) 1999/2001 с эпизодом connector, 2000 — DIAG-наблюдение; (e) эпизод на квалификации; (c) R&D с крышкой + граница 1999. Сценарий Вадима с крышкой сохранён |
| test/current-e2d-unlock-cover.test.js (d1891ee3c043) **новый** | UNL-04 Safe и R&D (Q-ARCH-04, Q-ARCH-10 «А»): NC1/NC2/оба + контроль «закрыто»; s+499/s+501, удержание, отпускание; зелёная снимает Unlock; контроль «Run — нет Unlock» |
| test/current-e2a-status.test.js (c9195f3bb262) | + тест m-d (все четыре STS_* или ни одного) |
| program/tester/E2-G1/summarize.mjs (07883b03012e) | m-c: `# TODO` → NV (или FAIL-TODO), `# SKIP` → SKIP; поле diag для `DIAG `/`E2-STAND ` |
| program/tester/E2-G1/BLOCKED_v3.md | E3/E4/E5/E6 по этапам + Q-T3-1, Q-T3-2 |

Не изменены (SHA как в v2): emg-safe, emg-rundown, race, rnd-cover-healthy, sweep-connector, hlt03.
Их поведение изменилось через helpers.

### Пункты поручения
1. **A10/N2 → L1** для всех причин, кроме in_Estop_PLC/TRIGGER: ES_NC_1/2, Mentee, connector, NC в IL-03, IL-05a,
   IL-05b(граница), IL-05d, EMG4-03 u+1, RC-7.
   - Del (C1 OFF, STO_DR1/2, HV discharge, C2 OFF): опережение 0–1 скан, ≥ 2 — FAIL.
   - Imm (Emergency, C3/BMS OFF, LV discharge, Unlock FALSE): любое опережение.
   - Отставание — FAIL.
   Прочие выходы (SS1, outPLC_STO_*, b_EStop_Ok) выводятся только diagnostic. A10 снято.
2. **IL-02 N=u / IL-05a c=u** — один нормативный тест на вариант (NC1, both). (i) или (ii), иначе FAIL; Run запрещён
   в обоих исходах. Выпавший исход — diagnostic.
3. **EMGREF-LV.** «≤ e+1» и прочие абсолютные «с e+1/c+1/u+2» удалены. EMGREF(1) = Emergency достигнут и удерживается
   до финального Restart; момент определяется L1–L4. L2 — in_Estop_PLC в Safe, Safe→R&D, R&D, R&D→Safe, StartingRun,
   Run-down и свипе против устойчивого Run. L4 — везде.
   **L3:** in_Estop_PLC в Run на кандидате против reference 4495a1f, измеренного тем же timeline/profile.
   Числа (смещение от e): status Emergency 1, LV discharge 3, C3 4, BMS 4, C1 OFF 2004, STO 7006/7006,
   HV discharge 7008, C2 OFF 8009, Unlock n/a. Повторное измерение `E2-STAND L3` — PASS.
4. **N1 → REL-01(b)(c)(e)** — см. таблицу. (c) — крышка для R&D→Run.
5. **UNL-04** — Safe, затем R&D после Q-ARCH-10 «А». Door FALSE не написан → Q-T3-2.
6. **m-a / m-b / m-c / m-d** — сделаны. m-e — дополнительно, защита в helper (имя символа остаётся за архитектором).
   m-f — DIAG ниже показан отдельно.
7. **RUN-CONF по поправкам ведущего.** Сначала k+99 переводилось в NV, затем Вадим ответил «В». Сейчас k+99 и
   перезапуск отсчёта нормативны, RC-2 добавлен.

## ID матрицы и их новый статус (только факт)

Все нормативные тесты E2 на canonical — FAIL, кроме 30 PASS и 2 NV, перечисленных ниже. Ничего не закрыто.
Затронутые ID:
- EMG-001/002/004/006 (правило L, IL-*, M-a);
- EMG-003 (REL-01(b), EMG4-03);
- MOD-002 (RUN-CONF RC-1…7);
- EMG-011/MOD-008 (RC-7);
- CVR-001/002/003 (UNL-04);
- BTN-001/002, CVR-004 (REL-01);
- EMG-012/MOD-006 (m-d).

## Команды воспроизведения

```
cd SafetyTests
node --test --test-reporter=tap test/current-e2*.test.js > e2.tap        # нормативно, ~145 с на canonical
node program/tester/E2-G1/summarize.mjs e2.tap                           # NV/DIAG отделены (m-c)
node --test test/current-e2a-emg-anchor.test.js                          # L3: повторное измерение reference
E2_LV_HEALTHY_MODE=split node --test test/current-e2*.test.js            # ТОЛЬКО диагностика
E2_SOURCE_ROOT=<корень с MEN001_Dyno/Safety_Dyno> node --test test/current-e2*.test.js   # кандидат (G3)
E2_SAFETYFAULT_SYMBOL=<имя> ...                                          # если имён /safety_?fault/i несколько (m-e)
npm run check:software
```
Сохранено в program/tester/E2-G1/baseline-v3/:
- e2-g1v3.normative.tap и .summary.jsonl (380 строк);
- check-software-v3.out;
- non-e2-current.tap (21 файл current вне E2).

## Результаты

`npm run check:software` (exit 1):

| Стадия | Результат |
|---|---|
| harness | PASS 218/218 (+3 к v2 — stand-тесты стенда, не мои) |
| historical | PASS 75/75 |
| current | FAIL: 850 tests / 503 pass / 345 fail (в pass входят 2 todo/NV и 3 DIAG) |
| current SAL | {PASS 199, FAIL 1, NOT VERIFIED 7, ERROR 0} — без изменений; case IDs vs baseline: missing 0, statusChanged 0 |

**Вне E2:** 21 файл, 470/470 pass, 0 not ok (baseline-v3/non-e2-current.tap). Это прежние 461 плюс
`current-f1-lock-and-q500.test.js` (9 тестов, чужой, не отслеживается git). Новых падений вне E2 нет.
Все 345 fail в current — тесты E2.

**E2 (380 тестов):**
- **DIAG: 3 PASS** (E2-04 [in_Safety_Run false]; `E2-STAND L3`; `DIAG observation E2d REL-01(d)` 2000 мс — 2000 мс:
  accepted=true, только наблюдение).
- **Нормативно: 377 → PASS 30 / FAIL 345 / NV 2.**

PASS (30):
- E2-01 в Safe для in_Estop_PLC, ES1, ES2, Mentee (4);
- EMG6-01 EMGREF в Safe для ES1, ES2, Mentee — теперь по L1 (3);
- E2-01 в Safe→R&D для 8 причин (8);
- E2-04 [true];
- m-d (публикация статусов: на F1 нет ни одного STS_* → D2-A);
- EMG4-03 граница u−1 LV/HV (2);
- REL-PERMIT 1999 и контроль (2);
- REL-01(b) LV/HV/оба (3);
- REL-01(d) connector 1999 → отклонено LV/HV (2);
- REL-01(d) connector 2001 → принято LV/HV (2);
- UNL-04 Safe «закрыто» — удержание и зелёная (2).

NV (2): EMG4-03 Safe LV/HV — «без fault» ненаблюдаемо без SafetyFault (A8).

FAIL (345), по причинам (дословно, сгруппировано):
- **314 — предусловие полярности:** `precondition not reached within 3000 ms: R&D after BOTH from Safe (… stages=b_Step12, statuses=STS_SAFE)`.
  Это 182 в обёртке `scenario aborted (coverage incomplete): …`, 129 прямо и 3 `lifecycle precondition failed: …`.
  Сюда входят все R&D/Run/StartingRun/Run-down, свипы, IL-03/05a/05d, N=u, RUN-CONF ×7, STP-I, M-a ×12,
  UNL-04 R&D ×4 и Run-контроль, REL-01(c) ×4.
- **1 — то же предусловие через базу L2:** `L2 base (in_Estop_PLC in steady Run) unavailable: … R&D after BOTH from Safe`.
  Это «E2a EMG6-01 EMGREF: in_Estop_PLC TRUE in Safe», в v2 был PASS. L2 требует эталон устойчивого Run, на canonical
  он недостижим. Это не дефект, а неполнота покрытия. Единственный v2 PASS, ставший FAIL.
- **8 — EMGREF-LV Safe→R&D:** `energy removed before Restart … {"out_LV_C1":true,"C1_FBK":true}` (+ после Restart b_Step12)
  — как в v2 (Q-ARCH-01/Q-E2Q-01).
- 6 — IL-01: `Safe->R&D accepted with the cover open (V14-Q7, MOD1-01); stages=b_Step1 out_LV_C1=false`.
- 4 — REL-PERMIT крышка: `Safe->R&D accepted: the 2 s pause counts buttons only …` ×3, `accepted (button release 2100 ms incl. the cover episode)` ×1.
- 4 — UNL-04 Safe с открытой крышкой:
  - `Unlock TRUE from s+501 while the blue is held (Q-ARCH-04 "А" …); s+501=false` ×3;
  - `precondition: Unlock TRUE after 1000 ms blue with the cover NC1` ×1.
  Ожидаемый RED (запрет F1, снимается Q-ARCH-04).
- **2 — REL-01(e)** `permit absent at the qualification: Safe->R&D rejected, held gesture not executed after restoration`.
  Новый RED на canonical: connector FALSE с p+800 до p+1300 при BOTH, удерживаемом 2000 мс → C1 ON на p+1503,
  то есть удерживаемый жест исполнен после восстановления. Это противоречит REL-01(e)/BTN-001/002 (READY) и является
  FAIL относительно утверждённых критериев. Как дефект механизма — редактору/архитектору через ведущего.
- 2 — EMG4-03 u+1: `EMGREF(1): status Emergency reached (first +never) …` — canonical не даёт Emergency по connector (как в v2).
- 2 — IL-05b(2): `R&D reached with the cover open (MOD1-01); stages=b_Step12` — полярность, как в v2.
- 1 — POL-01(b) `in_LV_Faulty_FBK present (D-ARCH-POL-RENAME)`; 1 — POL-01(c) `outPLC_LV_Faulty present`.

Итого 314 + 1 + 8 + 6 + 4 + 4 + 2 + 2 + 2 + 2 = 345.

Диагностика split для RC-6/RC-7 (не приёмка; условные наблюдения, не дефекты). Механика сценариев работает:
- RC-6: глитч HV ровно в k+50. На F1 Run на 6820 ≤ (k+51)+99 — отсчёт от команды;
- RC-7: на F1 Emergency +97/+48, затем две стадии (b_Step1+b_Step3) после Restart.

## Допущения и пределы доказательства

- A1–A9 — как в v2 (helpers/e2-lifecycle.js). A10 (сдвиг всей последовательности на 1 скан) **снято**: заменено
  правилом L.
- **A11 (новое).** Нижняя граница L2 для Del-выхода не утверждается, если no-event продолжение той же фазы само
  достигает цели раньше τ_Run. Это Run-down/SS1: требование иначе предписывало бы задержать безопасное действие.
  Верхняя граница утверждается. L4 не учитывает изменения, которые no-event продолжение делает не позже. → Q-T3-1.
- **A12 (новое).** Reference исполняется тем же create/step/plant/timeline/profile. Отличия:
  - стадии b_Step1…b_Step6;
  - статус по D2-A;
  - lifecycle reference: зелёная 2100 мс → Step2 → Run, затем C3/BMS set в Run.
  Входы in_LV/HV_Faulty_FBK переименованы в in_*_Healthy_FBK той же полярности (raw FALSE = норма, как
  у reference AndIn!). Числа L3 закреплены в e2-rule-l.js. Сдвиг относительно справки аналитика (+2/+4/+2005…)
  — на 1: справка снята на canonical split, мой отсчёт — от снимка после скана e.
- Профиль τ(o) — первое достижение целевого значения. Последующие переключения по правилу L не сравниваются (только
  diagnostic). Конечное состояние, защёлка и EMGREF(2) проверяются отдельно.
- UNL-04: «Unlock FALSE в каждом скане с нажатой зелёной» — буквально. Скан отпускания — наблюдение.
- RC-6: k = t_f (HV в норме с начала). Глитч HV — ровно 1 скан на k+50.
- RC-7, IL-05d и REL-01(e): точки событий наблюдаются на той же траектории (no-event fork). Это опорные точки,
  не oracle.
- Пределы:
  - программная модель SAL; не native CRC/Verify, не Target, не hardware;
  - мутации не прогонялись — кандидата нет;
  - 314 FAIL — одно предусловие полярности, они не показывают своих утверждений до кандидата (G3);
  - число тестов не равно покрытию.

## Вопросы аналитику/Вадиму

1. **Q-T3-1 (аналитику, L2 в фазах спуска).** Исходно: Run-down (зелёная принята, SS1/выбег идёт). Событие:
   `in_Estop_PLC` TRUE в e. Не хватает: STO нормального спуска наступает раньше e+τ_Run(STO). Должна ли аварийная цепь
   откладывать его до окна [τ_Run, τ_Run+1] (буквальное L2), или ранний STO сохраняется? Сейчас утверждается только
   «не позже τ_Run+1».
2. **Q-T3-2 (аналитику, UNL-04 Door FALSE).** Исходно: Safe/R&D, NC1/NC2 FALSE, `in_Door_Monitor` FALSE. Событие:
   синяя ≥ 500 мс. Не хватает: UNL-04 допускает Door FALSE в исходном состоянии, а сохраняемая роль DoorMonitor
   (D-DOOR-INTERLOCK) и одобренный current-unlock-hold.test.js требуют Unlock FALSE при Door FALSE. Какая реакция?
3. Q-V4-01/02 — без изменений (вне объёма v3).

## Что передать следующему и кому

- **Ревьюеру (G1 v3):**
  - правило L (e2-rule-l.js), A11, L3-якорь и его повторное измерение;
  - N=u дизъюнкция; REL-01; UNL-04; RUN-CONF по «В»; M-a, m-b, m-c, m-d;
  - единственный v2-PASS→FAIL (PLC в Safe, база L2).
- **Архитектору:**
  - testFiles для MUTATION_PLAN_E2a…d — точные имена, 18 файлов: current-e2a-status, -e2a-emg-safe, -e2a-emg-rnd,
    -e2a-emg-run, -e2a-emg-rundown, -e2a-emg-anchor, -e2a-sweep-estop, -e2b-sweep-connector, -e2a-race,
    -e2a-rnd-cover-healthy, -e2a-run-conf, -e2b-interlock-run, -e2b-cover-transitions, -e2b-connector-safe,
    -e2c-stp-i, -e2c-hlt03, -e2d-release-permit, **-e2d-unlock-cover** (все `.test.js`);
  - behaviouralTests `^E2[a-d] `. `E2-STAND`/`DIAG` не совпадают, env E2_* не задавать;
  - имя SafetyFault (m-e).
  - Убийцы:
    - L1/L2/L3 — мутации таймеров/путей аварийной цепи и NC/ES;
    - REL-01(b)(d)(e) — MU24 и новый guard взвода (после E2/E5 этот guard имеет смысл при эпизоде connector);
    - RC-5/RC-6 — отсчёт 0,1 с;
    - UNL-04 — guard крышки в Unlock.
- **Редактору/архитектору (через ведущего):** REL-01(e) на canonical — удерживаемый BOTH исполняется после
  восстановления connector (C1 ON на p+1503).
- **Аналитику:** Q-T3-1, Q-T3-2.
- **Ведущему (m-f):** в «current pass 503» входят 3 DIAG/STAND и 2 NV. Нормативный счёт E2 — 30/345/2.
