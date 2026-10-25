# E2-status v2 — механизм присвоения статусов и срезы R1, E2a…E2d (+ эскиз E3…E6)

Роль: v2-architect. Дата: 2026-10-21. Версия 2 после ревью
`program/reviewer/E2-plan/PLAN_REVIEW.md` (NEEDS CHANGES N1–N8) и новых ответов Вадима.
Прежняя версия сохранена: `PLAN.v1.md`, `PLAN.v1.json`, `MUTATION_PLAN_*.v1.json`, `repro/v1/`.
Canonical не менялся; запись только в `SafetyTests/program/architect/E2-status/`.

## 0. Источник и входы

| Объект | SHA256 |
|---|---|
| canonical SAL (F1) | `04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3` (= матрица) |
| canonical SGVL | `dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104` (= матрица) |
| canonical diagram | `de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603` (= матрица) |
| SCENARIO_DECISIONS.md (не закоммичен) | `c1e7fe6cf7aa1adbf7fcc33452c393bddd6f2cc4dfc02140ab55e621c0fd7bdf` (включает D-ARCH-POL-RENAME и Q-ARCH-06=А; предыдущее чтение 455de843…) |
| reference | 4495a1f, только `git show` |

Решения, учтённые в v2:
- Q-RC-01=В: потеря крышки в устойчивом Run → Emergency.
- Q-RC-02=А: потеря Healthy в устойчивом Run → спуск в R&D с немедленным STO.
- Q-RC-03: (a) StartingRun → Emergency; (b1) в Run→R&D, Safe→R&D, R&D→Safe потеря крышки
  ничего не меняет; (b2) выход из Config → Emergency.
- Q-RC-04…Q-RC-09 — ответы.
- Q-RC-10=А: «ни одного» → Emergency.
- D-ARCH-POL: сырое FALSE = исправен; ошибка только в N11/FBAnd4.
- D-ARCH-POL-RENAME: `in_LV/HV_Healthy_FBK` → `in_LV/HV_Faulty_FBK`, срез E2.
- Q-ARCH-06=А: R1 разрешён при условиях — ревьюер подтверждает неиспользуемость и
  выполнен полный регресс до/после. R2 и слияние HL/SafetyFault **не разрешены**.

Native-семантика — `program/stand/FB_SEMANTICS.md`. Пределы доказательства:
- DOC: AND, OR, RS, TON, ESTOP (EST-4).
- DERIVED: межцикловая видимость (GRP-2), постоянство входов в цикле,
  нулевые начальные RS/wire/Symbols (RS-4, GRP-4).
- Доказательство касается памятей стадий и статуса, а не аппаратной энергии.

Ресурсы canonical: 242 FB (AND 115, OR 51, RS 28, TON 19, DECOUPLE 27, ESTOP 2),
2076 портов (AND/OR 9, RS 3, TON 2, DECOUPLE 16, ESTOP 14 — по типу FB),
85 Symbols SGVL, 75 SAL-переменных, 307 wiredLink.

## 1. Находки canonical (без изменений против v1, с поправками ревью)

1. Reset стадий берёт *память* другой стадии предыдущего скана (FBOr1←Step12/RnD,
   FBOr5←Step4, FBOr7←Step5, FBOr9←Step6). Отсюда скан с двумя стадиями
   (Step3∧Step4, Step1∧Step12) — корень гонки E1.
2. Спуск из Run завершается через Step12 — фазу перехода Safe→R&D (маскировка).
3. Emergency — это `!b_EStop_Ok`, а не стадия:
   - в R&D/Step12 при EStop стадия сохраняется, LV остаётся включённым;
   - **в StartingRun при EStop или потере крышки SU сбрасывается, но STO остаётся
     снятым и C2 ON при стадии R&D** (ревьюер, `reviewer/E2-plan/repro/su_cover.out.txt`).
4. Полярность LV Healthy: N11/FBAnd4.AndIn3 читает напрямую, остальные — с инверсией.
   Закрыто решением D-ARCH-POL.
5. ~~«F1 запускает R&D→Safe параллельно с запуском»~~ — **снято**: ревьюер показал,
   что зелёная и BOTH не квалифицируются при активных SU/SG. RELEASE-ветка
   рекогнайзера (GATE_008/GATE_014) требует !SG∧!SU, поэтому защёлка C не снимается.
6. Network4 в canonical называется `networkName="Network4ToBeDeleted"`. Его входы
   DecIn1…DecIn8 сконфигурированы одинаково (без источника, filter=2).

## 2. Механизм (принят ревью; v2 — уточнения)

### 2.1 Стадии и группы статуса

| Стадия | RS | Группа | Дети |
|---|---|---|---|
| S1 Safe | N3/FBRs1 `b_Step1` | SAFE | SAFE_ACCEPTED_UP |
| S12 Safe→R&D | N3/FBRs8 `b_Step12` | SAFE (источник) | (E6 S12_ABORT) |
| SR R&D | N3/FBRs7 `b_Step_RnD` | RND | STATE_SU, STATE_SG, (E3 ABT) |
| S3 Run | N3/FBRs3 `b_Step3` | RUN | RUN_DOWN_OWNER, (E3 RUN_STO_PHASE) |
| S4/S5/S6 | N3/FBRs4/5/6 | EMG | — |
| (E4) SC, SCX | новые RS | CFG | — |
| нет стадии | — | EMG (Q-RC-10=А) | — |

### 2.2 Гранты

