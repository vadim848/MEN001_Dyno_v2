# Iteration06 Phase A — actual-code tests ready, RED baseline

2026-10-19. Только новый current-door-interlock.test.js и отчёт. SAL/runtime,
существующие oracle и timer values не изменялись этим этапом. Новый oracle
соответствует latest D-DOOR-INTERLOCK: DoorMonitor только в существующих
unlock conditions; energy producer guard должен читать оба InterLock NC.

Targeted запуск35 tests:23 PASS /12 FAIL /0 skipped. Подробные реальные
observations, SHA SAL/runtime/test и clockContract сохранены в
06_DOOR_RED_BASELINE.json. Clock — observed-fixed-scan-v1; SAL SHA
6ed0c79094a2530be3ab9323abb832d88e56d60c9bb19773f03a32367b6d7ad5.

- Полная16-строчная component таблица Door×NC1×NC2×FalseSI2 даёт4FAIL:
  DoorFALSE с обоими NC TRUE ошибочно запрещает, а DoorTRUE с отсутствующим
  одним/двумя NC ошибочно разрешает upstream producer.
- Обе реальные R&D up цепочки — physical BOTH и существующие PLC levels —
  по8 сочетаний дают по4FAIL. DoorFALSE+оба NC TRUE не включает HV; при
  DoorTRUE+NC fault final Set gate HV запрещает, однако upstream And4 request
  ошибочно остаётся TRUE. Эти два наблюдения различаются; final guard не
  подменяет требование к upstream producer.
- Emergency/connector/False controls PASS в обоих маршрутах при healthy
  Door. Это перечисленные входы компонента; Mentee05 не выдаётся за покрытый
  этим изолированным route и отдельная политика PLC handshake не придумана.
- Три существующих unlock consumers сравниваются с reviewed04 code и
  проверяются собственными truth tables. Новая energy таблица не подменяет
  старую unlock политику. Safe entry NC-source также проверен при обоих
  значениях Door; это component scope, не полный внешний accepted gesture.

Перед компонентным срезом выполняется fullsource B1 namespace/binding audit.
Модель получает явно заданное исходное R&D состояние, healthy permissions,
нейтральный интервал и существующий physical/PLC producer. Наблюдается реальный
And4→OR18→SetPermit→HV RS, не isolated request-only prototype.

Воспроизведение: `cd SafetyTests; node --test test/current-door-interlock.test.js`.
Это честные новые требования RED до SAL06, не новый регресс timing03C.
Остальной software acceptance baseline не перегенерировался данным этапом.
Готово к review/checkpoint перед фазойB. Запись остановлена; аппаратных
изменений, native Verify/Build/CRC, push или deployment не было.
