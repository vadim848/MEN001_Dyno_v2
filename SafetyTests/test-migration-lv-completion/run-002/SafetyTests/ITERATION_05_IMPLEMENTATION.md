# Iteration05 — текущий Mentee запрещает новый LV/HV Set

2026-10-19. Tests-first checkpoint930d6a1 после reviewed06.
SAL до:23cb1dd91d983b309294936fa8563cf9d669427401d38337c6b3c9647875adf2.
После:ea2443b0ea92f95584496360e103f4f9a8b5fd61bb2f492f88a9a9d60628564e.

## Минимальная реализация

В existing LV/HV SetPermit AND активирован только AndIn3 с Make Contact(NO),
то есть NOT in_Mentee_EStop. Через правильные native SAL targetUsages
существующему alias добавлены два потребителя. Старые четыре потребителя,
source descriptor и SDS/channel не менялись; ложных GVL1.in_* refs нет.
Итог Set=предыдущий aggregate AND прежние восемь current permissions AND
NOT Mentee. Уже latched output при отсутствии Reset не обнуляется.

SAL diff+20/−2: два port flags и два logical usage subtree. Ноль новых
blocks,209orders сохранены, таймеры/runtime/SGVL и hardware не менялись.
Main EStopIn4 всё так же Both Deactivated; новое требование EStopOKFALSE
не вводилось. Existing Safe guard, Run protective route и Reset/discharge
не изменены. Latest Door06 exactbindings/все три unlock consumers сохранены.
git diff --check PASS; SGVL/runtime diff против checkpoint пуст.

## Проверки и результат

Те же phaseA15 tests, до9PASS/6FAIL, теперь15PASS. Четыре real producer paired
traces проверяют LV legacy/Step12 и HV legacy/R&D: aggregateTRUE при latchFALSE,
идентичный следующий healthyMenteeFALSE scan включает output, а текущий
MenteeTRUE уже в первом scan запрещает новое включение. Нет ожидания до
позднего Reset. Два typed-binding tests проверяют alias usage и инверсию,
не host basename. Latched-without-Reset и восемь прежних permission controls
сохраняют прежний oracle. Original Safe/Run guard truth tables и inactive
main EStop configuration также PASS.

Targeted Mentee15+Door36+B1bindings19=70/70PASS. B1 exact fanout metadata
обоснованно расширено только на эти два дополнительных consumers; ожидания
LV/HV gate input activity теперь включают третий inverted input.
Прочие положительные/отрицательные expectations не ослаблялись.

Full npm run check:software:

- harness174/174; historical75/75; current84/84.
- cases170PASS /31FAIL /5NOT VERIFIED /0ERROR, exit1.
- Ровно четыре existing conditional FAIL→PASS: PRIORITY Step12/Step2 Mentee
  при fallbackFALSE/TRUE. Новых FAIL и других status changes нет.

Fullsource B1 namespace/binding audit PASS до component cuts; standalone
candidate и основной отчёт перегенерированы с новым SAL SHA и прежним clock
observed-fixed-scan-v1. PhaseA05_MENTEE_RED_BASELINE.json не перезаписан.

Seeded phase/fallback evidence не доказывает всю emergency процедуру,
non-Run recovery или внешнюю launch policy; эти обязательные пробелы не скрыты.
Нельзя объявлять все EMG выполненными по узкому Set запрету. Native CRC
остаётся recorded872783435, Verify/Build/native/hardware validation не
выполнялись. Reference, historical fixture, .sal.diagram и mappings не
менялись. Push/deployment не было. Готово к независимому ревью; запись остановлена.