| g | Символ | Переход | Привязка к источнику (текущий скан) |
|---|---|---|---|
| g1 | wire N3/FBAnd1 | нет стадии → S1 | AND всех `!S*` |
| g2 | `b_Step12_Set` | S1→S12 | linkSafeAcceptedUp (Reset !SAFE_UP_SCOPE ∋ S1) / N2/FBAnd91 ∋ N2/FBAnd11 |
| g3 | `b_Step_RnD_Set` | S12→SR | TON-вход N11/FBAnd1 = S12 |
| g4 | `b_Step3_Set_2` | SR→S3 | N12/FBAnd1 = SR |
| g5 | `b_Step2_Set_2` | SR→S1 | b_Reset_LV_C1_3 ⇐ STATE_SG ⇐ SR |
| g6 | `b_Step12_Set_2` | S3→SR | N6/FBAnd18.AndIn4 = N6/FBAnd1 (S3) |
| g7 | `b_Step4_Set` | **S3→S4 или SR(SU)→S4** (E2b) | N6/FBAnd2 (S3) ∨ N6/FBAndSuEmg (SU предыдущего скана ⇒ SR либо S3 после блока) |
| g8 | `b_Step5_Set` | S4→S5 | N7/FBAnd8.AndIn5 = `b_Step4` |
| g9 | `b_Step6_Set` | S5→S6 | N8/FBAnd1 (S5) |

| RS | Set | Reset |
|---|---|---|
| FBRs1 (S1) | N3/FBOr2 = g1 ∨ g5 | N3/FBOr1 = g2 |
| FBRs8 (S12) | g2 | g3 |
| FBRs7 (SR) | N3/FBOr16 = g3 ∨ g6 | N3/FBOr13 = g5 ∨ g4 ∨ **g7** (с E2a) |
| FBRs3 (S3) | g4 | N3/FBOr5 = g6 ∨ g7 |
| FBRs4/5 | g7 / g8 | FBOr7 = g8 / FBOr9 = g9 |
| FBRs6 | g9 | wire N3/FBOr2 (гранты в S1; в EX добавится g10 S6→S1) |

Правила:
- Reset_s содержит все гранты из s.
- Reset_s может содержать только те гранты, которые не могут сработать при активной s
  (g7 в FBOr5 и FBOr13 — один символ; при одновременных g4 и g7 S3 не устанавливается,
  так как Set и Reset равны 1 и Reset доминирует; итог — S4, то есть приоритет Emergency).
- Reset_s никогда не содержит грант в s.

### 2.3 Арбитраж

- S3: g6 и g7 — **reset-доминированием**: g7 входит в Reset SR (N3/FBOr13.OrIn2,
  с E2a). При одновременных g6 и g7 у SR одновременно Set и Reset ⇒ 0; S3 сброшена,
  S4 установлена. v1-вход `N6/FBAnd18.AndIn3 = !b_Step4_Set` снят: прототип v2 показал,
  что при FBOr13.OrIn2 он эквивалентен. Мутант FBOr13.OrIn2 убит (`repro/t9.out.txt`,
  E2a и полный E2: при EStop за 2 скана до C2_FBK OFF — S_RnD+S4).
- SR: g4 и g5 разведены уровнем C2_FBK в одном снимке входов. g7 подавляет g4 через
  reset-доминирование. g5 требует SG, а SG и SU взаимоисключены рекогнайзером:
  - RP-1: при SU/SG RELEASE не квалифицируется ⇒ новая зелёная или BOTH невозможны;
  - HLT_LV требует !SU (E2c).
- Гранты разных источников исключены привязкой к источнику.

### 2.4 Порядок исполнения

- **I-ORD-1.** Голова из **14 блоков** (orders 1…14): N3/FBOr2, FBOr1, FBOr16, FBOr13,
  FBOr5, FBOr7, FBOr9, FBRs1, FBRs8, FBRs7, FBRs3, FBRs4, FBRs5, FBRs6. Других
  Set/Reset-путей у RS стадий нет; между ними нет читателей.
- **I-ORD-2.** Производители грантов и их конус по памятям стадий — после головы.
  Переносы:
  - N12/FBAnd15 → сразу после N12/FBDecouple1;
  - N3/FBAnd2 → перед N3/FBAnd1;
  - N2/FBAnd11 → перед N2/FBAnd91;
  - E2b: N6/FBAndSuEmg и N6/FBOrStep4 → между N6/FBAnd2 и N6/FBDecouple1.
- Прочие блоки сохраняют относительный порядок F1; нумерация 1…N без пропусков.
- Переносы SG_OWNER_SET и STATE_SG из v1 **сняты** вместе с M-E2a-15/16 и
  перенесены в E3 (там они нужны для abort).

### 2.5 Декодер статуса (N7 ревью)

Формула статуса (нормативная для E2-01):
```
STS_SAFE = (S1 ∨ S12) ∧ b_EStop_Ok
STS_RND  = SR ∧ b_EStop_Ok
STS_RUN  = S3 ∧ b_EStop_Ok
STS_EMG  = ¬(STS_SAFE ∨ STS_RND ∨ STS_RUN [∨ STS_CFG])
```

В canonical и reference нет ни одного AND/OR с непотреблённым выходом. Нет и Symbol без
потребителя: у всех 85 есть и источник, и потребитель — `reviewer/E2-plan/repro/sym.out.txt`
и проверка архитектора по netlist. Поэтому:

