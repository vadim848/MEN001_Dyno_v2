# E1-f1-MU06 — критерии по in_False_SI2_CH8 в Run-распознавателе (v2-analyst, 2026-10-21)

Источник: F1 SAL `04b45456…8a3`, SGVL `dc103abe…9104`, diagram `de02bbff…a603`
(SafetyTests/candidates/resumed-f1/native); canonical P0 SAL `34b5b850…0b0b`;
reference `4495a1f` (git show, только чтение); MU06 SAL `a10cdfde…3ef5`.

## 1. Что такое in_False_SI2_CH8 (только программная роль)

- Объявление: safe alias input, sdsId 62 / channelId 15 / functionId 1618018561
  (A12 SI2 EL1918). Аппаратное происхождение не исследовалось (AGENTS.md).
- Значение не задано ни одним источником: SAL_INPUT_INVENTORY.json
  `runtimeValue: NOT SUPPLIED`; V2_SAFE_EXIT_REPORT.md и
  fault-code-inventory/ANALYST.md прямо: имя не доказывает константу FALSE.
  В SCENARIO_DECISIONS.md, SPEC §§19–20, SOFTWARE_ACCEPTANCE_SCOPE.md решения
  о значении/реакции на этот вход нет (единственное упоминание — наблюдение
  SCENARIO_DECISIONS §«Самостоятельные PLC requests» о FBAnd14).
- Reference 4495a1f: 9 потребителей, **все инвертированные** (`!in_False`):
  Network1/FBAnd1 (`!in_Estop_PLC ∧ !in_False` → FBEstop1.EStopIn3, т.е.
  операнд аварийного FB), Network5–9/FBAnd1 (шаговые guards), Network6/FBAnd7/8,
  Network5/FBAnd7. Программная роль в reference: TRUE = аварийное условие
  (EStopIn3 → b_EStop_Ok FALSE, защёлка до ручного Restart) и запрет логики шагов.
- Canonical P0 и F1: 41 потребитель; 38 инвертированных, 3 прямых:
  Network5/FBAnd7.AndIn2, Network9/FBAnd1.AndIn2 (в reference — инвертированы;
  в истории v2 прямыми стали в коммитах 7482285 (2026-08-20, FBAnd7) и
  77546cb (2026-10-11, «Stas Updates after inegration - not operational»,
  Network9/FBAnd1 и FBAnd14) — до работы агентов) и
  Network12/FBAnd14.AndIn4 (PLC00 down; с !in_False в FBAnd12/13 ветвь
  невыполнима — ARCHITECT.md button-routing-audit).

Вывод по вариантам задачи: (b) не подтверждён — константа FALSE не задана,
принять её = выдумать oracle. Требование к реакции при TRUE существует на
уровне сохраняемой reference-роли (аварийный операнд EStopIn3 + запрет шагов)
и SPEC §13 (Emergency выше перехода вниз), EMG-001/EMG-005. Для MU06 это
даёт критерии C01–C02, но **MU06 эквивалентен** (раздел 3): никакая
последовательность входов его не различает.

## 2. Критерии (Run-распознаватель, F1)

Общие условия R0: устойчивый Run (out_LV_C1, out_HV_C2, STO_DR1/2 TRUE),
b_EStop_Ok TRUE, b_ResetPB_Lock FALSE, обе кнопки отпущены ≥2100 мс,
in_False_SI2_CH8 FALSE, прочие входы — test/helpers/safe-run-source.js.
Скан 1 мс. p — фронт зелёной (in_Reset_PB). q = p+500 — первый скан
квалификации GREEN (D-Q500, BTN-003); принятие = RUN_DOWN_OWNER.Set на q+1
(F1 plan, причинность And23/And24).

**C01 (READY) — вход TRUE до/в момент квалификации блокирует нормальный down.**
- События: зелёная нажата в p и удерживается; in_False TRUE импульсом
  1 и 2 скана, начало k ∈ {p−10 (удерживается до p+601), p+495…p+500}.
