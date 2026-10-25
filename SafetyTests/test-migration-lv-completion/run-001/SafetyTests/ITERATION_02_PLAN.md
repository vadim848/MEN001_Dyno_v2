# Iteration02 r2 — актуальный LV Set permission

READY редактору, 2026-10-18. r1 late gate113 отменён после editor preflight.
Iteration01 принята, checkpoint f7b4f7e. Прочитаны актуальные SPEC, DECISIONS,
FULL_NORMAL_CYCLE, SOFTWARE_ACCEPTANCE_SCOPE и REFERENCE_PHASE_MAPPING.
D-STO-LAUNCH/D-REFERENCE-BASE не меняют независимое EMG-011.

## Почему другой подход

Реальный ordering: LV FBRs1 order2 читает FBOr17 order172 прошлого скана.
EStop18, Step12 producer112 и предложенный gate113 слишком поздние: stale
TRUE уже потреблён. Ожидание100ms в тесте это не исправляет. Также producer112
имеет существующий target Network11/FBTon1/TonIn, который сохраняется.

Пакет теперь защищает ВСЕ LV Set requests на latch boundary. Это обосновано
EMG-011: текущие EStop/interlocks имеют приоритет над любым повышением.
Не перестраивается исходная последовательность reference; сохраняются её
действия, относительный ordering всех старых блоков и latency старого aggregate.
Никакого принудительного сброса уже включённого LV этим пакетом.

## Точный diff

1. Добавить Network1/safeAnd FBAndLvCurrentPermit order2, восемь входов:
   b_EStop_Ok, in_ES_NC_1, in_ES_NC_2, in_InterLock_NC_1, in_InterLock_NC_2,
   in_LV_Connector_Interlock, in_HV_Connector_Interlock — прямые;
   in_Estop_PLC — инвертированный. Existing variableId globals/inputs.
   Прямой контакт SAL Break Contact(NC), инвертированный Make Contact(NO).
   EStopOK предыдущего скана удерживает restart inhibition; текущие raw inputs
   блокируют новую аварию ДО позднего EStop execution.
2. Добавить safeAnd FBAndLvSetPermit order3: AndIn1=старый FBOr17/OrOut,
   AndIn2=новый currentPermit.AndOut; output → Network1/FBRs1/Set.
   Остальные входы деактивированы. GUID/instanceName уникальны.
3. Старый FBOr17/OrOut target FBRs1/Set заменить новым SetPermit/AndIn1;
   обхода не оставить. Все три старых входа OR17 сохранить без изменений.
4. Прежние orders>=2 сдвинуть +2: FBRs1=4, EStop=20, oldProducer=114,
   FBOr17=174, iteration01 finalgate=208. Прежний order1 сохраняется1.
   Относительный порядок всех старых блоков и их контакты неизменны.
5. Network11/FBAnd1 НЕ менять: сохранить global writer b_Set_LV_C1_1 И
   существующий target Network11/FBTon1/TonIn. Не добавлять late gate113.
   Не менять Reset LV, остальные writers, timers, aliases/configuration.

Итог SetLV=oldAggregatePreviousScan AND currentPermit. При здоровых разрешениях
это прежняя Set-последовательность без добавочной скановой задержки: aggregate
прежде читался RS2, теперь gate3/RS4 того же следующего скана. При уже TRUE
LV запрет Set не создаёт Reset; аварийное снятие остаётся существующей цепи.

## Приёмка фактического SAL

- Sole incoming RS.Set=новый gate; oldOR17 sole target=newgate. Проверить
  все port.globals/targets, не только model.variables. Старые input/writer/
  Reset/output bindings сохранены. GUID/order1..208 без коллизий.
- Hardcoded iteration01 metadata206→208; смысл проверки прежнего relative
  ordering и sole writer сохраняется. Partial selectors включают обаAND.
- Таблица permissions: oldAggregate FALSE/TRUE при healthy → прежний Set;
  каждый permission fault при aggregate TRUE → Set FALSE. EStopOK FALSE при
  остальных raw healthy запрещает автоматический restart.
- Обязательный paired stale trace: предыдущий scan выдал OR17 TRUE, LV latch
  ещё FALSE; перед следующим scan один raw fault. В первом fault scan LV
  остаётся FALSE. При ИДЕНТИЧНОМ prehistory безfault LV становится TRUE.
  Каждый перечисленный permission отдельно, включая EStopOK. Не подменять
  этот trace инъекцией выхода нового gate или ожиданием100ms.
- Реальные producers отдельно Step12 и унаследованный LV route, реальный
  OR17→gate→RS→out_LV_C1; healthy positive действительно включает LV.
  Scoped injection внутренних requests явно указать: это не доказательство
  принятия внешнего жеста/достижимости Step12.
- Компонент: LV уже TRUE, Reset явно FALSE, permission потерян → latch TRUE.
  Полная аварийная цепь вправе снять LV своим Reset; не задавать противоположный
  oracle полному fault scenario. Не форсировать outputs в целях зелени.
- Полный npm run check:software, регрессия iteration01, прежние PRIORITY с
  двумя fallback и явными пределами seeded phases/Network4/group lifecycle.
  Все TON и аппаратные секции неизменны. Остаточные FAIL не скрывать.
- Независимое ревью diff и positive/negative traces без существенных замечаний.

## Пределы

Закрывается часть EMG-011 по перечисленным условиям на LV Set boundary.
Mentee/иныеfaults, HV producers, принятый launch, completion и вся emergency
последовательность не объявляются закрытыми. Unknown oracle → аналитику после
reference/requirements. Все41ID обязательны для общего задания, этот scoped
PASS не заменяет их. Снятие STO/StartingRun отдельны от этой итерации.
Программные входы заданы, физические источники не исследуются. Native CRC
требует regeneration; Verify/Build/CRC вне scope, аппаратная validation не заявляется.
