# E2-status v4 — механизм статусов, срезы R1 и E2a…E2d (+ эскиз E3…E6)

Роль: v2-architect. Дата: 2026-10-21. Версия 4.

Основание:
- ревью `program/reviewer/E2-plan-v3/PLAN_REVIEW.md` §11–12;
- ответы Вадима: Q-ARCH-10=А, Q-RC-RUNCONF-01=В;
- лимит FB для EL1918 — 512 (`program/stand/FB-limit/FB_LIMIT.md`);
- решения ведущего.

Прежние версии: `*.v1.*`, `*.v2.*`, `*.v3.*`, `repro/v1…v3/`.
Canonical не менялся. Запись — только в `SafetyTests/program/architect/E2-status/`.

## 0. Источник

| Объект | SHA256 |
|---|---|
| canonical SAL (F1) | `04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3` |
| canonical SGVL | `dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104` |
| canonical diagram | `de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603` |
| кандидат R1 (редактор) | SAL `ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3` |
| SCENARIO_DECISIONS.md | `ff59e2f8372c873926dce18a2e6551176e3a8de9a497f97c6a651cf9329ca645` |
| reference | 4495a1f, только `git show` |

**Базис.** v4 построен на R1. Вадиму заново задан вопрос, нужен ли R1 при лимите 512.
Что меняется при перебазировании на F1 — §8.

## 1. Изменения против v3

| Пункт ревью | v4 |
|---|---|
| A3-1 | E2a-RC внесён в E2a безусловно (Q-RC-RUNCONF-01 «В»), с мутациями |
| A3-2…A3-4 | renameImpact исправлен (4 атрибута `name`, outPLC — в E2a); `slice` и SHA обновлены |
| B3-1 | SafeResumption/CONNECTORS и CONNECTOR_SCOPE исполняются перед N1/FBAnd1. Отставание connector от `in_Estop_PLC` = 0 (модель: оба — b_EStop_Ok на e+1, S4 на e+2, `repro/t15.out.txt`) |
| B3-2 | Перенос N12/FBAnd16 перед N1/FBAnd1 явно записан в §2.2 и PLAN.json; мутация порядка |
| B3-4 | g7 в Reset S1: N3/FBOr1.OrIn4 := `b_Step4_Set` (0 FB) |
| B3-5 | G10_EXIT.AndIn1 и AndIn6 — обычные мутации с убийцами (модель: S1+S4 и S1 при C2_FBK ON, `t15`) |
| B3-6 | Добавлены мутации: FBAndLvEmg.AndIn1, FBOrStep4.OrIn1, FBOrS12Reset.OrIn1, FBOr2.OrIn3, G10.AndIn7/AndIn8, порядок (FBAnd16, CONNECTOR_SCOPE, G10_EXIT, HLT_LV); FBAndLvEmg.AndIn3 и HLT_LV.AndIn3 — equivalentByProof |
| B3-7 | Known FAIL на стеке R1+E2a+E2b записаны явно (§3 E2b) |
| C3-1/C3-2 | Мутация порядка HLT_LV/STATE_SU; HLT_LV.AndIn3 (`in_False`) — equivalentByProof |
| Q-ARCH-10 «А» (D3-1, D3-2) | Из E2d удалены IL_SCOPE, `linkIlScope` и GATE_010.AndIn3 (−1 FB, E2d → 224). M-E2d-03/04 сняты. `current-e2d-unlock-cover.test.js` включён в testFiles (17 имён). Unlock в Run и в переходах по-прежнему запрещён существующими guards (`N2/FBAnd7` — только S1, `N12/FBAnd2` — только SR) |
| Бюджет | Лимит 512: экономия не нужна. (б), (г1), (е) отклонены, R2 не нужен. Раздел для Вадима убран. Остаётся NV — 12 страниц по 2048 Б |
| HL_FAULT (в) | До ответа Вадима — две памяти: HL_FAULT (STP-D, сброс по D-HEALTHY-FAULT-RESET-EDGE) и `b_SafetyFault` (+4 FB в E3) |
| E2a-PLC | BLOCKED противоречием Q-ARCH-11 (вопрос у Вадима) и path-guard |

## 2. Механизм

### 2.1 Стадии, гранты, Reset

| Стадия | RS | Группа статуса |
|---|---|---|
| S1 | N3/FBRs1 | SAFE |
| S12 | N3/FBRs8 | SAFE |
| SR | N3/FBRs7 | RND (дети SU, SG) |
| S3 | N3/FBRs3 | RUN (ребёнок owner) |
| S4/S5/S6 | N3/FBRs4/5/6 | EMG |
| нет стадии | — | EMG |

