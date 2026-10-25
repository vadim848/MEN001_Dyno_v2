Срез / роль / дата: E1-kill-audit (аудит ложных kill в мутациях E1-f1) / независимый ревьюер / 2026-10-21, HEAD b580920

Источник: SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603 (canonical = candidates/resumed-f1/native, сверено).
Стенд: sal-parser fbf239e4…195c, sal-runtime 14d50f18…698e, sal-native-structure f5c15bd2…77fc. MUTATION_RESULTS aeb9cb24…c44b, make-mutants a3fa0fa5…10dc, run-battery f0e82a03…a1b7.

## Сделано

1. Перегенерированы все 26 мутантов через make-mutants.mjs в scratchpad ревьюера. Sha256 у 25 из 26 совпадает с MUTATION_RESULTS. MU07 отличается, потому что addSymbolReader использует crypto.randomUUID для Id обёрток. Поведение не меняется.
2. На всех 26 мутантах и F1 выполнен структурный preflight: inspectNativeSalStructure PASS и bindingAudit PASS. Ни один ERROR/FAIL раннеров не может происходить от отказа загрузки, парсинга, native-structure или binding audit.
3. Проверены 8 shared-файлов (current-early-sto, current-estop-native-pairs, current-plc-pulse-set-permit, current-rnd-physical-integration, current-safe-run-gestures, current-unlock-estop-permit, current-rnd-down-no-reenergy, current-timer-one-ms) и их хелперы. Результат:
   - helpers/v2-structural.js они не импортируют;
   - 64-hex литералов нет;
   - sha256 в safe-run-source/rnd-down-source только записывается в диагностику и ни с чем не сравнивается.
   - current-early-sto-bindings.test.js импортирует v2-structural и пинит SHA, но в набор 8 файлов не входит: его тестов «LV254» нет в results/f1/shared.tap.
   - Внутри 8 файлов есть один пин параметра: R3PAIR «actual configured delay remains250». Он падает только на MU26 и при оценке отброшен.
4. Перезапущены батарея (run-battery.sh) и f1-gaps на F1, MU05, MU07, MU08, MU15, MU18, MU22. F1: 58/58 PASS. Счётчики мутантов совпали с архивными логами. Причины каждого FAIL/ERROR взяты из JSON.
5. 8 shared-файлов перезапущены на минимальной копии репозитория:
   - версии тестов на момент E1: F1 339/339; MU18 5, MU22 87, MU25 26, MU26 15 (совпадает с архивом); дополнительно MU05 0, MU07 0, MU08 2, MU15 70;
   - текущие версии файлов: те же счётчики.
6. Для kill с одним тестом сравнены полные трассы F1 и мутанта. Расхождение есть на реальных typed-выходах, а не только на внутренних узлах.

## Итог по мутантам

| ID | Вердикт | (a) Что падает | (b) Поведенческое ожидание из требований? |
|---|---|---|---|
| MU05 | GENUINE-KILL | Падает 1 assertion в qualification `F1-real-lock-producer-rejects-green-and-doesnotqueue` (на F1 PASS). Нарушено: «qualifiedgreen while actuallockTRUE cannot own physicaldown» a=true. При этом ~2,6 с держатся реальные запросы: b_Reset_STO_DR1/2_4, b_Set_HV_Discharge_Request_3, b_Reset_HV_C2_4, b_Step12_Set_2. | Да. Сохраняемое reference-гейтирование зелёной кнопкой при ResetPB_Lock. |
| MU07 | GENUINE-KILL | Падает 1 assertion в `F1-green-qualified-lateblue500-cannot-cancel`: «acceptedgreen survives lateblue by first+503» a=false, rises 0≠1. В F1 начинается Run-down (STO_DR1/2, out_HV_C2, outPLC_STO снимаются), в MU07 — нет. | Да, Q-500/D-Q500. Граница строго 500; при 600 мутант проходит. |
| MU08 | GENUINE-KILL | Падает assertion в gaps GAP-8: «no Run owner / Run normal-down request while in R&D» a=true. Кроме того (перезапуск ревьюера) падают 2 assertion в current-rnd-down-no-reenergy: «No LV/HV proposal or permitted Set replay». В R&D 727 мс держится out_HV_Discharge_Request, 202 мс — b_Step12, есть LV proposal. | Да. Vadim #5 (один шаг на жест), без повторной подачи энергии. |
| MU15 | GENUINE-KILL | 1 FAIL (GAP-8): Run-down owner и typed-запросы TRUE в R&D ещё до кнопки. 57 ERROR связаны с поведением, не с загрузкой: 52× «Actual ordinary Step2 outputs preparation failed» (STO/HV не устанавливаются в ordinary Step2), 5× «Fixture missing sto1». Перезапуск ревьюера: shared 70 FAIL, из них 65 assertion («drive1/drive2 permits torque at N+2», «actual HV rise count», «ordinary Set establishes output»). | Да. Vadim #5, StartingRun, сохранённый запуск Step2. |
| MU18 | GENUINE-KILL | В gaps 8 FAIL с requirement-меткой «fresh green500 … available». Shared: 5 assertion «positive/recovery actual four downstream requests available» a=false. Реальные typed-запросы Run-down не выдаются. Kill в qualification (OR5 q+2) — внутренний, и это записано верно. | Да, liveness: одиночная зелёная 0,5 с в Run → нормальный останов. |
| MU22 | GENUINE-KILL, с пределом | В батарее 0 FAIL. 9 ERROR — «Fixture missing lv=true»: Safe BOTH 1 с больше не даёт LV. Это потеря liveness, не загрузка/SHA. Shared: 85 assertion, в том числе «existing up request at full BOTH threshold» a=false (16), «up request rise count» 0≠1 (16), «real physical recognizer must accept SU» (52). Ещё 2 fixture-ERROR не засчитаны. | Да, позитивные требования BOTH 1 с → StepUp/запуск. Убит через потерю позитивного пути, а не через запрещённый переход. Защитная роль NOT T не продемонстрирована. |
| MU25 | GENUINE-KILL | Shared: 26 assertion: «no command before complete BOTH interval» a=true (16), «no Safe StepUp before full1000 BOTH anywhere», «no up before full restarted1000». | Да, BOTH 1 с. Батарея охватывает только Run и этот мутант видеть не может. |
| MU26 | GENUINE-KILL | Shared: 14 поведенческих assertion: «existing up request at full BOTH threshold» a=true при delta 251/252/255/260, «late300 … creates no StepUp» a=true, «late second cannot create retrospective up». 1 падение — пин параметра R3PAIR; оно отброшено. | Да. Окно 250 мс включительно, D-LATE-SECOND. |

