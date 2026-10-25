# COVER-INTERLOCK-LOSS — потеря закрытия или блокировки

| Исходное состояние | Потеря `CoverClosed`/`CoverLocked` | Ожидаемая реакция |
|---|---|---|
| Safe | Допустима | Состояние сохраняется, timeout/fault отсутствует |
| R&D | Допустима | Состояние сохраняется, timeout/fault отсутствует |
| StartingRnD | Переход ещё не завершён | `TransitionFault`, LV command OFF |
| StartingRun | HV уже мог быть запрошен | Немедленный STO, emergency coast, C2 удерживается ON |
| Run | Опасная энергия активна | Немедленный STO, emergency coast, C2 удерживается ON |
| StoppingSS1 | Регенеративная остановка прерывается | Немедленный STO, emergency coast, затем discharge |
| STOCoastWait | Выбег продолжается | Emergency coast, затем discharge |
| HVDischarging | Разряд уже идёт | Продолжить emergency discharge при C2 ON |
| HVDisconnecting | C2 уже получил OFF | Не включать C2 повторно; ждать `C2_FBK=OFF` |

Дополнительные правила:

- краткое восстановление feedback не отменяет аварийную последовательность;
- `UnlockCover` остаётся OFF;
- одиночные и двухкнопочные команды не возвращают систему вверх;
- потеря только одного из двух признаков (`CoverClosed` либо `CoverLocked`) достаточна для аварийной реакции при возможном HV;
- физическая валидация должна подтвердить, что feedback действительно является safety-rated locked status.
