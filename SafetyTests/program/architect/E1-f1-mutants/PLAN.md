# E1-f1-mutants — архитектурный разбор выживших мутантов G3 (MU06, MU10, MU11)

Роль: v2-architect. Дата: 2026-10-21. F1 НЕ меняется; это анализ, а не план правки.

Источник (сверено sha256):
- F1 isolated: SAL `04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3`, SGVL `dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104`, diagram `de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603`.
- План F1 (frozen): `resumed-development-2026-10-21/architect/F1_RUN_RECOGNIZER_PLAN.json` `b52f6b0e…0a08b60`.
- Canonical P0 (TRACE_MATRIX baseline): SAL `34b5b850…0f0b0b`, SGVL `517fdadd…22635`.
- Reference 4495a1f: только `git show` в scratch, файлы не трогались.

Кодировка контактов в этом SAL (подтверждена `sal-runtime.read`): `Make Contact (NO)` = инверсия (`!`), `Break Contact (NC)` = прямой вход. Healthy FBK: сырое FALSE = исправно (Network6/FBAnd9 читает `!in_*_Healthy_FBK`); это наблюдение по XML, не электрическая валидация.

## 0. Исполняемый фрагмент (порядок = orderOfExecution, одна глобальная очередь)

| ord | блок | логика |
|---|---|---|
| 20 | N3/FBRs1 → b_Step1 | Reset = b_Step1_Reset ∨ b_Step2_Set ∨ **b_Step12** ∨ b_Step_RnD |
| 24 | N1/FBEstop1 → b_EStop_Ok | ES_NC_1/2, N1/FBAnd1(!Estop_PLC∧!False), Mentee |
| 46–48 | N3/FBOr5, FBRs3 → b_Step3 | Reset = b_Step3_Reset ∨ Step4(пред. скан, ord 64) ∨ b_Step12_Set_2(пред. скан, ord 194) |
| 51 | N6/FBAnd1 | Step3 ∧ !False |
| 53, 62 | N6/FBAnd2 → FBDecouple1 → **b_Step4_Set** | FBAnd1 ∧ !FBAnd9 (**FBAnd9 ord 88 — значение предыдущего скана**) |
| 64 | N3/FBRs4 → b_Step4 | Set = b_Step4_Set; Reset = b_Step4_Reset ∨ Step5 |
| 88 | N6/FBAnd9 | FBAnd10 ∧ IL1 ∧ IL2 ∧ LVconn ∧ HVconn ∧ !LV_Healthy ∧ !HV_Healthy |
| 110–113 | N11/FBAnd1→FBTon1→FBAnd4→FBAnd5 → **b_Step_RnD_Set** | Step12(пред. скан, ord 174) → TON → ∧ LV_C1_FBK ∧ LV_Healthy ∧ !False |
| 116 | SafeResumption/MODE | Step1 ∨ RnD(пред. скан, ord 172) ∨ Step3 |
| 119 | GATE_001 → **linkRndGatePermit** | !Estop_PLC ∧ !False ∧ EStop_Ok ∧ MODE ∧ IL1 ∧ IL2 ∧ ConnectorScope |
| 124–135 | GATE_004→005→009→GREEN TON → linkRndGreenQualified | GATE_004 = **GATE_001** ∧ A ∧ !C ∧ !L |
| 172 | N3/FBRs7 → b_Step_RnD | Set = b_Step_RnD_Set; Reset = Step3-set sources ∨ b_Step2_Set_2 |
| 174 | N3/FBRs8 → b_Step12 | Set = b_Step12_Set ∨ b_Step12_Set_2; **Reset = b_Step_RnD_Set** |
| 193 | N6/FBDecouple2 | DecIn1..4 = OR5 (пред. скан, ord 199) → b_Reset_STO_DR2/1_4, b_Set_HV_Discharge_Request_3, b_Reset_HV_C2_4 |
| 194/195 | N6/FBAnd18 / FBTon1 (0.2 c) | FBAnd18 = Ton1(пред. скан) ∧ !HV_C2_FBK → b_Step12_Set_2 |
| 199 | N6/FBOr5 | owner(пред. скан, ord 239) ∨ FBAnd17 |
| 231 | N6/FBAnd23 | And24(пред. скан) ∧ FBAnd1 |
| 237 | N6/FBAnd24 | !b_ResetPB_Lock ∧ **!in_False_SI2_CH8** ∧ linkRndGreenQualified |
| 238 | N6/RUN_DOWN_RESET | **b_Step_RnD_Set** ∨ **b_Step4_Set** ∨ !linkRndGatePermit |
| 239 | N6/RUN_DOWN_OWNER (RS, reset-dominant) | Set = And23, Reset = RUN_DOWN_RESET |

