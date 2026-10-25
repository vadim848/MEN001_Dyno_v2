# E2-status v7 — механизм статусов, срезы E2 (база R1) и эскиз E3…E6

v7 (2026-10-22) — по ревью v6 `program/reviewer/E2-plan-v6/PLAN_REVIEW.md` (R6-1…R6-6, B6-1) и вопросу 74 «А» (TD-01 подтверждён). Прежняя версия — `*.v6.*`, `repro/v6/`. Изменения v7: §4.2, §6 п.9, §8, §11–§13; остальное как в v6.

Роль: v2-architect. Дата: 2026-10-22. Версия 6.

Основание:
- ревью `program/reviewer/E2-plan-v5/PLAN_REVIEW.md` (обе редакции, §1–§9, §1.3);
- критерии `program/analyst/E2-plan-v5-questions/CRITERIA.md`;
- G1 v5 (C5, (xvi));
- стенд `program/stand/E2-runner-ops/HANDOFF.md`;
- решения Вадима: Q-V7-01 «Г», вопрос 73 «А», Q-V7-03 «А», Q-V7-04 «Б», D-TEAM-DEFAULTS «А»;
- решения команды TD-01…TD-04;
- решения ведущего D-1/D-2 по кандидату E2a-core.

Прежние версии: `*.v1…v5.*`, `repro/v1…v5/`. Canonical не менялся.

## 0. Источник

| Объект | SHA256 |
|---|---|
| canonical SAL (F1) | `04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3` |
| R1-кандидат | SAL `ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3` |
| **E2a-core кандидат** (редактор) | SAL `5648e31cec9fea6d82ed2392a4be21a26c599eb4872969f5adab2ef3b87fd40b` (`candidates/E2a/native`) |
| SCENARIO_DECISIONS.md | `f7ae580f7e6ad15067b02b6481b1976d8eaff7deea505a8973c9c53c21c0835d` |

Правило D-TEAM-DEFAULTS: пограничные случаи решаются ограничительно или по аналогии. Решения
записывает аналитик в «Решено командой». Новые TD этим планом не вводятся. Используются TD-01
(LV Discharge), TD-02 (граница Run/R&D), TD-04 (FBK-10 p = g).

## 1. Срезы и ресурсы

| Срез | Состав | FB | Порты | Symbols | SAL-перем. |
|---|---|---|---|---|---|
| R1 | v2 §3 + addendum | 215 | 1832 | 65 | 75 |
| **E2a-core** (собран, SAL 5648e31c…) | кольцо, HEALTH_GUARD, полярность N11, переименование 4 SAL-переменных, **FBOr1.OrIn4 := g7**, **L1: N12/FBAnd16, SafeResumption/CONNECTORS и CONNECTOR_SCOPE — перед N1/FBAnd1** | 215 | 1832 | 65 | 75 |
| E2a-RC | окна WIN_C1/WIN_C2 + **DIS-HOLD** (v7: источник HV — `b_Set_HV_C2_1`; гейт EOk у legacy N2/FBAnd91) | 217 | 1836 | **63** | **75** |
| E2a-PLC | 7 файлов (Q-ARCH-11 «Б») | — | — | — | — |
| E2b | Emergency, крышка, connector, g10, **(А) Bypass**, **EMG6-01-BOOT** (v7: по фронту Restart) | **225** | 1908 | 63 | 77 |
| E2c | HLT, C-1, C-2 | 227 | 1926 | 63 | 78 |
| E2d | Safe-сторона, Q-REL, FBK-10 | 227 | 1926 | 63 | 78 |

Лимит 512. Оценка дальше (±5): E3 ~248 → E4 ~267 → E5 ~272 → E6 ~286. Предел 12 страниц по
2048 Б — NV; офлайн Verify разрешён Q-61 и учитывается отдельно.

## 2. Механизм — без изменений (v4 §2)

Кольцо S1/S12/SR/S3/S4/S5/S6; гранты g1…g10; g7 привязан к стадии; g7 в Reset каждой
конкурирующей цели; голова из 15 блоков (в E2a-core — 14, FBOrS12Reset появляется в E2b);
правило L1; статус по D2-A.

## 3. E2a-core — addendum (D-1, D-2; core не меняется)

