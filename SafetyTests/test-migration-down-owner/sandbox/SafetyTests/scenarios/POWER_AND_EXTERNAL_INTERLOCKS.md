# POWER-CONNECTOR / EXTERNAL-EMERGENCY-INTERLOCK

Соответствие сигналов оригинального TwinSAFE:

| Эталонная модель | TwinSAFE original | Назначение |
|---|---|---|
| `lvConnectorInterlock` | `in_LV_Connector_Interlock` | Dry-contact Fast Charge 48 V/LV |
| `hvConnectorInterlock` | `in_HV_Connector_Interlock` | Dry-contact Fast Charge HV |
| `externalInterlockCh1` | `in_InterLock_NC_1` | External Emergency Interlock, канал 1 |
| `externalInterlockCh2` | `in_InterLock_NC_2` | External Emergency Interlock, канал 2 |

Правила:

1. В `Safe` отсутствие любого connector interlock только запрещает StepUp. Состояние остаётся `Safe`, fault не фиксируется.
2. Восстановление connector interlock не возобновляет отклонённую команду: требуется новый release filter и новый StepUp.
3. После выхода из `Safe` потеря любого connector interlock запускает аварийную последовательность.
4. Потеря любого канала External Emergency Interlock является Emergency во всех состояниях.
5. Восстановление аварийного контакта не отменяет уже начатую аварийную последовательность.
6. При возможном HV аварийная последовательность выполняет STO, coast, discharge с C2 ON и отключение C2 после HV-safe feedback.
