# Статус и план — 2026-10-25

Краткий статус для человека и для старта новой сессии. Действующие решения —
`SafetyTests/program/DECISIONS_DIGEST.md` → раздел в `SafetyTests/SCENARIO_DECISIONS.md`.
Вводная координатора — `SafetyTests/program/lead/COORDINATOR_HANDOFF.md`.
Процесс — компактный (WORKFLOW.md, раздел «ДЕЙСТВУЮЩИЙ ПРОЦЕСС»), проверка — каталог
`SafetyTests/program/lead/SCENARIO_CATALOG.md` (88 сценариев). Прежние снимки —
`SafetyTests/program/lead/WORK_STATUS_HISTORY.md`.

## Сейчас

- **Программная часть S1–S7 завершена.** Canonical safety = **E6w**: SAL 9e5bfb15…,
  SGVL 8a3d452c…, diagram ccd67dee…; 346 FB (≤ 512).
- Стенд: `cd SafetyTests; npm run check:software` = каталог + структура (native preflight,
  native input rule, CRC, FB ≤ 512) + самопроверки. На canonical: каталог 132 PASS / 0 FAIL /
  1 todo (E-08 — конфликт не вызывается реальными входами), 44/44 мутации, самопроверки 53/53.
- TwinCAT (Вадим/Codex): Safety Verify 0 ошибок (79 предупреждений разобраны и приняты —
  `program/architect/S6/WARNINGS*.md`); splcproj Project Crc верен (native writer, 72e96a7);
  PLC Build 0 ошибок; HMI S7 и связи LV/HV_Faulty проверены Вадимом в IDE.
- Всё закоммичено локально в `Safety-Develop_2_Agent`; push не выполнялся.

## Этапы

| Этап | Статус | Commit |
|---|---|---|
| S1 каталог → тесты | готов | 44179ce |
| S2 E2 статусы/Emergency/полярность | в canonical | 44179ce |
| S3 E3 STOP v2 | в canonical | 8875104 |
| S4 E4 PLC-команды v1.4, Config, heartbeat, STS_* | в canonical | 2494ead |
| S5 E5/E6+E7 SafetyFault, watchdog, BOOT | в canonical | 996ecdb |
| S6 Verify: правила входов, Q-S6-1, Q-S6-2, CRC | в canonical | 0c1800e, bc498de, 72e96a7 |
| S7 PLC: HMI-кнопки, Config, STS-лампы, Healthy→Faulty | в canonical | ee8b64b |

## Осталось (вне агентов)

- Download на EL6910/PLC и испытания на оборудовании (Вадим/инженер): ключевые сценарии
  каталога вживую; heartbeat (PLC стоп → Emergency через 3 с); реальный цикл EL6910.
- Push ветки — решение Вадима.
- По желанию Вадима: сценарии для пробелов каталога (выжившие мутанты E5 —
  `program/architect/E5/PLAN.md` §6); многобитный код ошибок и мигание (п.14–15) — будущее.

## Ограничения (без изменений)

Только v2; reference только чтение; агенты — без download, оборудования и push.
Программные PASS и IDE Verify — не аппаратная валидация.
