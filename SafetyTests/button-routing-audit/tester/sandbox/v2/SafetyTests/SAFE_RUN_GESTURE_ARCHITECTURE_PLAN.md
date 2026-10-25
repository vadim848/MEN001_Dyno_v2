# Safe/Run gestures: bounded architecture options

## Resumption 2026-10-20: independent Safe-only candidate

**Exact next editor handoff:** read only JSON key
`downEpisodeOwnerCandidateV2`, version `down-episode-owner-v2-demorgan`, and
its `ordering.manifest` (255 unique nodes, retire8/add8). Independent reviewer
cleared this for isolated native construction only. Preserve frozen v1 files.
Earlier `downEpisodeOwnerCandidate`, broad discharge veto and SG-reset changes
are not builder choices. V2 retains SG_OWNER_SET/old SG reset, folds GATE019
by De Morgan, and adds the current-Step2 owner. Functional replay and complete
acceptance are pending; normative Safe completion is not selected here.

Latest no-reenergy design is JSON `downEpisodeOwnerCandidate`, not the broad
LV-discharge veto. Dedicated RS marks the current Step2 episode entered from
RnD down: Set=actual N12 LV-discharge request, Reset=!actual Step2, placed
between Step2 RS and N5 And1. And1 adds !owner. This preserves reference Step2
episodes and clears on actual episode exit; no new completion/start policy.
Cost stays255 by omitting SG_OWNER_SET: SG.Set=GreenTON, Reset=!RND_SCOPE.
Technical review/replay required, including that SG optimization and phase
conflict boundary. Broad RS5 veto is rejected for unproved legacy compatibility.

**Revision:** preserve SG_OWNER_SET and SG.Reset=!E exactly, including arbitrary
phase flags. Free its replacement slot by retiring pure OR GATE019 instead:
fold `!(GreenDone OR BlueDone)` into existing GATE023 with inverted GreenDone
on input4 and inverted BlueDone on free input5. Both current TONs precede this
consumer. JSON now has retire8/add8=255 and updated complete order. The earlier
SG scope-reset optimization is superseded; no onehot assumption funds the fix.

Latest lifecycle correction: actual normal RnD-up does not require an overlap
with Run. Current b_Step3_Set_2 directly resets RnD in the confirmation scan,
before Run OR6/RS3 can consume it next scan. Actual tester trace confirms this;
require owner retention until actual exit and first-evaluation cleanup, not a
fabricated overlapping phase seed. Healthy Step2-to-Safe also remains an open
implementation gap; the bounded SG owner trace legitimately ends at Step2.

New separate proposed mitigation after baseline+candidate negative confirmed
actual LV/HV re-energization: JSON `downNoReenergyCandidate` uses two existing
free Network5/And1 ports, !LVDischargeRS5 and !current RnD LVDischarge request.
No new FB or timing. Both are needed because And1 executes before RS5 on the
first Step2 scan. This is **technical review only**, not implementation READY:
RS lifetime, future fresh Step12 startup and legacy direct Step2 after discharge
must be reviewed. It does not invent a completion predicate or close Safe255
acceptance. Full source rationale and limits are in the resumption document.

**Revision after isolated candidate replay:** the 254-node version below is
superseded by **255 nodes: retire7/add7**, retaining GATE_020 FinishUp. Its
original four inputs remain; activate input5=RND_SCOPE direct. Restore
STATE_SU.Set and CSet.OrIn3 to current FinishUp, rather than prior SU. Safe
And4 still uses current raw BOTH.TonOut, with And3 and SAFE_UP_SCOPE intact;
CSet.OrIn4 still reads current Safe owner. The prior one-scan C lag caused two
TRUE FinishUp-equivalent samples in short-neutral tests, even though actual
up/HV had one rise. Those failures are material; tests are unchanged. JSON
safeOnlyCandidate and the resumption document describe the revised255 plan.
Candidate reconstruction and replay remain required before acceptance.