- **Основной вариант (D2-A):** в E2 декодер в SAL **не строится**. STS — функция
  наблюдаемых Symbols `b_Step1/12/_RnD/3` и `b_EStop_Ok`, которую тестировщик
  вычисляет в каждом скане (E2-01, E2-04). Блоки декодера (5 FB, в E4 +1 для CFG)
  появляются в E4 вместе с публикацией в PLC: потребителем станет DECOUPLE с
  alias-выходами, то есть native-обычная конструкция.
  Мутации декодера (DEC_*) — в плане E4.
- **Альтернатива (D2-B)** на случай, если ведущий требует декодер в SAL уже в E2:
  5 FB и 4 Symbols `STS_*` без потребителя. Их native-допустимость — **NV для G2**:
  проверить native save/CRC/Verify. При отказе — откат к D2-A, без подмены
  фиктивным потребителем.

### 2.6 Инварианты

- **INV-1 (≤1 стадия).**
  - Гранты, читаемые блоком k+1, вычислены после блока k из X(k).
  - Каждый грант ⇒ его источник ∈ X(k). Для g7 через SU: SU(k−1) ⇒ SR(k−1). Значит
    после блока k либо SR, либо S3 (из SR уходят только g4/g5; g5 исключён SG/SU).
    Reset обеих содержит g7.
  - Арбитраж 2.3 исключает два гранта.
  - Без гранта RS не меняются. Грант s→t ⇒ X(k+1)={t}.
  - База: старт группы, все RS = 0.
- **INV-2.** Пустое X — только до первого g1 (сброс без установки невозможен).
  g1 требует `b_EStop_Ok`, а значит Restart (EST-4). Q-RC-10=А совпадает с этим по
  построению.
- **INV-3.** Ровно один статус по формуле 2.5 при INV-1.
- **INV-4.** Читатели видят снимок до или после головы, смеси нет.
- **INV-5.** Исключение обеспечивается привязкой и арбитражем, без детектора.
  E2-03 — структурное доказательство.

Прототип v2 (`repro/proto.mjs`: R1 смоделирован удалением/деактивацией, плюс E2a…E2d,
226 FB в модели при декодере D2-B; canonical не меняется). Результаты:
- `repro/t6.out.txt`, `t7.out.txt`, `t8.out.txt`, `t4.out.txt`, `t5.out.txt`:
  0 нарушений «≤1 стадия / ровно 1 статус» во всех сценариях.
- Сценарии ревьюера `su_cover` и `rnd_cover` дают требуемое:
  - StartingRun + крышка или EStop → S4…S6, энергия снята (STO, C2, C1 OFF);
  - R&D при открытой крышке + зелёная → Safe;
  - начатый R&D→Safe + открытие крышки → Safe;
  - R&D, крышка открыта, BOTH удерживается, крышка восстановлена → SU не ставится;
    новый жест после отпускания → Run.

## 3. Срезы и точные изменения

Порядок: **R1 → E2a → E2b → E2c → E2d → (E3 → EX → E4 → E5 → E6)**.

### R1 — удаление неиспользуемой логики (разрешено Q-ARCH-06=А при условиях)

**Трасса reference Network5 → v2** (исходная power-on последовательность Safe→Step2→Run):

| Действие reference (N2/N5/N3) | Где в v2 / чем снято |
|---|---|
| Запуск: N2/FBTon3 (зелёная 2 с) ∧ ReadyForStep2 → b_Step2_Set | Снят до этого плана: в v2 N2/FBTon3 нет, b_Step2_Set перенесён на Network4 без источника. Вход теперь — BOTH-жест рекогнайзера (решения по кнопкам) |
| Step2: C1 и C2 ON одновременно (N5/FBDecouple1) | Разделено: C1 — Safe→R&D (N11/FBAnd1 `b_Set_LV_C1_1`), C2 — R&D→Run (N12/FBAnd4 `b_Set_HV_C2_1`) — сохранено по частям |
| TON 0,1 с → C1_FBK ∧ C2_FBK (N5/FBTon1, FBAnd2) | N11/FBTon1 0,1 с ∧ C1_FBK; N12/FBTon3 0,1 с ∧ C2_FBK — сохранено |
| **TON 5 с выдержки после FBK** (N5/FBTon2) | **В v2 отсутствует** (до этого плана): R&D и Run подтверждаются сразу после 0,1 с. → Q-ARCH-09 |
| Healthy LV ∧ HV, сырое FALSE (N5/FBAnd3) | N11/FBAnd4 (LV; после D-ARCH-POL — инверсия), N12/FBAnd6 (HV, инверсия) — сохранено |
| Сброс запросов LV/HV discharge (N5/FBDecouple2) | N11/FBAnd4 `b_Reset_LV_Discharge_Req2`; N12/FBAnd6 `b_Reset_HV_Discharg_Req2` — сохранено |
| TON 0,2 с → Set STO (N5/FBTon3, FBDecouple3) | Заменено решением D-STO-LAUNCH: STO снимается при принятии (recRndC_SU) и подтверждается `b_Set_STO_DR*_2` |
| **TON 0,2 с ∧ STO_FBK обоих → Step3** (N5/FBTon4, FBAnd5) | **В v2 нет проверки STO FBK перед Run** (N12/FBAnd6 → g4). D-STO-LAUNCH сохраняет «дальнейшие подтверждения Run». → Q-ARCH-09 |
| Step2 ∧ !EStopOk → Safe (N5/FBAnd7) | В v2 отключено намеренно (Q-MU06-02). Аварийное снятие энергии в R&D → Q-ARCH-01 |
| Сброс `out_TransitionStep` в Step2 (N5/FBAnd10) | N6/FBAnd19 (Run), N11/FBDecouple1 (R&D) — сохранено |
| Step2 → Safe по Step6 (N9/FBAnd1, с инверсией in_False) | В v2 отключено намеренно (Q-MU06-02). Выход из Step6 → срез EX |