- **D-1 (решение ведущего).** В состав E2a-core входят FBOr1.OrIn4 := `b_Step4_Set` и
  переносы N12/FBAnd16, CONNECTORS и CONNECTOR_SCOPE перед N1/FBAnd1. E2b их не повторяет.
  - До E2b эти переносы не влияют на поведение: в core FBAnd16 питает только N12/FBAnd4,
    а `linkSafeConnectorScope` читает только GATE_001, исполняемый позже.
  - Мутации порядка становятся убиваемыми только со стека E2b (см. §8).
- **D-2 (решение архитектора) — принять native-раскладку.** Критерий R1-D-2 дополняется:
  «маршрут connectors (точки, jump-маркеры) может меняться native layout при сохранении
  портов-концов, числа связей и взаимного положения фигур внутри lane».
  - Обоснование: native save детерминирован (те же байты); 34 из 36 изменений —
    нормализация вырожденных точек, 2 — обход новой фигуры HEALTH_GUARD.
  - Ручная переразметка фигур ради маршрутов добавила бы правку, не проверяемую
    native-средой.
  - Логика и CRC SAL от маршрутов не зависят (DERIVED).
- **«STATE:Run-RnD PASS→FAIL» на кандидате — следствие A4-3, не дефект.**
  - Кейс стенда ожидает старое отображение: завершение Run-down через Step12, затем
    `b_Step_RnD_Set`.
  - В E2a грант g6 (`b_Step12_Set_2`) устанавливает SR напрямую (FBOr16.OrIn2) — это
    намеренно (STP-A, устранение маскировки фазы).
  - Кейс заменён E2-01/E2-02 (v5 §3.1, A4-3). Стенду — снять старое ожидание.

## 4. E2a-RC — окна и DIS-HOLD

### 4.1 Окна (без изменений против v5, текст по R5-2/TD-02)

- WIN_C2 (TON 0,5 с) от N12/FBAnd4; FBAnd6 = WIN_C2 ∧ `in_HV_C2_FBK` ∧ ¬`in_HV_Faulty_FBK`;
  FBTon3 (0,1 с) от FBAnd6; FBTon3.TonOut → DecIn1…4.
- То же для R&D: WIN_C1 → N11/FBAnd4 → N11/FBTon1 → N11/FBAnd5.
- **R5-2 / TD-02.** N12/FBAnd4 (вход WIN_C2) поднимается на скан раньше `out_HV_C2`,
  поэтому окно стартует на **u−1**.
  - Следствие: Run на u+600 при K = u+500, то есть в K+100 — это наблюдение по TD-02.
  - Нормативно: нет Run ≤ K+99, есть на K+101.
  - Для R&D то же с u1.
  - Текст v5 «окно начинается в скане u» неверен и заменён этим пунктом.

### 4.2 DIS-HOLD — снятие запросов разряда при принятии подъёма (Q-V7-01 «Г», вопрос 73 «А», TD-01)

Symbols разряда **на выходы окон не переносятся**; перенос из v5 отменён (R5-1).

**HV (FBRs7, `out_HV_Discharge_Request`) — v7 (R6-1):**
- **N1/FBOr5.OrIn2 := существующий Symbol `b_Set_HV_C2_1`** (N12/FBAnd4.AndOut). Это команда C2,
  гейтированная стадией R&D (N12/FBAnd1), закрытой крышкой (N12/FBAnd16) и принятым подъёмом:
  SU — защёлка принятого жеста, либо legacy PLC (1,1). У Symbol появляется второй targetUsage.
  Новой SAL-переменной нет; `linkRunUpAccepted` из v6 отменён.
- Обоснование. Вопрос 73 «А» определяет «принятый подъём» как момент, когда «C2 ON выдаётся».
  `b_Set_HV_C2_1` и есть выдача команды C2 в разрешённой стадии.
  - N12/FBOr1 (v6) содержал негейтированный уровень legacy PLC (N12/FBAnd10). Он давал
    снятие запроса отклонённой попыткой, в Emergency и в legacy Run (ревью x1).
  - Нижние гейты FBAnd4 (стадия, крышка) это исключают. Аварийную ветку закрывает g7: он
    переводит SR→S4 за ≤ 2 скана, после чего FBAnd4 = FALSE.
- Symbol `b_Reset_HV_Discharg_Req2` удаляется, как в v6.

