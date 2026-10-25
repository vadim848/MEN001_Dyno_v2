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
| SCENARIO_DECISIONS.md | `052956fe6c7897c87b469815666ca61f252b1e26f14bdfb54ecd39c6dfefc44d` (v7.2; включает TD-05) |

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

## 7. E2c — без изменений (227 FB, 1926 портов, 78 SAL-переменных). E2d

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

- TD-05 (гейт EOk у legacy PLC Safe→R&D, N2/FBAnd91.AndIn4) аналитиком записан.
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

### 13a. E4 — вопрос 77 = А (к сведению, 2026-10-22; на E2/v7.5 не влияет, E4 не спроектирован)

- **Решение:** в E4 `inPLC_RnD_Mode`/`_2` удаляются целиком, без переходного параллельного режима.
  - Их заменяют биты v1.4 §8: CMD_SAFE_TO_R&D, CMD_R&D_TO_RUN, CMD_RUN_TO_R&D, CMD_R&D_TO_SAFE, CMD_TRIGGER_EMERGENCY.
  - Плюс Bypass (`inPLC_BypassC1C2`) → Config и heartbeat.
  - Статусы: STS_COVER_LOCKED, общий Fault, outPLC_*_Faulty.
- **Удаляется в E4** (только перечень, без проектирования; адреса — по стеку E2d v7.5):
  - путь (0,0) → SS1: N1/FBAnd12 (¬M1) и N1/FBAnd10 (¬M2) → N1/FBAnd2 (∧ out_Step3) → N1/FBOr12.OrIn2, FBOr13.OrIn2;
  - путь (1,0) Safe→R&D (g2): N2/FBAnd61 (M1), N2/FBAnd81 (¬M2), N2/FBAnd11 (S1) → N2/FBAnd91 (EOk, FBK-10 AndIn5/6) → N2/FBOr1.OrIn2;
  - путь (0,1) Run→R&D: N6/FBAnd15 (¬M1), N6/FBAnd16 (M2) → N6/FBAnd17 (∧ N6/FBAnd1) → N6/FBOr5.OrIn2;
  - путь (1,1) R&D→Run — уже удалён в E2d v7.5 (вопрос 76 Б);
  - SAL alias-переменные `inPLC_RnD_Mode`/`_2` с alias devices, PLC-переменными и links — в границах V14-Q2, без download;
  - снимаемые known FAIL: KF-1…KF-3 (включая KF-3-DESC) в части legacy-путей; FBK10-PLC-A и FBK10-PLC-REG (1) теряют объект проверки (переоценка — аналитик в E4).



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


## Addendum v7.2 (2026-10-22) — ревью v7/v7.1 (`program/reviewer/E2-plan-v7/PLAN_REVIEW.md`)

**N7-1 (E2d). Гейт FBK-10 для legacy R&D→Run проверяет «FBK ON без команды», а не сырой уровень.**
- v7.1 `N12/FBAnd10.AndIn3 := ¬in_HV_C2_FBK` заменяется так:
  - новый **Network12/FBOrFbk10C2** (safeOr: OrIn1 `in_HV_C2_FBK` NO, OrIn2 `out_HV_C2`);
  - wire → **N12/FBAnd10.AndIn3**;
  - порядок: перед N12/FBAnd10.
- Смысл: блок проходит, если FBK OFF или команда C2 уже выдана. `out_HV_C2` (RS в Network1, ранний ord) встаёт
  на скан раньше FBK, поэтому собственный FBK подъём не обрывает.
- +1 FB → **E2d 228 FB, 1935 портов**, 78 SAL-переменных.
- Модель (`repro/t23.out.txt`):
  - позитивный контроль R&D, PLC (1,1), FBK на u+1 / u+250 / u+499 → Run на u+600 / u+600 / u+601;
  - FBK ON без команды → R&D, команды C2 нет;
  - мутант «гейт по сырому уровню» (OrIn2 deact = вариант v7.1) → Run никогда, R&D с C2 ON — убит FBK10-PLC-REG (2).
- N2/FBAnd91.AndIn5/6 (Safe→R&D) не меняются. g2 — грант на 2 скана: стадия S12 защёлкнута, C1 идёт
  от стадии, собственный C1_FBK путь не обрывает (ревью x6 — PASS).