Вывод: R1 не удаляет ни одного действия, которое v2 исполняет. Два пробела
(выдержка 5 с, STO FBK перед Run) существуют в F1 и не закрываются сохранением
Network5, потому что её вход отсоединён. Это вопрос Q-ARCH-09, а не R1.

**Доказательство неиспользуемости (для ревьюера):**
1. Единственный Set стадии Step2: N3/FBRs2.Set ← N3/FBOr4.OrIn1 ← Symbol `b_Step2_Set`.
   Его единственный источник в SGVL — Network4/FBDecouple1.DecOut7.
2. Network4/FBDecouple1 не имеет источника ни на одном из DecIn1…DecIn8. Конфигурация
   портов одинакова (filter=2, без channelInterface), сеть названа `Network4ToBeDeleted`.
   Выходы DecOut1…DecOut6 — те же, что в reference (b_Step3/4/5/6_Reset, b_Step1_Reset,
   b_Step1_Set). Если бы DecOut5 = `b_Step1_Reset` был TRUE, FBRs1 (reset-dominant)
   никогда не установился бы ни в reference, ни в v2, и исходная работающая система
   не вышла бы из старта. Следовательно, выход несвязанного входа DECOUPLE — FALSE,
   и DecOut7 при идентичной конфигурации — тоже FALSE.
   (Значение DEC-3 — NV; аргумент DERIVED.)
3. Значит FBRs2 ≡ 0, и каждый блок Network5 выдаёт константу FALSE, кроме двух:
   - N5/FBOr2 и N5/FBDecouple4 следуют `b_Step12_Set`, но их единственный потребитель —
     Reset FBRs2 (≡0) через FBOr3;
   - все TON Network5 никогда не стартуют.
4. N9/FBAnd1 = Step6 ∧ in_False (без инверсии) ≡ 0 (Q-MU06-01).
   N12/FBAnd14.AndIn4 = in_False (без инверсии) ⇒ ≡ 0. N12/FBAnd12/13 питают только FBAnd14.
5. Дубликаты — та же булева функция в той же межцикловой позиции (подтверждено ревью):
   - N1/FBAnd3 ≡ FBAnd2, FBAnd9 ≡ FBAnd10, FBAnd11 ≡ FBAnd12;
   - N6/FBAnd10 ≡ N2/FBAnd9: N6/FBAnd9 (ord 88) читает `out_EStop_Status`, который пишет
     ord 107 — предыдущий скан, как и удалённый FBAnd10 (ord 89).
6. `out_Step2` остаётся константой FALSE: N3/FBDecouple2.DecIn2 := `in_False_SI2_CH8`
   (Q-MU06-01: константа FALSE).
7. Условие Вадима: полный регресс до/после без новых расхождений по alias-выходам и
   памятям стадий (кроме удалённой `b_Step2`). Плюс структурная проверка: у удалённых
   выходов нет иных потребителей.

**Изменения R1** (как в v1, без изменений):
- Удалить 27 FB:
  - Network5 целиком (15);
  - N3/FBRs2, FBOr3, FBOr4;
  - N4/FBDecouple1; N9/FBAnd1;
  - N12/FBAnd12, FBAnd13, FBAnd14;
  - N1/FBAnd3, FBAnd9, FBAnd11; N6/FBAnd10.
- Перепривязать:
  - N3/FBDecouple2.DecIn2 := `in_False_SI2_CH8`;
  - N1/FBAnd2 → N1/FBOr12.OrIn2;
  - N6/FBAnd9.AndIn1 := `out_EStop_Status`.
- Деактивировать порты, потерявшие источник (полный список — PLAN.json R1.deactivate).
- Удалить 19 Symbols SGVL.
- Итог: 215 FB / 1832 портов / 66 Symbols / 75 SAL-переменных. Удаление Symbols объявлено
  для G2 (правило «CRC после потери символов не принимать» применяется к *необъявленной*
  потере).

### E2a — кольцо, гонка, полярность и переименование (EMG-012, MOD-006, STP-004, MOD-001)

1. Изменения 1…11 из v1 (кольцо, RUN_DOWN_RESET.OrIn1 := g6, N7/FBAnd8.AndIn5,
   удаление N3/FBOr6 и N3/FBOr11). Два отличия от v1:
   - вместо `N6/FBAnd18.AndIn3` — `N3/FBOr13.OrIn2 := b_Step4_Set`;
   - `N6/FBAnd18.AndIn4` = wire N6/FBAnd1 сохраняется.
   Перечень — PLAN.json E2a.changes.
2. **Без** v1-п.12 (SG_OWNER_SET.AndIn3, GATE_020.AndIn6 = !SG) — оба эквивалентны
   по RP-1. Первое переносится в E3.
3. N6/HEALTHY_OK (AND: `in_LV_Faulty_FBK` NO, `in_HV_Faulty_FBK` NO) и N6/HEALTH_GUARD
   (OR: wire RUN_DOWN_OWNER, wire HEALTHY_OK) → N6/FBAnd9.AndIn6; AndIn7 деактивировать.
