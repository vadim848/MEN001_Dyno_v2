# S6 — canonical E6w, попытка 4

Дата: 2026-10-25; завершение 10:54 Asia/Jerusalem (UTC+02:00). Задание: CODEX_TASK_2.md, READY. TwinCAT UI: Build 4026.27 (Loaded). TcXaeShell запущен заново, поскольку изначально приложение не работало. Reference не использовался. Предыдущие отчёты сохранены.

## Итог

- Safety Verify: 0 errors, 79 warnings, 0 messages.
- Из 79 warnings: 71 содержит `value from the last update cycle`, остальные 8 приведены дословно ниже.
- PLC Build: 0 errors, 0 warnings; 1 succeeded or up-to-date, 0 failed, 0 skipped.
- Проверка устранения Project CRC: НЕ ПРОЙДЕНА. После штатного Save All и переоткрытия то же CRC-сообщение появилось снова.
- Git status/diff по MEN001_Dyno до и после пусты. Сохранённых изменений проекта не зафиксировано.

Это результаты программной IDE-проверки и сборки. Устранение CRC-сообщения не подтверждено; результаты не являются аппаратной валидацией.

## SHA256 до открытия

Все ожидаемые префиксы совпали:

| Файл | SHA256 |
| --- | --- |
| MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal | 9E5BFB15FC39FDACDBC0F926123F333D665EC5CEB5D7DA78605F81980B67762D |
| MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl | 8A3D452C3D671BAE6E003896543AAA2378C4DA7A9EC1285FF8479D118A632FF9 |
| MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal.diagram | CCD67DEECB8557C0A28F5592578AEBAC7EB1D0E41C1F6B7475626F551405486C |

## Диалоги и действия

Первое открытие точного C:\Users\user\source\repos\MEN001_Dyno_v2\MEN001_Dyno.sln:

```text
The calculated CRC checksum of the project file for the project "Safety_Dyno" does not match the saved CRC checksum. Please verify the project file.
```

Нажат OK. Других запросов ремонта, обновления, миграции или подключения не было. В дереве отмечен `YT Scope Project1 (incompatible)`; никаких действий с ним не выполнялось.

Выделен внешний Safety_Dyno в SAFETY. Выполнен Ctrl+Shift+S и дополнительно явно File → Save All. IDE показала `Item(s) Saved`. Git status/diff MEN001_Dyno после сохранения пусты. Решение закрыто; запрос сохранения на этом закрытии не появился.

При повторном открытии тот же CRC-диалог появился повторно с дословно тем же текстом. Нажат OK. Не предпринимались ручной пересчёт CRC, ремонт или изменение исходников. Затем выбран внутренний `Safety_Dyno Project`, выполнена только команда `Verify Safety Project` (первая кнопка соответствующей панели, не Verify Complete Safety Project).

В конце, после PLC Build, закрытие вызвало:

```text
Save changes to the following items?
MEN001_Dyno.sln
MEN001_Dyno.tsproj*
```

Нажат `Don't Save`. Подтверждён заголовок TcXaeShell и отсутствие открытого solution.

## Safety Verify — ошибки и сообщения

Error List: Entire Solution; Build + IntelliSense; Errors, Warnings, Messages включены. Без фильтра: 0 Errors, 79 Warnings, 0 Messages. Ошибок и сообщений нет, дословных строк для этих категорий нет. Ошибки ADS в этой попытке не появились; доступность target этим не установлена.

## Safety Verify — предупреждения

Всего 79. Поиск в Error List по `value from the last update cycle` показал `71 of 79 Warnings`. Фильтр затем очищен. В конце полного списка через accessibility и снимок прочитаны оставшиеся восемь предупреждений. Project для всех: `Solution 'MEN001_Dyno'`; Line: 0.

