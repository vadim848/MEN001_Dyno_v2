# Handoff — E2b по PLAN v7.4.1 (пересборка), кандидат G2

Срез / роль / дата: E2b / v2-editor / 2026-10-22. Подробный общий handoff стека (SHA, inventory, G2, check:e2-delta, модель, регресс, отклонения):
`program/editor/E2d/HANDOFF.md`. Материалы этого среза — в этой папке (SELF_CHECK, PREFLIGHT_*, NATIVE_SAVE/FRESH_RELOAD, GEOMETRY, CONNECTOR_ENDS,
regression/), скрипт — `tools/make-e2b.mjs`. Предыдущая сборка v7.2 — `program/editor/E2-v7.2/E2b/`, `candidates/E2-v7.2/E2b/`.

Кандидат E2b: SAL `4f933433c4dcb6a4ddf3cbad1cad64897965c48f7832613d0481b0195fbce45e`, SGVL `7ae241165ec0321bcae684d726925b178bb8ef354ca68fce72160dbdc334129c`, diagram `a413ca1f1ebfcaa7d94a4789770f14170e7528852f5c6a5af2ba0a8d16b45e94` (база E2a-RC `5733552a…`). 227 FB / 1926 портов / 63 Symbols / 78 SAL-переменных. G2: reload CRC valid, SELF_CHECK 33/33, check:e2-delta E2b PASS (NV: SHA ещё не объявлен в плане).
