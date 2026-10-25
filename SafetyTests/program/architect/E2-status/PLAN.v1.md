# E2-status — единый механизм присвоения статусов и дорожная карта срезов E2…E6

Роль: v2-architect. Дата: 2026-10-21. Canonical не менялся; запись только в
`SafetyTests/program/architect/E2-status/`.

## 0. Источник и входы

| Объект | SHA256 | Сверка |
|---|---|---|
| canonical SAL (F1) | `04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3` | = TRACE_MATRIX.baseline.canonical.sal |
| canonical SGVL | `dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104` | = матрица |
| canonical diagram | `de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603` | = матрица |
| SCENARIO_DECISIONS.md (прочитан после Q-RC-01/Q-RC-02) | `ab1be3652a304fb29c2e41ac0c927cbdf1ba5fccb0b6860426e38dd35f4edd66` | — |
| reference | 4495a1f, только `git show` в scratch | — |

Критерии: `program/analyst/REQ-CONSOLIDATION/CRITERIA.md` (E2-01…04, STP-A…G,
IL-*, CFG-*, PLC-*, HB-*, WDG-*, HLT-*, EMG6-*), QUESTIONS Q-RC-01…13,
SCOPE_PROPOSAL §3. Учтены ответы Вадима, поступившие во время работы:
**Q-RC-01 = В (потеря InterLock NC1/NC2 в устойчивом Run → Emergency, как EStop)**
и **Q-RC-02 = А (потеря Healthy в устойчивом Run → защитный спуск в R&D с
немедленным STO; LV — затем R&D→Safe)**.

Netlist canonical (порядок, контакты, Symbols) выгружен `repro/dump.mjs`.
Native-семантика — по `program/stand/FB_SEMANTICS.md`: AND/OR/RS/TON/DECOUPLE/ESTOP
DOC, межцикловая видимость (GRP-2) DERIVED; новых типов FB план не вводит.
Ресурсы canonical: **242 FB** (AND 115, OR 51, RS 28, TON 19, DECOUPLE 27, ESTOP 2),
**2076 портов** (AND/OR 9, RS 3, TON 2, DECOUPLE 16, ESTOP 14 — число портов
определяется типом FB), **85 Symbols SGVL**, 75 SAL-переменных, 307 wiredLink.

## 1. Что найдено в canonical (основание проекта)

1. **Нет механизма статуса.** Восемь RS-памятей Network3 (`b_Step1/2/3/4/5/6/12/_RnD`)
   разбросаны по порядку исполнения (20, 23, 48, 64, 74, 84, 172, 174); Reset
   многих из них — *память* другой стадии предыдущего скана (FBOr1←Step12/RnD,
   FBOr5←Step4, FBOr7←Step5, FBOr9←Step6). Поэтому любая передача стадии даёт
   скан с двумя стадиями (Step3∧Step4, Step1∧Step12) — подтверждает находку E1.
2. **Гонка E1** (Step4∧Step12) — следствие (1) плюс того, что N6/FBAnd18
   (`b_Step12_Set_2`) не зависит от фазы, а завершение Run-down идёт через
   стадию Safe→R&D (`Step12`) — фаза маскируется под чужой переход.
3. **Emergency не является стадией**: это `!b_EStop_Ok` (FBEstop1). В R&D/Step12
   при EStop стадия сохраняется, LV остаётся включённым, после Restart система
   возвращается в R&D (EMERGENCY_PHASE_REPORT; проверено). Цепь Step4/5/6
   существует только из Run; Step6 — тупик (N9 отключён намеренно, Q-MU06-02).
4. **Полярность LV Healthy противоречива**: reference и v2 Network5/6/7 читают
   `!in_*_Healthy_FBK` (сырое FALSE = исправно), а v2 Network11/FBAnd4.AndIn3
   (вход в R&D) требует сырое TRUE. Прогон canonical: при сыром FALSE Safe→R&D
   застревает в Step12; при TRUE R&D достигается, но устойчивый Run затем
   невозможен (N6/FBAnd9 ждёт FALSE). Тестовые фикстуры (`physical-rnd-source`)
   выставляют TRUE.
5. **Мёртвая логика**: Step2 ставится только `b_Step2_Set` из Network4/FBDecouple1
   (вход не подключён, DEC-3 NV) — вся Network5 (15 FB), N3/FBRs2/FBOr3/FBOr4
   недостижимы при единственном допустимом значении N4 (FALSE; иначе исходная
   система не работала бы). N9/FBAnd1 и N12/FBAnd12/13/14 — константа FALSE
   (Q-MU06-01/02). N1/FBAnd3≡FBAnd2, FBAnd9≡FBAnd10, FBAnd11≡FBAnd12,
   N6/FBAnd10≡N2/FBAnd9 — точные дубликаты булевой функции.
6. **Бюджет**: 13 свободных FB до 255; E2…E6 в лоб требуют ~60. Без удаления
   мёртвой логики и рефакторинга fan-out DECOUPLE этапы E5/E6 не помещаются (§5).

## 2. Механизм: кольцо стадий с передачей владения + декодер статуса

### 2.1 Стадии (одна RS на стадию, reset-dominant)

| Стадия | RS | Группа статуса | Дети (под-фазы, RS) |
|---|---|---|---|
| S1 Safe idle | N3/FBRs1 `b_Step1` | SAFE | SAFE_ACCEPTED_UP |
| S12 Safe→R&D | N3/FBRs8 `b_Step12` | SAFE (источник) | (E6: S12_ABORT) |
| SR R&D | N3/FBRs7 `b_Step_RnD` | RND | STATE_SU (StartingRun), STATE_SG (R&D→Safe), (E3: ABT) |
| S3 Run | N3/FBRs3 `b_Step3` | RUN | RUN_DOWN_OWNER, (E3: RUN_STO_PHASE) |
| S4/S5/S6 аварийная цепь | N3/FBRs4/5/6 | EMG | — |
| (E4) SC Config, SCX выход Config | новые RS | CFG | — |
| нет стадии (только старт группы) | — | EMG | — |

Переходная фаза принадлежит ровно одной стадии-источнику (дети сбрасываются,
когда родитель уходит), статус во время перехода — статус источника, как
требует SPEC §6/§7/§8 («State_X устанавливать только после подтверждений»).
Run-down больше не проходит через S12 (устраняет маскировку).

### 2.2 Гранты (g) — единственные Set/Reset стадий

