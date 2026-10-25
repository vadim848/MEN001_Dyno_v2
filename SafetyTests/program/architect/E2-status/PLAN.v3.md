# E2-status v3 — механизм статусов, срезы R1 и E2a…E2d, бюджет E3…E6

Роль: v2-architect. Дата: 2026-10-21. Версия 3.

Основание:
- ревью `program/reviewer/E2-plan-v2/PLAN_REVIEW.md` (A-1…3, B-1…5, C-1…3, D-1…3, §8–10);
- G1-ревью `program/reviewer/E2-G1-v2/G1_REVIEW.md` (C3, MU24, m-e, RUN-CONF);
- раннер мутаций `program/stand/E2-runner/HANDOFF.md`;
- новые ответы Вадима.

Прежние версии сохранены: `*.v1.*`, `*.v2.*`, `repro/v1/`, `repro/v2/`.
Canonical не менялся. Запись только в `SafetyTests/program/architect/E2-status/`.

## 0. Источник

| Объект | SHA256 |
|---|---|
| canonical SAL (F1) | `04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3` |
| canonical SGVL | `dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104` |
| canonical diagram | `de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603` |
| SCENARIO_DECISIONS.md | `bdf55216dab6e4aa3e3a1c01ae51f9441d2a3664c5ec8fd93955379bbbdb86fe` |
| reference | 4495a1f, только `git show` |

**Решения Вадима, на которые опирается v3:**
- Q-ARCH-01=А, Q-E2Q-01=А, Q-RC-14=А — авария вне Run;
- Q-ARCH-03=Б, Q-ARCH-04=А, Q-ARCH-05/Q-RC-11=А;
- Q-ARCH-08=Б, Q-ARCH-09=В;
- Q-RC-12, Q-RC-13=Б, Q-RC-15=Б, Q-RC-16=А, Q-RC-17=Б, Q-RC-18, Q-RC-19=В;
- Q-E2Q-02=А, Q-REL-AFTER-PERMIT=А;
- D-ARCH-POL, D-ARCH-POL-RENAME (с outPLC);
- Q-ARCH-06=А (R1 разрешён; R2 и слияние латчей — нет).

**Решения ведущего:**
- C-R1-2 (а): снимается binding `b_Step6`, Symbols 65;
- D2-A сохраняется;
- Q-RC-13 «Б»: общий бит Fault для PLC = OR на выходе, латчи не сливаются.

## 1. Что меняется против v2 (кратко)

| Замечание | Решение v3 |
|---|---|
| R1 | **Без изменений** (CONFIRMED). Добавлено только C-R1-2 (а): снять Symbol-binding `b_Step6` с N3/FBRs6.RsOut — 65 Symbols |
| A-1 | Переименование в тестах — по таблице соответствия (reference/pinned — старое имя, canonical — новое); указание стенду |
| A-2 | Потеря Healthy в устойчивом Run в E2 по-прежнему ведёт в Step4 (F1). Q-RC-02/STP-G — oracle только с E3 |
| A-3, B-1, B-3, Q-ARCH-01, Q-RC-14 | Аварийный грант g7 привязан к **стадии**, а не к SU: `(S12 ∨ SR) ∧ !b_EStop_Ok` → общая цепь S4…S6. Реакция не зависит от того, сброшен ли SU в том же скане |
| EMG6-01 | Выход S6→S1 (g10) по Restart при снятой энергии — в E2b |
| B-2, D-3 | Все изменения крышки в R&D/Run (GATE_001, GATE_020, GATE_030) перенесены в E2b. E2d — только Safe-сторона и синяя |
| B-4 | ID критериев — по CRITERIA v2 (IL-03, IL-05a/b, EMG4-02/03, EMG6-01…) |
| B-5 | M-E2b про FBAndLvEmg убивается проверкой памятей стадий **и** выходов (энергия) |
| C-1 | Порядок: HLT_LV после STATE_SU; вход GATE_020.AndIn7 = `!recRndC_SG` (теперь убиваемый) |
| C-2 | HLT потребляет попытку: GATE_030.OrIn6 = `linkHltLvLost`. Полная SafetyFault — E5, с явным FAIL |
| C-3 | Q-ARCH-03 «Б» — проектируется в E3 (ABT по LV). До E3 потеря LV в StartingRun — известный FAIL |
| D-1, Q-ARCH-04 | Синяя: в Safe крышка не мешает; в R&D запрет F1 сохранён через `linkIlScope` (вопрос Q-ARCH-10) |
| D-2 | Убийца N1/FBAnd4.AndIn3/4 — в R&D/S12 при открытой крышке. Legacy Bypass в R&D при закрытой крышке — известный FAIL CFG-02 до E4 |
| Q-REL-AFTER-PERMIT, MU24 | `SafeResumption/MODE.OrIn4 := b_Step12` (E2d). RELEASE и STATE_A не меняются. MU24 остаётся убиваемым (см. §6) |
| RUN-CONF | Отсчёт 0,1 с от C2_FBK — вариант E2a-RC, ждёт подтверждения аналитика (§3) |
| Q-RC-17 | Исправлено в эскизе E3: освобождение только для нормального Run→R&D без Healthy-события |
| Раннер | testFiles — 16 точных имён; behaviouralTests `^E2[a-d] `; sourceSha256 = `FILL_AT_G2` |
| m-e | Символ SafetyFault: **`b_SafetyFault`** (SGVL, создаётся в E5) |