- Мутации E2d:
  - M-E2d-14 (FBAnd10.AndIn3 deact) — убийца: FBK ON без команды → Run;
  - **M-E2d-15** (FBOrFbk10C2.OrIn2 deact) — гейт по сырому уровню, убийца FBK10-PLC-REG (2);
  - **M-E2d-16** (FBOrFbk10C2.OrIn1 deact) — legacy-подъём не исполняется никогда, убийца — позитивный
    контроль FBK10-PLC-REG (1).

**§13 дополнение (полнота перечня).**
- `inPLC_BypassC1C2` (N1/FBAnd4) — инертен с E2b (вариант (А), AndIn5 := `b_Step1`).
- `in_C3_Manual_*`, `in_RBM_Manual_*` (N6/FBAnd5/6/7/8/20/21/22 → `out_C3_BatRelay`, `out_RBM_Bat`) — поведение
  reference 4495a1f, сохраняется. Только в Run/R&D (N6/FBAnd1/11). Это батарейные реле, не C1/C2/STO; переходов стадий не дают.
- `in_Estop_PLC` — только снятие энергии.

**KF-5 (N7-2) — known FAIL до E3/E4.**
- Legacy PLC (1,1) импульсом короче окна (~600 мс): R&D с C2 ON, без Run и без отката. Запрос HV снят
  принятием (DIS-HOLD); зелёная R&D→Safe не исполняется. Выход только через Emergency.
- Было и на v5; корень — legacy-уровень без защёлки SU (KF-4).
- **Изолированная точка досрочного отключения legacy R&D→Run** (если Вадим выберет (б)):
  **Network12/FBOr1.OrIn2** — wire от N12/FBAnd10. Деактивация отключает legacy R&D→Run целиком
  (C2-команда, подтверждение Run, сброс разряда), кнопочный путь через SU не затрагивается. 0 FB.
  Вопрос Вадиму передаёт ведущий.

**Гейт EOk на N12/FBAnd10 — equivalentBySearch E2a-RC** (ревью x8: PLC (1,1) в E+δ, δ ∈ {−2,−1,0,1,2,5};
g7 снимает SR раньше).

**T7-1…T7-3.**
- T7-1: устаревшая заметка «linkRunUpAccepted moves…» в PLAN.json заменена (источник — `b_Set_HV_C2_1`; в E4 —
  вторая причина сброса для Config).
- T7-2: заголовок §7 — 78 SAL-переменных.
- T7-3: SHA SCENARIO_DECISIONS → `052956fe…`; TD-05 записан.


## Addendum v7.3 (2026-10-22) — отклонения регресса на кандидатах E2b/E2c/E2d

Кандидаты (только чтение): E2b SAL `386e208b…cfec`, E2c `b344870c…8839`, E2d `365f2c2e…bd6a`.
Модель на самих кандидатах: `repro/cand.mjs` (новые имена входов), `c1`–`c5`.

**D-E2b-1 — ошибка плана, исправляется (срез E2b).**
- В v2 крышка снята с GATE_001 и проверяется только в скане принятия (GATE_020), а GATE_030.OrIn5 потребляет
  только квалифицированный BOTH. Поэтому эпизод крышки во время удержания BOTH попытку не портит: после
  восстановления крышки удержание исполняется — это нарушает REL-01(c), IL-02, SPEC §5.1 и TD-07.
- Исправление: эпизод потери разрешения подъёма **при нажатых обеих кнопках** ставит защёлку недействительной
  попытки STATE_L. Это существующий механизм рекогнайзера: сбрасывается только полным отпусканием 2 с, GATE_015.
  - **RndPhysicalCompact/GATE_SPOIL_R** (safeAnd: AndIn1 wire GATE_003 «обе нажаты», AndIn2 `b_Step_RnD`,
    AndIn3 `linkCoverClosed` NO) → wire **GATE_029.OrIn6**;
  - **RndPhysicalCompact/GATE_SPOIL_S** (safeAnd: AndIn1 wire GATE_003, AndIn2 `b_Step1`, AndIn3 `linkConnectorsOk` NO)
    → wire **GATE_029.OrIn7** (это D-E2b-3(б), см. ниже);
  - новая SAL-переменная **`linkConnectorsOk`** на SafeResumption/CONNECTORS.AndOut;
  - порядок: оба блока непосредственно перед RndPhysicalCompact/GATE_029.
- Что не затронуто:
  - Safe→R&D при открытой крышке (V14-Q7) — SPOIL_R требует стадию R&D;
  - зелёная вниз и синяя в R&D при открытой крышке (V14-Q21a, Q-ARCH-10 «А») — нужны обе кнопки;
  - HLT — не рекогнайзер.
