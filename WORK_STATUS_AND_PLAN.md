# Статус и план — 2026-10-19

## Последний принятый результат

Iteration07 принята независимым ревью. Полный пакет:
**174/174 harness, 75/75 historical, 112/112 current;
172 PASS /29 FAIL /5 NOT VERIFIED /0 ERROR**.

SAL SHA256: bf110ab452a5d9d3fcafd1acc5ab657b993e3e2828f384a63c1491c57b2cdcc6.
GVL1.sgvl SHA256: 508610b92e60ae602a75952113b34f7a8bd9c3f283fbb93dfa45b6a532f0a3ba.
Функциональных блоков209. Параметры прежних таймеров сохранены.
Проект в целом НЕ принят; успешные unit tests не закрывают обязательные пробелы.

## Объём и источники

Работа только в MEN001_Dyno_v2, ветка Safety-Develop_2. Reference только для
чтения: соседний MEN001_Dyno, ветка Prodoction,
commit4495a1f6049f6a58ebfd436761faa84d17c8d643. R&D — добавленная устойчивая
остановка внутри исходной полной последовательности; сохранять исходные действия,
кроме явно согласованных изменений. Последнее относящееся решение пользователя
выше прежних решений, далее утверждённые требования и сохраняемый reference.

Разрешены локальная программная логика, обычные переменные/связи, тесты,
итерации и checkpoint-коммиты. Hardware mappings/каналы/групповые настройки,
оборудование, push и развёртывание не разрешены. Native Verify/Build/CRC и
аппаратная валидация вне этой программной приёмки; не делать скрытый gate.

AGENTS.md и WORKFLOW.md обязательны: отдельные аналитик, архитектор, редактор,
независимый ревьюер; ведущий координирует. Один writer на файл. Неизвестное
поведение не превращать в oracle; после чтения источников спросить пользователя,
продолжая независимые работы. Тесты не ослаблять ради PASS.

## Последние согласованные решения

- Single blue/green500мс, BOTH1000мс от второй кнопки, непрерывно обе ON.
- Chord window250мс включительно, обе очередности. Release filter2000мс сохранён.
- Вторая позже250 до принятия single: нет single/up, без fault, очистка обеOFF+фильтр.
  После принятия single: нет отмены/rollback/прерывания и новой команды до очистки.
  Ровно500мс single имеет приоритет; green снимает удерживаемый Unlock.
- Краткая потеря одной кнопки в chord сбрасывает BOTH-таймер; возврат обеих требует
  нового полного1000мс. Это не разрешает деградацию в одиночную команду.
- StartingRun: снять STO при принятом запуске без ожидания C2/HV Healthy;
  это программная обработка, не физическое нулевое время. Run confirmation и
  аварийные разрешения сохраняются. Реализация раннего STO ещё не готова.
- После разговора с инженером Нивом: in_Door_Monitor только для соленоида.
  Energy advance guard проверяет BOTH in_InterLock_NC_1/2, а не in_ES_NC_1/2.
  Прежнее сохранение DoorMonitor в energy guard отменено. Реализовано в06,
  три исходных Door unlock consumers сохранены. Это не hardware validation.

## Выполненные пакеты

| Пакет | Принятый результат и предел |
|---|---|
| 01 | Final Unlock: grant AND blue AND NOT green; дополнен07 |
| 02 | LV Set current-permission guard, реальные producers/paired first fault |
| 04 | HV Set current-permission guard;12 старых FAIL закрыты |
| B1/R2 | Native alias/global/wire structure исправлена; full-source namespace/usage/conflict validator; структурная переприёмка01/02 восстановлена |
| 03A | Реальные timing/late/rearm сценарии и непрерывное наблюдение; это тесты, не recognizer fix |
| 03C | Единый observed-fixed-scan-v1 clock;101 новых clock tests, qualitative oracles сохранены; sourceSAL/SGVL не менялись |
| 06 | Door заменён обоими InterLock в N12/And16;36 tests PASS;0 новых FB |
| 05 | Mentee TRUE блокирует новый LV/HV Set;15 tests PASS,4 старых FAIL закрыты; latched outputs/Reset сохранены |
| 07r2 | Final Unlock: EStopOK AND NOT current PLC stop дополнительно;28 tests PASS,2 старых FAIL закрыты;0 новых FB |

07 учитывает реальный порядок: EStop21 читает предыдущий PLC producer95,
finalUnlock209 поэтому имеет отдельный текущий PLC guard. NC1/PLC первичный
fault и возврат входа без Restart проверены в Safe/R&D. Это не полное EMG007
для NC2/Mentee/всех промежуточных фаз. Общий energyPermit в Unlock не добавлен:
он ввёл бы необоснованные запреты доступа в Safe.

