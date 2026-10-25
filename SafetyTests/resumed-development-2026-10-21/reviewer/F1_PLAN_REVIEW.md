# Независимое ревью плана F1 — 2026-10-21

**READY для отдельного изолированного F1-кандидата после приёмки точного P0 baseline.** Это gate архитектуры qualification/owner, не приёмка F1 реализации, не разрешение перенести непроверенный F1 и не подтверждение правильного нормального stop receiver.

Прочитаны latest Vadim rules, P0 actual source, F1 MD/JSON. Frozen JSON SHA256 `b52f6b0e440a09ce138ad91e633b2fcd78f431d246a4dbdabc083809a0a08b60`; source P0 SAL34b5b850…/SGVL517fdadd…/diagram7b5eb794…. На этом source ранее reviewer самостоятельно выполнил whole-native structure/typed bindings и фактический ordered-ID audit. Генератор плана не перезапускался.

## Точность и смысл delta

Пересчитано:241−1 raw TON+1 OR+1 RS=242 FB;2066−2+9+3=2076 data ports;206+3=209 global refs;306−2+3=307 wires;75 Symbols остаются. FullOrderedManifest имеет242 уникальных block IDs. Это не внедрение ещё одного500ms timer: native GREEN500 остаётся, дублирующий RunTON удаляется. Никакие прочие заданные таймеры не меняются.

MODE расширяется Run, при этом RND_SCOPE/reset SG/SU сохраняются. Down qualification берётся из общего GREEN через существующие !ResetLock/!False и Run qualifier. Удаляется только raw-blue veto этого нормального Run route: после признанного green500 поздняя blue не должна отменять accepted single. Роль зелёной Restart/немедленного снятия Unlock и остальные safety guards не удаляются.

Новый reset-dominant owner после And24 читает реальный And23; OR5 читает owner предыдущего упорядоченного прохода. Это явное изменение владения и latency, а не «всё в том же scan»; q/q+1/q+2/q+3 chronology плана согласуется с реальным источником. Новый owner сохраняет признанную down при обычном release/late-second; protective request/потеря permit имеют reset priority.

## Уточнение объяснения BOTH

Reviewer установил: текущий `GATE_020.AndIn5=linkSafeRndScope`; при его сохранении в Run GATE020 уже FALSE. Поэтому полноценная Run BOTH не устанавливает C через GATE030.OrIn3 и не доходит до STATE_SU.Set. Отсутствие SU в Run объясняется **и входным scope, и reset scope**, а не одним reset-dominance. Нельзя требовать в тесте C=TRUE после игнорируемой BOTH только по фразе MD «consume attempt».

Нужный внешний контракт — отсутствие up/down/Unlock и запрет деградации до полного release. Его обеспечивает retained attempted-BOTH T/late-L logic, даже если consumed-C здесь не устанавливается. Архитектор принял пояснение и исправил MD; замечание закрыто без изменения frozen JSON либо ослабления oracle. Если архитектура всё же изменит GATE020 для нового C-поведения, потребуется новый план и отдельное review.

## Обязательный следующий independent test gate

- Оба порядка249/250/251/499/500/501, single499/500, BOTH999/1000; failed chord и частичное release/repress без2с. Проверять реальные qualification/attempt T/L/C, And24/And23, owner Set/Reset/Q и все actual requests, а не только конечную фазу.
- Green на500 и late600 сохраняет признанное down; full BOTH Run игнорируется; после полной очистки новая green допускается. При !ResetLock отказ не должен превращаться в очередь после снятия lock.
- Подъём реальными writers до Run с исходной удерживаемой BOTH не создаёт дополнительной операции. Down ownership через реальный выход Run→Step12→RnD, совпадения phase/guard change до pending q+1, запрет второго RnD→Safe из того же hold; свежий следующий цикл сохраняется.
- Safety reset priority в qualification/next scan и raw restore не возвращает owner. Не подменять Reset inputs b_Step_RnD_Set/b_Step4_Set тестовыми FALSE: включать их реальные producers и проверять normal/protective cleanup. Это особенно важно, поскольку linkRndGatePermit пропадает в Step12.
- Парные RnD/Safe/earlySTO/LV/emergency positive/negative controls, полный native wrappers/75Symbols/76nonprogram/85SGVL/current-source-slot/geometry+freshCRC gate после реальной сборки. Только ledger-backed структурная миграция наблюдений.

F1 не исправляет старый одновременный STO/discharge/C2OFF fanout. Требуемая2с SS1 остановка остаётся FAIL для F2, а StartingRun abort, PLC new-event/noqueue, SafetyFault reset, StateConflict и BOOT — дальнейшими отдельными этапами. Не использовать этот gate как all41PASS. Reviewer менял только этот отчёт; SAL/SGVL, тесты и oracle не менялись.