Единственный потребитель owner — N6/FBOr5.OrIn1. Мутация входа RESET наблюдаема только если owner(k) отличается, т.е. в скане, где мутированный вход = 1, а остальные два входа RESET = 0 и owner(k−1)=1 или Set(k)=1.

## 1. MU10 — RUN_DOWN_RESET.OrIn1 (b_Step_RnD_Set) отключён

**Вердикт: EQUIVALENT (доказано в модели исполнения F1, при условиях ниже).**

Утверждение: в каждом скане m, где b_Step_RnD_Set(m)=1, одновременно linkRndGatePermit(m)=0, поэтому OrIn3 уже даёт Reset; кроме того owner(m−1)=0.

Доказательство:
1. b_Step_RnD_Set(m)=1 ⇒ N11/FBTon1 TonOut(m)=1 ⇒ его вход (N11/FBAnd1, ord 110) был истинен непрерывно на протяжении задержки, а он читает b_Step12 из ord 174, т.е. Step12(m−1)=1 и Step12 держался всю задержку N11 TON (выход TON требует текущего входа).
2. MODE(m)=0:
   - Step1(m)=0: FBRs1 (ord 20) Reset содержит b_Step12 = Step12(m−1)=1, RS reset-dominant.
   - RnD(m−1)=0: RnD устанавливается только импульсом b_Step_RnD_Set, который в том же скане сбрасывает Step12 (FBRs8 reset-dominant). Повторный Set Step12 во время RnD требует либо b_Step12_Set (оба источника — N2/FBAnd4 через SAFE_UP_SCOPE и N2/FBAnd91 через N2/FBAnd11 — требуют Step1), либо b_Step12_Set_2 (N6/FBTon1 ← OR5 ← owner ∨ FBAnd17; FBAnd17 требует Step3, owner требует Step3 для Set и сброшен, см. п.3).
   - Step3(m)=0: Step3 ставится только b_Step3_Set_3 (цепь N5 от Step2; Step2 reset-dominant по b_Step12) или b_Step3_Set_2 (N12/FBTon3 от RnD — исключён выше). Вход в Step12 из Run через b_Step12_Set_2 сбрасывает Step3 в том же скане (FBRs3 ord 48 и FBRs8 ord 174 читают одно и то же значение b_Step12_Set_2 предыдущего скана). Вход в Step12 из Safe требует Step1, а не Step3.
   ⇒ GATE_001(m)=0 ⇒ RUN_DOWN_RESET(m)=1 независимо от OrIn1.
3. Сильнее: owner уже 0 с первого скана Step12. В скане j, где Step12 устанавливается из Run, Step3 сброшен на ord 48, Step1=0, RnD(j−1)=0 ⇒ MODE(j)=0 ⇒ owner(j)=0. Set owner вне Run невозможен (And23 ∧ FBAnd1=Step3). Итого b_Step_RnD_Set никогда не застаёт owner=1.
4. EStop/InterLock/Estop_PLC/in_False/connectors лишь добавляют причины Reset (OrIn3) — сделать OrIn1 единственной причиной не могут. Emergency (Step4/5/6) не входит в MODE ⇒ Reset через OrIn3. Повторный вход в Run: Set owner требует нового GREEN (TON 0.5 с от GATE_001), а b_Step_RnD_Set в Run невозможен (п.2). StartingRun (RnD→Run): RnD сбрасывается на ord 172 в скане u, Step3 ставится на ord 48 в u+1; MODE(u)=RnD(u−1)=1, MODE(u+1)=Step3=1 — разрыва нет, но и b_Step_RnD_Set там 0.