Гранты:
- g1 — N3/FBAnd1;
- g2 — `b_Step12_Set`;
- g3 — `b_Step_RnD_Set`;
- g4 — `b_Step3_Set_2`;
- g5 — `b_Step2_Set_2`;
- g6 — `b_Step12_Set_2`;
- g7 — `b_Step4_Set` = N6/FBOrStep4 = N6/FBAnd2 (S3 ∧ !FBAnd9) ∨ N6/FBAndLvEmg ((S12 ∨ SR) ∧ !b_EStop_Ok);
- g8 — `b_Step5_Set`;
- g9 — `b_Step6_Set`;
- g10 — N3/G10_EXIT.

| RS | Set | Reset |
|---|---|---|
| FBRs1 (S1) | FBOr2 = g1 ∨ g5 ∨ g10 | FBOr1 = g2 ∨ **g7** |
| FBRs8 (S12) | g2 | FBOrS12Reset = g3 ∨ g7 |
| FBRs7 (SR) | FBOr16 = g3 ∨ g6 | FBOr13 = g5 ∨ g4 ∨ g7 |
| FBRs3 (S3) | g4 | FBOr5 = g6 ∨ g7 |
| FBRs4 (S4) | g7 | FBOr7 = g8 |
| FBRs5 (S5) | g8 | FBOr9 = g9 |
| FBRs6 (S6) | g9 | wire FBOr2 |

**Арбитраж (B3-4 исправлен).** g7 стоит в Reset каждой цели, куда может прийти
конкурирующий грант из тех же источников: S1 (g5), SR (g6), S3 (g4). При одновременном
срабатывании reset-доминирование отменяет конкурента — приоритет у Emergency. g4 и g5
разведены по C2_FBK; SU и SG — через C-1.

### 2.2 Порядок исполнения

- **Голова, 15 блоков** (в E2a — 14, без FBOrS12Reset): N3/FBOr2, FBOr1, FBOrS12Reset,
  FBOr16, FBOr13, FBOr5, FBOr7, FBOr9, FBRs1, FBRs8, FBRs7, FBRs3, FBRs4, FBRs5, FBRs6.
- **Переносы.**
  - E2a: N12/FBAnd15 → после N12/FBDecouple1; N3/FBAnd2 → перед N3/FBAnd1;
    N2/FBAnd11 → перед N2/FBAnd91; **N12/FBAnd6 → перед N12/FBTon3 (E2a-RC)**.
  - E2b:
    - **N12/FBAnd16 → перед N1/FBAnd1 (B3-2)**;
    - **SafeResumption/CONNECTORS и CONNECTOR_SCOPE → перед N1/FBAnd1 (B3-1)**.
      CONNECTOR_SCOPE читает `b_Step1` из головы — значение текущего скана;
    - FBAndNotRunSu, FBOrIlRunOk → перед N1/FBAnd1;
    - STAGE_LVON, FBAndLvEmg, FBOrStep4 → между N6/FBAnd2 и N6/FBDecouple1;
    - G10_EXIT → сразу после N1/FBEstop1 (до N6/FBDecouple2 — writer `recRndC_PrevG`).
  - E2c: SG_OWNER_SET → после STATE_SU, затем HLT_LV, GATE_SG_SET, STATE_SG.
- **Правило L1.** Каждая аварийная причина, кроме ES/Mentee (они идут через собственный
  канал FBEstop1), читается сырым входом до N1/FBAnd1 в том же скане. Поэтому
  `in_Estop_PLC`, крышка и connector доходят до FBEstop1 одинаково (e+1).

### 2.3 Статус — D2-A (формула над Symbols)

```
STS_SAFE = (S1 ∨ S12) ∧ EOk
STS_RND  = SR ∧ EOk
STS_RUN  = S3 ∧ EOk
STS_EMG  = ¬(…)
```
Декодер строится в SAL в E4 вместе с публикацией.

### 2.4 Инварианты

- INV-1 (≤1 стадия): привязка грантов к источнику + арбитраж §2.1. Пробел g5/g7 закрыт
  по построению (FBOr1.OrIn4). Неявный инвариант «g5 ⇒ EOk(k)» больше не требуется.
- INV-2…INV-5 — как v3.
- Пределы: GRP-2, постоянство входов, RS-4/GRP-4 — DERIVED; EST-4 — DOC. Доказательство
  касается памятей стадий и статуса, а не аппаратной энергии.

## 3. Срезы — точные изменения (база R1)

### R1 — без изменений (v2 §3 + R1 addendum)

