# HANDOFF v6 — E2-G1 (ревью G1 v5 §6–8, N1/N3/N6/N7/N8/m-9; дополнения ведущего 2026-10-22)

Срез / роль / дата: E2 G1 v6 / v2-tester / 2026-10-22.

## Источник
- Canonical F1: SAL 04b45456…d28a3, SGVL dc103abe…a9104 (не менялись); HEAD dbca5dd.
- Oracle:
  - SCENARIO_DECISIONS.md: на старте 71ad3f94… (вопрос 73 «А»); TD-01…TD-04 из f7ae580f…; сейчас 052956fe… (файл менялся у аналитика во время работы, перечитан раздел «Решено командой»: TD-01 ПОДТВЕРЖДЁН Вадимом, вопрос 74 «А»; TD-02/03/04 ждут просмотра);
  - analyst E2-plan-v5-questions/CRITERIA.md 0a2f7de9…6b4c (DIS-HOLD-HV/LV, RUN-CONF-T/RND-CONF-T, EMG6-01-BOOT, B51-01, SAFE-NOENERGY, FBK-05/06, FBK10-K4);
  - analyst E2-G1-v5-k3/CRITERIA.md 502113e8…7d34 (K3-ACK; p = g заменено TD-04);
  - analyst E2-plan-v4-questions/CRITERIA.md 5d6bcc1a…120b (B43-01/02, ES06-01, REL01-e2);
  - CRITERIA_DELTA_v7.md 378a9f93…8459 (§4.5 FBK-10 границы);
  - ревью G1 v5 (reviewer/E2-G1-v5/G1_REVIEW.md), ревью плана v6 (reviewer/E2-plan-v6/PLAN_REVIEW.md: R6-1, R6-2, R6-5);
  - поручения ведущего: B4-3 вариант (А) (Bypass только в Safe), legacy-PLC FBK-10 (addendum v7.1), FBK10-PLC-REG (v7.2), стадии через RS, старые имена, R1 NA, R0 номинал.
