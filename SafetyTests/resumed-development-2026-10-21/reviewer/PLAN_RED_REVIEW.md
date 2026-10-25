# Независимый gate плана P0 и исходного RED — 2026-10-21

**READY: отдельный редактор может строить изолированный ресурсный кандидат P0 на241 FB.** Это приёмка ограниченного плана и честной RED-точки передачи, не эквивалентности кандидата, не переноса в canonical и не функциональной приёмки41 требований. Кандидат240 FB с P0g пока не включён в машинный ledger: перед его реализацией нужен отдельный точный delta/manifest.

## Источники и независимая проверка

Прочитаны последние AGENTS/WORKFLOW, SCENARIO_DECISIONS, ANALYST, RESUME_HANDOFF, текущий ARCHITECT и make-p0-ledger/P0_REBASE_LEDGER, прежние frozen logical P0 и независимые plan/test reviews, старый builder, новые tester runners/TEST_READINESS и результаты. Последнее уточнение ведущего: мигание не является входом guard; новое PLC request принимается при обеих отпущенных физических кнопках, проигнорированное не ставится в очередь. Это не разрешение добавлять lamp input или кодер17/24.

Сначала повторно прочитан подтверждённый reference (10 Networks). До разбора текущих функциональных узлов независимо выполнены whole-source native-serialization preflight PASS14 Networks/254 FB/2172 ports/75 Symbols/319 wires/0 cross-network и typed SAL/SGVL binding PASS206 refs. SHA текущего SAL совпадает с ledger `59bf4ec1fe83d49f50b32ea89a230f42a1f18cb20122649cf5c4de435d552c33`; SGVL `c31e129072e2837234e376e51038ff988a92373cbfea97b383fbf23536c7946b`; diagram `449ea8ca664ff18078154cc91ccc40f575e20e3be5a4cfecf68cd3265d8c8bfc`. Никакой свежий native CRC/IDE/Target PASS этим не утверждается.

## Ресурсный план

Независимо пересчитаны13 существующих retirement paths, наличие всех21 удаляемых текущих canonical edges,8 добавлений, отсутствие dangling/duplicate endpoint и порядок оставшихся блоков. Результат **254−13=241 FB,2066 ports,75 Symbols,206 global refs,319−21+8=306 local wires** согласован. Удалённые13 проводов и блоков — разрешённый логический delta, а не потеря объектов native serializer. Требовать неизменные319 wires после законного delta было бы неверным; требовать сохранение всех не затронутых delta связей обязательно.

Старые frozen343→330wire/64alias/200ref/primitive-port данные неприменимы целиком к текущему исправленному исходнику. Их алгебра/window reasoning можно переиспользовать; старый serialization builder нельзя. Он реконструировал alias targetUsages, терял nonprogram relationships и перезаписывал port attributes из устаревшего manifest. Прежний parser/EXACT_PROOF PASS этого не исключал.

Принятая стратегия текущего ARCHITECT — clone текущего native/XML, только ID-targeted удаления/замены usages внутри существующих singleton collection/relationship wrappers либо native API, затем установленный native save и независимый fresh reload. Обязательные условия для редактора/следующего gate:

- Сохранить все75 Symbols и их объявления/источники; все alias/device/group/export/nonprogram usages и GUID отношений вне точного delta. Ledger inventory75 — полезный baseline, но само наличие списка ещё не доказательство сохранения кандидатом.
- Проверить native sourceUsages/targetUsages и каждый relationship/collection wrapper, aliases по ID, точные target/source indices в SAL и SGVL, отсутствие dangling retired IDs. Не заменять проверку не затронутых native records сравнением только parser convenience arrays.
- Сохранить все существующие safe-input AndIn1 исправления FBAndUnlockHold/FBAndLvCurrentPermit/GATE001 и все не изменяемые retained port attributes. Новый Activated/directNC ставится только на перечисленные новые AND/OR slots. DECOUPLE не получает недопустимые contact attributes.
- Сохранить retained parameters/initial data/групповые и аппаратные metadata и неповреждённую geometry; один canonical wire на пару, межсетевые связи только Symbols. После native save снова проверить manifest/counts/usages: CRC после потери объектов не принимается.
- Freeze точные candidate SAL/SGVL/diagram/helper/runtime hashes до независимого исполнения. Не копировать старый candidate поверх repaired working source. Запись только в назначенные editor/candidate directories; canonical неподвижен.