- Модель (`c4` на E2b, `c5` на E2d):
  - R&D, эпизод NC1 200 мс при удержании BOTH: кандидат → Run; с v7.3 → R&D; новый жест после 2,1 с → Run.
    Мутант без OrIn6 → Run;
  - Safe, эпизод connector 200 мс при удержании BOTH: кандидат → R&D; с v7.3 → Safe; новый жест → R&D.
    Мутант без OrIn7 → R&D;
  - на стеке E2d: Safe с открытой крышкой + BOTH → R&D; R&D с открытой крышкой: зелёная → Safe, синяя → Unlock;
    BOTH при открытой крышке, восстановление при удержании → R&D (IL-02).
    Примечание (V73-D): этот случай c4 не различающий — крышка восстанавливается после Q, обе версии дают R&D.
    Различающий — восстановление до Q при удержании: coverHold p+300…p+500 и проба 1 скана при p+998.
- GATE_030.OrIn5 сохраняется (потребление квалифицированного BOTH вне R&D-гейта). M-E2b-21 на стеке v7.3 может
  стать эквивалентной — тестировщику/ревьюеру проверить, при эквивалентности отметить equivalentBySearch.

**D-E2b-3(б) — ошибка плана, исправляется тем же механизмом (GATE_SPOIL_S).** CONNECTOR_SCOPE = S1 ∨ connectors
сохраняется для GATE_001: в Safe потеря connector не должна снимать прочие жесты. Запрет подъёма без fault
(EMG-003 / Q-RC-14) уже держится через SAFE_UP_SCOPE и ReadyForStep2. Порча попытки добавляется только при
нажатых обеих кнопках.

**D-E2b-3(а) — не дефект логики; это определение t_a в тесте.**
- Акцептный маркер спуска (архитектор, CRITERIA §B «принятие по маркеру архитектора») —
  **скан установки N6/RUN_DOWN_OWNER** (`linkRunDownOwner` TRUE).
- В тесте t_a(obs) = первое изменение выходов. В E2 (F1-цепь спуска) — исправлено по V73-D: owner = P+501
  (зелёная в P), HV discharge на **owner+3**, STO и C2 OFF на **owner+4** (не owner+2). Значит «t_a(obs)−1» теста
  позже owner, то есть **после** принятия. Защитный спуск в R&D там верен по Q-RC-03 (b1).
- Модель `c1` на E2b: крышка на owner−3…owner (включительно) → Emergency (S4, EOk 0); owner+1 → R&D.
- Тестировщику: t_a(down) = первый скан `linkRunDownOwner` TRUE (определение — аналитик, V73-A); вариант
  «≤ t_a(obs)−3» как oracle не использовать. В E3 SS1 будет сниматься от owner,
  и разрыв сократится.

**D-E2b-3(в) — не дефект; допустимое опережение.**
- На E2b в StartingRun крышка и `in_Estop_PLC` дают одинаковые моменты (`c3`): EOk +1, S4 +2, LV discharge +3,
  C1 OFF +2004, STO +7006, C2 OFF +8010.
- Разница +2004 против +2005 — это сравнение со **Run-эталоном** (L2): в Run g7 идёт через N6/FBAnd9, который
  читает `out_EStop_Status` прошлого скана, а в SU — через FBAndLvEmg по текущему `b_EStop_Ok`.
- Опережение на 1 скан — более раннее снятие энергии (D-TEAM п.1), в пределах L1 (Del τ_R−1 ≤ τ_X ≤ τ_R).
  Тестировщику L2 SU против Run: допуск −1…0 (ревью v4 §2 это уже отмечало).

**Known FAIL до E2d (на стеке E2b/E2c)** — модель `c4`:
- Safe→R&D при открытой крышке (V14-Q7) не принимается: в LvCurrentPermit и N2/FBAnd1 крышка до E2d;
- R&D→Safe зелёной при открытой крышке не завершается: g5 требует `linkLvCurrentPermit` с крышкой до E2d.

Ресурсы v7.3 (+2 FB, +18 портов, +1 SAL-переменная):

| Срез | FB | Порты | SAL-переменные |
|---|---|---|---|
| E2b | **227** | 1926 | 78 |
| E2c | 229 | 1944 | 79 |
| E2d | **230** | 1953 | 79 |