Read `SAFE_RUN_RESUMPTION_ARCHITECTURE.md` and JSON `safeOnlyCandidate` before
the historical full shared proposal below. Analyst confirms that the full
Safe|RnD|Run classifier changes unresolved valid Run BOTH histories and cannot
be installed merely by omitting assertions about its endpoint.

Concrete independent split: MODE=Safe|RnD, RunTON2/And24/And23 unchanged, direct
Network12 SG unchanged. Omit proposed RND_SG and OWNER_EXIT; retain RunTON2.
This gives 255-8+7=**254**, with an ordered 254-node patch manifest in JSON.
MODE itself falls after actual RnD exit and remains TRUE during RnD+Run overlap,
so the old RnD request lifetime does not need the full generic owner-exit gate.
Safe owner remains behind original And3 readiness and current Safe scope.
The five known Safe red observations are its target; two Run short-chord red
observations stay open and must be reported. QR/QT/QP are not selected.

Status **READY for independent technical review of this partial design only**;
**NOT READY for native SAL acceptance/handoff** until candidate construction,
whole-source binding audit and actual causal replay specified in the new
document. The manifest is a precise ordered patch specification, not generated
SAL and not an executed proof. Main EStop current order is23, not historical21.
No SAL/runtime/test edits were made. Full shared candidate B2/B3 remains HOLD.

## Review correction B1: исходная readiness перед владельцем Safe

**Текущий статус HOLD B2/B3, не SAL READY.** Исправлен только предлагаемыйB1граф; count255сохранён. ReviewerсправедливоотклонилqueueквалификациибезAnd3. РанееописанныйSetSafeRS=BothDoneнижеисторический, заменёнточнойпоследовательностьюздесьиJSON.

Новыйпорядок: `BOTH.TonOut → existing SafeAnd4(BothDone AND originalAnd3 AND SAFE_UP_SCOPE) → SAFE_ACCEPTED_UP_RS → GATE_030/CSet → ... → oldlateSafeOR1`. SafeRS.Reset=!SAFE_UP_SCOPE; SafeOR1physicalinput=SafeRS.RsOut, PLCinputнеизменён. ExistingAnd4единственныйoutputconsumerзаменяетсянаSafeRS.Set; gateпереноситсяпослеBothTON, beforeSafeRS. Другиеoriginalfeedbackactions/readiness And3непереподключаются.

**CSetбольшеНЕпотребляетrawBothDone.** ЕгоexistingORinput3получаетSTATE_SU.RsOut, freeinput4получаетSafeRS.RsOut. GreenDone/BlueDoneinputsпрежние. Этоважно: покаSafeAnd3FALSE, CнеconsumedотBOTH, TONDoneостаётсяTRUEтолькопокаобеheld. ТогдаисходноеAnd3позжестанетTRUEприпродолжающемсяудержании→launchвозможен, какстарыйlevelTONpath. ЕслиобеотпущеныраньшеAnd3, текущийBothTON=FALSEдоAnd4втомжескане; SafeRSещёFALSE; lateAnd3неустановитвладельца. Неточередиизоднойквалификации.

| Trace | BothDone | And3 | SafeRS | Safe request |
|---|---|---|---|---|
| held1s/notready | TRUE | FALSE | FALSE | FALSE |
| releasebeforeguard | FALSE | FALSE | FALSE | FALSE |
| guardlaterafterrelease | FALSE | TRUE | FALSE | FALSE |
| pairedguardlaterWHILEheld | TRUE | TRUE | TRUE | TRUE |

SafeRSтеперьозначаетacceptedrequestпослеисходногоконтрактаготовности, анеквалифицированнуюпопытку. Ужепринятаякоманданеподменяетаварийныйsupervisor; downstreamfault/phaseownershipB3необъявленыPASS.

