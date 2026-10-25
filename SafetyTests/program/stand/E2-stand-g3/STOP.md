# STOP — E2-stand-g3 (v2-stand-engineer, 2026-10-23)

Остановлено по указанию Вадима через ведущего. Существующие файлы src/ и test/ не менялись, откатывать нечего.

## Сделано
- **П.4 дельты frozen E2d.** Новый скрипт `scripts/e2-frozen-delta-check.mjs`. Он переводит `slices[E2d].rationale.v75.declaredDelta.<key>` в точные нативные атомы и сравнивает их с наблюдаемыми в обе стороны. Дополнительно проверяет SHA из PLAN, счётчики до/после, порядок исполнения (`order`/`orderNotes`) и diagram.
  - Результат на PLAN.v7_7 (c71f9a54) и на текущем PLAN.json (bf55168d, v7.8): **PASS** для V741 (a5acf291→2276d773), V75 (2276d773→e4cf767e, 24 атома) и V76 (e4cf767e→c2f9ccd7, 8 атомов).
  - NV: PLAN не объявляет SGVL/diagram для v7.4.1 и v7.5.
  - Контрольный негативный прогон (перепутанные пары): FAIL, как и должно быть.
  - Логи и отчёты: `e2-frozen-delta.plan-*.log`, `E2_FROZEN_DELTA_CHECK.plan-*.json` в этой папке.
- **П.3 D2.** Счётчик верный: 34 = 1 harness + 33 current, тест ожидает [0,1,0,33]. В рабочем дереве D2 проходит, 4/4. В изолированном F1 D2 падает по другой причине: в `CLOSURE.files` (`src/stand-sandbox.js`) нет файла `program/tester/E2-G1/HANDOFF_v8.md`, а тест его читает. Исправление — добавить строку в CLOSURE. **Не внесено.**
- **Задел для п.1/п.2, новые файлы.** Нигде не импортируются и на стенд не влияют:
  - `scripts/build-declared-sources.mjs`;
  - `fixtures/declared-sources/E2_DECLARED_SOURCES.json` — 10 источников, SHA сверены с PLAN v7.7 и v7.8, inventory BOOT для каждого кандидата;
  - `src/declared-sources.js` — lineage по SHA и `SAL_LINEAGE_SHA256`;
  - `src/state-grant-norms.js` — нормы STATE F1/R1/E2a/E2b по `mechanism.grants`.

## Не сделано
- П.1. Перевод кейсов STATE в `src/current-code-checks.js` на `state-grant-norms` не сделан. То же для ESTOP: нужен явный реестр разрешений FBOrIlRunOk/linkSafeConnectorScope вместо тихого FALSE. Не передан `SAL_LINEAGE_SHA256` в `sal-mutation-check.js`.
- П.2. В `src/boot-preflight.js` не добавлен приём объявленного кандидата по реестру. Там нужен N/A для Network4.
- П.5. Не сделан PRIORITY:Step12:ExternalNC1/2: по E2b-dev CRITERIA §2.3 LV должен совпадать с контрольной трассой, ожидаемо 4× PASS→FAIL на F1.
- Не добавлены npm-скрипт и stand-тесты. Регресс «после» не прогонялся.

## Состояние check:software на F1, до изменений
Изолированная копия без .git:
- exit 3;
- harness ERROR 283/284 (D2, причина — отсутствующий HANDOFF_v8.md);
- historical 75/75;
- current 598/1638;
- SAL cases: PASS 199, FAIL 1 (STATE:conflicting-set-requests, как было), NV 7.

Лог: scratchpad `g3s/f1-before-check.log`.