**LV (FBRs5, `out_LV_Discharge_Request`) — TD-01, вопрос 74 «А»:**
- **N1/FBOr1.OrIn2 := `b_Step12_Set`** (грант g2), как в v6;
- **v7 (R6-2): N2/FBAnd91.AndIn4 := `b_EStop_Ok`**, 0 FB. Legacy PLC-путь Safe→R&D больше не
  исполняется в Emergency.
  - Ограничительный вариант по D-TEAM-DEFAULTS п.1. Устраняет давнюю аномалию «g2 двигает
    S1→S12 в Emergency» и снятие запроса LV в Emergency.
  - Кнопочный путь уже гейтирован EOk через GATE_001 → SAFE_UP_SCOPE.
  - Аналитику — записать как TD-05 (ограничительное, энергию не добавляет).
- Symbol `b_Reset_LV_Discharge_Req2` удаляется.

Межсетевых wire нет.

Модель (`repro/t20.out.txt`, все варианты строк ревью x1):
- (B) R&D с запросом HV, крышка открыта, PLC (1,1) — запрос TRUE без перерыва;
- (C) R&D, ES FALSE + PLC (1,1) — TRUE, далее S4;
- (D) Safe, ES FALSE + PLC (1,0) — запрос LV TRUE без перерыва, стадия S1;
- (E) кнопочный R&D→Run — SU в a, `out_HV_C2` в a+2 = u, запрос FALSE в u (≤ u+1).

Гейт EOk на legacy N12/FBAnd10 проверен и **не вводится**: мутант не убивается (g7 снимает SR
быстрее), а неубиваемый guard размывает G3.

Если подъём прерывается (E3 abort, E6 откат), спуск снова выдаёт Discharge по своему порядку.
В E4 вход в Config — вторая причина сброса (OR).

Ресурсы: +2 FB, +4 порта; Symbols 65 → **63**; SAL-переменные **75** (без изменений).

Known FAIL после E2a-RC (до E6):
- провал FBK после окна — перезапуск вместо Emergency (Q-RC-19);
- конец окна без FBK — откат + SafetyFault;
- 30 с Healthy.

## 5. E2a-PLC — без изменений против v5, кроме P5-1

Пути .sds: `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/Alias Devices/PLC_IO/StatusToPLC/outPLC_LV_Healthy.sds`
и `…/outPLC_HV_Healthy.sds`.

В проверке G2 «ни одного `_Invert`» исключить `MEN001_Dyno.tsproj.bak` и `CODE_REVIEW_2026-07.md`.

Внешние ADS-потребители по имени поля (scope, HMI вне репозитория) — NV, сообщить Вадиму.

## 6. E2b — Emergency (без пунктов, ушедших в core)

Изменения:
1. `linkCoverClosed` на N12/FBAnd16.AndOut; `linkRunDownOwner` на N6/RUN_DOWN_OWNER.RsOut.
2. FBAndNotRunSu, FBOrIlRunOk → N1/FBAnd1.AndIn3; N1/FBAnd1.AndIn4 := `linkSafeConnectorScope`.
3. N6/HEALTHY_OK.AndIn3 := `linkCoverClosed`; N6/FBAnd9.AndIn2/3 — деактивировать.
4. STAGE_LVON, FBAndLvEmg, FBOrStep4 → N6/FBDecouple1.DecIn1.
5. Network3/FBOrS12Reset → FBRs8.Reset (в голове).
6. GATE_001.AndIn5/6 — деактивировать; GATE_020.AndIn6 := `linkCoverClosed`; GATE_030.OrIn5 := BOTH.
7. Network3/G10_EXIT → N3/FBOr2.OrIn3.
8. **B5-1 (А), намеренное изменение по V14-Q16 / Q-RC-05 / EMG-011:**
   - **N1/FBAnd4.AndIn5 := `b_Step1`** — legacy Bypass только в Safe, 0 FB;
   - в Safe Bypass энергии не даёт (сброс доминирует), поэтому legacy Bypass становится
     полностью инертным до E4 (в F1 он включал C2 в R&D);
   - isolation и known FAIL B4-3 сняты; CFG-02 «Bypass в R&D» снят из known FAIL E2d;
   - модель t18: R&D + Bypass 3 с — C2 0; мутант — 1.
