# Разряд: фактическая последовательность и недостающий oracle

2026-10-19, архитектор, read-only. Reference Prodoction4495a1f и рабочий v2
прочитаны напрямую через typed parser/canonical wires. SHA v2 при чтении
ea2443b0ea92f95584496360e103f4f9a8b5fd61bb2f492f88a9a9d60628564e.
07 ещё не внесена; новых SAL/таймеров/входов/аппаратных изменений здесь нет.
Источники: SPEC§§8–12, STP-003/EMG-010/MOD-005,
OPEN_SCENARIO_SOURCE_REVIEW и фактический код обоих репозиториев.

Старые V2_RUN_TO_RND_REPORT/V2_RND_TO_SAFE_REPORT сохраняют исторические
traces, но их1/2с gesture предварительные значения superseded500/1000;
legacy-network losthandoff не текущий глобальный порядок. Ниже статические
предикаты, не аппаратная валидация и не доказательство достижимости всех фаз.

## 1. Сохраняемая reference последовательность операций

Reference не имеет имени R&D, но содержит полную removal цепь:
Run Step3 → Step4 → Step5 → Step6 → Safe Step1. Запрос Step4 из Network6
вызывается защитной ветвью. Green input reference идёт в Restart/Network2
start, не новый normal Run→R&D. Новая остановка R&D должна сохранять исходные
операции, кроме намеренных изменений: R&D оставляет LV включённым, тогда
как исходный полный removal отключает LV. Поэтому нельзя механически
перенести целиком Step4 с его LV OFF в normal Run→R&D и назвать это сохранением.

| Фаза/операция | Точный reference predicate/action |
|---|---|
| Step4 entry | Network7/FBAnd1 = Step4 AND NOT FalseSI2CH8 |
| Начало LV removal | FBDecouple1 одновременно пишет LV discharge request, battery/BMS reset; запускает TON1=2с |
| LV contactor OFF | TON1out пишет b_Reset_LV_C1_2 |
| Выбор STO ветви | После TON1, rawHVHealthyFALSE через FBAnd2 запускает два TON=5с; rawHVHealthyTRUE через FBAnd3 идёт в immediate STO reset OR bypass |
| STO commands | Network7/FBOr1/2 объединяют delayed и immediate ветви и пишут ResetSTO1/2 |
| Step5 qualification | FBAnd6/7 требуют каждый ResetSTO request AND соответствующий rawSTO_FBKTRUE; FBAnd8 объединяет оба и пишет Step5Set |
| HV discharge start | Network8/FBAnd1 = Step5 AND NOT False; Decouple1/DecOut3 пишет SetHVDischargeRequest и запускает TON1=1с |
| Начало следующей выдержки | FBOr1 = TON1out OR FBAnd2out; FBAnd2 = тот же Step5 qualifier AND out_HV_Discharge_Request; TON2=1с от OR1 |
| C2 OFF request | Network8/TON2out пишет b_Reset_HV_C2_2 |
| Step6 qualification | FBAnd3 = TON2out AND NOT rawHV_C2_FBK; writer Step6Set |
| Safe qualification | Network9/FBAnd1 = Step6 AND NOT FalseSI2CH8 → Step1Set2 |

Все указанные времена — существующие параметры кода. Их здесь не меняют,
не объявляют валидированными физическими временами и не называют timeout.
RawHealthyTRUE/FALSE — только значения программных ветвей. Физический смысл
Healthy/polarity этим документом не устанавливается. Ветка может переключаться
при изменении rawHealthy, latch выбора в названных блоках отсутствует.

Ключевое отличие от ошибочного «разряд всегда2с»: TON1 и TON2 по1с НЕ
обязательно суммируются. OR1 допускает обход первого TON по уже включённой
КОМАНДЕ out_HV_Discharge_Request. Поэтому точный nominal срок C2 OFF —
выполнение TON2 от своего действительного OR input с учётом порядка сканов,
а не два новых гарантированных интервала ожидания.

## 2. Команда разряда не отдельный feedback завершения

В обоих SAL out_HV_Discharge_Request имеет source
Network1/FBRs7/RsOut и единственный reader Network8/FBAnd2/AndIn1.
Это обратное чтение СОБСТВЕННОЙ команды/latch, не отдельный вход подтверждения
разряда. out_LV_Discharge_Request аналогично source FBRs5, без такого reader.
В declared SAL variables обоих checkout не найден отдельный DischargeComplete,
HVSafe, discharge-feedback/timeout/fault input. Это интерфейс программного
кода, не вывод о проводке/наличии физического датчика.

Предикат native TON по непрерывному уровню без fault output — выдержка,
не watchdog ожидания completion. Нет обнаруженной ветви «таймер истёк,
подтверждения нет → TransitionFault». Конкретный native/group lifecycle
может иметь иные ошибки, но он не заменяет отсутствующий программный
контракт STP-003. Предварительные5/10с FEEDBACK_TIMEOUTS не oracle.

## 3. v2 normal Run→R&D — фактический короткий путь

Network6 сохраняет исходную protective Step4 ветвь и добавляет normal down:

```text
Physical: GreenTON0.5 → And24(!ResetPBLock,!False) → And23(Step3,!blue)
PLC: And15(!mode1,!False) AND And16(mode2,!False) AND Step3Qualifier → And17
OR5 объединяет два источника
```

Это source observation, не утверждённая независимая PLC политика.
OR5 после fanout Network6/Decouple2 одновременно выдаёт:
ResetSTO2_4, ResetSTO1_4, SetHVDischargeRequest3, ResetHVC2_4.
Последний также запускает TON1=0.2с. Следующий Step12Set2 предикат:
TON0.2out AND NOT rawHV_C2_FBK через FBAnd18.

Здесь нет gate между discharge request и C2 OFF request. Отдельный SS1 wait/
coast/discharge-completion predicate в этой normal ветви не найден. Старые
protective Network7/8 остаются другой ветвью, поэтому их выдержки не считать
автоматически выполненными normal path. Decouple2/DecIn5 неподключён, его
Transition4 output не доказательство принятого owner.

Step12 → Network11/And1(!False) пишет SetLV_C1_1 и запускает TON0.1с;
And4 послеTON требует rawLV_C1_FBKTRUE AND rawLV_HealthyTRUE;
And5 дополнительно !False пишет Step_RnD_Set и resetTransition3.
Это действительное v2 подтверждение R&D, но НЕ подтверждение безопасного HV:
путь перед ним проверил только C2 OFF после своей0.2с выдержки.
Нельзя вывести HVsafe из LVHealthy или из имени Step12.

## 4. v2 R&D→Safe — фактический predicate и shared Step2

Physical green0.5 через Network12/And7 либо PLCAnd14 → OR2 → Decouple1:
batteryReset2, BMSReset2, LVDischargeRequest2, ResetLVC1_3, SetTransition2.
And15 требует этот resetrequest AND NOT rawLV_C1_FBK → Step2Set2.
Это feedback отключения LV contactor, не отдельное завершение LV discharge.

PLCAnd14 содержит одновременно upstream !False черезAnd1/12/13 и прямой
FalseSI2CH8 наAndIn4. При одном стабильном значении это несовместимо;
global scan delays могут менять кратковременные наблюдения. Не подменять
предикат комментариями PLC bits и не выбирать произвольную константу.

Step2 — общий с исходным подключением источников Network5. При
Step2 AND !FalseSI2CH8 AND EStopOK Network5/And1 опять создаёт SetLV/SetHV
requests. Guards02/04/05 запрещают аварийные новые Set, но НЕ решают сам
нормальный down handoff при healthy permissions. Нельзя объявить это
намеренным повторным включением для discharge без отдельного источника.

Возврат Step2→Safe в v2 And7 требует Step2 AND FalseSI2CH8 AND !EStopOK.
Это отличается от reference (!False) и не является достаточным явным
normal R&D→Safe completion predicate. Аналогично v2 Network9 Step6→Safe
требует прямой False, reference инверсию. Программа содержит этот вход,
но его значение не объявляется константой по имени; аппаратный источник
не исследуется. Следовательно это точные условные пути, а не доказательство
что установка всегда застрянет или что тест вправе менять вход ради PASS.

## 5. Что сохранять и что ещё требуется решить

Сохраняемые операции: исходные battery/BMS действия, existing contactor
feedback и программные выдержки в их собственных фазах, STO requests/
feedback, затем HV discharge request, существующий C2 OFF feedback gate,
наконец LV shutdown для Safe. R&D намеренно останавливает эту общую
последовательность с LV активным и HV выключенным; аварийный полный removal
не заменять normal pause и не удалять ради нового owner.

Уже однозначны запрет C2 OFF до запуска разряда, запрет R&D при C2_FBKON,
timeout→TransitionFault/UnlockFALSE/зафиксированная ошибка/нет auto continue.
Неоднозначен нормативный признак именно УСПЕХА разряда и реакция команд
C2/discharge при отсутствии этого успеха. Нынешний код даёт timed removal
плюс command echo; он не даёт отдельный completion/failure handshake.

### Адресный сценарий для решения пользователя через аналитика

«Остановка дошла до разряда: источник и C2 ещё подключены, команда разряда
активна, предусмотренная исходным кодом выдержка прошла. Должна ли программа
уже отключить C2 и далее ждать его OFF feedback, как в исходной timed цепи,
либо ещё ждать наблюдаемого программой подтверждения? Если ждать — какое
изменение подтверждает завершение?»

После ответа о завершении, если нужен fault path: «Подтверждение не пришло
после допустимого программного ожидания; TransitionFault, запрет открытия и
запрет auto continue уже заданы. Как должны остаться команды C2 и разряда,
и какое ручное действие разрешает выход?» Не запрашивать новые физические
времена, не подставлять предварительные5/10с, не синтезировать input.

До ответа зависимую completion/timeout реализацию не менять. Независимы
проверки существующего порядка requests/feedback, запрета нового повышения,
структурных связей, кнопочных удержаний и однозначного unsafe-mode запрета.
STP-003/EMG-010/MOD-005 остаются частично покрыты/не закрыты, а не PASS
по одной выдержке или зелёному историческому тесту.
