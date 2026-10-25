# SafetyTests

## Действующий программный пакет (2026-10-18)

`npm run check:software` запускает раздельно стенд/модели, исторические
воспроизведения и проверки **рабочего SAL**. Результаты:
`SOFTWARE_CHECK_RESULTS.md` / `.json`; SHA256 и допущения включены.
Exit: 0 — все проверки пройдены; 1 — FAIL; 2 — только пробелы покрытия;
3 — ошибка запуска/проверки. Последующие исторические записи с прежними
числами не заменяют этот отчёт.

Аппаратная конфигурация принята как исходное условие; аппаратные проверки и
развёртывание вне текущего задания. Предыдущие требования физической трассировки
не блокируют программные проверки. Условия входов моделируются как заданные.
Таймеры SAL проверяются по текущим значениям; пользователь утвердил single
0.5с / both 1с вместо предварительных 1/2с. Подробный объём: `../AGENTS.md`.
Концептуальные модели со старыми defaults пока исторические до их синхронизации;
они не являются oracle текущего SAL. Решения: `SCENARIO_DECISIONS.md`.
Реальный holdgate iteration01 принят независимым ревьюером;
`ITERATION_01_IMPLEMENTATION.md` / `ITERATION_01_REVIEW.md`.
Итерация02 LV Set guard также принята независимым ревьюером. Последний пакет:
71/71 стенд, 75/75 история, 9/9 current SAL suites; 144 PASS /35 FAIL /3 NOT VERIFIED.
Последующий03A принят как расширение проверок безSALdiff:73/73 стенд,
75/75 история,10/10 current suite;152 PASS /49 FAIL /5 NOT VERIFIED.
14 новых FAIL отражают новое точное покрытие, не регрессию кода. Проверяются
все сканы отрицательных интервалов, включая короткие запрещённые импульсы.
Генерируемые latest JSON компактны; человекочитаемый отчёт — `.md`.
Latest приоритеты и обязательное покрытие: `SCENARIO_DECISIONS.md` и
`SOFTWARE_ACCEPTANCE_SCOPE.md` (41 ID). Chord window утверждён250мс включительно,
single0.5с, BOTH1с с появления второй; поздняя вторая не откатывает уже принятый single.

Компонентные проверки TON/RS/состояний и установленные начальные фазы явно
обозначены; они не являются полной эмуляцией группы. Исторические alias-тесты
`sal-conformance.test.js` и `signal-bindings.test.js` остаются доступны через
`npm test`, но не входят в программную приёмку. Регрессия стенда содержит и
проверки вспомогательных моделей; её зелёный результат не означает приёмку SAL.

Current work status, acceptance criteria and next steps:
`../WORK_STATUS_AND_PLAN.md` (2026-10-18).

Latest adapter audit: `SAL_ADAPTER_SEMANTICS.md`. Default execution now uses
group-wide SAL block numbers; historical network-local order is explicit only.
Unconnected-input fallback assumptions are recorded and remain unvalidated.
Current regression: 153 passed, none skipped; model mutations 5/5.

Timer continuity experiment: `TIMER_CONTINUITY_REPORT.md` and
`npm run design:timers -- --write`; synthetic fixture only, not target timing.

Native timer/startup and complete boundary table:
`NATIVE_TIMERS_STARTUP_BINDINGS.md`. Regenerate SAL/SDS source metadata with
`npm run audit:bindings -- --write`; StandardAliasDevice is not safe proof.

Integrated host contract: `INTEGRATED_CONTROL_REPORT.md` and
`npm run design:integrated -- --write`; five checks, no candidate SAL binding.

Isolated conceptual prototype: `BUTTON_COVER_PROTOTYPE.md`. Its seven contract
tests do not run the candidate SAL or establish native TwinSAFE equivalence.

Accepted-transition prototype: `TRANSITION_REQUEST_PROTOTYPE.md`; six checks
cover pulse retention, completion/guards, emergency ownership and integration.

