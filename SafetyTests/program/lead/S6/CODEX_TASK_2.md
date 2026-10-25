# Задание Codex-ревьюеру №2: пересчёт Project CRC (Save), Verify, PLC Build

Автор: координатор Claude, по поручению Вадима, 2026-10-25.
Статус: **READY** — canonical E6w (исправление Q-S6-2) перенесён и закоммичен, можно выполнять
(после разрешения Вадима в задании Codex).

Разрешение на действия этого задания (открыть solution, нажать OK на сообщение о CRC, Save All,
Verify Safety Project, PLC Build) даёт Вадим лично в задании Codex. Без его прямого подтверждения
в задании Codex не выполнять.

## Ожидаемые файлы canonical (сверить `Get-FileHash` до открытия)

- `MEN001_Dyno\Safety_Dyno\TwinSafeGroup1\TwinSafeGroup1.sal` — SHA256 начинается с `9e5bfb15fc39fdac`
- `MEN001_Dyno\Safety_Dyno\GVLs\GVL1.sgvl` — `8a3d452c3d671bae`
- `MEN001_Dyno\Safety_Dyno\TwinSafeGroup1\TwinSafeGroup1.sal.diagram` — `ccd67deecb8557c0`
Если не совпадают — ничего не делать, записать в результат.

## Запреты

- НЕ: Download, Activate Configuration, Login, Choose Target, Restart TwinCAT,
  «Verify Complete Safety Project», смена TargetNetId/target/hardware/group/mappings, push, commit.
- Запрос подключения к устройству / ADS route — Cancel.
- Ничего не редактировать руками. Единственная запись файлов — штатный Save All в IDE (шаг 4).

## Важно: если файлы solution не видны

В прошлый раз после закрытия решения файлы solution не отображались (в Solution Explorer /
в диалоге открытия). В этом случае закрыть не только solution, но и **сам TcXaeShell полностью**
(выйти из приложения), затем запустить TcXaeShell заново и открыть `MEN001_Dyno.sln` — после
перезапуска файлы solution появляются. При закрытии Shell на запросы о сохранении — **No**
(кроме штатного Save All на шаге 4).

Другой способ открыть solution: в Проводнике Windows перейти к файлу
`C:\Users\user\source\repos\MEN001_Dyno_v2\MEN001_Dyno.sln`, правой кнопкой → **Open with** →
**TcXaeShell** — решение откроется напрямую, минуя диалог File → Open.

## Шаги

1. Если решение открыто — закрыть **без сохранения** (No на все запросы).
2. Сверить SHA (выше). Записать `git status --short` по папке `MEN001_Dyno` (до).
3. Открыть `C:\Users\user\source\repos\MEN001_Dyno_v2\MEN001_Dyno.sln`. Ожидаемо появится
   «The calculated CRC checksum of the project file for the project "Safety_Dyno" does not match
   the saved CRC checksum» — нажать **OK** (это известно: splcproj правился в S4 вне IDE).
   Если IDE предлагает ремонт/обновление/миграцию проекта — не соглашаться, записать текст, остановиться.
4. В Solution Explorer выделить **Safety_Dyno** (SAFETY) → **File → Save All**.
5. Закрыть решение (если спросит о сохранении — **No**, всё уже сохранено) и открыть снова.
   Записать: появилось ли сообщение о CRC повторно (ожидается — нет).
6. SAFETY → Safety_Dyno → **Verify Safety Project**. Скопировать Error List полностью
   (Entire Solution; Errors + Warnings + Messages; Ctrl+A, Ctrl+C).
7. PLC: правой кнопкой `PLC_Dyno` → **Build** (без Login/Download). Скопировать ошибки/предупреждения PLC.
8. Закрыть решение **без сохранения**. Записать `git status --short` и `git diff --stat` по `MEN001_Dyno` (после).

## Результат

Записать `SafetyTests/program/lead/S6/VERIFY_RESULT_4.md` (не коммитить):
- дата/время, SHA трёх файлов до открытия;
- текст всех диалогов IDE (CRC и любые другие) и что было нажато;
- список файлов, изменённых Save All (`git status`/`git diff --stat`);
- повторилось ли сообщение о CRC после переоткрытия;
- Safety Verify: ошибки, предупреждения (только количество + все, что НЕ «value from the last update cycle»),
  сообщения — дословно;
- PLC Build: ошибки и предупреждения дословно;
- всё, что сделано не по инструкции.
Затем сообщить Вадиму, что результат готов.
