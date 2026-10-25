# Короткий PLCstop: требования к LV/HV Set follow-up

2026-10-19. Аналитик требований прочитал PLC_PULSE_SET_GUARD_REVIEW.md и
scripts/probe-plc-pulse-set.js. Это предварительный приёмочный контракт,
не реализация/независимое ревью/повторный запуск probe. SAL/tests/runtime
не меняются. Нет нового пользовательского поведения или новых времён.

## Авторитетный oracle

SPEC§12/EMG-006: устранение причины само не заменяет разрешённое ручное
квитирование; автоматический возврат в R&D/Run запрещён. EMG-005 запрещает
отмену уже начатой аварийной последовательности восстановлением защитного
входа; EMG-011/§13 требует аварийного приоритета над новым повышением энергии.
Reference/current FBAnd1 использует NOT in_Estop_PLC AND NOT in_False_SI2_CH8
как вход разрешения действующего FBEstop1. EStop manual restart contract
подтверждён существующими reference-v2 сравнениями и текущими тестами.

Поэтому один наблюдаемый PLCstopTRUE scan — уже fault event. Следующий
PLCstopFALSE не разрешает НОВЫЙ LV/HV Set без Restart, независимо от задержки
обновления b_EStop_Ok в глобальном порядке. Нельзя определить конец аварии
из rawFALSE или из запаздывающего внутреннего разрешения. Вопрос пользователю
об этом не нужен. Сам Set gate не обязан сбрасывать уже включённый output:
Reset/emergency removal остаётся отдельной существующей последовательностью.

## Минимальная реальная цепь и явный state cut

До выделения среза выполнить full-source SAL/SGVL binding audit. Затем
обязательно реальные блоки текущего источника:

- Network1/FBAnd1, FBEstop1, FBAndLvCurrentPermit;
- для LV: Network11/FBAnd1 → Network1/FBOr17 → FBAndLvSetPermit → FBRs1;
- для HV: Network1/FBAnd6 → FBOr18 → FBAndHvSetPermit → FBRs2.

LV cut: b_Step12TRUE, но это не доказательство достижимости фазы. HV cut:
upstream Network1/FBAnd4/AndOutTRUE для реального retry producer FBAnd6;
это не полный accepted request. Не подменять producer прямой инъекцией
aggregate/Set=TRUE как единственным доказательством. Если реальный inherited
Network5 producer можно подготовить полным программным trace без новых
предположений, добавить его как независимый маршрут; недостижимость в probe
не разрешает invented preconditions.

Reset aggregate имеет явную границу FALSE, его внешние producers исключены.
Это изолирует отсутствие НОВОГО Set и сохранение latched output; не утверждает,
что полный emergency Reset должен оставатьсяFALSE. Healthy raw inputs,
MenteeFALSE, FalseinputFALSE задаются явно. EStopOK подготовить НАСТОЯЩИМ
Restart high→falling edge и проверить успешность, не постоянно seedTRUE.

Реальные execution orders сохраняются. Наблюдение непрерывно, source SHA,
scan grid/clock contract/cuts записаны. Не сортировать блоки искусственно
ради устранения counterexample, не добавлять ожидание ради PASS.

## Парные сценарии и критерии

| Сценарий | Подготовка | Обязательный результат |
|---|---|---|
| Healthy positive LV и HV | Реальный producer уже поднял aggregate, output ещёFALSE; тот же фон/порядок, fault не подаётся | Output действительно становитсяTRUE. Постоянный запрет Set не проходит |
| One-scan PLC pulse | Та же prehistory, PLCstopTRUE ровно один наблюдаемый sample | Output остаётсяFALSE в fault scan, даже если EStopOK ещёTRUE |
| Raw restore без Restart | В следующем sample PLCstopFALSE при всё ещё реальном pending Set | OutputFALSE уже в ПЕРВОМ recovery scan и далее, ни краткого TRUE |
| Позднейшее восстановление | Fault держится дольше, затем rawFALSE, Restart отсутствует | Никакого нового Set, повторить границу восстановления |
| Разрешённый Restart positive | После fault/restore выполнить существующую ручную high→falling процедуру; green high не объявляется завершённым reset | Только после успешного Restart и актуальных permissions новый real Set может включить output |
| Уже latched output | OutputTRUE, Reset boundaryFALSE; затем Set запрещён PLC pulse/recovery | Изменение Set permission само не forceReset. Это компонентная граница, не запрет полной аварийной процедуры |

Предыстории healthy/fault должны совпадать до единственной fault sample.
Для LV/HV проверить первоначальный aggregateTRUE/outputFALSE checkpoint;
иначе ошибочный уже включённый latch скроет новое повышение и не проверит gap.

FBAnd1 также зависит от in_False_SI2_CH8: при добавлении его выхода в guard
проверить этот второй программный operand и текущие AND контакты. Не объявлять
его константой/физическим EStop по имени. Новый смысл входу не назначается:
сохраняется его реальная роль в существующем EStop producer. Не менять input
values ради PASS или электрические/global параметры.

## Tests-first red и приёмка

На неизменённом source после принятой03B ожидается red минимум для first
raw-restore LV и HV: фактический outputTRUE против обязательногоFALSE.
Healthy counterpart обязан быть PASS; missing producer/binding/error не
считать найденным дефектом поведения. Сохранить baseline с SHA и временными
checkpoint, до редактора сделать обычный review/checkpoint по workflow.

После реализации все перечисленные positive/fault/recovery/latch границы
проходят. Существующие nine-permission truth tables, firstfault/stalepositive
tests, Mentee guard, Door consumers и Unlock07 не ослабляются; обновление
active-input metadata обосновывается точным native diff. Проверить alias/global
IDs, canonical wire edge и отсутствие дублирующей DSL связи. Полный пакет и
независимое ревью обязательны; unrelated FAIL/NV сохраняются видимыми.

Этот follow-up закрывает pulse/recovery границу LV/HV Set, не fullBOOT,
полную emergency ownership/достижимость фаз, не earlySTO и не PLC-only command
policy. Исходный probe — read-only scoped evidence, не уже принятый тестовый
пакет. Native/hardware validation и deployment вне объёма.
