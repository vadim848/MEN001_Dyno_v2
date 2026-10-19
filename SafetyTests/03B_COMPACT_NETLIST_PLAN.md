# 03B compact — 254/255, готов к независимому техническому ревью

2026-10-19. Конкретный кандидат заменяет oversized290-block design;
не SAL diff и не функциональная приёмка проекта. JSON того же имени хранит
48blocks, точные native ports/params/IDs,10SGVL declarations+usage IDs,
20alias target additions,92canonical wires, старый→новый order map и
36проверенных символических сценариев. После ACCEPT03C,06/05 стабильного
source и review этот пакет предназначен editor для интеграции physical R&D.
Никаких удалений исходной полной последовательности ради бюджета.

## Бюджет и отличие от oversized графа

209current −3перенесённых existing TON +48graph = **254**, limit255.
Граф:31AND/OR,10RS,2snapshot DECOUPLE,4TON,internalESTOP250.
03C/05/06 не добавляют блоки, но перед исполнением пересверить source SHA,
порядок и native binding audit. Не пересчитывать245 по предварительной оценке:
окончательный counted budget254 оставляет только один block.

Вместо отдельного G/B candidate ownership используется текущий TON каждой
кнопки; ранняя потеря/перестановка обнаруживается PrevG/PrevB памятью.
Используется собственное удержание RS: Set=event, Reset=exit, вместо
нескольких gates для nextState(selfHold). BlueAuth выделен отдельно от
Consumed, чтобы green снял authorization без повторной команды.

## Полный граф — названия symbols соответствуют JSON

Snapshot в начале: P,A,T,L,C,SG,SU,BA,PrevG,PrevB,WindowDelayed (11каналов).
P — prepare latch, A — prepared/armed, T — irreversible chord ownership,
L — invalid до очистки, C — команда уже принята, SG/SU — удерживаемые
down/up requests, BA — blue authorization. PrevG/PrevB обновляются raw
состояниями в конце скана; snapshot даёт ПРЕДЫДУЩИЕ, не текущие кнопки.

```text
E = RnD && !FalseInput && CurrentPermit && !Mentee
off = !g&&!b; both=g&&b
Eligible = E&&A&&!C&&!L
SingleEnable = Eligible&&!T
Capture = SingleEnable&&both&&snapshot.WindowDelayed
Window.Restart = !P&&off&&E
Window.EStopIn1 = off
ReleaseEnable = E&&off&&!SG&&!SU
GreenEnable = SingleEnable&&g
BlueEnable = SingleEnable&&b
BothEnable = Eligible&&both&&(T||Capture)

FullReset = ReleaseDone&&(L||C)&&!SG&&!SU
ResetCommon = !E||FullReset
ASet = P&&off&&Window.EStopOut
FinishG = SingleEnable&&GreenDone&&g
FinishB = SingleEnable&&BlueDone&&b
SingleFinish = FinishG||FinishB
UpAllowed = InterLock_NC_1&&InterLock_NC_2
FinishUp = Eligible&&T&&both&&BothDone&&UpAllowed
PrepAbort = P&&!A&&!off
Late = SingleEnable&&both&&!snapshot.WindowDelayed&&!SingleFinish
ChordOff = T&&off
EarlyLoss = SingleEnable&&((PrevG&&!g)||(PrevB&&!b))
LSet = PrepAbort||Late||ChordOff||EarlyLoss
CSet = FinishG||FinishB||FinishUp
BAReset = ResetCommon||!b||g
```

Window — cloned native ESTOP, single EStopIn1, discrepancy0, EDM disabled,
Delay Time(ms)250. Не ordinaryTON0.25; SDK представимость доказана ранее.
Не имеет связи с main Restart/ErrAck или outputs машины.
Green/Blue/Both TON = existing Network12TON4/2/1, Id и timing500/500/1000
сохранить при переносе. Новый ReleaseTON2000 — заданный программный фильтр.
Во всех случаях действует общий observed-edge clock03C, не250specialcase.

| RS | Set | Reset |
|---|---|---|
| P | ReleaseDone | ResetCommon |
| A | ASet | ResetCommon |
| T | Capture | ResetCommon |
| L | LSet | ResetCommon |
| C | CSet | ResetCommon |
| SG | FinishG | !E |
| SU | FinishUp | !E |
| BA | FinishB | BAReset |
| PrevG | g | !g |
| PrevB | b | !b |