Мутации E2b:
- M-E2b-42 — deactivate GATE_029.OrIn6 (убийца: эпизод крышки при удержании BOTH в R&D → Run);
- M-E2b-43 — deactivate GATE_029.OrIn7 (эпизод connector в Safe → R&D);
- M-E2b-44 — deactivate GATE_SPOIL_R.AndIn3 (R&D→Run жестом невозможен);
- M-E2b-45 — deactivate GATE_SPOIL_S.AndIn3 (Safe→R&D жестом невозможен);
- M-E2b-46 — deactivate GATE_SPOIL_R.AndIn2 (порча и в Safe при открытой крышке, то есть V14-Q7 ломается).
  Убийца — только на стеке E2d.

**Рецепт редактору** (E2b; E2c/E2d пересобрать скриптами):
1. Добавить SAL-переменную `linkConnectorsOk` (sourceUsage SafeResumption/CONNECTORS.AndOut; targetUsage GATE_SPOIL_S.AndIn3).
2. Добавить два safeAnd в сеть RndPhysicalCompact с входами, как выше. AndIn1 — wire от GATE_003.AndOut (та же сеть).
   Входы AndIn2/3 — Symbol или SAL-переменная; AndIn3 с контактом NO.
3. Wire GATE_SPOIL_R.AndOut → GATE_029.OrIn6, GATE_SPOIL_S.AndOut → GATE_029.OrIn7 (Activated, NC).
4. orderOfExecution: оба блока сразу перед GATE_029, остальные — сдвиг без изменения относительного порядка.
5. Межсетевых wire нет; native save/CRC, структурные проверки G2.


## Addendum v7.4 (2026-10-22) — E2d-COV-1: крышка должна гейтировать HV/STO в R&D→Run

**Атрибуция.** E2d п.1 (v4) деактивировал NC1/NC2 в N1/FBAndLvCurrentPermit (`linkLvCurrentPermit`), чтобы открыть
путь Safe→R&D (V14-Q7). Но это разрешение общее: через AndIn2 оно гейтирует также FBAndHvSetPermit (C2) и
FBAndSto1/2SetPermit (снятие STO).
- В v2 я отклонил отдельные входы крышки в HV/STO-разрешениях как неубиваемые: SU ставится только при закрытой
  крышке (GATE_020). Это неверно: SU уже защёлкнут на u−2, а крышка открывается в скане u, когда команда C2
  и снятие STO исполняются по удержанию SU/FBAnd4. N12/FBAnd16 гейтирует только сам запрос FBAnd4, а запрос C2
  в RS проходит в скане u по значению прошлого скана.
- Модель на кандидате E2d (`repro/c6.out.txt`): SU на 999, u = 1001; NC1 FALSE в u → C2 ON u+0…u+8009,
  STO снят u+0…u+7005, EOk FALSE с u+1. Это совпадает с находкой аналитика. При `in_Estop_PLC` в u — ни C2, ни STO
  (сырой вход есть в LvCurrentPermit.AndIn1).

**Исправление (срез E2d, 0 FB, атомарно с деактивацией крышки в LvCurrentPermit):**
- **Network1/FBAndHvSetPermit.AndIn5 := `in_InterLock_NC_1`, AndIn6 := `in_InterLock_NC_2`** (NC);
- **Network1/FBAndSto1SetPermit.AndIn5/AndIn6 := NC1/NC2**;
- **Network1/FBAndSto2SetPermit.AndIn5/AndIn6 := NC1/NC2**.

Итого 6 входов — сырые безопасные входы на AndIn ≥ 2 (не Standard-In). LV-разрешение (LvSetPermit) крышку не
получает: V14-Q7 сохраняется. Подъём HV и снятие STO теперь требуют закрытой крышки в каждом скане команды.

Модель (c6, E2d + исправление):
- NC1 FALSE в u → C2 0 сканов, STO 0 сканов, EOk FALSE u+1 — как при `in_Estop_PLC`;
- без события → Run, C2 и STO как в базе (позитивный контроль);
- мутант HvSetPermit.AndIn5 → C2 u+0…u+8006;
- мутант Sto1SetPermit.AndIn5 → STO u+0…u+7005.

v7.3 (GATE_SPOIL_*) затрагивает только рекогнайзер и с этим исправлением не пересекается.

Ресурсы E2d — без изменений: 230 FB, 1953 порта, 79 SAL-переменных. Активных входов +6.

