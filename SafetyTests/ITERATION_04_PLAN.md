# Iteration04 — READY: актуальный HV Set permission

Архитектор, 2026-10-19. Выполнять после закрытия B1 независимым ревью.
Малый независимый пакет EMG-011, не зависит от полного recognizer03B.
Прочитаны актуальные решения; ordinary DoorMonitor сохраняется, отдельный
locked feedback отложен. Здесь ни DoorMonitor, ни StartingRun не меняются.

## Основание и точная причина

Унаследованный Network5 LV/HV producer сохранён из reference; новая v2
R&D ветвь также пишет HV request. Network1/FBOr18 order175 объединяет
b_Set_HV_C2, второй существующий route и b_Set_HV_C2_1; его результат
потребляет HV Network1/FBRs2 order5 СЛЕДУЮЩЕГО скана. Как до iteration02
для LV, stale TRUE может включить HV в первом скане аварии прежде поздней
переоценки producer. EMG-011 однозначно запрещает это новое повышение.
Не обнулять уже включённый HV: порядок разряда/Reset сохраняется.

## Точный маленький diff рабочего SAL

Проверить current ordering перед записью (после B1 порядок не менялся):
LV currentPermit2, LV SetPermit3, LV RS4, HV RS5, HV OR18=175.

1. Добавить в Network1 safeAnd `FBAndHvSetPermit` order5, два активных
   прямых входа: AndIn1 ← Network1/FBOr18/OrOut;
   AndIn2 ← Network1/FBAndLvCurrentPermit/AndOut. Остальные деактивированы.
   Клонировать правильные native containers AND, все новые GUID уникальны.
2. Перенаправить единственный прежний FBOr18→FBRs2/Set wire на
   FBAndHvSetPermit/AndIn1, сохранив существующие три inputs OR18.
3. Дописать второй output-side wiredLink currentPermit→HvSetPermit/AndIn2.
   Прежний currentPermit→LvSetPermit/AndIn2 сохранить. Новый HvSetPermit
   output→FBRs2/Set. Каждая пара ровно один wiredLink; bare refs запрещены.
4. Сдвинуть прежние orders>=5 на+1: HV RS6, OR18=176, finalunlock209;
   старые1..4 неизменны, относительный порядок всех старых блоков сохранён.
   Native port names/indices брать из existing AND, GUID не копировать.

Новых globals/alias variables/SGVL usage не нужно: только direct wires к
уже исправленному B1 currentPermit. Его восемь условий НЕ менять:
EStopOK, NC1/2, extNC1/2, LV/HVconnectors, !PLCstop. Mentee этим пакетом не
объявляется покрытым. Все source/consumer binding role-chain валидны до
functional execution; проверять полную SAL/SGVL, потом scoped subgraph.

## Приёмка actual SAL, без сканового ожидания

- Structural validator PASS, sole incoming HV RS.Set=newgate, OR18→oldSet
  обхода нет. Exact3new/retarget logical edges, oldinputs/polarities/timers,
  alias descriptors и SGVL неизменны. Orders1..209; relative order сохранён.
- Paired stale-positive trace: real inherited producer либо R&D producer
  устанавливает real OR18 TRUE, HV latch ещё FALSE. В следующем scan без
  fault HV TRUE; при тех же preceding states и одном текущем fault HV FALSE
  уже в ПЕРВОМ scan. Повторить NC1,NC2,ext1/2,connectors1/2,PLC,EStopOK.
  Для EStopOKFALSE с rawhealthy не допускать нового Set до прежнего restart.
- Проверить обе группы writers: Network5 b_Set_HV_C2 и Network12
  b_Set_HV_C2_1. Существующий третий route inventory не обрезать. Positive
  controls реально поднимают out_HV_C2 через OR/gate/RS; внутренние injections
  отмечать scoped и не выдавать за принятие полного внешнего жеста.
- HV уже TRUE, Reset явно FALSE в компонентном тесте: запрет Set оставляет
  TRUE. В полном fault scenario существующий Reset может сработать, тест не
  должен запрещать аварийный процесс. Discharge/C2 sequence не менять.
- Прогнать regression01/02/B1 и03A, полный npm run check:software. Метаданные
  hardcoded finalgate208→209 обновить, не удалить assertions. Сценарии current
  должны включить existingPermit+newgate после full structural validation.
- Независимое ревью diff, новых native wire roles и paired firstscan traces.

Приёмка узкая: отсутствие нового HV Set при перечисленных текущих fault
inputs. Остаточные Mentee/recognizer/state/owner требования и все41ID не
скрывать. Исходные accepted request levels, TON3feedback и shared R&D HV
fanout сохраняются побайтно кроме механического order+1. Hardware/native
Verify/Build/CRC вне scope; результаты host не называть native verification.

Файлы редактора: рабочий SAL, targeted actual SAL tests, metadata assertions
и результаты программного пакета. Исторические fixture/reference только читать.
