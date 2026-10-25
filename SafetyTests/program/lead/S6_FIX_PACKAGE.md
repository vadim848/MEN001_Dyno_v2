# Пакет S6-fix (ошибки Verify TwinCAT) — gate

Дата: 2026-10-24. Ведущий. Программная модель + offline-проверки; повторный Verify в TwinCAT — у Вадима.

- Кандидат `SafetyTests/candidates/E6v/native`: SAL `92093190…`, SGVL `27864ca3…` (не изменён), diagram `1b3f3468…`; 344 FB.
- Причина 18 ошибок: стандартные сигналы PLC (CMD_*, Bypass, heartbeat; E4) шли не в AndIn1 safe AND; HEALTHY_OK (E3) и HB_LO (E4) имели < 2 активных входов.
- Исправление: 6 шлюзов AND(сигнал PLC, S6_TRUE) перед потребителями; S6_TRUE = in_ES_NC_1 OR NOT in_ES_NC_1 (вариант «А» Q-S6-1, ждёт Вадима); HB_LO.AndIn2 = S6_TRUE; HEALTHY_OK.AndIn4 = linkCoverClosed (копия AndIn3). Поведение не меняется.
- Стенд: в check:structure добавлена native input-rule проверка (`src/sal-input-rule.js`); воспроизводит все 18 ошибок на E5, 0 лишних; на E6v — 0. Не доказано до Verify: исключение «alias с FB-писателем», OR min-2, реакция Verify на S6_TRUE, 172 предупреждения.
- Каталог E6v: 128 PASS / 0 FAIL / 1 todo (E-08); мутации 40/40 (вкл. M-G1/G6/G7); шлюзовые мутанты M2/M4 эквивалентны. Структура E6v PASS; canonical E5 — FAIL 18 (честно). npm test 53/53.
- Ревью: `program/reviewer/S6/REVIEW.md` — ACCEPT WITH NOTES. Мнение по Q-S6-1: «А» буквально не нарушает AGENTS.md, но обходит смысл правила Verify — нужен явный ответ Вадима.
- Предупреждения «value from last update cycle»: новое только HEALTHY_OK.AndIn4 (то же значение, что AndIn3) — риска нет; прочие не классифицированы без полного списка.
