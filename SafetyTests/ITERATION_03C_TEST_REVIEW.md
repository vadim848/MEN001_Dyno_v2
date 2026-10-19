# Независимое ревью03C Phase A — red tests

2026-10-19. Проверены timer-observed-clock.test.js, ObservedSamples,
03C_CLOCK_RED_BASELINE.json, ITERATION_03C_TESTS_READY.md и утверждённый
план03C. Runtime/SAL/SGVL этой фазой не менялись; реализацию ревьюер не менял.

## Вердикт

Пакет тестов принят как исходная проверка нового observed-edge clock договора.
Существенных замечаний нет; можно фиксировать честный red checkpoint перед
runtime phaseB. Это не приёмка clock реализации и не SAL03B.

Самостоятельно воспроизведено101 tests:9 PASS/92 FAIL/0skip. Распределение
совпадает с baseline:80 TON +8 ESTOP +4 exact250 causal FAIL. Это выявление
несоответствия старой interval модели новому instrumentation договору,
не92 новых дефекта неизменённой программы TwinSAFE.

## Проверенные свойства oracle

- Scheduler регистрирует первую выборку отдельно, first sample timestamp0,
  а second sample ровно first+delta; автоматическая проверка delta и счёт
  сканов исключают extra polling scan. Не допускается off-grid advance.
- Изолированы20 actual configured TON на1/2/5/10мс, параметры сохранены.
  Проверяется внешний output в последней выборке до threshold и на threshold,
  затем удержание/прерывание/полный повтор. Это не зеркалирование private
  memory поля elapsed; старое начисление первогоdt действительно обнаружено.
- ESTOP100/250 подготовлен настоящими Restart high/falling samples.
  Проверяются startupFALSE, immediate drop, delayed до/на пороге,
  отсутствие автоматического restart после восстановления и новое окно
  после нового reset. После correction поздние assertions должны исполниться;
  текущий red результат не выдаётся за доказательство этих поздних assertions.
- Causal synthetic primitive trace имеет snapshot order1, captureAND2,
  primaryAND3, helper4. Первичный AND вызывает loss в том же sample;
  вторая кнопка влияет на реальный captureAND. Helper output не подставлен.
  До/ровно/после250 проверяются на четырёх представимых сетках, AFTER на250
  отдельно FALSE. Правильный parameter250 не заменяется251.

Synthetic helper — доказательство семантики clock и порядка примитивов,
не фактического графа03B. Actual03B всё ещё потребует своего causal trace
после интеграции. EStop EDM/group lifecycle и произвольные скачки времени
не объявлены покрытыми; аппаратная/native точность не заявлена.

PhaseB обязан сохранить эти oracle и qualitative historical expectations,
дать пофайловую хронологическую миграцию и pre/post functional delta при
неизменных SAL/SGVL SHA. Нельзя произвольно сдвигать ожидания до зелени.
