# Сопоставление программных фаз reference и v2

2026-10-18, read-only анализ архитектора. Reference прочитан напрямую:
`C:/Users/user/source/repos/MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`,
Prodoction 4495a1f. Текущий v2 после checkpoint f7b4f7e.
Исследованы блоки/связи логики; аппаратные параметры не исследовались.

Это сопоставление операций, не утверждение эквивалентности режимов по имени.
R&D — остановка/продолжение исходной полной последовательности по решению
пользователя; отсутствие строки R&D в reference не означает отсутствие
соответствующих операций.

| Операция | Reference | v2 и отличие |
|---|---|---|
| Начать подключение источников | Network5/FBAnd1 order23: Step2, inverted input2, EStopOK → Decouple1 order24: Set_LV_C1 и Set_HV_C2 | Та же цепь сохранена; дополнен Reset_Transition_1 |
| Получить C1/C2 feedback | Network5/FBAnd2 order26: Ton1 + in_LV_C1_FBK + in_HV_C2_FBK → Ton2 | Та же цепь; это существующая стадия подключения, а не новая спецификация R&D |
| Подтвердить Healthy и завершить discharge request | Network5/FBAnd3 order28: Ton2, inverted LV/HV Healthy → Decouple2 order35: Reset_HV_Discharg_Req, Reset_LV_Discharge_Req | Сохранено в Network5 |
| Разрешить момент | Network5/Ton3 → Decouple3 order41: b_Set_STO_DR1/DR2 | Сохранено в Network5; по согласованной терминологии Set_STO в этой цепи относится к снятию запрета, а не обещает физическое время |
| Завершить вход в Run | Network5/FBAnd5 order45: Ton4 + inverted in_STO_DR1_FBK/in_STO_DR2_FBK → b_Step3_Set | Во v2 writer переименован b_Step3_Set_3, цепь та же; отдельная R&D→Run ветвь имеет b_Step3_Set_2 |
| Новая точка продолжения R&D→Run | Нет отдельной названной ветви R&D | Network12/FBOr1 order143 → Decouple3 order168 → FBAnd4 order122 → Set_HV_C2_1 и Ton3 order126 → FBAnd6 order127: Ton3 + C2_FBK + inverted HV_Healthy → Decouple2 order128: Set_STO_DR1/2_2, Step3_Set_2 |

Последняя строка — реальное текущее отличие v2: запрос R&D launch сначала
попадает в поздний Decouple3, затем на следующем скане в ранний FBAnd4.
Снятие STO и объявление Step3 сейчас объединены одним Decouple2 после Ton3,
C2_FBK и HV_Healthy. Поэтому нельзя «снять задержку» заменой всего Decouple2:
это одновременно отменило бы отдельный контракт подтверждения Run.

Код v2:
[Network12 FBAnd6/Decouple2](C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal:8492),
[launch fanout Decouple3](C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal:9168),
[Step12 LV producer](C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal:7949).
При дальнейшем diff ориентироваться на block path/ID: номера строк изменятся.

## Следствие последнего решения пользователя

При принятом R&D launch снятие STO не ждёт C2_FBK/HV Healthy. Последующий
Run confirmation/failure contract не отменён. Нужно разделить две операции:
принятый launch → STO set requests; существующее подтверждение → Step3 set.
Не подключать STO непосредственно к сырой комбинации кнопок/PLC mode bits:
должны сохраниться актуальные EStop и остальные разрешения принятия launch.

До реализации аналитик подтверждает точный программный маркер принятого
launch и перечень разрешений: существующий b_Set_Transition_3 доказывает лишь
внутренний запрос, а не полное соответствие всем требованиям. Если marker
не имеет полного permission в текущем коде, тест допустимо сформулировать
как scoped injection accepted-request только с явным пределом; объявлять
полный external-input acceptance нельзя. Не выдумывать locked feedback,
timeout/abort/restart поведение. Вопросы аналитику/владельцу блокируют только
зависимую StartingRun правку, а не независимый Step12 LV permission.

## Пределы

Сопоставление статическое, по реальному SAL, не hardware validation и не
доказательство всех достижимых состояний/всей reference эквивалентности.
Таймеры сохраняются. Контактная инверсия — программная операция SAL;
физический смысл/полярность источников не исследуется. Group lifecycle и
Network4 остаются пределами частичного адаптера; CRC/native вне scope.