- Ожидается: нет RUN_DOWN_OWNER.Set, нет runPhysical/FBOr5 down, нет
  runResetSto1/2, runDischarge, runResetHv из этой попытки; b_EStop_Ok FALSE
  после импульса (reference EStopIn3).
- Границы: q−1 (p+499) и q (p+500) — нормативно «нет команды»; q+1 (p+501) —
  наблюдение (факт F1: блокируется), не нормативно: какой скан считать моментом
  принятия при одновременном аварийном условии, решения нет; FAIL по q+1
  не объявлять. ≥q+2 — см. C04 (BLOCKED).
- Запрещено: нормальная Run→R&D последовательность (SS1/STO reset/discharge)
  по зелёной при активном аварийном операнде.
- Источник: reference Network1/FBAnd1→FBEstop1.EStopIn3 и Network6/FBAnd1
  (!in_False на всей логике шага); SPEC §13 п.1>п.3; EMG-001.

**C02 (READY) — снятие входа не «доставляет» старую зелёную.**
- События: in_False TRUE с p−10; зелёная в p удерживается до p+1500;
  in_False FALSE на p+601. Проверка до отпускания зелёной.
- Ожидается: нет owner/down request до конца окна; b_EStop_Ok остаётся FALSE
  (защёлка, EMG-005); распознаватель требует полного отпускания + release
  filter (BTN-001/BTN-007).
- Запрещено: RUN_DOWN_OWNER.Set после очистки входа от той же попытки.
- Не проверять в C02 отпускание зелёной: in_Reset_PB — Restart FBEstop1
  (V14-Q6); реакция Restart в Run — E2/EMG-006, вне среза.

**C03 (READY, позитивный контроль)** — R0 без in_False: owner Set на p+501,
down requests появляются (факт F1 и MU06 совпадает).

**C04 (BLOCKED E2)** — вход TRUE после принятия (≥q+2): F1 даёт и принятую
нормальную down (owner p+501), и b_EStop_Ok FALSE одновременно. D-LATE-SECOND
запрещает отменять принятую команду только для кнопок; сочетание принятого
нормального down с последующей аварией — предмет E2 («двойное владение
стадиями исключить по построению»). Oracle здесь не задаётся.

## 3. Классификация MU06 — эквивалентный мутант (не «недостижим по константе»)

And24 = `!b_ResetPB_Lock ∧ !in_False ∧ linkRndGreenQualified`. В том же скане
in_False(k) проходит GATE_001.AndIn2(!in_False, order119) → GATE_004(124) →
GATE_005(125) → GATE_009(130) → GREEN.TonIn(135); safeTon сбрасывает выход при
TonIn FALSE. Следовательно linkRndGreenQualified(k)=TRUE ⇒ in_False(k)=FALSE, и
And24.AndIn2 логически следует из AndIn3 (And24 order237 > 135). Кроме того
And23.AndIn2 = Network6/FBAnd1 = `b_Step3 ∧ !in_False` (order51, reference-guard).
Запуск probe (PROBE_RESULTS.json): 20 сценариев C01–C03 и окно p+495…503,
импульсы 1/2 скана — F1 и MU06 **идентичны**. Пределы: модельный стенд
(sal-runtime), b_Step3 — cut Network3; эквивалентность доказывается структурой
(порядок исполнения и семантика safeTon), не native runtime.

Рекомендация тестировщику (решение — его): MU06 пометить EQUIVALENT со ссылкой
на цепь выше; для убийства реальных guards C01/C02 строить мутанты
GATE_001.AndIn2 Deactivated, Network6/FBAnd1.AndIn2 Deactivated и их сочетание
с And24.AndIn2 — ожидается, что C02 убьёт мутант без GATE_001 guard
(квалифицированная зелёная доставляется после очистки входа).

## 4. ID матрицы

BTN-003, BTN-007, EMG-001, EMG-005 — добавлены критерии C01–C03; статусы
не меняются (OPEN). C04 зависит от E2.
