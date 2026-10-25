# 03C Phase B — единый observed-edge clock

2026-10-19. Tests-first checkpoint b0184eb сохранён до runtime исправления.
Рабочий SAL/SGVL и параметры таймеров не менялись; git diff против reviewed04
checkpoint0e4ab09 пуст. SAL SHA6ed0c79094a2530be3ab9323abb832d88e56d60c9bb19773f03a32367b6d7ad5.
SGVL SHA194b4b14511b9775ea12294fdab9518875c7aeb0f2a43994110550001dea8089.

## Договор и реализация

Clock contract `observed-fixed-scan-v1`: первое наблюдение enabled/loss имеет
возраст0, последующие фиксированные samples увеличивают возраст на scanMs.
TON единообразно хранит previousEnabled; прерывание сбрасывает возраст и
при повторном входе начинается полный новый отсчёт. EStop первый переход
enabled→disabled устанавливает offElapsed0. Restart/immediate/delayed логика
и startup без ложного delayed окна сохранены. Нет special-case250, изменения
параметра на251, legacy fallback для current acceptance или счётчика по имени.

ObservedSamples вынесен в src для совместного использования actual-case
generators и tests. Test helper переэкспортирует тот же код: независимые101
clock tests проверяют именно используемый scheduler. Он регистрирует первую
выборку отдельно, вторую фиксирует через delta−scanMs и проверяет реальные
timestamps. Сетки1/2/5/10 фиксированы, off-grid duration отклоняется.
Generic runFor остаётся продвижением заданного числа samples; его duration
сам по себе не объявляется возрастом вновь поступившего события.

## Перевод старых хронологий без изменения качественного oracle

| Test/case | Старое interval counting | Новые observed timestamps / сохранённый смысл |
|---|---|---|
| currentCodeChecks TIMER, все20 TON | Первый TRUE уже начислялdt, delay−dt scans до порога | Отдельно sample первого TRUE age0; затем delay−dt FALSE, следующий sample exactdelay TRUE; повтор после reset аналогичен |
| current-timer-one-ms | delay−1 scans включали edge | Отдельный edge sample, затем age delay−1/ delay/ delay+1; все старые output ожидания сохранены |
| candidate ACC-B02-G/B | 490мс включали первый sample | edge0, age490 outputFALSE, age500 TONTRUE, age510 downstreamTRUE из-за native global order |
| candidate ACC-B03 IN/EDGE/LATE/490/500/510 обе очередности | Первый hold runFor(delta), потом неявный sample второй | Датированная first sample, observeAfter точная delta; qualification наблюдается в sample второй; BOTH999FALSE/1000/1010 по прежнему oracle |
| candidate BOTH/FLICKER | Первый sample BOTH входил в990 | Отдельный observed BOTH/recovered edge; затем age990/1000/1010, reset требует полного повторного интервала |
| exact03A SINGLE/CHORD/FLICKER | runFor249 и следующий второй sample давали неявный off-by-one | Scheduler задаёт точные249/250/251/500/510 от first sample; BOTH999/1000/1001 от второй/восстановления |
| exact03A late300/600 | Длительность до setInputs без явно датированного события | observeAfter first+300/600; no-command monitor включает сам observed edge и каждый следующий scan |
| exact03A REARM/REPEAT | Неявный edge в runFor | Сначала фиксируется edge, затем весь запрещённый интервал; сохраняется scan-by-scan pulse detection, включая начальную выборку |
| SAL-RUN03 connector | Healthy runFor90+10 включал edge | Отдельный recovery sample age0, затем90FALSE/100TRUE |
| TIMER01 continuity experiment | first scan10 +980 +10 считалось1000 | first observed sample отдельно, после него990/1000/1010; variants missing-start/timer-before-gates всё так же отстают на один scan |
| TIMER02/03 synthetic experiments | Начальный sample входил в1980/1990 | Отдельный первый или recovered sample; затем1990/2000. Fixture1/2с сохранён как явно synthetic experiment, не current user timing |
| Historical V2-BTN02/03 | Первый sample включён в490/990 | Отдельный hold edge, далее490+20 /990+10; blue/downstream/chord qualitative oracle сохранены |
| Historical V2-BTN05/06 | both300 + failed-single210 включали first sample | Отдельный initial chord edge; затем те же300+210 от него: воспроизведение ошибочной деградации остаётся TRUE |
| Historical V2-ESTOP02 | loss sample10 +80 +10 объявлялся100 | Loss sample age0, затем90TRUE/100FALSE. Immediate EStopFALSE и delayedTRUE в первом sample сохранены |

Ни один отрицательный oracle не изменён в expectedTRUE ради результата,
не удалён и не переведён в skip. Source fixture остаётся прежним. Остальные
ненормативные fixed-duration traces сохранили scheduled-scan convention и
не выдаются за измерение event-relative физического времени.

## Результаты и ограничения

Phase A red baseline:101 tests9PASS92FAIL на прежнем runtime.
Теперь те же101 clock tests PASS:80actual TON cases (20×4),8EStop100/250,
12causal before/at/after boundary иdispatcher chronology. BEFORE-helper
snapshot допускает250 на фиксированных сетках; AFTER-helper на250 ужеFALSE.
Первичная кнопка причинно вызывает helper loss через AND, вторая участвует
вcaptureAND. Это primitive time proof, не новая03B SAL реализация.

Полный пакет: harness174/174, historical75/75, current33/33;
166 PASS /35 FAIL /5 NOT VERIFIED /0 ERROR, exit1. Мутации исходного
reference model/кнопочного recognizer обнаружены5/5; это не mutation coverage
всех новых SAL gates. Новые clock tests сами различают старую/новую модель.
Функциональный SAL не исправлялся clock correction; те же остаточные FAIL
и обязательные пробелы остаются видимы. Новое DoorMonitoring решение не
внедрялось этим пакетом: оно требует отдельной реализации/ревью.

Latest JSON reports содержат contractversion, SHA runtime/scheduler/parser,
SAL и SGVL; standalone candidate report также сохраняет contract/runtime/
scheduler SHA. Исторический03C_CLOCK_RED_BASELINE.json не перезаписан.

Fixed-scan model не доказывает native firmware clock и hardware timing;
произвольный jump249→251 и exact249/251 на сетке10 не поддержаны. Native
CRC/Verify/Build, deployment и push не выполнялись. Готово к ревью; запись
останавливается после финального полного воспроизведения.
