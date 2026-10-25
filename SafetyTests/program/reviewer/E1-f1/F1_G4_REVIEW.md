# E1-f1 — независимое ревью G4 изолированного кандидата F1 (v2-reviewer, 2026-10-21)

**Вердикт: ACCEPT bounded** — перенос F1 в canonical допустим только с условиями C1–C7 ниже.
Это программное ревью на модельном стенде и офлайн-native структуре. Не IDE Verify/Build,
не Target, не hardware validation; безопасность не заявляется.

## Источник (сверено sha256 лично)

| объект | sha256 | факт |
|---|---|---|
| F1 SAL `candidates/resumed-f1/native` | 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 | совпадает; `resumed-f1/project` — те же байты |
| F1 SGVL | dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 | совпадает |
| F1 diagram | de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603 | совпадает |
| canonical рабочий v2 = P0 | SAL 34b5b850…0b0b, SGVL 517fdadd…2635, diagram 7b5eb794…78ce | совпадает с `resumed-p0/native` |
| план F1 (frozen) | b52f6b0e440a09ce138ad91e633b2fcd78f431d246a4dbdabc083809a0a08b60 | совпадает |

`staged/` F1 имеет другие SHA (до native save) — не кандидат, в ревью не используется.

## Что проверено независимо (не на веру)

1. **Фактический diff P0→F1** (CR-нормализованный: 347 строк SAL, 16 SGVL) прочитан целиком.
   Совпадает с планом: удалён `//Network6/FBTon2` (дубликат 0.5 с); `FBAnd24.AndIn3` ←
   Symbol `linkRndGreenQualified` (источник только `RndPhysicalCompact/GREEN/TonOut`);
   `FBAnd23.AndIn3` (сырой `!in_Relase_Door_PB`) → Deactivated, его Symbol-reader удалён;
   провод And23→OR5.OrIn1 заменён на And23→`RUN_DOWN_OWNER.Set`, `RUN_DOWN_OWNER.RsOut`→OR5.OrIn1;
   `RUN_DOWN_RESET` = `b_Step_RnD_Set ∨ b_Step4_Set ∨ !linkRndGatePermit` → `RUN_DOWN_OWNER.Reset`;
   `SafeResumption/MODE.OrIn3` ← GVL `b_Step3`. Новые блоки в Network6, orders 238/239 сразу
   после And24 (237); остальные orders сдвинуты на ±1 с сохранением относительного порядка.
   Новых связей вне плана нет; старый обход (raw blue в And23, raw TON в And24) удалён.
2. **delta-check тестировщика перезапущен мной** на `resumed-p0/native` vs `resumed-f1/native`:
   DELTA PASS 43/43 (вывод в scratchpad, совпадает с DELTA_CHECK.json).
3. **Native-structure preflight** (`assertNativeSalStructure`) и `validateSalBindings` на P0 и F1:
   P0 14/241/2066/75/306/0, F1 14/242/2076/75/307/0 cross-network, bindings PASS.
   Новые входы (And24.AndIn3, OWNER Set/Reset, RESET OrIn1..3) — ровно один источник каждый.
   Symbols 75, SGVL 85 деклараций, +3 FbPortUsage (MODE.OrIn3, RESET.OrIn1/OrIn2), кратность
   usage-обёрток сохранена (delta-check: Symbols отличаются только планными readers).
4. **NATIVE_F1.json** (тестировщик): offline loader CRC валиден (3702999762), 0 нарушений
   source-rule, 2354 shapes без дрейфа. Принято как offline-native, не IDE/Target.
5. **Структурные посылки доказательств MU06/MU10** — дамп портов/контактов/orders из F1 (`repro/dump-blocks.mjs`).
6. **Гонка Step4∧Step12** — собственное воспроизведение на реальном lifecycle
   (Safe→BOTH→RnD→BOTH launch→Run, без инъекции фазы после старта протокола) для P0 и F1
   (`repro/race-lifecycle.mjs`, `repro/race-P0.txt`, `repro/race-F1.txt`).
