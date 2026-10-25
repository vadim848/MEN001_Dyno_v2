# Независимое техническое ревью03B R1 release preparation

2026-10-19. Read-only проверены RELEASE_PREPARATION_FIX.md, derivation script,
производный JSON и расширение design replay. Actual SAL/тесты ревьюер не менял.

## Вердикт

R1 fix принят как техническое решение для actual integration review.
Существенных замечаний к проверенной дельте нет. Это не замена whole-source
приёмки03B и не доказательство native firmware/group lifecycle.

## Смысл исправления

P теперь sample памяти ReleaseEnable: Set=ReleaseEnable, Reset=!ReleaseEnable.
Он снимается в held attempt, чтобы первый neutral sample дал RestartTRUE,
следующий — падение Restart и реальный helperReady. Подготовка происходит
внутри2000мс release, а не ещё двумя сканами после окончания фильтра.

A.Set=P(snapshot)&&off&&WindowReady&&ReleaseDone; A.Reset=!E. На конце
полного release2000 C/L/T очищаются прежним FullReset, но A не стирается
этим же условием; firstpress2001 после наблюдённого complete sample2000
принимается. На1999 ReleaseDoneFALSE, C/L либо ещё не готовый A запрещают
попытку. Это не введение allowance2002 и не изменение таймера2000.
Факт завершения фильтра и первое последующее нажатие датируются отдельно.

Новые значения P0/A1 не ошибка one-hot: это независимые flags. Удержание
SG/SU по-прежнему запрещает ReleaseEnable/rearm, ordinary release не снимает
принятый запрос. E loss даёт P reset и A reset в том же compute/commit;
после восстановления требуется новый полный release. Аварийный downstream
owner/sequence необходимо подтвердить отдельно на actual source.

## Независимые проверки

Структурное сравнение optimized→release-fix JSON показало изменения только
GATE_016, STATE_P, STATE_A. Добавлен один direct binding на existing
GATE_016/AndIn4, остальные retargeted canonical edges обновлены. Новых
блоков/портов/alias/global нет,47graph/253total, order map побайтно прежний.
Native contact polarity P.Reset и A.Reset соответствует inverted source.

Самостоятельный design replay `--release-controls`:48/48 PASS. Сохраняются
исходные36, повторные singles после blue+fullrelease, early1999, heldentry,
freshchord249/250/251 обеих очередностей после предыдущей blue. Последние
controls различают неполный fix, который восстанавливал singles, но терял
новую window preparation. Replay исполняет netlist, не сохранённые PASS.

Проверены causal Restart/Ready и fixed-scan timing формулы;48 design cases
не выдаются за actual69 или полное fault/recovery evidence. Whole review
обязан проверить actual firstoff/secondoff/1999/2000/firstpress2001 traces,
helper interfaces/параметры, no invented Error oracle, все старые source IDs/
timers/relationships, actual positives/negatives и полный пакет.

Действующий план интеграции — optimized253 с этим derived fix. Старые254/
netnew45 ссылки в исторических материалах не актуальная инструкция.
Никакого изменения250/500/1000/2000 либо runtime clock не требуется.