ВRnD existingSU.RSрасположенпослеCSet; Cпотребляетегонаследующемскане, т.е.добавленвнутреннийодинscanC-lag. Во времялагаTужеTRUE(полная1sBOTH), SingleEnable=Eligible&&!T=FALSE; другихsingleнет. SUуровеньидваearlySTOORостаютсявсвоихпрежнихпорядках, N+2неизменён. Этообязательныйcausalred/positiveproof, неразрешениепоменятьscanexpectedбезфактическойпроверки. IforderingвследующемmanifestнепозволяетSafeRSдоCSet/And4послеTON — пакетNOTREADY, небуферизоватьDoneещёоднойпамятью.

RetiredFinishG/BинвариантпрежнийcurrentTON⇒currentenable&&primary. RetiredFinishUpинвариант: Done1s⇒currentEligible&&both&&T, потомуTставитсяcaptureпервогосканa, ResetCommonневозможенпринеизменномBOTH/E, а0.0sизмененийтаймеровнет. НовоеCSetнеослабляетэтуиндукцию. ПроверитьвесьR&Dnativeactualпакет, обеочередности249/250/251 иbothflicker, нольповторныхrises.

### B2: две topology без выбора policy

- **Если пользовательвыберет remainRun:** currentTownershipможетсохранятьпопыткудоfullrelease; sourceRunvalidBothнепорождаетэнергетическийrequest. Это0добавочныхблоковк255, НОтакойendpointещёнеутверждён инепринимаетсякактекущееправильноеповедение. УстановкуCдляэтогослучаяможноотдельнообосноватьтолькопослевыбора, невернутьrawBothDoneвCSet(вернётсяB1).
- **Если пользовательвыберет stop→RnD:** `RunBoth=Run AND BothDone AND !ResetPB_Lock AND !False` (1AND), `SGSet=OR(existingSG_OWNER_SET,RunBoth)` (1OR); sourceсуществующийRunDownrouteAnd24/And23/Or5/Decouple2, SGretentionдоRunexit. CSetможетпотреблятьSGпоfreeinputбезновогоблока. Прямойвариант**257**, требуетещё2slots/оптимизации. Этостоимостьданнойtopology, невыборendpointинеобщаяневозможность. Необходимиguardsпередnewowner, анепоздняяразблокировкаqueuedrequest.

B3остаётсяоткрытым, включаявсеRunLock/readinessусловиядоSGownership; текущийcountedcandidateнельзявыдатьзаокончательнодоказанныйRunGreenlaunch. НеослаблятьoldResetPB_Lock/Falseиз-заудобстваgenericSG. НиRunvalidBothpositiveendpoint, ниStartingRunGreen/QPнезакрепленывtests/коде. Нужныanalystрешениятолькозависимымветвям.

ЗаписьSTOP. SAL/runtime/tests/reviewerдокументнеизменялись.

## Follow-up2: counted255 candidate найден, прежний260 не предел

Новый артефакт `SAFE_RUN_GESTURE_COUNTED_PLAN.json`: source0fc39751...,9точныхretireIDs/9nativeblocks ссуществующимишаблонами, E8inputs,255−9+9=**255**. Проверено поactualparser: всеretiredpaths/templates существуют, SafeAnd4 единственныйconsumerOR1. Статус **READY для технического review counted-кандидата, НЕ READY для SAL**: нужныcausalreplay/orderedmanifest/analystpendingendpointboundary. Исторический260ниже сохраняетсякакнеоптимизированныйвариант.

### Три экономии без новых значений таймеров

