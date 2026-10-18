# Iteration 02 — актуальное разрешение запроса LV из Step12

Предложение архитектора, 2026-10-18; выполнять после приёмки Iteration01.
Никаких изменений кода этим документом не внесено.

## Основание

EMG-011 и §5.1 спецификации однозначно требуют приоритета EStop/external
interlock и актуальных connector interlock при повышении энергии. Reference
Prodoction 4495a1f не имеет Step12 и writer b_Set_LV_C1_1; новая ветвь v2
Network11/FBAnd1(order112) добавляет этот запрос по Step12 и второму условию,
без проверки этих разрешений. Поэтому reference не оправдывает обход.
Текущий отчёт содержит PRIORITY:Step12:* контрпримеры; они условны и сами по
себе не доказывают достижимость Step12. План проверяет отдельный реальный
producer и его место в цепи, не объявляет исправленной всю emergency систему.

## Разрешённый маленький diff

Сохранить Network11/FBAnd1 и его прежние входы. После него добавить один
safeAnd `FBAndLvPermit`, order113; сдвинуть прежние orders>=113 на +1,
включая добавленный Iteration01 final unlock gate, сохранив относительный
порядок всех прежних блоков. Новые GUID/instanceName уникальны.

Активные входы нового AND:

1. old Network11/FBAnd1/AndOut (прямой контакт).
2. b_EStop_Ok (прямой; реальный FBEstop1 order18 исполняется раньше).
3. in_ES_NC_2 (прямой).
4. in_InterLock_NC_1 (прямой).
5. in_InterLock_NC_2 (прямой).
6. in_LV_Connector_Interlock (прямой).
7. in_HV_Connector_Interlock (прямой).

Восьмой вход деактивирован. Связи globals используют existing variableId;
никакие aliases/global parameters/TON не меняются. Единственный writer
GVL1.b_Set_LV_C1_1 перенести с старого AND на новый AND; прежний AND теперь
пишет только в новый AndIn1. Проверить обе XML-стороны связи и отсутствие
старого глобального writer. Старые b_Set_LV_C1 из Network5 и команды HV
не менять: это независимые следующие итерации, не скрывать их FAIL.

При b_EStop_Ok TRUE и всех шести разрешениях TRUE логика запроса LV остаётся
побитно oldProducer. При любом FALSE новый запрос FALSE. Это не немедленный
сброс уже включённого LV, не разрешение доступа и не новое правило emergency
completion. Полярности указанных входов заданы §5.1 и существующим EStop
контрактом; иных полярностей, включая Mentee, не выводить по названию.

## Приёмка и недопустимые упрощения

- Сначала подтвердить полный writer/readers inventory b_Set_LV_C1_1 и
  downstream RS set/reset. Если старый writer больше одного или другой
  тракт пишет тот же сигнал, вернуть архитектору уточнение до редактирования.
- Компонент: фактический producer Network11, old condition FALSE/TRUE,
  все разрешения TRUE → прежние результаты. Каждый permission FALSE отдельно
  при old condition TRUE → запрос FALSE; восстановление возвращает прежний
  producer. Это проверка комбинационного permission, не state recovery oracle.
- Реальная цепь с фиксированными явно записанными состоянием и feedback:
  healthy positive control действительно поднимает LV; при NC1/PLC/NC2,
  external и connector loss в том же входном скане новая LV команда не
  возникает. Проверить до/после boundary и order18→112→113→LV RS consumer.
  Если consumer раньше113, разобрать и поменять ordering плана, а не
  добавлять произвольное ожидание в тест ради PASS.
- Не требовать снятия уже включённого LV этим AND и не заменять аварийную
  последовательность прямым обнулением outputs.
- Проверить сохранение Iteration01, XML GUID/order/sole writer, все TON и
  аппаратные секции; полный npm run check:software. Не менять ожидаемые
  значения в старых сценариях. Partial selectors обновлять явно.

Mentee и другие upstream completion/restart ожидания не включены в oracle
этой итерации. Если от них требуется конкретное поведение, сначала reference
и требования, затем вопрос через владельца при неустранённой неоднозначности.
Не тестировать выдуманное поведение как согласованный контракт.

Native CRC остаётся требующим regeneration; native Verify/Build вне объёма.
Network4/group lifecycle остаются пределами адаптера. Отчёт фиксирует SHA,
seeded начальное состояние, fallback assumptions и positive controls.