9. **B5-2, EMG6-01-BOOT:**
   - новый **Network3/FBAndBootFbkOff** (AND: `in_LV_C1_FBK` NO, `in_HV_C2_FBK` NO) → wire
     **N3/FBAnd1.AndIn3** (вход освобождён R1). Ставится перед N3/FBAnd2;
   - **v7 (B6-1): FBAndBootFbkOff = !C1_FBK ∧ !C2_FBK ∧ !`in_Reset_PB` ∧ `recRndC_PrevG`** (0 FB, 4 входа).
     FBK OFF проверяется **в скане отпускания Restart**, как у G10_EXIT. PrevG читается до своего
     writer N6/FBDecouple2. Отложенного выхода нет: FBK OFF после Restart (r+1, r+2000) → Emergency
     до нового Restart. Модель `t20`: FBK OFF на r+1 / r+2000 → через 3 с none/EMG; новый Restart → S1/SAFE.
     При обычном старте FBEstop1 восстанавливается тем же спадом зелёной, поэтому g1 — в том же скане;
   - стартовый выход g1 теперь требует FBK OFF в момент Restart, как G10;
   - модель t18: старт с C1_FBK ON, Restart → нет стадии, статус EMG; FBK OFF и новый
     Restart → Safe; оба мутанта → Safe при FBK ON.

Criteria:
- IL-03, IL-05a/b, EMG4-02/03, EMG6-01, **EMG6-01-BOOT**;
- EMGREF-LV/RUN, REL-01(e), Q-T3-1;
- **B43-01, B43-02** (Bypass);
- E2-01.

Known FAIL на стеке до E2c: HLT; V14-Q7 Safe и Q-REL до E2d.

Ресурсы: +8 FB → **225**, +72 порта → 1908, SAL-переменные +2 → 77.

## 7. E2c — без изменений (227 FB, 1926 портов, 79 SAL-переменных). E2d

E2d:
- N1/FBAndLvCurrentPermit.AndIn4/5 и N2/FBAnd1.AndIn5/6 — деактивировать;
- MODE.OrIn4 := `b_Step12`;
- FBK-10: GATE_020.AndIn8 := `in_HV_C2_FBK` (NO).
- **D5-1:** изменение `N1/FBAnd4.AndIn3/4 := NC1/NC2` **удалено из плана**: после (А) это
  мёртвая логика. M-E2d-01/02 сняты, CFG-02 снят из known FAIL.
- **D5-2:** known FAIL E2d — FBK-10 k3/k4 (квитирование, Q-V7-04 «Б», TD-04) до E5/E6.
  Сценарий «FBK OFF → BOTH без квитирования → подъём» на E2d исполнится.
- Ресурсы: 0 FB → 227.

## 8. Мутации

Общее:
- **testFiles — 21 имя** (20 из v5 + `current-e2d-fbk-unsolicited.test.js`).
  `current-e2d-fbk-k3ack.test.js` не включён: k3/k4 — это E5;
- фильтр `^E2[a-d] `;
- **флаги `operatorAvailable:false` сняты** (X5-1): стенд реализовал swap-order,
  deactivate-input-pair, rewire.
- Ручными остаются:
  - M-E2a-26 — составной мутант, рецепт ниже;
  - мутации со сменой привязки Symbol (`rebind-global`) — такого оператора нет; они
    помечены `operatorAvailable:false`, у них есть рецепт и результат модели.

**Файлы:**
- `MUTATION_PLAN_E2a.json` — **E2a-core**, `sourceSha256 = 5648e31c…fd40b`.
  - M-E2a-01…17 (core), M-E2a-27.
  - Перенесены из E2b: ex-M-E2b-30 как equivalentBySearch; ex-M-E2b-31/32 как M-E2a-28/29
    (порядок FBAnd16 / CONNECTOR_SCOPE). На кандидате E2a-core они эквивалентны: потребитель
    порядка появляется только в E2b. Поэтому их убийцы прогоняются на стеке E2b
    (дублированы там как M-E2b-31/32).
- **`MUTATION_PLAN_E2a-RC.json`** (новый), `FILL_AT_G2`:
  - M-E2a-18/19/20/22/23/24;
  - **M-E2a-21** — обычная мутация, убийца RC-5(iv): база u+3101, мутант u+3102;
  - **M-E2a-25** — убийца RND-CONF-T: R&D на u1+500 ≤ K1+99;
  - **M-E2a-26** — составной мутант;
  - **DIS-HOLD M-E2a-30…36** (v7).
- `MUTATION_PLAN_E2b/c/d.json` v6.