Точные изменения, SHA и ограничения: ITERATION_*_IMPLEMENTATION/REVIEW в SafetyTests.
Матрица всех41 обязательных ID: SafetyTests/SOFTWARE_ACCEPTANCE_SCOPE.md.

## Следующие шаги

1. Обновить source/netlist03B после принятой07, сохранить её typed bindings.
   Полный первый граф290 не помещается в native предел255. Компактный граф254
   прошёл техническое ревью/36 воспроизводимых design checks, но это НЕ actualSAL.
   Оптимизация до253 принята техническим ревью: удалён только новый
   дублирующий InterLock guard; исходная последовательность не удаляется.
2. Пакет03B actual-source61 tests принят:28PASS/33FAIL на старом SAL.
   Фиксировать честный checkpoint до редактора. Нормативная проверка sharedE
   закрыта: R&D потеря InterLock/connector=Emergency, старый permissive code
   не oracle; это не Safe connector absence. Затем интеграция physical R&D с native
   ESTOP off-delay250, существующими TON500/1000 и release2000, все native
   wrappers/usage IDs/order map. Не выдавать отдельную модель за реализацию.
3. Обновить candidate/current selections: весьSAL/SGVL audit до срезов,
   новый network+N12+реальные dependencies, явные boundary injections.
   Старый N12-only срез не должен скрыть отсутствующий producer fallbackTRUE.
   Observer непрерывен с первого sample, включая запрещённые краткие импульсы.
4. Реальные03B traces:249/250/251 при1мс, ближайшие точки сеток2/5/10,
   single499/500, BOTH999/1000, late300/500/600, piano/swap/flicker,
   held-at-start/release/repeat, сохранение SG/SU до реального выхода изR&D.
5. Независимое ревью и циклы исправлений. Затем earlySTO/исходная полная
   последовательность и оставшиеся обязательные требования; не завершать по
   одной зелёной ветви кнопок.

EARLY_STO_PROGRAM_PLAN.md пока NOT READY: два независимых STO Set пути
имеют stale requests; простое SU→OR недостаточно. Нужны два Set guard либо
доказанное эквивалентное решение. Бюджет после компактного03B — явное ограничение.

## Решения пользователя, которых ещё не хватает

- Новый PLC Run11 вместо10 /Safe00 изR&D при отпущенных кнопках и обоихNCTRUE:
  достаточно ли нового PLC запроса либо обязательны физические both/green?
  Удерживаемый код не новая команда. Вопрос задан здесь и передан координатору;
  ответа пока нет, самостоятельную PLC policy не придумывать.
- Down во время уже начатого перехода, точный fault destination при конфликте,
  некоторые completion/recovery сценарии остаются не определены источниками.
  OPEN_SCENARIO_SOURCE_REVIEW.md фиксирует доказанное и границы.
- DISCHARGE_PROGRAM_CONTRACT.md: reference использует выдержки/свою команду
  разряда, отдельного подтверждения completion/timeout не найдено. Не invent
  новый feedback смысл/число timeout; нужный пользовательский сценарий записан.
  Таймаут→TransitionFault/запретUnlock/нетauto уже задан SPEC, повторно не спрашивать.

## Checkpoints и воспроизведение

Локальные, без push:
f7b4f7e исходный пакет+01; c024651 пакет02;
9ef945c B1/R2+03A;0e4ab09 HV04;b0184eb red03C;
e6ee0db принятая03C+red06;930d6a1 принятая06+red05;
d86925a принятая05+red07. Принятая07 пока рабочий diff до следующего checkpoint.

Baseline workflow-2026-10-18 (manifest/архив/результаты/fixture) неизменяем.
UpgradeLog3/4 посторонние, никогда не включать. Не реконструировать историю
reset/stash/откатами. Перед передачей редактору фиксировать честные red tests.

Запуск: cd SafetyTests; npm run check:software. Exit1 ожидаем при FAIL,
не повод менять oracle. Все41 программное требование обязано иметь достаточное
positive/negative actual-code покрытие; необъяснённых FAIL/mandatory NV и
существенных review замечаний не должно остаться. Group startup/Network4,
полная достижимость фаз/owner/accepted requests и emergency completion ещё
не закрыты. Native/hardware outside scope не заменяет программное доказательство.

Состав первоначальных ~33тыс строк и полный список файлов:
LOCAL_CHANGES_REPORT.md (исторический снимок) и CHANGES_REPORT_2026-10-19.md.
Основной объём — копия baselineSAL и generatedJSON, а не новый PLC-код.
