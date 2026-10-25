# E2-status v5 — механизм статусов, срезы R1 и E2a…E2d (+ эскиз E3…E6)

Роль: v2-architect. Дата: 2026-10-22. Версия 5.

Основание:
- ревью `program/reviewer/E2-plan-v4/PLAN_REVIEW.md` (A4-1…A4-8, B4-1…B4-4, D4-1/D4-2, X4-1, §10a);
- G1 v4 C5 (`program/reviewer/E2-G1-v4/G1_REVIEW.md` §3);
- ответы Вадима: Q-V4-01 «Б», вопрос 68 «Б», вопрос 63 (Q-ARCH-11 «Б»), Q-64 «А», вопрос 66, Q-CA1-01, Q-T3-1;
- решение ведущего: E2a разделён на **E2a-core** (уже у редактора, **не меняется**) и **E2a-RC**.

Прежние версии: `*.v1…v4.*`, `repro/v1…v4/`. Canonical не менялся.

## 0. Источник

| Объект | SHA256 |
|---|---|
| canonical SAL (F1) | `04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3` |
| R1-кандидат | SAL `ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3` |
| SCENARIO_DECISIONS.md | `2633920b1d8981e3b63b53cb580b2c5cbfed287df00bacb086a5336d821cd86e` |
| reference | 4495a1f, только `git show` |

Базис — R1 (Q-64 «А»: продолжать R1). Раздел «перебазирование на F1» (v4 §8) справочный и
не применяется.

## 1. Что изменилось против v4

| Пункт | v5 |
|---|---|
| E2a-core | Без изменений. Addendum по A4-1…A4-5, A4-7 — §3.1. Логики SAL он не меняет |
| **A4-8 E2a-RC** | Окно 500 мс от команды (новые TON 0,5 с — вопрос 68 «Б»), затем 0,1 с непрерывно FBK ∧ норма. Run и R&D — не раньше «команда + 600». +2 FB (§3.2) |
| A4-2 | M-E2a-21 (порядок FBAnd6/FBTon3) — «сдвиг +1 скан, перезапуск сохраняется». Убийца только по верхней границе; до решения аналитика — `equivalentWithinTolerance` |
| A4-6 E2a-PLC | Таблица соответствия по Q-ARCH-11 «Б», атомарный порядок, 7 файлов, проверки G2 (§3.3) |
| B4-1 | M-E2b-24/25 (G10.AndIn7/8) — по отдельности `equivalentBySearch`: Bypass поднимает C1 и C2 в одном скане, второй вход маскирует. Пара (оба входа) — мутация с убийцей. Окончательно — после B4-3 |
| B4-2 | REL-01(e) в criteria E2b. Убийца M-E2b-21 дополнен. В known FAIL после E2a: «REL-01(e) RED до E2b» |
| B4-3 | Legacy Bypass в S6 — изолированная точка `N1/FBAnd4.AndIn5`; вопрос у аналитика. Known FAIL E2b…E2d до ответа или E4 |
| B4-4 | M-E2b-30 — `equivalentBySearch` (v3: 25, w1: 630, w12: 72 прогона + структурный довод; DERIVED). Вход сохраняется, переоценка в E3/E4 |
| D4-1/D4-2 | Door-мутации UNL-05 в E2d. N12/FBAnd3.AndIn2 — BLOCKED Q-T3-2b. REL-01(e) закрывается в E2b, а не MODE.OrIn4 |
| X4-1 | testFiles — 20 точных имён |
| A4-5 | baselineResources = R1/512; mu24 → M-E2d-03 |
| §10a | 7 выживших guard'ов F1 классифицированы в планах мутаций (§5) |
| Вопрос 66 | Из эскиза E3 убран HL_FAULT (+4) — одна память SafetyFault. В E6 добавлен LV-watchdog 30 с (откат в Safe + SafetyFault) |
| G1 v4 C5 | Мутанты (i)–(x) распределены по срезам (§5.5) |
| Стенд, STATE-кейсы | Заменены E2-01/E2-02/E2-03 (структурно); точки инъекции на грантах — как робастные пробы (§6) |

## 2. Механизм — без изменений против v4 (§2 v4)

Кольцо S1/S12/SR/S3/S4/S5/S6. Гранты g1…g10, g7 стадийный. Reset по правилу «g7 в Reset
каждой конкурирующей цели». Голова 15 блоков. Правило L1. D2-A.

