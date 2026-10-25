# S6 — Verify Safety Project, попытка 1 (Вадим, 2026-10-24)

Проект: canonical E5 (SAL 4c4be64b…, HEAD 4c3749d), TcXaeShell, Verify Safety Project.
Итог: **20 ошибок, 172 предупреждения**, 0 сообщений. Источник — скриншот Error List + вставка Вадима.
Проект в IDE не сохранялся (git status MEN001_Dyno чист). PLC Build — результат не сообщён.

## Ошибки
Target (ожидаемо офлайн, не дефект SAL):
1. Target System of safety project "Safety_Dyno" is not reachable…
2. Target machine could not be found. (AdsErrorCode: 7, 0x7)

SAL — «InPort … can only be connected to safe inputs» (16):
- PK_PREV: DecIn1, DecIn2, DecIn3, DecIn4, DecIn5
- PE_ALLF: AndIn2, AndIn3, AndIn4, AndIn5
- PC_O2: OrIn1, OrIn2; PC_O3: OrIn2; PC_O4: OrIn2
- PC_A2: AndIn2; CFG_EX_SET: AndIn2; HB_T_HI: TonIn

SAL — «does not have at least 2 input ports active and connected» (2):
- HB_LO; HEALTHY_OK

## Предупреждения (172, видны первые)
- «Variable linkSafeUpScope is used at AndIn5 of PA_CFG which will be executed … before … assigned by AndOut of SAFE_UP_SCOPE, so the value from the last update cycle will be used.»
- «A WiredLink connects AndOut of FBAnd67 and OrIn2 of FBOr24 which will be executed … before FBAnd67 …»
- «A WiredLink connects AndOut of FBAnd89 and Set of FBRs19 …»
Полный список предупреждений не получен.

## Вывод по стенду
`check:structure` (native preflight + CRC) не проверяет native input-rule (safe-only порты, минимум 2 входа) — дефект гейта: эти ошибки должны были ловиться до переноса.
