# REQ-CONSOLIDATION — трассировка решений Вадима → ID, v2

Срез / роль / дата: REQ-CONSOLIDATION v2 / v2-analyst / 2026-10-21. Только анализ;
SAL/SGVL/тесты/SCENARIO_DECISIONS/SCOPE/TRACE_MATRIX не менялись. Трасса решений
V14-Q1…Q21, E2, E2-Q1/Q2, E6, E6-Q1/Q2 из v1 действует — TRACE.v1.md §1, §3, §4.
Здесь — дельта v2.

## Источники (sha256)

| Источник | sha256 / commit |
|---|---|
| HEAD | 7d7aecd9f333f6f256dac6d2366ab91519b949d0 |
| canonical SAL (= F1) | 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 |
| canonical SGVL | dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 |
| canonical diagram | de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603 |
| SafetyTests/SCENARIO_DECISIONS.md (рабочая копия, не закоммичена) | c1e7fe6cf7aa1adbf7fcc33452c393bddd6f2cc4dfc02140ab55e621c0fd7bdf |
| SafetyTests/SOFTWARE_ACCEPTANCE_SCOPE.md | e3508d24d23fa821ae7ddc374cc5684408d8b2b8167d2e18e1853ffe934207b4 |
| SAFETY_STATE_MACHINE_SPEC.md | c065c7d2437b42a1ce5e2982309f17fc086d35a2ef6a0870b9ecc7957b3b2472 |
| SafetyTests/program/TRACE_MATRIX.json | 540d6edce9e2cdfac0ff0cbd0752734a47a0f0fd127414bf01fceefa5a28e9c3 |
| program/reviewer/E2-plan/PLAN_REVIEW.md | прочитан 2026-10-21 (замечания по EMG-004, E2-02/MU11, R&D при открытой крышке) |
| AGENTS.md / WORKFLOW.md | ba0936d6…e9c58a5 / e894d9aa…ace7b |
| reference | MEN001_Dyno 4495a1f (git show в scratchpad; ветка не переключалась) |

Метод проверки кода: `src/sal-parser.js` по canonical и reference (потребители
переменных); динамика не запускалась. Факты кода — «как сейчас», не oracle.

## 1. Новые ответы → критерии