Каждый RS reset-dominant. Первые8флагов не one-hot: P/A закономерно
сосуществуют. Проверяемые reachable invariants: SG и SU не сосуществуют;
SG/SU imply C; L/C блокируют новые events; BA не переживает green/blue loss;
T не возвращает single при flicker; arbitrarycorrupted memories вне scope.

## Причинность и сроки жизни

На startup P/A FALSE, helperRestartTRUE только при E+off; ReleaseDone после
полного2000 ставитP. На следующем sample helperRestartFALSE приoff, helper
выходит из restart, ASet подтверждает его реальный EStopOutTRUE. Нажатие
раньше A не принимается; PrepAbort требует новой очистки, не создаёт fault.
Небольшая scan latency подготовки явно видна, не подменять sample timestamps.

Первая физическая кнопка меняетoff в той же evaluation до helper: window loss
происходит в первом sample кнопки. SnapshotDelayed до helper обеспечивает
inclusive250 при фиксированной сетке после03C. На250 обе TON ещё не single
done500; на500 SingleFinish подавляетLate, chord window уже истекло.
На251/300 late ставитL до500; первичная swapGoff/Bon обнаруживается EarlyLoss
даже без sampled bothoff. Раннее bothoff и новое нажатие до2с не rearm.

T удерживается при one-off flicker, BOTH TON reset; возвратboth отсчитывает
новый1000. Полный bothoff ставитL, возвращение до очистки не принимается.
SG/SU не сбрасываются ordinary release/late: старые completion ветви получают
level до выходаRnD/E loss. BA reset приgreen/blue loss, C остаётсяconsumed:
releasegreen при ещё удерживаемойblue не создаёт повторного unlock.

## Реальная интеграция и native bindings

- SU.RsOut → existing Network12/FBOr1/OrIn1 вместо oldTON1out.
- SG.RsOut → existing Network12/FBOr2/OrIn1 вместо And7out.
- BA.RsOut → existing Network12/FBAnd2/AndIn2 вместо oldTON2out.
- У3movedTON удалить oldincoming physical sources и заменить graph enable;
  все oldoutgoing consumers проинвентаризировать перед перенаправлением.
  Старый And7 больше не пишетOR2; не оставлять duplicate driver.
- OR1→Decouple3 sharedHVfanout и Network12And4→Ton3→And6→Decouple2 неизменны.
- Existing PLC OR1/OR2 other inputs не удалять и не переписывать. Они pending
  Q-PLC-REQUEST; это не merged acceptance proof и не придуманный PLC policy.
- Door не source graph energy permission. Latest UpAllowed — оба
  in_InterLock_NC_1/2, НЕ in_ES_NC_1/2. Existing solenoid Door guards неизменны.
- Alias inputs через SALtargetUsages, trueglobals черезwrappedref+SGVL usage.
  JSON содержит exact mapping; whole-source validator до cut обязателен.
  Mentee явно вE; mainEStopOK не доказывает его permission.

Обычные SGVL globals10шт имеют RS source и snapshot target indices. Другие
новые связи direct canonical wires без двухrelationship на одну пару.
Не копировать GUID templates и не изобретать GVL1.alias refs.
MovedTON original block/port/parameter IDs сохраняются; JSONmoveExisting
имеет приоритет над renaming/name mapping. Нет новых alias/hardware params.

## Доказательство и editor acceptance

36symbolic counted-graph simulations PASS: обе очередности, before/at/after250
при dt1/2/5/10, late300/500/600, piano swap100, shortoff100, flicker600→1off→
fresh999/1000. Это design check с03C operational clock, НЕ actualSALpass.
Перенос в рабочий source требует до реализации red actual tests/после actual
positive controls с этими же событиями, retainedrequests до feedbackcompletion,
bluehold/release/repress/greenloss, startup/inhibit/recovery, relativeorders.
Дополнительно reachability инварианты flags и helper noError/group-safe
isolation; main safety paths/таймеры/старые sequence outputs сохраняются.

Перед editor: независимый technical review count/order/таймеров/типизированных
SGVL bindings, refreshed source after06/05. После editor full software package,
actual SAL symbolic→native block binding comparison и независимый review.
Остаточные Safe/Run recognizer, mergedPLC, fullacceptedlaunch/earlySTO,
emergencydestination и все41ID не объявлять закрытыми этим scoped пакетом.
Native Verify/Build/CRC и physical validation вне scope, не выдуманный gate.
