# 03B physical R&D — concrete native graph, awaiting technical boundary review

2026-10-19, архитектор. После B1 и04. Scope: только физические кнопки R&D;
самостоятельный PLC handshake Q-PLC-REQUEST не определять. Нельзя объявить
исправленным merged PLC+physical acceptance, пока его сценарий не утверждён.
Этот граф интегрирует реальные physical producers; не отдельный прототип.

## Источники и неизменяемые части

D-TIMING500/1000, D-CHORD250 inclusive, D-LATE-SECOND, current ordinary
DoorMonitor и existing program permission; release2000 из действующего
сценария/поручения владельца. Новый отдельный locked feedback не добавляется.
Reference сохраняемой source/feedback/STO последовательности прочитан;
Network12/FBAnd4→Ton3→FBAnd6→Decouple2 и общий OR1→Decouple3 fanout сохраняются.
03B не реализует ранний STO (отдельный пакет) и не называет gesture acceptance
полным accepted launch. Hardware/aliases/group config не меняются.

## Представление и порядок

Добавить отдельный network RndPhysicalRecognizer. Нативные только AND/OR с
2..8 входами, inverted consumer contact вместо NOT-block, reset-dominant RS,
2 snapshot DECOUPLE, TON и один internal ESTOP off-delay250.
Все новые XML relationship wrappers/monikers/alias targets проходят B1 validator.
Обычные state variables объявить в GVL1.sgvl с unique GUID и полным
SourceUsages/TargetUsages. Не создавать lastKnownPath-only globals.

Десять RS: P,R,A,G,B,T,SG,SB,SU,L; W не RS, а NOR всех десяти.
Все начальные RS FALSE ⇒ W. На начале скана 2 DECOUPLE снимают snapshot
10 RS и Window.EStopDelOut (11 каналов). Все формулы ниже используют ТОЛЬКО
snapshot памяти, кроме явно обозначенных timer outputs текущего скана.

Вставить graph непосредственно перед первым Network12 block, сохраняя
относительный порядок остальных старых блоков; старые физические TON1/2/4
перенести В граф с сохранением Id и timing1/0.5/0.5 и привязать новым входам.
Ton3 (HV/feedback) НЕ переносить/менять. Зафиксировать полный before→after
order map, уникальные последовательные orders без gaps. Old downstream
Network12 consumers исполняются после commit state outputs того же скана.

Внутренние фазы графа (каждая формула lowering в topological AND/OR):
snapshot → input facts/start → window capture → internal window ESTOP →
single/both/release TON → event priority → next-state combinational → RS commit →
physical command levels → old Network12 consumers.
Новый helper ESTOP не связан с main Restart/ErrAck/машинными outputs.

## Facts и timers — точные связи

g=in_Reset_PB, b=in_Relase_Door_PB (реальные SAL alias targetUsages).
off=!g&&!b; both=g&&b; go=g&&!b; bo=b&&!g.
E=b_Step_RnD && !in_False_SI2_CH8 && existingCurrentPermit.AndOut.
Потеря E сбрасывает все10 RS и TON producers; никакого нового fault не создаёт.
DoorMonitor НЕ входит в E: открытая крышка допускается в устойчивом R&D.
UpAllowed=in_Door_Monitor && !in_False_SI2_CH8, поверх существующего E.
Это current program guard, не safe/locked proof.

StartG=E&&A&&go; StartB=E&&A&&bo; StartT=E&&A&&both.
PrepAbort=(P||R)&&!off. releaseEnable=E&&off&&(W||L).
Новый ReleaseTON2000: input releaseEnable. StartPrep=releaseDone&&off&&(W||L).

Window ESTOP: единственный EStopIn1 активен с прямым контактом;
EDM1/2 и EStopIn2..8 деактивированы, discrepancy0; Delay Time(ms)=250.
Restart=P. EStopIn1=!(G||B||T||SG||SB||SU||L||StartG||StartB||StartT).
Из W после release: P один scan RestartTRUE; затем R RestartFALSE;
R→A только после текущего Window.EStopOut TRUE. Held-at-start не принимается.
WindowEligible=snapshot.WindowDelayed; CaptureT=E&&both&&(G||B)&&WindowEligible.
Это захват ДО изменения off-delay output, чтобы граничное событие не
проиграло текущему истечению. Точное elapsed-origin см. обязательный proof ниже.

