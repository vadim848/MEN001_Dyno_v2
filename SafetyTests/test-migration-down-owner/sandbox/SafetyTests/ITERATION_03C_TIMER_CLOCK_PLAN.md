# 03C — READY к независимому ревью: единый observed-edge clock стенда

2026-10-19. Малый пакет достоверности timing oracle, независимо от SAL03B.
Меняется адаптер/тестовая хронология, рабочий SAL/SGVL и timer parameters
НЕ меняются. Не заявлять исправление реальной кнопочной логики этим пакетом.

## Причина и договор модели

Сейчас TON и EStop сразу прибавляют dt в первом sample, увидевшем событие.
Старые runFor tests считали это interval-duration convention. Однако03A/03B
границы измеряются от observed first edge; его нельзя одновременно считать
началом elapsed0 и уже прошедшимdt. Независимые traces подтвердили смещение.
Документированный nominal delay начинается с изменения входа; выбирается
одна операционная модель observed samples, не утверждение о native firmware
или точности оборудования.

Current software timing model: фиксированный шаг scanMs на один сценарий;
edge timestamp = sample time, впервые наблюдающий изменение. Один scan
снимает входы/исполняет блоки в общем порядке, вычисляет состояние на данном
timestamp. Первый наблюдённый активный вход таймера имеет age0. Передача
второй кнопки в sample с timestamp first+delta не добавляет лишний dt.
Не смешивать эту модель с произвольным jump249→251 и требовать непредставимую
границу250 на пропущенном sample; это другой scope, не physical validation.

## Конкретное изменение адаптера

1. TON memory дополнить previousEnabled. На enabledFALSE: elapsed0,
   previousEnabledFALSE. Первый enabledTRUE послеFALSE: elapsed0;
   subsequentTRUE: previousElapsed+dt. Out=enabled && elapsed>=configured.
   Held TRUE не пересоздаёт edge. Прерывание сбрасывает полностью.
2. EStop current enabled/restart semantics не менять. Если current enabled:
   offElapsed0, delayedTRUE. Первый previous.enabledTRUE→enabledFALSE:
   offElapsed0, delayed сохраняет previous.delayed. Subsequent disabled:
   offElapsed+=dt; delayed=previous.delayed && elapsed<configuredDelay.
   Startup без прежнего enabled никогда не создаёт delayedTRUE. Новый
   действительный restart снова устанавливает enabled/delayed TRUE, elapsed0.
   Ошибки/EDM/group lifecycle не реализовывать как часть этого пакета.
3. Применить единообразно к ВСЕМ этим блокам в модели, без специальных
   имён/250мс ветвей, без параметра251, без SAL-specific adapter bypass.
   Если другой runtime/legacy mode оставляется для исторического сравнения,
   назвать его явно legacy-interval и НЕ применять для current acceptance;
   предпочтительно одна current модель плюс честно обновлённые timelines.

## Сценарный scheduler

Добавить переиспользуемый test helper с integer sample index/time. Вначале
наблюсти первую кнопку отдельным scan и сохранить firstObservedTime.
Затем для second delta: advance delta-scanMs, set second, scan(scanMs).
Проверить автоматически, что recorded secondTime-firstTime == delta.
Не вызывать scan только ради чтения out: get/read не двигает время.
Не делать runFor(delta)+extra second scan и маркировать лишний scan какdelta.

Fixed scans:1/2/5/10мс.250,500,1000,2000 кратны каждому. Для1мс проверять
249/250/251; для2мс248/250/252;5мс245/250/255;10мс240/250/260. Exact249/251
на сетке10мс не обещать. Partial-duration step, меняющий последнееdt,
не использовать для current native graph timing oracle. Иной runFor helper
может остаться для generic traces с явно иной областью, не скрывая sampling.

## Проверки перед приёмкой

- Независимые TON sample traces для0.5/1/2с и всех configured current TON:
  first edge age0, last representable sample before threshold FALSE,
  exact threshold TRUE, held TRUE, interruption→0, полный новый отсчёт.
- EStop250 и существующий100: actual Restart high/falling arming sequence,
  loss first sample age0, immediate outputFALSE, delayed остаётсяTRUE до
  threshold, наthresholdFALSE; safe input restoration без reset не включает;
  новый valid reset даёт новый off-delay. Startup не создаёт ложного окна.
- BEFORE-helper observation на первых loss-relative timestamps:
  fixed1мс249TRUE/250TRUE/251FALSE; аналогичные nearest-grid before/at/after
  на2/5/10мс. AFTER-helper наexactthresholdFALSE. Параметр250 неизменён.
- Связанный causal trace для03B StartG/StartB→window.EStopIn1, а не только
  ручная инъекция уже готового helper output. Prepare→Ready и первичная
  кнопка датируются отдельно; window age измеряется от фактического sample
  loss в helper. Если recognition и helper loss разошлись из-за ordering,
  это ошибка графа, а не повод сдвигать scheduler.
- Существующие03A single499/500/both999/1000 и late300/500/600 получают
  ровно те же нормативные ожидания, но явный observed-edge scheduler.
  Actual SAL может остаться FAIL — не заменять его прототипом.
- Положительные/отрицательные тесты фиксированной chronology различают
  legacy first-sample charging и новую модель; не только зеркалят строку кода.

## Миграция исторических проверок и отчёт

Historical SAL fixtures, source SHA и ожидаемые качественные defect/control
утверждения сохранить. Численные checkpoints/scan counts обновлять лишь с
описанным переводом interval→observed convention: первый sample зарегистрирован
отдельно, delay измерен от него. Не прибавлять произвольные задержки доPASS.
В отчёте таблица affected test/scenario, old clock convention, new timestamps,
почему тот же смысл; новый failure анализировать, не удалять/skip/переименовывать
в PASS. Матрицы результатов перегенерировать с новым model contract/version;
прежние baseline reports остаются историческими фактами прежней модели.

Full package: harness/historical/current, mutations и B1 structural tests;
полный npm run check:software, список расхождений с предыдущим запуском.
Независимое ревью проверяет parameter/source invariance и сохранённые negative
oracle. Native/hardware validation не gate, текущая fixed-scan model assumption
явно в каждом timing report. После ACCEPT03C можно вновь ревьюить03B с той же
сеткой; arbitrary-step exactness не объявлять доказанной.