- program/editor/** не читал.

## Сделано (SHA256, 12 знаков)

| Файл | Изменение |
|---|---|
| helpers/e2-rule-l.js d5bc36155f30 | **N1:** done-left → FAIL (Q-V7-01 «Г» + 73 «А»), не NV |
| helpers/e2-emergency.js 25740754c04c; current-e2a-emg-rd-sweep 042d848c3d4e; current-e2b-cover-transitions 9a18d8fc782d | ledger Discharge (DIS_DONE / EXP_ABORT / свип C2_FBK) → только p.4. rd-sweep h>e помечен **TEAM-DEFAULT TD-03** (имя теста изменено) |
| current-e2a-emg-anchor e7c492b504c8 | самотест done-left инвертирован: FAIL, не NV, не executed clause |
| helpers/e2-lifecycle.js 36499eb49cb6 | стадии наблюдаются на выходе RS Network3 (`//Network3/FBRsN/RsOut`, resolvePhaseObservers стенда); Symbol — только сверка (расхождение → ERROR стенда). Обязательны Step1/12/RnD/3, Step4/5/6/2 — если есть RS. Имена in_*_Faulty_FBK через src/signal-names.js (оба/ни одного → SignalNameError). `plcCommandName()` для CMD_* (нет на F1 → NV) |
| current-e2d-fbk-k3ack.test.js debdf9f9cc9f **новый** | K3-ACK: p ∈ {g+2100, g+1, g (**TD-04**: подъёма нет — норма, квитирование и исход BOTH-2 — наблюдение)}; длинное удержание Q1+4000; blue-first/green-first δ 250 (δ 0 — основной); (R) green-first без спуска; BOTH-2 r+1999 (отказ, затем BOTH-3 r2+2001 → подъём) / r+2001 (в [Q2,Q2+1]); r+2000 DIAG; 1-скан эпизод; PLC без квитирования / PLC после квитирования (NV до символа CMD_*); in_Estop_PLC в f/g/p/Q1/r+1000/Q2 (причина удерживается). **FBK10-K4** (Q-V7-04 «Б»): синяя при FBK ON → BOTH-1 после OFF (p' = g+1, g+3000) только квитирует, BOTH-2 r+2001 → подъём; BOTH-1 нажат в g−1 и удержан через OFF → BOTH-2 только квитирует, BOTH-3 → подъём. **N8:** f = Q и f = Q−1 → нет подъёма с f+1 (f — наблюдение); (R) FBK-10 + потеря LV → HLT-01; Restart при FBK ON после in_Estop_PLC → Emergency, после OFF → Safe |
| current-e2d-fbk-unsolicited bc0d9a429246 | **m-9** комментарий (квитирование — в скане нажатия; 2 с — условие новой попытки). **legacy-PLC FBK-10** (v7.1): S1/S2 PLC (1,0), R PLC (1,1) при FBK ON → нет подъёма; позитивный контроль PLC (1,0) без FBK → S12, C1 ON. **FBK10-PLC-REG** (v7.2): R&D, PLC (1,1) удержан, C2_FBK с u+1/u+250/u+499 → C2 держится [u, Run−1], нет Run ≤ u+599, Run на u+601 (TD-02). KF-5 не утверждается |
| current-e2a-run-conf be792bbd2294 | **N6:** предусловия стимула t_f = u+1/30/400/499, (vi) FALSE ровно u+100..u+110. Верхняя граница K+101 = **TEAM-DEFAULT TD-02** (u+602 — FAIL). R&D ≤ u1+599 / u1+601 — READY (68 «Б»). DIAG LV u1+550 → нормативный **RND-CONF-T** (нет R&D ≤ u1+650, есть u1+652) |
| current-e2a-dis-hold.test.js 59ffe08c25b1 **новый** | **DIS-HOLD-HV** (READY): выдача STP-A / STP-G / STP-006 / Emergency из Run; события: синяя, R&D→Safe→R&D, Emergency в R&D, отклонённые (крышка, REL01-e2 эпизод, r+1999, поздняя вторая, FBK-10), **legacy PLC (1,1) при открытой крышке, Emergency в R&D при PLC (1,1)**; TRUE в [d, a−1], FALSE с u+1. Emergency из Run при удерживаемом PLC (1,1): Discharge выдан до C2 OFF и держится. **DIS-HOLD-LV** (READY, вопрос 74 «А»): выдача Emergency в Safe→R&D / R&D→Safe / Emergency в R&D; события: поздняя вторая, r+1999, connector-эпизод, Emergency в Safe, **Emergency в Safe + PLC (1,0)**; TRUE в [d, a1−1], FALSE с u1+1 |
| current-e2b-bypass.test.js 61e0b39da968 **новый** | **B43-01** (a)(b)(c)(d), (e) R&D и Safe→R&D, (f) старт; границы C2 OFF−1/0/+1 (для R&D/Safe→R&D — момент C1 OFF, выбор точек тестировщиком) и e+12000; дифференциально «Bypass игнорируется» + абсолютно после конца цепи. **B43-02** δ ∈ {−100,−1,0,+1,+2} + удерживаемый, из Run/R&D/Safe→R&D и BOOT. **B51-01** (R&D, StartingRun, Run, SS1/выбег/разряд, Safe→R&D, R&D→Safe, Safe с NC1/NC2 FALSE × 300 мс / 1 скан / 5000 мс). **SAFE-NOENERGY** |
| current-e2a-boot.test.js a97f1b5b22a2 **новый** | **ES06-01** (ES норма / ES_NC_1 FALSE × без события / синяя / Bypass / RnD_Mode / RnD_Mode_2; BOTH; удерживаемые с загрузки), b_Step* — только структурная диагностика. **EMG6-01-BOOT** (C1/C2/оба FBK × g ≤ p_r−1 (контроль) / g ∈ [p_r, r] (наблюдение, запрет Safe с FBK) / **g = r+1 / r+2000** (без нового Restart Safe нет ни в одном скане, новый Restart → Safe) / никогда), + ES FALSE, + залипание C2_FBK после Run |
| current-e2b-rel01-e2.test.js b259b36a776d **новый** | **REL01-e2**: 6 сигнальных вариантов × эпизоды (7 отказных), r ≤ f−1 принят, r = f DIAG, s = Q+2 принят + Emergency, s ∈ {Q, Q+1} запрет «принят без Emergency», 1999/2001; контроль NC1/NC2 в Safe → принят |
| current-e2d-fbk-window-abort.test.js 81ebab3d583b **новый** | **FBK-05/06** (Q-V7-03 «А»): abort в u+10/300/499 (u1+10/300) × FBK никогда / ON u+1..u+199; последовательность abort по сканам = та же с FBK, нет Emergency, конечное состояние; SafetyFault ≤ w+1 — NV |
| current-early-sto a7d9ee70ab24 | **R6-5:** «old discharge Reset follows later feedback» (b_Reset_HV_Discharg_Req2) заменено DIS-HOLD-HV по выходу out_HV_Discharge_Request: объявленный seed запроса TRUE, TRUE до принятия, FALSE с u+1, не ждёт FBK/Healthy. 16 тестов переименованы (+« DIS-HOLD»). Имена Healthy → signal-names. b_Set_STO_DR1/2 (Network5, R1) отсутствуют → маршрут ordinary SKIP «NOT APPLICABLE (R1)», иные отсутствия — ERROR |
| current-plc-pulse-set-permit ecb59b0d51f8 | маршрут legacy при отсутствии //Network5/FBAnd1 → SKIP «NOT APPLICABLE (R1)» |
| current-f1-lock-and-q500 d9b6f190c71d; helpers/safe-run-source a5cf9f4e3f44 | rawCommon в renamed-именах + withActualNames (значения сырые без изменений) |
| helpers/full-program-source b0eb9b63c163; helpers/rnd-down-source d9680609ac48 | renamed + withActualNames; **R0 номинал: Faulty FALSE** (было TRUE). full-program: пин 242 блока снят по умолчанию (размер — свойство источника; модель передаётся без выборки); явный blockCount сохраняет пин |

current-e2*.test.js: 27 файлов (было 21).

## ID матрицы и их новый статус (только факт)
Ничего не закрыто. Затронуто: EMG-001/002/004/010/011, STP-001/002 (DIS-HOLD, done-left, TD-03); MOD-001/002, WDG-001/003 (RUN-CONF-T/RND-CONF-T, N6); MOD-005 (DIS-HOLD-LV); MOD-008, WDG-004 (K3-ACK, K4, legacy-PLC FBK-10, PLC-REG); WDG-001/003 (FBK-05/06); EMG-006/012, MOD-006, BOOT-001, CFG-001 (B43, B51, SAFE-NOENERGY, ES06, EMG6-01-BOOT); BTN-001/002, EMG-003, CVR-004 (REL01-e2).

## Команды воспроизведения
```
cd SafetyTests
node --test --test-reporter=tap test/current-e2*.test.js > e2.tap && node program/tester/E2-G1/summarize.mjs e2.tap
node --test $(ls test/current-*.test.js | grep -v current-e2)
npm run check:software
E2_SOURCE_ROOT=<корень с MEN001_Dyno/Safety_Dyno> node --test test/current-e2*.test.js     # кандидат
# не-E2 на кандидате: sandbox стенда (src/stand-sandbox.js createSandbox с overlays SAL/SGVL/diagram кандидата)
```
Сохранено в program/tester/E2-G1/baseline-v6/: e2-g1v6.normative.tap / .summary.jsonl, non-e2.tap, check-software-v6.out; DIAG кандидата e2a-candidate-5648e31c.diag.tap / .summary.jsonl (снят до части правок v6, только справка).

## Результаты (canonical F1)

### E2 (808 тестов; прогон до добавления FBK10-PLC-REG)
- Нормативно 779: **PASS 93 / FAIL 653 / NV 33**; DIAG/E2-STAND 29 PASS.
- 513 FAIL — неполнота покрытия: `precondition not reached within 3000 ms: R&D after BOTH from Safe (stages=b_Step12)` (R&D/Run недостижимы на F1 при R0 raw FALSE).
- FBK10-PLC-REG (3 теста, добавлены после прогона): на F1 FAIL по той же причине покрытия. На E2a-core (DIAG): стимул/предусловия выполнены, FAIL `no Run <= u+599; Run first at u+100/251/500` — окно RUN-CONF ещё не реализовано в E2a-core.
- Содержательные RED на F1 (дефекты относительно критериев; путь достижим):
  - K3-ACK/K4 S1/S2: BOTH-1 после FBK OFF без квитирования поднимает на Q1+3 (`BOTH-1 is only the acknowledgement: ... first lift t=…`);
  - legacy-PLC FBK-10 S1/S2: PLC (1,0) при FBK ON → C1 ON;
  - FBK-10 + in_Estop_PLC: Restart при FBK ON выводит из Emergency (`first non-Emergency t=…`);
  - EMG6-01-BOOT: Safe при FBK TRUE на r+1 (`no Safe scan with … FBK TRUE; first t=401`);
  - ES06-01/BOOT-C: удерживаемые с загрузки Bypass / inPLC_RnD_Mode исполняются после Restart;
  - B43-02 BOOT: Safe с C1/C2 при Bypass (t=1101/1102); B51-01 Safe→R&D: Bypass даёт C2 ON; B43 из Safe→R&D: ранний Restart даёт Safe при C1 ON, цепь C1 не снимает;
  - REL01-e2 Safe: отказные эпизоды [p+1,p+2), [p+500,p+501), [f,p+300), [f−300,f+10) → подъём; s = Q+2 / Q+1 → принят без Emergency; контроль NC1/NC2 в Safe → Safe→R&D отклонён (V14-Q7 «Б1»);
  - FBK-06: abort Safe→R&D зелёной не завершается (стадия b_Step12);
  - RND-CONF-T: R&D на u1+550 (импульс LV raw TRUE — старая полярность F1);
  - K3-ACK BOTH-2: момент подъёма Q2+3 при норме [Q2, Q2+1] (см. вопросы).
- REL01-e2 [p+500,p+999), [Q−1,Q+1), [p+800,p+1300) на F1 — отказ (наблюдаемое PASS, NV только SafetyFault).

### Вне E2 (23 файла): 479 тестов, 461 pass / 18 fail
- 16 × `EARLYSTO physical … early N+2 DIS-HOLD fixedN` — новое ожидание R6-5 (F1 снимает запрос по обратной связи ≈ u+101). Единственная нарушенная проверка: `DIS-HOLD-HV (73 "А"): HV discharge request FALSE from u+1 on`; seed и прочие проверки PASS.
- 2 × `current SAL: healthy LV completion later-off / already-off …` — **pass → fail из-за R0** (rnd-down-source Faulty TRUE → FALSE): `Fixture ERROR: preparation unavailable b_Step_RnD=true` — при номинальном raw FALSE F1 не входит в свежий R&D (та же старая полярность). Других изменений исхода от R0 нет (54 теста 4 файлов сравнены поштучно до/после).

### `npm run check:software` — exit 4
- harness PASS 268/268; historical PASS 75/75; current FAIL 1285 / 581 pass / 671 fail; current SAL {PASS 199, FAIL 1, NV 7}.
- case IDs: missing 0, statusChanged 0.
- tests current vs baseline: missing 22, added 462, statusChanged 3. expected deltas 23: explained 7, **unexplained 16** (EARLYSTO).
- harness missing 1 «S14: unwritten observed phase Symbol …» — стенд, не мой файл.

## Допущения и пределы
- A1–A9, A12 как в v5. Стадии — по RS (G1 v6), Symbol — сверка.
- EARLYSTO DIS-HOLD: **объявленный seed** памяти RS out_HV_Discharge_Request (//Network1/FBRs7 на F1) перед жестом — внутренняя инъекция в изолированной фикстуре; момент снятия решает программа.
- B43: точки границ для R&D/Safe→R&D — момент C1 OFF (выбор тестировщика); норма «нет энергии при Emergency» проверяется в каждом скане независимо. «Игнорируется» = дифференциально к той же трассе без Bypass (Q-RC-05(a)).
- PLC CMD_* (E4) на F1 нет → NV; legacy (1,0)/(1,1) взят из нетлиста (ревьюер плана v6), реальное поведение PLC — NV.
- REL01-e2 «принято» — подъём в пределах Q+1500 (момент критерием не нормирован).
- DIS-HOLD: a = первый скан C2 ON или снятия STO (STATE_SU не наблюдаем); [a, u] — наблюдение.
- EStop-варианты K3-ACK: Emergency и защёлка при удерживаемой причине + EMGREF(2); моменты по правилу L — в E2a emg-тестах.
- full-program-source: пин 242 снят по умолчанию — проверка «без выборки» обеспечивается передачей всей модели; идентичность источника — SHA в отчётах.
- Мутации не прогонялись (G3).

## Вопросы аналитику / Вадиму
1. Аналитику (K3-ACK §2, момент подъёма BOTH-2 в [Q2, Q2+1]). Исходно: Safe, обычный BOTH 1100 мс. На F1 C1 ON на Q+3 (Q = вторая кнопка + 1000) — и без FBK-10. Норма [Q, Q+1] для момента принятия BOTH — подтвердить. Если допуск другой, исправлю liftIn в current-e2d-fbk-k3ack (сейчас оставлен строго по критерию).
2. Аналитику (FBK10-K4, BOTH-1 нажат в g−1 и удержан через g). Тест считает BOTH-2 (первое нажатие после OFF) квитированием, подъём — BOTH-3. Основание: Q-V7-04 «Б» + п.13 (квитирование в скане нажатия), строка FBK10-K4 «p ≤ g−1 … SafetyFault TRUE до первого нажатия после g». Подтвердить.

## Остаток (не сделано / для G3)
- FBK10-PLC-REG не вошли в baseline-v6 tap (добавлены после прогона).
- На кандидате E2a через sandbox (не-E2, после правок пинов): 214 тестов, 94 pass / 78 fail / 42 skip. Причины после правок (справка, не вердикт G3): 16 EARLYSTO DIS-HOLD; 16 BTN-RELEASE-AFTER-PERMIT (пин 242 блоков — снят после этого прогона); 4 EARLYSTO completion single-sample PLC pulse; 2 «ordinary Step2 startup preserved» в rnd-down (маршрут Step2 удалён R1 — нужен NA по образцу early-sto); 2 rnd-down LV completion (R0); UNLOCK07; SR-RG-QUAL. Требуют разбора на G3.
- G3: EMG-RD-L на кандидате (STO и C2 на e+0 при аварии в Run→R&D, диагностика редактора) — отдельным пунктом; C4 п.1–4 ревью v5; мутанты (i)–(xvi), M-E2a-21/25, M-E2b-24/25, M-E2d-12…16, сброс от негейтированного уровня PLC.
- Архитектору: testFiles = 27 (+ current-e2a-boot, -dis-hold, current-e2b-bypass, -rel01-e2, current-e2d-fbk-k3ack, -fbk-window-abort).

## Фрагмент для expected-deltas F1 (ведущему/стенду)
fixtures/case-baselines/expected-deltas/04b45456….json, `tests.current`:
```json
[{"name":"EARLYSTO physical <first>/HVHealthy<h> early N+2 fixed<dt>","reason":"Renamed to 'EARLYSTO physical <first>/HVHealthy<h> early N+2 DIS-HOLD fixed<dt>': expectation 'old discharge Reset (b_Reset_HV_Discharg_Req2) follows later feedback' contradicts question 73 'А' (Q-V7-01 'Г', analyst E2-plan-v5-questions §1 DIS-HOLD-HV); replaced by out_HV_Discharge_Request FALSE from u+1 (R6-5, review of plan E2 v6). New name FAILs on F1 (withdrawal at ~u+101).","proposedBy":"v2-tester"}]
```
— 16 записей: first ∈ {green, blue}, h ∈ {false, true}, dt ∈ {1, 2, 5, 10}.
statusChanged (информационно): `current SAL: healthy LV completion later-off / already-off …` pass → fail — R0 номинал в helpers/rnd-down-source.js (поручение ведущего), F1 не входит в R&D при raw FALSE.
Прочие переименования v6 (rd-sweep TD-03, run-conf RND-CONF-T вместо DIAG) в F1-baseline отсутствуют, дельт не требуют.
