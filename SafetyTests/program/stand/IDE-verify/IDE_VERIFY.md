# IDE-VERIFY-OFFLINE — стык 512/513 FB и бюджет страниц (Q-61 «А»)

2026-10-22, v2-stand-engineer. Тип доказательства: **IDE-VERIFY-OFFLINE**. Он отдельный: это
не программные тесты стенда и не native CRC. Машиночитаемая версия: `IDE_VERIFY.json`.

## Итог: Verify в TcXaeShell НЕ ЗАПУСКАЛСЯ (статус NOT RUN, BLOCKED)

Ни одного сообщения Verify не получено, поэтому дословных текстов Verify здесь нет.
Пункты 1–2 задания (512 проходит, 513 даёт ошибку, порог страниц, бюджет 12×2048 Б для F1/R1)
остаются **NV**. Текст ожидаемой ошибки FB взят из SDK (FB_LIMIT.md). Это не результат IDE.

Причина: среда (классификатор разрешений auto mode) заблокировала два действия, нужных
для безопасного запуска IDE над копией (подробно в разделе «Заблокированные действия»).
Проект нацелен на реальное устройство (`TargetNetId="192.168.1.50.1.1"`, EtherCAT
`AmsNetId="192.168.1.50.3.1"`). Перенаправить цель копии на локальную систему мне не дали.
Запускать TcXaeShell с проектом, у которого target — реальное устройство, после двух блокировок
я не стал: требование «без ADS/route к устройствам» я не могу гарантировать сам.
Решение остаётся за пользователем (см. «Что требуется от пользователя»).

TcXaeShell не запускался ни разу. Activate, Login, Download, ADS и route не выполнялись.
Canonical `MEN001_Dyno` и reference не изменялись: `git status --short MEN001_Dyno` пуст,
tsproj копии побайтно равен canonical.

## Что подготовлено (готово к Verify)

Изолированные копии проекта лежат в scratchpad
`C:/Users/user/AppData/Local/Temp/claude/C--Users-user-source-repos-MEN001-Dyno-v2/ccd06a82-39c5-4519-838f-df9bc38d59d9/scratchpad/`.
Каждая копия содержит `MEN001_Dyno.sln` (только проект tsproj, без DriveManager/Scope)
и полную папку `MEN001_Dyno/` без `.git` и без `.tsproj.bak`. Отличаются только три файла safety-проекта:

| Копия | FB | SAL sha256 | diagram sha256 | SGVL sha256 |
|---|---:|---|---|---|
| `ide-verify-F1` | 242 | 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 | de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603 | dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 |
| `ide-verify-R1` (candidates/E2-R1/native) | 215 | ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3 | b82aa41a6ee065267852d78ccaff961714eca1e8e8c006f087de715fb2a137b6 | 4f205138337ea3de3660d5ef2d8978db438e3e8d19f2e9dd393ec7a5816cdb36 |
| `ide-verify-syn512` | 512 | 15cc73e543fb4604cc411415689a3f532c3a15989009e4d9eed6a6f3c78182a4 | 3ff17acd7cacd2d677d54e12c80a018c3df43fafb100e3be36a646324e16e4d0 | dc103abe… (= F1) |
| `ide-verify-syn513` | 513 | b1c913ceafa9e0c8563f3148f98258eb82329ee04cc16634a9421147a582199f | be590d59c4010518ce863e1e22683fcdb7aed45deaa43b83d4ed39160fc1c19b | dc103abe… (= F1) |

Остальные файлы проекта (tsproj, splcproj, TargetSystemConfig.xml `b455dc24…f36c4` = EL1918,
alias devices) — копия canonical v2 на HEAD `b580920`.

### Синтетический кандидат 512/513

