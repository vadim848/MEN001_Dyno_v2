# Iteration07 r2 — конечный Unlock с EStopOK и текущим PLCstop

2026-10-19. Tests-first checkpointd86925a после reviewed05.
SAL до:ea2443b0ea92f95584496360e103f4f9a8b5fd61bb2f492f88a9a9d60628564e.
После:bf110ab452a5d9d3fcafd1acc5ab657b993e3e2828f384a63c1491c57b2cdcc6.
SGVL после:508610b92e60ae602a75952113b34f7a8bd9c3f283fbb93dfa45b6a532f0a3ba.

## Минимальный source diff

В существующем FBAndUnlockHold активирован AndIn4 с прямым настоящим
GVL1.b_EStop_Ok через правильную global wrapper chain. В existing SGVL
variable добавлен ровно один TargetUsage с ModelElementId порта. AndIn5
активирован с инверсией обычного SAL alias in_Estop_PLC и одним новым proper
alias target usage. Новых declarations, globals или аппаратных mappings нет.

Unlock=oldGrantLatch AND blue AND NOT green AND EStopOK AND NOT rawPLCstop.
Прежние три входа, grant latch/Set/Reset, Door06 и Mentee05 guards сохранены.
Реальный порядок MainEStop21→PLCguard95→final209 не менялся: EStopOK сам
по себе не закрывал первый PLC fault sample со stale healthy And1. Текущий
rawPLC снимает finalUnlock в этом sample; EStopOK сохраняет запрет после
возврата raw без подготовленного ручного Restart.

Ноль новых blocks,209orders/все TON неизменны. SAL+17/−2 строк, SGVL+3/−0;
git diff --check PASS. SGVL изменение ограничено usage index; declarations
и все прочие indices сравниваются строго с прежними checkpoints. Source
alias descriptors и все прежние consumers сохранены.

## Проверки

Те же28 phaseA tests:17PASS/11FAIL до source diff, теперь28PASS.
Safe и R&D actual grant producers получают настоящий manual Restart high→fall.
Healthy paired control выдаёт UnlockTRUE. В первом NC1 fault sample EStopOK
FALSE; в первом PLC fault sample EStopOK ещё TRUE из stale And1, но final
Unlock уже FALSE. Односэмпловый PLCpulse восстанавливает raw, следующий
реальный EStop sample видит faulty And1 и остаётся OFF без нового Restart.
Все три samples firstfault/restored/laterбезRestart проверены отдельно.

Component16rows проверяют blue/green/EStopOK/rawPLC, no-energy-extra-ban
positive подтверждает отсутствие нового connector/InterLock currentPermit
в final gate. Native binding tests требуют ровно пять active inputs,
правильный SGVL GUID/resolved path/TargetUsage и один inverted PLC alias.
B1 fullsource namespace/relationship audit выполняется до component selection.

Старые scoped grant tests теперь явно задают healthy EStopOKTRUE/PLCstopFALSE:
это новая разрешающая граница компонента, а не ослабление fault oracle.
Actual fault tests используют реальные EStop/PLC producers, не подставляют
EStopOKFALSE. Exact B1 delta metadata допускает только дополнительный PLC
consumer и дополнительный SGVLTargetUsage. Прежние три Door consumers,
old Safe/Run защитные пути, inactive EStopIn2/4 и Set guards сохранены.

Targeted Unlock07+B1+CVR+HVmetadata57/57PASS. Full npm run check:software:

- harness174/174; historical75/75; current112/112.
- cases172PASS /29FAIL /5NOT VERIFIED /0ERROR, exit1.
- Ровно два existing FAIL→PASS: ACC-C01-E-Step1 и ACC-C01-E-Step_RnD.
  Других status changes и новых FAIL нет.

Standalone candidate22PASS/25FAIL/5NV обновлён; оба основных отчёта содержат
актуальные SAL и SGVL SHA и прежний observed-fixed-scan-v1 clock contract.
07_UNLOCK_RED_BASELINE.json сохранён неизменным как tests-first evidence.

## Пределы

Это узкий запрет Unlock для NC1/PLC EStop, не полное закрытие EMG-007.
NC2/Mentee через деактивированные EStop порты не объявляются новыми реакциями.
Полный state lifecycle/все transition phases/опасная энергия и повторный
операторский recovery требуют дальнейшего покрытия; оставшиеся FAIL/NV видимы.
Не добавлялся energyPermit запрет доступа при отсутствующем connector в Safe.

Recorded SAL/SGVL CRC872783435/1640101759 не объявляются regenerated.
Runtime, reference, historical fixture, hardware и .sal.diagram не менялись.
Verify/Build/native/hardware validation, deployment и push не выполнялись.
Готово к независимому ревью; запись остановлена.
