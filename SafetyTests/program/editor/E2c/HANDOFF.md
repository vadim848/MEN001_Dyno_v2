# Handoff — E2c по PLAN v7.4.1 (пересборка), кандидат G2

Срез / роль / дата: E2c / v2-editor / 2026-10-22. Подробный общий handoff стека (SHA, inventory, G2, check:e2-delta, модель, регресс, отклонения):
`program/editor/E2d/HANDOFF.md`. Материалы этого среза — в этой папке (SELF_CHECK, PREFLIGHT_*, NATIVE_SAVE/FRESH_RELOAD, GEOMETRY, CONNECTOR_ENDS,
regression/), скрипт — `tools/make-e2c.mjs`. Предыдущая сборка v7.2 — `program/editor/E2-v7.2/E2c/`, `candidates/E2-v7.2/E2c/`.

Кандидат E2c: SAL `ee8439ae2a58c4e51eba8bcba225831d4a024b06975c7eb3e19b8e859aaa4d97`, SGVL `281c9597365fb745553c57dad826fd12217cd07e3a8dc1ef0943782412800f18`, diagram `66f94c13b187a9d0cc5348335ddaad6cdf3ec1b113f3340dd728b6e33820588a` (база E2b `4f933433…`). 229 FB / 1944 порта / 63 Symbols / 79 SAL-переменных. G2: reload CRC valid, SELF_CHECK 33/33, check:e2-delta E2c PASS (NV: SHA ещё не объявлен в плане).
