# 03B R1: подготовка helper в течение release-фильтра

Статус **READY для редактора и независимого actual review**, только программный пакет. 253 блока, все execution orders и времена сохраняются. Новый netlist `03B_COMPACT_RELEASE_FIX_PLAN.json`; производный, baseline253 не переписан. Редактор реализует в текущем stable actual03B, автор этого плана SAL не менял.

## Причина двух actual FAIL

Редактор воспроизвёл после принятой blue: release1999ms P/A=1, helperReady0; на2000ms FullReset очищаетP/A; на2001 P снова1, ноA0; только2002 helperRestart падает иA устанавливается. Firstpress2001 поэтому отвергается. Добавлять эту задержку к нормативным2s нельзя.

Первый минимальный вариант P.Set=ReleaseEnable, A.Set+=ReleaseDone, A.Reset=!E исправил singles, но design freshchord249/250 после предыдущейblue дал4FAIL: старый P удерживался1 в held attempt, helper не получал нового Restart до конца фильтра. Эти контроли сохраняются; одних двухsinglepositives недостаточно.

## Итоговые точные связи

| Порт | Новая связь |
|---|---|
| STATE_P/Set | GATE_008/AndOut (ReleaseEnable), direct |
| STATE_P/Reset | GATE_008/AndOut, inverted |
| STATE_A/Reset | GATE_001/AndOut (E), inverted |
| GATE_016/AndIn4 | RELEASE/TonOut (ReleaseDone), direct, Activate existing unused port |

GATE_016 первые3входа P(snapshot), off, WINDOW.EStopOut неизменны. GATE_007 Restart=!P(snapshot)&&off&&E неизменен. Все C/L/T/BA resets, SG/SU lifetime и остальные wires неизменны. Current AND input4 GUID берётся из существующего actual блока/плана; новый block/port не требуется. Все удалённые связи корректировать через canonical edge и metadata usages; новые здесь только direct edges, не alias/global references.

P теперь хранит предыдущую sampled ReleaseEnable, а не «фильтр уже прошёл». При held attempt ReleaseEnableFALSE→P0. Первый neutral sample: helperRestartTRUE, safetyinputoffTRUE; P1. Следующий neutral sample: RestartFALSE, helperReadyTRUE. A получает Set только при полном ReleaseDone и Ready; FullReset его больше не стирает. Наrelease2000ms C/L/T очищаются иAостаётся/становитсяTRUE; следующий firstpress2001 квалифицируется. P=0/A=1 возможен на press и не является invalid one-hot состоянием: flags независимы.

При E loss ReleaseEnableFALSE очищаетP, !E очищаетA; новая попытка после восстановления требует полного фильтра, A не наследуется черезfault. При shortoff фильтр не закончен; C/L либо отсутствиеA блокируют новую попытку. SG/SU могут удерживать request и запрещать rearm до исходного завершения — этот контракт не заменён.

## Проверки

Воспроизведение design-only:

```powershell
node SafetyTests/scripts/derive-compact-release-fix.js
node SafetyTests/scripts/check-compact-plan.js SafetyTests/03B_COMPACT_RELEASE_FIX_PLAN.json --release-controls
```

Получено **48PASS/0FAIL**: исходные36, повторные singlegreen/blue послеblue+fullrelease, tooearly1999, held-entry, freshchord249/250/251 обеихочередностей послеblue. Unfixed исходныйgraph на двухrearm singles даёт2FAIL; промежуточныйнеполныйfixдаёт4freshchordFAIL. Эторазличаетархитектуру, аневоспроизводиттолькоожидаемуюформулу.

Доactualприёмки редактор добавляет/запускает paired red controls свежегоchordпослеpreviousacceptedblue и nativehelpertrace. Неизменный существующий61 пакет должен пройти; новыеactualcontrolsнеподменятьdesign48. Trace firstoff/secondoff/release1999/2000/firstpress2001, helperRestart/Out/Delayed,P,A,C,L,T, acceptedcommands. Проверить before/at/after250 вfullinterval, noearlysingle до500, continuousBoth1s, earlyentry/shortoff, E loss+restore/rearm, nohelperError. Дополнительный Restart while alreadyEnabled вneutral не объявлять native fault по предположению: сопоставить noEDM native contract и current actualhelper wiring, mainEStop untouched.

Никаких изменений250/500/1000/2000, новогоscanallowance или generalruntimeclock. Полныйsourcebindingaudit доscope cuts. Порядки не изменены, бюджет253. Запись остановлена.