## 3. Срезы

### 3.1 E2a-core — у редактора; addendum по A4

- **A4-1.** SHA SCENARIO_DECISIONS = `2633920b…cd86e`. В decisionsUsed добавлены Q-V4-01,
  вопросы 63/64/66/68, Q-T3-1, Q-CA1-01, Q-61.
- **A4-3 (стенд).** Кейсы STATE:Safe-RnD-Run, STATE:Emergency-removal и
  STATE:conflicting-set-requests на R1/E2 **заменяются** E2-01 (поскановый «≤1 стадия /
  ровно 1 статус»), E2-02 и E2-03 (структурно). Причина: прежние точки инъекции
  (`b_Step1_Set`, `b_Step3_Set_3`, `b_Step1_Set_2`) удалены в R1. Инъекция на грантах кольца —
  робастная проба, а не доказательство (§6).
- **A4-4.** Known FAIL после E2a-core:
  - энергия в Emergency вне Run — до E2b;
  - Healthy в устойчивом Run → Step4 — до E3;
  - SafetyFault — до E5;
  - **REL-01(e) — до E2b**;
  - **legacy Bypass в S6 (B4-3) — до ответа/E4**;
  - E2a-RC — до среза E2a-RC.
- **A4-5.** baselineResources: 215 FB / 1832 порта / 65 Symbols / 75 SAL-переменных, limitFb 512.
- **A4-7.** §10a — в планах мутаций (§5.4).

### 3.2 E2a-RC — окно 500 мс + 0,1 с (Q-V4-01 «Б», вопрос 68 «Б», Q-RC-RUNCONF-01 «В»)

**Run (StartingRun → S3):**
1. Новый **Network12/WIN_C2** (safeTon, Delay Time 0,5 с; TonIn = wire N12/FBAnd4 — команда C2
   на время запуска). Таймер введён решением Вадима (вопрос 68); существующие не меняются.
2. N12/FBAnd6: AndIn1 := wire WIN_C2, AndIn2 `in_HV_C2_FBK`, AndIn3 `in_HV_Faulty_FBK` (NO).
   Порядок: WIN_C2 → FBAnd6 → FBTon3.
3. N12/FBTon3 (0,1 с, без изменения): TonIn := wire FBAnd6; TonOut → wire N12/FBDecouple2.DecIn1…4.
   Symbol `b_Reset_HV_Discharg_Req2` переносится с FBAnd6.AndOut на FBTon3.TonOut.

**R&D (S12 → SR), то же для C1/LV:**
4. Новый **Network11/WIN_C1** (safeTon, 0,5 с; TonIn = wire N11/FBAnd1 — команда C1 в S12).
5. N11/FBAnd4: AndIn1 := wire WIN_C1 (было Ton1), AndIn2 `in_LV_C1_FBK`, AndIn3
   `in_LV_Faulty_FBK` (NO — из core). Порядок: WIN_C1 → FBAnd4 → FBTon1 → FBAnd5.
6. N11/FBTon1 (0,1 с): TonIn := wire FBAnd4; N11/FBAnd5.AndIn1 := wire FBTon1.
   Symbol `b_Reset_LV_Discharge_Req2` переносится с FBAnd4.AndOut на FBTon1.TonOut.

Поведение (модель `repro/t16.out.txt`):
- FBK на cmd+30 → Run/R&D на **cmd+600**;
- FBK на cmd+700 → cmd+802;
- HV-глитч на +560 → Run на +663 (перезапуск);
- Healthy в норме не был → нет Run/R&D;
- мутант «окно обойдено» → cmd+132 (убит);
- мутант без FBK → Run без FBK (убит).

Соответствие CRITERIA_DELTA_v7 §4 (`378a9f93…8459`):
- окно WIN начинается в скане u команды (`out_HV_C2`/`out_LV_C1` встаёт тем же запросом
  N12/FBAnd4 / N11/FBAnd1), выход TON — на u+500 = w;
- FBAnd6 и FBAnd4 учитывают FBK ∧ норма только при WIN = TRUE, то есть k ≥ w. Отсюда K = max(k, w);
- TON 0,1 с даёт Run/R&D на K+100…K+101: RC-3 «K+101 есть, K+100 — наблюдение».
  Модель — u+600 при K = u+500 (наблюдаемая точка).
