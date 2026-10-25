# BOOT: минимальный программный lifecycle harness

Статус **READY для review bounded software-model пакета**, не готовая приёмка BOOT001/002. Исследование read-only, без Build/Verify/CRC/publish/запуска оборудования; SAL/runtime/tests не менялись. Основание — NETWORK4_SOFTWARE_SEMANTICS.md; повторно не выводятся известные типы/aliases Network4. Текущие phase-cut fixture результаты не превращаются в fullBOOT proof.

## Новое ограниченное SDK свидетельство об unbound DECOUPLE

Первичный источник — установленный `.../Safety/1.4.16/v170/SALDesignerControl.dll`, metadata/IL посредством `scripts/read-sdk-il.ps1`.

`PublisherEL6900.BuildFunctionBlockDataSets`, DECOUPLE branch IL0D56–0EF5: datatype identifier15; адресные slots дляDecIn1..8 находятся на offsets2,6,10,14,18,22,26,30. IL0EA4–0ED2 вызывает IsPortConnected(input) и копирует GetPortSourceAddress **только если input связан**. Для unbound input этот copy пропускается. Это не вызов Get(FALSE) и не defaultTRUE: связь отсутствует в публикуемом адресном слоте.

`PublisherEL6900.GetPortSourceAddress` RVA1996616 начинает с нового4bytebuffer; при неоднозначном FB/alias источнике имеется ранний возврат этогоbuffer. Нулевая адресная запись не доказывает физическое/логическое FALSE без определения native адресного пространства. Тем более DECOUPLE unbound ветвь вообще не вызывает эту функцию. Не переводить байты адреса в значение сигнала.

`VerifierHSafetyPLC.VerifyFbDecouple` RVA2157080 вызывает GetInPorts и VerifyPortHasOnlySafeIoMappings. В прочитанном методе нет явного literalBOOL default для unbound входов и нет достаточного доказательства native reject/accept всего Network4. Официальный функциональный контракт DECOUPLE описывает связанные BOOL каналы, но не заменяет отсутствующее объяснение этого конкретного serialized unbound случая.

Воспроизведение:

```powershell
& SafetyTests/scripts/read-sdk-il.ps1 -Assembly SALDesignerControl.dll -Type PublisherEL6900 -Method BuildFunctionBlockDataSets
& SafetyTests/scripts/read-sdk-il.ps1 -Assembly SALDesignerControl.dll -Type PublisherEL6900 -Method GetPortSourceAddress
& SafetyTests/scripts/read-sdk-il.ps1 -Assembly SALDesignerControl.dll -Type VerifierHSafetyPLC -Method VerifyFbDecouple
```

Вывод bounded: native unbound value **не установлен**. Не утверждаются ни invalidproject, ни constantTRUE/FALSE, ни deadNetwork4. Дальнейшее бесконечное исследование не является этим этапом: нужен точный документ/SDK-реализация интерпретации неинициализированного DECOUPLE source-address slot или программная спецификация его допустимого использования. Это software information, не hardware/channel validation.

## Предлагаемый минимальный пакет A: строгая whole-source граница

### Установленные source/reference факты и границы

Read-only сравнение полных SAL через parser: reference Prodoction4495a1f также
содержит Network4/FBDecouple1 с восемью входами без wire/global/alias sources.
DecOut1..6 пишут b_Step3_Reset,b_Step4_Reset,b_Step5_Reset,b_Step6_Reset,
b_Step1_Reset,b_Step1_Set. V2 сохраняет эти связи и добавляет DecOut7→b_Step2_Set.
Это не только v2 binding loss; не удалять Network4 и не приписывать BOOL default.

