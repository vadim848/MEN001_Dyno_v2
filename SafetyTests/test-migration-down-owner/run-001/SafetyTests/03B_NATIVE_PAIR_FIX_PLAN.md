# 03B R3: native first-channel-only helper

Статус **READY для независимого ревью плана**, редактор SAL остановлен. Только архитектурный пакет; source/test/runtime не менялись. Исправляет мою ошибочную прежнюю рекомендацию клонировать master `Single-Channel Both Activated`: наличие такой строки в reference не доказывало first-only helper semantics.

## Первичные SDK свидетельства

Установленные DLL: `C:/Program Files (x86)/Beckhoff/TwinCAT/3.1/Components/Safety/1.4.16/v170/SALDesigner.dll` и `SALDesignerControl.dll`. Только metadata reflection/IL чтение; native Build/Verify/publish не запускались.

В SALDesigner.dll `TwoChannelInterfaceEntries`:

| Поле | Точная строка |
|---|---|
| Activated1 | `Single-Channel 1 Activated` |
| Activated2 | `Single-Channel 2 Activated` |
| ActivatedBoth | `Single-Channel Both Activated` |
| TwoChannel | `Two-Channel` |
| Deactivated | `Both Deactivated` |

`InPort.GetMaster` RVA182784 вызывает GetCoPartner(TRUE). `InPort.GetCoPartner` RVA182804, FBEstopBase branch IL00B2–0117, объединяет objectIndex8/9 (EStopIn1/2),10/11,12/13,14/15; slave получает master предыдущего objectIndex. `TwoChannelInPortSettings.ReloadCurrentState` RVA207072:

- IL0060–0080: master `Single-Channel Both Activated` даёт activationState=1 обоим каналам.
- IL00BE–00FE: master `Single-Channel 1 Activated` активирует master; `2 Activated` выключает master.
- IL0100–0138: slave при `1 Activated` выключен, при `2 Activated` включён.
- IL0150–024A: master использует Deactivate1, slave использует **master.Deactivate2**, а не собственную строку slave.

Поэтому own slave `Both Deactivated` не выключает второй канал, если master говорит BothActivated. Generic `Activated` принадлежит другому SingleChannelInterfaceEntries и не является корректной заменой native ESTOP pair mode.

В SALDesignerControl.dll `VerifierHSafetyPLC.IsInPortSecondChannelOfGroupActive` RVA2144731, IL0000–0039: TRUE для Activated2/ActivatedBoth/TwoChannel. `VerifyFbEstop` вызывает `ArePortsValidOfTwoChannelConfig`; последнее RVA2144816 сопоставляет effective activation и настоящую IsPortConnected, содержит diagnostic `ActiveNotConnect`. Конкретный режим обработки этого diagnostic здесь не исследуется и не заявляется.

`PublisherEL6900.BuildFunctionBlockDataSets`: IL0407–044D получает slave и вычисляет secondEffectiveActive **AND IsPortConnected(slave)**. IL0487–0493 выставляет first active bit; IL0514–0522 second active bit; IL0572–0589 пишет active/inversion masks в bytes2/3. Следовательно нельзя утверждать, что Both+unboundSlave непременно читает выдуманную TRUE/FALSE на native controller: publisher отдельно учитывает связь. Но serialized helper противоречиво объявляет второй канал активным и не связанным; intended first-only mode имеет точную собственную строку и устраняет этот дефект.

Воспроизведение из корня:

```powershell
& SafetyTests/scripts/read-sdk-il.ps1 -Type InPort -Method GetCoPartner
& SafetyTests/scripts/read-sdk-il.ps1 -Type TwoChannelInPortSettings -Method ReloadCurrentState
& SafetyTests/scripts/read-sdk-il.ps1 -Assembly SALDesignerControl.dll -Type VerifierHSafetyPLC -Method IsInPortSecondChannelOfGroupActive
& SafetyTests/scripts/read-sdk-il.ps1 -Assembly SALDesignerControl.dll -Type VerifierHSafetyPLC -Method ArePortsValidOfTwoChannelConfig
& SafetyTests/scripts/read-sdk-il.ps1 -Assembly SALDesignerControl.dll -Type PublisherEL6900 -Method BuildFunctionBlockDataSets
```

## Минимальный actual source fix

Только новый `RndPhysicalCompact/WINDOW`:

1. EStopIn1 master: `channelInterface="Single-Channel 1 Activated"`; Deactivate1/2 остаются BreakContactNC, discrepancy/maxDeviation0. Единственный active raw safety source — existing off (`GATE_002/AndOut`).
2. EStopIn2..8 сохраняют own `Both Deactivated`, не добавлять wire/global/alias/constant. EDM1/2 plain unbound native ports без invented channelInterface. Restart и остальные bindings unchanged.
3. Delay Time(ms)=250; orders/count253, release2s, qualification500/1000, R1 memory fix неизменны. MainESTOP и любые исходные native ports/parameters не менять.
4. Синхронизировать актуальный reviewed derived JSON nativePorts и generator/metadata assertion: сейчас shorthand `Activated`/поздняя hardcoded BothActivated нормализация не должны снова генерировать ошибку. Исторические baseline JSON сохраняются как исторические; выполняемый approved derived plan должен содержать точный native first-only mode.