**Мутации E2d:**
- M-E2d-17 / 18 — deactivate FBAndHvSetPermit.AndIn5 / AndIn6;
- M-E2d-19 / 20 — Sto1SetPermit.AndIn5 / AndIn6;
- M-E2d-21 / 22 — Sto2SetPermit.AndIn5 / AndIn6.

Убийца всех шести — E2d-COV-1: R&D→Run принят (SU в u−2), NC1 (или NC2) FALSE с u → ни одного скана C2 ON
и ни одного скана снятого STO с u. Для Sto2 смотреть STO_DR2.

**Рецепт редактору (E2d):** в трёх блоках Network1 активировать AndIn5/AndIn6, NC, с привязкой к SAL-переменным
`in_InterLock_NC_1`/`_2` (новые targetUsages). Порядок и wire не меняются. Затем native save/CRC и G2.

## Addendum v7.4.1 (2026-10-22) — machine-readable E2b..E2d, no logic change

- PLAN.json `slices[]` E2b/E2c/E2d now carry every structural change (including v7.1–v7.4) in the grammar of
  `src/native-delta-plan.mjs` (I-1..I-9): fields `extra` (Symbol creation `Out += link*`, applied before `newBlocks`),
  `newBlocks` (explicit port per input, contact NC/NO), `changes` (`P := S`, `P deactivate`), `order` (before/after).
  Former free text is kept in `slices[].rationale.freeTextV74`. Logic identical to v7.4 (PLAN.v7_4.json/.md).
- `addendum71..74` moved under `integratedAddenda` (records only); E2b/c/d order items moved from
  `mechanism.order.moves` to `slices[].order` (old text: `movesV74`).
- `source.e2aRcCandidate` = 5733552a…660f3f; E2a-core portsAfter 1832, sgvlAfter 65, salVarsAfter 75;
  E2b/c/d resources 227/1926/78, 229/1944/79, 230/1953/79, SGVL 63; E2d fbDelta 1 (FBOrFbk10C2).
- Check against the v7.2 builds: all 39/9/15 items interpreted; remaining differences are exactly the v7.3
  (GATE_SPOIL_R/S, linkConnectorsOk) and v7.4 (InterLock NC1/NC2 on HV/STO permits) items not yet built.

### v7.4.1 — правки по ревью V73-C / V73-D (только план мутаций и текст, логика не меняется)

- MUTATION_PLAN_E2b.json: M-E2b-47 = GATE_SPOIL_R.AndIn1 (существенный; убийца: R&D с открытой крышкой — зелёная
  не спускает, синяя не даёт Unlock; стек E2d); M-E2b-48/49 = GATE_SPOIL_S.AndIn1/AndIn2 (поиск убийцы тестировщиком,
  иначе equivalentBySearch со списком сценариев; AndIn2 — вероятно эквивалентен); M-E2b-46 — «kill deferred to E2d
  stack», не equivalent; M-E2b-21 — кандидат на equivalentBySearch, решает тестировщик поиском.
- D-E2b-3(а): первые выходы owner+3 (HV discharge) / owner+4 (STO, C2 OFF); c4 «IL-02» помечен как не различающий.

## Addendum v7.5 (2026-10-22) — вопрос 76 = Б: legacy PLC (1,1) R&D→Run отключён в E2d

- Срез **E2d** (база — E2c ee8439ae…). E2b/E2c не меняются. Элементы — в PLAN.json `slices[] E2d`
  (`deleteBlocks`, `changes`), грамматика v7.4.1:
  - `Network12/FBOr1.OrIn2 deactivate` — точка изоляции. После неё FBOr1 = `recRndC_SU`, то есть только кнопочный StartingRun;
  - удалить мёртвые `Network12/FBAnd8`, `FBAnd9`, `FBAnd10`: они питали только FBOr1.OrIn2;
  - отменить v7.2 `FBOrFbk10C2` и `FBAnd10.AndIn3`: охраняемый путь исчез.
- **Почему удалить, а не оставить:**
  - мёртвую логику нельзя проверить, все её мутанты эквивалентны;
  - E4 проектирует новые команды по фронту и прежний AND по уровню не переиспользует.
  - Alias `inPLC_RnD_Mode/_2` и прочие декодеры — N1 (0,0), N2 (1,0), N6 (0,1) — не трогаются; в N12 снимаются 6 target usages и 4 wire — полная дельта ниже (V75-A).