| g | Символ | Переход | Производитель | Привязка к источнику (текущий скан) |
|---|---|---|---|---|
| g1 | wire N3/FBAnd1 | нет стадии → S1 (старт) | N3/FBAnd1 | AND всех `!S*` |
| g2 | `b_Step12_Set` | S1→S12 | N2/FBOr1 | linkSafeAcceptedUp (Reset = !SAFE_UP_SCOPE ∋ S1) / N2/FBAnd91 ∋ N2/FBAnd11(S1) |
| g3 | `b_Step_RnD_Set` | S12→SR | N11/FBAnd5 | TON-вход N11/FBAnd1 = S12 |
| g4 | `b_Step3_Set_2` | SR→S3 | N12/FBDecouple2.DecOut3 | N12/FBAnd1 = SR (через FBAnd4/Ton3/FBAnd6) |
| g5 | `b_Step2_Set_2` | SR→S1 | N12/FBAnd15 | b_Reset_LV_C1_3 ⇐ STATE_SG (Reset !RndScope ∋ SR) |
| g6 | `b_Step12_Set_2` | S3→SR (завершение Run-down) | N6/FBAnd18 | **новый** AndIn4 = N6/FBAnd1 (S3) |
| g7 | `b_Step4_Set` | S3→S4 | N6/FBDecouple1 | N6/FBAnd1 (S3) |
| g8 | `b_Step5_Set` | S4→S5 | N7/FBAnd8 | **новый** AndIn5 = `b_Step4` |
| g9 | `b_Step6_Set` | S5→S6 | N8/FBAnd3 | N8/FBAnd1 (S5) |

Правило Set/Reset: `Set_t = OR(гранты в t)`, `Reset_s ⊇ OR(гранты из s)`; Reset_s
может содержать только гранты, срабатывание которых невозможно при активной s,
и никогда — грант в саму s.

| RS | Set | Reset |
|---|---|---|
| FBRs1 (S1) | N3/FBOr2 = g1 ∨ g5 | N3/FBOr1 = g2 |
| FBRs8 (S12) | `b_Step12_Set` (g2) | `b_Step_RnD_Set` (g3) |
| FBRs7 (SR) | N3/FBOr16 = g3 ∨ g6 | N3/FBOr13 = g5 ∨ g4 |
| FBRs3 (S3) | `b_Step3_Set_2` (g4) | N3/FBOr5 = g6 ∨ g7 |
| FBRs4 (S4) | `b_Step4_Set` (g7) | N3/FBOr7 = g8 |
| FBRs5 (S5) | `b_Step5_Set` (g8) | N3/FBOr9 = g9 |
| FBRs6 (S6) | `b_Step6_Set` (g9) | wire N3/FBOr2 (гранты в S1; выход из S6 появится в срезе EX как вход FBOr2) |

### 2.3 Арбитраж внутри источника

- S3: g6 и g7 — `N6/FBAnd18.AndIn3 = !b_Step4_Set` (Emergency-грант приоритетнее).
- SR: g4 требует `in_HV_C2_FBK`=TRUE (N12/FBAnd6.AndIn2), g5 — FALSE
  (N12/FBAnd15.AndIn5); оба вычисляются после блока стадий в одном скане из
  одного снимка входа. Плюс дети SU и SG взаимоисключены (§2.5).
- S1, S12, S4, S5: один выходной грант (E4/E6 добавят — там арбитраж задаётся).
- Гранты разных источников взаимоисключены привязкой к источнику (стадии one-hot).

### 2.4 Порядок исполнения (обязательные правила)

- **I-ORD-1 (блок стадий):** все RS стадий исполняются подряд, без читателей
  между ними, в самом начале скана (orders 1…), непосредственно им предшествуют
  все их Set/Reset OR. Ни один иной вход RS стадии не берётся вне этих OR.
  Прототип показал необходимость: если хоть один Set-OR (N3/FBOr6) остался вне
  головы, R&D→Run даёт скан «нет стадии» → g1 → S1∧S3 (воспроизведено и исправлено).
- **I-ORD-2 (гранты после блока):** каждый производитель гранта и весь его конус
  по памятям стадий исполняется после блока в том же скане (переносы:
  N12/FBAnd15 → сразу после N12/FBDecouple1; N3/FBAnd2 → перед N3/FBAnd1;
  N2/FBAnd11 → перед N2/FBAnd91; SafeResumption/SG_OWNER_SET и
  RndPhysicalCompact/STATE_SG → сразу после STATE_SU).
- **I-ORD-3:** декодер — сразу после N1/FBEstop1 (читает текущий `b_EStop_Ok`).
- Прочие блоки сохраняют относительный порядок F1; редактор перенумеровывает
  1…N без пропусков (GRP-1).

### 2.5 Дети и запрет двойной фазы

- STATE_SU, STATE_SG ⇒ SR (Reset = !linkSafeRndScope, scope ∋ SR, текущий скан) — как в F1.
- SU∧SG исключены: `SafeResumption/SG_OWNER_SET.AndIn3 = !recRndC_SU` (NO) после
  переноса за STATE_SU; `RndPhysicalCompact/GATE_020.AndIn6 = !recRndC_SG` (NO).
  Следствие до E3: зелёная в StartingRun ничего не делает (сейчас F1 запускает
  R&D→Safe параллельно с запуском — снятие C1 при включаемом C2). Abort по STP-E
  реализует E3. Это промежуточное поведение, не новый oracle.
- RUN_DOWN_OWNER ⇒ S3: `RUN_DOWN_RESET.OrIn1 := b_Step12_Set_2` (g6) вместо
  `b_Step_RnD_Set` (иначе owner переживает возврат в R&D — MU10 становится
  убиваемым, см. мутацию M-E2a-08); OrIn2 = g7, OrIn3 = !permit — без изменений.

### 2.6 Декодер статуса (Network3, новые Symbols SGVL)

```
DEC_SAFE_OR = S1 ∨ S12                       (wire FBRs1, FBRs8)
STS_SAFE = DEC_SAFE_OR ∧ b_EStop_Ok
STS_RND  = SR ∧ b_EStop_Ok
STS_RUN  = S3 ∧ b_EStop_Ok
STS_EMG  = !STS_SAFE ∧ !STS_RND ∧ !STS_RUN    (E4: ∧ !STS_CFG)
```

### 2.7 Инварианты и доказательство по построению

Обозначим X(k) — множество активных стадий после блока скана k.