Native connection design: `NATIVE_BLOCK_MAPPING.md` and
`npm run design:native -- --write`. Generated core has unresolved external
boundaries; it is not importable/verified SAL and does not drive outputs.

Native-style owner: `NATIVE_OWNER_MAPPING.md`, regenerated with
`npm run design:owner -- --write`; five comparison/guard tests, no live binding.

Twelve historical reproduction suites now read the hash-pinned fixture in
`fixtures/v2-4bb8703/`, not the working SAL. Audits and structural/semantics
checks still inspect the working candidate. Required-behavior candidate
acceptance remains incomplete: see `ACCEPTANCE_BACKLOG.md`.

Candidate button/cover acceptance: `npm run acceptance:candidate -- --write`.
Current result: 2 PASS, 14 FAIL, 3 NOT VERIFIED (expected nonzero exit).
Read `CANDIDATE_ACCEPTANCE_REPORT.md`; a green regression suite is separate.

Input inventory: `npm run audit:inputs` (console), or
`npm run audit:inputs -- --write` (refresh `SAL_INPUT_INVENTORY.json`).
Read `SAFETY_EVIDENCE_MATRIX.md` for current bindings, scope and open inputs.
Inventory findings do not represent a safety acceptance result.

Phase observations: `npm run audit:phases -- --write` regenerates
`EMERGENCY_PHASE_MATRIX.json`; read `EMERGENCY_PHASE_REPORT.md` for scope and
control comparisons. Its 144 cases are observations, not acceptance passes.

Независимый тестовый стенд для требований из `../SAFETY_STATE_MACHINE_SPEC.md`.

Запуск:

```powershell
cd SafetyTests
npm test
npm run test:mutations
npm run audit:xml
npm run audit:sal
```

The SAL runtime executes the boolean/timer/latch subset directly from the v2
TwinSAFE XML. Unsupported safety blocks are reported explicitly; they are never
silently treated as passed.

Стенд намеренно не изменяет файлы TwinSAFE. Модель является исполняемой спецификацией, а не эмулятором сертифицированного TwinSAFE Runtime.

Текущая первая версия проверяет:

- фильтр очистки и распознавание одной/двух кнопок;
- запрет деградации двухкнопочной попытки в одиночную;
- основные переходы `Safe -> R&D -> Run`;
- штатный `Run -> R&D` через SS1 и discharge;
- немедленный STO при потере Healthy;
- полный coast wait после аварийного STO;
- запрет отключения C2 без завершения discharge;
- доминирование E-Stop;
- базовую структуру и ключевые термины TwinSAFE XML.

Подробные человекочитаемые сценарии находятся в `scenarios/`. Первый сквозной сценарий — `COVER_SAFE_TO_RND.md`.

Открытые параметры и ещё не реализованные тесты перечислены в `../SAFETY_TEST_PLAN.md`.

Проверка переноса checkpoint (2026-10-18): 68 тестов прошли, 1 пропущен.
`V2-EMG01` сравнивает конфигурацию с исходным стабильным SAL из соседнего
репозитория `MEN001_Dyno`; этот файл не входит в данный checkout. При его
отсутствии пропускается только историческое сравнение, остальные Emergency
проверки выполняются. Утверждение об идентичности исходной версии здесь
повторно не подтверждено.

После добавления соседнего репозитория `MEN001_Dyno` путь скорректирован:
все 69 тестов проходят без пропусков, включая сравнение назначений входов
E-Stop с добавленным исходным SAL.

Mutation runner запускает только тесты эталонной модели и распознавателя
кнопок, нормализует CRLF перед заменами и отклоняет ошибки загрузки модулей.
Все 5 внесённых дефектов обнаружены проверками поведения модели.

Текущий итог 2026-10-19 после принятой iteration04: 73/73 harness, 75/75 historical, 33/33 current; 166 PASS / 35 FAIL / 5 NOT VERIFIED. B1/R2 закрыты. Отчёты ITERATION_04_IMPLEMENTATION.md и ITERATION_04_REVIEW.md. Новых FAIL нет; полная приёмка открыта.