215 FB, 1832 порта, 65 Symbols, 75 SAL-переменных. Пустые Network4/5/9 сохраняются.

### E2a — кольцо, гонка, полярность, переименование, E2a-RC

1. Кольцо и HEALTH_GUARD — как v3:
   - N3/FBOr1.OrIn3 := g2; FBOr1.OrIn4 деактивировать (в E2b получает g7);
   - FBOr5.OrIn2 := g7, FBOr7.OrIn2 := g8, FBOr9.OrIn2 := g9;
   - FBRs6.Reset := wire FBOr2; удалить FBOr11;
   - FBRs8.Set := g2; FBOr16.OrIn1 := g3; FBRs7.Set := wire FBOr16;
   - удалить FBOr6; FBRs3.Set := g4; FBOr13.OrIn2 := g7;
   - N6/FBAnd18.AndIn4 := wire N6/FBAnd1; RUN_DOWN_RESET.OrIn1 := g6;
   - N7/FBAnd8.AndIn5 := `b_Step4`;
   - N6/HEALTHY_OK, N6/HEALTH_GUARD → N6/FBAnd9.AndIn6; AndIn7 деактивировать.
2. N11/FBAnd4.AndIn3 NC → NO (D-ARCH-POL).
3. **Переименование — 4 атрибута `name` SAL-переменных:**
   - `in_LV_Healthy_FBK` → `in_LV_Faulty_FBK`;
   - `in_HV_Healthy_FBK` → `in_HV_Faulty_FBK`;
   - `outPLC_LV_Healthy` → `outPLC_LV_Faulty`;
   - `outPLC_HV_Healthy` → `outPLC_HV_Faulty`.

   Привязка к alias — по `sdsId`/`channelId`, не по имени. В SGVL и diagram имён нет.
   **E2a-PLC** (.sds, splcproj, tsproj, PLC_Dyno) — BLOCKED (Q-ARCH-11, path-guard).
   A-1: тесты, которые читают и reference/pinned, и canonical, ведут таблицу соответствия имён.
4. **E2a-RC (Q-RC-RUNCONF-01 «В»), 0 FB:**
   - N12/FBAnd6 переносится перед N12/FBTon3. Входы FBAnd6: AndIn1 := wire N12/FBAnd4
     (команда C2), AndIn2 `in_HV_C2_FBK`, AndIn3 `in_HV_Faulty_FBK` (NO).
   - N12/FBTon3.TonIn := wire FBAnd6. Выход FBTon3 → wire в N12/FBDecouple2.DecIn1…4.
   - Symbol `b_Reset_HV_Discharg_Req2` переносится с FBAnd6.AndOut на FBTon3.TonOut.
   - Модель (`t15`): C2_FBK на +30 мс → Run на FBK+102. Провал FBK на 1 скан на +40 →
     Run на +143 (отсчёт перезапущен). При HV Faulty Run нет.
5. Порядок — §2.2.

Ресурсы: 0 FB → **215**, 1832 порта, 65 Symbols, 75 SAL-переменных (4 переименованы).

Известные FAIL после E2a:
- энергия в Emergency в R&D/S12/SU (закрывает E2b);
- Healthy в устойчивом Run ведёт в Step4 (E3, не oracle E2a);
- SafetyFault (E5).

### E2b — Emergency: крышка, connector, авария вне Run, выход

Критерии: IL-03, IL-05a, IL-05b(1)(2)(3), EMG4-02, EMG4-03, EMG6-01, EMGREF-LV(1)(2),
EMGREF-RUN (StartingRun), E2-01.

1. N12/FBAnd16.AndOut += `linkCoverClosed`; N6/RUN_DOWN_OWNER.RsOut += `linkRunDownOwner`.
2. Network1/FBAndNotRunSu (AND: `b_Step3` NO, `recRndC_SU` NO).
   Network1/FBOrIlRunOk (OR: wire FBAndNotRunSu, `linkCoverClosed`, `linkRunDownOwner`).
   N1/FBAnd1.AndIn3 := wire FBOrIlRunOk.
3. N1/FBAnd1.AndIn4 := `linkSafeConnectorScope`.
4. N6/HEALTHY_OK.AndIn3 := `linkCoverClosed`; N6/FBAnd9.AndIn2, AndIn3 деактивировать.
5. Network6/STAGE_LVON (OR: `b_Step12`, `b_Step_RnD`).
   Network6/FBAndLvEmg (AND: wire STAGE_LVON, `b_EStop_Ok` NO, `in_False_SI2_CH8` NO).
   Network6/FBOrStep4 (OR: wire FBAnd2, wire FBAndLvEmg) → N6/FBDecouple1.DecIn1.