## 2. Механизм (принят ревью; v3 — расширение g7)

### 2.1 Стадии, гранты, Reset

| Стадия | RS | Группа статуса |
|---|---|---|
| S1 | N3/FBRs1 | SAFE |
| S12 | N3/FBRs8 | SAFE (источник) |
| SR | N3/FBRs7 | RND (дети SU, SG) |
| S3 | N3/FBRs3 | RUN (ребёнок owner) |
| S4/S5/S6 | N3/FBRs4/5/6 | EMG |
| нет стадии | — | EMG (Q-RC-10) |

Гранты:
- g1 — N3/FBAnd1;
- g2 — `b_Step12_Set`;
- g3 — `b_Step_RnD_Set`;
- g4 — `b_Step3_Set_2`;
- g5 — `b_Step2_Set_2`;
- g6 — `b_Step12_Set_2`;
- **g7 — `b_Step4_Set`** = N6/FBOrStep4 = N6/FBAnd2 (S3 ∧ !FBAnd9) ∨ N6/FBAndLvEmg ((S12 ∨ SR) ∧ !b_EStop_Ok);
- g8 — `b_Step5_Set`;
- g9 — `b_Step6_Set`;
- **g10 — N3/G10_EXIT** (S6→S1).

| RS | Set | Reset |
|---|---|---|
| FBRs1 (S1) | FBOr2 = g1 ∨ g5 ∨ **g10** | FBOr1 = g2 |
| FBRs8 (S12) | g2 | **N3/FBOrS12Reset = g3 ∨ g7** |
| FBRs7 (SR) | FBOr16 = g3 ∨ g6 | FBOr13 = g5 ∨ g4 ∨ g7 |
| FBRs3 (S3) | g4 | FBOr5 = g6 ∨ g7 |
| FBRs4 (S4) | g7 | FBOr7 = g8 |
| FBRs5 (S5) | g8 | FBOr9 = g9 |
| FBRs6 (S6) | g9 | wire FBOr2 (содержит g10) |

g7 — один символ. Он сбрасывает все три возможных источника (S12, SR, S3), а его
устанавливает только S4. Привязка к источнику: FBAnd2 ⇐ S3 (текущий скан); FBAndLvEmg ⇐
STAGE_LVON = S12 ∨ SR (Symbols, текущий скан после головы). Арбитраж:
- одновременные g7 и g3/g4/g5/g6 — reset-доминированием: цель другого гранта имеет g7
  в своём Reset, поэтому приоритет у Emergency;
- g4 и g5 разведены по C2_FBK;
- g5 требует SG, а SG∧SU исключены (C-1, §3 E2c).

### 2.2 Порядок

- **Голова (I-ORD-1), 15 блоков:** N3/FBOr2, FBOr1, FBOrS12Reset, FBOr16, FBOr13, FBOr5,
  FBOr7, FBOr9, FBRs1, FBRs8, FBRs7, FBRs3, FBRs4, FBRs5, FBRs6.
- **I-ORD-2:** гранты и их конус по памятям — после головы.
  - Переносы v2: N12/FBAnd15 → после N12/FBDecouple1; N3/FBAnd2 → перед N3/FBAnd1;
    N2/FBAnd11 → перед N2/FBAnd91.
  - Новые: STAGE_LVON, FBAndLvEmg, FBOrStep4 → между N6/FBAnd2 и N6/FBDecouple1;
    G10_EXIT → сразу после N1/FBEstop1. Он должен быть раньше N6/FBDecouple2 (writer
    `recRndC_PrevG`), чтобы читать зелёную предыдущего скана.
- **E2c:** SafeResumption/SG_OWNER_SET → сразу после RndPhysicalCompact/STATE_SU, затем
  HLT_LV, GATE_SG_SET, STATE_SG.

### 2.3 Статус (D2-A)

