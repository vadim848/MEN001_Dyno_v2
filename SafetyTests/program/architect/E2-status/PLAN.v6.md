# E2-status v6 — механизм статусов, срезы E2 (база R1) и эскиз E3…E6

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
| SCENARIO_DECISIONS.md | `be839c37a0c05b48ad3586b147af88c0c873a1a6e61276efb85c4410179a4bf4` |

Правило D-TEAM-DEFAULTS: пограничные случаи решаются ограничительно или по аналогии. Решения
записывает аналитик в «Решено командой». Новые TD этим планом не вводятся. Используются TD-01
(LV Discharge), TD-02 (граница Run/R&D), TD-04 (FBK-10 p = g).

## 1. Срезы и ресурсы

| Срез | Состав | FB | Порты | Symbols | SAL-перем. |
|---|---|---|---|---|---|
| R1 | v2 §3 + addendum | 215 | 1832 | 65 | 75 |
| **E2a-core** (собран, SAL 5648e31c…) | кольцо, HEALTH_GUARD, полярность N11, переименование 4 SAL-переменных, **FBOr1.OrIn4 := g7**, **L1: N12/FBAnd16, SafeResumption/CONNECTORS и CONNECTOR_SCOPE — перед N1/FBAnd1** | 215 | 1832 | 65 | 75 |
| E2a-RC | окна WIN_C1/WIN_C2 + **DIS-HOLD** | 217 | 1836 | **63** | **76** |
| E2a-PLC | 7 файлов (Q-ARCH-11 «Б») | — | — | — | — |
| E2b | Emergency, крышка, connector, g10, **(А) Bypass**, **EMG6-01-BOOT** | **225** | 1908 | 63 | 78 |
| E2c | HLT, C-1, C-2 | 227 | 1926 | 63 | 79 |
| E2d | Safe-сторона, Q-REL, FBK-10 | 227 | 1926 | 63 | 79 |

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

**HV (FBRs7, `out_HV_Discharge_Request`):**
- новая SAL-переменная `linkRunUpAccepted` на **Network12/FBOr1.OrOut** — «принят R&D→Run»
  (recRndC_SU ∨ legacy PLC-подъём до E4), держится уровнем всё время StartingRun;
- **N1/FBOr5.OrIn2 := `linkRunUpAccepted`**;
- Symbol `b_Reset_HV_Discharg_Req2` удаляется: единственный его потребитель был FBOr5.OrIn2;
  выход FBAnd6 теперь идёт только wire в FBTon3.

**LV (FBRs5, `out_LV_Discharge_Request`) по TD-01:**
- **N1/FBOr1.OrIn2 := `b_Step12_Set`** — грант g2 «принят Safe→R&D»;
- Symbol `b_Reset_LV_Discharge_Req2` удаляется (единственный потребитель — N1/FBOr1.OrIn2).

Межсетевых wire нет: только Symbols и SAL-переменные.

Модель (`repro/t18.out.txt`):
- R&D→Run: SU на a, запрос HV FALSE на a+1;
- отклонённый BOTH (крышка открыта) — запрос остаётся TRUE;
- Safe→R&D: g2 на a, запрос LV FALSE на a+1;
- мутанты без сброса — запрос остаётся.

Если подъём прерывается (E3 abort, E6 откат), спуск снова выдаёт Discharge по своему
порядку. Сброс уровнем на время StartingRun этому не мешает: ABT сбрасывает SU (E3), а
разряд в abort ставится после сброса SU.

В E4 вход в Config добавит вторую причину сброса (OR). N12/FBOr1 в E4 удаляется вместе с
legacy PLC-путём, и `linkRunUpAccepted` переносится на новый OR «SU ∨ PLC-фронт».

Ресурсы: +2 FB, +4 порта; Symbols 65 → **63**; SAL-переменные 75 → **76**.

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
   - стартовый выход g1 теперь требует FBK OFF, как G10;
   - модель t18: старт с C1_FBK ON, Restart → нет стадии, статус EMG; FBK OFF и новый
     Restart → Safe; оба мутанта → Safe при FBK ON.

Criteria:
- IL-03, IL-05a/b, EMG4-02/03, EMG6-01, **EMG6-01-BOOT**;
- EMGREF-LV/RUN, REL-01(e), Q-T3-1;
- **B43-01, B43-02** (Bypass);
- E2-01.

Known FAIL на стеке до E2c: HLT; V14-Q7 Safe и Q-REL до E2d.

Ресурсы: +8 FB → **225**, +72 порта → 1908, SAL-переменные +2 → 78.

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
  - **DIS-HOLD M-E2a-30…33**.
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
- M-E2a-30 deactivate N1/FBOr5.OrIn2 — после принятого R&D→Run запрос TRUE на a+2 (t18);
- M-E2a-31 deactivate N1/FBOr1.OrIn2 — после принятого Safe→R&D запрос LV TRUE на a+2 (t18);
- M-E2a-32 (`rebind-global`, ручная) N1/FBOr5.OrIn2 := `linkRndBothQualified` («сброс от
  квалификации BOTH») — убийца: отклонённый BOTH (крышка открыта, REL01-e2) снимает запрос;
- M-E2a-33 (`rebind-global`, ручная) N1/FBOr5.OrIn2 := выход WIN_C2 (через временный Symbol) —
  «сброс от окна»: запрос TRUE до a+500.

**E2b:**
- **M-E2b-36** deactivate N1/FBAnd4.AndIn5 — убийцы B43-01(a) (энергия при EMG) и
  B43-02 δ ∈ {−1, 0} (скан SAFE с энергией), а также R&D + Bypass → C2;
- **M-E2b-37/38** deactivate FBAndBootFbkOff.AndIn1 / AndIn2, **M-E2b-39** deactivate
  N3/FBAnd1.AndIn3 — убийца EMG6-01-BOOT (t18);
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

Новых нет. Открыты у аналитика: Q-T3-2b (N12/FBAnd3.AndIn2). TD-01…TD-04 ждут просмотра Вадимом.