- RC-2: ≤ u+599 нет. RC-6: провал HV перезапускает отсчёт. Внутри окна провал FBK не влияет.

**R&D:** Q-V7-02 закрыт вопросом 68 «Б» (решение ведущего): R&D не раньше «команда C1 + 500 +
100 мс непрерывно C1_FBK ∧ LV норма после окна». Структура WIN_C1 → N11/FBAnd4 → N11/FBTon1 —
та же, что для Run. Изоляции нет.

**Провал FBK после окна** по Q-V4-01 должен давать Emergency (Q-RC-19). В E2a-RC он только
перезапускает отсчёт (модель: dip на +560 → +663). Это **known FAIL «перезапуск вместо
Emergency» до E6**. В E6 WIN_C1/WIN_C2 используются как окно watchdog:
- конец окна без FBK → откат + SafetyFault;
- провал FBK после окна при команде ON → Emergency.

Окно и Q-CA1-01 (30 с до Run) — тоже E6.

Ресурсы: +2 FB (TON) → **217**, +4 порта → 1836, Symbols и SAL-переменные без изменений.

### 3.3 E2a-PLC — Q-ARCH-11 «Б» (вопрос 63)

Таблица соответствия (замена **только целым идентификатором**, не подстрокой):

| Было | Стало | Где |
|---|---|---|
| `LV_Healthy` (связанное, TRUE = неисправность) | `LV_Faulty` | DUT стр. 21; tsproj SubItem Name 1728; **Link VarA 13173** `…^LV_Faulty`; MAIN стр. 114 (правая часть) |
| `HV_Healthy` (связанное) | `HV_Faulty` | DUT 22; tsproj Name 1734; **Link VarA 13171** `…^HV_Faulty`; MAIN 113 (правая часть) |
| `LV_Healthy_Invert` (= NOT, TRUE = исправно) | `LV_Healthy` | DUT 24; tsproj Name 1740; MAIN 114 (левая часть); VIS стр. 5447 |
| `HV_Healthy_Invert` | `HV_Healthy` | DUT 25; tsproj Name 1746; MAIN 113 (левая часть); VIS 5203 |

После правки MAIN: `…LV_Healthy := NOT …LV_Faulty;` и `…HV_Healthy := NOT …HV_Faulty;`.
Visualization: **2 ссылки** на переменные (5203, 5447); текстовые подписи «LV Healthy»/«HV Healthy»
не менять — смысл «исправно» сохраняется.

**Атомарный порядок** (иначе старый `LV_Healthy` уйдёт в новое вычисляемое поле):
1. во всех файлах сначала `LV_Healthy` → `LV_Faulty` и `HV_Healthy` → `HV_Faulty` (целым токеном,
   исключая `_Invert`);
2. затем `LV_Healthy_Invert` → `LV_Healthy`, `HV_Healthy_Invert` → `HV_Healthy`;
3. обе замены — одним изменением, без промежуточного сохранения в IDE.

**Проверки G2:**
- Link VarA 13171/13173 оканчиваются на `^HV_Faulty`/`^LV_Faulty` и связаны со Standard Out Var 90/89;
- в MAIN ровно две строки `X_Healthy := NOT X_Faulty`;
- в VIS 2 ссылки на `…LV_Healthy`/`…HV_Healthy`;
- ни одного `_Invert`;
- у каждого потребителя полярность не изменилась.

**Файлы — 7.**
- Safety_Dyno (D-ARCH-POL-RENAME, outPLC): `Alias Devices/PLC_IO/StatusToPLC/outPLC_LV_Healthy.sds`,
  `outPLC_HV_Healthy.sds` (переименование файлов, внутри имени нет), `Safety_Dyno.splcproj`
  (стр. 63, 65).
- PLC (вопрос 63): `MEN001_Dyno.tsproj`, `PLC_Dyno/DUTs/ST_TwinSAFE_IN.TcDUT`,
  `PLC_Dyno/POUs/MAIN.TcPOU`, `PLC_Dyno/VISUs/Visualization.TcVIS`.