Формула (тестировщик вычисляет её над Symbols):
```
STS_SAFE = (S1 ∨ S12) ∧ EOk
STS_RND  = SR ∧ EOk
STS_RUN  = S3 ∧ EOk
STS_EMG  = ¬(прочих)
```
Блоки декодера появятся в E4 вместе с публикацией (`MUTATION_PLAN_E4.decoder.json`).

### 2.4 Инварианты

INV-1…5 — как v2. Дополнение для g7 из S12/SR: источник — стадия в текущем скане, значит
SU не нужен, и B-1 устранён по построению.

Пределы:
- GRP-2, постоянство входов, RS-4/GRP-4 — DERIVED; EST-4 — DOC;
- доказательство про память и статус, не про аппаратную энергию.

## 3. Срезы E2 — точные изменения

Порядок: **R1 → E2a → E2b → E2c → E2d**. В v3 каждый срез безопасен сам по себе:
UP-guard крышки переходит вместе со снятием крышки из permit (B-2).

### R1 — без изменений против v2 (CONFIRMED)

Плюс C-R1-2 (а): снять Symbol-binding `b_Step6` с N3/FBRs6.RsOut (wire на FBOr9,
FBDecouple2 и FBAnd2 сохраняются). Итог R1: **215 FB, 1832 порта, 65 Symbols, 75 SAL-переменных**.
Условия C-R1-1…5 ревьюера — в силе.

### E2a — кольцо, гонка, полярность, переименование

1. Кольцо и HEALTH_GUARD — как v2 E2a:
   - N3/FBOr1.OrIn3 := g2; FBOr1.OrIn4 деактивировать;
   - N3/FBOr5.OrIn2 := g7; FBOr7.OrIn2 := g8; FBOr9.OrIn2 := g9;
   - FBRs6.Reset := wire FBOr2; удалить FBOr11;
   - FBRs8.Set := g2; FBOr16.OrIn1 := g3; FBRs7.Set := wire FBOr16;
   - удалить FBOr6; FBRs3.Set := g4; FBOr13.OrIn2 := g7;
   - N6/FBAnd18.AndIn4 := wire N6/FBAnd1;
   - RUN_DOWN_RESET.OrIn1 := g6;
   - N7/FBAnd8.AndIn5 := `b_Step4`;
   - N6/HEALTHY_OK, N6/HEALTH_GUARD → N6/FBAnd9.AndIn6; AndIn7 деактивировать.
2. N11/FBAnd4.AndIn3 NC → NO (D-ARCH-POL).
3. **Переименование SAL-переменных (только атрибут `name`):**
   - `in_LV_Healthy_FBK` → `in_LV_Faulty_FBK`, `in_HV_Healthy_FBK` → `in_HV_Faulty_FBK`;
   - `outPLC_LV_Healthy` (Id 33e570eb…) → `outPLC_LV_Faulty`,
     `outPLC_HV_Healthy` (Id 0c59b0ee…) → `outPLC_HV_Faulty`.

   В SGVL и diagram этих имён нет. Число переменных и Symbols не меняется.

   **E2a-PLC** — отдельный шаг, файлы вне разрешений редактора; ведущий расширяет
   path-guard по V14-Q2:
   - `Alias Devices/PLC_IO/StatusToPLC/outPLC_LV_Healthy.sds`, `outPLC_HV_Healthy.sds` —
     переименование файлов; внутри имени нет;
   - `Safety_Dyno.splcproj` — строки 63, 65;
   - `MEN001_Dyno.tsproj`: Name LV_Healthy/HV_Healthy/_Invert (стр. 1728–1746) и
     Link-строки 13171, 13173;
   - `PLC_Dyno/DUTs/ST_TwinSAFE_IN.TcDUT` (стр. 21–25), `PLC_Dyno/POUs/MAIN.TcPOU`
     (2 вхождения), `PLC_Dyno/VISUs/Visualization.TcVIS` (4).

   Поля `*_Healthy_Invert` в PLC — PLC-логика, а не TwinSAFE. Переименовывать их или нет —
   решение Вадима/ведущего (Q-ARCH-11). Перекоммутации нет.

   Тесты и стенд: список из v2 (17 файлов) плюс тесты POL-01(b)(c) с `outPLC_*_Faulty`.
   **A-1:** тест, который читает и reference/pinned SAL, и canonical, использует таблицу
   соответствия имён, а не замену текста.