1. FinishG/FinishB ANDs избыточны: текущийnativeTON outputTRUE уже подразумевает current enabledSingleEnable&&rawprimary. FinishUp AND такжеустраним: currentBOTH.TonOutTRUE подразумеваетEligible&&both; T установленпервымcaptureсканом и не сбрасываетсяпринепрерывномBOTHдо1s. !EвыключаетBothEnable/TONсразу; FullResetтребуетoffrelease, несовместимоесBothDone. Этоиндукционныйcausalproof, анепростоtruth-tableTBOOLнезависимыхseeds. РедакторобязанвоспроизвестивесьactualR&Dпакет; триблокаещёнеудалены.
2. Fullgenericmodeepochнеобязателендляnormaloriginalsequence. Safe→RnD проходитStep12: SafeRS19сбрасываетсяотStep12, RnDSetproducer120/RS182позжеrecognizer121, даётреальныйscanбезSafe/RnD/Run. Run→RnD: RunRS49сбрасываетсяотStep12Set2, Step12RS185толькопотомподнимается, producer120/RndRS182ещёпозже; естьmodegap, которыйочищаетSG/A/C. **RnD→Run исключение:** прежнийownerSUсамявляетсяпамятьюhandoff. OWNER_EXIT=previousSU&&!Rnd однимAND; E включает!OWNER_EXIT. ПриtemporarilyRunTRUE/RndTRUEсуществующийSUсохранён; толькопослеactualRndFALSEоночищаетсясA/C. Не очиститьSUпораннемуRunrise.
3. Отдельный !MenteeвEредундантенпослеR3: mainESTOP21 читаетдействующийpairedMenteeсmasterinversion, E121читаетегоужеобновлённыйEStopOK. ОсвобождённыйEinputиспользуется!OWNER_EXIT; CurrentrawPLCпо-прежнемуявный, таккакPLCproducer95позжеmainESTOP. ExternalNCтакжеявные. Этоsource-definedsame-scanрасчёт, неослаблениеMentee.

Modegapдоказательствоотноситсяксуществующимcausalroutesснормальнымиoriginalphasewriters, анеарбитрарнымодновременнымphasecuts. Network4/fullBOOTиPLCpolicyнестановятсядоказанными. НуженreplayoriginalN3handoffизисточникавsoftwareharness, либо явноограниченныйphaseprotocolсledger; нельзяseedновыеepochflagsилипредположитьonehotвкаждомскане.

### Раздельные владельцы без второго полного recognizer

Общий classifier используетMODE=SafeORRnDORRun иCONN_SCOPE=SafeOR(LVconnectorANDHVconnector). ВSafe отсутствиеconnectorнеподавляетBlue/arming; вRnD/RunостаетсяEmergencyinhibit. Новые RND_SCOPE=E&&Rnd иSAFE_UP_SCOPE=E&&Safe&&currentEnergyPermit разделяютповышениеотSafeaccess.

СуществующийSTATE_SU.SetполучаетqualifiedBOTH, Reset=!RND_SCOPE: онникогданесуществуетвSafe/Run ипо-прежнемусразуобслуживаеторигинальнуюRnDHVцепьиобаearlySTOORбезновойscanзадержки. НовыйодинRS SAFE_QUALIFIED_BOTH получаеттотжеqualifiedBOTH, Reset=!SAFE_UP_SCOPE; егозначениеэтоqualifiedrequestвладельцаSafe, **неподтверждённыйэнергетическийlaunch**. ИсходныйAnd3feedbackguard остаётсявAnd4иопределяетдействительныйStep12request. SafeAnd4переноситсяпослеSafeRS,досвоегоединственногоlateconsumerOR1, получаетSafeRS+oldAnd3+SAFE_UP_SCOPE. Стараяconfirmationцепь/таймеры0.1неудаляются.

SG.Set=GreenTON&&!Safe черезодинAND: SafeGreenпотребляетCнонеудерживаетSGнавсегда; послеrelease2sвSafeсноваBlueдоступна. N12OR2получаетRndSG=SG&&Rnd; RunAnd24получаетSG, сохраняяLock/FalseиStep3. Raw!BlueвAnd23послеacceptedSGдеактивируется: классификаторужеисключилinvalidchord, апоздняяblueнеможетпрерватьacceptedDown. Этонамеренноеapprovedlate-contractизменение, неслучайнаяпотеряguard. RnD SG/SU доmodeexitиoriginalcompletionнеподменяютсяпульсами.

