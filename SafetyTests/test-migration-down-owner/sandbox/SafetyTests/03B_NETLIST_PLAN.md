# 03B counted native netlist — capacity blocker

2026-10-19. Архитектор создал 03B_NETLIST_PLAN.json, не SAL/код стенда.
Граф соответствует исправленному physical plan:10RS, дваsnapshot,4TON,
один internal ESTOP250 и67AND/OR после common-subexpression sharing.
JSON хранит source SHA, каждый block/input/output и GUID mapping,
native template portNum/objectIndex/varId, параметры, SGVL declarations/
индексы, alias target additions,192canonical direct wires и полный order map.
Имена/атрибуты native портов взяты из текущего SAL templates, не модели SDK.
GUID в artifact — плановая детерминированная mapping, не изменение проекта.

## Результат — NOT READY к записи SAL

| Элемент бюджета | Блоки |
|---|---:|
| Текущий рабочий SAL после04 | 209 |
| Существующие TON1/2/4 переносятся, не дублируются | −3 |
| Полный physical graph | +84 |
| Итог | **290** |
| Поддержанный software limit | **255** |
| Превышение | **35** |

Read-only metadata установленного vendor SDK Safety1.4.16,
SALDesignerControl.dll: TargetSystemConfigEL6900.get_Max_FunctionBlockNumber
имеет IL `20-FF-00-00-00-2A`, то есть return255. Никакие hardware parameters
не читались/менялись и publisher/verifier не запускался. Это ограничение
валидности программы, а не добавленный gate аппаратной validation.

Нельзя отдать editor этот290-block граф как deployable, сменить target,
округлить250 или удалить унаследованную source/feedback последовательность.
03C clock пакет остаётся независимым полезным следующим изменением стенда.

## Привязки и интеграция, сохранённые в counted design

-10обычных SGVL state declarations с writerRS и snapshot TargetUsage IDs;
  existing b_Step_RnD получает один новый typed SGVL consumer.
-17новых alias logical usages (несколько потребителей blue/green/door/False);
  descriptors и физические mapping не меняются.
-Physical SG/SU/SB заменяют только три старых physical sources на OR2/OR1/
  And2. PLC independent input остаётся pending до ответа пользователя.
-Existing OR1→Decouple3→HV request, Ton3/feedback completion сохраняются.
  SG/SU держат request levels; pulse вместо retained request не предлагается.
-P/R prepare формирует helperRestart без соединения с main Restart/ErrAck.
  Параметр helper250 реально представим; это не ordinaryTON0.25.

Все native templates/port IDs при реализации должны быть вновь сверены с
текущим source SHA; перенесённые existing TON сохраняют original IDs и
исходное значение timing. New GUID mapping для moved block в artifact
не инструкция менять identity: поле moveExisting имеет приоритет.

## Исследованные пути сокращения и следующий технический шаг

Common-subexpression sharing уже включён. Дополнительное RS factoring:
вместо next=E&&(SetEvent||selfHold) и Reset=!next использовать существующее
удержание RS с Set=event, Reset=exitConditions. Предварительная экономия
около12блоков недостаточна сама по себе; требует reachable equivalence proof.
Старые физические gates Network12And5/And7/And18 потенциально retired, но
только после полного fanout/PLC proof; даже3 reclaimed не закрывают35.
Старые переходы/таймеры исходной полной последовательности не кандидаты
для удаления только ради бюджета.

Следующий допустимый пакет — меньшее integrated physical window/attempt
filter с сохранёнными существующими owner/completion blocks, либо сжатый
граф с доказанно используемыми существующими лачами. Для каждого reuse
нужны exact source/readers, Set/Reset lifetime и positive/negative trace;
не считать похожее имя доказательством эквивалентности памяти.
Нельзя объявить неполный staged filter закрытием всех BTN или merged PLC.

Запись netlist остановлена; данные reviewable. Программные результаты04
и native binding repair этим capacity finding не отменяются.