4. **E2a-RC (условно, ждёт аналитика: RUN-CONF / Q-ARCH-09 «В»).** Сейчас N12/FBTon3 (0,1 с)
   считает от команды C2 (вход — N12/FBAnd4), и Run ставится на k+99, если C2_FBK пришёл
   раньше (находка G1). Чтобы считать 0,1 с от C2_FBK ON ∧ HV норма:
   - N12/FBAnd6 переставить **перед** N12/FBTon3, входы FBAnd6: wire FBAnd4,
     `in_HV_C2_FBK`, `in_HV_Faulty_FBK` NO;
   - вход FBTon3 := wire FBAnd6; выход FBTon3 → N12/FBDecouple2.DecIn1…4;
   - Symbol `b_Reset_HV_Discharg_Req2` перенести с FBAnd6.AndOut на FBTon3.TonOut,
     чтобы сброс запроса разряда остался в момент подтверждения.

   0 FB. Включать, только если аналитик подтвердит трактовку «0,1 с непрерывного
   C2_FBK ∧ HV в норме».
5. Порядок: голова §2.2 (на этом срезе без FBOrS12Reset — он появляется в E2b; голова
   14 блоков) и переносы v2.

Ресурсы: 0 FB → **215**, 1832 порта, 65 Symbols, 75 SAL-переменных (4 переименованы).

Известные FAIL после E2a, закрываемые позже:
- авария в R&D/S12/SU — E2b;
- Healthy в устойчивом Run — E3;
- SafetyFault — E5.

### E2b — Emergency: крышка, connector, авария вне Run, выход (EMG-001/002/004/006, CVR-006)

Критерии: IL-03, IL-05a, IL-05b(1)(2)(3), EMG4-02, EMG4-03, EMG6-01, EMGREF-LV (1)(2),
EMGREF-RUN (StartingRun), E2-01 на всех фазах.

1. N12/FBAnd16.AndOut += SAL-переменная `linkCoverClosed`;
   N6/RUN_DOWN_OWNER.RsOut += `linkRunDownOwner`.
2. Network1/FBAndNotRunSu (AND: `b_Step3` NO, `recRndC_SU` NO).
   Network1/FBOrIlRunOk (OR: wire FBAndNotRunSu, `linkCoverClosed`, `linkRunDownOwner`).
   N1/FBAnd1.AndIn3 := wire FBOrIlRunOk.
3. N1/FBAnd1.AndIn4 := `linkSafeConnectorScope` (Q-RC-14).
4. N6/HEALTHY_OK.AndIn3 := `linkCoverClosed`; N6/FBAnd9.AndIn2, AndIn3 деактивировать.
5. Network6/STAGE_LVON (OR: `b_Step12`, `b_Step_RnD`).
   Network6/FBAndLvEmg (AND: wire STAGE_LVON, `b_EStop_Ok` NO, `in_False_SI2_CH8` NO).
   Network6/FBOrStep4 (OR: wire FBAnd2, wire FBAndLvEmg) → N6/FBDecouple1.DecIn1.
6. Network3/FBOrS12Reset (OR: `b_Step_RnD_Set`, `b_Step4_Set`) → FBRs8.Reset (в голове).
7. **Крышка из R&D/Run-permit** (перенесено из v2 E2d):
   - RndPhysicalCompact/GATE_001.AndIn5, AndIn6 деактивировать;
   - GATE_020.AndIn6 := `linkCoverClosed`;
   - GATE_030.OrIn5 := wire BOTH.TonOut.
8. Network3/G10_EXIT (AND: wire FBRs6, `b_EStop_Ok`, `in_Reset_PB` NO, `recRndC_PrevG`,
   `in_LV_C1_FBK` NO, `in_HV_C2_FBK` NO, `out_LV_C1` NO, `out_HV_C2` NO) → wire N3/FBOr2.OrIn3.
9. Порядок — §2.2.

Поведение (модель, `repro/t10.out.txt`):
- R&D + EStop → S4 (C1 OFF через 2 с) → S6 → Restart → Safe; новый BOTH → R&D;
- S12 + EStop → S4, подъём LV остановлен, C1 OFF через 2 с;
- SU + 3-мс импульс `in_Estop_PLC` (B-1) → S6, STO активен, C1/C2 OFF;
- SU + connector → S6;
- R&D + connector → S6; Restart при отсутствующем connector не выводит; после
  восстановления → Safe;
- ранний Restart при энергии → цепь продолжается, после S6 нужен новый Restart (EMG6-01).

Ресурсы: +7 FB → **222**, +63 порта → 1895, SAL-переменные +2 → 77.

### E2c — HLT-01/02 и устранение C-1/C-2

1. SafeResumption/HLT_LV (AND: `in_LV_Faulty_FBK` NC, `recRndC_SU` NO, `in_False_SI2_CH8` NO)
   → `linkHltLvLost`.