Новые9nodes: MODE_OR,CONN_AND,CONN_SCOPE_OR,OWNER_EXIT_AND,RND_SCOPE_AND,SAFE_UP_SCOPE_AND,SG_OWNER_SET_AND,RND_SG_AND,SAFE_QUALIFIED_BOTH_RS. Retire9: auditeddead3,obsoleteSafeAnd10/TON3,RunTON2,redundantFinishG/B/Up3. ВсеnativeAND/OR≤8inputs,1RS, безXOR/newtimers; используемыешаблонысуществуютвsource.

### Предел handover и следующие проверки

QRvalidBOTHRunendpointневыбран: classifierBOTHможноанализироватькакqualification, ноfalseмодовыеRSгейтысами по себе НЕ являютсяутверждённым«ignoreRunBOTH»oracle. Доeditorhandoffаналитикдолженпринятьграницуknown-scopeлибоответпользователя; неclaimvalidRunBothfunctionalPASS. QTStartingRun иQPPLCтакженевыбираются, старыеPLCbranchesнепереподключены.

Независимоотэтихendpointвопросовнужныdesign/nativecausalproof: TONfinishreplacementR&Dregression,SafeGreen→fullrelease→Blue,SafeconnectorabsenceBluepositive/Upnegative,sourcephasegap+RnDRunoverlapowner,earlySTO N+2 unchanged,Runinvalidchord/lateBlueдо/после500,continuousintervals/effectivepairs/strictbinding. Новаяnativeordered255manifestдолжнасохранитьremainingoldrelativeordersкромеявнообоснованногоsingleconsumerSafeAnd4move; данныесимволическиеузлыJSONещёнеявляютсявоспроизводимымSALгенератором.

Техническаяневозможность255 большеНЕзаявляется: countedcandidateпомещается. Точныйостаток—валидацияновойкомпозиции/ordering иpendingendpointboundary, безновогоhardware/BOOTпредположения. Запись STOP для review.

## Follow-up: raw-native audit и counted owner/epoch candidate

Повторно прочитаны актуальные AGENTS/WORKFLOW. Проверенный sourceSHA256 `0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909`,255blocks. Никаких SAL/runtime/test правок. Итог boundedрасчёта: нижеследующий конкретный genericcandidate требует **260blocks**, не255. Это доказанный blocker **этой схемы**, не математическое утверждение невозможности любой иной оптимизации проекта.

### Native usage proof трёх pure blocks

XML прочитан namespace-aware, не только parser.targets. Для каждогоoutport проверены собственныеwiredLink, всеoutPortMonikerrefs всегоSAL, fbPortGlobalVariableReference иSGVLModelElementId usages. Aliassourceusages также используютoutPortMoniker; их0.

| Block | BlockID | OutID | Native consumers |
|---|---|---|---|
| N12/And5 | 7e67f81c-ad73-4ddc-8541-97d0b9370257 | 8b9fe2d1-ff86-4195-951d-4bab118bb9df | 0 |
| N12/And7 | 8a0162c0-f4a4-45d7-93f9-55a36d165586 | 8ddd104d-d871-4c1a-9472-92d06a6903e5 | 0 |
| N12/And18 | 6052e4b6-edc7-4cae-b3eb-2dd48994ef78 | f81ad2ad-b2de-4a2b-88bb-b12f2b4b988c | толькоAnd5/In4 иAnd7/In4 |

У всех outputs Globals0, SGVLusages0, reverseoutmonikerrefs0. And18 дваsource-sidewireIDs: `8dfd2364-7cca-4c26-9d7b-6f6d91a451b4`, `ccc5fbd3-4d16-4f2e-8f7e-327222c73363`. Они входят только в дваterminaldeadAND. Все3safeAnd, mapState/mapDiagFALSE. Ихобычныеinputalias/globalusages подлежатсогласованномуудалениювretirementпакете; descriptors/mappingsнеизменны. Этоsource-bound обоснование трёхslots, не объявлениеdeadNetwork4/wholeBOOT.

### Конкретная candidate схема и стоимость

Сохранить47-block recognizer сR1/R3 таймерами/flags; использоватьсуществующие8-inputAND/ORnative primitives, анеhost-arbitrarylogic. Новыеблоки:

