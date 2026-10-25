# Независимое ревью плана07

2026-10-19. Прочитаны ITERATION_07_PLAN.md, UNLOCK_EMERGENCY_CONTRACT.md
и актуальные программные bindings/orders SAL после04/06. Реализацию
ревьюер не менял.

## Вердикт: требуется доработка плана

Существенное замечание P1: один b_EStop_Ok final guard не обеспечивает
заявленный запрет в первом PLC fault sample. NC1 direct путь и отсутствие
автовозврата после ручного reset component контрактом обоснованы, но
порядок PLC producer в плане не учтён.

Actual Network1/FBEstop1 выполняется order21, а его EStopIn3 читает
Network1/FBAnd1/AndOut, вычисляемый order95. FBAnd1 объединяет NOT PLCstop
и NOT FalseSI2. Поэтому в первом sample PLCstopTRUE EStop читает прежний
TRUE AND result и b_EStop_Ok остаётсяTRUE; поздний AND95 снимает его только
для следующего EStop scan. Final209 получает TRUE и не запрещает Unlock
при здоровом старом grant/blue/!green. Значение20 в плане также устарело.

Самостоятельный executable component trace actual FBAnd1+FBEstop1 после
подготовленного high/falling Restart подтвердил: healthy EStopOKTRUE,
первый PLC fault scan TRUE, второй FALSE. Это не произвольное предположение
о физических временах, а прямой эффект глобального порядка блоков.

Архитектору нужен исправленный source/order/guard пакет для first-scan PLC
ban с сохранением latched EStopOK запрета после восстановления. Например,
актуальное raw PLC условие вместе с существующим latched permission либо
иной доказанный программный порядок; конкретный выбор здесь не навязывается.
Не менять safety/group configuration и main inactive EStopIn2/4.

## Остальные проверенные решения

Настоящий SGVL b_EStop_Ok должен иметь wrapper/index по B1; alias basename
не подходит. Final writer209 позднее NC1/EStop21 обеспечивает immediate
NC1 ban. Energy currentPermit не должен добавлять connector/InterLock
запрет доступа в Safe по аналогии с запретом повышения энергии. Existing
Door grant/reset,blue/green hold и sole writer сохраняются.

Paired tests обязаны использовать реальные producer/EStop/full global order,
stalegrant и stalePLC-AND в первом fault scan, здоровые positive controls,
restoration без manualReset. Нельзя засидеть b_EStop_OkFALSE перед первым
fault sample и объявить этим PLC causal path доказанным.

NC2/Mentee/полный Emergency/energy-safe owner остаются явно вне узкого
пакета. Существенных вопросов нового пользовательского поведения тут нет:
нужно технически выполнить существующий сценарий, не менять его oracle.

## Повторное ревью r2 — P1 закрыт на уровне плана

2026-10-19. Updated plan использует actual orders EStop21/PLC-AND95/
final209. Кроме настоящего SGVL b_EStop_Ok на AndIn4 добавлен direct raw
PLC alias на AndIn5 с инвертированным контактом. При первом PLC fault
именно актуальное !PLC снимает Unlock, не ожидая позднего latched EStop;
после восстановления b_EStop_Ok сохраняет запрет до ручного Restart.
Новых blocks/orders/timers или energyPermit зависимости нет.

Односкановый PLC pulse также включён в acceptance: первый sample запрещён
raw guard, следующий sample после восстановления EStop21 потребляет ранее
снятый PLC-AND и защёлкивает запрет, даже если AND95 снова станетTRUE.
Это устраняет выявленный causal пропуск без подстановки EStopOKFALSE.

Typed global wrapper+SGVL usage и отдельный proper alias target usage
не смешиваются. Exact native source audit, paired Safe/R&D controls,
stale grant/PLC-AND, first fault sample и restore-without-reset обязательны
в tests-first пакете и последующем actual SAL review.

Вердикт r2: план принят к реализации через RED тестовый checkpoint.
Существенных незакрытых замечаний к r2 нет. Это не полная приёмка
EMG-007/всех аварийных источников и не реализация07 в текущем SAL.
