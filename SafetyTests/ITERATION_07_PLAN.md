# Iteration07 r2 — READY: EStopOK и текущий PLCstop в конечном Unlock

Архитектор, 2026-10-19. Прочитан UNLOCK_EMERGENCY_CONTRACT.md, actual SAL
AndUnlockHold и reference/component contract. Узкий EMG-007 запрет для
NC1/PLC EStop; полного Emergency/transition/energy-safe guard не заявлять.
После стабильного05/source по владельцу; SAL здесь не изменён.
r1 отклонён независимым ревью: он пропустил поздний PLC producer.
Текущий источник после05 ea2443..., точные orders сверены непосредственно.

## Точный diff — 0 новых блоков, порядок209

Network1/FBAndUnlockHold existing AndIn4
Id55c0b75c-a041-46ff-b5a3-715fa2f8d676:
channelInterface=Activated, deactivate1=Break Contact(NC), прямое значение.
Привязать настоящий SGVL global b_EStop_Ok
Id98ab783a-9ee4-42cd-8375-54abc169e250, lastKnownPath GVL1.b_EStop_Ok через
fbPortGlobalVariableReferences/functionBlockPortHasFbPortGlobalVariableReferences/
fbPortGlobalVariableReference; новые relationship GUID уникальны.

В GVL1.sgvl Variable указанного GUID дописать TargetUsages/FbPortUsage
IdNEW/ModelElementId=55c0b75c-a041-46ff-b5a3-715fa2f8d676. Existing indices
не менять. Никаких новых variable declarations или GVL1.alias references.
Дополнительно existing AndIn5 Id3f513b29-6b63-4f75-926e-811ca7650568:
channelInterface=Activated, deactivate1=Make Contact(NO), программная инверсия.
Existing SAL alias in_Estop_PLC Id6d615846-7050-4fe7-9d46-85e8b6460f93
получает новый logical target usage //Network1/FBAndUnlockHold/AndIn5 через
полную variable.targetUsages native relationship chain B1. Никакого
GVL1.in_Estop_PLC reference; alias source/descriptor и старые consumers сохранить.
Итог конечного sole writer:
Unlock = oldGrantLatch && blue && !green && b_EStop_Ok && !in_Estop_PLC.

AndIn1..3, existing door grant/reset, общий grant latch и его Reset
сохраняются. Реальный MainEStop order21 раньше final209, но PLC guard
Network1/FBAnd1 order95 ПОЗЖЕ EStop21: EStopIn3 видит предыдущий sample
PLC guard. Поэтому один EStopOK НЕ достаточен для первого PLC fault scan.
NC1 идёт непосредственно в EStopIn1 и снимает EStopOK в текущем sample.
Текущий rawPLCstop через AndIn5 запрещает Unlock немедленно, а EStopOK
сохраняет запрет после восстановления/до ручного Restart. Исходный порядок
21→95→209 не менять. Старый grant/поздний Set обхода не дают.
Никакого energy currentPermit здесь:
отсутствующий connector в допустимом Safe сам по себе не запрещает доступ.
Не активировать main EStopIn2/4 и не добавлять NC2/Mentee поведение по имени.

## ФазаA — actual RED пакет до SAL

Подготовить paired Safe/R&D NC1 и PLC сценарии с реальными grant producers,
реальным FBAnd1/FBEstop1, ручным restart preparation, heldblue и sole writer:
здоровый control даёт UnlockTRUE; fault в следующем sample со stalegrant
оставляет FALSE. Возврат raw безReset оставляетFALSE. При одновременном
Set/fault конечный outputFALSE независимо от положения grant producer.
В source до07 эти negative assertions должны воспроизвести FAIL; сохранить
baseline с SHA/явными seeds и передать владельцу до phaseB.

PLC case обязательно начинает fault при предыдущем And1/AndOut TRUE и
EStopOK TRUE: первый fault scan rawPLCTRUE уже UnlockFALSE, хотя EStop21
ещё вправе читать stale healthy guard. Проверить удержание fault и отдельно
односэмпловый pulse: следующий sample rawPLC восстановлен, EStop21 читает
сохранённый faulty And1 и защёлкивает OFF; Unlock не возобновляется безReset.
Не заменять первый scan ожиданием100мс и не инжектировать EStopOKFALSE
вместо реального пути. Healthy paired control с тем же prehistory даётTRUE.

Дополнительные controls:

- Component b_EStop_OkFALSE при healthy raw + valid grant → UnlockFALSE.
- BlueOFF/greenON продолжают запрещать; valid blue/EStopOK TRUE разрешает
  при прежних upstream условиях. Не требовать DoorFALSE grant против oldlogic.
- Final component не зависит от energy connector/InterLock currentPermit:
  valid allowed grant+healthy EStop при отсутствии connector остаётсяTRUE.
  Полный source может реагировать собственными старыми аварийными путями;
  не отключать их ради такого component positive control.
- Три существующих Door consumers и их grant/reset таблицы сохранить после06.
- Полная ручная повторная gesture/recovery после аварии отдельно: новый
  user oracle не вводить, green сам запрещаетUnlock. Этот пакет доказывает
  отсутствие возврата только raw restoration без подготовленного Restart.

## ФазаB/приёмка

Внести exact два port settings/global/index/aliasusage diff;
B1 fullsource validator до subgraphs.
Тест metadata: источник globalGUID разрешается вSGVL, correct wrappers,
TargetUsage ровноодин, PLCaliasusage ровноодин; отбрасываются missingusage/
fakeglobal/bare mutations. После07 активны AndIn1..5, остальные inactive.
Source alias descriptors, hardware/group configuration,209orders, все TON,
остальные contact polarities и machine outputs неизменны.
Targeted RED→PASS + regression01/02/B1/03C/04/05/06, full check:software,
независимое ревью diff/actual same-scan traces. Остальные FAIL/NV сохранять.

NC2/Mentee, произвольные transition phases, полный EMG-007/опасная энергия
не закрыты этим узким EStopOK gate. Native CRC требует regeneration;
Verify/Build/CRC/hardware validation вне программной приёмки.
Файлы editor: SAL, SGVL TargetUsage, tests/reports. Reference/fixtures не менять.
