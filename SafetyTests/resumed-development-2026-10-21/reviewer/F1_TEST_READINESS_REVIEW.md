# Независимый F1 test-readiness gate — 2026-10-21

**READY для начальной изолированной F1 сборки**, не для candidate acceptance/promotion. Canonical P0 принят отдельным review; frozen F1 JSONb52f6b0e… и242-FB delta не менялись. Полная зелень на исходном P0 не требуется: tests специально фиксируют известные нарушения.

Прочитаны `tester/f1/READINESS.md`, реальные qualification/lifecycle adapters/runners и RED/control logs. Baseline — фактический P0, не старые59bf fixture substitutions. Qualification closure выводит `runPhysical` из реального OR5.OrIn1 source и наблюдает actual Set/Reset/And23/And24/owner; отсутствующий P0 owner не объявляется исполняемым. Native preflight и full typed bindings предшествуют cuts. В lifecycle сохраняются реальные Network3 writers после единственной initialSafe seed и семи явных inactiveN4 границ.

Исходный пакет достаточен для старта редактора: прежние Run20 (10PASS/10FAIL), новые13 qualification RED без fixtureERROR, отдельный настоящий LockSet3/FBRs9 producer case1PASS и реальные held-launch/no-cascade lifecycle controls2PASS. RED не переписываются в будущие green reports. Эти counts не являются доказательством полноты всех boundary combinations.

По замечаниям reviewer acceptance matrix теперь отдельно включает:

- Реальные lock rejection/noqueue и свежий положительный green после очистки; Lock не seeded. Данный control уже выполнен в объявленной Run component границе.
- Protective fault вq/q+1/после захвата с actual SetTRUE+ResetTRUE и reset-dominant output, затем raw restore без revival. Добавленные исполнимые RED cases не смешивают нормальный owner с допустимым protective stop.
- Ignored BOTH999/1000/partial release/repress и held entry/one-attempt lifecycle; не навязывать CTRUE, поскольку Run GATE020 scopeFALSE, а попытку удерживает T.
- Строгий no-early1999 и настоящий continuous2000 RELEASE.TonIn, с записью первого enabled sample. Raw bothOFF и первый timer-enabled scan не подменяются друг другом: SNAP/preparation latency не разрешает укоротить2000ms timer и не является новым физическим временем.
- Pending And24 q+1 при реальном Run exit: PLC01 receiver, C2 feedbackOFF q−1/q/q+1, настоящие Step12/Run qualifier writers, отсутствие stale-owner в RnD; phase/Reset sources после старта не seeded.

Последние два семейства ещё дорабатываются/расширяются tester: это **обязательства до candidate acceptance**, а не выполненные PASS и не повод задерживать native construction. На готовом exact candidate нужно выполнить matrix целиком, оба порядка/249/250/251/499/500/501/late600, owner cleanup/critical coincidences, paired preservation и полный reviewed regression. Diagnostic budgets остаются ERROR/NV, не придуманными functional deadlines. Любой новый fixture mismatch сначала исследуется, oracle не ослабляется.

Приёмка F1 должна использовать actual native owner IDs/order, qualifier scanq/And23+ownerq+1/OR5q+2 из frozen source chronology и не объявлять «мгновенное» физическое действие. К существующим RnD69/earlySTO88/Safe15/LV/emergency/BOOT negatives разрешена только точная manifest-backed structural/diagnostic migration; после сборки native/source-rule/usage/75Symbols/76nonprogram/85GVL/geometry/freshCRC gates повторяются.

F2 нормальная2сSS1 остановка остаётся отдельным knownFAIL; запуск/StartingRun abort/PLC freshevent/SafetyFault/state/BOOT ещё не приняты. Новые state-overlap exploratory traces также не закрываются F1 qualification. Ни этот gate, ни2PASS lifecycle controls не являются wholeBOOT/full41 или hardware/Target валидацией. Reviewer писал только свой отчёт, без изменения tests/source/oracle.