- **Ресурсы E2d:** 226 FB / 1917 портов / 79 SAL-переменных / 63 SGVL. Было по v7.4.1: 230 / 1953.
- **Модель** `repro/c7.out.txt`:
  - (1,1) удержание 5 с, импульс 300 мс (KF-5), FFS «крышка 200 мс при (1,1)» (D-V74-2) и KF-3-DESC: C2 0, STO 0, Run 0, стадия R&D. Без v7.5: C2 с +3, Run;
  - позитивы BOTH R&D→Run и PLC (1,0) Safe→R&D совпадают.
- **Мутации:**
  - M-E2d-14/15/16 сняты (блоков нет);
  - новая M-E2d-23 «legacy (1,1) снова активна» — убийца LEG11-OFF; оператора нет. Мутант по смыслу = Network12 из E2c, поэтому LEG11-OFF на E2c должен давать FAIL.
- **Known FAIL:**
  - перестают быть: KF-5, KF-3-DESC в части (1,1), D-V74-2;
  - остаются: FBK10-PLC-A (Safe (1,0)) и KF-1…KF-4 для (1,0) и спусков;
  - устарели только оракулы FBK10-PLC-B и FBK10-PLC-REG (2) (подъём (1,1)), их заменяет LEG11-OFF (аналитик, Q76-N2/Q76-N1);
    FBK10-PLC-REG (1) проверяет путь (1,0), он не отключён и остаётся без изменений (E2-Q76 §4, Q76-P4).

### v7.5 — полная объявленная дельта (V75-A) и учёт M-E2d-23 (V75-B)

Относительно замороженного E2d-v7.4.1 (a5acf291…; 230 FB / 1953 портов / 293 wire):
- удаляются блоки N12/FBAnd8, FBAnd9, FBAnd10, FBOrFbk10C2;
- снимаются **6 target usages** (все — SAL-переменные):
  - inPLC_RnD_Mode → FBAnd8.AndIn1;
  - in_False_SI2_CH8 → FBAnd8.AndIn2 и FBAnd9.AndIn2;
  - inPLC_RnD_Mode_2 → FBAnd9.AndIn1;
  - in_HV_C2_FBK → FBOrFbk10C2.OrIn1;
  - out_HV_C2 → FBOrFbk10C2.OrIn2;
- снимаются **4 wire**: FBAnd8→FBAnd10.AndIn1, FBAnd9→FBAnd10.AndIn2, FBOrFbk10C2→FBAnd10.AndIn3, FBAnd10→FBOr1.OrIn2;
- FBOr1.OrIn2: Activated NC → Deactivated; ничего не добавляется;
- итог: 226 FB / 1917 портов / **289 wire** / 79 SAL / **63 SGVL** / 182 globalRefs.

**SGVL пересчитан:** 63 в E2c, E2d-v7.4.1 и v7.5. Имена те же; v7.5 не снимает ни одного SGVL-символа и ни одного SGVL usage.

Относительно базы цепочки E2c (ee8439ae…; 292 wire): часть v7.5 — 3 блока, 4 target usages, 3 wire. FBOrFbk10C2 на этом пути не возникает. Детали — PLAN.json `slices[] E2d rationale.v75.declaredDelta`.

**M-E2d-23 (V75-B):**
- мутант — замороженный E2d-v7.4.1 a5acf291, не E2c;
- засчитывается при трёх условиях: LEG11-OFF FAIL на нём; PASS на новом E2d; точная дельта E2d-v7.4.1 → E2d равна ровно v7.5;
- E2c — только дополнение; в G3 — «killed by frozen mutant source».

M-E2d-14/15/16 — «removed with v7.5», не equivalent.

## Addendum v7.6 (2026-10-22) — K-1: порча попытки при потере разрешения во время первой кнопки

**Факт.** На E2d 2276d773 (v7.5) K-1 сохраняется (`repro/c8.out.txt`).
- Эпизод разрешения [f−300, f+10): первая кнопка в f, вторая в f+100, обе 1100 мс.
- Safe (LV или оба connector): Safe→R&D на f+1102.
- R&D (NC1 или NC1+NC2): Run на f+1703.

**Oracle REL01-e2** (E2-plan-v4-questions, READY-D) требует отказа для [f−300, f+10) и [f, p+300). Принятие допускается
только при r ≤ f−1, r = f — наблюдение.
- Это **дефект плана v7.3**: GATE_SPOIL_R/S срабатывали только при обеих нажатых кнопках (GATE_003).
- Вопроса аналитику нет: строка oracle однозначна.