Других вхождений в `MEN001_Dyno/` нет (grep; `MEN001_Dyno.tsproj.bak` не трогать).
Ведущий открыл 4 PLC-файла; ещё 3 (.sds ×2, splcproj) требуют доступа под Safety_Dyno.
Native/CRC после переименования .sds и tsproj — NV; download — нет.

### 3.4 E2b — логика как v4 (READY), правки планов и FAIL

- criteria += **REL-01(e)**: эпизод потери connector перекрывает квалификацию BOTH в Safe →
  попытка потреблена (GATE_030.OrIn5), энергия не поднимается. Механизм — E2b п.8.
- Q-T3-1: фазы R&D→Safe и Run-down — по EMG-RD-L (`current-e2a-emg-rd-sweep`); шаг спуска
  = min(нормальный, аварийный). Нарушений в модели нет (ревью w11).
- **B4-3 (изолировано).** Legacy Bypass в S6 после раннего Restart поднимает C1/C2. Если зелёная
  отпущена в том же скане, G10 по прошлой команде даёт 1 скан SAFE при включённой энергии.
  Точка зависимости — **N1/FBAnd4.AndIn5**. Варианты ответа аналитика/Вадима:
  - (А) гейтировать legacy Bypass стадией: AndIn5 := `b_Step1` (Bypass только в Safe, 0 FB).
    Тогда M-E2b-24/25 становятся эквивалентными по построению;
  - (Б) оставить до E4 — known FAIL «Bypass в S6 / 1 скан SAFE при энергии» E2b…E2d.
- Known FAIL на стеке R1+E2a+E2b — как v4, плюс B4-3.

Ресурсы E2b: +7 → **224**, 1899 портов, 77 SAL-переменных.

### 3.5 E2c — без изменений (READY). 226 FB, 1917 портов, 78 SAL-переменных.

### 3.6 E2d — логика как v4 (READY) + FBK-10. 226 FB, 1917 портов.

**FBK-10 (Q-V4-02 «В», CRITERIA_DELTA_v7 §4.5): FBK ON без команды в устойчивом Safe/R&D →
запрет подъёма, пока FBK не OFF.**
- **Safe→R&D:** уже запрещён существующей цепью ReadyForStep2: N2/FBAnd2 требует
  `!in_LV_C1_FBK ∧ !in_HV_C2_FBK` → N2/FBAnd3 → N2/FBAnd4 (linkSafeAcceptedUpSet).
  Изменений нет; это F1-guard (мутация M-E2d-09).
- **R&D→Run:** новый вход **RndPhysicalCompact/GATE_020.AndIn8 := `in_HV_C2_FBK` (NO)**, 0 FB.
  Модель (`repro/t17.out.txt`): R&D с C2_FBK ON без команды + BOTH → SU не ставится;
  мутант → SU и STO сняты.
- SafetyFault по FBK-10 и правило «квитирование не снимает запрет при FBK ON» — **E5**
  (`b_SafetyFault` Set от FBK-10).
- Emergency из-за FBK-10 запрещён: в E2 источника нет по построению. Мутант (xv) — структурный.

D4-2: REL-01(e) закрывается в E2b. M-E2d-03 (MODE.OrIn4) касается только Q-REL (t14).
Door-guards UNL-05 не меняются; мутации — §5.

## 4. Эскизы E3…E6 (лимит 512)

- **E3 ≈ +21 FB:**
  - ядро +4;
  - HEALTH_DESC +1;
  - NORMAL_DOWN +1;
  - HL_MEM +4;
  - ABT +7;
  - OFF-watchdog +4.

  HL_FAULT **убран** (вопрос 66(a): одна память SafetyFault, HealthyLost — её причина).
  Отсчёт STOP v2 и (i)–(iv), (vii) из C5 — мутации E3.
- **E4 ≈ +19** (декодер, публикация, PLC-команды, Config, heartbeat).
- **E5 ≈ +5** (`b_SafetyFault`).
- **E6 ≈ +12…+14**: WIN_C1/WIN_C2 уже есть из E2a-RC, поэтому ON-watchdog = AND по
  контактору (+2); Healthy 30 с от первого FBK — HV и **LV** (вопрос 66(b), Q-CA1-01; +4);
  S12_ABORT +3; маршрут откат/Emergency +1; Q-RC-19 (провал после окна → Emergency) +2…+4.
