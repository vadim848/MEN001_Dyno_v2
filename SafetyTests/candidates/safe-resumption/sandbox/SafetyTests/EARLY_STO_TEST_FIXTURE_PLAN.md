# Early STO: fixture расширенной actual-output проверки

**Accepted fixture implementation clarification:** выбран narrow `readRaw` interception по exactsource/consumer ledger после полной **uncut** closure. Он перехватывает consumer значение до обычного source-read и явно сообщаетFALSE; исходные normalized edges остаются целыми и аудируемыми. Это не seed portFALSE поверх wire. Ниже инструкция removeboth относится **только** к альтернативе graphmutation, если она когда-либо используется; acceptedfixtureнеперекраивать. Stricttwoedgeallowlist, baselineabsence и uncutphysicalcases сохраняются.

## Clarification: отдельная изоляция legacy completion Set producer

Review нашёл несовместимость `pending(completion)` с будущим корректным early route. Принятый SU даёт ORTRUE ужеN+1 и STO TRUE N+2, раньше latecompletion. Нельзя ожидать RSFALSE после реальногоSU и ожиданияC2/TON; нельзя просто сменить wait predicate сaggregate наlateproducer и считатьисправленным.

Для **только completion Setguard suites** разрешается явная узкая fixture edge boundary: два новых прямых consumers acceptedSU→Network1/FBOr8/OrIn3 и→FBOr10/OrIn3 читаютFALSE. ИстинныйSUwriter и его старый fanout в Network12/OR1→Decouple3→And4/HV→Ton3→And6→Decouple2 остаются исполняемыми без подмены. Источники legacy STO globals, их Set aggregate, RS, Reset и все guards не seedятся. Этот cut изолирует параллельный новый producer, а не симулирует принятие/завершение.

Предпочтительная fixture реализация: consumer-specific read boundary после полной source/SGVL валидации и source closure, с проверкой exact edge identity против actual graph; не менять SAL/parser/runtime semantics глобально. Scope/evidence обязан перечислить `{source:'//RndPhysicalCompact/STATE_SU/RsOut', target:'//Network1/FBOr8/OrIn3'}` и analogousOR10, значениеFALSE, reason `legacy completion producer isolation: suppress parallel early producer only`. В baseline доimplementation этихedgesнет: зафиксировать `edgeAbsentInBaseline`, не создавать выдуманную связь или ссылку. Послеimplementation утверждённыйcut допустим только при реально найденном именно этом canonicaledge. Не подавлятьotherinputsORлибоwholeSUvariable.

**Точный normalized-model порядок (уточняет предыдущую общую формулировку):** сначала audit неизменённого целого SAL/SGVL и exact source-edge ledger; затем privatefixtureclone снимает ОБЕ normalized projections edge (`input.sources` и `output.targets`) и устанавливает explicit typed FALSE binding на точном consumer ДО selected closure и demanded-input/read проверки. Не оставлять source присоединённым и не seed port FALSE поверх действующего wire: read priority его проигнорирует. Сохранить original full-closure ledger для аудита; final executedclosure учитывает только эти declaredcuts и настоящиепрочиеedges. Allowlist строго двух targets/единственногоSUsource/routecompletion; неизвестныйtarget, другойproducer, genericunboundfallback запрещены. Такоеразделение initialfullaudit и executedcutclosureнеослабляетstructuralsourcevalidation.

Closure остаётся полной по исходному source: настоящийSU, oldcompletionHV и всеguards присутствуют; cut не оправдывает исчезновение неизвестных источников. Evidence limit явно говорит «oldcompletion Setguard при отключённой параллельной early-edge», не fulluncutsource lifecycle. В dedicated suite оставлять этот cut фиксированным в healthy/fault/shortpulse/manualrestart/alreadylatched completion pairs. `pending` послеэтого ждёт одновременно genuine lateproducerTRUE, SetaggregateTRUE и RSFALSE, анеодин aggregate отдругогопроизводителя.

