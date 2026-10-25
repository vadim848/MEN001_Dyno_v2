# Независимое ревью07 Phase A — Unlock RED пакет

2026-10-19. После STOP редактора проверены current-unlock-estop-permit.test.js,
07_UNLOCK_RED_BASELINE.json, ITERATION_07_TESTS_READY.md и revised plan07r2.
Код/источники ревьюер не менял.

## Вердикт

Пакет принят к checkpoint перед SAL07. Существенных замечаний нет.
Самостоятельно воспроизведены28 tests:17 PASS/11 FAIL/0skip.

Safe/R&D healthy positive controls исполняют реальные grant producers,
FBAnd1/FBEstop1 с ручным high/falling Restart, grant latch и final writer.
Fault/recovery traces отдельно проверяют причинный EStopOK: NC1 сразуFALSE,
PLC в первом sample ещёTRUE, затемFALSE при сохранённом fault producer,
в том числе при восстановлении после односканового pulse. Только после
этого проверяется UnlockFALSE на first fault/restored/later samples.
Подстановка EStopOKFALSE и ожидание100мс не маскируют исходную ordering
проблему. Фоновый grant/blue остаётся действующим в actual producers.

16-строчная final component таблица различает blue/green hold, latched
EStopOK и rawPLC; два structural RED требуют именно SGVL/index и отдельный
inverted alias target usage. Healthy grant при отсутствующих energy
connectors/InterLocks остаётся положительным component control, не новым
разрешением полного аварийного source. Три Door consumers и inactive
EStopIn2/4 сохраняются. NC2/Mentee/full EMG-007 не объявлены закрытыми.

Whole source B1 audit выполнен до подграфа; Safe/R&D state inputs явно
задают компонентную границу. Полный restart gesture/reachability не
подменены выдуманным oracle. Actual SAL/SGVL/runtime не менялись фазойA;
RED11 отражает исходные несоответствия узкому плану07, не новую регрессию.

После реализации обязательны exact port4/5 +global wrapper/SGVL usage+
PLCalias fanout delta, прежние Door/blue/green и source/timer/order invariants,
тот же targeted пакет и полный запуск с честными остаточными FAIL/NV.
Native/hardware validation не заявляется и не является скрытым gate.