1. `RR_MODE` OR(RnD,Run),1OR.
2. СуществующийE-AND получаетRR_MODE вместоRnD, остальныеcurrentenergypermit/!Mentee/!Falseпрежние. `SAFE_E` AND(Safe,!False,EStopOK,!currentPLCstop,ExtNC1,ExtNC2,!Mentee),1AND. ESNC1/2 иMentee effectivecurrentmainESTOPполученыдоrecognizer; connectorsвSAFE_Eнет.
3. `ANY_E` OR(oldEforRR,SAFE_E),1OR; заменитьвнутренниеErefsнаANY_E. Итогоpermissions+3FB.
4. ДваRS `PREV_SAFE`, `PREV_RND` (Set=currentmode,Reset=!currentmode); использоватьсвободныеSNAP_1outputsдляихпредыдущихзначений. Новыйepochиздвухmodebits,Run=00 приустойчивомRun. `XSAFE` nativeXOR(Safe,prevSafe), `XRND` nativeXOR(RnD,prevRnd), `CHANGED` OR(XSAFE,XRND); `RESET_MODE` OR(!ANY_E,CHANGED). Итого2RS+2XOR+2OR=6FB. RESET_MODE заменяет!E вSG/SU/A resets ивResetCommon(ORсFullReset). ReleaseEnable остаётсяoff&&ANY_E&&!SG&&!SU, поэтомуфильтрнеполучаетновуюдобавочнуюзадержкуотepochreset. P.R1сохраняется.
5. `RND_SG` AND(SG,RnD), `RND_SU` AND(SU,RnD),2AND. ПервыйпитаетN12OR2физическийinput. ВторойпитаетN12OR1и**обеearlySTOOR3**. БезэтихфильтровgenericSafeSU неверноподниметSTO/Transition3, аRunSGвыключитLVчерезRnDDecouple1. SafeAnd4получаетSU,сохраняяAnd3; SafeAnd7получаетBA. RunAnd24получаетSG,сохраняяLock/False/Step3guards. Итогоfanoutisolation+2FB.

Новые11блоков. Условноretired6: триauditdeadAND; SafeAnd10+SafeTON3послеacceptedSUretarget; RunTON2послеSGretarget. **255−6+11=260**, deficit5. ДажеэтотоптимистичныйрасчётиспользуетnativeXOR; егоexacttemplate/portserializationещёнепредставлен. ПриразложениикаждогоXORна2AND+ORполучится264. Не пытатьсякомпилироватьcandidateв255выбрасываниемepochилиmodefilters.

### Обязательное ограничение owner/epoch proof

Нельзяобосноватьэпохуоднимпредположениемonehot. Sourceorders: SafeRS19, RunRS49, recognizer119.., RnDRS182. ПриRunconfirmation Runможетбытьустановленраньше,чемRnDснятпослеrecognizer. Значитизsourceневыводитсягарантированноодинscan ANY_EFALSE междуRnDиRun; простоORmodesтеряетreset ивладельца. CandidateCHANGEDпредставленкакстоимостьproposedentryepoch, **не доказан какготовыйowner-preservinggraph** для overlap: егосбросSUнаRunriseможетпредшествоватьнаодинscanявномуRnDexit. Дляготовойсхемынуженsource-basedtracephasehandoff иточноеусловиеclear, сохраняющеепринятуюR&Drequestduration; дополнительныеgatesмогуттолькоувеличитьэтустоимость. Не менятьphaseprioritiesпоумолчанию.

### Что можно делать независимо

Первыйреальныймалыйпакет — отдельноreviewedretirementтрёхдоказанныхpuredeadAND иихлогическихusages:252blocks, безновыхpolicy/BOOTпредположений. Послеэтогоисточникпо-прежнемунеисправляетSafe/Runqualification; reportостаётсячестным. Можноготовитьизвестныйredпакетсценариевпоanalystcontract, сохраняяQR/QT/QPкакнепроверяемыеendpoints. Следующийархитектурныйшаг — сократитьнеобходимые11nativeблоковилинайтиещё5доказанноосвобождаемыхslots/лучшеownerencoding; незаказыватьновыйhardwaretarget.