| Description (дословно) | File |
| --- | --- |
| Alias Device 'IN_BIT_SolenoidMonitor' is not connected to the application. | IN_BIT_SolenoidMonitor.sds |
| Alias Device 'in_False' is not connected to the application. | in_False.sds |
| Alias Device 'in_DisCharge_Cmd' is not connected to the application. | in_DisCharge_Cmd.sds |
| Alias Device 'in_HV_Inhibit_Cmd' is not connected to the application. | in_HV_Inhibit_Cmd.sds |
| Alias Device 'in_LV_Inhibit_Cmd' is not connected to the application. | in_LV_Inhibit_Cmd.sds |
| Alias Device 'Safety_Step' is not connected to the application. | Safety_Step.sds |
| The parameter value of 'Safe Inputs After Disc Error' of the function block WINDOW is always true in this selected target system logic. | TwinSafeGroup1.sal |
| The parameter value of 'Safe Inputs After Disc Error' of the function block FBEstop1 is always true in this selected target system logic. | TwinSafeGroup1.sal |

71 повторяющееся предупреждение согласно CODEX_TASK_2.md не перечисляется. Полный clipboard-экспорт получить не удалось: Ctrl+A/Ctrl+C и Copy через контекстное меню переносили при проверке через отдельную вкладку Notepad только одну строку. Get-Clipboard из shell возвращал пустой текст. Поэтому полный экспорт не заявляется; количество категории подтверждено поиском, все восемь исключений прочитаны непосредственно в UI.

## PLC Build

Выполнено через PLC → PLC_Dyno → внутренний PLC_Dyno Project → Build. Не Login/Download. Статус IDE: `Build succeeded`. Output, канал Build, дословно:

```text
Build started at 10:51...
------ Build started: Application: MEN001_Dyno.PLC_Dyno -------
Typify code...
Generate code...
Generate global initializations...
Generate code initialization...
Generate relocations...
Memory usage on device, not used for licensing purposes:
Memory area 0 contains  Data, Input, Output, Memory and Persistent data: size: 10485760 bytes, highest used address: 8436648, largest contiguous memory gap: 2049112 bytes (19 %)
Memory area 1 contains  Code: size: 2791200 bytes, highest used address: 2147072, largest contiguous memory gap: 644128 bytes (23 %)
Build complete -- 0 errors, 0 warnings : Ready for download
Generate TMC information ...
Import symbol information ...

========== Build: 1 succeeded or up-to-date, 0 failed, 0 skipped ==========
========== Build completed at 10:51 and took 13.799 seconds ==========
```

Output General:

```text
C:\Users\user\source\repos\MEN001_Dyno_v2\MEN001_Dyno\PLC_Dyno\PLC_Dyno.plcproj : : generate boot information...
```

`Ready for download` — текст компилятора; Download не выполнялся. После сборки Error List сохранил 79 предупреждений предыдущего Safety Verify, новых PLC ошибок/предупреждений нет.

## Git до/после и сохранённые файлы

До открытия и после финального Don't Save выполнены первые две команды; полный git diff дополнительно проверен после закрытия:

```text
git status --short -- MEN001_Dyno
git diff --stat -- MEN001_Dyno
git diff -- MEN001_Dyno
```

Все выводы пусты. Список файлов MEN001_Dyno, изменённых Save All по git: пустой. Это не исключает появления игнорируемых промежуточных артефактов компиляции. В памяти после Build появились обновлённые элементы mappings; они не редактировались вручную, не сохранялись при закрытии. Никакой новой конфигурации не активировано.

## Отклонения и пределы

Нативный set_value по возвращённому индексу File name снова вернул `element 403 is not available in cached app state for TcXaeShell.exe`. Путь введён поддерживаемыми click/type_text по свежему снимку диалога; снимок подтвердил точный путь. Некоторые immediate snapshots отставали от UI, поэтому перед следующим действием состояние перепроверялось.

Для проверки clipboard запущен Notepad, созданы две отдельные несохранённые вкладки с одиночными строками экспорта. Существовавшие вкладки не изменялись; файл из Notepad не сохранён, диалог Save as отменён. По ошибочной горячей клавише открыта панель Exception Settings; её настройки не менялись. Эти UI-действия не были шагами задания и отмечены явно.

Вне отчёта ручные правки не выполнялись. Download, Activate Configuration, Login, Choose Target, Restart TwinCAT, Verify Complete Safety Project, изменение hardware/group/mappings/target, commit и push не выполнялись. Дополнительные агенты не запускались. Дальнейшая разработка не запускалась.
