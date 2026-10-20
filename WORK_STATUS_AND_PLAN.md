# Статус и план — 2026-10-20

## Текущий принятый ограниченный результат

Safe qualification и запрет повторного LV/HV после принятого RnD-down перенесены
в рабочий SAL и приняты независимым post-working review. Source:
`72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e`, SGVL:
`de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56`.
255 блоков; значения всех сохранённых таймеров неизменны. Точный перенос24
файлов и protected core проверен по SHA; все280 входов рабочего прогона
неизменны до/после. Runtime/parser/native pair/clock не менялись.

Рабочий `npm run check:software`: **189/189 harness,75/75 historical,
436/438 current;200PASS/1FAIL/7NOT VERIFIED/0ERROR**, exit1.
Два current FAIL — прежние Run failed-chord→green; сценарный FAIL —
STATE:conflicting-set-requests. 201→200 PASS объясняется единственным удалённым
TIMER://Network2/FBTon3: старый Safe TON заменён реально проверяемым BOTH1с,
обязательные требования не удалялись. BOOT остаётся NV, functionalBootPass0.

Доказательства: working-transfer/FINAL_WORKING_EVIDENCE.json,
CANONICAL_RUN_INTEGRITY.json, DOWN_EPISODE_OWNER_REVIEW.md и актуальные
SOFTWARE_CHECK_RESULTS. Исходный RED checkpoint103a2bd сохранён, без push.
Не объявлять весь проект принятым: реализация нормального LV completion→Safe,
решений Run/StartingRun, вопросы PLC/conflict и полнота41 требований ещё открыты.
Реальный fault-component reset/reentry не заменяет нормальное завершение остановки.

Следующий этап уже поручен аналитику: NEXT_ACCEPTANCE_SCENARIO_AUDIT.md —
разделить независимое testable-now покрытие NC2/Mentee/emergency/recovery,
сценарии с pending user decision и технические ограничения N4/group adapter.
Продолжать независимые проверки, неизвестные реакции не выдумывать.

### Новые решения пользователя и текущая передача

Пользователь явно подтвердил: для завершения RnD→Safe достаточно
`LV_C1_FBK=FALSE` после отключения LV; новую полноценную BOTH в Run
игнорировать; новую зелёную 500 мс в StartingRun после полной очистки
обработать прерыванием запуска по сценарию Run→R&D. Аналитик фиксирует
контекст и критерии до архитектуры/реализации; это пока требования, не
утверждение об уже реализованном поведении.

Пакет A1+A2 NC2/Mentee завершён и независимо принят: **40PASS/0FAIL/0ERROR**,
`NEXT_EMERGENCY_EXECUTION_REVIEW.md`. Это component coverage с реальными
producers/Set/Reset, held-blue Unlock и restore без Restart; не вся EMG/BOOT/A3.

Отдельный baseline новых решений: **8PASS/12FAIL/2NOT VERIFIED/0ERROR**;
`USER_DECISIONS_BASELINE_REVIEW.md` принимает его как RED evidence. Run после
BOTH/invalid chord ошибочно принимает оставшуюся зелёную; StartingRun не
принимает требуемое прерывание, поздний feedback подтверждает Run и лишь
затем прежний Run-down реагирует на удержанную зелёную. LV normal completion
остаётся NV с source-ledger отсутствующего healthy пути при declared N4 cuts,
не с выдуманным сроком завершения. Архитектор готовит узкий LV counted plan,
затем отдельную Run/StartingRun итерацию. Frozen baseline не перезаписывать
candidate прогонами; кандидат требует отдельного output и независимой проверки.

Права записи разделены. Отчёт в исходный голосовой чат отправлен по
прямому разрешению пользователя. Ведущий продолжает приём результатов
и передачу следующим исполнителям.

## Журнал возобновления и подготовки (предыдущие снимки)

Записи ниже сохраняют порядок исследования; их прежние working SHA/HOLD
и ожидаемые действия не переопределяют текущий принятый результат выше.