- **Итог (±5):** R1 215 → E2 226 → E3 ~247 → E4 ~266 → E5 ~271 → E6 ~285 FB < 512.
  Предел 12 страниц по 2048 Б — NV; офлайн Verify разрешён Q-61 и делается отдельно от программных тестов.

## 5. Мутации

### 5.1 Общее

Во всех `MUTATION_PLAN_E2a…E2d.json` v5:
- testFiles — **20 точных имён**: 17 прежних + `current-e2a-emg-anchor.test.js`,
  `current-e2a-emg-rd-sweep.test.js`, `current-e2d-unlock-door.test.js`;
- `^E2[a-d] `;
- `sourceSha256 = FILL_AT_G2`.

### 5.2 E2a (core + RC)

- core — M-E2a-01…17 без изменений.
- RC, заменены:
  - M-E2a-18 FBAnd6.AndIn2 (C2_FBK) — Run без FBK;
  - M-E2a-19 FBAnd6.AndIn3 (HV) — Run при HV Faulty;
  - M-E2a-20 FBAnd6.AndIn1 — окно обойдено, Run на cmd+132 (C5 (ix));
  - M-E2a-21 swap-order FBAnd6/FBTon3 — сдвиг +1 скан, перезапуск сохраняется,
    `equivalentWithinTolerance` до решения аналитика о верхней границе (RC-6).
- Новые:
  - M-E2a-22 set-parameter WIN_C2 0,5 → 0,4 (Run до cmd+600);
  - M-E2a-23/24/25 — R&D-аналоги: N11/FBAnd4.AndIn1 (окно), AndIn2 (C1_FBK), WIN_C1 0,4;
  - M-E2a-26 (C5 (x)) — «отсчёт не перезапускается»: FBTon3 питается от WIN_C2, а FBK
    проверяется после TON (старая схема). Оператора нет, `operatorAvailable:false`. Убийца —
    HV-глитч на +560 → в мутанте Run на +600 вместо +663.

### 5.3 E2b

- M-E2b-24/25 → `equivalentBySearch` по отдельности (ревью w6/w8: маскирование вторым входом).
- **M-E2b-34** — оба входа G10.AndIn7 и AndIn8 деактивированы (одна мутация, два порта).
  Убийца: S6 после раннего Restart, Bypass TRUE, C1_FBK/C2_FBK удерживаются OFF, зелёная
  нажата и отпущена → Safe при командах ON. Убиваем только при варианте B4-3 (Б).
- M-E2b-21 — убийцы IL-02 и **REL-01(e)** (Safe, эпизод connector перекрывает квалификацию;
  мутант: C1 ON p+1503).
- M-E2b-30 — `equivalentBySearch` (DERIVED).

### 5.4 Классификация 7 выживших guard'ов F1 (§10a)

| Guard | Решение |
|---|---|
| IL-04 N2/FBAnd1.AndIn5, IL-05 AndIn6 | Сняты в E2d (V14-Q7). На E2a–E2c маскируются параллельными NC в FBAndLvCurrentPermit.AndIn4/5. `removedGuards` в E2d |
| IL-06 N6/FBAnd9.AndIn2, IL-07 GATE_001.AndIn5 | Сняты в E2b; заменены M-E2b-07/08/09 (крышка в Run) и M-E2b-20/21 (UP R&D) |
| ES-07 N5/FBAnd1.AndIn3 | Удалён в R1 |
| **ES-06 N3/FBAnd1.AndIn2** (`b_EStop_Ok` в g1) | Мутация M-E2a-27. Убийца: загрузка без Restart → `b_Step1` FALSE до Restart (мутант ставит S1 в скане 1). Норматив — сохраняемая последовательность reference (Step1 только после Restart). Ждёт подтверждения аналитика; иначе — equivalent (память стадии ненаблюдаема) |
| UL-05 N12/FBAnd2.AndIn3 (¬зелёная) | `equivalentBySearch` (ревью w15: g ∈ {0,1,100,499,500,501,700}; BA исключает зелёную, FBAndUnlockHold маскирует) |

### 5.5 Мутанты C5 (i)–(x) из G1 v4