- **INV-1 (≤1 стадия).** Гранты, читаемые блоком k+1, вычислены после блока k
  (I-ORD-2) из X(k). Каждый g ⇒ его источник ∈ X(k) (таблица 2.2, текущий скан);
  в X(k) не более одной стадии (индукция) ⇒ гранты разных источников не
  совпадают; внутри источника — арбитраж 2.3 ⇒ не более одного гранта. Нет
  гранта ⇒ RS не меняются (иных Set/Reset нет, I-ORD-1). Грант s→t ⇒ Set_t=1,
  Reset_t не содержит его, Reset_s содержит его ⇒ X(k+1)={t}. База: старт группы,
  все RS = 0 (RS-4 DERIVED).
- **INV-2 («ни одной» только до первого g1).** Сброс стадии без установки
  другой невозможен (Reset — только гранты в другие стадии). Значит пустое X —
  только при старте; g1 требует `b_EStop_Ok`, а FBEstop1 после старта требует
  спада Restart (EST-4) ⇒ старт = Emergency до ручного Restart (SPEC §4 `[*]→Emergency`).
  Q-RC-10 по построению сводится к старту: вне старта «ни одного» недостижимо.
- **INV-3 (ровно один статус).** Группы стадий не пересекаются; STS_* (кроме EMG)
  маскированы `b_EStop_Ok`; STS_EMG — дополнение ⇒ ровно один при INV-1.
- **INV-4 (внутрискановая согласованность).** Между RS стадий нет читателей
  (I-ORD-1) ⇒ любой читатель видит либо X(k), либо X(k+1).
- **INV-5 (конфликт → Emergency).** Если гипотетически два гранта в разные стадии
  совпали, каждая цель получает Set и при этом Reset только если грант в неё
  стоит в чужом Reset — по правилу 2.2 этого нет ⇒ две стадии. Поэтому
  исключение обеспечивается привязкой и арбитражем (INV-1), а не детектором;
  E2-03 закрывается структурным доказательством (вариант «по построению» в
  критерии), инъекция `STATE:conflicting-set-requests` к новой структуре
  неприменима (тест инъецирует символы ниже арбитража). Отдельный детектор
  не вводится: он требует ≥7 FB и был бы мутационно неубиваемым.
- **Emergency-приоритет:** STS_EMG подавляет остальные статусы при `!b_EStop_Ok`
  в том же скане; g7 побеждает g6 (2.3); все UP-гранты уже содержат b_EStop_Ok
  (GATE_001, LvCurrentPermit, N1/FBAnd1 → Set permits).

Прототип (`repro/proto.mjs`, модель в памяти, canonical не меняется) E2a+b+c+d:
lifecycle Safe→R&D→Run→green-down→R&D→Safe, EStop в Run, IL в Run — 0 нарушений
«≤1 стадия, ровно 1 статус» по каждому скану; гонка E2-02 (L/H × d=1…5) —
L: R&D затем Safe (HLT-01), H: устойчивый R&D, 0 нарушений; мутант
«HEALTH_GUARD без owner» даёт S4/Emergency — убит.

## 3. Срезы, порядок и точные изменения

Порядок: **R1 → E2a → E2b → E2c → E2d → R2 → E3 → EX → E4 → E5 → E6**.
R1/E2a…E2d специфицированы точно; R2/E3 — на уровне блоков (точная проводка
повторяется в их собственном PLAN после G4 предыдущего среза, т.к. номера
порядков и ID меняются); EX/E4/E5/E6 — эскиз с изоляцией вопросов.

### R1 — удаление мёртвой и дублирующей логики (требуется для E2a)

Цель: убрать из кольца входы с NV-значением (Network4) и недостижимую стадию Step2;
освободить FB. Поведение при допустимых значениях не меняется (доказательство:
каждый удаляемый выход — константа FALSE при in_False=FALSE и N4=FALSE, либо
точная копия булевой функции, читаемая в той же позиции порядка).

Удалить (27 FB):
- Network5 целиком: FBAnd1, FBDecouple1, FBTon1, FBAnd2, FBTon2, FBAnd3,
  FBDecouple2, FBTon3, FBDecouple3, FBAnd5, FBTon4, FBAnd7, FBDecouple4, FBAnd10, FBOr2 (15).
- Network3/FBRs2, FBOr3, FBOr4 (3); Network4/FBDecouple1 (1); Network9/FBAnd1 (1).
- Network12/FBAnd12, FBAnd13, FBAnd14 (3) — Q-MU06-02 разрешил.
- Network1/FBAnd3 (≡FBAnd2), FBAnd9 (≡FBAnd10), FBAnd11 (≡FBAnd12) (3);
  Network6/FBAnd10 (≡N2/FBAnd9) (1).

Перепривязать:
- N3/FBDecouple2.DecIn2 := SAL-переменная `in_False_SI2_CH8` (NC) — `out_Step2`
  остаётся FALSE, как сейчас; alias out_Step2 не трогается.
- N1/FBAnd2 → добавить wire на N1/FBOr12.OrIn2 (вместо FBAnd3); FBAnd2.AndIn3 =
  wire FBAnd10 (было), AndIn2 = FBAnd12 (было).
- N6/FBAnd9.AndIn1 := SAL-переменная `out_EStop_Status` (вместо wire FBAnd10);
  N2/FBAnd9 (ord 107) остаётся после N6/FBAnd9 (ord 88) ⇒ та же межцикловая
  задержка, что у удалённого FBAnd10 (ord 89 > 88).
- Деактивировать порты, терявшие источник: N3/FBOr1.OrIn1, OrIn2; N3/FBOr2.OrIn1,
  OrIn3, OrIn4; N3/FBOr5.OrIn1; N3/FBOr6.OrIn1; N3/FBOr7.OrIn1; N3/FBOr9.OrIn1;
  N3/FBOr11.OrIn1; N3/FBAnd1.AndIn3; в Network1 — только входы удалённых
  символов: N1/FBOr1.OrIn1 `b_Reset_LV_Discharge_Req`, N1/FBOr5.OrIn1
  `b_Reset_HV_Discharg_Req`, N1/FBOr8.OrIn1 `b_Set_STO_DR1`, N1/FBOr10.OrIn1
  `b_Set_STO_DR2`, N1/FBOr14.OrIn1 `b_Reset_Transition_1`, N1/FBOr17.OrIn1
  `b_Set_LV_C1`, N1/FBOr18.OrIn1 `b_Set_HV_C2`); N12/FBOr2.OrIn2.
