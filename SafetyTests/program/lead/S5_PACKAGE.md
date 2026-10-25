# Пакет S5 (E5/E6: SafetyFault, watchdog 500 мс / 30 с; E7 без изменений) — gate

Дата: 2026-10-24. Ведущий. Только программная модель стенда: не Verify/Build/Target, не аппаратная безопасность.

## Кандидат

- **E5**: `SafetyTests/candidates/E5/native` — SAL `4c4be64b…`, SGVL `27864ca3…`, diagram `7ad25ee8…`; 337 FB (≤ 512), native CRC valid, структура PASS.
- База: canonical E4 (`4ee8d3d9…`, коммит 2494ead). Только SAL/SGVL/diagram; mappings/tsproj/PLC не меняются.
- План: `program/architect/E5/PLAN.md`. Реализация: `program/editor/E5/IMPLEMENTATION.md`.

## Что сделано

- Единая память SafetyFault (потеря Healthy, отказ подъёма по watchdog, FBK ON без команды); квитирование — первое нажатие кнопки после «обе отпущены 2 с», только без активной причины; PLC не квитирует; пока активна — подъём запрещён (кнопки и PLC), спуск и Emergency не блокируются.
- STS_FAULT = ошибка PLC OR SafetyFault.
- Watchdog C1/C2 500 мс: отказ подъёма → откат в устойчивое состояние + SafetyFault; потеря подтверждённого FBK или FBK ON > 500 мс после OFF → Emergency (в т.ч. выход из Config, S4-F3a).
- Watchdog Healthy 30 с (Safe→R&D, StartingRun) → откат + SafetyFault.
- E7 (BOOT): изменений не потребовалось, B-01…B-03 PASS.

## Результаты

- Весь каталог на E5 (`program/tester/S1/e5-final-all.tap`): 125 PASS, 0 FAIL, 1 todo (E-08 — конфликт не вызывается реальными входами); мутации 37/37 (вкл. N1 ревью, C1 в G-07). Регрессий против canonical E4 нет.
- Ревью (одно): `program/reviewer/S5/REVIEW.md` — ACCEPT WITH NOTES; опасностей не найдено.

## Решения команды (к сведению Вадима)

- Q-E5-1 «А»: синяя при SafetyFault только квитирует, без Unlock. **Заметка ревьюера N3:** в реализации Unlock также не выдаётся, пока причина SafetyFault ещё активна (напр. FBK ON без команды в Safe) — шире решения; безопасное направление, команда оставляет так.
- TD-E5-1: снятая до 500 мс команда (abort Safe→R&D) отказа не даёт. **Заметка N2:** Q-V7-03 приводит abort Safe→R&D как пример; в abort StartingRun (C2 держится ≥ 1 с) SafetyFault ставится.
- TD-E5-2…3: квитирование только после паузы 2 с; Restart в Emergency не квитирует, SafetyFault переживает Emergency→Safe.
- TD-E5-4: FBK ON без команды → SafetyFault только в устойчивых Safe/R&D (**N4:** в переходах подъём уже запрещён охраной ¬FBK).
- TD-E5-5…6: 30 с от первого FBK ON; откат Config = штатный выход.

## После S5

Этапы E2–E7 программно завершены. S6 — Verify/Build в TwinCAT (Вадим, вопрос 75: кто делает Verify) и исправления по результатам.
