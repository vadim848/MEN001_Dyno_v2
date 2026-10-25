# HealthyLost fault: explicit reset scenario audit

2026-10-20. Source-first read-only requirement audit. SPEC9 says fault retained
until deliberate reset; SPEC12 defines manual Emergency→Safe recovery, not a
general HealthyLost fault acknowledgement in completedRnD. Current/reference
mainEStop Restart reads rawgreen; original reference has no added HealthyLost
memory/normalRnD-pause acknowledgement. SCENARIO_DECISIONS/gesture rules define
newgreen500 afterfullneutral as normal down, not an agreed fault-reset gesture.
Thus neither rawRestart wiring nor a normal accepteddown event supplies an
explicit approved HealthyLost reset sequence. No newtimer/gesture/input assumed.

Known: faultsets onHealthy lossduringSS1, stays throughrestoration, full5scoast,
timeddischarge/C2OFFfeedback and permittedfaultlatchedRnD. NoUnlockduringstop,
noautomaticup fromrestoration, noqueuedcancelledlaunch. Green alreadyheld to
requestdown must not automatically acknowledge newfault through rawRestart.
Repeatedheldgreen or PLClevel cannot count as deliberate newreset. Preserve
actual mainEStop recovery procedure separately; do not redefine its Restart.

Root question aftersource/context: «Во время Run→RnD потерян Healthy приSS1;
STO,5с выбег,выдержка разряда иC2 feedbackOFF уже выполнены, система вRnD,
Healthy восстановлен, HealthyLost fault остаётся. Каким отдельным ручным
действием сбросить именно эту ошибку: какую последовательность уже имеющихся
кнопок/команды должен выполнить оператор после отпускания? В каком состоянии
должна остаться система после этого сброса?» EndpointRnD beforeack already
defined, notaskingwhetherstop/5sneeded. Ifresetmustuseexistinggreen, clarify
distinction from normalnewgreen500down; do not invent anotherduration/filter.

Independent tests cancheck faultset/hold, restorationnotack, originaldownheld
green notack, newenergyinhibit/noUnlock under knownstopcontext now. Positive
HealthyLostmanualreset/afterresetfreshcommand depends onanswer; markNOTVERIFIED,
do not borrow EmergencySafeprocedure as oracle for Healthy-onlyRnDfault.
Additional EStop/connector/ExternalNC has separateEmergencypriority/recovery;
that may not erase HealthyLost without approvedack. No hardwaregate.

READY knownnegativecriteria; exactpositiveack pendingaddressedanswer.
ALL WRITES STOP. No source/test changes.