Nativeготовойсхемы<=255ссохранённымownereventlifetimeсейчаснет. Countedcandidate260иrawusageauditконкретны; зависимостьотBOOTтолькоуfullreachabilityдоказательства, неуэтогопрограммногоbudget/branchredанализа. Запись STOP.

Статус **NOT READY для редактора SAL**: известные сценарии определены, но ещё нет counted netlist с mode ownership в255. Основание — SAFE_RUN_GESTURE_SOURCE_REVIEW.md и actual source после принятого earlySTO,255блоков. Только чтение/план; source/runtime/tests не менялись. Новый полный унифицированный state machine не предлагается.

## Однозначный объём

- SafeBlue:500ms, neutralrelease2s, noheldentry, late/chord не деградирует в одиночнуюblue. Доступ при отсутствии connectors вSafe должен оставаться возможным при остальных действующих разрешениях/Door policy. GreenRestart mainESTOP остаётся raw процедурой, не оборачивается recognizer.
- SafeBoth: <=250ms, continuous1s отsecond, release2s/noheldentry. Сохранить существующую Safepermission/feedback цепь Network2And1→TON1/And3/TON2/STOFBK и And4, а не заменять её одним событием.
- RunGreen:500ms, freshattempt/rearm, invalidchord не становитсяsingleпослеblueoff. Сохранить !ResetPB_Lock/!False и последующую Network6normaldown sequence. Acceptance не считается завершениемdischarge.
- R&D SG/SU request lifetime до modeexit и аварийные guards приняты; их не заменять импульсами ради generic recognizer reuse.

QR(validfullBOTHвRun), QT(newGreenвоStartingRun), самостоятельныеPLCrequests остаются unresolved. Они не мешают source/red tests известных сценариев. Но generic shared graph нельзя активировать вRun дляпринятияBOTH с выбраннымendpoint или вStartingRun с выбраннойкомандой. Не считатьотсутствиеответа командойignore; зависимыеcase endpointотложены.

## Точные интеграционные точки

SafeBlue: Network2/And7 AndIn2 сейчас rawblue, Safequal черезDecouple3. Новый acceptedblue authorization должен заменить **только** rawqualification на этомпорту; Doorreset And8 иfinalUnlock07 сохранены. SafeBoth: Network2/And4 физическийTON3source меняется наacceptedSafeUp, **And3 feedback guard остаётся**; OR1 PLCinputнеисчезает.

RunGreen: Network6/And24 AndIn3 сейчас rawgreenTON2. Новыйacceptedgreenrequest может заменить этотисточник, но And24Lock/False иAnd23Step3/!blue исходные условия сохраняются. Однако acceptedgreenevent versus !blueoutputhold требуетпрямойlatestlate/noRollbackпроверки: нельзя отменить начавшийсяdownтолькоприlatebutton. Не принимать простойпульсбезdownstreamrequestowner.

## Ресурсная проверка текущего source

Native255 limit занят. Source-only audit обнаружил три pure AND безнаблюдаемогоfanout после03B retarget: Network12/FBAnd5 иFBAnd7 имеют outputs безtargets/globals/alias source usages; And18 читаетResetPB_Lock/False и имеет только два targets в этиAND. Это **кандидат на отдельный whole-source audited retirement**, максимум3FB. Старое утверждение «толькоAnd7» неполно; новый факт не даёт права удалятьживуюR&Dпоследовательность.

Не трогать Network12And1 с шестьюпервоначальнымиfanouts иAnd3 сResetDoorUnlockwrite. Network4 не ресурсныйcandidate. Дляretirement3 нужен ещё nativeXML/SGVL rawusage audit всехportIDs/relationshiproles, sourcehash и negativeproof иныхconsumers; parser canonical targets/globals/alias checks выполнены, native deletion ещё не спланирован.