GreenTON500 input=E&&g&&(G||StartG); BlueTON500 input=E&&b&&(B||StartB).
ВАЖНО: первичная кнопка, НЕ go/bo — вторая на500 не обнуляет single timer.
Once T/L/accepted entered, старый candidate FALSE ⇒ timer reset.
BothTON1000 input=E&&both&&(T||CaptureT||StartT); отсчёт от появления второй,
не первой. При потере одной кнопки TON сбрасывается, T сохраняет ownership;
возврат both запускает полный новый1000, без single degradation.
Existing TON1=Both, TON2=Blue, TON4=Green; старые timing не менять.

## Events и полный next-state graph

Операции AND/OR/NOT имеют буквальный Boolean смысл. Нижеследующие уравнения
однозначно lower до native blocks; editor присваивает последовательные имена
по AST preorder и выдаёт generated netlist/order map для ревью.

```text
FinishG = E && G && g && GreenDone
FinishB = E && B && b && BlueDone
SingleFinish = FinishG || FinishB
EnterT = StartT || (CaptureT && !SingleFinish)
PrimaryLost = (G&&!g) || (B&&!b)
LateInvalid = (G||B) && both && !WindowEligible && !SingleFinish
ChordAllOff = T && off
FinishUp = E && T && both && BothDone && UpAllowed
DeniedUp = E && T && both && BothDone && !UpAllowed
Invalid = PrimaryLost || LateInvalid || ChordAllOff || PrepAbort || DeniedUp

P'  = E && off && StartPrep
R'  = E && off && (P || (R&&!Window.EStopOut))
A'  = E && off && ((R&&Window.EStopOut) || A)
G'  = E && (StartG || (G&&!FinishG&&!EnterT&&!Invalid))
B'  = E && (StartB || (B&&!FinishB&&!EnterT&&!Invalid))
T'  = E && (EnterT || (T&&!off&&!BothDone))
SG' = E && (FinishG || SG)
SU' = E && (FinishUp || SU)
SB' = E && bo && (FinishB || SB)
L'  = E && ((L&&!StartPrep) || Invalid || ((SB||FinishB)&&!bo))
```

К каждой next formula native RS.Set=next, RS.Reset=!next (reset dominant).
При FinishB и одновременно g accepted event FinishB вычислен, но SB'=FALSE,
L'=TRUE: попытка consumed, удерживаемого разрешения нет, приоритет500 не
превращается в видимый unlock pulse. Отдельный event diagnostic может
фиксировать FinishB, но не использоваться как machine output.

SG/SU держатся до выхода из R&D или safety inhibit E=FALSE: отпускание или
late second не отменяют начатый переход. Во время SG/SU новая попытка не
армируется. SB — удерживаемое разрешение синей, освобождение/green снимают
его, L блокирует повтор до off+2000. Late before single500 → L без события;
на500 FinishSingle имеет приоритет. При second300 дальнейшее single500
невозможно: candidate уже сброшен L. Никакого ошибки по late/DeniedUp.

## Integration — не менять duration/shared fanout случайно

- SG.Level заменить ONLY physical source Network12/FBOr2/OrIn1, ранее
  Network12/FBAnd7/AndOut. Down PLC OrIn2 не переписывать без ответа.
- SU.Level заменить ONLY physical source Network12/FBOr1/OrIn1, ранее TON1.
  OR1→Decouple3 и Decouple3→FBAnd4 HV fanout оставить. Up PLC OrIn2 pending.
- SB held authorization заменить старый blueTON source And2/AndIn2;
  остальные existingAnd2 guards, reset branch, общий unlock latch/final gate
  сохранить. Отдельный output `SB && b && !g && E` гарантирует hold-only.
- Старые физические wires TON1/2/4 переназначаются graph, существующие PLC
  branches явно остаются НЕ covered physical acceptance. Нельзя отчёт scoped
  physical PASS выдавать за отсутствие PLC bypass всего проекта.
- Нельзя превращать SG/SU в односкановые pulse: old completion ждёт level.

## Обязательная проверка перед статусом READY

1. Доказать one-hot ДОСТИЖИМЫХ состояний из начального W при допустимых
   inputs, включая FinishB+green: SB'=FALSE, L'=TRUE, FinishB отдельно от
   held authorization. Произвольные corrupted1024 combinations не объявлять
   обработанными: точный fault destination вне этого пакета. Flicker после
   valid chord600мс→однаOFF1мс→both999/1000 должен сохранить T и дать SU
   после нового полного1с, без single. Полное off переводит к release filter.