- Удалить из SGVL 19 Symbols без источника/потребителя: b_Step1_Reset, b_Step1_Set,
  b_Step1_Set_2, b_Step1_Set_3, b_Step2_Set, b_Step2_Reset, b_Step2, b_Step3_Reset,
  b_Step3_Set_3, b_Step4_Reset, b_Step5_Reset, b_Step6_Reset, b_Set_LV_C1,
  b_Set_HV_C2, b_Reset_HV_Discharg_Req, b_Reset_LV_Discharge_Req, b_Set_STO_DR1,
  b_Set_STO_DR2, b_Reset_Transition_1.
- Порядок: удалённые позиции схлопываются, остальное — относительный порядок F1.

Ресурсы: 242→**215 FB**; порты 2076→**1832**; Symbols 85→**66**; SAL-переменные 75
(без изменений, +1 targetUsage у in_False, out_EStop_Status получает targetUsage).
Проверка R1 (G3): дифференциальная — полный регресс F1 до/после без новых
расхождений по alias-выходам и памятям стадий (кроме `b_Step2`, который
удалён и был константой), плюс структурная проверка «удалённые выходы не имели
потребителей». Мутаций guard'ов нет (новых guard'ов нет).

### E2a — кольцо стадий, декодер, гонка (EMG-012, MOD-006, STP-004/E2-02, MU10/MU11)

Критерии: E2-01, E2-02, E2-03 (структурно), MU10/MU11 переоценка.

Изменения (после R1):
1. N3/FBOr1.OrIn3 := Symbol `b_Step12_Set` (было wire/символ `b_Step12` памяти);
   N3/FBOr1.OrIn4 деактивировать (`b_Step_RnD`).
2. N3/FBOr5.OrIn2 := Symbol `b_Step4_Set` (убрать wire FBRs4.RsOut→FBOr5.OrIn2).
3. N3/FBOr7.OrIn2 := `b_Step5_Set` (убрать wire FBRs5→FBOr7).
4. N3/FBOr9.OrIn2 := `b_Step6_Set` (убрать wire FBRs6→FBOr9).
5. Удалить N3/FBOr11; N3/FBRs6.Reset := wire N3/FBOr2.OrOut (убрать wire FBRs1→FBOr11).
6. N3/FBRs8.Set := Symbol `b_Step12_Set` (убрать wire FBOr16→FBRs8.Set).
7. N3/FBOr16.OrIn1 := `b_Step_RnD_Set`, OrIn2 = `b_Step12_Set_2` (как было);
   N3/FBRs7.Set := wire N3/FBOr16.OrOut (вместо Symbol `b_Step_RnD_Set`).
8. Удалить N3/FBOr6; N3/FBRs3.Set := Symbol `b_Step3_Set_2`; N3/FBOr13.OrIn2
   деактивировать (OrIn3 g5, OrIn4 g4 остаются).
9. N6/FBAnd18: AndIn3 := `b_Step4_Set` (NO), AndIn4 := wire N6/FBAnd1.AndOut (NC).
10. N6/RUN_DOWN_RESET.OrIn1 := `b_Step12_Set_2` (было `b_Step_RnD_Set`).
11. N7/FBAnd8.AndIn5 := Symbol `b_Step4` (NC).
12. SafeResumption/SG_OWNER_SET.AndIn3 := `recRndC_SU` (NO);
    RndPhysicalCompact/GATE_020.AndIn6 := `recRndC_SG` (NO).
13. Новые N6/HEALTHY_OK (safeAnd: AndIn1 `in_LV_Healthy_FBK` NO, AndIn2
    `in_HV_Healthy_FBK` NO) и N6/HEALTH_GUARD (safeOr: OrIn1 wire RUN_DOWN_OWNER.RsOut,
    OrIn2 wire HEALTHY_OK); N6/FBAnd9.AndIn6 := wire HEALTH_GUARD, AndIn7
    деактивировать. (Потеря Healthy во время принятого Run-down не запускает Step4 —
    E2-Q1; в устойчивом Run пока остаётся Step4 до E3, где Q-RC-02 заменяет его
    спуском в R&D; см. §4.)
14. Декодер (Network3): DEC_SAFE_OR (safeOr: wire FBRs1, wire FBRs8), DEC_SAFE
    (safeAnd: wire DEC_SAFE_OR, `b_EStop_Ok`) → новый Symbol `STS_SAFE`; DEC_RND
    (wire FBRs7, `b_EStop_Ok`) → `STS_RND`; DEC_RUN (wire FBRs3, `b_EStop_Ok`) →
    `STS_RUN`; DEC_EMG (wire DEC_SAFE NO, DEC_RND NO, DEC_RUN NO) → `STS_EMG`.
15. orderOfExecution: голова 1…13 = N3/FBOr2, FBOr1, FBOr16, FBOr13, FBOr5, FBOr7,
    FBOr9, FBRs1, FBRs8, FBRs7, FBRs3, FBRs4, FBRs5, FBRs6; декодер сразу после
    N1/FBEstop1; переносы I-ORD-2 (§2.4); N6/HEALTHY_OK, HEALTH_GUARD — перед N6/FBAnd9.

Сохраняется из reference: последовательность Step4→5→6 (таймеры N7/N8), Safe
→ отключение контакторов (N2), EStop FBEstop1, все защитные guards энергии.
Намеренные изменения: передача стадий атомарна; Run-down завершается прямо в R&D
(STP-A «R&D со скана после C2_FBK OFF», без повторной LV-проверки через Step12);
потеря Healthy в принятом Run-down не запускает Step4 (E2-Q1).
Задокументированный сдвиг времени: стадии, у которых RS стоял после своего
гранта (S4, S5, S6, SR из S12), меняются на 1 скан позже F1; Run/SS1 при аварии —
в том же скане, что F1; читатели SR/S12 до ord 172 — без изменений. Таймеры не
меняются. Тесты, фиксирующие точный скан q этих событий, — наблюдение q (правило
q−1/q+1), не ослабление oracle.

Ресурсы: +5 (DEC×5) +2 (HEALTHY_OK, HEALTH_GUARD) −2 (FBOr6, FBOr11) = **+5 → 220 FB**;
порты +45 → 1877; Symbols +4 (STS_SAFE/RND/RUN/EMG) → 70; wire −7 +9 (оценка, точное
число — в diff редактора).
Мутации: `MUTATION_PLAN_E2a.json`.