**Исправление (срез E2d; E2b/E2c не трогаются, K-1 на них остаётся known FAIL).**
- Новая память попытки `STATE_PF` («разрешение терялось в этой попытке»):
  - Set: любая кнопка нажата (GATE_002 NO) ∧ стадия ∧ потеря разрешения. Для R&D разрешение — крышка, для Safe — connectors. Сигнал берётся из существующих GATE_SPOIL_R/S;
  - Reset: RELEASE.TonOut — обе отпущены на полный фильтр, reset-dominant.
- Попытка портится (STATE_L) только при обеих нажатых и STATE_PF (GATE_SPOIL_PF).
  - Одиночные жесты при потере разрешения не затронуты: зелёная вниз и синяя Unlock в R&D с открытой крышкой; одиночные в Safe без connector.
  - Прежняя порча «обе нажаты ∧ потеря» — частный случай: STATE_PF ставится и читается в том же скане.
- Элементы — PLAN.json `slices[] E2d` (`newBlocks`, `changes`, `order`):
  - NEW GATE_PF_SET safeOr (SPOIL_R, SPOIL_S);
  - NEW STATE_PF safeRs (Reset RELEASE.TonOut, Set GATE_PF_SET);
  - NEW GATE_SPOIL_PF safeAnd (GATE_003, STATE_PF);
  - SPOIL_R/S.AndIn1 := wire GATE_002, контакт NO;
  - GATE_029.OrIn6 := wire GATE_SPOIL_PF; GATE_029.OrIn7 deactivate;
  - порядок: SPOIL_R, SPOIL_S, GATE_PF_SET, STATE_PF, GATE_SPOIL_PF — подряд перед GATE_029.

**Модель (c8, на 2276d773 + исправление в памяти).**
- K-1 Safe ×2 и R&D ×2 → отказ.
- Без изменений: [f, p+300), [p+500, p+999), [p+1, p+2) — отказ; r ≤ f−1 и r = f — принято.
- Контроль V14-Q7 (Safe, крышка [p+500, p+999)) — принято. Без эпизода Safe→R&D на f+1102, R&D→Run на f+1703 — как в базе.
- Одиночные: зелёная в R&D с открытой крышкой → Safe; синяя → Unlock 1. Новая попытка после полной очистки 2,1 с → Run.
- Мутанты исправления:
  - возврат AndIn1 к GATE_003 → K-1 FAIL;
  - без GATE_029.OrIn6 → K-1 FAIL;
  - Reset STATE_PF := константа FALSE → новая попытка после очистки отвергается.

**Ресурсы E2d:** 229 FB / 1938 портов / 294 wire / 79 SAL / 63 SGVL. По v7.5 было 226 / 1917 / 289.

**SHA.** E2d 2276d773 больше не объявлен, он заморожен как `frozenMutantSources['E2d-v7.5']`. Пересборка E2d — на E2c ee8439ae…

**Мутации:**
- MUTATION_PLAN_E2d: M-E2d-24…31;
- MUTATION_PLAN_E2b: пометки `onE2dV76` к M-E2b-42/43/47/48. M-E2b-47/48 на стеке E2d вероятно эквивалентны: без кнопки STATE_PF подавлен reset; поиск убийцы — тестировщик.

### v7.6 (продолжение) — K-2 (WDG-02/MOD-001) и TD-15

**K-2: дефект плана E2c.**
- Атрибуция. `SafeResumption/HLT_LV` = LV Faulty ∧ ¬SU ∧ ¬in_False — без стадии. Его выход `linkHltLvLost`
  идёт в `GATE_030.OrIn6` (STATE_C, «попытка потреблена», пункт E2c C-2).
  - В Safe при LV Faulty TRUE каждая попытка потребляется до принятия BOTH. Итог: ни b_Step12, ни C1.
  - Второй потребитель (GATE_SG_SET → STATE_SG) вне R&D безвреден: Reset = ¬linkSafeRndScope, reset-dominant.
- Исправление: `SafeResumption/HLT_LV.AndIn4 := b_Step_RnD` (NC). HLT действует только в R&D (HLT-01).
  - Ресурсы: 0 FB, 0 портов, 0 wire, +1 SGVL usage.