Условия/пределы: (а) модель `sal-runtime` (одна очередь orderOfExecution, переменные обновляются при записи, safeRs reset-dominant, TON без памяти при снятом входе) — не нативная валидация; (б) Network4/FBDecouple1 (b_Step*_Set/Reset) без входов, в модели FALSE — на доказательство не влияет, т.к. все используемые сбросы reset-dominant по Step12; (в) инвариант «Step12 не сосуществует с Step1/RnD/Step3» доказан по источникам Set/Reset F1, но не является общим E2-доказательством (см. §4: пара Step4∧Step12 достижима).

Эмпирика (repro/): направленный lifecycle Run→green→Step12→RnD (`mu10.mjs`): расхождений F1/MU10 нет; owner=0 и permit=0 в скане входа Step12 (t=804) и в скане b_Step_RnD_Set (t=1123). Случайный дифференциальный прогон 90×6000 сканов (`diff.mjs MU10`): 0 расхождений; b_Step_RnD_Set=1 в 7 сканах, ни разу при owner=1.

Рекомендация: в будущем срезе (не F1) — **удалить OrIn1 из RUN_DOWN_RESET** либо явно оформить как defense-in-depth с признанием неубиваемости. Архитектурно предпочтительно удалить: вход недостижимо-избыточен, его защитная роль полностью покрыта !linkRndGatePermit, а неубиваемый guard в safety-коде размывает G3. Если ведущий/ревьюер предпочтут оставить — записать его в матрицу как «equivalent by proof», не как непокрытый guard. Решение — на архитектуре следующего среза (E2), где пересматривается присвоение статусов.

## 2. MU11 — RUN_DOWN_RESET.OrIn2 (b_Step4_Set) отключён

**Вердикт: KILLABLE (сценарий есть) — но убивающий оракул совпадает с E2 и F1 сам его нарушает в соседнем окне (см. §4).**

Почему не эквивалентен: из причин FBAnd9=0 (→ b_Step4_Set) GATE_001 покрывает ES_NC_1/2 и Mentee (через b_EStop_Ok, ord 24, тот же скан), Estop_PLC, InterLock 1/2, connectors (в Run ConnectorScope=CONNECTORS) — всегда раньше или одновременно (FBAnd2 читает FBAnd9 предыдущего скана). **Не покрыта потеря LV/HV Healthy**: её нет в GATE_001. При потере Healthy в Run с owner=1:
- скан h: FBAnd9=0; скан h+1: b_Step4_Set=1, Step4 ставится; F1: owner(h+1)=0 через OrIn2; MU11: owner(h+1)=1 (MODE ещё =1, Step3 жив до ord 48 скана h+2);
- скан h+2: Step3 сброшен Step4 ⇒ MODE=0 ⇒ MU11 owner=0. Итог: owner держится на 1 скан дольше ⇒ DecOut1..4 (сброс STO, HV discharge, сброс C2) и вход N6/FBTon1 держатся на 1 скан дольше (до h+3 вместо h+2).
- Если N6/FBTon1 (0.2 с) уже отработал, а C2_FBK ещё TRUE (ожидание размыкания C2), то FBAnd18 = Ton1(пред.) ∧ !C2_FBK: в F1 Step12_Set_2 возможен только если C2_FBK пропал не позже h+3; в MU11 — также при h+4.