4. **D-ARCH-POL (N2 ревью):** N11/FBAnd4.AndIn3 контакт NC → **NO**.
5. **D-ARCH-POL-RENAME:** SAL `<variable name>`:
   - `in_LV_Healthy_FBK` → `in_LV_Faulty_FBK` (Id a75a2b7d…, alias sdsId 61 ch 7 — не меняется);
   - `in_HV_Healthy_FBK` → `in_HV_Faulty_FBK`.

   Затронутые места:
   - SAL: только два атрибута `name` (в TwinSafeGroup1.sal по 1 вхождению на имя;
     все потребители ссылаются по Id/moniker);
   - SGVL: 0 вхождений; diagram: 0 вхождений;
   - `.sds` alias, tsproj, PLC MAIN.TcPOU (`LV_Healthy` и т.п.) — **не трогаются**:
     это имена каналов/PLC, а не программный символ;
   - alias-выходы `outPLC_LV_Healthy`/`outPLC_HV_Healthy` — не меняются (переименование
     для PLC — E4 по v1.4).

   Тесты и стенд (владельцы — v2-tester, v2-stand-engineer):
   - src/: `candidate-button-cover.js`, `current-code-checks.js`,
     `current-gesture-boundaries.js`, `physical-rnd-source.js`;
   - test/: `current-e2a-race.test.js`, `current-e2a-status.test.js`,
     `current-early-sto.test.js`, `sal-button-baseline.test.js`,
     `sal-cover-baseline.test.js`, `sal-emergency-chain.test.js`,
     `sal-rnd-safe-outputs.test.js`, `sal-rundown-baseline.test.js`,
     `sal-rundown-outputs.test.js`;
   - test/helpers/: `e2-lifecycle.js`, `full-program-source.js`, `rnd-down-source.js`,
     `safe-run-source.js`;
   - также `stand/E0-stand/undefined-inputs-registry.json`, если там есть имя.

   Исторические JSON/MD-отчёты и fixtures старых SHA сохраняют старое имя: это история,
   их не переписывать. Фикстуры с сырым TRUE для входа в R&D меняют значение на FALSE.
6. Порядок: голова 14 блоков (2.4), переносы I-ORD-2; HEALTHY_OK и HEALTH_GUARD — перед N6/FBAnd9.
7. Декодер — D2-A, в SAL не строится.

Ресурсы: +2 (HEALTHY_OK, HEALTH_GUARD) −2 (FBOr6, FBOr11) = 0 → **215 FB**, 1832 портов,
66 Symbols, 75 SAL-переменных (2 переименованы). При D2-B: +5 FB, +45 портов, +4 Symbols.

### E2b — крышка по Q-RC-01/Q-RC-03, connector после Safe (EMG-002, EMG-004, CVR-006)

Точки, которые меняются (N3 ревью):

| Точка | Сейчас | После E2b |
|---|---|---|
| Причина в канал FBEstop1 | — | N1/FBAnd1.AndIn3 := wire N1/FBOrIlRunOk |
| N1/FBAndNotRunSu (новый AND) | — | `b_Step3` NO ∧ `recRndC_SU` NO |
| N1/FBOrIlRunOk (новый OR) | — | wire FBAndNotRunSu ∨ `linkCoverClosed` ∨ `linkRunDownOwner` |
| N12/FBAnd16.AndOut | wire на FBAnd4 | + SAL-переменная `linkCoverClosed` |
| N6/RUN_DOWN_OWNER.RsOut | wire на FBOr5 | + SAL-переменная `linkRunDownOwner` |
| N6/FBAnd9.AndIn2/AndIn3 (крышка → g7) | IL1, IL2 | деактивировать; крышка переходит в N6/HEALTHY_OK.AndIn3 := `linkCoverClosed` ⇒ HEALTH_GUARD = owner ∨ (Healthy ∧ крышка) |
| RUN_DOWN_RESET.OrIn3 (!linkRndGatePermit ∋ крышка) | крышка сбрасывает owner | после E2d крышки в permit нет ⇒ спуск не обрывается (b1) |
| g7 из StartingRun | нет | N6/FBAndSuEmg (AND: `recRndC_SU` NC, `b_EStop_Ok` NO, `in_False` NO), N6/FBOrStep4 (OR: wire FBAnd2, wire FBAndSuEmg) → N6/FBDecouple1.DecIn1 |
| SR Reset | g4, g5, g7 (с E2a) | без изменений — g7 из SR сбрасывает SR тем же входом |
| EMG-004 | connector в R&D/Run не защёлкивает Emergency | N1/FBAnd1.AndIn4 := `linkSafeConnectorScope` (= Step1 ∨ оба connector) |

Поведение по построению:
- Устойчивый Run, крышка открыта ⇒ OR=0 ⇒ защёлка FBEstop1 (тот же канал EStopIn3 и те же
  Set permits, что у `in_Estop_PLC`) и g7 через FBAnd9 (HEALTH_GUARD=0) ⇒ EMGREF.
  Отличие только в `out_EStop_Status` — статусе причины.
- Принятый Run→R&D (owner=1) ⇒ OR=1 и HEALTH_GUARD=1 ⇒ спуск продолжается (b1).
- Safe→R&D (S12) и R&D→Safe (SG): `FBAndNotRunSu`=1 ⇒ нет причины (b1).
- StartingRun (SU=1, читается в предыдущем скане, т.к. STATE_SU исполняется позже) ⇒
  защёлка ⇒ `b_EStop_Ok`=0 ⇒ FBAndSuEmg ⇒ g7 из SR ⇒ S4…S6, вся энергия снята (Q-RC-03a
  «как в Run»). EStop в StartingRun — тот же путь. Прототип `t7.out.txt`: S6, C1/C2 OFF,
  STO активен. Как и в Run, в цепи Step4 момент снят до 7 с (2 с + 5 с) — это свойство
  существующей аварийной цепи.