PhysicalSU/N+2, downstreamretainedrequestиlaterRunconfirmation scenarios **никогда не используют этот cut**. Они показывают uncutearybranch и оригинальный completion fanout в одномinterval, включая реальныеoutputs. Так fullphysicalacceptanceпроверяетновыйroute, isolatedcompletionguardпроверяетвсеoldproducers, а scopeневыдаёт componentisolation за целикомисполненнуюмашину.

Не выбирать искусственный Resettrace только радиRSFALSE: онзатрагиваетphase/requestlifetime и потребует больше предположений. НормальныеResetwaveformtestsиordinaryrouteостаютсяuncut. Existingmodeowner boundary остаётся явным. Перед новымsourceedit редактор готовитpairedredpositive по этойscopeбезослабленияfirstfaultoracle. Запись STOP.

Статус **READY plan-only после LV/HV ACCEPT/checkpoint**, не передача red-tests редактору сейчас. Stable SAL SHA256 `dd9fd938fd5493795a7eea7b29cb027d7e994e2a55e2ad02d2ca66cb4beb6923`,253блока. Existing69 normal scenarios не меняются. Нет SAL/runtime/test правок в этом исследовании.

## Минимальное расширение fixture API

В `physicalRndSource(model,stepMs,{entryButtons={},observedSignals={}}={})` добавить только опциональные **добавочные** наблюдения; локальный `signals={...PHYSICAL_SIGNALS,...observedSignals}`. Запретить перезапись старого ключа другим источником. Все места root-demand, rises, previous/current, frames, setup/reset и get используют один signals map. Default observedSignals={} сохраняет прежнюю closure/наблюдения без изменений.

Dedicated wrapper раннегоSTO может вызывать этот API, а не копировать traversal/runtime. Добавочные сигналы:

```js
{sto1:'STO_DR1',sto2:'STO_DR2',plcSto1:'outPLC_STO_1',plcSto2:'outPLC_STO_2',
 acceptedUp:'recRndC_SU',confirmRun:'b_Step3_Set_2',
 completionDischargeReset:'b_Reset_HV_Discharg_Req2',completionResetPb:'b_SetLock_ResetPB_2'}
```

SU только **наблюдается через настоящий SGVL writer**, не seed/reset вручную. Если требуется наблюдать конкретный FB output path, demandSignal должен проверить его против fullsource output-owner index и добавить настоящий port в closure; не обращаться с `//path` как с выдуманным external input. Предпочтительный минимальный набор выше уже использует существующие реальные variable names.

Опционально наблюдать все existing STO Set/Reset request globals для waveform assertions. Это добавляет настоящие producers, а не позволяет setInputs этихrequestglobals. Сначала full SAL/SGVL audit, потом union closure по всем наблюдаемым roots. Effective ESTOP pair resolver общий сruntime обязателен. Не делать отдельную STO-only копию source selection.

## Измеренная dependency closure на текущем source

Read-only in-memory расширение старого модуля (файл не записывался) пятью roots STO1/2, PLCstatus1/2, Runconfirm получило **163 selected blocks против145 default**, unbound demanded inputs0. Новых внешних raw inputs или новых phase names не потребовалось: они уже присутствуют в существующем explicit external/phase contract. Это измерение scope, не утверждение полного BOOT.

Добавились18блоков:

- Network1: OR7/8/9/10 и RS3/4.
- Network10/FBDecouple2 (реальные PLC STO indication outputs).
- Network2/FBDecouple2 (существующий Reset drive2).
- Network5/FBDecouple3 и FBTon3 (старые обычные STO Set producers).
- Network7/FBAnd2/3, FBDecouple2/3, FBOr1/2, FBTon2/3 (старые Reset producers/timed paths).

Через уже существующую closure доступны Network6 normal stop/reset producers, Network12 accepted-HV/Runconfirmation chain и все input dependencies. После внедрения255графа closure должна автоматически потребовать оба новых Set guards и PLCproducer; не закреплять163 как вечный oracle. Все ветви old Set/Reset агрегатов должны быть достижимы при traversal, даже если конкретный physical scenario держит их phase boundaryFALSE.

