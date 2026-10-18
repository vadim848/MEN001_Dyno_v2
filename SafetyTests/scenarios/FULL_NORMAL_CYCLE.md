# FULL-NORMAL-01 — полный штатный цикл состояний

Цепочка:

```text
Safe -> StartingRnD -> R&D -> StartingRun -> Run
     -> StoppingSS1 -> HVDischarging -> HVDisconnecting
     -> R&D -> StoppingToSafe -> Safe
```

| Этап | Событие/feedback | Ожидаемое состояние | LV cmd | C2 cmd | SS1 | STO | Discharge |
|---|---|---|---:|---:|---:|---:|---:|
| 1 | Исходное состояние | Safe | 0 | 0 | 0 | 1 | 0 |
| 2 | Новый StepUp, крышка закрыта и заперта | StartingRnD | 1 | 0 | 0 | 1 | 0 |
| 3 | `LV_FBK=1` | R&D | 1 | 0 | 0 | 1 | 0 |
| 4 | Новый StepUp, `Healthy=1` | StartingRun | 1 | 1 | 0 | 0 | 0 |
| 5 | `C2_FBK=1` | Run | 1 | 1 | 0 | 0 | 0 |
| 6 | Новый StepDown | StoppingSS1 | 1 | 1 | 1 | 0 | 0 |
| 7 | SS1 и штатная выдержка завершены | HVDischarging | 1 | 1 | 0 | 1 | 1 |
| 8 | `DischargeComplete/HV_Safe=1` | HVDisconnecting | 1 | 0 | 0 | 1 | 0 |
| 9 | `C2_FBK=0` | R&D | 1 | 0 | 0 | 1 | 0 |
| 10 | Новый StepDown | StoppingToSafe | 0 | 0 | 0 | 1 | 0 |
| 11 | `LV_FBK=0` | Safe | 0 | 0 | 0 | 1 | 0 |

Ключевые утверждения:

- каждое повышение требует нового жеста и пройденного release filter;
- `Run` не объявляется до `C2_FBK=1`;
- во время SS1 C2 остаётся включён для регенерации;
- STO включается до разряда;
- discharge начинается при ещё включённом C2;
- C2 отключается только после подтверждения безопасного HV;
- `R&D` не объявляется до `C2_FBK=0`;
- `Safe` не объявляется до `LV_FBK=0`.