| Решение | Ядро ответа | Критерии v2 | Тип |
|---|---|---|---|
| Q-RC-01 | Run + потеря NC → **Emergency** (защёлка, снятие всей энергии, V14-Q6) | IL-03, EMGREF-RUN, EMG6-01 | ЗАМЕНЯЕТ V14-Q21(b) и v1 IL-03a/b (в SCENARIO_DECISIONS помечено как пересмотр) |
| Q-RC-02 | Run + потеря Healthy → спуск с немедленным STO → 5 с → Discharge → T_DIS → C2 OFF → R&D; HV — R&D остаётся; LV — цепной R&D→Safe; не Emergency, не Step4 | STP-G1…G3; G4 → Q-RC-16; G5 → Q-ARCH-05 | ЗАМЕНЯЕТ Step4 в Run для Healthy |
| Q-RC-03 (a) | StartingRun + NC → **Emergency** как в Run | IL-05a | НОВОЕ; частично отвечает Q-ARCH-01 для SU |
| Q-RC-03 (b1) | Run→R&D, Safe→R&D, R&D→Safe — потеря крышки ничего не меняет | IL-05b, IL-02b(c) | ЗАМЕНЯЕТ SPEC §5.1 «потеря InterLock → Emergency» для этих фаз |
| Q-RC-03 (b2) | Выход Config + NC → Emergency | IL-05c | НОВОЕ |
| Q-RC-04 | Ошибка, если любые две команды перехода TRUE (уровни); только в устойчивых Safe/R&D/Run; TRIGGER вне | PLC-05, PLC-01, CFG-04 | УТОЧНЯЕТ V14-Q8 |
| Q-RC-05 | Config только по новому фронту Bypass в устойчивом Safe с закрытой крышкой; прочие разрешения как подъём; кнопка нажата — игнор | CFG-01, CFG-03, EMG6-01, BOOT-C | УТОЧНЯЕТ V14-Q16 |
| Q-RC-06 | Нет FBK ON 500 мс при входе в Config → откат Discharge → T_DIS → C1/C2 OFF → Safe + SafetyFault; 30 с не применяется | CFG-08, WDG-04 | НОВОЕ |
| Q-RC-07 (a) | При SafetyFault спуск выполняется (CMD_R&D_TO_SAFE или зелёная 0,5 с); зелёная квитирует и спускает — исключение из E6-Q2 | WDG-06(a'), WDG-07 | УТОЧНЯЕТ E6-Q2 (явное исключение) |
| Q-RC-07 (b) | Config при SafetyFault запрещён | CFG-03(f), WDG-06(d) | ПОДТВЕРЖДАЕТ Q-RC-05(b) |
| Q-RC-08 | Прочие команды в переходах — игнор без ошибки и без отложенного исполнения | PLC-10, STP-A, CFG-06 | ПОДТВЕРЖДАЕТ V14-Q11 для фаз |
| Q-RC-09 | Healthy после STO в нормальной остановке — продолжается до R&D, далее правила R&D | STP-F, E2-02, HLT-01 | НОВОЕ |
| Q-RC-10 | «Ни одного основного» → Emergency; группа стартует в Emergency | E2-04, BOOT-C | ЗАМЕНЯЕТ альтернативу TransitionFault (Q-FAULT-DESTINATION) |
| Q-MU06-01/02 | in_False_SI2_CH8 — константа FALSE; три ветви отключены намеренно | MU06-S, R0 | учтено в v1, без изменений |
| D-ARCH-POL | Сырое FALSE = PS исправен, TRUE = потеря; N11/FBAnd4.AndIn3 — ошибка, исправить в E2 | §0, POL-01, MOD1-01, WDG-02/03, STP-D/F/G, HLT-01/02, CFG-07 | НОВОЕ (норматив полярности); v1 оставлял «по архитектору» |
| D-ARCH-POL-RENAME | in_LV/HV_Healthy_FBK → in_LV/HV_Faulty_FBK, только программное имя | POL-01(b) | НОВОЕ (структура) |
| Q-ARCH-06 «А» | R1 разрешён (Network5/4/Step2 и таймеры) после подтверждения ревьюером и полного регресса; R2 и слияние HL/SafetyFault — нет | R1-01, STP-D (HL отдельно), WDG-02 (5-с выдержка reference — не oracle) | ЗАМЕНЯЕТ сохранение reference Network5 в этой части |

Код (проверено sal-parser): потребители connector — reference: N2/FBAnd1
(разрешение подъёма), N6/FBAnd9 (удержание Run → Step4), N10 (статус); FBEstop1
connector не читает. Canonical добавляет N1/FBAndLvCurrentPermit и
SafeResumption/CONNECTORS. Значит, «как сейчас» потеря connector после Safe не
является защёлкой Emergency → Q-RC-14.

## 2. Замечание ревью плана E2: EMG-004 как источник Emergency вне Safe

Требования: SPEC §5.1/§19 EMG-004 «После выхода из Safe потеря любого connector
interlock считается **аварийным событием**» (для InterLock в той же §5.1 —
«считается **Emergency**»: формулировки различаются); SCOPE EMG-004 «аварийное
владение и запрет новых повышений»; SCENARIO_DECISIONS (2026-10-20, таблица):
«Начинается аварийная реакция; конкретная последовательность completion
отдельно»; V14-Q19: в Config «→ Emergency, как в любом состоянии».
Reference и canonical: защёлки нет (см. §1).

Вывод: однозначно только (1) Config и выход Config → Emergency (V14-Q19,
EMG4-01); (2) общие инварианты после Safe — без повышений, Unlock FALSE,
восстановление не отменяет реакцию (EMG4-02). Вид реакции в R&D/переходах/Run
(защёлка Emergency либо защитный спуск) неоднозначен: «как в любом состоянии» —
посылка формулировки вопроса V14-Q19, а не ответ о Run/R&D, и она расходится с
кодом так же, как посылка «как сейчас» в V14-Q21(b), пересмотренная Q-RC-01.
→ **Q-RC-14** (высокий), EMG4-03 BLOCKED. В EMG6-01 connector вне Config
убран из списка источников Emergency до ответа.

## 3. Противоречия между новыми и прежними решениями

| Пара | Результат |
|---|---|
| E6-Q2 «любая кнопка квитирует и потребляет попытку» ↔ Q-RC-07(a) «зелёная квитирует и спускает» | Не противоречие: Вадим назвал исключением. Выведено: квитирование со скана нажатия; зелёная < 500 мс — только квитирование; исключение действует только в R&D с SafetyFault. v1 WDG-06(a) для зелёной 600 мс в R&D **заменён** (раньше «нет перехода») |
| Q-RC-07 «не определено: SafetyFault при спуске по PLC» ↔ E6-Q2 «PLC ошибку не квитирует» | Выведено из E6-Q2: остаётся (WDG-07(b), READY-D). Вопрос не нужен |
| Q-RC-04 (уровни) ↔ STP-B / V14-Q12 / V14-Q13 | STP-B требует единственной TRUE; удерживаемая UP + DOWN в устойчивом Run → ошибка (PLC-05(c)); в переходах abort исполняется, ошибка — по приходу (PLC-05(e)). Следствия, сообщить Вадиму |
| Q-RC-01 (Run → Emergency) ↔ Q-RC-03(b1) (спуск Run→R&D продолжается) | Граница t_a; на t_a — наблюдение |
| Q-RC-03(a) ↔ Q-ARCH-01 (открыт) | Для SU Q-ARCH-01 отвечен; остаток — R&D/Safe→R&D/Config |
| Q-RC-02 ↔ SPEC §9 (HV в SS1) / Q-RC-09 (после STO) | LV во время SS1 не покрыт → Q-RC-15 |
| Q-RC-02 «цепной R&D→Safe» ↔ E2-Q2(a) (уровень в R&D) | Восстановление LV до R&D — неоднозначно → Q-RC-16 |
| Q-RC-03 (a)/(b1)/(b2) ↔ прочие спуски (abort SU, откаты E6, STP-G, откат Config) | Не покрыты → Q-RC-17 |
| Q-RC-04/Q-RC-05 ↔ Bypass | Bypass в правиле одновременности не определён → Q-RC-18(a); одновременный фронт с Safe→R&D — Q-ARCH-08 (открыт) |
| Q-RC-05(b) «подъём требует нет ошибки PLC» ↔ V14-Q8 (касается команд PLC) | Жест BOTH при ошибке PLC не определён → Q-RC-18(b) |
| V14-Q21(a) / Q-RC-03(b1) ↔ canonical GATE_001 (крышка блокирует зелёную в R&D) | Не противоречие требований: код расходится; критерий IL-02b, HLT-01b (ожидается RED) |
| D-ARCH-POL ↔ canonical N11/FBAnd4 | Код расходится (решение Вадима: исправить в E2); MOD1-01 RED на canonical |
| Q-ARCH-06 ↔ AGENTS «сохранять исходные действия» | Отступление подтверждено Вадимом; R1-01 — условия |
| Q-RC-10 ↔ SPEC §13/§14 «Emergency/TransitionFault» | Заменено Emergency |

## 4. Статус критериев v1 → v2

| v1 | v2 |
|---|---|
| E2-04 BLOCKED | READY (Q-RC-10) |
| E2-02 «обязан убить MU11» | снято с критерия (ревью плана E2); oracle без изменений |
| STP-F, STP-G BLOCKED | READY (Q-RC-09, Q-RC-02); STP-G4/G5 BLOCKED (Q-RC-16, Q-ARCH-05); STP-H новый BLOCKED (Q-RC-15) |
| IL-03a READY | **заменён** IL-03 (Emergency) — v1 oracle «без защёлки, SS1» неверен |
| IL-03b BLOCKED | READY как IL-03 |
| IL-05 BLOCKED | IL-05a/b/c READY; IL-05d BLOCKED (Q-RC-17) |
| CFG-03, CFG-08 BLOCKED | READY |
| PLC-05, PLC-10 BLOCKED | READY |
| WDG-06(a) | изменён для R&D (WDG-06(a')) |
| WDG-07 BLOCKED | READY (+READY-D (b),(c)) |
| HB-04 BLOCKED(ARCH) | без изменений (эскиз архитектора получен) |
| HLT-03 BLOCKED | без изменений (Q-RC-11 открыт) |
| EMG6-01 | источники уточнены; connector вне Config → EMG4-03 |
| — | новые: IL-02b, HLT-01b, EMG4-01/02 (READY), EMG4-03 (BLOCKED), POL-01, R1-01, BOOT-C (READY), CFG-09, CFG-10, PLC-14 (BLOCKED) |