- Connector после Safe ⇒ защёлка. В Run — дополнительно g7 через FBAnd9.AndIn4/5.
  В R&D энергия LV остаётся (Q-ARCH-01).
- Restart возможен, когда причина ушла (вне Run/SU для крышки, connector вернулся).
  Выход из S6 — EX.
- Порядок: N12/FBAnd16, FBAndNotRunSu, FBOrIlRunOk — перед N1/FBAnd1; FBAndSuEmg,
  FBOrStep4 — между N6/FBAnd2 и N6/FBDecouple1.

Ресурсы: +4 → **219 FB**, +36 портов → 1868, SAL-переменные +2 → 77.
EMG-004 добавлен как источник Emergency по EMG6-01/V14-Q19 («как в любом состоянии»).
Аналитику — подтвердить, что EMG-004 READY в этой трактовке; Safe не затрагивается (EMG-003).

### E2c — HLT-01/02

1. SafeResumption/HLT_LV (AND: `in_LV_Faulty_FBK` NC, `recRndC_SU` NO, `in_False` NO) →
   `linkHltLvLost`.
2. RndPhysicalCompact/GATE_SG_SET (OR: `linkSafeSgOwnerSet`, `linkHltLvLost`);
   STATE_SG.Set := wire.
3. Порядок: HLT_LV, GATE_SG_SET — непосредственно перед STATE_SG.

Работа при открытой крышке обеспечивается E2d (permit без крышки). Изоляция: HLT_LV.AndIn2
(StartingRun) — Q-ARCH-03, не oracle.
Ресурсы: +2 → **221 FB**, 1886 портов, SAL-переменные 78.

### E2d — крышка в Safe/R&D (IL-01/02, V14-Q7, V14-Q21a, Q-RC-03b1)

Общий permit GATE_001 больше **не содержит крышку**; крышка остаётся только в UP-части
R&D→Run.
1. RndPhysicalCompact/GATE_001.AndIn5, AndIn6 — деактивировать. Последствия:
   - в R&D при открытой крышке квалифицируются зелёная и синяя;
   - SG/SU не сбрасываются крышкой (scope = permit ∧ SR);
   - RUN_DOWN_RESET.OrIn3 не реагирует на крышку.
2. RndPhysicalCompact/GATE_020.AndIn6 := `linkCoverClosed` (NC) — R&D→Run только при
   закрытой крышке (CVR-004).
3. RndPhysicalCompact/GATE_030.OrIn5 := wire BOTH.TonOut — квалифицированный BOTH
   «потребляет» попытку (защёлка C) и тогда, когда он отклонён крышкой. Удержание после
   восстановления крышки не исполняется, нужен новый жест после отпускания (IL-02).
4. N1/FBAndLvCurrentPermit.AndIn4/AndIn5 — деактивировать (LV при открытой крышке, V14-Q7).
5. N2/FBAnd1.AndIn5/AndIn6 — деактивировать (ReadyForStep2 и Safe-сброс STO не зависят от крышки).
6. **Новые входы** ради сохранения поведения F1 (в canonical их нет; запрет шёл через
   FBAndLvCurrentPermit и GATE_001):
   - N1/FBAnd4.AndIn3 := `in_InterLock_NC_1`, AndIn4 := `in_InterLock_NC_2` — legacy Bypass
     не включает C1/C2 при открытой крышке (CFG-02);
   - RndPhysicalCompact/GATE_010.AndIn3/AndIn4 := NC1/NC2 — синяя (Unlock) при открытой
     крышке остаётся запрещённой во всех стадиях, как в F1 (в reference запрета нет — Q-ARCH-04).

Зависимость: E2d требует `linkCoverClosed` из E2b.
Ресурсы: 0 FB → **221 FB**, порты 1886.
Источники снятия STO/включения HV проверены: recRndC_SU ставится только через GATE_020
(крышка), N12/FBAnd4 ∋ N12/FBAnd16, Bypass ∋ крышка. Отдельные входы крышки в
HvSetPermit/Sto*SetPermit не нужны: они были бы неубиваемыми.

## 4. Эскизы E3…E6 (уточнены по ответам; точные планы — после G4 E2)

**E3 STOP v2** — как v1 (RUN_SS1_TON 2 с, RUN_HEALTH_LOST, RUN_STO_REQ, RUN_STO_PHASE,
RUN_COAST_TON 5 с, N8/FBOrDis, g6 через `b_Reset_HV_C2_2`, удаление N6/FBTon1 и
HEALTH_GUARD, SS1-выходы, OFF-watchdog C1/C2 0,5 с) с поправками:
- Q-RC-09=А: RUN_STO_PHASE защёлкнута ⇒ потеря Healthy после STO ничего не меняет
  (STP-F READY, по построению).
- Q-RC-08: зелёная или CMD вниз во время спуска игнорируются (owner уже установлен,
  новых грантов нет).
- `linkRunDownOwner` в FBOrIlRunOk.OrIn3 заменяется на `linkRunStopActive` = owner ∨
  RUN_STO_PHASE: крышка во время Healthy-спуска (Q-RC-02) — как b1. Аналитику
  подтвердить, что Healthy-спуск — «нормальный спуск» в смысле Q-RC-03(b1).