Локальный RED checkpoint `103a2bd` сохраняет новые правила, независимый пакет,
неизменяемый baseline и изолированный Safe255 с честным no-reenergization FAIL.
Активные архитектурные правки в этот checkpoint не включались. Точные байты
SHA256-пакета защищены .gitattributes; sandbox/большие raw JSON/UpgradeLog исключены.
Рабочий SAL/SGVL всё ещё исходные0fc397…/06010caf… .

Последняя техническая итерация — отдельный down-owner v2:
SAL `72f42daf9c9c53abb13194e175e7569f1fac21dc37a29c009a9eef6eb2a5853e`,
SGVL `de0fa993b87c3f444430f16f6c56b3184b03a0539dbc5b109f8e5dd053bdea56`.
Новый RS отмечает происхождение текущего Step2 от принятого RnD-down,
вычисляется до N5 energy guard и сбрасывается при фактическом выходе Step2.
Общий LVDischarge veto отвергнут как затрагивающий исходные запуски.
V1 устранял no-autoenergy, но менял SG при Safe+RnD; сохранён с HOLD.
V2 сохраняет точный SG, освобождая блок эквивалентным De Morgan в G23.
Независимый static review v2 PASS/255/0binding errors; SG замечание закрыто.
Исполнения регрессии и независимые проверки v2 продолжаются, working SAL HOLD.
Нормальный LV-discharge completion→Safe остаётся отдельным вопросом пользователю;
его отсутствие не заменяется аварийным компонентным reset/reentry proof.

Обновление v2: редактор и независимый тестировщик завершили RnD69/69,
earlySTO88/88, Safe15/15, B1, дополнительные Safe controls, no-autoenergy
(2500мс), legacy Step2 с обычным LVDischarge, реальный fault-component exit/
Restart/fresh attempt/reentry, SG conflict equivalence и De Morgan — PASS.
Ревьюер принял bounded core evidence; полного нормального RnD→Safe это не доказывает.
Независимый test_migration выполняет только own copied-suite migration:
PLCPULSE48/48 на baseline и v2, actual70-block producer cone без ownerFALSE;
CVR непрерывно до500 запрещён, BLUE/BA квалифицируются500, реальный consumer/
grant/Unlock501 по native order. Новые source-observer closures/full-neutral
приняты для холодного прогона. Один ранний full с изменённым observer во время
исполнения явно diagnostic-only; финальный обязан сверять SHA всех входов до/после.
STRUCTURAL_V2_MIGRATION_LEDGER.md задаёт exact delta всех17 старых structural
assertions; сейчас независимые migration и review этого пакета продолжаются.

Причины двух организационных остановок: после отчёта статуса ведущий завершил
ход без запуска исправлений; после запуска специалистов снова завершил ход,
не организовав получение результатов и передачу архитектор → редактор.
Запущенные специалисты могли продолжать свои задания, но завершённый ход
ведущего не обеспечивал дальнейшую координацию. Это не технический запрет SAL.
В WORKFLOW.md и AGENTS.md закреплена ответственность ведущего за полный цикл,
различение running/completed и продолжение после промежуточного отчёта.

По новому поручению пользователя выделен независимый тестировщик `/root/tester`,
отдельно от редактора и ревьюера. Он владеет только
`SafetyTests/independent-safe-resumption/`; редактор — только изолированным
`SafetyTests/candidates/safe-resumption/`. Аналитик владеет сценарными документами,
архитектор — тремя назначенными архитектурными файлами, ревьюер — отдельным
отчётом, ведущий — правилами и статусом. Самопроверки редактора сохраняются.

Кандидат Safe|RnD254 построен отдельно от рабочего SAL: full binding audit PASS,
earlySTO88 PASS, Safe/Run13 PASS/2 прежних Run FAIL, B1 2 PASS,
дополнительные gap checks3 PASS; RnD67 PASS/2 FAIL. Последние два FAIL считают
TRUE-сэмплы FinishUp, а не повторные фронты команды: два вместо одного из-за
чтения CSet предыдущего SU. Архитектор подготовил пересмотренный255 пакет:
сохранить GATE020, ограничить RND_SCOPE и вернуть текущий FinishUp в CSet.
Нужны rebuild, независимые проверки и ревью; принятие не объявлено.

