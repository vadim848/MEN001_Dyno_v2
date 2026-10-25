# Независимое ревью плана05 — Mentee Set permission

2026-10-19. Read-only проверены ITERATION_05_PLAN.md,
MENTEE_PROGRAM_CONTRACT.md и непосредственно reference/current SAL.
Код/тесты/таймеры ревьюер не менял.

## Вердикт

План принят к реализации после стабильной точки03C. Существенных замечаний
нет. Узкий запрет нового LV/HV Set имеет однозначное основание; нового
вопроса пользователю о полной аварийной процедуре для него не требуется.

## Проверка основания и границ

Самостоятельный разбор read-only reference и v2 подтвердил одинаковые
четыре consumers in_Mentee_EStop. Network2/FBAnd5/AndIn2 и
Network6/FBAnd10/AndIn3 Activated с Make Contact(NO), т.е. инверсией.
Следовательно FALSE разрешает, TRUE снимает программное разрешение.
Main FBEstop1/EStopIn4 Both Deactivated: сохранённый target moniker не
делает его активным. Четвёртый consumer — diagnostic Decouple.
Электрическая полярность/происхождение входа из этого не выводились.

Два ранних Set gates с новым inverted AndIn3 выполняются до LV/HV RS;
stale aggregate не обходит это условие в первом fault scan. Восемь прежних
условий shared currentPermit сохраняются. Добавляются ровно два logical
alias target usages, настоящая existing alias variable и wrappers B1;
фиктивный GVL global не нужен. Порядок209, таймеры, аппаратная конфигурация,
SGVL и source descriptors остаются прежними. Не вводится новая EStop
конфигурация ради b_EStop_OkFALSE.

Проверки плана правильно различают запрет нового Set и сброс уже включённой
энергии: latchedTRUE без Reset должен сохраняться, полная аварийная цепь
вправе снять его своим прежним Reset. Non-Run destination/recovery и порядок
разряда не переопределяются этим пакетным guard.

## Обязательное последующее ревью реализации

Нужны paired actual producers: real aggregateTRUE/latchFALSE, следующий
healthy scan включает output, MenteeTRUE в том же месте запрещает включение.
Покрыть Step12/legacy LV и legacy/R&D/third-route HV; scope внутренних
начальных состояний указать. Сохранить проверки восьми старых условий,
Run protective route и Safe guard, full B1 source audit, точную delta2usages,
независимое ревью и полный пакет на принятой clock модели03C.

План не обещает новую аппаратную безопасность/native CRC и не скрывает
оставшиеся BTN/PLC/state FAIL или обязательные gaps. Эти границы приемлемы.
