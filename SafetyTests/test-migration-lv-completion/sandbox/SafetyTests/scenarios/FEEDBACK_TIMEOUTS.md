# FEEDBACK-TIMEOUTS — предварительная политика

Эти значения используются только в независимом тестовом стенде и пока не являются утверждёнными аппаратными параметрами:

| Ожидаемое подтверждение | Тестовый timeout | Реакция модели |
|---|---:|---|
| LV включён при `Safe -> R&D` | 5 s | `TransitionFault`, LV command OFF, STO ON |
| C2 включён при `R&D -> Run` | 5 s | `TransitionFault`, Run запрещён |
| `DischargeComplete/HV_Safe` | 10 s | `TransitionFault`, STO ON, C2 и discharge удерживаются ON |
| C2 выключен после команды OFF | 5 s | `TransitionFault`, C2 command остаётся OFF, STO ON |
| LV выключен при `R&D -> Safe` | 5 s | `TransitionFault`, Safe не объявляется |

Для каждого таймера тестируется граница:

```text
timeout - 1 cycle -> переход ещё не выполняется
timeout             -> фиксируется ожидаемый fault
```

Особенно важно: timeout discharge не должен сам по себе размыкать C2. Окончательная аварийная процедура требует отдельного согласования и аппаратной validation.