7. **MU12/MU24 на полной программе** (все 242 блока, реальный lifecycle, мутант в памяти):
   `repro/mutant-lifecycle-diff.mjs` → `repro/diff-MU12.txt` (MU12: 93/162 случаев различимы);
   `repro/held-across-reach.mjs` → `repro/held-across-reach.txt` (MU24, достижимость GAP-HELD-ACROSS).

## (a) MU06 / MU10 — эквивалентность

**MU06 (And24.AndIn2 `!in_False` отключён): EQUIVALENT — подтверждаю, условно на модель.**
Цепь проверена по SAL: GATE_001(ord119).AndIn2 = NOT `in_False_SI2_CH8` → GATE_004(124) →
GATE_005(125) → GATE_009(130) → GREEN.TonIn(135) → Symbol → And24(237). Все — чистые AND,
тот же цикл. TON-2 (DOC §4.12.2): вход 0 → выход 0 немедленно. Следовательно GREEN(k)=1 ⇒
in_False(k)=0, AndIn2 логически следует из AndIn3. Посылки: GRP-1 (DOC) порядок;
**GRP-2 (DERIVED, не DOC)** — видимость записи в том же цикле и постоянство входов в цикле.
При межцикловой задержке Symbol MU06 стал бы различимым (stale GREEN(k−1) при импульсе in_False).
Исключение из знаменателя G3 допустимо с меткой «EQUIVALENT-by-proof, условно GRP-2».
Q-MU06-01 (роль in_False) на F1 не влияет; критерии аналитика C01–C03 корректны, C04 — E2.

**MU10 (RESET.OrIn1 `b_Step_RnD_Set` отключён): EQUIVALENT — подтверждаю, условно на текущую
топологию Network3.** Проверено: MODE = Step1 ∨ RnD ∨ Step3 (ровно три активных входа);
FBRs8(Step12).Reset = `b_Step_RnD_Set`; FBRs1 и FBRs2 Reset содержат `b_Step12` (reset-dominant);
FBRs3 Set только `b_Step3_Set_3`/`b_Step3_Set_2`; FBRs7(RnD) Set только `b_Step_RnD_Set`.
Network4/FBDecouple1 пишет только Reset’ы и `b_Step1_Set`/`b_Step2_Set` — оба подавлены
reset-dominant `b_Step12`, поэтому вывод не зависит от неизвестного значения Network4.
`b_Step_RnD_Set(m)` требует Step12 всю задержку N11 TON ⇒ MODE(m)=0 ⇒ OrIn3 уже даёт Reset;
owner обнуляется ещё на первом скане Step12. Даже в достижимом конфликтном Step4∧Step12
MODE=0. Исключение допустимо, **но доказательство опирается на присвоение статусов, которое
E2 пересматривает** — после E2 эквивалентность обязательно переоценить (условие C4).

## (b) MU11 — оставить открытым до E2?

Строгий G3 («каждая мутация guard’а убита поведенческим тестом») **не выполнен** для MU11:
его убивает только PLAN-ORACLE строка `PLAN-STEP4-protective-request-resets-owner`.
Блокером переноса не считаю, потому что: (1) единственный наблюдаемый эффект MU11 — owner
дольше на 1 скан ⇒ fanout DecOut1..4 (сброс STO, HV discharge, сброс C2) — выходы безопасного
направления — дольше на 1 скан, и окно гонки Step4∧Step12 шире на 1 скан; (2) оракул,
различающий это («нет Step4∧Step12»), — требование E2, которое сам F1 нарушает в соседнем окне,
поэтому честного F1-теста по требованию нет; (3) вход сохранён и сужает окно.
Условие: в матрице MU11 = «KILLABLE, open → E2», не «killed»; G3 F1 = «с одним задокументированным
исключением»; E2-тест обязан убить MU11 (C3).

## (c) Находка Step4∧Step12 — **частично опровергаю** формулировку «F1 не вносит, а сужает»

Механизм (N6/FBAnd18 → `b_Step12_Set_2` не зависит от фазы/аварии; Step12 сбрасывается только
`b_Step_RnD_Set`) существует в P0 и F1 его не меняет. Моё воспроизведение на реальном lifecycle:

| сценарий (потеря LV/HV Healthy, затем C2_FBK OFF через d сканов) | P0 | F1 |
|---|---|---|
| зелёная удерживается | Step4∧Step12 при 4 значениях d | при 3 значениях d |
| зелёная отпущена на 550 мс (после принятия, до N6/FBTon1) | **нет** (P0 бросил down: TON1 не сработал) | **Step4∧Step12 при 3 значениях d** |
| зелёная отпущена на 800 мс (после TON1) | **нет** | **Step4∧Step12 при 3 значениях d** |

Итог: F1 сужает окно d на 1 скан, **но расширяет класс достижимых последовательностей**:
в P0 гонка требовала удержания зелёной до размыкания C2, в F1 — любая принятая нормальная
остановка, включая обычное отпускание кнопки. Это прямое следствие требуемого поведения
(принятая команда не отменяется; P0 при отпускании бросал остановку — это его FAIL), но
утверждение «не регрессия, только сужение» неверно и не должно попасть в статус/коммит.
Классификация: существующий дефект присвоения статусов (E2), **достижимость которого F1
увеличивает**; safety-relevant (устойчивое двойное владение стадиями; по данным архитектора ещё и запрос LV в Step4 — эту часть я отдельно не подтверждал: в моей фикстуре out_LV_C1 остаётся TRUE в Step4 и без гонки, метрика несравнима).
Чувствительность к окну 1–3 скана модельная (скан 1 мс, натив — NV). Требует решения ведущего
и уведомления Вадима (C2), E2 обязан закрыть до любых шагов к загрузке.

Других регрессий F1 к P0 не нашёл: current 445/445 (canonical 443/445; два Run FAIL → PASS),
historical 75/75; harness 189→185 — ровно 4 OBS-TON удалённого FBTon2 (OBS-TON GREEN остались);
сценарии 200→199 PASS — ровно TIMER://Network6/FBTon2; STATE:conflicting-set-requests FAIL
идентичен; NV 7=7. Синяя в Run не даёт Unlock/rndBlue; BOTH в Run не даёт up/SU; PLC OrIn2 не тронут.
**MU12** на полной программе различим: 93/162 случаев (IL1/IL2/ES_NC_1/Estop_PLC/Mentee/коннекторы/in_False
на q+1…q+100 — F1 сбрасывает owner, MU12 продолжает нормальный fanout; потеря Healthy не различает — её покрывает OrIn2),
т.е. kill тестировщика не артефакт фикстуры.

## (d) Миграция MIG-1…8 — точна, поведенческих ожиданий не меняет

Прочитан STRUCTURAL_MIGRATION.diff целиком. Меняются только: SHA-пины, литералы счётчиков
241→242 / 2066→2076 / 306→307, CRC 1997263000→3702999762 (и его мутация в BOOT-негативе),
4 usage ID ровно двух планных удалённых readers (`fe3c924f/c74e2d07` in_Reset_PB→FBTon2.TonIn,
`0587c93c/58d3ae1a` in_Relase_Door_PB→And23.AndIn3 — видны в моём diff), диагностический путь
`runTonQ/runTonInput` → GREEN (grep: используется только в `chronology()`-наблюдении, ни в одном
assert). Тела тестов, тайминги, окна наблюдения и оракулы не тронуты. Замечания (не ослабление):
- MIG-1: общий helper начинает зависеть от `program/tester/E1-f1/delta-check.mjs` и при каждом
  прогоне пишет `DELTA_CHECK.scratch.json` в папку тестировщика — побочная запись чужой роли;
  перенести checker к стенду (scripts/) с выводом во временный каталог (C5).
- MIG-1 требует ещё не существующего `fixtures/resumed-p0-canonical/` — создать точными байтами
  P0 (SHA пиннятся helper’ом) до применения.
- MIG-6: имя `p0RetiredUsageIds` и комментарий «only two … P0c» устарели — переименовать/дописать F1.
- MIG-8: BOOT manifest — только после checkpoint-коммита; scratch-версия не принимается.
- Существующий побочный эффект стенда: `check:software` перезаписывает замороженный
  `resumed-development-2026-10-21/tester/p0/source-pair-results.json` — E0/стенд.

