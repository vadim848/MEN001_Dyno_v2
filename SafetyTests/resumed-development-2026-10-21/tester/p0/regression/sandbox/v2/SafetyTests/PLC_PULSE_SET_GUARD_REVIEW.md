# LV/HV: short PLC stop + raw restore counterexample

Статус: **воспроизведённый scoped gap принятых02/04/05**, read-only probe на actual03B253, не fullBOOT reachability claim. Нужен отдельный follow-up; SAL/runtime/tests здесь не менялись.

Воспроизводимый отдельный probe: `node SafetyTests/scripts/probe-plc-pulse-set.js`. Скрипт только читает source, печатает SHA256 и обе healthy/fault пары LV/HV; не входит в acceptance pipeline и не записывает файлы.

Последний воспроизведённый sourceSHA256 `a45f129ebdc8e60602465381fd7a0579c8c9c18a84c9ae9a6abdb45cb462e51a`. Common/guards/RS/EStop/PLCproducer orders2/3/4/5/6/21/95.

Граф probe включал реальные Network1/FBAnd1 (PLCproducer), FBEstop1, FBAndLvCurrentPermit, соответствующий SetPermit/RS/aggregate и producer. State Reset boundary FALSE явно задан исключением его внешнего producer. LV: настоящий Network11/FBAnd1 при b_Step12TRUE; HV: настоящий Network1/FBAnd6 при upstreamFBAnd4/AndOutTRUE (явный cut, как существующий third-route test). EStop установлен настоящим manualRestart, а не постоянно seededhealthyglobal. ВсеrawNC/connectorshealthy, MenteeFALSE, FalseinputFALSE.

| Фаза | LV output | HV output | EStopOK | PLCproducer | Aggregate |
|---|---|---|---|---|---|
| producerprehistory | FALSE | FALSE | TRUE | TRUE | TRUE |
| PLCstopTRUE одинscan | FALSE | FALSE | TRUE | FALSE | TRUE |
| rawrestoreFALSE безRestart | **TRUE** | **TRUE** | **FALSE** | TRUE | TRUE |

На recovery Common order2 читает предыдущий EStopOKTRUE, guards3/5 разрешают старый Set, RS4/6 устанавливают output. Только позднее mainESTOP читает прошлый PLCproducerFALSE и снимает EStopOK. Поэтому изолированные truth tables и первый faultscan прежних тестов корректны, но не закрывают короткий pulse/recovery memory boundary. Не требуется выдуманное время ожидания.

## Предлагаемый малый follow-up

Добавить existing Network1/FBAnd1/AndOut четвёртым direct входом **обоих существующих** LV/HV SetPermit AND. 0новыхблоков, unusedAndIn4, остальныеbindings/Reset/timers/orders неизменны. CurrentrawPLC остаётся в Common для первогоfaultscan; предыдущий PLCproducer закрывает recovery до обновления EStop memory. Проверить, что producer/source поля не перепутаны с Network12/FBAnd1. Exact port IDs брать из stable source, canonicaledges и fullsourcebindingaudit обязательны.

Проверенные port IDs текущего source: producer AndOut `b7612a8e-6152-4f4a-ae10-7586ff59df60`; LV AndIn4 `580439f5-5a4d-4f02-a63d-35d8d2c74bef`; HV AndIn4 `2a489027-9f62-4a45-8ede-4e1f454e4029`. Новые input contacts direct BreakContactNC, Activated, wrapperGUIDуникален. Producer реально равен !in_Estop_PLC AND !in_False_SI2_CH8 и уже является permission mainESTOP; четвёртый вход переносит именно существующее предыдущее условие mainESTOP, не новую PLC команду. Проверить также Falseinput change, не скрывать вторую зависимость producer.

До правки: новые red paired actual traces, LVStep12иHVretry, дополнительно реальныйlegacyproducer когда достижим программнымtrace; healthy identical trace долженSet. Pulse держитсяодинsample, rawrestoreбезmanualReset. Проверить laterrestore, manuallyacceptedRestartpositive и alreadylatchedoutput: Set gate не вводит forceReset. Исходные firstfault/permission truth-table и producerfanout tests не ослаблять; обновление числаactiveinputs3→4 обосновывается новым binding.

Это отдельный пакет отearlySTO; ведущий агент решает порядок review/редактора. Непроверенные аварийные owners/полныйBOOT по данномуcounterexample не объявляются исправленными.