## Проверки до реализации

Нужен effective-pair resolver в структурных/adapter boundary проверках: groupingпоnativeESTOPobjectIndex, master mode и master contact1/2. Для **нового WINDOW** reject BothActivated+unboundSlave, несмотря ownBothDeactivated; reject Activated2/TwoChannel либо genericActivated; accept exactActivated1 с singleboundmaster, unboundinactiveothers, plainnoEDM и настоящим Restart/Ready маршрутом. Проверить negative mutation masterBoth и slaveownDeactivated — раньше она могла дать falsegreen.

Resolver не должен подставить dummyTRUE для second input. Functional actual69/расширенный текущийпакет, whole binding audit, таймеры/сплошнойscanobserver и native metadata tests должны пройти после того же tiny sourcefix. Наличие adapter.Error=FALSE не является проверкой groupError; native diagnostic/modelgap остаётся явно указанным.

## Ограниченная политика legacy mainESTOP

Исходный mainESTOP также имеет masterBothActivated; однако его paired slave inputs имеют существующие alias consumers: NC2 при master1 и Mentee при master3. Нельзя трактовать их ownBothDeactivated как доказанную native неактивность и нельзя автоматически переписать исходный SAL. Guard05 и все старые программы сохраняются.

Общая runtime независимая фильтрация каждого EStopIn по собственной channelInterface не моделирует master/slave semantics полностью. Нельзя сохранить её прежний неверный oracle под названием legacy behavior. В R3 требуется **отдельно показанный reviewable adapter delta**: применять faithful effective pair activation ко всем safeEstop и polarity изmaster.Deactivate1/2. Не менять legacySAL.

Точный source main: pair8/9 NC1/NC2 обе direct BreakContactNC изmaster1; pair10/11 PLCguard direct BreakContactNC и Mentee inverted MakeContactNO изmaster3. Значит NC2FALSE либо MenteeTRUE должны снять actual mainEStop в текущем scan21; ownslaveBothDeactivated этому не препятствует. Это доказанный программный resolver contract, не аппаратная полярность. Menteeописаниераннихдокументовкакнеактивногоinput заменяется этимсвидетельством.

Минимальная runtime архитектура: отдельный resolver возвращает эффективные port+inversion без изменения parsed attributes; safeEstop читает выбранный raw source и применяет effective master contact **ровно один раз**. Не использовать обычный read(slave) с отсутствующим собственнымdeactivate2 и не инвертировать дважды. Single-Channel1/2/Both поддержать точно; BothDeactivated0channels; неизвестнуюстрокуилиunboundeffectiveactive отклонить явнойошибкойподдержки. Two-Channel с реальной discrepancy lifecycle пока не моделируется — failclosed unsupported вместо ложногоэквивалента двум независимымBOOL.

**Один общий resolver обязателен для runtime И source closure.** `src/physical-rnd-source.js` сейчас также фильтрует own channelInterface, поэтому исправление только runtime оставило бы effective slave источники за скрытым cut. Dynamic demanded closure и unknown/missing-source checks должны использовать ровно тот же effective port selection, что safeEstop execution; не создавать второй похожий список активных входов. Full source structural validation остаётся доclosure. Если pairBoth делает NC2/Mentee действующими, closure обязана включать соответствующие настоящие alias inputs/producers. Неполный active-source binding либо недопустимый unexplained boundary — ошибка до execution; generic unconnected fallback запрещён для effective active ESTOP.

Meta negative controls: Both+slaveownDeactivated всё равно demands NC2/Mentee; удаление active slave alias source/producer либо притворное inactive exclusion вызывает failclosed до первогоскана. Pairedpositive проверяет найденные реальные source IDs и здоровые boundary values, helperActivated1 не demands отсутствующий второйканал. Existinggroup/phasecuts остаются только явно документированными; resolverнеразрешает новыеimplicitcutstoavoidFAIL.

Red tests доadapterправки: mainNC2fault, mainMenteeactive и короткийpulse сrawrecoveryбезmanualRestart; изменить ownslavecontact не должно менятьmastercontactsemantics; heldentry/restart и pairedhealthypositive. HelperActivated1 должен иметь толькоoffinput, mutationBoth+unboundslave должнаотклоняться до bool fallback. Добавить first-only second-only both matrix, мастерныеcontact1/2direct/inverted. MainPLCproducer95/EStop21latency остаётся прежней; этот пакет не переставляетблоки и не закрываетотдельныйLV/HVshortpulseSetgap.

Миграция текущих/historical expected results допустима только по этому доказанному adapter contract: sourcefixturesнепереписывать, старые ложныеhostreplays обозначитьисправленныммоделированием, неослабить утверждённые требования. Любойcurrentpartialtest сeffectiveactiveNC2/Mentee обязанпоставитьявныеhealthyrawboundary; пропусксырогоinput не заменятьglobalTRUEdefault. Fullsoftwarecasesперезапустить, новыеFAIL/NVпоказатьчестно. NoEDM/groupError/lifecycleпо-прежнемунеподдержаны и не заявляются закрытыми.

Никакой новой политики пользователя/аппаратной проверки не требуется: first-only helper уже был намерением утверждённого графа; исправляется его native выражение. Запись STOP для review.
