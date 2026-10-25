# 03C Phase A — tests ready, честный red baseline

2026-10-19. Только новые тесты и scheduler; SAL, SGVL, runtime и существующие
qualitative expectations не изменялись. База reviewed04 checkpoint0e4ab09.
SAL SHA6ed0c79094a2530be3ab9323abb832d88e56d60c9bb19773f03a32367b6d7ad5.
Runtime/test SHA, дата и список FAIL:03C_CLOCK_RED_BASELINE.json.

Новый fixed-grid ObservedSamples отдельно регистрирует первый sample и
timestamp; observeAfter автоматически проверяет фактическую delta.
Сетки1/2/5/10мс фиксированы, partial final scan и off-grid delta запрещены.
Чтение get не двигает время; second input поступает ровно в нужный sample.

101 тест на неизменённом interval-runtime:9 PASS /92 FAIL /0 skipped, exit1.

- 80FAIL: все20 реально сконфигурированных TON × четыре сетки. Исполняются
  изолированные копии actual blocks с их неизменными параметрами. Включены
  500/1000/2000мс, все прочие configured значения. Внешний output должен
  оставаться FALSE в последнем representable sample перед delay от observed
  edge, но старый runtime уже даёт TRUE. Проверка не ограничивается сравнением
  внутреннего elapsed с0; последующие сценарии задают hold, interruption и
  полный rehold, которые должны исполняться после исправления модели.
- 8FAIL: EStop100/250 × четыре сетки. Настоящая high→fall Restart sequence,
  startup windowFALSE, loss immediateFALSE/delayedTRUE, delayed до threshold,
  thresholdFALSE, отсутствие auto-restart при восстановлении и новый reset.
  Старое начисление первогоdt теряет delayed на последнийsample раньше.
- 4FAIL: exact250 causal BEFORE-helper capture. Synthetic primitive proof
  snapshot→captureAND→primaryAND→ESTOP, а не инъекция готового delayed output.
  Первичная кнопка через AND вызывает loss в том же sample; вторая идёт через
  dispatcher и реально участвует в captureAND. На старом runtime граница250
  уже FALSE; параметр не увеличивался до251.
- 9PASS: dispatcher chronology плюс nearest-grid before/after controls.

Для causal proof используются explicit synthetic/injection primitives:
это проверка времени стенда и будущего ordering, не actual03B SAL и не
закрытие BTN requirements. Actual SAL baseline166PASS/35FAIL/5NV относится
к прежнему согласованному пакету, отдельно от этих92 новых instrumentation
FAIL. Полный пакет сейчас не объявляется зелёным: новые tests намеренно
показывают проблему часов. Существующие current/historical timelines ещё
не мигрировались и runtime phaseB не начат.

Воспроизведение: `cd SafetyTests; node --test test/timer-observed-clock.test.js`.
Запись остановлена для проверки и checkpoint перед runtime phaseB.