- Модель (`repro/c9.out.txt`, 2276d773 + v7.6 в памяти). Faulty с p−200 / p+900 / A / A+1:
  - S12 в A = p+1001, C1 в p+1002;
  - снятие Faulty на t_f+5000 → R&D;
  - удержание → S12 с C1. Откат через 30 с и SafetyFault — E6, known FAIL.
  - HLT-01 (устойчивый R&D, LV Faulty → Safe) не изменился.
- Мутации: M-E2d-32 (AndIn4 deactivate, убийца — K-2), M-E2d-33 (инверсия контакта, убийца — HLT-01).

**TD-15 выполнено, изменений не требуется** (2276d773 и v7.6, модель c9):
- BOTH Safe→R&D, connector FALSE с c ∈ {A−1, A, A+1}: C1 ни в одном скане ≥ c, Emergency;
- BOTH R&D→Run, NC1 FALSE с c ∈ {A−1…A+2} (A — первый `recRndC_SU`, u = A+2): нет C2 ON и снятия STO в сканах ≥ c;
- legacy PLC (1,0) Safe→R&D, connector с c ∈ {A−1, A, A+1}: C1 ни в одном скане ≥ c, Emergency;
- при c = A для R&D→Run исход — отказ без Emergency (i); для Safe→R&D — b_Step12 в A (наблюдение) и Emergency в A+1.

**Ресурсы E2d v7.6:** 229 FB / 1938 портов / 294 wire / 79 SAL / 63 SGVL / globalRefs 183.

### v7.6 — объявленная дельта (V76-A), второй симптом K-2 (V76-B), мутации (V76-C)

**Дельта v7.6 против замороженного E2d-v7.5 (2276d773; 226 FB / 1917 портов / 289 wire / 182 globalRefs).**
Против E2c (`vsChainBaseE2c.v76Part`) часть v7.6 та же.
- FB +3: GATE_PF_SET (safeOr), STATE_PF (safeRs), GATE_SPOIL_PF (safeAnd). Портов +21.
- Порты STATE_PF: **Reset ← RELEASE.TonOut, Set ← GATE_PF_SET.OrOut**. Они привязаны именованными пунктами `changes`.
- Wire +7:
  - SPOIL_R → PF_SET.OrIn1, SPOIL_S → PF_SET.OrIn2;
  - PF_SET → STATE_PF.Set, RELEASE → STATE_PF.Reset;
  - GATE_003 → SPOIL_PF.AndIn1, STATE_PF → SPOIL_PF.AndIn2;
  - SPOIL_PF → GATE_029.OrIn6.
- Wire −2: SPOIL_R → GATE_029.OrIn6, SPOIL_S → GATE_029.OrIn7.
- Перепривязаны 2: SPOIL_R/S.AndIn1, GATE_003 → GATE_002.
- Контакты:
  - SPOIL_R/S.AndIn1 NC → NO;
  - GATE_029.OrIn7 → Deactivated;
  - HLT_LV.AndIn4: Deactivated → Activated NC.
- Usage: +1 SGVL target `b_Step_RnD` → HLT_LV.AndIn4. SGVL-файл меняется (FbPortUsages = SAL globalRefs). Символов SGVL по-прежнему 63.
- **after = 229 FB / 1938 портов / 294 wire / 79 SAL / 63 SGVL / 183 globalRefs.**
- Запись `sgvl` исправлена: в E2d добавляются +b_Step12 (MODE.OrIn4, v7.4.1) и +b_Step_RnD (HLT_LV.AndIn4, v7.6).

**K-2, второй симптом (V76-B).** Unlock в Safe при LV Faulty (синяя одиночная):
- E2a-RC и E2b — Unlock на P+501;
- E2c и E2d-v7.5 — нет;
- v7.6 — на P+501, как при LV в норме.

Это тот же дефект E2c: HLT_LV без стадии потребляет попытку. Второй убийца M-E2d-32. Норму подтверждает аналитик.

На G3 K-2 на E2c / E2d-v7.5 записывается как атрибутированный known FAIL «fixed in E2d v7.6» (V76-D).

**Мутации (V76-C):**
- M-E2b-47/48 на стеке E2d v7.6 — equivalentByProof. До нажатия RELEASE.TonOut — reset-dominant для STATE_PF; в скане нажатия база ставит Set при тех же условиях. На стеке E2b убийство остаётся как запланировано.
- M-E2d-29: точка убийства r+2001. База принимает с r+2001, при r+1999 и r+2000 — отказ; мутант отвергает всегда.
