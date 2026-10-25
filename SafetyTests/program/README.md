# Рабочая папка цикла — команда Claude Code (с 2026-10-21)

Правила и gates: WORKFLOW.md, раздел «Команда Claude Code». Предыдущие циклы
(`resumed-development-2026-10-21/` и плоские `ITERATION_*` в SafetyTests) —
история, не перезаписывать.

## Владение (проверяет `.claude/hooks/path-guard.mjs`)

| Путь | Владелец |
|---|---|
| `TRACE_MATRIX.json`, `*.md` в корне, `lead/` | ведущий |
| `analyst/`, `../SCENARIO_DECISIONS.md`, `DECISIONS_DIGEST.md` | v2-analyst (и ведущий) |
| `architect/` | v2-architect |
| `stand/`, `../src`, `../scripts` | v2-stand-engineer |
| `editor/`, `../../MEN001_Dyno/Safety_Dyno`, `../candidates` | v2-editor |
| `tester/`, `../test/current-*`, `../test/helpers` | v2-tester |
| `reviewer/` | v2-reviewer |
| `runs/` | v2-runner |

Внутри ролевой папки — подпапка на срез: `<этап>-<коротко>`, например `E1-f1-gates`.

## Шаблон handoff (каждая роль возвращает ведущему)

```
Срез / роль / дата:
Источник: SAL <sha256> SGVL <sha256> diagram <sha256>
Сделано:
ID матрицы и их новый статус (только факт, без «закрыто», если это не G4):
Команды воспроизведения:
Результаты: PASS / FAIL / NV / ERROR (дословно not ok)
Допущения и пределы доказательства:
Вопросы аналитику/Вадиму (исходное состояние → события → какой реакции не хватает):
Что передать следующему и кому:
```

## Матрица

`TRACE_MATRIX.json` — единственный машиночитаемый статус 41 ID. Ведущий
обновляет её после каждого gate. ID получает CLOSED только при: позитивные и
негативные сценарии PASS на canonical SAL, мутации guard'ов убиты, независимое
ревью ACCEPT. Число тестов не равно покрытию.