### E2b — потеря InterLock в Run → Emergency (Q-RC-01=В; IL-03b, EMG-002 Run)

1. N12/FBAnd16.AndOut: добавить SAL-переменную `linkCoverClosed` (wire на N12/FBAnd4 сохраняется).
2. Новый Network1/FBOrIlRunOk (safeOr): OrIn1 `b_Step3` (NO), OrIn2 `linkCoverClosed` (NC).
3. N1/FBAnd1.AndIn3 := wire FBOrIlRunOk (NC) — тот же канал EStopIn3 FBEstop1 и
   те же Set permits, что у `in_Estop_PLC` ⇒ реакция совпадает с EMGREF по построению
   (FBEstop1 защёлка + N6/FBAnd9 → g7 → Step4, Run сброшен в том же скане, что при
   in_Estop_PLC). Отличие только в статусе причины `out_EStop_Status` (он отражает
   ES/PLC/Mentee, не крышку) — наблюдение, не реакция.
4. Порядок: N12/FBAnd16 и FBOrIlRunOk — непосредственно перед N1/FBAnd1 (raw IL
   доходит до FBEstop1 через тот же сканный путь, что raw in_Estop_PLC).
Снятие: Restart возможен, когда S3 уже сброшен (вне Run условие выполнено);
выход из S6 — срез EX.
Изоляция Q-RC-03: «Run» = S3, значит потеря крышки во время Run-down (S3 ещё
активна) тоже даёт Emergency; StartingRun (SR∧SU) не охвачен. Точка зависимости —
FBOrIlRunOk.OrIn1. Варианты ответа Q-RC-03: «спуск продолжается» → OrIn1 := S3∧!owner
(+1 AND); «Emergency» → без изменений и добавить вход для SU (+1 OR).
Ресурсы: **+1 → 221**, порты +9, SAL-переменные +1.

### E2c — R&D Healthy (HLT-01/02, E2-Q2) и полярность LV Healthy

Архитектурное решение D-ARCH-POL (делегировано, R0 критериев): сырое FALSE =
Healthy для LV и HV, как в reference (N5/FBAnd3, N6/FBAnd9, N7/FBAnd2) и в
остальном v2; отклонение v2 — только N11/FBAnd4.AndIn3.
1. N11/FBAnd4.AndIn3 контакт NC → **NO** (вход в R&D требует сырое FALSE).
2. Новый SafeResumption/HLT_LV (safeAnd: AndIn1 `in_LV_Healthy_FBK` NC (сырое TRUE =
   потерян), AndIn2 `recRndC_SU` NO, AndIn3 `in_False_SI2_CH8` NO) → SAL-переменная
   `linkHltLvLost`.
3. Новый RndPhysicalCompact/GATE_SG_SET (safeOr: OrIn1 `linkSafeSgOwnerSet`,
   OrIn2 `linkHltLvLost`); STATE_SG.Set := wire GATE_SG_SET.
4. Порядок: HLT_LV, GATE_SG_SET — между SG_OWNER_SET и STATE_SG.
Потеря LV Healthy в устойчивом R&D защёлкивает тот же владелец спуска SG, что
зелёная ⇒ C1 OFF, C3/BMS OFF, LV discharge, ожидание C1_FBK OFF, g5 → Safe;
восстановление Healthy не возвращает R&D (SG защёлка). HV Healthy в R&D не читается.
Изоляция: исключение StartingRun (AndIn2) — зависит от нового вопроса Q-ARCH-03.
Ресурсы: **+2 → 223**, порты +18, SAL-переменные +1.
Последствие: фикстуры, выставляющие `in_LV_Healthy_FBK=TRUE` для входа в R&D,
дадут FAIL регресса — это смена договорённой полярности, не дефект; стенд/тесты
переводятся на сырое FALSE.

### E2d — InterLock в Safe/R&D (IL-01/02, V14-Q7, V14-Q21a)

1. Новый SafeResumption/IL_SCOPE (safeOr: OrIn1 `b_Step1`, OrIn2 `linkCoverClosed`)
   → SAL-переменная `linkIlScope`; RndPhysicalCompact/GATE_001.AndIn5 :=
   `linkIlScope`, AndIn6 деактивировать. В Safe крышка не мешает ни одному жесту;
   в R&D/Run условие крышки в общем permit сохраняется (IL-02: отклонение UP,
   сброс попытки, повтор только новым жестом — как в F1).
2. N1/FBAndLvCurrentPermit.AndIn4/AndIn5 деактивировать (LV при открытой крышке, V14-Q7).
3. N2/FBAnd1.AndIn5/AndIn6 деактивировать (ReadyForStep2 и Safe-сброс STO не зависят от крышки).
4. Сохранить нынешнее: N1/FBAnd4 (Bypass) AndIn3 `in_InterLock_NC_1`, AndIn4
   `in_InterLock_NC_2` (иначе Bypass включил бы C1/C2 при открытой крышке — CFG-02);
   RndPhysicalCompact/GATE_010 (синяя) AndIn3/AndIn4 = NC1/NC2 (сохранение F1:
   Unlock в Safe при открытой крышке сейчас запрещён; reference запрета не имеет —
   вопрос Q-ARCH-04).
HV/STO-разрешения: все источники Set HV/STO (N12/FBAnd4 ∋ N12/FBAnd16; recRndC_SU ⇐
permit R&D ∋ крышка; Bypass ∋ крышка) содержат крышку ⇒ отдельные входы IL в
FBAndHvSetPermit/Sto*SetPermit не добавляются (были бы неубиваемыми).
Ресурсы: **+1 → 224**, порты +9, SAL-переменные +1.

### R2 — рефакторинг fan-out DECOUPLE (ресурс, нужен до E5/E6)

DECOUPLE, переименовывающие один сигнал в несколько Symbols, заменяются чтением
одного Symbol всеми потребителями (DEC-1 тождество; позиция чтения сохраняется
или доказывается равная межцикловая задержка): N2/FBDecouple1, N2/FBDecouple3,
N2/FBDecouple5, N6/FBDecouple1, N6/FBDecouple3, N11/FBDecouple1, N12/FBDecouple1,
N12/FBDecouple2, N12/FBDecouple3, N7/FBDecouple1; N1/FBOr12/FBOr13 → каналы 2/3
N3/FBDecouple1 (out_SS1_DR1/DR2; источник `b_SS1_Permit` = N1/FBAnd2). Оценка
**−12 FB** (224→~212). Требует отдельного согласования ведущего/Вадима
(меняет native-структуру без функциональной цели) — вопрос Q-ARCH-06.