**M-E2a-26 — рецепт (C5 (x), R5-4), три правки последовательно на кандидате E2a-RC:**
1. `rewire //Network12/FBTon3 TonIn := //Network12/WIN_C2/TonOut`;
2. `rewire //Network12/FBAnd6 AndIn1 := //Network12/FBTon3/TonOut`;
3. `rewire //Network12/FBDecouple2 DecIn1…DecIn4 := //Network12/FBAnd6/AndOut`;
   затем `swap-order` FBAnd6 после FBTon3.

Записать SHA мутанта. Убийцы:
- RC-6: HV-глитч на K+50 — база u+652, мутант u+600;
- RC-5(iv): мутант u+3001 ≤ u+3099.

В результаты G3 — отдельной строкой «manual composite».

**DIS-HOLD:**
- M-E2a-30 deactivate N1/FBOr5.OrIn2 — запрос HV TRUE на **u+1** (R6-3);
- M-E2a-31 deactivate N1/FBOr1.OrIn2 — запрос LV TRUE на **u1+1**;
- M-E2a-32 (`rebind-global`, ручная) FBOr5.OrIn2 := `linkRndBothQualified`. Убийца на E2a-RC (R6-4):
  **Safe→R&D жестом BOTH при выставленном запросе HV** — у мутанта запрос HV снимается, в базе
  остаётся TRUE. Убийца «отклонённый BOTH при открытой крышке» — только на стеке E2b;
- M-E2a-33 (`rebind-global`, ручная) FBOr5.OrIn2 := выход WIN_C2 — запрос TRUE в **u+1 … a+499**;
- **M-E2a-34** (`rebind-global`, ручная) FBOr5.OrIn2 := N12/FBOr1.OrOut, то есть сброс от
  негейтированного уровня команды (вариант v6). Убийцы — строки ревью x1:
  - (B) отклонённый PLC-подъём при открытой крышке снимает запрос;
  - legacy Run + EStop: запрос не выдан цепью, C2 OFF без Discharge;
- **M-E2a-35** deactivate N2/FBAnd91.AndIn4 (EOk) — убийца (D): Safe, Emergency, PLC (1,0) →
  запрос LV FALSE (модель t20: FALSE на +3, затем S4);
- **M-E2a-36** deactivate N12/FBAnd4.AndIn2 (крышка) — убийца (B): запрос HV снят при открытой
  крышке (модель t20: FALSE на +4).

**E2b:**
- **M-E2b-36** deactivate N1/FBAnd4.AndIn5 — убийцы B43-01(a) (энергия при EMG) и
  B43-02 δ ∈ {−1, 0} (скан SAFE с энергией), а также R&D + Bypass → C2;
- **M-E2b-37/38** deactivate FBAndBootFbkOff.AndIn1 / AndIn2, **M-E2b-39** deactivate
  N3/FBAnd1.AndIn3 — убийца EMG6-01-BOOT (t18);
- **M-E2b-40** deactivate FBAndBootFbkOff.AndIn4 (PrevG) — убийца B6-1: FBK OFF на r+1 / r+2000
  без нового Restart → Safe (модель t20);
- **M-E2b-41** deactivate FBAndBootFbkOff.AndIn3 (!зелёная) — убийца: после Restart при FBK ON
  FBK OFF, затем нажатие зелёной с удержанием 300 мс → у мутанта Safe во время нажатия
  (модель t21; в базе — только после отпускания);
- M-E2b-24/25 и M-E2b-34 → `equivalentBySearch` (после (А) в S6 нет источника команд;
  ревью x1: δ ∈ {−100, −1, 0, 1, 2, held}). Входы G10.AndIn7/8 сохраняются как защита,
  переоценка в E4 (Config);
- **M-E2b-35 удалена** (B5-3). C5 (vi) относится к декодеру: M-DEC-02 и новая **M-DEC-09**
  (swap-order DEC_EMG перед N1/FBEstop1 → статус читает EOk прошлого скана) в
  `MUTATION_PLAN_E4.decoder.json`;
- M-E2b-31/32 (порядок L1) — на стеке E2b.

**E2d:** M-E2d-01/02 сняты (D5-1), M-E2d-03…11 — без изменений.

**C5 (i)–(xvi):**
- (i)–(iv), (vii), (xi), (xii) — E3;
- (v), (vi) — E4 decoder (M-DEC-02, M-DEC-09);
- (viii) — M-E2d-04…07;
- (ix) — M-E2a-20;
- (x) — M-E2a-26;
- (xiii) — M-E2d-09…11;
- (xiv), (xvi) — E5 (квитирование; (xvi) «квитирующее нажатие не потребляет попытку»,
  убийца K3-ACK p = g+2100 / g+1, `current-e2d-fbk-k3ack`);