Это F1 (байтовая копия из `program/editor/E2-R1/source`, SHA сверены) плюс новая сеть `Network15`
(`networkName="IdeVerifySynthetic"`, intId 15, networkOrderId 14) с N фиктивными `safeAnd`
(`FBAndIdeSyn1..N`, orderOfExecution 243..242+N). У каждого AND активирован только AndIn1
(NO, filter 2), AndIn2..8 деактивированы. Цепочка такая: SAL-переменная `in_False_SI2_CH8` →
`FBAndIdeSyn1.AndIn1` (новый target usage); `FBAndIdeSynk.AndOut` → `FBAndIdeSyn(k+1).AndIn1`
(wire внутри Network15). Выход последнего AND свободен. Нет связей с выходами, Symbols и
межсетевых wire. SGVL не менялся. N=270 даёт 512 FB, N=271 даёт 513 FB.

Сборка идёт в два шага. Первый — текстовое добавление (`tools/make-synthetic.mjs`, CRC
источника не трогается). Второй — offline native load, фикс-ап диаграммы и save установленными
writer'ами SALDesigner 1.4.16 (`tools/native-save-synth.ps1`, адаптирован из
`editor/E2-R1/tools/native-save.ps1`). Фигуры новых сети, FB, портов и connectors созданы через
`Diagram.FixUpDiagram`. CRC вручную не менялся.
Самопроверка (`native-reports/`) — native load/CRC, это не IDE-доказательство:

| | native save | fresh reload: nativeCrcValid | FB | порты | FB/порты без фигуры |
|---|---|---|---:|---:|---|
| syn512 | OK | **true** | 512 | 4506 | 0 / 0 |
| syn513 | OK | **true** | 513 | 4515 | 0 / 0 |

Пределы: проектный CRC и splcproj (`Crc="1975831473"`) не пересчитывались. Если IDE свяжет его
с CRC SAL, Verify может дать CRC-сообщение, которое к лимиту не относится. Это NV.
Фикс-ап кладёт все 270/271 фигур в одну дорожку; при открытии в редакторе они могут
перекрываться, на Verify это не влияет (не проверено). Если на 512 появится ошибка страниц,
промежуточные точки бисекции собираются той же парой команд с другим N (см. «Воспроизведение»).

## Пункт 3 — прежний кандидат 03B (290 FB)

Готовых файлов нет. `03B_NETLIST_PLAN.md` и `03B_NETLIST_PLAN.json` — это план-нетлист
архитектора от 2026-10-19 («Архитектор создал 03B_NETLIST_PLAN.json, не SAL»), статус
«NOT READY к записи SAL». Поиск `*.sal` по `SafetyTests` (без копий button-routing-audit)
не нашёл ни одного SAL с ≥260 FB. Максимум 251 FB (down-episode-owner, safe-resumption).
По заданию 03B заново не строился.

## Пункт 4 — E2

Кандидат E2 не собран. Подготовлены базы F1 и R1. E2 — позже, тем же порядком.

## Заблокированные действия (по запросу ведущего)

1. `sed -i` по **копии** в scratchpad `ide-verify-F1/MEN001_Dyno/MEN001_Dyno.tsproj`: замена
   `TargetNetId` 192.168.1.50.1.1 → локальный 192.168.1.13.1.1. Цель была защитной: чтобы IDE
   не обращалась к реальному устройству. Отказ «[Security Weaken]». Обходить я не стал,
   копия осталась равна canonical.
2. Чтение вывода фонового `find / -iname StaticRoutes.xml` вместе с `ls` каталогов
   `TwinCAT/3.1/Target` и `Config`: хотел проверить, есть ли ADS-маршрут к 192.168.1.50.
   Отказ «[Sensitive Remote Exec]». Из ранее разрешённого чтения известно: в
   `…/TwinCAT/3.1/Target/` нет `StaticRoutes.xml`, локальный AmsNetId 192.168.1.13.1.1,
   служба TcSysSrv запущена. Отсутствие маршрута **не доказано**.
3. Окно «3 consecutive actions were blocked» у пользователя, скорее всего, вызвало моё
   чтение canonical SAL/diagram: grep `</Network>`/`</networks>`, `in_False_SI2_CH8`,
   head .diagram, счёт тегов. Эта команда в итоге выполнилась и только читала. Она нужна,
   чтобы собрать синтетический кандидат.