### E3 — STOP v2 (STP-A/B/C/D/E, STP-G по Q-RC-02, EMG-008/009/010)

Блоки (Network6, если не указано иное):
- RUN_SS1_TON (TON 2 с; вход RUN_DOWN_OWNER) — значение 2 с утверждено (SS1).
- RUN_HEALTH_LOST (AND: N6/FBAnd1, !HEALTHY_OK) — Q-RC-02/STP-D, Healthy в Run и в SS1.
- RUN_STO_REQ (OR: RUN_SS1_TON, RUN_HEALTH_LOST).
- RUN_STO_PHASE (RS: Set RUN_STO_REQ, Reset RUN_DOWN_RESET) — защёлка «STO выбран»,
  не откатывается при восстановлении Healthy (EMG-009).
- RUN_COAST_TON (TON 5 с; вход RUN_STO_PHASE) → Symbol `linkRunDisReq`.
- Network8/FBOrDis (OR: N8/FBAnd1, `linkRunDisReq`, [ABT], [E4 SCX]) заменяет
  FBAnd1 на входах N8/FBDecouple1.DecIn3 и N8/FBAnd2.AndIn3; N8/FBAnd3.AndIn3
  остаётся N8/FBAnd1 (g9 только из S5). Разряд и выдержка T_DIS = существующие
  N8/FBTon1→FBTon2 (1 с + 1 с; 1 с, если запрос разряда уже был TRUE — поведение
  N8/FBAnd2 сохраняется).
- g6: N6/FBAnd18.AndIn1 := `b_Reset_HV_C2_2` (C2 OFF по цепи разряда); N6/FBTon1
  удалить; N6/FBDecouple2.DecIn1/2 := wire RUN_STO_PHASE; DecIn3/4 и Symbols
  `b_Set_HV_Discharge_Request_3`, `b_Reset_HV_C2_4` удалить (N1/FBOr6.OrIn3,
  N1/FBOr16.OrIn4 деактивировать). Это устраняет дефект F1 (одновременные
  Discharge/C2 OFF/STO).
- N6/FBOr5 → Set owner: OrIn1 := wire FBAnd23, OrIn2 = FBAnd17 (PLC до E4).
- SS1: N1/FBAnd2 AndIn4 `linkRunDownOwner` (NO), AndIn5 `linkRunStoPhase` (NO).
- N6/FBAnd9.AndIn6 деактивировать, удалить HEALTH_GUARD (Healthy больше не ведёт в Step4).
- STP-D fault: HL_FAULT (RS) Set = AND(RUN_HEALTH_LOST, owner, !RUN_STO_PHASE),
  Reset = AND(SR, OR(in_Reset_PB, in_Relase_Door_PB)); Symbol `linkHealthyLostFault`.
- Abort StartingRun (STP-E): SafeResumption/ABT_SET (AND: linkRndGreenQualified,
  recRndC_SU), ABT (RS), ABT_DONE (AND: ABT, `b_Reset_HV_C2_2`, !in_HV_C2_FBK),
  ABT_RESET (OR: ABT_DONE, !linkSafeRndScope), RndPhysicalCompact/SU_RESET
  (OR: !linkSafeRndScope, `linkAbt`) → STATE_SU.Reset; `linkAbt` → N1/FBOr7.OrIn3,
  N1/FBOr9.OrIn3 (STO сразу), N8/FBOrDis.OrIn3 (разряд сразу). Статус остаётся R&D.
- OFF-watchdog (STP-C, WDG-05; используется всеми снятиями): N1/WDG_C1_OFF (AND:
  `out_LV_C1` NO, `in_LV_C1_FBK`) → TON 0,5 с; N1/WDG_C2_OFF аналогично → TON 0,5 с;
  выходы NO-контактом в N1/FBAnd1.AndIn4/AndIn5 (та же защёлка FBEstop1; пока FBK
  ON, Restart невозможен — EMG6-01).
- Порядок: STO-цепь N1 (FBOr7, FBOr8, FBAndSto1SetPermit, FBRs3, FBOr9, FBOr10,
  FBAndSto2SetPermit, FBRs4) переносится после последнего производителя запроса
  STO, чтобы STO выдавался в скане принятия +1 (STP-A «t_a(+≤1)», STP-E «≤a+1»).
Ресурсы: +5 (SS1/STO/coast) +1 (FBOrDis) −1 (N6/FBTon1) −1 (HEALTH_GUARD) +4
(HL_FAULT) +5 (ABT) +4 (WDG OFF) = **+17**.
Изоляция: Q-RC-09 (Healthy после STO) — по построению спуск продолжается (RUN_STO_PHASE
защёлкнута); иной ответ → ветка на RUN_STO_PHASE. Q-RC-03 — FBOrIlRunOk.OrIn1.
Q-ARCH-05 (fault при Healthy в устойчивом Run) — вход HL_FAULT_SET.AndIn2 (owner).
Мутации — `MUTATION_PLAN_E3.draft.json` (финализируются после ID редактора).

### EX — выход из Emergency (EMG6-01, EMG-006) и аварийное снятие энергии вне Run

- g10 S6→S1 (+1 AND): S6 ∧ `b_EStop_Ok` ∧ !in_Reset_PB ∧ `recRndC_PrevG`
  (читается до ord записи ⇒ значение предыдущего скана; = спад зелёной) ∧
  !in_LV_C1_FBK ∧ !in_HV_C2_FBK ∧ !out_LV_C1 ∧ !out_HV_C2 → N3/FBOr2 (Set S1),
  что по 2.2 автоматически сбрасывает S6. Restart при FBK ON не даёт Safe
  (OFF-watchdog держит FBEstop1; при его отсутствии — нет энергии-OFF в g10).
- Аварийное снятие энергии из SR/S12/SU/SC (**Q-ARCH-01**): вариант А — g7
  расширяется: Set S4 = (S3 ∧ !N6/FBAnd9) ∨ (SR∨S12∨SC∨SCX) ∧ !b_EStop_Ok (+3 FB);
  вариант Б — текущее (LV остаётся, Restart возвращает в стадию) — тогда EMG6-01
  из R&D недостижим. Safe+EStop стадию не меняет (энергия уже снята).