Редактор получил следующий этап rebuild255; независимый тестировщик назначен.
Дополнительно установлено: running аналитика скрывал 2186с ожидания разрешения
на git rev-parse reference; запрос отменён. Сам reference SAL уже прочитан,
поэтому ограниченный анализ продолжается без повторной проверки Git HEAD.
Ведущий проверяет ожидания инструментов остальных исполнителей отдельно от
статуса running. Рабочие SAL/SGVL остаются прежними.
Проверка подтвердила аналогичные ожидания у ревьюера (2227с), тестировщика
(706с) и редактора (345.7с), запросы отменены; повторение/обход запрещены.
Этапы возобновлены с уже прочитанного. Analyst/reviewer дали READY только
изолированному построению/replay255; редактор подтвердил начало rebuild.
Rebuild255 выполнен: SAL SHA256
`64fec23446e0c321b7e7a2b864b5f5bcfb440492ea76a26e94b7695205a14560`,
GVL SHA256 `1981d66fb889882a75346a58c789a5f03c9b4bd03f68d0fe01022d68c6838476`.
Bindings/invariants PASS; raw RnD69/69 PASS без FinishUp remap.
Независимое статическое ревью actual255 не выявило новых существенных замечаний:
ветви Run/PLC сохранены. Рабочий SAL всё ещё HOLD до behavioral и lifecycle
проверок; independent tester выполняет отдельный пакет и условный lifecycle.
Целевые255: RnD69/69, earlySTO88/88, B1 2/2, gaps3/3 PASS;
Safe/Run13 PASS/2 прежних Run FAIL. Полный isolated check честно RED:
harness189/194, historical74/75+1SKIP, current399/428; cases196PASS/4FAIL/6NV/1ERROR.
29 current FAIL разобраны редактором как17 старых structural/order/hash,
2 Run,9 неполных closures новых producers и1 старый immediate-blue oracle.
Диагностические копии closures с прежними assertions дали53/53 PASS;
это не переприёмка исходного fullRED. Независимый тестировщик дал15/15 PASS
на дополнительных границах/аварийных запретах; исходная ошибка Q500 oracle
14/1 сохранена и объяснена, ожидается независимое ревью.

Новый условный RED: независимый actual-N3 replay обнаружил повторное включение
реальных LV/HV command outputs без новой команды после принятого RnD-down,
LV off, LV feedback off и перехода через Step2. Воспроизведено на baseline и
candidate255 при initialSafe и семи явно неактивных N4 границах; это
унаследованный программный контрпример SPEC§11, не hardware/BOOT доказательство
и не утверждение достижения Run. Архитектор готовит отдельный запрет повторного
энергоснабжения, reviewer проверяет RED-пакет. Полный RnD→Safe остаётся gap:
нормативный endpoint уже задан, критерий completion отдельно не выдумывать.
Прежнее требование обязательного Run/RnD overlap было ошибкой архитектурной
предпосылки: direct Step3Set2 сбрасывает RnD до следующего Run scan. Проверяется
реальный порядок подтверждения и lifetime SU, без искусственного overlap.
Network4/group lifecycle и полная достижимость остаются NOT VERIFIED;
условный replay с явно заданной границей не подменяет их приёмку.

## Принятый baseline до Safe/down-owner исправлений

03B/R3, PLC pulse LV/HV fix и earlySTO приняты независимым ревью
в ограниченном программном объёме.
Принятая программная версия:178/75/413 PASS,201PASS/1FAIL/5NV.
Последний report-only BOOT пакет принят независимым ревью и сохранён
в96a9be9: **193/193 harness,75/75 historical,413/413 current;
201PASS/1FAIL/7NOT VERIFIED/0ERROR.** Старые case statuses неизменны,
добавлены2 capability NV,0 functional BOOT PASS. Проект в целом НЕ принят.

