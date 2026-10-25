# Консервативный ресурсный аудит для будущих пакетов

Статус: read-only; **удаление не разрешено этим документом**. Не меняет утверждённый бюджет03B253. SAL SHA256 `bf110ab452a5d9d3fcafd1acc5ab657b993e3e2828f384a63c1491c57b2cdcc6`; SGVL `508610b92e60ae602a75952113b34f7a8bd9c3f283fbb93dfa45b6a532f0a3ba`. Полный strict binding parser успешно прочитал209 блоков.

## Whole-source backward liveness

Консервативными roots взяты все alias source outputs, все SGVL writes и каждый блок кроме чистых safeAnd/safeOr/safeDecouple. От roots обходились источники прямых canonical wires, writer'ы читаемых global IDs и sourcePorts aliases, которые читаются входами. Stateful, diagnostic, timer и нераспознанные функции не считаются удаляемыми. Не требуется предполагать значение raw входа или достижимость состояния.

Результат: **209 из209 live**, unrooted pure blocks0. Это отрицательный результат для автоматической экономии на текущем источнике, а не доказательство минимальности схемы. Новых внешних mappings и аппаратных предположений нет.

## Конкретные кандидаты

| Блок | Факты текущего источника | Вывод |
|---|---|---|
| Network12/FBAnd7, order132 | safeAnd; AndOut `8ddd104d-d871-4c1a-9472-92d06a6903e5`; единственный direct consumer Network12/FBOr2/OrIn1; globals0, alias sources0 | Сейчас live. После03B retarget этого входа на SG может стать чистым dead-блоком: потенциально1FB, отдельная последующая проверка |
| Network12/FBAnd1, order119 | AndOut `23f856c4-3679-46e2-942f-d6b64b2a6c2d`; consumers And2/In1, And3/In1, And4/In1, And5/In1, And7/In1, And14/In3 | Не dead; сохранение оставшихся пяти связей обязательно даже после возможного удаления And7 |
| Network12/FBAnd3, order124 | AndOut `7c80e6ec-323e-49b4-87e9-402361e84859` пишет SGVL `b_Reset_Door_Unlock_1`, ID `db2eadd3-4ead-4fb1-b1c1-facfcbf2ab1b` | Внешне наблюдаемый программный write; не удалять |
| Network4/FBDecouple1, order23 | Семь SGVL writes при отсутствии direct wire targets | Не dead по принятой консервативной границе |

Network4 пишет: `b_Step3_Reset`, `b_Step4_Reset`, `b_Step5_Reset`, `b_Step6_Reset`, `b_Step1_Reset`, `b_Step1_Set`, `b_Step2_Set`. Даже отсутствие direct input wire не доказывает отсутствие эффекта: запись FALSE тоже влияет на потребителей. DecOut8 не имеет потребителей, но отдельный неиспользуемый выход не освобождает целый блок. Удалять Network4 как «неподключённый fanout» нельзя.

## Условная будущая экономия And7

Только после реализации03B заново проверить весь SAL/SGVL, настоящий единственный consumer и отсутствие outputs в alias/global/прочих relationship usages. Подтвердить, что OR2/OrIn1 действительно питается новым SG и старый путь не нужен PLC ветви. Затем отдельный пакет может удалить And7 вместе с его входными wires/alias usages, не меняя upstream shared producers. Нельзя удалить And18/And1 либо любой timer по цепочке без нового fanout доказательства. До и после удаления сравнить все наружные alias outputs и global writes в фактическом SAL, включая Unlock/reset и PLC обходы, с одинаковыми трассами.

Этот аудит не является основанием менять target, аппаратную конфигурацию или выбрасывать исходные работающие шаги. Текущая разрешённая оптимизация253 использует только доказанно повторный новый AND; будущий And7 в её бюджет не включён.

Запись остановлена. SAL/SGVL, runtime и тесты не менялись.