6. Network3/FBOrS12Reset (OR: `b_Step_RnD_Set`, `b_Step4_Set`) → FBRs8.Reset.
7. **N3/FBOr1.OrIn4 := `b_Step4_Set` (B3-4).**
8. Крышка в R&D/Run-permit:
   - GATE_001.AndIn5/6 деактивировать;
   - GATE_020.AndIn6 := `linkCoverClosed`;
   - GATE_030.OrIn5 := wire BOTH.TonOut.
9. Network3/G10_EXIT (AND: wire FBRs6, `b_EStop_Ok`, `in_Reset_PB` NO, `recRndC_PrevG`,
   `in_LV_C1_FBK` NO, `in_HV_C2_FBK` NO, `out_LV_C1` NO, `out_HV_C2` NO) → wire N3/FBOr2.OrIn3.
10. Порядок — §2.2. Обязательно: N12/FBAnd16, CONNECTORS и CONNECTOR_SCOPE — перед N1/FBAnd1.

Ресурсы: +7 FB → **222**, 1895 портов, 77 SAL-переменных.

**Известные FAIL на стеке R1+E2a+E2b (B3-7).** «Каждый срез безопасен сам по себе»
относится только к крышке/UP-guard (B-2), не ко всему поведению.
- HLT (E2c) ещё нет. R&D при LV Faulty остаётся R&D. R&D→Run при LV Faulty доходит до Run,
  затем Step4 (t10 #7/#8 без E2c). HLT-01/01b и C-1/C-2 — FAIL до E2c.
- Unlock в R&D при открытой крышке уже TRUE — это по Q-ARCH-10 «А» не FAIL.
- Safe-сторона V14-Q7 (LV при открытой крышке) — FAIL до E2d.
- Q-REL в Safe→R&D — FAIL до E2d.

### E2c — HLT-01/02, C-1, C-2

1. SafeResumption/HLT_LV (AND: `in_LV_Faulty_FBK` NC, `recRndC_SU` NO, `in_False_SI2_CH8` NO)
   → `linkHltLvLost`.
2. RndPhysicalCompact/GATE_SG_SET (OR: `linkSafeSgOwnerSet`, `linkHltLvLost`) → STATE_SG.Set.
3. C-1: порядок STATE_SU → SG_OWNER_SET → HLT_LV → GATE_SG_SET → STATE_SG;
   GATE_020.AndIn7 := `recRndC_SG` NO.
4. C-2: GATE_030.OrIn6 := `linkHltLvLost`.

Ресурсы: +2 → **224**, 1913 портов, 78 SAL-переменных.
Известные FAIL: STP-I (E3), HLT-03 / SafetyFault (E5).

### E2d — Safe-сторона крышки и Q-REL

1. N1/FBAndLvCurrentPermit.AndIn4/5 деактивировать.
2. N2/FBAnd1.AndIn5/6 деактивировать.
3. **НОВЫЕ** входы N1/FBAnd4.AndIn3/4 := NC1/NC2 — legacy Bypass при открытой крышке
   (убийца — R&D/S12; см. D-2 ревью v2).
4. SafeResumption/MODE.OrIn4 := `b_Step12` (Q-REL-AFTER-PERMIT).
5. Unlock (Q-ARCH-10 «А»): блоков нет. Синяя в Safe и в R&D даёт Unlock и при открытой
   крышке. В Run и переходах Unlock запрещён существующими guards (модель:
   `reviewer/E2-plan-v3/repro/v6.out.txt`, `t15`).

Ресурсы: 0 FB → **224**, 1913 портов, 78 SAL-переменных.
Известный FAIL после E2: CFG-02 — legacy Bypass в R&D при закрытой крышке (E4).

## 4. Эскизы E3…E6 (лимит 512 — экономия не нужна)

- **E3 ≈ +25 FB:**
  - ядро STOP v2 +4;
  - HEALTH_DESC +1;
  - NORMAL_DOWN (Q-RC-17) +1;
  - HL_MEM (Q-RC-16) +4;
  - ABT +7;
  - OFF-watchdog +4;
  - **HL_FAULT +4** (вторая память до ответа Вадима по варианту (в)).
- **E4 ≈ +19**, **E5 ≈ +5** (`b_SafetyFault`), **E6 ≈ +16** — состав как в v3.
  Варианты (б), (г1), (е) отклонены.
- **Итог (оценка ±5):** R1 215 → E2 224 → E3 ~249 → E4 ~268 → E5 ~273 → E6 ~289 FB,
  что < 512.
- **NV:** реальный предел — 12 страниц Safe Logic cfg по 2048 Б (группы, соединения,
  data sets всех FB). Оценка в FB его не доказывает; проверка — в IDE, вне объёма.

## 5. Мутации

Во всех `MUTATION_PLAN_E2a…E2d.json` v4:
- testFiles — 17 точных имён (16 прежних + `current-e2d-unlock-cover.test.js`);
- `behaviouralTests ^E2[a-d] `;
- `sourceSha256 = FILL_AT_G2`.

Модельные убийства:
- `t15`: FBAnd6.AndIn2, FBAnd6.AndIn3, G10.AndIn1, G10.AndIn6;
- `v3/t11`, `t12`, `t13`, `t14`, `t9`: как в v3.

Equivalent by proof:
- MU11 (RUN_DOWN_RESET.OrIn2);
- N7/FBAnd8.AndIn5, N6/FBAnd18.AndIn4;
- FBAndLvEmg.AndIn3 и HLT_LV.AndIn3 (`in_False` ≡ FALSE, Q-MU06-01);
- **FBOr1.OrIn4 (g7→S1)**: защитный вход по рекомендации ревью (а). Конкуренция g5/g7 в
  поиске ревьюера (25 прогонов, `v3.out.txt`) не найдена. Если тестировщик не найдёт
  достижимого убийцы, мутация отмечается EQUIVALENT со ссылкой на этот поиск.

Мутации порядка (`swap-order`, `operatorAvailable:false`):
- FBRs7 вне головы;
- FBAnd6 после FBTon3;
- FBAnd16 после N1/FBAnd1;
- CONNECTOR_SCOPE после N1/FBAnd1;
- G10_EXIT после N6/FBDecouple2;
- HLT_LV перед STATE_SU.

## 6. Вопросы

- **Q-ARCH-11** — у Вадима (противоречие `_Invert`, ревью v3 §12). Блокирует только E2a-PLC.
- **Вариант (в)** — вопрос требований (две памяти ошибки), у Вадима.
- **R1 при лимите 512** — у Вадима (§8).

## 7. Файлы редактора

R1, E2a…E2d: `TwinSafeGroup1.sal`, `.sal.diagram`, `GVL1.sgvl` в worktree.
E2a-PLC — только после ответа Q-ARCH-11 и расширения path-guard.

## 8. Перебазирование на F1 (если Вадим отменит R1)

Механизм и все блоки E2 сохраняются. Меняется следующее.
1. **Удалённые R1 блоки и Symbols остаются.** Чтобы кольцо от них не зависело (NV N4,
   мёртвые гранты), в E2a деактивируются входы стадийных OR, которые в R1 исчезали вместе
   с Symbols:
   - FBOr1.OrIn1 (b_Step1_Reset), FBOr1.OrIn2 (FBOr4 = Step2_Set);
   - FBOr2.OrIn1, OrIn4 (b_Step1_Set, b_Step1_Set_3); FBOr2.OrIn3 (b_Step1_Set_2)
     переназначается на G10_EXIT в E2b;
   - FBOr5.OrIn1, FBOr6.OrIn1 (b_Step3_Set_3; затем FBOr6 удаляется, как в плане);
   - FBOr7.OrIn1, FBOr9.OrIn1, FBOr11.OrIn1 (FBOr11 удаляется).
2. **Step2 (N3/FBRs2) остаётся памятью вне кольца.** Set — от NV `b_Step2_Set`, Reset — FBOr3.
   - Доказательство INV-1 становится условным на N4=FALSE (DERIVED): если бы Step2
     ставился, его потребители (Network5) давали бы C1/C2 и STO без гранта.
   - Требуется отдельный пункт known-NV.
   - N3/FBAnd1 (g1) сохраняет `!Step2`.
   - `out_Step2` публикуется от FBRs2, как в F1.
3. Входы, назначенные в v4 на порты, освобождённые R1, — проверить занятость в F1:
   - FBOr1.OrIn4 (g7): в F1 это `b_Step_RnD` (память); E2a деактивирует, E2b назначает g7 — без конфликта;
   - FBOr2.OrIn3 (g10): в F1 это `b_Step1_Set_2` ≡ FALSE; заменяется.
4. **Ресурсы на базе F1:** 242 → E2a 242 → E2b 249 → E2c 251 → E2d 251 FB.
   Порты 2076 → 2076 / 2139 / 2157 / 2157. Symbols 85 (без C-R1-2).
5. Мутации те же. Добавляются известные NV: Network4/5/9 активны.
   Дифференциал R1 и его условия C-R1-1…5 не нужны.

Вердикты ревью к F1-версии не относятся — нужен повторный проход.
