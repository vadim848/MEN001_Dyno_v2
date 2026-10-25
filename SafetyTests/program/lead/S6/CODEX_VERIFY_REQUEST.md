# Запрос Codex-ревьюеру: TwinSAFE Verify (S6, попытка 2)

Автор: координатор Claude, по поручению Вадима, 2026-10-24.
Статус запроса: **READY** — canonical E6v обновлён и закоммичен, можно выполнять.

## Что проверяем

- Репозиторий: `C:\Users\user\source\repos\MEN001_Dyno_v2`, ветка `Safety-Develop_2_Agent`.
- Ожидаемый canonical safety-проект (сверить перед Verify, PowerShell `Get-FileHash`):
  - `MEN001_Dyno\Safety_Dyno\TwinSafeGroup1\TwinSafeGroup1.sal` — SHA256 начинается с `9209319039fc555e`
  - `MEN001_Dyno\Safety_Dyno\GVLs\GVL1.sgvl` — `27864ca301abf9c6`
  - `MEN001_Dyno\Safety_Dyno\TwinSafeGroup1\TwinSafeGroup1.sal.diagram` — `1b3f3468b6fd8452`
  Если SHA другие — Verify не делать, записать это в результат.
- Попытка 1 (canonical E5) дала 18 ошибок SAL — см. `VERIFY_RESULT_1.md` в этой папке.
  Ожидание сейчас: этих 18 ошибок нет; остаются только ошибки недоступности target (ADS 7).

## Строгие запреты (AGENTS.md)

- НЕ выполнять: Download, Activate Configuration, Login, Choose Target, Restart TwinCAT,
  «Verify Complete Safety Project» (это с hardware). Не менять TargetNetId, target, hardware,
  group-настройки, mappings. Не делать push, не коммитить.
- Если IDE предлагает подключиться к устройству/маршрут ADS — Cancel.
- Не редактировать SAL/SGVL/diagram/tsproj/PLC-код.

## Шаги

1. В TcXaeShell закрыть открытое решение `MEN001_Dyno.sln` **без сохранения** (на все запросы
   «Save changes?» — **No**), чтобы IDE не записала старую версию из памяти.
2. Сверить SHA трёх файлов (см. выше).
3. Открыть заново `C:\Users\user\source\repos\MEN001_Dyno_v2\MEN001_Dyno.sln`.
4. SAFETY → Safety_Dyno → **Verify Safety Project** (только эта команда).
5. Скопировать Error List полностью: «Entire Solution», «Build + IntelliSense», включены Errors,
   Warnings и Messages; выделить всё (Ctrl+A) и скопировать (Ctrl+C). Также текст панели
   Output (TwinSAFE / Build), если есть.
6. PLC: правой кнопкой по `PLC_Dyno` → **Build** (только сборка, без Login/Download).
   Скопировать ошибки/предупреждения PLC.
7. Закрыть решение **без сохранения** (No на все запросы).

## Куда записать результат

Создать `SafetyTests/program/lead/S6/VERIFY_RESULT_2.md` (не коммитить) с разделами:
- Дата/время, версия TcXaeShell/TwinCAT, SHA трёх реально проверенных файлов.
- **Safety Verify — ошибки**: дословно, все строки (Description, Project, File).
- **Safety Verify — предупреждения**: дословно, все строки (ожидается ~170+; не сокращать).
- **Safety Verify — сообщения**.
- **PLC Build**: ошибки и предупреждения дословно.
- Отдельно: любые сообщения про блоки `S6_TRUE`, ворота AND сигналов PLC (CMD_*, Bypass,
  Heartbeat), OR-блоки с одним входом, лимит FB/страниц.
- Что было сделано не по инструкции, если пришлось.

После записи файла — сообщить Вадиму, что результат готов; координатор Claude его прочитает.