- (xv) — структурная проверка стенда: ни один FBK-вход не достигает канала FBEstop1.

## 9. Пробы стенда G-1…G-4 — где ожидание нормативно

Пробы инъецируют гранты в обход привязки. Ожидание «по построению» действует только из
стадии, которая является источником **обоих** инъецируемых грантов. Иначе инъекция
моделирует невозможную комбинацию.

| Проба | Нормативно из | Ожидание | Прочие стадии |
|---|---|---|---|
| G-1 g5 + g7 | **SR** | только S4 | наблюдение. S12: на E2a-кандидате FBOrS12Reset ещё нет (E2b), S12 сохраняется. S5: g7 из S5 невозможен (S5 сбрасывает только g9) |
| G-2 g4 + g7 | **SR** | только S4 | наблюдение (S12, S5, S6 — g7 оттуда невозможен по построению) |
| G-3 g6 + g7 | **S3** | только S4 | наблюдение |
| G-4 g2 + g4 | нет | две стадии — предел привязки | наблюдение во всех стадиях |

Отклонения на E2a-кандидате из S12/S5/S6 (HANDOFF стенда) — **не дефект**.

## 10. Эскизы E3…E6

- E3 ≈ +21 — как v5 (без HL_FAULT).
- E4 ≈ +19; DIS-HOLD: вход в Config — вторая причина сброса HV/LV.
- E5 ≈ +5 (`b_SafetyFault`, k3/k4, (xiv), (xvi)).
- **E6 ≈ +12…14.**
  - WIN_C1/WIN_C2 используются как окно watchdog.
  - **E6-1 (Q-V7-03 «А»): watchdog конца окна не гейтируется идущим abort.** При «окно
    истекло без FBK» SafetyFault ставится и во время abort, последовательность abort не
    меняется.
  - Мутант E6: «watchdog окна гейтирован отсутствием abort» → SafetyFault нет.
  - Плюс LV-watchdog 30 с (66(b)) и Q-RC-19 после окна.

## 11. Вопросы

- Аналитику: записать **TD-05** — гейт EOk у legacy PLC Safe→R&D (N2/FBAnd91.AndIn4).
  Ограничительно, энергию не добавляет.
- Открыто: Q-T3-2b.
- TD-01 подтверждён Вадимом (вопрос 74 «А»). TD-02…TD-04 ждут просмотра.

## 12. Влияние на существующие тесты (R6-5)

- `test/current-early-sto.test.js`, стр. 8/93/97/108: `completionDischargeReset: 'b_Reset_HV_Discharg_Req2'`
  и ожидание «old discharge Reset follows later feedback». После DIS-HOLD Symbol удалён, ожидание
  противоречит вопросу 73 «А».
- Тестировщику: заменить ожидание по DIS-HOLD-HV (запрос FALSE не позже u+1, источник
  `b_Set_HV_C2_1` → N1/FBOr5) без ослабления. На кандидате — через sandbox.

## 13. Legacy 2-битные команды PLC в E2 — перечень для решения (вопрос ведущего, E4)

`inPLC_RnD_Mode` (M1) и `inPLC_RnD_Mode_2` (M2) после E2d. Что может дать переход или энергию:

| Путь | Условие | Даёт | Гейты сейчас | Не гейтировано |
|---|---|---|---|---|
| **N2/FBAnd91 → N2/FBOr1 = g2** (Safe→R&D) | M1 ∧ ¬M2 ∧ S1 | переход S1→S12, затем C1 ON (N11) | S1; **EOk (v7)**; энергия — LvSetPermit (EOk, connector, Mentee, PLC-стоп) | FBK-10: ReadyForStep2 обходится, C1 включится при C1_FBK ON без команды; SafetyFault (E5); «кнопка нажата» (V14-Q14); фронт/уровень (MOD-003) |
| **N12/FBAnd10 → N12/FBOr1 → FBAnd4** (R&D→Run) | M1 ∧ M2 ∧ SR ∧ крышка | команда C2 (и сброс HV Discharge по DIS-HOLD), затем подтверждение Run через окно → STO снимается через `b_Set_STO_DR*_2` | стадия R&D, крышка, HvSetPermit (EOk…) | SU не ставится: StartingRun без защёлки (g7 из SR работает); FBK-10 (GATE_020.AndIn8 обходится); SafetyFault; кнопка нажата; фронт; abort E3 этот путь не видит |
| N6/FBAnd17 → N6/FBOr5 (Run→R&D) | ¬M1 ∧ M2 ∧ S3 | спуск (снятие энергии) | S3 | фронт; в E3 перенаправляется в Set owner |
| N1/FBAnd10/FBAnd12 → SS1 | ¬M1 / ¬M2 в Run | запрос SS1 | out_Step3 | — (только уменьшает энергию) |

