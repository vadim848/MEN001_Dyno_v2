# Iteration07 Phase A — Unlock EStop/PLC RED baseline

2026-10-19. Только новые actual-code tests и report; SAL, SGVL, runtime,
существующие oracle и параметры не менялись. База после05 SAL
ea2443b0ea92f95584496360e103f4f9a8b5fd61bb2f492f88a9a9d60628564e.
Clock observed-fixed-scan-v1, подробные observations/SHA сохранены в
07_UNLOCK_RED_BASELINE.json.

Targeted28 tests:17 PASS /11 FAIL /0 skipped, exit1.

- Два actual healthy controls Safe/R&D PASS. Реальный FBAnd1/FBEstop1
  проходит manualRestart high→fall; реальный grant producer и grant latch
  после квалифицированной blue дают конечный UnlockTRUE.
- Шесть first-fault/recovery scenarios FAIL: Safe/R&D × NC1-held, PLC-held,
  PLC-single-sample. Assert отдельно подтверждает правильную причинную цепь:
  NC1 сразу снимает EStopOK; PLC first fault sample ещё имеет TRUE EStopOK
  из stale healthy FBAnd1, хотя rawPLC уже TRUE. Следующий sample читает
  сохранённый fault и защёлкивает OFF даже при восстановленном raw.
  Конечный Unlock остаётся TRUE в старом коде: records firstfault/restored/
  laterwithoutRestart сохраняются, ожидание100мс не заменяет первый sample.
- Полная16-строчная component таблица blue×green×EStopOK×rawPLC даёт3FAIL:
  существующий final writer игнорирует EStopOKFALSE/PLCstopTRUE.
- Два structural FAIL: существующие AndIn4/5 ещё не имеют требуемых
  global SGVL/index и inverted native PLC alias bindings.
- Component healthy grant при отсутствующих energy connectors/InterLocks
  PASS: сюда не добавляется новый access ban из общего energy currentPermit.
  Сохранены blue/green exclusion, три Door solenoid consumers и inactive
  main EStopIn2/4; новые NC2/Mentee emergency выводы не придумываются.

Fullsource B1 audit выполняется до subgraph. Исходные Safe/R&D state inputs
заданы как компонентная граница; реально исполняются grant, Restart/EStop и
sole output writer. Это не полная reachability/recovery/все EMG-007 proof.
Повторный полный операторский recovery gesture не назначается новым oracle.

Воспроизведение: `cd SafetyTests; node --test test/current-unlock-estop-permit.test.js`.
Общий принятый software baseline этим этапом не перегенерирован. Готово к
review/checkpoint до SAL PhaseB; запись остановлена. Аппаратных изменений,
native Verify/Build/CRC, push или deployment не выполнялось.