- **Abort StartingRun зелёной (N6 ревью):** в canonical зелёная в SU не квалифицируется
  (RP-1). Нужны изменения рекогнайзера:
  - RndPhysicalCompact/GATE_008.AndIn4 и GATE_014.AndIn4 (!SU) деактивировать —
    RELEASE и снятие C разрешены в StartingRun;
  - SafeResumption/SG_OWNER_SET.AndIn3 := `recRndC_SU` NO — зелёная в SU ведёт в ABT,
    а не в R&D→Safe (здесь мутация уже убиваема);
  - Network12/FBAnd2.AndIn5 := `recRndC_SU` NO — синяя в StartingRun не даёт Unlock;
  - ABT_SET (AND: `linkRndGreenQualified`, `recRndC_SU`), ABT (RS), ABT_DONE, ABT_RESET,
    SU_RESET — как v1.
- HL_FAULT — Q-ARCH-05.
- Оценка: **+17 FB**, рекогнайзер 0.

**EX** — g10 S6→S1 (+1 AND); аварийное снятие энергии в SR/S12 по Q-ARCH-01 (А/Б: +1…+3).

**E4** (заморожен до решения ведущего): Q-RC-04 = уровни, «≥2 из 4 TRUE» только в
устойчивых Safe/R&D/Run (вход детектора ∧ OR стадий); Q-RC-05: фронт Bypass, разрешения
как у подъёма, игнор при кнопке; декодер (6 FB) и публикация. Оценка **+17 FB**.

**E5:** Q-RC-07 — спуск при SafetyFault разрешён, зелёная квитирует и спускает. +3 FB.

**E6:** Q-RC-06 — откат Config в Safe + SafetyFault. +12…14 FB.

## 5. Бюджет FB (лимит 255)

| После | FB | Порты | Symbols SGVL | SAL-перем. |
|---|---|---|---|---|
| canonical F1 | 242 | 2076 | 85 | 75 |
| R1 | 215 | 1832 | 66 | 75 |
| E2a (D2-A) | 215 | 1832 | 66 | 75 (2 переименованы) |
| E2b | 219 | 1868 | 66 | 77 |
| E2c | 221 | 1886 | 66 | 78 |
| E2d | 221 | 1886 | 66 | 78 |
| (D2-B: декодер в E2) | +5 | +45 | +4 | — |
| E3 (оценка) | ~238 | | | |
| EX | ~239…242 | | | |
| E4 (оценка, с декодером) | ~256…259 | | | |
| E5 / E6 | ~259…262 / ~271…276 | | | |

**Открытый пункт бюджета:** R1 + E2 помещаются с запасом (221). При запрете R2 и слияния
HL/SafetyFault (решение Вадима) лимит 255 исчерпывается уже на E4 (оценка 256…259), а E6
не помещается (~271…276). До E4 нужен новый источник экономии — решение ведущего/Вадима.
Варианты:
- (а) R2;
- (б) замена защёлки `out_TransitionStep` статусом декодера (−4);
- (в) отказ от отдельного HL_FAULT (Q-ARCH-05);
- (г) иные упрощения E4.

## 6. Native-ограничения

- Межсетевые связи — только Symbols и SAL-переменные (`linkCoverClosed`,
  `linkRunDownOwner`, `linkHltLvLost`); новые wire — только внутри сети, один на пару портов.
- AND-3: новые блоки не используют Standard-In.
- Новых таймеров в E2 нет; значения существующих не меняются.
- E2 не трогает alias, mappings, group, target, FBEstop1 (только входы программного
  N1/FBAnd1.AndIn3/4).
- D2-B (если выбран): Symbols без потребителя — NV для G2.

## 7. Конфигурация E4 (перечень, без правки) и перекоммутация

Как v1 §7. Физическая перекоммутация не требуется.

## 8. Разрешённые редактору файлы

R1 и E2a…E2d: `TwinSafeGroup1.sal`, `TwinSafeGroup1.sal.diagram`, `GVL1.sgvl` в
изолированном worktree редактора, по отдельному кандидату на срез.
Всё прочее запрещено (см. PLAN.json `forbidden`).

## 9. Мутации и MU11

Файлы:
- `MUTATION_PLAN_E2a.json`, `MUTATION_PLAN_E2b.json`, `MUTATION_PLAN_E2c.json`,
  `MUTATION_PLAN_E2d.json` (v2);
- `MUTATION_PLAN_E4.decoder.json` (DEC_*, в т.ч. добавленные по N6: DEC_RUN.AndIn2,
  DEC_EMG.AndIn1/3, DEC_SAFE_OR.OrIn1) — применяется в E4 или в E2a при D2-B;
- `MUTATION_PLAN_E3.draft.json`.

Модельно убиты в прототипе v2 (`repro/t8.out.txt`, `t4`, `t5`):
- FBOrIlRunOk.OrIn3, FBAndNotRunSu.AndIn2, FBAndSuEmg.AndIn1, FBOrStep4.OrIn2, FBOr13.OrIn2;
- HEALTHY_OK.AndIn3, HEALTHY_OK.AndIn2 (инверсия);
- GATE_030.OrIn5, GATE_020.AndIn6, N1/FBAnd1.AndIn4;
- HEALTH_GUARD.OrIn1, RUN_DOWN_RESET.OrIn1;
- N3/FBOr13.OrIn2 (`t9.out.txt`).

Примечания к выводам прототипа:
- Строка `t5.out.txt` «mut FBAnd18.AndIn3» в v2 — пустая мутация (вход больше не
  активируется), осталась для сравнения с v1.
- Сценарий `t6.out.txt` #4 из-за модели фидбэка C2 уходит в Run, а не в StartingRun.
  Сценарий StartingRun корректно покрыт `t7.out.txt`.

DEC_RUN.AndIn2 счётчиком «ровно один» не убивается: при EStop в Run статус «один»
(RUN), но неверный. Убивающий oracle — «STS_EMG со скана падения b_EStop_Ok»
(приоритет Emergency, E2-01/SPEC §13) — указан в плане E4.decoder.

