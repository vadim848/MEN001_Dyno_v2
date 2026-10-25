# 03B — обновление source и приёмка реального интегрированного SAL

2026-10-19, архитектор. Source после05 ea2443...,209blocks;07 ещё ожидает
финальной приёмки, он не меняет block count/order. Не обновлять final SHA/
идентичности netlist до передачи владельцем окончательного07 source.
Этот файл — план, рабочий SAL/tests не меняются архитектором.

## Перед реализацией — refresh, а не слепое применение старого JSON

1. После ACCEPT07 прочитать полный SAL+GVL1.sgvl; full B1 validator0errors.
   Зафиксировать source SHA,209orders, TON inventory, outputwriters, SGVL IDs.
2. Обновить compact netlist sourceSHA/old-to-new order map/native templates:
   currentMentee LV/HVSetAndIn3 из05, finalUnlockAndIn4/5 из07 и EnergyAnd16
   InterLockNC1/2 из06 должны сохраниться. Budget254/255 перепроверить.
3. По moveExisting сохранить original block/port/parameter identities TON1/2/4;
   пересоздать ссылки и usage indices на новые monikers. Остальные старые
   TON/feedback ветви неизменны. Ожидаемый current TON count **21**:
   existing20 −3переноса +3перенесённых +1release =21. HelperESTOP отдельно.
4. Сверить symbols/block refs, contact inversion, inactiveports, currentglobal
   refs и alias usages по namespaces; не сохранять старые bare refs по basename.
   Отдельно refresh порядок final209→новый finalcount после вставки45netnew.

## Full-source audit до любого selection

Actual acceptance сначала parse/validate ВСЕГО рабочего SAL/SGVL, затем
выделяет подграф. Не проверять только отредактированный Network12. Любой
неразрешённый ID/moniker/wrapper/index — ERROR до functional PASS.
Для каждого selection сохранить selectedblocks и список отрезанных producers.
Input boundary injection допустим только явно поименованным программным
сигналам с именем/ID/источником, причиной среза и пределом утверждения.
Нельзя заменить отсутствующий producer truefallback или default healthy.

## Два уровня исполняемой приёмки

### A. Physical R&D branch — actual blocks с явным state boundary

Выбирать новый RndPhysicalCompact network + весь Network12 + фактически
необходимые Network1 components: realCurrentPermit, realFBAnd1/FBEstop1,
SG/SU downstream shared OR/HV latch и outputwriter, общий doorgrant
FBOr3/FBOr4/FBRs6 и finalUnlock. Для LV/HV positive controls использовать
реальные соответствующие SetPermit/Reset aggregation/latches, а не вместо
них инжектировать выход нового graph.

Branch mode boundary b_Step_RnD может быть fixedTRUE только при явном
исключении его Network3 state owner. Это доказывает branch logic и реальные
выходы в заданной фазе, не достижимость R&D/полный нормальный цикл. Если
completion boundary b_Step_RnD меняется тестом для release owner, указать
это как инъекцию состояния, не реальную завершённую последовательность.
EStopOK не инжектировать вместо реального EStop для emergency controls:
mainReset подготовить действительной high/falling последовательностью,
при этом rawNC/InterLock/connector/PLC/Mentee заданы явно.

Source closure построить по typed globals и canonicalwires в ОБЕИХ
сериализационных ориентациях. Всё, что тест читает как выход, включает real
writer и его dependency cone, либо отмечено component boundary. При
unconnected ports проверять, что использованный command output от них не
зависит; иначе добавить dependency/явное допущение и не выдавать full PASS.

### B. Whole permitted chain — actual reachable control/feedback traces

ПослеA полный рабочий SAL с прежним явно записанным исключением Network4/
group lifecycle, если адаптер всё ещё не моделирует их. До исключения full
source audit обязателен. Реальные ownership, source/contactors, feedback,
old OR1→Decouple3 sharedHV и Ton3 completion проверяются совместно.
Фиксированное seeded phase не называть reachable fullcycle. Все fallback
assumptions вывести; ни один новый parser/runtime skip не маскирует FAIL.

## Обновление существующих проверок

- candidate-button-cover.js и current-code-checks.js Network12-only selections
  после moveTON должны быть заменены явным union нового network и описанного
  real dependency cone. Нельзя получить NOT VERIFIED из-за старых названий
  и считать это успешным переходом. Ожидания пользователя сохраняются.
- Blue request/internal event не равен фактическому unlock. Проверять actual
  grant/current final output непрерывно; SG/SU request уровни вместе с
  фактическим out_HV_C2/oldcompletion. PLC-only pendingpolicy отдельно,
  existing PLC route не удалять и не объявлять исправленным physicalwindow.
- Базовые structuraltests обновить с перечнем разрешённых изменений209→254,
  aliaslogicalfanout/SGVLnewstates, nativecontact/template identity. Не удалять
  смысл assertions «уникальныйwriter», «нетdirectbypass», «порядок».
- Historical fixtures/SHA immutable. Перенос timeline после03C уже принят;
  не создавать второй clock convention ради нового recognizer.

## Единый observer — не потерять запрещённый импульс

Снимать signals на КАЖДОМ sample всего сценария: initialheld, releasefilter,
prepare, первыйedge, пауза до second, secondedge, threshold, удержание,
release/recovery. Observer включён ДО первогоedge и не отключается между
runFor segments. Read не делает дополнительных scan. Каждый row содержит
firstObserved/secondObserved/event timestamps и rawinputs.

Fixedscan1/2/5/10 из03C;249/250/251 только1мс, nearestrepresentable points на
остальных. Before/at/after500/1000/2000 от соответствующего observededge;
не runFor(delta)+лишнийscan с прежнимlabel. Проверять counts событий и
«никогдаTRUE на запрещённом интервале», а не один последний sample.

## Обязательные реальные сценарии

Обе очередности: windowboundary, late300/500/600, single499/500, BOTH999/1000
от ВТОРОЙ, piano primaryswap100 безsampledbothoff, shortoff100, flicker
both600→oneoff1→fresh999/1000. После acceptedblue green снимает BA/Unlock,
его отпускание при heldblue не reassert доfullrelease. После acceptedG/Up
ordinaryrelease/late не снимает SG/SU доoldcompletion; не pulseподмена.
Initialheld и re-entryheld не легализуются временем; safetyinhibit требует
очистки. МenteeTRUE не допускает нового physical acceptance; это не все
аварийные источники/полный acceptedlaunch или ранний STO.

Positive energy DoorFALSE+bothInterLockTRUE; negativeeitherInterLock при
обоих Door; originalDoorunlock controls preserve. NC1/PLC fault same scan
и restorationwithoutReset сохраняют07. AlreadyLatched LV/HV безReset не
обнуляется новым recognizer; штатный emergencyReset остаётся действующим.

## Приёмка

Сначала actual RED tests на source07, затем implementation→targeted→full
check:software→independentreview. Design36PASS не заменяет эти этапы.
Объяснить каждую delta PASS/FAIL/NV; остаточные Safe/Runrecognizer, PLCpolicy,
fullcycle/EMG coverage остаются открытыми в41IDscope. Native Verify/Build/
CRC и hardware validation вне scope; не делать их скрытым gate и не заявлять.