## (e) Покрытие BTN-001…008 в Run — достаточно для цели F1, с пределами

Есть (обе очерёдности, где применимо): 249/250/251/300 (BOTH/поздняя), 499/500 single,
поздняя 251/300/499 до принятия, Q-500 green→blue и blue→green, поздняя 600 после принятия,
неудачный chord 11→10/11→01, повторное нажатие без нейтрали, удержание 3 с = одна команда,
999/1000 BOTH с частичным отпусканием, нейтраль 1999/2000, lock, аварии на q/q+1/после принятия
с restore без Restart, удержанная BOTH через реальный вход в Run, Run→Step12→RnD без каскада,
повторный вход в Run без stale-down, q−1/q/q+1 фазовый выход с PLC01.
Пределы: (1) в Run граница окна 250/251 и BOTH 999/1000 **ненаблюдаема** (оба исхода — «нет
команды»), её различают только Safe/RnD-наборы (MU25/MU26 убиты там) — допустимо, окно общее;
(2) большинство Run-кейсов — фикстура с фиксированным Step3 (метка есть); реальный lifecycle —
9 кейсов; (3) MU24 (GATE_016.AndIn4) убит только `GAP-HELD-ACROSS-*` на фикстуре с фиксированным Step3. На полной программе (`repro/held-across-reach.mjs/.txt`) потеря IL1/IL2/LV-connector/Estop_PLC в Run сразу даёт Step4 — сценарий тестировщика **недостижим**, F1 и MU24 там не различаются. Единственный найденный достижимый различитель — импульс `in_False_SI2_CH8`=TRUE в Run (Run сохраняется; F1 — нет down после повторного нажатия через 999 мс, MU24 — down), но оракул зависит от открытого Q-MU06-01. Метку `killedByRequirementTest` для MU24 заменить на «killed on component boundary; reachable kill conditional on Q-MU06-01». GATE_016 F1 не менял, блокером не считаю; (4) потеря Healthy во время Run-down и in_False после принятия (C04) — E2;
(5) D-STARTINGRUN-GREEN-DOWN и нормальная SS1-остановка (F2) вне F1.

## Условия переноса (ACCEPT bounded)

- **C1** Переносить только байты SAL/SGVL/diagram с SHA выше; миграция — ровно MIG-1…8 с учётом C5.
- **C2** В матрице/WORK_STATUS/коммите не писать «F1 не вносит/только сужает гонку»; записать:
  «механизм P0, F1 сужает окно на 1 скан и расширяет достижимость на отпущенную зелёную»;
  ведущий сообщает Вадиму как открытый safety-relevant пункт E2.
- **C3** MU11 — OPEN (KILLABLE, E2); E2-план обязан содержать убивающий его тест по требованию.
- **C4** MU06/MU10 — «EQUIVALENT-by-proof» с условиями (GRP-2; топология Network3); после E2 переоценить MU10.
- **C5** Перенести delta-check в стенд, убрать запись в папку тестировщика из общего helper’а;
  создать `fixtures/resumed-p0-canonical`.
- **C6** Ни один BTN/EMG/STATE ID не закрывать этим G4: ревью покрывает Run-срез F1; CLOSED требует
  прочих режимов, E2-оракулов и canonical-прогона после переноса.
- **C7** После переноса — повторный `npm run check:software` на canonical с ожиданием 445/445 current,
  1 FAIL STATE, 7 NV; любое расхождение — назад к тестировщику.

## Куда вернуть

- Аналитик: оракул E2 «потеря Healthy во время принятой Run-down» (MU11, гонка); Q-MU06-01 — без блокировки.
- Архитектор (E2): гонка Step4∧Step12 (FBAnd18 без фазового guard, Step12 без аварийного Reset);
  судьба RESET.OrIn1 (MU10).
- Стенд: C5; GRP-2 подтверждение (MU06 условие); побочная перезапись frozen evidence.
- Тестировщик: переклассифицировать kill MU24 (недостижимый фиксированный Step3); после ответа Q-MU06-01 — достижимый kill через in_False либо через Safe/RnD-контекст.