Сценарий для тестировщика (полная программа, scan 1 мс, `repro/mu11.mjs`):
- Исходное: F1 Run (Step3), EStop Restart выполнен, все permits OK, Healthy raw FALSE, LV_C1_FBK=C2_FBK=TRUE, STO FBK FALSE, кнопки отпущены ≥2 с.
- События: зелёная (in_Reset_PB) удерживается → owner=1 на +502 мс; N6/FBTon1 TonOut на +704 мс; отпустить зелёную, 50 сканов (owner держит; C2_FBK остаётся TRUE). Скан h: in_HV_Healthy_FBK := TRUE (или LV). C2_FBK := FALSE впервые видим в скане h+4.
- Наблюдаемое отличие: F1 — только Step4, out_LV_C1 снимается. MU11 — b_Step12_Set_2 на h+4, с h+5 **b_Step4 ∧ b_Step12 одновременно и устойчиво**, b_Set_LV_C1_1=1, out_LV_C1 остаётся TRUE в Step4 (`results/mu11-trace-d5.txt`, `mu11-sweep.txt`, d=5).

Рекомендация: вход оставить (он необходим — сужает окно гонки). Тест, убивающий MU11, — это E2-сценарий «потеря Healthy во время Run-down», а не F1-оракул; его ожидаемая реакция должна прийти от аналитика (см. §4), до этого MU11 можно учитывать как «KILLABLE, требование E2 не оформлено», не как дефект F1.

## 3. MU06 — FBAnd24.AndIn2 (!in_False_SI2_CH8) отключён

**Вердикт: EQUIVALENT (доказано комбинационно в F1); вопрос требования — только о сохранении паттерна, не о поведении.**

Доказательство: GREEN.TonIn = GATE_009 = GATE_005 ∧ in_Reset_PB; GATE_005 = GATE_004 ∧ !T; GATE_004 = GATE_001 ∧ …; GATE_001 содержит !in_False (AndIn2). Все в одном скане (ord 119<124<125<130<135<237), TON-выход требует текущего входа ⇒ linkRndGreenQualified(k)=1 ⇒ in_False(k)=0. Значит And24 = !Lock ∧ !False ∧ GREEN ≡ !Lock ∧ GREEN. Кроме того, And23 содержит FBAnd1 (Step3 ∧ !False) на текущем скане, а owner сбрасывается !linkRndGatePermit при in_False=1. Эмпирика: 40 направленных сценариев импульсов in_False (ширина 1/2/3/600 сканов, смещения 0…700 мс относительно нажатия зелёной, включая 498–504) — 0 расхождений F1/MU06 по всем var/N3/N6; случайный прогон 90×6000 — 0 расхождений.

Роль и происхождение паттерна (для аналитика):
- `in_False_SI2_CH8` — входной канал SI2 CH8, по имени постоянно FALSE; в программе используется как «разрешение» `!in_False` во вторых входах AND (в TwinSAFE нет константы TRUE). В reference 4495a1f он только в этой роли: N1/FBAnd1 (!Estop_PLC∧!False), N5/FBAnd1 (Step2∧!False∧EStopOk), N6/FBAnd1 (Step3∧!False), N7/8/9/FBAnd1 (Step4/5/6∧!False), N5/FBAnd7 (Step2∧!False∧!EStopOk), N6/FBAnd7/8 (C3 manual). Все — `Make Contact (NO)` (инверсия).
- В reference 9 потребителей, все инвертированные. В P0 и F1 — по 41 блоку-потребителю (N11, N12, RndPhysicalCompact/GATE_001, N2, N3/FBAnd2 и т.д.), из них 3 прямых (без инверсии): N5/FBAnd7, N9/FBAnd1, N12/FBAnd14. FBAnd24 есть только в v2 (в reference N6 нет FBAnd23/24 и Run→Step12 цепи); в P0 FBAnd24 = !Lock ∧ !False ∧ N6/FBTon2(raw in_Reset_PB) — там !False был единственной связью этой цепи с in_False (неизбыточен по And24, хотя And23 через N6/FBAnd1 его частично дублировал). В F1 вход 3 заменён на shared GREEN, который уже содержит GATE_001 ⇒ вход стал избыточным. План F1 явно сохранил «!ResetLock and !False stay».
- Побочное наблюдение (не F1): в v2 N5/FBAnd7.AndIn2 (`3d96ba39…`) и N9/FBAnd1.AndIn2 (`de6108cd…`) имеют `Break Contact (NC)` (прямой in_False), тогда как в reference те же порты — `Make Contact (NO)`. Изменение пришло коммитом `77546cb` (2026-10-11, «Stas Updates after inegration - not operational»). При in_False=FALSE это блокирует b_Step1_Set_2 (Step6→Safe) и b_Step1_Set_3 (Step2∧!EStopOk→Safe). Уже отмечено в V2_STATE_MAPPING.md п.5; к MU06 прямо не относится.

