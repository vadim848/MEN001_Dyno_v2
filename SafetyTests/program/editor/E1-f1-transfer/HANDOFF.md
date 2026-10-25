# Handoff — перенос F1 в canonical

Срез / роль / дата: E1-f1-transfer / v2-editor / 2026-10-21
Основание: указание ведущего после G4 ACCEPT bounded
(`SafetyTests/program/reviewer/E1-f1/F1_G4_REVIEW.md`, условие C1).

Источник (кандидат `SafetyTests/candidates/resumed-f1/native/`):
SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3
SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104
diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603

Canonical ДО переноса (сверено, совпало с указанием):
SAL 34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b
diagram 7b5eb79439011cdf9a3206aa815dec4349a35cf8155bfac7492b7ffd75e578ce
SGVL 517fdadd913007aa2690f1402676583ad16141c9ae64cb986554c87c10f22635

Canonical ПОСЛЕ переноса = кандидат F1 (SHA выше, совпадают побайтно, `cmp` OK).

Сделано:
- Побайтное копирование (`cp`, без преобразования EOL) трёх файлов:
  - `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`
  - `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal.diagram`
  - `MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl`
- Уточнение пути: в указании SGVL назван `TwinSafeGroup1/GVLs/GVL1.sgvl`;
  такого файла нет. Единственный `GVL1.sgvl` в Safety_Dyno —
  `MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl`, его SHA до переноса совпал
  с ожидаемым 517fdadd…, поэтому перенос выполнен в него.
- Проверка нормализации: `git check-attr text` для трёх путей = `unset`
  (явные правила `-text` в `.gitattributes`); `git hash-object` рабочего файла
  равен `git hash-object --no-filters` того же файла и кандидата
  (sal 4b3cb0d5…, diagram d616c967…, sgvl 8905bbf9…) — нормализация на
  индексации не произойдёт. `git diff --stat`: 3 файла, +241/−127.
  core.autocrlf=true не влияет на пути с `-text`.

Inventory: файлы побайтно идентичны кандидату F1, поэтому число
Symbols/блоков/портов равно инвентарю кандидата, проверенному на G4;
отдельный повторный подсчёт в этом срезе не выполнялся.

ID матрицы: статусы не менял (решение ведущего после регрессии на canonical).
Команды воспроизведения:
  sha256sum MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal{,.diagram} MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl
  git check-attr text -- <три пути>
Результаты: самопроверка переноса — SHA/cmp/hash-object совпали. Регрессия
`npm run check:software` в этом срезе не запускалась (не входила в поручение).
Допущения и пределы: native CRC/IDE/Target не проверялись; CRC вручную
не менялся. Тесты, BOOT manifest, fixtures, .tsproj/.xti/_Config,
group/target не трогались. Коммит не делался.
Вопросы: нет.
Что передать следующему: ведущему — запуск регрессии/независимой проверки
на canonical; учесть, что BOOT manifest/pinned fixtures, ссылающиеся на
прежние SHA canonical, могут теперь давать расхождение (не правились).