Ресурсы: +1…+4.

### E4 — команды PLC v1.4, Config, heartbeat (эскиз; заморожено до решения ведущего)

Удалить (−18): N12/FBAnd8,9,10, N12/FBOr1; N6/FBAnd15,16,17; N2/FBAnd61,81,91;
N1/FBAnd10,12; Bypass N1/FBAnd4,5,6, FBTon1 (10 с, V14-Q17), FBAnd7, FBAnd8.
Добавить (~+29): DECOUPLE «прошлый скан» команд (1); 4 AND фронта (CMD ∧ !prev ∧
стадия-источник ∧ !in_Reset_PB ∧ !in_Relase_Door_PB ∧ !ERR) (4); «≥2 из 4» (6);
ERR (RS), ALL_FALSE (AND), TON 1 с (3); Config: SC и SCX (RS×2), вход (AND: S1,
фронт/уровень Bypass по Q-RC-05, linkCoverClosed, !g2), начало выхода (AND), C1-OFF
выхода (AND), завершение (AND), ветка крышки в Config (OR в FBEstop1-канал),
DEC_CFG (AND) (~9); heartbeat: TON 3 с на уровень TRUE, AND(!HB)+TON 3 с (3);
SU Set OR, ABT Set OR (2); DECOUPLE публикации статусов (1).
Нетто ≈ **+11**. CMD_TRIGGER_EMERGENCY = существующий канал `in_Estop_PLC`.
Вариант выхода из Config — **B** (C1 и C2 OFF одновременно после T_DIS; Safe при
обоих FBK OFF) — выбор архитектора по V14-Q18 (меньше блоков).
Арбитраж S1: g2 и вход Config совпали в скане — Q-ARCH-08.
HB-04: группа стартует в Emergency (INV-2); пока heartbeat не меняется 3 с,
причина держит FBEstop1 и Restart невозможен ⇒ «до первого импульса — Emergency,
снятие только после пошедшего heartbeat и Restart». Возвращается аналитику.

### E5 — SafetyFault (WDG-04/06; Q-RC-07, Q-RC-13)

SF (RS), SF_SET (OR откатов E6), сброс = OR(green, blue) (переиспользует OR из
HL_FAULT при слиянии); `!SF` — в UP-гранты (GATE_020, N2/FBAnd4, фронты PLC);
2 с отпускания — RELEASE TON рекогнайзера (Symbol). **+3** (или **0**, если
HL_FAULT и SF объединяются — Q-ARCH-06b/Q-RC-13).

### E6 — watchdog подъёма (WDG-01/02/03, Q-RC-06, Q-RC-12)

C1 ON 0,5 с (AND+TON), C2 ON 0,5 с (AND+TON), LV Healthy 30 с (AND+TON),
HV Healthy 30 с (AND+TON) = 8; S12_ABORT (RS, Set OR, DONE AND, S12 Reset OR) = 4
(общий с V14-Q13 abort Safe→R&D); откат R&D→Run = ABT (E3) + SF. **+12**.

## 4. Изоляция заблокированных критериев

| Вопрос | Зависимое место (единственная точка) | Что меняется по вариантам |
|---|---|---|
| Q-RC-03 (крышка в StartingRun/спуске) | N1/FBOrIlRunOk.OrIn1 | спуск продолжается: S3∧!owner (+1 AND); Emergency и в SU: +вход SU (+1 OR) |
| Q-RC-04 (одновременность) | E4 «≥2 из 4» вход: фронты или уровни | только источник входов детектора |
| Q-RC-05 (Bypass уровень/фронт) | E4 AND входа Config: Bypass или фронт Bypass | ±1 канал DECOUPLE «прошлый скан» |
| Q-RC-06 (FBK при входе в Config) | E6: цель TON C1/C2 ON при SC | откат (SCX+SF) или Emergency-причина |
| Q-RC-07 (команды при SafetyFault) | вход !SF в DOWN-фронты/вход Config | наличие одного входа |
| Q-RC-08 (DOWN в прочих переходах) | фронты PLC требуют стадию-источник без детей | по умолчанию игнор по построению |
| Q-RC-09 (Healthy после STO) | RUN_STO_PHASE | по умолчанию спуск продолжается; иначе ветка |
| Q-RC-10 («ни одного») | DEC_EMG | по построению только старт группы; иной ответ меняет лишь DEC_EMG |
| Q-RC-11 (ошибка при HLT-01) | HLT_LV → SF_SET | +вход SF_SET |
| Q-RC-12 (откат R&D→Run) | ABT Set OR (WDG) | принято как ABT + SF |
| Q-RC-13 (один/два статуса) | HL_FAULT/SF, канал публикации | слияние −3 FB |
| Q-ARCH-01 (энергия при Emergency вне Run) | расширение g7 (EX) | А: +3 FB; Б: без изменений, EMG6-01 из R&D недостижим |
| Q-ARCH-03 (LV Healthy в StartingRun) | HLT_LV.AndIn2 | игнор (сейчас) / спуск / abort |
| Q-ARCH-04 (Unlock в Safe при открытой крышке) | GATE_010.AndIn3/4 | оставить (F1) / убрать (reference) |
| Q-ARCH-05 (fault при Healthy в устойчивом Run) | HL_FAULT_SET.AndIn2 | owner (только SS1) / S3 |

Q-RC-01 и Q-RC-02 решены (E2b, E3). STP-G и IL-03b готовы к тестам после E3/E2b.

## 5. Бюджет FB (лимит 255 — жёсткий)

| После | FB | Порты | Symbols SGVL | SAL-перем. |
|---|---|---|---|---|
| canonical F1 | 242 | 2076 | 85 | 75 |
| R1 | 215 | 1832 | 66 | 75 |
| E2a | 220 | 1877 | 70 | 75 |
| E2b | 221 | 1886 | 70 | 76 |
| E2c | 223 | 1904 | 70 | 77 |
| E2d | 224 | 1913 | 70 | 78 |
| R2 (оценка) | ~212 | — | ~60 | 78 |
| E3 (оценка) | ~229 | — | ~64 | ~82 |
| EX (А) | ~233 | — | — | — |
| E4 (оценка) | ~244 | — | — | + alias PLC |
| E5 | ~247 / ~244 при слиянии | — | — | — |
| E6 | ~259 / ~256 при слиянии | — | — | — |