| C5 | Срез | Мутация |
|---|---|---|
| (i) STO только по таймеру аварийной цепи | E3 | M-E3: RUN_STO_REQ.OrIn1 / NORMAL_DOWN в Emergency |
| (ii) Emergency перезапускает таймер SS1/разряда | E3 | M-E3: swap/rewire RUN_SS1_TON и RUN_COAST_TON |
| (iii) Emergency укорачивает SS1 | E3 | M-E3: STO_REQ от FBAndLvEmg |
| (iv) снятие SS1 после e | E3 | M-E3: N1/FBAnd2.AndIn4 |
| (v) STS_RUN держится до +2 | E4 (декодер) | M-DEC-02 DEC_RUN.AndIn2 |
| (vi) статус Emergency на +3 в Run (L3) | E2b | M-E2b-31/32 (порядок L1) + swap N1/FBAnd1 после FBEstop1 (M-E2b-35, `operatorAvailable:false`) |
| (vii) N=u: STO позже a+1+d_R | E3 | M-E3: порядок STO-цепи N1 (M-E3-12) |
| (viii) Door из сброса/выдачи Unlock | E2d | M-E2d-04…07 |
| (ix) RC-5 отсчёт от команды | E2a-RC | M-E2a-20 |
| (x) RC-6 нет перезапуска | E2a-RC | M-E2a-26 |
| (xi) при Emergency игнорируется немедленный STO STP-D/STP-H (STO в t_a+2000) | E3 | M-E3: RUN_STO_REQ.OrIn2 при owner ∧ !EOk |
| (xii) STO на e+7006 вместо нормального | E3 | M-E3: NORMAL_DOWN / STO-цепь только от S4 |
| (xiii) из разрешения подъёма убрано условие «FBK OFF» | E2d | M-E2d-09 N2/FBAnd2.AndIn2 (Safe, C1_FBK), M-E2d-10 N2/FBAnd2.AndIn3 (C2_FBK), M-E2d-11 GATE_020.AndIn8 (R&D) |
| (xiv) квитирование снимает запрет при FBK ON | E5 | M-E5 (план E5) |
| (xv) FBK-10 → Emergency | E2d | структурно: в E2 нет пути FBK-10 → защёлка. Мутанта в операторах нет — не в знаменателе, проверка регрессом FBK-10 |

### 5.6 E2d — Door (D4-1)

- M-E2d-04 invert N2/FBAnd8.AndIn1 (UNL-05 Safe);
- M-E2d-05 deactivate N1/FBOr3.OrIn1 (UNL-05 Safe);
- M-E2d-06 deactivate N12/FBAnd2.AndIn4 (UNL-05 R&D);
- M-E2d-07 deactivate N12/FBAnd11.AndIn1 (UNL-05 R&D);
- N12/FBAnd3.AndIn2 — BLOCKED Q-T3-2b.

Модель: ревью w13. Ограничивающий `deactivate N2/FBAnd8.AndIn1` убивается UNL-04, оставлен как M-E2d-08.

## 6. Стенд: инъекции на грантах (робастные пробы, не oracle E2-01)

| Проба | Инъекция (1 скан) | Ожидание по построению |
|---|---|---|
| G-1 | `b_Step2_Set_2` (g5) + `b_Step4_Set` (g7) | S4 только (g7 в Reset S1 и SR) |
| G-2 | `b_Step3_Set_2` (g4) + `b_Step4_Set` | S4 только |
| G-3 | `b_Step12_Set_2` (g6) + `b_Step4_Set` | S4 только |
| G-4 | `b_Step12_Set` (g2) + `b_Step3_Set_2` (g4) — разные источники, нарушение привязки | **две стадии** — ожидаемо. Кольцо опирается на привязку грантов; проба показывает пределы, это не дефект |

## 7. Вопросы

- **Аналитику** (Q-V7-02 закрыт решением ведущего — вопрос 68 «Б»):
  - **B4-3** — Bypass в S6: (А) гейт `b_Step1` или (Б) до E4;
  - RC-6 — нормативна ли верхняя граница момента Run (M-E2a-21);
  - ES-06 — норматив «нет стадии до Restart».
- Q-T3-2b — у аналитика (N12/FBAnd3.AndIn2).

## 8. Файлы редактора

- E2a-RC, E2b, E2c, E2d: `TwinSafeGroup1.sal`, `.sal.diagram`, `GVL1.sgvl`.
- E2a-PLC — 7 файлов §3.3, после расширения path-guard.
