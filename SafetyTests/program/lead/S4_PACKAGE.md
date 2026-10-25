# Пакет S4 (E4: команды PLC v1.4, Config, heartbeat, статусы) — gate

Дата: 2026-10-24. Ведущий. Только программная модель стенда: не Verify/Build/Target, не аппаратная безопасность.

## Кандидат

- **E4 SAL**: `SafetyTests/candidates/E4/native` — SAL `4ee8d3d9…`, SGVL `98a0d10f…`, diagram `98faaead…`; 297 FB (≤ 512), native CRC valid, структура PASS.
- **Файлы вне SAL** (V14-Q2): `SafetyTests/candidates/E4/config/` + `MANIFEST.md` (целевые пути, SHA до/после, переименования). 6 переименованных alias .sds, 6 новых Out alias (sds 100–105), Safety_Dyno.splcproj, MEN001_Dyno.tsproj, ST_TwinSAFE_IN/OUT.TcDUT, MAIN.TcPOU (heartbeat 0,5 с; CMD_* по умолчанию FALSE, источник запросов — со стороны PLC, открыт). Перекоммутации нет.
- База: canonical E3 (`9ee66e78…`, коммит 8875104). План: `program/architect/E4/PLAN.md` (276ac70c…).

## Результаты

- Весь каталог на E4 (`program/tester/S1/e4-final-all.tap`): 100 PASS, 13 FAIL (только E5/E6), 6 todo; мутации 30/30 убиты. Регрессий против canonical E3 нет.
- Ревью (одно): `program/reviewer/S4/REVIEW.md` — SAL ACCEPT; F1 (MAIN держал CMD_RND_TO_SAFE = TRUE) исправлен; F2 — безопасностно значимые выжившие мутанты убиты новыми подслучаями; 2 выживших (PA_CFG.AndIn5 — эквивалентен по реальным входам; AndIn7 — условие STO FBK без решения) и прочие несущественные — заметка.
- Проверяемо только в TwinCAT (S6): открытие/Verify/Build SAL, Project Crc splcproj, alias 100–105, tsproj (DataType, ссылки, устаревшая ссылка InitSysytem), TargetSystemConfig, сборка PLC, тайминг heartbeat, ошибки ADS7/Target.

## Решения команды (к сведению)

- Q-E4-2 «A»: abort-фронт PLC в переходе исполняется и при другой TRUE-команде; игнорируется при ошибке PLC/нажатой кнопке (**пересматривается — вопрос F3b Вадиму**).
- Q-E4-3 «A»: Config сбрасывает оба Discharge при входе; выход — HV Discharge в начале, LV с C1 OFF.
- Q-E4-4 «A»: heartbeat 3 с от последней смены уровня.
- S4-F3a: FBK ON при выходе из Config → Emergency по E6-Q1 в E6; до E6 — остаётся в Config (известное ограничение).

## Вопросы Вадиму (интерфейс PLC / расхождение рекомендаций) — до переноса

1. Q-E4-1 — статусы для PLC (рекомендация А: 7 выходов STS_*).
2. Q-E4-5 — носитель CMD_TRIGGER_EMERGENCY (рекомендация А: существующий in_Estop_PLC, без переименования).
3. F3b — abort командой PLC при активной ошибке PLC (архитектор: игнорировать; ревьюер: сомнение).