Вывод: R1+E2 точно помещаются (224). E3…E5 помещаются только с R2. **E6 не
помещается** даже с R2 и слиянием HL_FAULT/SF (~256): нужен ещё один из вариантов —
(а) заменить защёлку `out_TransitionStep` (N1/FBRs8, FBOr14, FBOr15, N6/FBAnd19)
статусом «переход» из декодера (−4, меняет смысл alias для PLC, допустимо в рамках
V14-Q2); (б) общий TON для ON-watchdog C1/C2 (фазы S12 и SU не пересекаются, −1…−2);
(в) отказ от отдельного S12_ABORT в пользу общей фазы отката. Решение — ведущему
(Q-ARCH-06). Без R2 и (а) E6 отложен.

## 6. Native-ограничения, соблюдаемые планом

- Межсетевые связи — только Symbols/SAL-переменные (STS_*, linkCoverClosed,
  linkHltLvLost, linkIlScope, linkRunDisReq, linkAbt, …); новые wiredLink — только
  внутри сети; один wiredLink на пару портов; графических межсетевых wiredLink нет.
- AND-3: Standard-In только на AndIn1 — новые блоки читают только safe-сигналы/
  Symbols (E4: PLC-команды на AndIn1 фронтовых AND).
- DEC-3: удаляемые DECOUPLE (R1/R2) удаляются целиком; у N3/FBDecouple2.DecIn2
  источник сохраняется (in_False).
- Новые TON: только E3 (2 с SS1, 5 с выбег — утверждённые числа), E4 (1 с ошибки,
  3 с heartbeat — утверждены), E6 (0,5 с, 30 с — утверждены). Существующие
  таймеры не меняются; N1/FBTon1 10 с удаляется только в E4 (V14-Q17).
- Hardware mappings, group/target параметры, TargetSystemConfig — E2 не трогает.

## 7. Изменения конфигурации для E4 (по V14-Q2) — только перечень, без правки

| Файл | Изменение |
|---|---|
| `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/Alias Devices/PLC_IO/*.sds` | новые входы CMD_SAFE_TO_RND, CMD_RND_TO_RUN, CMD_RND_TO_SAFE, CMD_RUN_TO_RND, PLC_HEARTBEAT; выходы STS_COVER_LOCKED, STS_EMERGENCY, STS_SAFE, STS_RND, STS_RUN, STS_CONFIG, STS_PLC_CMD_ERROR, STS_SAFETY_FAULT (набор — после Q-RC-13); вывод из употребления IN_BIT_RnD_Mode.sds, IN_BIT_RnD_Mode_2.sds; IN_ESTOP_PLC.sds = CMD_TRIGGER_EMERGENCY (переименование/описание — по документу v1.4); IN_PLC_BypassC1C2.sds сохраняется (вход Config) |
| `MEN001_Dyno/Safety_Dyno/Safety_Dyno.splcproj` | регистрация новых/удалённых .sds |
| `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal` | `variable` + `aliasDeviceIoUsage` новых сигналов; удаление inPLC_RnD_Mode/_2 |
| `MEN001_Dyno/MEN001_Dyno.tsproj` (и связанные .xti) | связи process image группы с переменными PLC для новых сигналов |
| `MEN001_Dyno/PLC_Dyno/**` | PLC-переменные команд/heartbeat/статусов (вне TwinSAFE-программы; владелец — ведущий/Вадим) |
| `MEN001_Dyno/Safety_Dyno/TargetSystemConfig.xml` | только если меняется размер process image (проверить в E4) |

Физическая перекоммутация для инженера: **не требуется** — все новые сигналы
программные (PLC↔TwinSAFE по EtherCAT/FSoE process image); safe-входы/выходы,
каналы EL1918/EL2904/AX5805 не меняются. Если v1.4 требует аппаратный статус
крышки отдельным выходом — это вопрос к Вадиму, не к коду.

## 8. Разрешённые редактору файлы и границы

- R1, E2a…E2d: только `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`,
  `TwinSafeGroup1.sal.diagram`, `MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl` — в
  изолированном worktree редактора (`program/editor/E2-*`), перенос по G4.
- Запрещено: Alias Devices, splcproj, tsproj/xti, TargetSystemConfig, параметры
  группы, значения существующих таймеров, контакты/каналы FBEstop1 (кроме входа
  N1/FBAnd1.AndIn3…5, это программный AND), reference.
- Межсетевые связи только через Symbols; native CRC и сохранность заявленных
  дельт FB/портов/Symbols — G2.

## 9. Мутации guard'ов для G3

Файлы: `MUTATION_PLAN_E2a.json`, `MUTATION_PLAN_E2b.json`, `MUTATION_PLAN_E2c.json`,
`MUTATION_PLAN_E2d.json`, `MUTATION_PLAN_E3.draft.json`. Формат
`sal-mutation-plan-v1` (операторы `deactivate-input`, `invert-contact`,
`set-parameter`); перестановка порядка (`swap-order`) отсутствует в
`src/sal-mutations.js` — помечена `operatorAvailable:false`, нужен оператор от
инженера стенда. `sourceSha256` — кандидат редактора (заполняет тестировщик).
Эквивалентные по доказательству (не в знаменателе): MU06 (как в E1), MU11
(RUN_DOWN_RESET.OrIn2 — после E2a лишний скан owner не меняет защёлкнутые
выходы, g6 запрещён привязкой к S3 и !g7; переоценить в E3), N7/FBAnd8.AndIn5
(S4-привязка g8 — защита от устаревшего TON, поведенчески эквивалентна).

Проверено в прототипе (`repro/t4.mjs`, `repro/t5.mjs`): M-E2a-13
(HEALTH_GUARD.OrIn1) убит E2-02 (S4/Emergency вместо R&D, все d); M-E2a-09
(FBAnd18.AndIn3) убит свипом EStop относительно C2_FBK OFF (смещение −1 скан:
S_RnD+S4 — две стадии); M-E2a-08 (RUN_DOWN_RESET.OrIn1) убит «Run-down, затем
R&D→Run» (Run не достигается, C2 не включается). Прочие — с убивающим сценарием,
проверяются тестировщиком.

Наблюдение прототипа для Q-ARCH-01: EStop в скане C2_FBK OFF или позже (смещение
0…+3) застаёт уже стадию R&D ⇒ статус Emergency при стадии R&D с включённым LV —
это нынешний класс поведения «Emergency в R&D», не нарушение INV-1/INV-3;
энергетическая реакция решается в EX по ответу Q-ARCH-01.