2. RndPhysicalCompact/GATE_SG_SET (OR: `linkSafeSgOwnerSet`, `linkHltLvLost`) → STATE_SG.Set.
3. **C-1:** порядок — STATE_SU, SG_OWNER_SET, HLT_LV, GATE_SG_SET, STATE_SG; плюс
   GATE_020.AndIn7 := `recRndC_SG` NO. Модель (`t10` #7): LV Faulty за 1 скан до BOTH →
   SU∧SG ни разу, итог Safe.
4. **C-2:** GATE_030.OrIn6 := `linkHltLvLost`. HLT ставит защёлку C, удерживаемый BOTH
   не квалифицируется до полного отпускания. Модель (`t10` #8): S12 ни разу.
5. Изоляция StartingRun (`!SU`) остаётся до E3 (Q-ARCH-03 «Б» — abort с последующим
   R&D→Safe). Известный FAIL STP-I до E3.
6. SafetyFault HealthyLost (Q-ARCH-05, HLT-03) — **E5**, Symbol `b_SafetyFault`.
   HLT-03 — известный FAIL до E5. Без SafetyFault новый BOTH после 2 с отпускания исполняется
   без квитирования — это предел E2c.

Ресурсы: +2 → **224**, 1913 портов, 78 SAL-переменных.

### E2d — Safe-сторона крышки, синяя, Q-REL

1. N1/FBAndLvCurrentPermit.AndIn4/5 — деактивировать (V14-Q7).
2. N2/FBAnd1.AndIn5/6 — деактивировать.
3. **НОВЫЕ входы** N1/FBAnd4.AndIn3/4 := NC1/NC2 — legacy Bypass не включает C1/C2 при
   открытой крышке (сохранение F1). Убивается в R&D/S12 при открытой крышке (D-2).
4. Синяя (Q-ARCH-04 «А»):
   - SafeResumption/IL_SCOPE (OR: `b_Step1`, `linkCoverClosed`) → `linkIlScope`;
   - **НОВЫЙ** вход RndPhysicalCompact/GATE_010.AndIn3 := `linkIlScope`.

   Итог: Safe — Unlock и при открытой крышке; R&D — запрет F1 сохранён (`t10` 9a/9b).
   Вопрос Q-ARCH-10.
5. **Q-REL-AFTER-PERMIT:** SafeResumption/MODE.OrIn4 := `b_Step12`.
   - После E2b крышки в GATE_001 нет. Единственная неаварийная потеря permit в Safe/R&D —
     MODE=0 на время Safe→R&D (S12). Она перезапускала отсчёт 2 с от прихода в R&D,
     а не от отпускания.
   - Остальные компоненты GATE_001 (`in_Estop_PLC`, `b_EStop_Ok`, connector вне Safe)
     падают только вместе с аварийной защёлкой, а её снятие требует нажатия зелёной.
   - Модель (`repro/t14.out.txt`): отпускание в момент принятия, R&D через 100 мс, новый
     BOTH на отпускании +2050 мс → принят; мутант без OrIn4 → отклонён; +1990 → отклонён
     в обоих.
   - Побочных грантов из S12 нет: SAFE_UP_SCOPE требует S1, GATE_020 и SG — SR, owner — S3.
6. Порядок: IL_SCOPE перед GATE_010.

Ресурсы: +1 → **225**, 1922 порта, 79 SAL-переменных.

Известные FAIL после E2:
- CFG-02 (legacy Bypass в R&D при закрытой крышке) — E4;
- STP-I и HLT-03 — E3/E5;
- STP-G — E3;
- RUN-CONF k+99 — если E2a-RC не принят.

## 4. Эскизы E3…E6 — пересчёт под новые ответы

**E3 (≈ +21 FB):**
- ядро STOP v2: SS1 2 с, RUN_HEALTH_LOST (LV и HV — Q-RC-15), STO_REQ, STO_PHASE,
  COAST 5 с, N8/FBOrDis; минус N6/FBTon1 и HEALTH_GUARD — **+4**;
- HEALTH_DESC (RS: Set = RUN_HEALTH_LOST, Reset = !S3) — память «спуск с Healthy-событием»
  для Q-RC-17(3) и как источник SafetyFault в E5 — **+1**;
- освобождение от крышки только для нормального спуска: FBOrIlRunOk.OrIn3 := wire
  AND(owner, !HEALTH_DESC) (**+1**). Исправляет противоречие Q-RC-17 «Б» с эскизом v2;
- HL_MEM (Q-RC-16): RS (Set = LVF ∧ (S3∨SU), Reset = S1) — 3 FB; HLT_LV.AndIn1 :=
  OR(LVF, HL_MEM) — 1 FB; итого **+4**;
- ABT (abort StartingRun: зелёная — STP-E; LV — Q-ARCH-03; позже CMD/WDG): ABT_GREEN,
  ABT_LV, ABT_SET (OR), ABT (RS), ABT_DONE, ABT_RESET, SU_RESET — **+7**.
  - Рекогнайзер: GATE_008/014.AndIn4 деактивировать; SG_OWNER_SET.AndIn3 := !SU;
    N12/FBAnd2.AndIn5 := !SU.
  - Q-RC-17(1): FBAndNotRunSu.AndIn3 := !ABT;
- OFF-watchdog C1/C2 0,5 с → канал FBEstop1 — **+4**;
- STAGE_LVON.OrIn3 := `b_Step3` (0) — causes, видимые только через защёлку, действуют и в Run;
- HL_FAULT из v1 **не нужен** (см. бюджет, вариант в).

**E4 (≈ +19 FB):**
- удалить 18 FB (PLC 2-bit и legacy Bypass);
- добавить ~37:
  - DECOUPLE «прошлый скан» (1), 4 фронтовых AND (4);
  - детектор «≥2 из 5 TRUE» (включая Bypass по Q-RC-18a) — 8;
  - разрешение только в устойчивых фазах (1);
  - ERR RS, ALL_FALSE, TON 1 с (3);
  - Config: SC/SCX, вход, выход, C1-OFF, завершение, Reset SCX (8);
  - heartbeat (3), SU Set OR для PLC (1);
  - декодер (6), DECOUPLE публикации (1), Fault-OR по Q-RC-13 (1).
- Q-ARCH-08 «Б»: вход в Config ∧ !g2. Q-RC-18b: ошибка PLC не блокирует кнопки (только фронты PLC).

**E5 (≈ +5 FB):** `b_SafetyFault` RS; Set OR (HLT, HEALTH_DESC, ABT_LV, откаты WDG/Config);
квитирование по фронту кнопки (2 AND + OR). !SF — во все UP-гранты; Q-RC-07 —
спуск разрешён (зелёная и квитирует, и спускает).

**E6 (≈ +16 FB):**
- ON-watchdog C1/C2 0,5 с — 4;
- Healthy 30 с LV/HV — 4;
- S12_ABORT (V14-Q13, WDG-01/02) — 3;
- маршрут откат/Emergency — 1;
- Q-RC-19 (FBK пропал при команде ON) — память «FBK подтверждён» + AND на контактор — 4.

## 5. Бюджет для Вадима (лимит 255 — жёсткий)

Базовая линия без экономии (точно до E2, далее оценка ±5):

| Этап | R1 | E2a | E2b | E2c | E2d | E3 | E4 | E5 | E6 |
|---|---|---|---|---|---|---|---|---|---|
| FB | 215 | 215 | 222 | 224 | 225 | ~246 | ~265 | ~270 | ~286 |

Варианты экономии:

| Вариант | ΔFB | Где | Что теряется / меняется | Разрешение |
|---|---|---|---|---|
| (а) R2 — fan-out DECOUPLE: N2/FBDecouple1, 3, 5, N6/FBDecouple1, 3, N7/FBDecouple1, N11/FBDecouple1, N12/FBDecouple1, 2, 3; N1/FBOr12, 13 → каналы N3/FBDecouple1 | **−12 (±2)** | перед E3 | Поведения нет; меняется native-структура (имена Symbols объединяются). Риск — native save/CRC | нет (Q-ARCH-06) |
| (б) защёлка `out_TransitionStep` (N1/FBRs8, FBOr14, FBOr15, N6/FBAnd19; N11/FBDecouple1, если не в R2) → статус «переход» из декодера | **−4** (−5 без R2) | E4 | Меняется смысл alias `out_TransitionStep` для PLC (интерфейс v1.4) | нужно |
| (в) отдельный HL_FAULT | **0** (уже учтено: −4 против эскиза v1) | E3/E5 | По Q-ARCH-05 и Q-RC-13 HealthyLost — **причина** SafetyFault, а не отдельный латч: один латч `b_SafetyFault` с несколькими Set. Это не слияние двух латчей. Ведущему подтвердить, что это не попадает под запрет Q-ARCH-06 | подтвердить |
| (г1) не строить декодер статусов в TwinSAFE: PLC получает стадии (`out_Step*`, `outPLC_RnD`, `out_EStop_Ok_Plc`, + Config) и вычисляет STS_* по формуле §2.3 | **−6** | E4 | Статусы v1.4 вычисляются в PLC (небезопасная индикация), TwinSAFE отдаёт стадии | нужно |
| (г2) heartbeat на 2 TON (вход TON с контактом NO) | **−1** | E4 | Поведения нет; NO-вход у TON — NV native | техническое, после проверки native |
| (д) точные дубликаты класса R1: N12/FBAnd17 ≡ N12/FBAnd11; N6/FBAnd20 ≡ N6/FBAnd7; N6/FBAnd11 ≡ N12/FBAnd1 (через Symbol) | **−3** | вместе с R1/R2 | Поведения нет | нужно (как R1) |
| (е) Q-RC-19 через общий монитор несоответствия команда/FBK с порогом 0,5 с, вместо отдельной памяти «подтверждён» | **−4** | E6 | Q-RC-19 срабатывает с задержкой 0,5 с, а не мгновенно (ответ задержки не задаёт) | нужно |

Итоги по этапам:

| Набор | E3 | E4 | E5 | E6 |
|---|---|---|---|---|
| A — без экономии | ~246 | ~265 ✗ | ~270 ✗ | ~286 ✗ |
| B — без изменения поведения/интерфейса: (а)+(д)+(г2) = −16 | ~231 | ~249 | ~254 | ~270 ✗ |
| C — B + (б)+(г1)+(е) = −30 | ~231 | ~239 | ~244 | ~256 ✗ (на грани) |

**Вывод для Вадима:**
- E2 помещается точно (225).
- Без экономии лимит превышается уже на E4.
- С экономией без изменения поведения (B) помещаются E4 и E5; E6 — нет.
- Даже со всеми вариантами (C) E6 выходит на ~256 ± 5, то есть на границе.
- Для E6 потребуется ещё одно решение:
  - отказаться или перенести часть функций (например, Q-RC-19 или Healthy 30 с), или
  - упростить их (общий таймер ON-watchdog для фаз S12 и SU, −2), или
  - вынести часть индикации в PLC.

## 6. MU24 и Q-REL (C3 G1-ревью)

- После E2b GATE_001 = `!in_Estop_PLC ∧ !in_False ∧ b_EStop_Ok ∧ MODE ∧ linkSafeConnectorScope`.
- После E2d MODE = S1 ∨ S12 ∨ SR ∨ S3.
- STATE_A сбрасывается только `!GATE_001`, то есть при аварии (EStop/PLC/Mentee/connector
  вне Safe) или вне стадий Safe/R&D/Run (S4…S6, старт).
- RELEASE (GATE_008) не меняется.
- MU24 (GATE_016.AndIn4 = RELEASE деактивирован) убивается кнопочными границами
  1999/2000 мс (`current-btn-release-after-permit`). От permit это не зависит —
  остаётся убиваемым.
- Новый guard — MODE.OrIn4, мутация M-E2d-05 (убийца — `current-e2d-release-permit`, сценарий §3 E2d п.5).
- Прогноз «GATE_001 ⊃ крышка» снят.

## 7. Native-ограничения, файлы, мутации

- Межсетевые связи — только Symbols/SAL-переменные. Новые SAL-переменные:
  `linkCoverClosed`, `linkRunDownOwner`, `linkHltLvLost`, `linkIlScope` — у каждой есть
  источник и потребитель.
- Новых таймеров в E2 нет; значения существующих не меняются.
- Alias, mappings, group и target E2 не трогает (кроме шага E2a-PLC по V14-Q2 с разрешения ведущего).
- Файлы редактора (R1, E2a…E2d): `TwinSafeGroup1.sal`, `.sal.diagram`, `GVL1.sgvl`.
- E2a-PLC — по отдельному разрешению.
- Мутации:
  - `MUTATION_PLAN_E2a.json`…`E2d.json` (v3):
    - testFiles — 16 точных имён;
    - behaviouralTests `^E2[a-d] `;
    - sourceSha256 = `FILL_AT_G2` (до G2 раннер даёт exit 3 — это ожидаемо);
  - `MUTATION_PLAN_E4.decoder.json`;
  - `MUTATION_PLAN_E3.draft.json`.
- Модельная проверка убиваемости:
  - `repro/t11.out.txt`: STAGE_LVON.OrIn2, FBOrS12Reset.OrIn2, G10.AndIn2/AndIn4/AndIn5,
    GATE_020.AndIn7, GATE_030.OrIn6, IL_SCOPE.OrIn1/OrIn2;
  - `t12`: STAGE_LVON.OrIn1;
  - `t13`: G10.AndIn3;
  - `t14`: MODE.OrIn4;
  - `t9`: FBOr13.OrIn2.
- Эквивалентные по доказательству:
  - MU11 (§9 v2 — проверено ревьюером; переоценить в E3);
  - N7/FBAnd8.AndIn5, N6/FBAnd18.AndIn4;
  - G10_EXIT.AndIn6 (C2_FBK): S6 недостижима при C2_FBK ON (N8/FBAnd3), поэтому он
    избыточен до OFF-watchdog E3;
  - G10_EXIT.AndIn1 (S6): кандидат на эквивалентность — без S6 грант совпадает с g1-классом
    только при снятой энергии в Safe. Тестировщику проверить; если эквивалентен — оставить
    как структурный.

## 8. Вопросы (исходное состояние → события → какой реакции не хватает)

- **Q-ARCH-10.** Исходно устойчивый R&D, крышка открыта (NC1 или NC2 FALSE). Событие:
  синяя ≥ 500 мс. F1 Unlock не даёт; Q-ARCH-04 касается только Safe. Не хватает:
  Unlock в R&D при уже открытой крышке разрешён или запрещён? (План сохраняет запрет F1.)
- **Q-ARCH-11 (ведущему/Вадиму).** PLC-поля `LV_Healthy_Invert`/`HV_Healthy_Invert` в
  `ST_TwinSAFE_IN` и tsproj — переименовать вместе с E2a-PLC или оставить?
- **RUN-CONF (аналитику).** Исходно принят R&D→Run, C2_FBK пришёл через 30 мс после команды C2.
  Сейчас Run ставится через 100 мс от команды (C2_FBK удерживался 70 мс). Не хватает:
  «0,1 с» (Q-ARCH-09) — от команды или 0,1 с непрерывного C2_FBK ∧ HV в норме?
  (Вариант E2a-RC, 0 FB.)
- **Ведущему по бюджету:** варианты (б), (г1), (д), (е) и подтверждение (в) — вопрос Вадиму (§5).

## R1 addendum (2026-10-21, по кандидату редактора `candidates/E2-R1/native`, SAL ca841a01…bb3)

**R1-D-1. Пустые Network4/5/9 — оставить.** Блоки удалены, сами сети сохранены.
Основания:
1. Пустую сеть сериализовала сама native-среда (`<Network …/>`), а native save и CRC валидны.
   Значит, пустая сеть — состояние, которое производит сам редактор TwinSAFE (DERIVED).
   Её допустимость при Verify/Download остаётся NV до проверки в IDE.
2. Удаление сети меняет `networkOrderId`/`intId` последующих сетей и swimlanes diagram. Это
   структурная дельта без функциональной цели, которую R1 не объявлял. Минимальная дельта
   безопаснее для CRC и сравнения структур.
3. Network4 в canonical уже был `networkName="Network4ToBeDeleted"` — в рамках R1 он не
   удаляется, а только опустошается.

Требования к стенду: парсер принимает пустую сеть (`<Network …/>`) как корректную, с нулём
блоков (исправление S1 у инженера стенда). Структурные проверки G2 считают сети (14) отдельно
от блоков. Удаление пустых сетей возможно позже отдельным структурным шагом: после проверки
Verify в IDE, если она отвергнет пустые сети, или по решению ведущего. Не в R1.

**R1-D-2. Геометрия diagram — критерий принимаю с условиями.** Предлагаемый критерий:
«относительное положение внутри lane сохраняется, абсолютный сдвиг lane допустим, если вызван
native layout». Условия:
- (а) внутри каждой lane взаимное положение всех фигур **и** точек маршрутов связей сохранено точно;
- (б) сдвиги lane объясняются только схлопыванием пустых lanes и подгонкой высот — по
  GEOMETRY_DELTA.txt: только сети, соседние со схлопнутыми или содержащие изменённые lanes;
- (в) в diagram нет связей/ID, ссылающихся на удалённые блоки, а число фигур равно числу блоков
  в SAL;
- (г) diagram — представление: логика, порядок и CRC SAL от неё не зависят. Это DERIVED;
  при расхождении — к стенду.

**R1-D-3. N4/FBDecouple1 — 7 ссылок на Symbols.** Ссылок действительно 7: DecOut1…DecOut7 =
`b_Step3_Reset`, `b_Step4_Reset`, `b_Step5_Reset`, `b_Step6_Reset`, `b_Step1_Reset`,
`b_Step1_Set`, `b_Step2_Set`. Все семь есть в списке 19 удаляемых Symbols R1 (§3 R1 v2),
и доказательство неиспользуемости их покрывает:
- шесть из reference — аргумент «работающий reference ⇒ FALSE»;
- седьмой (`b_Step2_Set`, только в v2) — та же конфигурация порта.

Формулировку ревью C-R1-4 («шесть на DecOut4») поправляю: G2 проверяет исчезновение **всех
семи** ссылок вместе с блоком.
