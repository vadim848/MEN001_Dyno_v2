# Независимое ревью iteration06

2026-10-19. После STOP редактора проверены план/PhaseA red baseline,
latest D-DOOR-INTERLOCK, реальный SAL diff, actual tests, B1 delta assertions,
oracle/report wording и implementation report. Код ревьюер не менял.

## Вердикт

Iteration06 принята в заявленных программных границах. Существенных
незакрытых замечаний нет. Новая energy таблица основана на явном решении
пользователя, не на ослаблении тестов ради результата.

Проверенный SAL SHA
`23cb1dd91d983b309294936fa8563cf9d669427401d38337c6b3c9647875adf2`.
Первичный reviewed SHA9d9ec83653073ccc900365f7f8999269af3947c60f99a65bad9d8ea079585aaa
заменён после удаления только пробелов пустой строки11412 по diff --check;
программная структура/логика не менялись.
SGVL не изменён. Реальный diff20 additions/10 removals: And16/AndIn3
Activated direct NC2; logical Door target AndIn1 удалён, NC1 привязан туда,
NC2 target добавлен. Inverted FalseSI2, And16→And4 и downstream sequence
сохранены. Ноль новых блоков/порядков/таймеров/alias descriptors. Это именно
InterLock_NC_1/2, не ES_NC_1/2.

## Доказательство и сохранённые условия

B1 test допускает только ранее11 программных additions плюс ровно два
новых NC targets и единственное удаление Door energy target. Все остальные
consumers, sources и alias descriptors строго сравниваются с fixture.
Три Door unlock блока побайтно сравниваются с reviewed04 с EOL normalization
и проверяются отдельными truth tables. Новой unlock policy не возникло.

Независимый targeted прогон36 Door +19 binding +6 CVR =61/61 PASS,0skip.
Те же35 PhaseA сценариев, прежде23PASS/12FAIL, теперь проходят; новый exact
source-delta тест проходит дополнительно. Обе existing physical/PLC цепочки
реально наблюдают And4 request и HV output: DoorFALSE+NC1/2TRUE разрешает,
каждыйNCFALSE блокирует независимо от Door, без подмены upstream request
одним final Set gate. Safe-source независимость остаётся scoped component,
не выдаётся за полный внешний переход. PLC handshake policy не придумана.

Startup-held open-door negative сохранён как recognizer/arming требование;
он не переименован в Door energy запрет и не перекрашен PASS. Ready NC1/2TRUE
задают здоровый фон, отрицательные NC controls проверяются отдельно.
NV теперь описывает неполноту полного покрытия dual-NC energy и отдельной
Door solenoid логики, не требует нового locked-feedback gate.

Прочитан полный результат174 harness/75 historical/69 current tests PASS;
166 PASS/35 FAIL/5NV/0ERROR. Старые individual cases не поменяли статусы,
12 новых PhaseA несоответствий закрыты в current suite. Отчёты обновили SAL
SHA/clock metadata; clock runtime03C не менялся.

## Остаточный объём

Mentee05, recognizer, merged PLC, полная accepted launch/early STO и прочие
обязательные требования остаются открытыми. Эти35FAIL/5NV не скрыты.
Reference/fixture/hardware mappings не менялись; native Verify/Build/CRC
и аппаратная validation не выполнялись. CRC остаётся исходной записью,
готовность загрузки и аппаратная безопасность не заявляются.