FALSE-KILL: нет. UNDETERMINED: нет.

## Влияние на TRACE_MATRIX gates.E1-f1.mutations

Значение killedByRequirement 23/26 подтверждено, менять счёт не нужно. `auditPending` можно заменить ссылкой на этот аудит. Рекомендуемые аннотации:
- MU22 убит только через потерю liveness;
- MU25 и MU26 убиты только shared-файлами (killers пусты);
- MU05 и MU07 убиты одним тестом каждый, и этот тест есть только в program/tester/E1-f1/runners;
- sha MU07 не воспроизводится.

Повторно не аудировались:
- MU01–04, MU09, MU12–14, MU16, MU17, MU19–21, MU23 — их убивает много тестов; от kill из-за загрузки их защищает только общий preflight PASS;
- MU24 — есть прежний перезапуск ревьюера (8/16 FAIL, assertion).

## Замечания (не блокируют счёт)

1. Тестировщику (minor). В MUTATION_RESULTS поле killers пусто для MU22/25/26 при killedByRequirementTest=true. Нужно записать фактические shared-killers.
2. Тестировщику (minor). Поле battery.fails считает нарушенные проверки, а errors — случаи; единицы смешаны (у MU01 fails 43 при 16 тестах). Единицы нужно задокументировать.
3. Тестировщику (minor). Sha MU07 недетерминирован. Нужны детерминированные Id или пометка, что воспроизводимо только поведение.
4. Ведущему/тестировщику (moderate). MU05 и MU07 ловит по одному тесту в runners тестировщика. Ни 8 shared-файлов, ни запускаемая часть SafetyTests/test их не ловят (у F1/MU05/MU07 одинаковые множества pass/fail). Без переноса этих двух тестов в регресс, как сделали для MU24, гейтирование Lock и приоритет ровно-500 не защищены.
5. Тестировщику/архитектору (moderate). MU22 нельзя приводить как доказательство свойства attempt-owner T: защитная функция этого guard тестом не показана.

## Команды воспроизведения

Пути относительно SafetyTests; S — scratchpad ревьюера kill-audit/.
- `node program/tester/E1-f1/make-mutants.mjs candidates/resumed-f1/native $S/mut`
- `bash program/tester/E1-f1/run-battery.sh program/tester/E1-f1/runners $S/mut/MUxx $S/res/MUxx`
- `MEN001_F1_ROOT=$S/mut/MUxx MEN001_F1_GAPS_OUTPUT=$S/res/MUxx/gaps.json node program/tester/E1-f1/runners/f1-gaps.mjs`
- Shared: копия MEN001_Dyno + SafetyTests/{src,test,fixtures,*.json} с SAL мутанта, затем `node --test <8 файлов>`.

## Результаты

- F1: battery 58/58 PASS, shared 339/339.
- Дословно, примеры:
  - `not ok 3 - EARLYSTO physical green/HVHealthyfalse early N+2 fixed1` (MU22: «real physical recognizer must accept SU, no request seed»);
  - `not ok 162 - R3PAIR actual WINDOW master is exact first-only; remaining metadata is genuinely unbound` (MU26, структурный пин, отброшен).
- Полные taps лежат в scratchpad: rr/*.tap и cur/*.tap.

## Допущения и пределы доказательства

- Только офлайн-модель стенда. Это не IDE Verify/Build, не native CRC, не Target и не hardware.
- Полный текущий SafetyTests/test в минимальной копии не запускается (не хватает ресурсов). Вывод о регресс-защите MU05/MU07 ограничен запускаемым подмножеством (401 тест).
- ERROR фикстур (preparation/«Fixture missing») не засчитывались как kill. Поведенческая природа подтверждена только для указанных мутантов.

## Вопросы аналитику/Вадиму

Нет.

## Что передать следующему и кому

- Ведущему: снять auditPending и внести аннотации в TRACE_MATRIX; решить вопрос о переносе тестов-убийц MU05/MU07 в SafetyTests/test.
- Тестировщику: замечания 1–3, 5.
