# Network4 и жизненный цикл группы: программная граница

Read-only исследование, 2026-10-19. Исходный SAL `bf110ab452a5d9d3fcafd1acc5ab657b993e3e2828f384a63c1491c57b2cdcc6`, SGVL `508610b92e60ae602a75952113b34f7a8bd9c3f283fbb93dfa45b6a532f0a3ba`. Hardware/mapping/group settings не исследовались и не менялись. Это обязательный открытый gap полного BOOT/phase ownership, а не основание скрывать Network4 навсегда.

## Что действительно находится в Network4

Network4 имеет имя отображения `Network4ToBeDeleted`, но это не разрешение удаления. Единственный блок — `safeDecouple`, ID `2d3ff82b-8208-4df2-a468-8b7841d57858`, order23, mapState=false/mapDiag=false. Его восемь DecIn и восемь DecOut имеют portDataType="1". По полному binding parser и исходному XML у всех восьми входов нет wire, global reference или SAL alias target. Это **не найденный BYTE-to-bits decoder**: group-state producer на его входах отсутствует.

Reference содержит тот же блок/порты/имя Network4ToBeDeleted, order20. Его входы также сериализованы без связей. Следовательно отсутствие связи не внесено текущими итерациями.

| Выход | Global write | Реальный reader |
|---|---|---|
| DecOut1 | b_Step3_Reset | Network3/FBOr5/OrIn1 |
| DecOut2 | b_Step4_Reset | Network3/FBOr7/OrIn1 |
| DecOut3 | b_Step5_Reset | Network3/FBOr9/OrIn1 |
| DecOut4 | b_Step6_Reset | Network3/FBOr11/OrIn1 |
| DecOut5 | b_Step1_Reset | Network3/FBOr1/OrIn1 |
| DecOut6 | b_Step1_Set | Network3/FBOr2/OrIn1 |
| DecOut7 | b_Step2_Set | Network3/FBOr4/OrIn1 |
| DecOut8 | нет | нет |

Официальное описание DECOUPLE определяет восемь BOOL каналов один-к-одному; при FbRun=FALSE выходы становятся0. Его диагностический status — отдельные данные, а не DecOut bits. Документация требует связанную пару используемых input/output. [Beckhoff TwinSAFE Logic FB v4.3, §4.6, печатные стр.65–68](https://download.beckhoff.com/download/Document/automation/twinsafe/twinsafe-logic-fb_en.pdf).

Отсюда нельзя вывести безопасное значение несвязанного DecIn: исходный XML не задаёт универсального TRUE. Это ограничение уже существующего программного артефакта, не доказанный hardware defect. Нельзя без отдельного основания заменить его constant, group-state decoder или удалить его writes.

## RunStop / ErrAck и диагностический статус

SAL alias `in_Safety_Run`, ID `c8e3bd3c-13cc-4008-9721-90c96ea7ed1d`, соединён с group `//RunStop` и дополнительно Network3/FBAnd1/AndIn1. `GroupPort_ErrAck`, ID `e3965cf2-19b6-48c5-ae1a-fa8088801f94`, соединён только с `//ErrAck`. Parser сохраняет эти связи как variable.groupPorts; runtime ими не пользуется. Декларация group port сама по себе не доказывает чтение или запись его значения.

В группе объявлены также ModuleFault, FbErr, ComErr, OutErr, OtherErr, ComStartup, FbDeactive и другие порты. Среди двух реально связанных через variables group ports нет GroupState producer. В текущем SAL все parsed FB data ports имеют portDataType="1"; многобитного FB-пути не обнаружено. Поэтому boolean coercion — реальная общая граница адаптера, но не найденная ошибка декодирования конкретного Network4.

Read-only reflection установленного vendor SDK `.../Safety/1.4.16/v170/SALDesignerControl.dll` установила точный тип `Beckhoff.SALDesigner.TC3CustomCode.SafetyProject.TargetSystemHandling.TargetSystemConfigEL6900+GroupState`: **Run=1, Stop=2, Safe=3, Error=4, Reset=5**. Это enum SDK target presentation; не доказательство самодельного lifecycle автомата. EL6910 имеет другой набор, поэтому его START/STOPERROR/customizing состояния нельзя молча приписать EL6900.

Для EL6900 официальный §3.1.1.1 описывает RUN как разрешение выполнения, STOP как безопасные выходы; ERR ACK использует последовательность FALSE→TRUE→FALSE. Run-request не равен фактически достигнутому RUN. [Beckhoff, печатная стр.19](https://download.beckhoff.com/download/Document/automation/twinsafe/twinsafe-logic-fb_en.pdf). Обобщённая таблица групповой диагностики и числовые состояния не являются схемой соединений Network4.

## Что сейчас не моделируется

`sal-runtime.js` приводит setInputs/get/write к Boolean, safeDecouple всегда переносит прочитанные BOOL, scan выполняет блоки независимо от RunStop, group ErrAck не обрабатывается. Несвязанный вход по умолчанию TRUE, хотя assumption записывается. Значит полный запуск с Network4 сейчас может писать сразу семь TRUE в phase Set/Reset globals из-за fallback, а не из доказанного источника. Нельзя назвать такую трассу native startup.

Group state, stopping outputs, ошибки FB/соединений и их acknowledgement отсутствуют; main safeEstop Error всегдаFALSE. Не определено и сохранение/очистка памяти отдельных FB при переходах группы. Seeded RnD, software neutral release и 03B armed-precondition проверяют ветвь recognizer, а не полный BOOT группы.

## Минимальный следующий adapter пакет

1. Отдельные typed значения BOOL/числовой status; bool getter не должен молча принимать enum=2 какTRUE. Числовой diagnostic API добавлять только при реальном источнике, не подключать выдуманный GroupState к N4.
2. Явно описанный program group interface: Run request, ErrAck edge sequence и supplied software fault conditions. Стартовые значения и допустимые переходы должны опираться на EL6900-specific vendor контракт; неизвестные memory/reset эффекты отмечать неподдержанными, не угадывать.
3. Исключить generic TRUE fallback именно из заявлений полного BOOT. Для N4 восемь unbound inputs остаются unresolved, пока не выяснен native serialization/default контракт. Допустим отдельный явно ограниченный сценарный cut, но он не закрывает BOOT.
4. Тестировать все семь N4 globals и реальные Network3 readers, включая reset-dominant phase latches, одновременно с наружными outputs: RunStopFALSE, последующий requestTRUE, ошибка, ErrAck0→1→0, восстановление. Не принимать просто установленный b_Step1 как успешный startup.
5. Сначала red tests против текущего always-running/fallback поведения; потом небольшой adapter пакет с независимым ревью. SAL/settings/timers не менять ради устранения модельного пробела.

Точные технические остатки: vendor EL6900 lifecycle memory semantics и native treatment несвязанных DECOUPLE inputs. Это программные вопросы SDK/документации, не приглашение проверять каналы или выполнять Verify. Если источник не объяснит намерение N4, вопрос автору программы/пользователю должен описывать наблюдаемую последовательность: «при запросе старта из остановленной группы какие phase Set/Reset должны возникнуть и за счёт какого программного события?». До исследования не закреплять единственный ожидаемый startup oracle.

03B физическую ветвь можно проверять с явным достигнутым RnD/neutral precondition и настоящими fault guards; обязательный full BOOT/ownership coverage при этом остаётся открытым. Код, runtime, SAL и тесты данным документом не менялись. Запись остановлена.