### Дополнительный P0g

Независимо просмотрены реальные `Network6/FBAnd2`#53, `FBDecouple1`#62 и `Network3/FBRs4`#65. Единственный полезный Decouple channel1 передаёт And2 в единственный writer `b_Step4_Set`; текущий sole global reader — OR8#64, который P0 удаляет перед прямым RS65. У прочих выходов нет видимых wire/global consumers. Перенос writer на And2 сохраняет читаемое RS значение при отсутствии промежуточного reader; это обоснованный дополнительный ресурсный вариант.

Однако machineledger пока описывает только13 retirements. **240/2050ports/305wires нельзя объявить принятым кандидатом по текстовому предложению.** Для P0g нужны ещё точный retirement ID/ports, wire/global/SGVL substitution delta, экспорт/nonprogram audit, firstscan/order proof и добавленный independent paired case. Это не блокирует реализацию241.

## RED и тестовый gate

Исходный full run с Git ownership environment failures сохранён, его нельзя считать чистой regression baseline. Повторный baseline2 использует только process-local safe.directory для известных путей, без изменения oracle:189/189 harness,75/75 historical,443/445 current;200 PASS/1 conditional STATE FAIL/7 NV/0 ERROR. Expected exit1 сохраняется. Эти результаты — независимый tester evidence, reviewer не выполнял второй полный suite заново.

Новые Run20 =10 PASS/10 FAIL/0 ERROR соответствуют действующим chord/cleanup/500 позитивам и не требуют старого одновременного STO/discharge/C2 fanout как правильной новой остановки. Это command-cone с явной Step3 границей, не full Run reachability. Lifecycle-v2 =3 PASS/6 FAIL/1 fixture ERROR честно отличает подтверждённые нарушения PLC/StartingRun от неудачной подготовки normalRun. ERROR требует исправления стенда; его нельзя превращать в SAL FAIL или PASS. Эти RED-проверки пригодны для checkpoint и последующих функциональных срезов; они не закрывают нормальный SS1/coast/полный stop.

Для ресурсного кандидата остаётся прежний независимый paired test contract: обе стороны строят реальные producer closures после full audit; stable-within-scan input contract явный; сравниваются реальные значения на semantic reader evaluations, а не произвольные end-of-scan globals после переноса публикации. SNAP0/SNAP1 first-read/unchanged declared initial values, все8 distribution/16 conjunction tuples, независимые start/hold/reset обоих5s timers, held/edge/release/firstscan/phase handoffs обязательны. Нативная физическая sampling-equivalence этим не доказывается.

На точном candidate повторить сохранённые Safe/RnD69/earlySTO88/LV completion/no-reenergy/legacyStep2/emergency40 и текущий полный пакет с допустимой только ledger-backed структурной миграцией. Недостающие обязательные матричные строки помечать NV, известные функциональные FAIL не ослаблять ради P0. Ни paired equivalence, ни native serialization/CRC не закрывают Run/stop/reset/PLC/BOOT/state-conflict требования41.

## Передача

План241 и RED достаточно конкретны для независимого редактора; следующий обязательный gate — candidate native/manifest checks, editor selfchecks, независимый paired/regression tester и отдельное candidate review. Optional P0g пока отдельно. Полный <=255 функциональный граф ещё не доказан. Все прежние реальные FAIL/NV, seven Network4 cuts/group engine/BOOT ограничения и остающиеся сценарные уточнения сохраняются.

Старые handoff строки «blink pending», «baseline2 pending» или «lifecycle second run pending» заменены новейшим RESUME_HANDOFF и фактическими результатами; не использовать их как новые блокеры. В reviewer ownership записан только этот отчёт. Рабочие исходники, тесты, runtime и oracle reviewer не менял.
