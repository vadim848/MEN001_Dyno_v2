# Задание Codex-ревьюеру №3: проверить, что сообщение о Project CRC исчезло

Автор: координатор Claude, по поручению Вадима, 2026-10-25.
Статус: **READY** (после разрешения Вадима в задании Codex).

Что изменилось: в `MEN001_Dyno\Safety_Dyno\Safety_Dyno.splcproj` атрибут `Crc` в строке 2 переписан
родным writer'ом Beckhoff (`ProjectFileCrcWriter`, коммит `72e96a7`); остальное содержимое файла не менялось.
Ожидается: при открытии solution больше нет сообщения «The calculated CRC checksum of the project file
for the project "Safety_Dyno" does not match the saved CRC checksum».

Разрешение (открыть solution, Verify Safety Project) даёт Вадим лично в задании Codex.

## Запреты
Как в CODEX_TASK_2.md: без Download, Activate Configuration, Login, Choose Target, Restart TwinCAT,
«Verify Complete Safety Project», смены target/hardware/group/mappings, без правок файлов,
без Save (на все запросы сохранения — **Don't Save / No**), без commit/push.

## Шаги
1. Если TcXaeShell открыт с решением — закрыть решение без сохранения. Если файлы solution не видны —
   полностью закрыть TcXaeShell и запустить заново (или Проводник → `MEN001_Dyno.sln` → Open with → TcXaeShell).
2. Сверить SHA256 `MEN001_Dyno\Safety_Dyno\Safety_Dyno.splcproj` (записать в результат) и
   `git log -1 --format=%h -- MEN001_Dyno/Safety_Dyno/Safety_Dyno.splcproj` (ожидается `72e96a7`).
3. Открыть `C:\Users\user\source\repos\MEN001_Dyno_v2\MEN001_Dyno.sln`. Записать дословно все диалоги
   при открытии. Главное: появилось ли сообщение о CRC (ожидается — нет).
4. SAFETY → `Safety_Dyno Project` → **Verify Safety Project**. Записать число Errors/Warnings/Messages
   и дословно всё, что не «value from the last update cycle» и не 8 известных (6 «Alias Device … is not
   connected», 2 «Safe Inputs After Disc Error … always true»).
5. Закрыть решение **без сохранения**. `git status --short -- MEN001_Dyno` до и после — записать.

## Результат
`SafetyTests/program/lead/S6/VERIFY_RESULT_5.md` (не коммитить): SHA/коммит splcproj, диалоги при
открытии, итог Verify, git status, отклонения от инструкции. Затем сообщить Вадиму.