2. Сначала ACCEPT ITERATION_03C_TIMER_CLOCK_PLAN: общий observed-edge clock
   TON/EStop. Затем fixed scans1/2/5/10мс:249/250/251 на1мс, ближайшие
   representable before/at/after250 на остальных сетках. Никакой скрытой
   компенсации +1ms/дополнительнымscan. Это явная программная модель,
   не утверждение точного firmware timer origin/physical accuracy.
3. One-hot проверить все events, P/R pressed-beforeReady, simultaneousbuttons,
   первичная release на500, second499/500/501, afteraccepted удержание,
   full off filter. Ни одного clock/fallback assumption молча.
4. Полные actual SAL physical traces обе очередности249/250/251, BOTH999/1000,
   SINGLE499/500, late300/500/600, nofault и noadditionalcommands, сохранение
   SG/SU при release до feedbackcompletion. PLC policy остаётся dependent.
5. Bindingvalidator fullsource, negativebindings, regression01/02/B1/03A/04,
   full software check и независимое ревью. Остаточные FAIL41ID не скрывать.

Это конкретный граф, следующий за общим clock пакетом03C. 03B до записи SAL
требует ACCEPT03C, технического review и generated netlist/order map,
а не новых аппаратных данных. Политика PLC
pending не блокирует scoped physical proof, но блокирует общую merged приёмку.
Native CRC/Verify/Build вне scope, не hardware safety claim.

## P2: ограниченный технический вывод и минимальный следующий пакет

Независимые readonly traces архитектора/редактора совпали. Если first OBSERVED
loss обозначить t0, текущий adapter считает на нём offElapsed=dt. При dt1:

| delta от observed loss | до helper DelOut | после helper | elapsed после |
|---:|---:|---:|---:|
| 0 | TRUE | TRUE | 1 |
| 248 | TRUE | TRUE | 249 |
| 249 | TRUE | FALSE | 250 |
| 250 | FALSE | FALSE | 251 |
| 251 | FALSE | FALSE | 252 |

Прежний runFor convention credits первый interval целиком. Нельзя назвать
тот же первый sample одновременно observed t0 и interval-end t1. Это
программная проблема начала отсчёта; не аппаратный/Verify gate.

Минимальный следующий пакет editor: общий observed-edge clock для ВСЕХ
TON и EStop off-delay, отдельно от SAL03B. First active TON sample elapsed0;
subsequent active samples +=dt. First enabled→disabled EStop elapsed0;
subsequent off +=dt. Все значения timer parameters неизменны. Тестовый
event timestamp — sample, впервые наблюдающий изменение. Вторую подать
ровно firstSample+delta: advance delta-dt, затем set+scan(dt), не делать
runFor(delta)+лишнийscan и называть его тем же delta. Перед/на/после порога
проверять относительно первоначально наблюдённого события. Документировать
сдвиг прежних interval-oriented traces; source fixtures не менять,
исторические численные ожидания не молча выравнивать под новую модель.
Все current/исторические/harness результаты пересчитать и объяснить delta.
Эта модель выводится из обычного meaning «delay starts on observed input
transition», но не заявляется reverse-engineered native firmware алгоритмом.

После такого correction, при регулярном1мс sampling BEFORE snapshot даёт
249TRUE/250TRUE/251FALSE. Это положительный model proof только на такой сетке.
При переменном шаге, перескакивающем249→251, старый delayedTRUE остаётся
snapshotTRUE, и late251 может быть захвачен. Одного Boolean delayed output
недостаточно отличить first-expiry sample250 от251 без временной информации.
Нельзя «починить» это параметром251 или одной дополнительной задержкой scan.

Для произвольного sampling требуется поддержанный
native comparator времени первой/второй либо подтверждённая no-fault семантика
TWOHAND intergroup250, вместо before-delayed workaround. SDK уже доказал
его representation/validator10мс; PDF Error table описывает channelpair fault,
но diagnosticbit2/intergroup→group lifecycle не полностью установлен для
target. Игнорировать Error output не решение group behavior. Нужен источник
его state transition при single held>250 и late second, не новое решение
пользователя о желаемой реакции (она уже однозначна). Существующий ESTOP
вариант NOT READY для exact arbitrary-step native claim.

Действующая область программной проверки не требует arbitrary-step exactness:
владелец явно выбрал fixed-scan1/2/5/10мс без physical-time claim. В этой
области P2 закрывается03C и causal helper trace; описанный arbitrary-step
предел остаётся ограничением, не hardware gate. После ACCEPT03C и технического
review 03B допускается к интеграции. Сам clock пакет не исправляет рабочий SAL.
