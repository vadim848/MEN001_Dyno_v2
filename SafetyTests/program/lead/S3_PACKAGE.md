# Пакет S3 (E3, STOP v2) — gate

Дата: 2026-10-24. Ведущий. Только программная модель стенда: не Verify/Build/Target, не аппаратная безопасность.

## Кандидат

- **E3**: `SafetyTests/candidates/E3/native` — SAL `9ee66e78…`, SGVL `72eade07…`, diagram `9fe9aa7e…`; 260 FB (≤ 512), native CRC valid, структура PASS.
- База: canonical E2 (SAL `67336d9b…`, коммит 44179ce).
- План: `program/architect/E3/PLAN.md` (117d6b4e…). Реализация: `program/editor/E3/IMPLEMENTATION.md`.

## Что сделано

- Run→R&D: SS1 → 2 с → STO → выбег 5 с → Discharge → выдержка 1 с → C2 OFF → C2_FBK OFF → R&D (раньше — всё одновременно).
- Abort StartingRun (зелёная после очистки, потеря LV): сразу STO + Discharge → выдержка → C2 OFF; без SS1/выбега; не возобновляется; конец в R&D с C1 ON (при LV — затем R&D→Safe).
- Потеря Healthy в Run/SS1: немедленный STO, защитный спуск; LV — цепной R&D→Safe с памятью.
- Потеря NC: нормальный спуск продолжается; abort/защитный спуск → Emergency.
- Повторная зелёная в спуске игнорируется; авария в спуске — каждый шаг не позже нормального.
- SafetyFault не строился (E5).

## Результаты

- Каталог E2+E3 на E3 (`program/tester/S1/e3-final-E2E3.tap`): 67 PASS, 0 FAIL, 7 todo (E-08, K-11 Config, H-05 и SafetyFault-части H-02/03/06/07 → E5).
- Весь каталог: 70 PASS, 31 FAIL — только строки E4/E5/E6. Регрессий против canonical E2 нет.
- Мутации: 19/19 убиты (M-01…M-12, M-B1/B2, M-T1…T5).
- Ревью (одно): `program/reviewer/S3/REVIEW.md` — код ACCEPT; 5 пробелов тестов (T1–T5) закрыты.
- Стенд: самопроверки 53/53 (BOOT preflight переведён на замороженный F1-fixture).

## Решения команды (к сведению, D-AUTO-PROCEED)

- **Q-E3-1**: нет Unlock в StartingRun и во время его abort (как в E2/F1; Q-ARCH-10 — устойчивый R&D).
- **A-E3-1**: выдержка разряда HV перед C2 OFF = 1 с (как фактическая выдержка reference). Если нужно иное — меняется один таймер.
- **D-03**: конец abort = C2 OFF ∧ C2_FBK OFF ∧ STO (TD-14).
- Допущение тестов A12: `out_SS1_DRx` FALSE = SS1 запрошен (как STO_DRx).