При будущей полнойзамене SafephysicalBOTH одноцелевойAnd10→TON3 можно retired **только после** переносафизическогоqualification наacceptedsource и проверки And4guard; потенциально2FB. При полнойзамене RunGreenTON2 егоsingleconsumerAnd24 остаётсяlive, самTON потенциально1FB. Суммарные6условныхмест не являются готовымбюджетом: timingtypes/ownershipmemory тоже занимаютслоты. Копия47блоковогоR&Drecognizer длякаждогомода заведомоневмещается.

## Вариант A — общий recognizer, mode-specific permissions и lifetime

Предпочтительное направление для counted design, но не готоваяреализация. Один наборwindow/qualification/release/attempt flags распознаётbuttons в устойчивыхSafe/R&D/Run, дальшеmode-specificcommandrouting. CommonE не можетбыть R&DenergyPermit дляSafe: Safeconnectorabsenceнеfault. Возможна явная композиция SafeGesturePermit OR RnDRunGesturePermit сactualEStop/currentPLC/externalNC/Mentee guards иразнымиconnectorусловиями; считатьреальныеgates, неhostфункцию.

Критическаянеоплаченнаяресурсами часть — **владелец принятого запроса и modeentry epoch**. Просто заменить RnD вE на SafeORRnDORRun нельзя: SU/SG тогдапереживутсменуmode, ReleaseEnable!SU/!SG заблокируетследующийmode, либо старыйSafeUpпревратитсявновыйRnDUp. Нужны source-proven owner tags/resetconditions иfreshneutralarmingприentry. ДействияclearSG/SUнаmodeexitдолжнысохранитьначатуюисходнуюsequence, EStopприоритетиearlySTO. P/A/T/L/C независимыеflags, неonehotmodeowner.

ВариантAпереходитвREADY только послеexplicitnative nodelist/gates/RS/orders/SGVL/count<=255, сравнениясretiredsources иpositiveконтролейmodehandoff. Нельзя объявить6потенциальныхмест достаточными без этогорасчёта. GenericmodeORбезownertag — **непригодный**минимальныйpatch.

## Вариант B — маленькая частичная итерация SafeBlue qualification

Возможно отдельноеprogramimprovement: переиспользовать один доказанноdeadAND slot подnativeTON0.5s отrawblue, подключитьего кSafeAnd7 вместоrawblue. Это меняет толькоочевидный immediategrant и можетдатьnativeactualred→green500boundary безновыхтаймерныхчисел. Но такойпакет **не закрывает** entry/release/chord/late/no-repeat; посленеудачногоchord онможеттакжедатьsingle. Поэтому этотвариантдопустим лишькакявночастичнаяитерация сживымиFAILостальныхBTN, безутвержденияSafeBlueacceptedgesturecorrect. Не рекомендованеслиумножаетбудущиепеределки; общийcountedvariantAполезнее.

## Следующий конкретный шаг

1. Analystknownscenario red package безновыхQR/QT/QP endpoints: SafeBlue500/release/heldentry/late, SafeBoth249/250/251, RunGreeninvalidchord→blueoff иfreshrelease. Fullsourceaudit, typedmodecuts иcontinuousobserver; реальныеDoor/Lock/feedbackguards.
2. Отдельныйtinyresourceaudit нативныхunusedAnd5/7/18 сexactIDs передretirement; source/testsнеудалятьизreference.
3. Counted draft общего recognizer с owner tags/modeentry иmode-specificSafepermissions; сравнить nativeblockbudget. Еслинепомещается — представитьточныйостаток, анеубиратьowner/resetилиoriginalfeedback.
4. ДоcountedREADY SALнепередаватьредактору. Обязательные pendinguser endpoints остаютсясобственнымиgap, fullBOOTнеизображаетсяmodecutтестами.

ИнформациидляизвестныхSafe/Run qualificationсценариевдостаточно; отсутствуетнеuseroracle, апроверенныймалыйnativegraphвлимите255. Техническийостатокчестноограниченcountedownership/lifetime, безновыхIL/download/hardwareисследований. Запись STOP.
