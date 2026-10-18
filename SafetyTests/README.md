# SafetyTests

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
