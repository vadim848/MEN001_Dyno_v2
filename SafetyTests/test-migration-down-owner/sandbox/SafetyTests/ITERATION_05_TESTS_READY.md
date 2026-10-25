# Iteration05 Phase A — Mentee Set permission RED baseline

2026-10-19. Только новые tests/report; SAL, runtime, существующие oracle,
таймеры и аппаратные привязки не менялись. База — reviewed06 финальный SAL
SHA23cb1dd91d983b309294936fa8563cf9d669427401d38337c6b3c9647875adf2.
Clock observed-fixed-scan-v1; SHA источников и наблюдения сохранены в
05_MENTEE_RED_BASELINE.json. Ноль новых production blocks требуется планом.

Targeted15 tests:9 PASS /6 FAIL /0 skipped, exit1.

- Четыре paired first-scan FAIL при MenteeTRUE: LV legacy Network5,
  LV Step12, HV legacy Network5, HV R&D Network12. Реальные producers сначала
  формируют положительный OR aggregate при ещё FALSE latch. Только перед
  следующим scan Mentee становится TRUE, но current Set всё равно поднимает
  output. Идентичные четыре MenteeFALSE controls PASS и реально включают
  outputs: это не проверка injected new-gate output.
- Два structural FAIL: третий вход LV/HV Set gates ещё не активирован и не
  имеет требуемого inverted native alias binding. Будущая реализация обязана
  использовать SAL targetUsages, не фиктивный GVL1 global reference.
- PASS сохранения latched LV/HV при ResetFALSE: новый Set запрет не должен
  принудительно обнулять уже включённую энергию.
- PASS всех восьми существующих current permission controls для LV и HV.
- PASS прежних четырёх Mentee consumers, alias descriptor/source, Safe/Run
  inverted guards и их truth tables. Main EStopIn4 остаётся Both Deactivated;
  его активация и новое требование EStopOKFALSE не вводятся.

Fullsource B1 audit выполняется до component cuts. Заданные исходные
Step2/Step12/R&D и healthy feedback/permissions являются scoped boundaries,
не доказательством внешнего launch handshake или достижимости всех фаз.
Non-Run emergency destination/recovery/discharge этим пакетом не определяются.

Воспроизведение: `cd SafetyTests; node --test test/current-mentee-set-permit.test.js`.
Новый red baseline не является изменением принятого software отчёта
166PASS/35FAIL/5NV; общий пакет этой фазой не перегенерировался. Готово к
review/checkpoint до SAL PhaseB; запись остановлена. Push/deployment,
native Verify/Build/CRC и hardware validation не выполнялись.