Реальные raw boundary inputs expanded scope: ESNC1/2, ExternalInterLockNC1/2, LV/HV connectors, Mentee, PLCstop, Falseinput, DoorMonitor, green/blue, LV_C1_FBK/LVHealthy, HV_C2_FBK/HVHealthy, STO_DR1/2_FBK, PLCmode1/2 и bypass. MainESTOP effective pair selection включает NC2 direct и Mentee inverted через master contacts. Их healthy values явны, не inferred из ownslaveBothDeactivated. В scope нет нового hardware происхождения сигналов.

Explicit phase cuts: Step1/2/3/4/5/6/12/RnD по текущему common fixture contract; Network3 ownership excluded, исходные writers зафиксированы вscope.boundaries. Положительная подготовкаLV через realStep12 producer и manualmainEStop остаётся прежней. Новые STO RS/outputs, Set/Reset aggregates, acceptedSU и completion flags не seedятся. Network4/group lifecycle не считаются исполненными: данный fixture не закрывает BOOT/полнуюдостижимостьRnD.

## Полные интервальные red/positive scenarios

1. Войти RnD через существующую явнуюstateboundary, выдержать настоящий нейтральный фильтр и наблюдатьarmed/helperReady до первойкнопки. Обеочередности acceptedchord ≤250 и full1s. Record actualSU first-rising scanN. При HV_C2_FBKFALSE, HVHealthyrawFALSE/TRUE оба STO aliases должны статьTRUE после согласованной передачи **N→N+2**, не ожидаяfeedback. До acceptedSU запрещёнраннийSTO. Это normativeearlySTO red на старомисточнике.
2. В томже trace Runconfirm/dischargeReset/ResetPBcompletion остаютсяFALSE до исходных подтверждений. Network12Ton3 уженастроен0.1s; не добавлять/менять время. После C2TRUE и исходного invertedHealthy условиеAnd6 разрешает прежний completion fanout. C2/HVHealthy raw трактуютсякакпрограммныеусловия, небезопаснаяэнергия.
3. PLCstatus outputs читать через реальный Network10Decouple. При сохранённомстаромпорядке онраньшеlatephysicalSU, нопослеранернихSTORS: таблицунаблюдаемогоscanoffsetснятьизsourceorders, невыдумыватьодинаковуюlatencyвtailальтернативе. Fixture observer записывает каждуювыборку, втомчислепервыйedgeиrelease, нечитаеттолькокончикиadvance.
4. ВсеSetroutes каждогоdrive: ordinaryNetwork5 producer, lateNetwork12completion, acceptedphysicalSU. Длястарыхroutes использовать настоящие соответствующиеphase/feedbacktrace; обозначатьstatecuts, неseedSGVLSet. Если route нестроится безнеяснойpolicy, не считатьегоPASSпоарбитрарномуTRUEaggregate.
5. С темжеproducerprehistory, когдаSetORTRUEаRSещёFALSE, faultпервойследующейвыборки; healthypairedpositiveобязанSet. Проверитьcurrentrawfaults иMentee, shortPLCstop1sample→rawrestoreбезRestart. FourthguardpreviousPLCpermission долженперекрытьgapдоmainEStopmemory. Ужеlatchedoutputпроверяетсяотдельно: новый SetguardнефорсируетReset.
6. Resetsequence controls: нормальныйRunstop/Step4/5timedbranches истарыйEmergencyresetpath, предусмотренные текущимипрограммнымиусловиями. Сравнить output/request/status waveforms с baselineдоизменения, включая Reset/Setcollision. СохранениевсехResetwiresиoldrelativeorder должноотражатьсявнаблюдаемыхсканах, анеструктурнойгалочкой.

Всеостальныеphysical69cases остаютсясdefaultнаблюдениями; отдельныйSTOпакет используетрасширение. НовыеFAIL/NVявноотчитаны, неослаблятьсуществующиеожидания. PLC-onlylaunchpolicyнепринимается, expectedSafe/RunstateownerнеподменяетсяSU. ДоLVHVACCEPTредакторуredпакетнепередавать. ЗаписьSTOP.