Рекомендация: эквивалентность структурная; оставить ли «!False» как единообразный паттерн или убрать как избыточный — решение аналитика/ведущего (единообразие против неубиваемого guard). Ожидаемое поведение при in_False=TRUE не меняется ни в одном варианте.

## 4. Новая находка для E2 (вне F1, существует и в P0)

Потеря LV/HV Healthy во время Run-down, когда N6/FBTon1 уже отработал и ждём C2_FBK OFF, при C2_FBK OFF через 1–3 скана после потери Healthy (F1: d=2..4 в `results/f1-race.txt`/`mu11-sweep.txt`; P0 при удержании зелёной: d=2..5, `results/p0-race.txt`) даёт **устойчивое b_Step4 ∧ b_Step12** и out_LV_C1 TRUE в Step4 (N11/FBAnd1 b_Set_LV_C1_1 = Step12∧!False). Причина: N6/FBAnd18 → b_Step12_Set_2 не зависит от фазы/аварии, а FBRs8 (Step12) сбрасывается только b_Step_RnD_Set. Также Step3∧Step4 сосуществуют 1 скан (h+1). Reference этой цепи не имеет (Run-down → Step12 — добавление v2). Это прямое нарушение решения E2 (двойное владение исключить по построению; конфликт → Emergency). Чувствительность к окну 1–3 скана — модельная (scan 1 мс); физическая корреляция «C2 размыкается ⇒ HV Healthy падает» делает сценарий правдоподобным, но не доказанным.

## 5. Мутации G3 для тестировщика (обновление по F1)

| ID | статус после разбора | что делать |
|---|---|---|
| MU06 | EQUIVALENT (доказано) | исключить из знаменателя G3 с ссылкой на §3; не писать тест |
| MU10 | EQUIVALENT (доказано при условиях §1) | исключить из знаменателя G3; рекомендация удалить вход в будущем срезе |
| MU11 | KILLABLE | сценарий §2 (d=5); оракул «нет Step4∧Step12, нет LV request в Step4» — требует решения аналитика по E2, т.к. F1 сам FAIL при d=2..4 |
| новые (для E2) | — | M-E2a: убрать b_Step4_Set из N3/FBOr5 (Step3 reset); M-E2b: инверсия AndIn2 у N6/FBAnd18 (C2_FBK); M-E2c: свап ord FBRs3/FBRs8; использовать после проектирования E2 |

## 6. Ресурсы и границы

Изменений блоков/портов/Symbols/wire/orderOfExecution: **нет** (F1 не меняется). Бюджет: F1 242/255 FB, 2076 data ports, 209 globals, 75 variables, 307 wires — без изменений. Записано только в `SafetyTests/program/architect/E1-f1-mutants/` (PLAN.md, PLAN.json, repro/*.mjs, results/*). Скрипты читают F1 из `candidates/resumed-f1/native` (или `SALROOT` для P0/reference), мутации применяются в памяти; файлы SAL не пишутся.