Как я продолжил: TcXaeShell/DTE не запускал. Всю офлайн-подготовку без IDE (копии,
синтетика, native CRC) выполнил только в scratchpad (префикс `ide-verify-`) и в
`program/stand/IDE-verify/`. Activate, Login, Download, ADS и route не выполнялись. Canonical не изменён.

## Что требуется от пользователя

Нужно одно из двух.

**А. Ручной Verify в IDE (рекомендуется).** Для каждой копии в порядке F1, R1, syn512, syn513:

1. Желательно отключить ПК от сети станка (192.168.1.x) или убедиться, что ADS-маршрута
   к 192.168.1.50 нет. Цель копии — реальное устройство, перенаправить её мне не разрешили.
2. Открыть `scratchpad/ide-verify-<имя>/MEN001_Dyno.sln` в TcXaeShell и проверить путь в
   заголовке: это должен быть scratchpad, а не `source/repos`.
3. В дереве Solution: SAFETY → Safety_Dyno → контекстное меню / тулбар TwinSAFE →
   **«Verify Safety Project»** (команда SDK `VerificationProjectCmdId`).
   **Не** нажимать «Verify Complete Safety Project» (`VerificationProjectAndHardwareCmdId`),
   Download, Activate Configuration, Login и Choose Target. Если появится запрос подключения —
   нажать Cancel.
4. Скопировать дословно Error List (Errors/Warnings/Messages) и Output (панель TwinSAFE/Build).
   Если есть отчёт о ресурсах (страницы, process image, mapping code), сохранить и его.
5. Закрыть без сохранения.

Ожидание по SDK (не IDE-факт): syn512 — без «Too many function blocks…»; syn513 —
«Too many function blocks configured for chosen target system EL1918 (maximum number of
512 allowed).» (текст с подстановками — гипотеза: формат `{0}`/`{1}`). Если раньше
появится «Too many functionblocks, connections or groups have been added for the selected
target system.», значит, страницы кончились раньше: сообщите, и я соберу точки бисекции.

**Б. Разрешить мне автоматизацию.** Нужно явное разрешение пользователя на запуск TcXaeShell
через DTE (`TcXaeShell.DTE.17.0`) над копиями в scratchpad. Желательно также разрешить
перенаправить `TargetNetId` копии на локальную систему. После этого я выполню команду
Verify Safety Project и сниму Error List программно.

## Воспроизведение (подготовка, без IDE)

```
SP=<scratchpad>; SRC=SafetyTests/program/editor/E2-R1/source   # = canonical F1, SHA сверены
node SafetyTests/program/stand/IDE-verify/tools/make-synthetic.mjs $SRC 270 $SP/ide-verify-syn/F1p270-staged
powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File SafetyTests/program/stand/IDE-verify/tools/native-save-synth.ps1 -InputDir $SP/ide-verify-syn/F1p270-staged -OutputDir $SP/ide-verify-syn/syn512-native -ReportPath $SP/ide-verify-syn/syn512-native.json
powershell.exe ... native-save-synth.ps1 -InputDir $SP/ide-verify-syn/syn512-native -OutputDir $SP/ide-verify-syn/syn512-reload -ReportPath $SP/ide-verify-syn/syn512-reload.json -Reload
(то же для 271 → syn513; копия проекта: cp -r ide-verify-F1 → ide-verify-synNNN и замена 3 файлов)
```
GUID новых элементов случайные, поэтому SHA при пересборке другие. Для IDE-доказательства
значим именно SHA проверенных копий из таблицы выше.

## Окружение

TcXaeShell `C:/Program Files/Beckhoff/TcXaeShell/Common7/IDE/TcXaeShell.exe` FileVersion 17.0.0.0;
TwinCAT 3.1.4026.27; Safety SDK 1.4.16 (SALDesigner/SALDesignerControl 1.4.16.13, v170).
ProgID `TcXaeShell.DTE.17.0` зарегистрирован (не вызывался).