**MU11 (RUN_DOWN_RESET.OrIn2 = b_Step4_Set) — эквивалентен в E2a…E2d по построению;
условие C3 ревью E1 исполняется доказательством эквивалентности:**

Пусть owner=1 (⇒ S3), и в скане k+1 сработал g7. Причины g7 при owner=1:
- S3-ветка (N6/FBAnd2 = S3 ∧ !FBAnd9). Входы FBAnd9: `out_EStop_Status` (ES1, ES2,
  in_Estop_PLC, Mentee — читается из предыдущего скана) и LV/HV connector (сырые).
  Healthy и крышка при owner=1 замаскированы (HEALTH_GUARD = owner ∨ …).
  FBAnd2 (ord 53) читает FBAnd9 (ord 88) предыдущего скана ⇒ причина, видимая
  во входах в скане k, даёт g7 не раньше k+1.
- Те же причины в скане k уже обнуляют `linkRndGatePermit` (GATE_001):
  - ES1/ES2/Mentee/PLC — через `b_Estop_Ok` (FBEstop1 ord 24 < GATE_001) и сырой
    `in_Estop_PLC` (AndIn1);
  - connector — через CONNECTOR_SCOPE (Step1=0 в Run, сырые входы, тот же скан).
  RUN_DOWN_RESET.OrIn3 (!permit) в скане k сбрасывает owner (RS ord 239 после GATE_001).
- SU-ветка (FBAndSuEmg): требует SU ⇒ SR, а owner ⇒ S3 ⇒ одновременно невозможно.
- E2b: крышка при owner=1 причиной g7 не является.

Итог: в любом скане с g7=1 owner уже 0 или OrIn3=1 ⇒ OrIn2 никогда не решающий ⇒
мутант неотличим. Пределы: GRP-2 (DERIVED), одинаковая позиция чтения. После E3 (owner
и STO_PHASE, Q-RC-03b1) переоценить: в E3 permit по-прежнему без крышки, причины те же.

Эквивалентны по доказательству (не в знаменателе):
- M-E2a-15/16 v1 — сняты (RP-1);
- N7/FBAnd8.AndIn5, N6/FBAnd18.AndIn4 (принято ревью);
- MU06, MU10 — MU10 теперь убит как M-E2a-08 (OrIn1 переназначен).

Оператора `swap-order` в `src/sal-mutations.js` нет — такие мутации помечены
`operatorAvailable:false` (NV до инженера стенда).

## 10. Вопросы

- **Q-ARCH-01 (уточнён, N5).** Исходно:
  - (1) устойчивый R&D (C1 ON, C2 OFF, STO активен), в том числе идущий R&D→Safe;
  - (2) принят Safe→R&D: C1 включается или включён, R&D не подтверждён.

  Событие: in_ES_NC_1/2 FALSE, in_Estop_PLC TRUE, Mentee или потеря LV/HV connector.

  Сейчас: стадия сохраняется, LV остаётся включённым (в (2) продолжает подниматься),
  статус Emergency. После Restart зелёной система возвращается в R&D (или завершает
  Safe→R&D), а не в Safe — это расходится с EMG6-01.

  Не хватает: какой последовательностью снимать LV в Emergency и куда выходить.
  - (А) общая аварийная цепь, как в Run и StartingRun: C3/BMS OFF и LV discharge сразу,
    C1 OFF через 2 с, далее ветка STO/HV discharge/C2 OFF; выход только в Safe по Restart;
  - (Б) последовательность R&D→Safe (C1 OFF, C3/BMS OFF, LV discharge, ожидание C1_FBK
    OFF); выход только в Safe по Restart;
  - (В) как сейчас.

  StartingRun закрыт ответом Q-RC-03(a) и реализован в E2b.
- **Q-ARCH-03.** Исходно StartingRun. Событие: LV Healthy потерян. Не хватает:
  игнорировать, прервать запуск или прервать и затем R&D→Safe?
- **Q-ARCH-04.** Исходно Safe, крышка открыта. Событие: синяя ≥ 500 мс. F1 запрещает
  Unlock, reference разрешал. Не хватает: разрешён или запрещён?
- **Q-ARCH-05.** Исходно устойчивый Run без запроса вниз. Событие: потеря Healthy
  (спуск по Q-RC-02). Не хватает: фиксировать fault HealthyLost, как при SS1, или нет?
- **Q-ARCH-08 (E4).** Исходно Safe, крышка закрыта. Событие: в одном скане квалифицирован
  BOTH и поднят фронт Bypass. Не хватает: что выполняется?
- **Q-ARCH-09 (новый, из трассы R1).** Исходно R&D, принят R&D→Run, C2_FBK ON, HV
  исправен. В reference Run ставился только после выдержки 5 с от FBK и подтверждения
  STO FBK обоих приводов (+0,2 с). В v2 Run ставится через 0,1 с после C2_FBK, без
  выдержки 5 с и без проверки STO FBK; для Safe→R&D тоже нет 5 с. Не хватает:
  восстанавливать ли выдержку 5 с и проверку STO FBK как «дальнейшие подтверждения Run»
  (D-STO-LAUNCH, MOD-002) — да или нет?
- Аналитику:
  - EMG-004 как источник Emergency вне Safe (реализован в E2b);
  - Healthy-спуск как «нормальный спуск» для Q-RC-03(b1) (E3);
  - судьба текста E2-02 «обязан убить MU11» — C3 исполняется доказательством §9.