Вывод для решения ведущего/Вадима:
- энергию в E2 могут добавить только первые два пути;
- оба обходят FBK-10, SafetyFault и правило «кнопка нажата»;
- R&D→Run по legacy-пути вдобавок не ставит SU.

Варианты:
- (а) гейтировать оба пути сейчас входом FBK-10. N2/FBAnd91.AndIn5/6 := ¬C1_FBK, ¬C2_FBK;
  N12/FBAnd10.AndIn3 := ¬C2_FBK. 0 FB, убиваемо FBK-10-тестом через PLC;
- (б) отключить legacy-путь целиком до E4. Это изменение интерфейса PLC — по D-TEAM п.4 нужен
  вопрос Вадиму;
- (в) оставить до E4 как known FAIL.

Рекомендую (а) как ограничительное без изменения интерфейса. Решение — ведущему.



## Addendum v7.1 (2026-10-22) — FBK-10 для legacy PLC-путей подъёма (решение ведущего: §13 вариант (а))

Это реализация Q-V4-02 «В» (подъём запрещён при FBK ON без команды) для всех источников подъёма,
а не новое правило. Срез — **E2d** (вместе с GATE_020.AndIn8). 0 FB, ресурсы E2d без изменений
(227 FB, 1926 портов).

Новые входы (контакт NO = «FBK OFF»):
- **Network2/FBAnd91.AndIn5 := `in_LV_C1_FBK` (NO)**, **AndIn6 := `in_HV_C2_FBK` (NO)** — legacy Safe→R&D (g2);
- **Network12/FBAnd10.AndIn3 := `in_HV_C2_FBK` (NO)** — legacy R&D→Run (FBOr1 → FBAnd4).

Модель (`repro/t22.out.txt`):
- Safe + C1_FBK ON без команды + PLC (1,0) → S1, C1 0; мутант AndIn5 → S12, C1 1;
- Safe + C2_FBK ON + PLC (1,0) → S1; мутант AndIn6 → S12;
- R&D + C2_FBK ON без команды + PLC (1,1) → R&D, команды C2 нет, STO активен;
  мутант FBAnd10.AndIn3 → Run (S3), C2 и STO сняты;
- позитивный контроль: Safe без FBK + PLC (1,0) → S12, C1 1.

Мутации (MUTATION_PLAN_E2d.json):
- M-E2d-12 — deactivate N2/FBAnd91.AndIn5;
- M-E2d-13 — deactivate N2/FBAnd91.AndIn6;
- M-E2d-14 — deactivate N12/FBAnd10.AndIn3.

Убийца каждой — FBK-10 через legacy PLC-подъём. Это вариант FBK-10, `current-e2d-fbk-unsolicited`.

**Known FAIL до E4/E5 — обходы legacy PLC-путями (после v7.1):**
1. SafetyFault (E5): legacy-подъём не блокируется активной SafetyFault (HLT-03, WDG, FBK-10-квитирование k3/k4).
2. «Кнопка нажата» (V14-Q14): legacy-уровень исполняется при нажатой зелёной или синей.
3. Фронт / уровень (MOD-003, PLC-01/02, V14-Q11): legacy-путь работает по уровню и повторяется после возврата в исходную стадию.
4. Одновременные команды (V14-Q8 / Q-RC-04/18): не обнаруживаются.
5. R&D→Run по legacy не ставит SU. StartingRun без защёлки, abort E3 этот путь не видит
   (аварийный g7 через стадию SR работает).
6. Окно и подтверждение (E2a-RC) и FBK-10 (v7.1) для legacy-путей действуют. EOk для Safe→R&D —
   v7 (FBAnd91.AndIn4); для R&D→Run — через HvSetPermit (энергия) и g7.

Все пункты закрываются заменой legacy-интерфейса в E4 (команды v1.4) и SafetyFault в E5.