SAL SHA256:0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909.
GVL1.sgvl SHA256:06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5.
255 блоков из255; прежние timer values сохранены. Checkpointb5692c3 содержит
принятые03B/R3 и reviewed PLC pulse red tests; принятое исправление
PLC pulse сохранено в a9f809b, red earlySTO — в2ddafef; принятый earlySTO —
вa0b0d38. Ревью:EARLY_STO_IMPLEMENTATION_REVIEW.md, PLC_PULSE_IMPLEMENTATION_REVIEW.md,
03B_R3_REVIEW.md и ITERATION_03B_REVIEW.md. PLC_PULSE_CURRENT_RESULTS.json
связывает предыдущий source и48 тестов; EARLY_STO_CURRENT_RESULTS.json связывает
актуальные source/model/artifact hashes и88 тестов. R3_CURRENT_RESULTS.json
сохраняет предыдущие86+69 трасс. Прежний03B_INTEGRATED_ACCEPTANCE.json
исторический, с ограничением старой pair-модели.

Остался прежний STATE:conflicting-set-requests; теперь7NV, включая2 capability gaps; все41 требования обязательны.
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
независимый тестировщик, независимый ревьюер; ведущий координирует. Один writer на файл. Неизвестное
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
  аварийные разрешения сохраняются. Раннее STO реализовано и принято в ограниченном программном объёме.
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

1. Принятый earlySTO checkpoint a0b0d38 сохранён.255 блоков,
   исходные253 relative order,Reset/confirmation сохранены.88tests32/56→88PASS;
   independent88+native4/7PASS,8Resetwaveforms/default69exactlybaseline.
2. BOOT preflight реализован,193/75/413PASS,201/1/7/0. Report-only review ACCEPT;
   source/runtime не менялись. BOOT_SOFTWARE_MODEL_PLAN.md — не выполненнаяBOOT
   приёмка. Review whole-source preflight без phase cuts/unknown fallback:
   Network4 unbound data sources и неучтённый group lifecycle должны быть явно
   unsupported, а не давать ложный PASS. Уточнить программные источники/контракт
   по workingreference и первичным описаниям; hardware scope не расширять.
3. Гипотеза no-EDM Restart ограниченно исследована и НЕ ДОКАЗАНА.
   Код по ней не менять; прерванные запросы доступа не обходить.
4. Safe/Run: исходный RED checkpoint7e81d0a и дополнительный независимый
   no-autoenergy RED checkpoint103a2bd сохранены. Текущий partial Safe|RnD
   и down-owner v2 прошёл целевые независимые проверки и core review;
   точный SHA/результаты — в разделе возобновления выше. Полная Run ветвь
   сохранена, два её invalid-chord FAIL остаются обязательными.
   Следующая передача: независимая exact full-suite structural/fixture migration
   → immutable full run → независимое ревью → редактор working SAL при READY.
   Не переносить source до закрытия migration gate. После переноса повторить
   относящиеся source-bound проверки/полный пакет и review на working pair.
   Full reachability/emergency/recovery и нормальный LV completion→Safe
   остаются открытыми; старый201/1/7 не выдавать за приёмку новой версии.
5. Ожидаются ответы по новым PLC requests, conflict destination, discharge
   completion, новомуGreenвStartingRun и BOTHвRun. Только зависимые сценарии
   ждут ответа; отсутствие ответа не согласие.

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
- Дополнительно пользователю задано: новый Green после полного release во
  StartingRun — ignore либо abort-down; новый valid BOTH в Run — ignore либо
  штатная остановка SS1/discharge→R&D. SPEC§15 оставляет выбор, reference его
  не определяет. Это не late-second той же попытки. Ответов пока нет.
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
218dde5 непринятая03B+reviewedR3red; b5692c3 принятая03B/R3+reviewed PLC pulse red;
a9f809b принятый PLC pulse fix+reviewed earlySTO fixture plan;
2ddafef reviewed earlySTO red tests до изменения SAL; a0b0d38 принятый earlySTO.
96a9be9 — независимо принятый report-only whole-source BOOT preflight, без SAL изменений.
Текущий рабочий diff — Safe/Run планы и актуализация evidence/status.

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
