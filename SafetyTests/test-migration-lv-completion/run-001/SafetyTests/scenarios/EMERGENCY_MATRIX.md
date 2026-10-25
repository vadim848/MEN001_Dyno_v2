# EMERGENCY-MATRIX — E-Stop в каждом состоянии

Статус: предварительная консервативная политика тестовой модели. Окончательная аварийная discharge-процедура должна быть согласована с документацией источника и аппаратной validation.

| Исходная фаза | Первая реакция | C2 | Discharge | Завершение |
|---|---|---:|---:|---|
| Safe | Emergency, STO | OFF | OFF | Emergency |
| StartingRnD | Emergency, STO, LV command OFF | OFF | OFF | Emergency |
| R&D | Emergency, STO, LV command OFF | OFF | OFF | Emergency |
| StoppingToSafe | Emergency, STO | OFF | OFF | Emergency |
| StartingRun | EmergencySTOCoastWait | ON | OFF | Coast -> discharge -> C2 OFF -> Emergency |
| Run | EmergencySTOCoastWait | ON | OFF | Coast -> discharge -> C2 OFF -> Emergency |
| StoppingSS1 | Немедленный STO, EmergencySTOCoastWait | ON | OFF | Coast -> discharge -> C2 OFF -> Emergency |
| STOCoastWait | Полный новый Emergency coast interval | ON | OFF | Coast -> discharge -> C2 OFF -> Emergency |
| HVDischarging | EmergencyHVDischarging | ON | ON | HV safe -> C2 OFF -> Emergency |
| HVDisconnecting | EmergencyHVDisconnecting | OFF command | OFF | C2 feedback OFF -> Emergency |

Глобально для всех строк:

- `UnlockCover=OFF`;
- новые команды оператора игнорируются;
- повышения энергетического состояния нет;
- финальный `Emergency` не означает, что крышку автоматически можно открыть;
- аппаратное разрешение открытия после аварии требует отдельного подтверждения безопасной энергии.