Первичные описания: [Beckhoff TwinSAFE Logic FB, §4.6,pp65–67](https://download.beckhoff.com/download/document/automation/twinsafe/twinsafe-logic-fb_en.pdf)
задают соответствие DECOUPLE input/output и требуют связанной пары при
использовании канала. RUN передаёт значение, STOP выдаёт0. Они не объясняют
данный unbound serialized source-address случай; native reject не утверждается.
[EL6900 operating instructions,p39](https://download.beckhoff.com/download/document/automation/twinsafe/el6900en.pdf)
отдельно описывают group RUN: несвязанный RUN равенTRUE, FALSE останавливает FB
с safe outputs; ErrAck использует0→1→0. RUN default нельзя перенести на DecIn.
Это сведения о программном контракте, не проверка hardware/channel mappings.

Дальнейшее исследование ограничено: source/runtime не менялись. Внешняя загрузка
диаграммы EStop и отдельный git-read reference требовали доступа и были прерваны;
не повторять эти действия обходным способом. Факты SAL выше получены отдельным
разрешённым read-only parser сравнением. Гипотеза coincident EStop restore/Restart
fall не доказана и не является основанием программного исправления.

После BOOT_PREFLIGHT_PLAN_REVIEW.md действующая граница — **file-only** entrypoint,
который сам читает полный SAL и соответствующий SGVL и заново выполняет parser/
binding audit. API с переданной `model` отменён: отфильтрованная модель может
сохранить чужой bindingAudit.PASS. Native inventory и переносимая идентичность
сверяются с reviewed source a0b0d38. Raw SHA сохраняется как evidence; trust
учитывает CRLF/LF через явно определённый LF-normalized digest либо полный
canonical XML digest без потери attributes/namespaces/usage indices/producers.
Пустой/срезанный inventory и удалённые writers не получают capability PASS.
Ни одного phase cut/seed output/fallback в этом полном источнике; все outputs,
global writers/stateful functions входят в inventory. Parser обязан аудировать
именно читаемый SGVL, а не скрыто подменять его другим файлом.

Пакет A — report-only capability assessment: два разных unsupported основания
публикуются как NOT VERIFIED, **0 functional BOOT PASS**. Он не эмулирует группу
и не меняет program/runtime behavior. Существующие компонентные сценарии
продолжаются с прежними явными границами. Group emulator B этим не разрешён.

Preflight выдаёт два **разных** результата:

1. `UNSUPPORTED_UNBOUND_PROGRAM_INPUT`: exactNetwork4/DecIn1..8 с настоящимиportIDs и семью downstreamglobalwriters/consumers; outputп8не делаетблокdead. Это блокирует утверждение fullRUNphaseownership, а не замалчивает результаты остальных независимых сценариев.
2. `UNSUPPORTED_GROUP_LIFECYCLE`: заданные RunStop/ErrAck interfaces найдены, но scan сейчас их игнорирует; не возвращатьPASS при всегдаисполняемыхFB. RequestedRunTRUE не equivalent actualGroupRUN, manualmainEStopRestart не equivalent groupErrAck.

Существующие branchfixture могут продолжать с явным mode boundary; report сохраняет mandatoryBOOT/EMGmanualrecovery coverage какNV/open, а не pass. Unsupported software semantics не формулировать как скрытый hardwaregate.

## Минимальный пакет B: отдельный group envelope

Source-defined interfaces RunStop/ErrAck используются через реальныеSALvariables/groupPorts. Внутренние имена состояний берутся из подтверждённого EL6900SDKenum Run1/Stop2/Safe3/Error4/Reset5; не подмешивать EL6910START/STOPERROR. Numericstatus не приводитькBoolean.

Групповой envelope должен отдельно отFBRestart учитывать requestedRun, suppliedsoftwaregroupFault и последовательностьErrAck0→1→0. Сигналыexternalfaultavailability допускаются только как явная средоваяпрограммнаяграница: это не утверждение измеренныхconnections. При отсутствии контракта перехода возвращатьunsupported, аневыдумыватьгрупповой state machine.

Из vendor функционального контракта достаточно для первой ограниченной проверки: RunStopFALSE не должен оставлять наружные FB outputs разрешёнными. Конкретное сохранение/очистка памяти RS/TON/ESTOP приSTOP→RUN/Safe/Error/Reset должно быть установлено **поописанию каждойфункции/SDK**, до реализации replay recovery. Не «обнулятьвсюmemory» и не «freezeвсё» бездоказательства. Покаэтонеопределено, поддержать толькоpreflight+explicitunsupportedreturnдлянеподдержанныхlifecyclepaths; это честнее ложногополногоBOOT.

Реальнаяgroup error обработка не подменяется EStop.ErrorFALSEstub. Сообщить неподдержанные diagnostics/groupErrAck отдельно от доказанных manualRestart сценариев mainESTOP.

## Red tests и приёмка этапа

- Whole-source test действительно включает Network3/4, всеphasewriters инаружныеoutputs; отсутствиеseedstate/implicitunknownфлагов проверяется структурно.
- Текущийalways-runningruntime при RunStopFALSE даётred либоpreflightunsupported, анеPASSBOOT; обанезависимыхunsupportedпричины присутствуютвотчёте.
- Удаление/маскировкаNetwork4неубираетgapмолча: mutation mustfail sourcecoverage/closure audit. Не подставлятьdummyTRUE/FALSE вDecIn.
- Typedstatus2/4неравенBooleanRUNTRUE; Runrequestнефабрикуетqualifiedphase. GroupErrAcksequence иmainRestartраздельны вevidence.
- Послеустановленияпамятиконтрактов отдельныереальныеtrace: power-on requestFALSE, requestTRUE, healthyack/manualRestart, faultduringtransition, restoreбезAck/Restart, explicitAck/Restartpositive. ВсеphaseSet/Reset иouteroutputsпишутactualsource, безphasecuts. ДоразрешенияN4этоостаётсяневыполненнымобязательнымscope, не ослабленнымoracle.

Новыеpolicy, таймеры, mappings и hardware конфигурация не нужны для строгости текущегоотчёта. Следующаянужнаяинформация — программноеопределениеunboundDECOUPLEsourceaddress и EL6900FBSTOP/memory/recovery contract. Если ононевыводитсяизкода/первичныхописаний, ведущийагент формулирует конкретныйsoftwarequestion; нельзяпроситьпользователяугадатьсыроезначениенеописанноговхода. РеализацияAможетбытьмаленькимнезависимымпакетомдоB, ноAневыдаётсязавыполненнуюфункциональнуюBOOTприёмку.

Запись STOP для review. Исследование ограничено программнымSDK; nativeexecute/hardwareнепроводились.
