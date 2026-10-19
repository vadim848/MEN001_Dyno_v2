# Статус и план — 2026-10-19

## Последний принятый результат

03B/R3 и последующий PLC pulse LV/HV fix приняты независимым ревью
в ограниченном программном объёме.
**178/178 harness,75/75 historical,321/321 current;
201PASS/1FAIL/5NOT VERIFIED/0ERROR.** Проект в целом НЕ принят.

SAL SHA256: dd9fd938fd5493795a7eea7b29cb027d7e994e2a55e2ad02d2ca66cb4beb6923.
GVL1.sgvl SHA256:06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5.
253 блока из255; прежние timer values сохранены. Checkpointb5692c3 содержит
принятые03B/R3 и reviewed PLC pulse red tests; последующее принятое исправление
PLC pulse пока рабочий diff. Ревью:PLC_PULSE_IMPLEMENTATION_REVIEW.md,
03B_R3_REVIEW.md и ITERATION_03B_REVIEW.md. PLC_PULSE_CURRENT_RESULTS.json
связывает текущие source/model/artifact hashes и48 тестов; R3_CURRENT_RESULTS.json
сохраняет предыдущие86+69 трасс. Прежний03B_INTEGRATED_ACCEPTANCE.json
исторический, с ограничением старой pair-модели.

Остался прежний STATE:conflicting-set-requests и5NV; все41 требования обязательны.
Узкий LV/HV Set recovery gap закрыт: прежний PLC permission producer подключён
к AndIn4 обоих Set guards.48 тестов36PASS/12FAIL→48PASS;0 новых блоков,
Reset/timers/order/SGVL/runtime неизменны. Реальные producer/guard/RS с явными
state cuts; полная достижимость и все emergency owners этим не доказаны.

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
| 03B/R3 | Actual R&D recognizer253 blocks,69 physical +86 pair tests PASS; shared native pair model, full41 scope остаётся открытым |

07 учитывает реальный порядок: EStop21 читает предыдущий PLC producer95,
finalUnlock209 поэтому имеет отдельный текущий PLC guard. NC1/PLC первичный
fault и возврат входа без Restart проверены в Safe/R&D. Это не полное EMG007
для NC2/Mentee/всех промежуточных фаз. Общий energyPermit в Unlock не добавлен:
он ввёл бы необоснованные запреты доступа в Safe.

Точные изменения, SHA и ограничения: ITERATION_*_IMPLEMENTATION/REVIEW в SafetyTests.
Матрица всех41 обязательных ID: SafetyTests/SOFTWARE_ACCEPTANCE_SCOPE.md.

## Следующие шаги

1. EarlySTO: действующие EARLY_STO_ORDER_REVIEW_PLAN.md и
   EARLY_STO_TEST_FIXTURE_PLAN.md. Два четырёхвходовых per-drive Set guard
   дадут255, сохраняют относительный прежний порядок и передают SU за два
   скана без C2/Healthy ожидания. Старый tail-перенос — альтернатива;
   same-scan не требование пользователя. Fixture расширяет наблюдения опцией,
   исходные69 сценариев неизменны; реальные STO/PLC/confirmation outputs и
   acceptedSU дают163-block dependency closure с явными phase cuts.
2. После технического ревью fixture — actual red tests: реальный жест/SU,
   C2FALSE и оба Healthy значения, no STO before N+2, дальнейшие сохранённые
   feedback/confirmation действия, oldSet/Reset/PLC waveforms и fault/pulse.
   Тесты/review/checkpoint до дальнейшего изменения SAL; no seed SU/STO latch.
3. Затем реализация двух guards/двух SU inputs по плану, целевые/полные проверки,
   независимое ревью. Не менять mainEStop/таймеры/legacy actions ради зелени.
4. Полные Safe↔R&D↔Run, emergency owner/recovery, startup/Network4,
   Safe/Run recognizer и остальные41 mandatory ID. Branch PASS не закрывает
   full reachability; неизвестную реакцию не выдумывать.

## Принятый03B/R3 и границы доказательства

- Compact253: net44 новых блока, три исходных TON перемещены с прежними IDs/
  значениями. Full-source SAL/SGVL audit перед срезами; исходные guards сохранены.
- Original61 red28PASS/33FAIL →61PASS;8 дополнительных rearm controls →69PASS.
  R1 устранил подготовку после2000 без добавления задержки; R2 разделил
  retained Up и новое событие, fresh positive после явного phase exit/reentry.
- R3 red86:56PASS/30FAIL →86PASS. SDK доказал master/slave activation/contact;
  ошибочный helper Both заменён на `Single-Channel 1 Activated`. Старые main
  EStop ports/SGVL не менялись. NC2 и invertedMentee активны через master;
  прежний own-slave BothDeactivated не доказывал неактивность.
- Один resolver используется runtime, demanded closure, static graph и inventory.
  Master contact применяется один раз; unsupported/active-unbound не получают
  выдуманный BOOL. Исторические ложные host expectations исправлены поSDK,
  source fixtures неизменны. NativeError остаётся FALSE stub, не no-fault proof.
- Final case statuses против218dde5 не изменились;32 NC2/Mentee trace corrections
  и92 fallback metadata deltas объяснены в companion. Независимые86+105+21+74
  checks и дополнительный12-case4-pair probe PASS, hashes0mismatch.
- Typed Network3 phase boundaries остаются инъекциями:145 actual blocks,
 113 typed boundary records не доказывают full reachability/group lifecycle.
  Whole41 acceptance, late full-owner rollback, all emergency contexts не закрыты.

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
d86925a принятая05+red07; c69bc32 принятая07+red03B;
218dde5 непринятая03B+reviewedR3red; b5692c3 принятая03B/R3+reviewed PLC pulse red.
Текущий рабочий diff — исправление PLC pulse Set guards, ещё не принятое.

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
