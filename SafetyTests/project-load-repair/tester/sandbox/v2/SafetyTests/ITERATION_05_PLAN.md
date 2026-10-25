# Iteration05 — READY: Mentee на LV/HV Set границе

Архитектор, 2026-10-19. После стабильной точки03C. Прочитан
MENTEE_PROGRAM_CONTRACT.md и непосредственно текущие SAL порты/alias.
Сохраняемый reference контракт: FALSE разрешает, TRUE снимает защитное
разрешение; это программные значения, не вывод об электрической полярности.
EMG-011 запрещает новый Set при текущем защитном событии. Новый вопрос
пользователю для этой узкой коррекции не требуется.

## Точный diff: ноль новых блоков, порядок209 неизменен

- Network1/FBAndLvSetPermit order3: existing AndIn3,
  Id494250fd-14c3-4187-bdcb-603b0af12efe, изменить channelInterface с
  Deactivated на Activated; deactivate1=Make Contact(NO), программная инверсия.
- Network1/FBAndHvSetPermit order5: existing AndIn3,
  Idacb73e37-766b-4544-8466-4ac03335e28c, то же изменение.
- Existing SAL variable in_Mentee_EStop Id7345d0ae-6720-47d8-b710-bb0b8c2dd55f:
  дописать два logical targetUsages moniker
  //Network1/FBAndLvSetPermit/AndIn3 и //Network1/FBAndHvSetPermit/AndIn3
  через native relationship wrappers из B1. Новые usage GUID уникальны.
  Никаких фиктивных GVL1.in_Mentee_EStop/global refs. Alias source descriptor,
  существующие четыре consumers и SDS/mapping не менять.

Existing common currentPermit восемь условий НЕ менять. Теперь
SetLV=oldAggregateLV&&currentPermit&&!Mentee;
SetHV=oldAggregateHV&&currentPermit&&!Mentee.
При FALSE поведение до05 полностью сохраняется. При TRUE блокируется новый
Set в первом скане до ранних LV/HV RS. Reset/latch удержание и аварийная
discharge последовательность не меняются. Main FBEstop1/EStopIn4 остаётся
деактивированным как прежде; не активировать его ради иной реакции EStopOK.

## Приёмка actual SAL

1. Fullsource B1 validator PASS; exact delta2aliasusages+2port settings,
   source descriptors/old consumers/orders/timers/SGVL неизменны. Ноль
   новых blocks/aliases/globals. One canonical binding на новый input.
2. Stale-positive paired trace каждого Set: previous real producer/OR
   TRUE, LV/HV latch ещё FALSE. Nextscan MenteeTRUE → соответствующий
   output остаётся FALSE; идентичный control MenteeFALSE → TRUE. Проверить
   унаследованные writers и новые Step12/R&D writers, не один новый AND.
3. Другие current permission FALSE по прежнему блокируют; добавление
   девятого условия не выкидывает/инвертирует прежние восемь.
4. Компонент latchedTRUE+ResetFALSE+MenteeTRUE остаётсяTRUE: это Set gate,
   не принудительный Reset. Полный fault scenario может снять output
   существующим Reset; не запрещать это ошибочным oracle.
5. Не требовать b_EStop_OkFALSE от деактивированного EStopIn4. Run защитный
   путь исходной системы сохраняется. Non-Run emergency destination и
   полный restart контракт этим пакетом не объявляются исправленными.
6. Current PRIORITY cases и full npm run check:software после03C; все
   новые failures анализировать, остаточные BTN/PLC/state FAIL/NV не скрывать.
   Независимое ревью bindings/contact inversion/stale paired controls.

Файлы редактора: рабочий SAL, targeted tests/metadata exact-delta checks,
пакетные результаты и implementation report. Historical fixture/reference,
аппаратные файлы и SGVL не менять. Native CRC остаётся требующим regeneration;
Verify/Build/CRC и hardware validation вне этого программного scope.
