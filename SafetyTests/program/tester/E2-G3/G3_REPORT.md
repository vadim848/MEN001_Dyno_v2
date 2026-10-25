# G3 REPORT — E2: независимая проверка стека кандидатов F1 → R1 → E2a-core → E2a-RC → E2b → E2c → E2d (v2-tester)

Срез / роль / дата: E2 G3-pre на замороженном снимке тестов G1 v8 / v2-tester / 2026-10-22…23.

**Итог в одном абзаце.**
- Delta по всей цепочке на плане 4a215579 — PASS.
- Регресс F1 воспроизводит baseline v8 точно.
- На E2a-core / E2a-RC / E2b / E2c необъяснённых содержательных FAIL логики немного (§2.2 г). Большая часть FAIL — известные (KF, E3/E5/E6), позднего среза, N18/N19, пины F1.
- Известные дефекты кандидатов:
  - K-1 — с E2b;
  - K-2/K-2b — с E2c, регрессия относительно E2b, fixed in v7.6.
- **G3 по правилу мутаций не пройден:**
  - 16 выживших guard-мутантов (E2a 3, E2a-RC 1, E2b 8, E2c 3, E2d v7.5 1);
  - 11 из них убиваются минимальными сценариями из требований, то есть это пробелы покрытия G1 v8. У M-E2b-16 расхождение только в стадии под Emergency;
  - M-E2b-46 убит на стеке E2d (E2d-only по плану);
  - M-E2a-28/29 объяснимы (убиты на E2b);
  - для M-E2b-48/49 убийца не найден.
- pending v9 — 0.
- M-E2d-23 — killed by frozen mutant source.

Объём по указанию ведущего: E2a-core, E2a-RC, E2b, E2c — финальный G3 на снимке v8. **E2d v7.5 (2276d773) — предварительный прогон: superseded by v7.6, re-run required.** E2d v7.6 (e4cf767e…) не проверялся: финальный G3 на нём — после ACCEPT G1 v9, на тестах v9; мутации M-E2d-24…33 тоже тогда.

Материалы редактора (program/editor/**) не читались. Исключение: в HANDOFF редакторов сверены только хеши (grep по 12-значным префиксам SHA).

## Источник

| | SAL | SGVL | diagram |
|---|---|---|---|
| canonical F1 (= candidates/resumed-f1) | 04b45456ae1c64fc… | dc103abed49fd1c3… | de02bbffee8d7074… |
| R1 candidates/E2-R1 | ca841a01fe44f776… | 4f205138337ea3de… | b82aa41a6ee06526… |
| E2a-core candidates/E2a | 5648e31cec9fea6d… | e60698840e556dbd… | 27d7f20d890d48fc… |
| E2a-RC candidates/E2a-RC | 5733552a150bfd33… | 253de7f39f2c4af8… | 5fa9423843520338… |
| E2b candidates/E2b | 4f933433c4dcb6a4… | 7ae241165ec0321b… | a413ca1f1ebfcaa7… |
| E2c candidates/E2c | ee8439ae2a58c4e5… | 281c9597365fb745… | 66f94c13b187a9d0… |
| E2d v7.5 (предв.) candidates/E2d | 2276d7739ad958c5… | 140806334cf75134… | 94e9b231cef30cf5… |
| E2d-v7.4.1 (замороженный мутант-источник M-E2d-23) | a5acf29175b041d2… | 140806334cf75134… | c5b28c07070559b7… |

- Полные SHA256: `hashes/candidates.sha256`, `hashes/sources.sha256`.
- **Все SAL совпадают с PLAN.json 4a215579… (план v7.5).** SGVL и diagram совпадают с HANDOFF редакторов. STOP не потребовался.
- План на старте: PLAN.json 4a2155790477…; сейчас его копия лежит как PLAN.v7_5.json. Во время работы архитектор обновил PLAN.json до 13a3bfbc…, затем до e5397b73… (v7.6). Delta и мутации выполнены по стартовому плану.
- Планы мутаций на старте: E2a 1110aa8f…, E2a-RC 925bdfea…, E2b 59cb26c9… (позже стал MUTATION_PLAN_E2b.v7_5.json; текущий 088cce49… изменён в M-E2b-42/43/47/48), E2c f7fabd98…, E2d 6e73b11d… (позже v7_5). Копии для G3: `mutation-plans/PLAN_<план>_on_<кандидат>.json`. Изменены только два поля: `sourceSha256` (вместо FILL_AT_G2) и `testFiles` (все 28 файлов current-e2* снимка — надмножество 21 файла плана). Сравнение с v7_5: мутации идентичны.

### Снимок тестов (замороженный G1 v8)
- Снят в 2026-10-22T09:51:20+03:00 в `snapshot/` (test, src, scripts, package.json, корневые JSON/MD — `snapshot/root-files`).
- Сверка с `reviewer/E2-G1-v8/repro/v8-test-snapshot.sha256` (111 файлов): на момент снятия 8 файлов уже были изменены тестировщиком v9. Список: current-door-interlock, current-e2a-emg-anchor, current-e2b-cover-transitions, current-e2b-rel01-e2, current-e2d-fbk-unsolicited, current-e2d-first-fault-scan, helpers/e2-emergency, helpers/e2-rule-l.
  - **Все 8 восстановлены по точному SHA256** из прежних scratch-копий v8 той же сессии (c-E2-R1/…, v72-rerun-sb/e2b-v72/…).
  - Версии v9 на момент старта сохранены в `snapshot/v9-at-start/` (не используются).
  - Итог: 111/111 OK. Фикстура `helpers/e2-ref-4495a1f/GVL1.sgvl` (8020e3d6…, SHA закреплён в v8 e2-lifecycle.js) есть в снимке.
- **Предел:** src/ и scripts/ в манифест v8 не входят. Снимок — их состояние на 09:51. Хеши: `hashes/snapshot-src-scripts.sha256` (sha этого файла 46357b63…). Тесты: `hashes/snapshot-test-final.sha256` (6b24824b…).
- Прогоны шли в изолированном корне вне репозитория (scratchpad `g3/froot` → `g3/roots/<id>`). Корень = closure стенда (createSandbox), test/src/scripts заменены снимком, тройка SAL/SGVL/diagram подменена кандидатом. В test/, src/, scripts/, candidates/ репозитория ничего не писалось.
- **Дрейф стенда:** fixtures/ и корневые JSON взяты из рабочего дерева на старте. В них expected-deltas F1 уже содержит 8 одобренных переименований v8 (33 записи). Поэтому harness-тест v8 «D2: committed expected-deltas … 25» падает (33 ≠ 25) на всех корнях. Это не SAL.

## 1. Delta (e2-delta-check)

Команда (из SafetyTests, скрипт из снимка, план стартовый):
```
node program/tester/E2-G3/snapshot/scripts/e2-delta-check.mjs --plan program/architect/E2-status/PLAN.json(=4a215579, ныне PLAN.v7_5.json) --out <scratch>/E2_DELTA_CHECK.json \
  --chain F1=candidates/resumed-f1/native R1=candidates/E2-R1/native E2a-core=candidates/E2a/native E2a-RC=candidates/E2a-RC/native \
          E2b=candidates/E2b/native E2c=candidates/E2c/native E2d=candidates/E2d/native
```
Результат: **E2-DELTA PASS — R1, E2a-core, E2a-RC, E2b, E2c, E2d все PASS**, 0 FAIL, 0 NV. Отчёт: `delta/E2_DELTA_CHECK.json`, лог `delta/e2-delta.log`.
- Пара E2c→E2d проверена на плане 4a215579. Ведущий предупредил: на 13a3bfbc… она ожидаемо падает на пунктах v7.6. Повторно я её не запускал.
- **M-E2d-23, условие 3 (точная дельта E2d-v7.4.1 → E2d = v7.5):**
  - нативный diff (`delta/E2d741_to_E2d.native-diff.json`, инструмент `tools/v75diff.mjs` на src/native-delta-*.mjs снимка) — ровно 4 block-removed (N12/FBAnd8/9/10, FBOrFbk10C2), 6 salusage-removed, 4 wire-removed, FBOr1.OrIn2 Activated NC → Deactivated; ничего не добавлено;
  - счётчики 230/1953/293 → 226/1917/289; 79 SAL, 63 SGVL, 182 globalRefs без изменений;
  - orderOfExecution перенумерован, относительный порядок 226 сохранённых блоков идентичен (`delta/E2d741_to_E2d.relorder.txt`);
  - **совпадает с PLAN slices[E2d].rationale.v75.declaredDelta.vsFrozenE2dV741.**

## 2. Регресс (эквивалент check:software, тесты снимка)

Команда на каждый корень: `cd <root>/SafetyTests && node scripts/software-check.js` (`tools/run-reg.sh`). Вывод: `regression/check-software.<id>.out`. Поскановые результаты: `regression/<id>.jsonl`. Матрица статусов по всем корням: `regression/matrix.json`. Классификация: `regression/classification.json` (`classify.cjs`). Exit software-check = 3 на всех корнях: harness ERROR, см. ниже.

| корень | harness | current (tests/pass/fail/skip) | SAL cases P/F/NV/ERR/NA | E2 норм. P/F/ERR/NV | DIAG P | KF P/F/NV | вне E2 P/F/NV/SKIP |
|---|---|---|---|---|---|---|---|
| F1 | 283/284 | 1484/597/839/0 | 199/1/7/0/0 | 94/794/2/48 | 39 | 0/22/0 | 464/21/0/0 |
| R1 | 260/268 | 1484/477/916/42 | 177/0/5/4/16 | 94/794/2/48 | 39 | 0/22/0 | 344/98/1/42 |
| E2a-core | 260/268 | 1484/586/735/42 | 176/1/5/4/16 | 201/492/125/120 | 39 | 2/20/0 | 344/98/1/42 |
| E2a-RC | 268/276 | 1484/612/686/42 | 178/1/5/4/16 | 229/441/125/143 | 39 | 0/22/0 | 344/98/1/42 |
| E2b | 268/276 | 1484/812/432/42 | 177/2/5/4/16 | 474/267/0/197 | 39 | 0/22/0 | 299/143/1/42 |
| E2c | 268/276 | 1484/811/416/42 | 177/2/5/4/16 | 473/251/0/214 | 39 | 0/22/0 | 299/143/1/42 |
| E2d v7.5 (предв.) | 268/276 | 1484/859/359/42 | 173/6/5/4/16 | 515/201/0/222 | 39 | 7/14/1 | 298/144/1/42 |
| E2d-v7.4.1 (справка) | 268/276 | 1484/866/353/42 | 173/6/5/4/16 | 526/190/0/222 | 39 | 0/22/0 | 301/141/1/42 |

- **F1 воспроизводит baseline v8 точно:** current 1484/597/839; E2 норм. 94 PASS / 796 FAIL (= 794 + 2 ERROR TD-09) / 48 NV; KF 22; вне E2 21 fail. Снимок признан эквивалентным v8.
- **Harness:**
  - F1 — 1 fail: D2 expected-deltas 33 ≠ 25, дрейф fixtures (см. выше);
  - кандидаты — 8 fail: тот же D2 и 7 тестов BOOT preflight / «Software package … explicit assumptions». Они закреплены за источником F1 (BOOT_PREFLIGHT_SOURCE_MANIFEST, E7). Это не поведение.
- **SAL cases:**
  - STATE:Safe-RnD-Run / Emergency-removal / conflicting-set-requests дают ERROR INJECTION_POINT_MISSING: инъекции старого механизма, R1 их снял;
  - STATE:Run-RnD FAIL: семантика инъекции b_Step12_Set_2 в кольце R1;
  - BOOT:SOURCE_REJECTED: preflight F1, E7;
  - ESTOP:restart-fault-recovery FAIL с E2b: изолированный компонент N1/FBAnd1 + FBEstop1. В нём новые входы FBAnd1.AndIn3/4 (E2b) не заданы. Поведенческий аналог EMG6-01 Restart на E2b — PASS;
  - на E2d ещё PRIORITY:Step12:ExternalNC1/2 ×4: устаревший oracle стенда против V14-Q7 / D-E2d-1, HANDOFF_v8 «остаток» п.2.
  - **Все эти кейсы — стенд, не адаптированный к R1/E2b. Передать v2-stand-engineer.** Как FAIL логики они не засчитаны.

### 2.1 Итог по кандидатам (только FAIL; классы: а — известный и объяснённый, б — superseded by Q76, в — blocked by G1 v8 N18/N19/TD-14, г — необъяснённый или открытый, L — норма более позднего среза, S — структурный пин F1)

| кандидат | а | б | в | г | L | S | вердикт G3 (на снимке v8) |
|---|---|---|---|---|---|---|---|
| E2a-core | 465 | 0 | 27 | 0 | 164 | 79 | FAIL только известные / позднего среза / структурные. Классификация грубая, по семействам (см. пределы) |
| E2a-RC | 470 | 0 | 30 | 0 | 107 | 79 | то же |
| E2b | 146 | 0 | 36 | 30 | 96 | 124 | открыто: г = 30 (все с атрибуцией к стимулу или стенду, без доказанного дефекта); K-1 есть уже на E2b |
| E2c | 155 | 0 | 36 | 38 | 63 | 124 | открыто: K-1, K-2, K-2b — known, fixed in E2d v7.6; г = 38, из них 8 без атрибуции |
| E2d v7.5 | 138 | 19 | 36 | 37 | 4 | 125 | **предварительно, superseded by v7.6, re-run required** |

### 2.2 Классификация FAIL

**(а) известные и объяснённые** (правила `classify.cjs`, по каждому тесту — `classification.json`):
- **KF-1…KF-4** (план E2d knownFail, G1 v7/v8 §3, до E4/E5/E6). FBK-10 k3/k4/K3-ACK, D5-2 «until E5/E6». HLT-03 SafetyFault — E2c knownFail «until E5». FBK-06-W откат по окну — WDG-01, E6. RC-7/FBK-01 «потеря FBK после окна → Emergency» — E2a-RC knownFail Q-RC-19, E6.
- **EARLYSTO 16 и rnd-down 2** — как в v8. **D-E2d-1** (MENTEE05/step12 Step12 NC) до E2d; на E2d PASS.
- **EMG-RD-L / Run-down: 27 на E2b…E2d** — честный RED до E3 (E2-v73-q §1.4, HANDOFF_v8).
- **TD-10 RED: 12** — L1-SU: C1 OFF +2003 против +2005; IL-05a-A и COV-1: эталон in_Estop_PLC в SU, Discharge +7006 против +7010. Это вопросы 1–2 HANDOFF_v8 аналитику.
- **ERROR stand: 125 на E2a-core/E2a-RC** — маркер TD-08/09 (`linkRunDownOwner` / `recRndC_SU`) появляется только в E2b.
- **E2a-core knownFail «Emergency/energy outside Run — до E2b»** на E2a-core/E2a-RC. Классифицировано по семейству имён.
- **K-1** — приём жеста при эпизоде [f−300, f+10), REL01-e2 Safe ×3 + R&D ×3. **Есть уже на E2b**: 3 теста PASS на E2a-RC и FAIL с E2b. По указанию ведущего: known, fixed in E2d v7.6. **Отдельно: K-1 — регрессия относительно E2a-RC, внесённая в E2b.**
- **K-2 / K-2b** (WDG-02, MOD-001, CVR-001) на E2c и E2d v7.5 — known candidate defect E2c (HLT_LV не учитывает стадию, GATE_030.OrIn6), fixed in E2d v7.6 (V76-D).
  - В регрессе: 6 тестов PASS на E2b → FAIL на E2c, плюс FBK-06-NEG/POS (RED K-2, а не покрытие).
  - **Регрессия относительно E2b. На E2b и раньше K-2 нет** (независимая проверка ниже).

**(б) superseded by Q76 «Б», v9** (только E2d v7.5, 19 тестов):
- DOOR06 existing-PLC-levels — 3;
- FBK10-PLC-B ×3, FBK10-PLC-REG (2) ×3, KF-5 «after boot» ×3, KF-3-DESC (Run через (1,1) недостижим), FFS legacy (1,1) ×8 — PASS на E2c, FAIL на E2d.
- Это D-V75-1, их меняет v9.

**(в) blocked by G1 v8 N18/N19:**
- N18 — REL01-e2-LATE R&D, 9 тестов (ложный RED: a по b_Step3).
- N19 / TD-14 — FBK-05-W/NEG/POS и сочетания + STP-I, 24 теста.
- Дополнительно по TD-14 §1.4 S2: E2b B51-01 SAFE-NOENERGY ×3. Тест требует «нет скана Safe с C1 ON», а в Safe→R&D основное состояние Safe при C1 ON допустимо. Та же конвенция, передать в v9.

**(г) необъяснённые или открытые — не скрываются:**

| группа | где | факт | атрибуция |
|---|---|---|---|
| DIS-HOLD «Safe after Restart» ×8 | E2b, E2c, E2d | precondition: Restart на e+6100 после ES_NC_1 FALSE 100 мс. Цепочка из R&D доходит до S6 на e+8006 (проба `independent/probe-emg-rnd-chain.mjs`: E2b/E2d S6 +8006, энергия OFF +2004) | вероятно стимул теста (ранний Restart отклоняется по B4-3). Дефект кандидата не доказан → тестировщику v9 |
| B43-02 ×18 | E2b, E2c, E2d | «stand precondition: chain complete, Emergency, FBK OFF before the Restart press» не достигнут при g = e+12000 | условие стенда или теста, не исследовано до конца → v9 / стенд |
| L2/L3 −1/+2 скана ×4 | E2b, E2c, E2d | EMGREF-LV R&D / R&D→Safe / Safe→R&D: C1 OFF +2004 против Run +2005; EMGREF-RUN Run: Discharge +7010 против эталона 4495a1f +7008 | та же природа, что TD-10 (−1 скан). В HANDOFF_v8 для R&D не объяснено → аналитику (вопрос ниже) |
| IL-05d(1) ×2 | E2b, E2c, E2d | предусловие «abort StartingRun» (LV loss / green) не наступает | abort StartingRun — STP-I/STP-006, E3 (knownFail E2c «STP-I until E3»). Отнесено к L, в счёт г не входит |
| E2-02 LV Healthy lost и restored на h+1/h+3 (Q-RC-16) ×2 | E2c, E2d (и раньше) | «R&D then R&D→Safe» не выполнено: остаётся b_Step_RnD | **необъяснено**; HLT-001 — норма E2c |
| HLT-01b R&D с открытой крышкой: LV lost → R&D→Safe ×6 | **E2c** (на E2d-v7.4.1 и E2d — NV/PASS) | остаётся R&D | **необъяснено на E2c**; на E2d исправлено. Возможна связь с K-2 (HLT_LV), не доказана |
| E2d FBK-10 (S1/S2) + in_Estop_PLC: Restart при C1/C2_FBK ON ×2 | E2d (тест E2d; на E2b/E2c тот же факт) | выход из Emergency на +100 после Restart при FBK ON (SPEC §12: остаётся Emergency) | **необъяснено**. Связано с выжившим M-E2b-19 (G10_EXIT.AndIn5): при старте из Safe путь выхода обходит AndIn5? Не доказано → архитектору/редактору |
| E2d FBK-10 (R) + LV Healthy lost → HLT-01 ×1 | E2d | Safe не достигнут за 3000 мс | **необъяснено** |
| E2d FBK10-PLC-REG (1) (1,0) C1_FBK u1+1/u1+250 ×2 | E2d (и раньше) | R&D на u1+599 против нормы u1+601 (TD-02) | **необъяснено** (−2 скана) |

### 2.3 Вне E2
- Пины F1-identity и подграфов F1 (класс S, HANDOFF_v8 «не сделано» п.1):
  - EARLYSTO composed LV254, early-sto «other old producer inactive», f1-lock-and-q500 и safe-run-gestures «Actual ordinary Step2 outputs preparation failed», rnd-compact, hv/step12 LV254, MENTEE05 legacy-Network5, V2ID, UNLOCK07 — с R1;
  - PLCPULSE «Undeclared source cut //Network1/FBOrIlRunOk», R3PAIR, SAFEINPUT GATE_001, SR-SB/SC — с E2b.
- Поведенческое содержание этих пинов на кандидатах закрывают только FFS / EMG6-01. **Маршрут AND6 первого скана и LV legacy Network5 не покрыты ничем** (C5 ревью v8).
- DOOR06 existing-PLC-levels на E2d — класс (б).

## 3. Мутации

**Метод.** Стандартный раннер `scripts/sal-mutation-check.js` прогоняет все testFiles на каждый мутант, около 15 мин × ~100 мутантов. На снимке это неисполнимо в разумное время, а файлы >10 мин упираются в его таймаут. Поэтому применён собственный исполнитель `tools/mutkill.mjs`.
- То же правило убийства, что у стенда (`src/sal-mutation-kill.js` failureClass): тест ok/NV на немутированном кандидате (регресс) и ERR_ASSERTION на мутанте, без file-level, имя по behaviouralTests плана (`^E2[a-d] `).
- Применение и проверка мутанта — `src/sal-mutations.js` снимка (apply + verifyMutation).
- Каждый тест — отдельный процесс (`--test-name-pattern=^…$`). Порядок — по релевантности сценарию плана. Остановка после первой партии с убийством.
- **SURVIVED означает, что выполнена вся kill-база кандидата.**
- Kill-база исключает DIAG, KF и `mutation-plans/killbase-exclude.json`: REL01-e2-LATE R&D (N18), FBK-05, STP-I (N19), existing-PLC-levels, FBK10-PLC-B, FBK10-PLC-REG (1,1), а также все имена с «(1,1)» (консервативно, Q76).
- Каждого выжившего затем перепроверял только на исключённых семействах (`diag-include-excluded-families.json`). Убийство только исключённым тестом → «pending v9»; убийство тестом вне официального списка → засчитано.

Отчёты: `mutations/<план>_on_<кандидат>.json`, логи `mutations/mut-*.log`, диагностика `mutations/diag_*.json`.

### Таблица

| ID | кандидат | вердикт | убийца / примечание |
|---|---|---|---|
| M-E2a-01…03, 05…17 | E2a-core | killed (16) | E2-01 one stage/one status, E2-02, EMG4-03 A−1, FBK-06-POS (M-E2a-16) — `mutations/E2a_on_E2a.json` |
| M-E2a-04 FBOr13.OrIn2 | E2a-core | **survived** | Минимальный сценарий (`independent/probe-survivors-e2a.mjs` P04): Run→R&D, C2_FBK удержан, in_ES_NC_1 FALSE за 2 скана до отпускания C2_FBK → у мутанта b_Step_RnD+b_Step4 на +1/+2, у базы одна стадия. Пробел покрытия E2-01/MOD-006 |
| M-E2a-28 swap N12/FBAnd16 | E2a-core | survived (объяснимо) | L1 против in_Estop_PLC нормативно с E2b; та же мутация M-E2b-31 на E2b — killed (IL-03) |
| M-E2a-29 swap CONNECTOR_SCOPE | E2a-core | survived (объяснимо) | то же; M-E2b-32 на E2b — killed (EMG4-03 u+1) |
| M-E2a-19…25, 30, 31, 35 | E2a-RC | killed (10) | RUN-CONF RC-5, MOD1-01, DIS-HOLD, TD5-EOK, FBK10-PLC-REG (1) (M-E2a-24) |
| M-E2a-36 FBAnd4.AndIn2 | E2a-RC | killed (диагностически) | «E2a DIS-HOLD-HV … refused legacy PLC lift (1,1) 300 ms with the cover open». Тест не в официальном списке Q76, оракул на E2a-RC валиден. Исключён только моим консервативным правилом «(1,1)». На E2d путь (1,1) снят |
| M-E2a-18 FBAnd6.AndIn2 | E2a-RC | **survived** | Минимальный сценарий (P18): R&D→Run BOTH, in_HV_C2_FBK закреплён FALSE → мутант Run на p+1602, база Run нет. Единственный подобный тест — FBK-05-W (N19). Пробел: нужен отдельный негатив «C2_FBK никогда не ON → Run нет», без отката E6 |
| M-E2a-26 composite | E2a-RC | not-run | оператора composite нет |
| M-E2a-32/33/34 rebind-global | E2a-RC | not-run | Цель — несуществующий Symbol (`linkRndBothQualified`) или «temporary SAL variable»: ручная процедура. Раннер дал бы INVALID |
| M-E2b-01…15, 18, 20, 23, 26…29, 31…33, 36…40, 42…45, 47 | E2b | killed (36) | `mutations/E2b_on_E2b.json`. **M-E2b-42/43** — REL01-e2 эпизод 200 мс (не LATE) |
| M-E2b-21 GATE_030.OrIn5 | E2b (точный) | **killed** | E2d FBK10-K4 (S1) BOTH-1 qualified while … C1_FBK ON. Измерено на точном E2b 4f933433; также на E2d v7.5 |
| M-E2b-16 G10_EXIT.AndIn2 | E2b | **survived** | P16: S6 при in_ES_NC_1 ещё FALSE, Restart → у мутанта стадия b_Step1 под Emergency (у базы b_Step6). Наблюдаемый выход не меняется. Для убийства нужен тест «ES восстановлен позже без нового Restart → остаётся Emergency» (не проверено) |
| M-E2b-17 G10_EXIT.AndIn3 | E2b | **survived** | P17: ранний Restart в цепочке, затем зелёная 300 мс в S6 → мутант Safe на +2 (во время удержания), база на +301 (после отпускания, A9). Пробел EMG6-01 |
| M-E2b-19 G10_EXIT.AndIn5 | E2b | **survived** | P19: R&D, C1_FBK закреплён ON, ES_NC_1 FALSE 100 мс, Restart через 12 с → мутант Safe на +101, база остаётся Emergency (SPEC §12). Убийца E2d «FBK-10 (S1)+in_Estop_PLC» на базе FAIL (см. г) |
| M-E2b-22 G10_EXIT.AndIn1 | E2b | **survived** | P22: Restart на +2500 в цепочке → мутант b_Step1+b_Step4 с +101 (E2-01). Пробел |
| M-E2b-41 FBAndBootFbkOff.AndIn3 | E2b | **survived** | P41: старт с C1_FBK ON, Restart, FBK OFF, зелёная 300 мс → мутант Safe на +2, база на +301. Пробел EMG6-01-BOOT |
| M-E2b-46 GATE_SPOIL_R.AndIn2 | E2b / E2d | survived на E2b (по плану «E2d stack only», V14-Q7 known FAIL на E2b); **killed на E2d v7.5** | E2d IL-01 Safe, NC1 FALSE: BOTH Safe→R&D accepted with the cover open |
| M-E2b-47 | E2b, E2d | killed | E2d UNL-04 R&D cover open |
| M-E2b-48 / M-E2b-49 GATE_SPOIL_S.AndIn1/2 | E2b и E2d v7.5 | **survived** (вся база 642/714 + исключённые семейства) | Убийца не найден ни на E2b, ни на стеке E2d. Минимального сценария я не нашёл. По плану — кандидат в equivalentBySearch, решение архитектора. Equivalent не объявляю |
| M-E2c-01…03 | E2c | killed | HLT-01 (C3/BMS), DIS-HOLD |
| M-E2c-04 GATE_020.AndIn7 | E2c | **survived** (658/658 + исключённые) | Минимальный сценарий (`independent/probe-diff.mjs C04 999`): устойчивый R&D, BOTH 1500 мс, in_LV_Faulty_FBK TRUE с p+999 (за 1 скан до квалификации). База: R&D→Safe (HLT, Safe +1003), запуска нет. Мутант: на +1002 C2 ON и STO снят при C1 OFF, Run +1602, затем Emergency (b_Step4) +1603. Пробел: граница q−1 LV Faulty против квалификации BOTH |
| M-E2c-05 GATE_030.OrIn6 | E2c | **survived** (658/658 + исключённые) | Минимальный сценарий (`probe-diff.mjs C05`): R&D, BOTH удерживается 4000 мс, LV Faulty TRUE с +500. База: Safe +504, удержанный BOTH не исполняется. Мутант: тот же удержанный BOTH запускает Safe→R&D (b_Step12 +1001, C1 ON +1002) при LV Faulty TRUE. Пробел: удержанный жест не должен исполняться в новом состоянии (BTN/MOD-003). NB: по ведущему, GATE_030.OrIn6 — причина K-2 на E2c |
| M-E2c-06 swap HLT_LV перед STATE_SU | E2c | **survived** (658/658 + исключённые) | Минимальный сценарий (`probe-diff.mjs C04 1000`): LV Faulty TRUE в скане квалификации. База: StartingRun (C1, C2, STO), Run +1602. Мутант: C1 OFF и LV Discharge на +1001, при этом C2 ON и STO сняты на +1002 — два противоречащих перехода (E2-01 / C-1 race). Пробел: граница q LV Faulty против квалификации |
| M-E2d-04…13, 17…22 | E2d v7.5 (предв.) | killed (16) | UNL-05/UNL-04, FBK-10 (S1/S2/R) BOTH at Q, FBK-10 PLC (1,0), FFS BOTH NC1/NC2 |
| M-E2d-03 SafeResumption/MODE.OrIn4 | E2d v7.5 (предв.) | **survived** (714/714 + исключённые) | Минимальный сценарий (`probe-diff.mjs D03`): Safe→R&D BOTH, обе отпущены в момент принятия; новый BOTH 1100 мс на release+2050. База: R&D→Run (C2/STO +3052, Run +3652). Мутант: новый BOTH отклонён (R&D). Oracle Q-REL-AFTER-PERMIT «А» — принять. Пробел покрытия |
| M-E2d-14/15/16 | — | removed with v7.5 | не equivalent |
| M-E2d-23 restore legacy (1,1) | E2d v7.5 / E2d-v7.4.1 | **killed by frozen mutant source** | Условия V75-B: (1) на E2d-v7.4.1 FAIL / на E2d PASS — KF-5 R&D(HV) (1,1) pulse 1/50/300 мс ×3, KF-2 R&D (1,1) front ×2, KF-3 (1,1) held Safe→R&D ×1, KF-1 (R) (1,1) ×2 (ERR_ASSERTION на 741). (2) LEG11-OFF как такового в снимке v8 нет; подобные сценарии — эти KF (они KF-класса и вне kill-базы раннера). (3) дельта ровно v7.5 (§1). Тестовый LEG11-OFF ждёт v9 |
| M-E2d-24…33 | — | не запускались | по указанию ведущего: после ACCEPT G1 v9, на E2d v7.6 |
| E2a/E2a-RC/E2c-планы на E2d | — | не запускались | E2d предварительный |

### Сводка мутаций (снимок v8)

| план → кандидат | всего | killed | survived | pending v9 | not-run | removed |
|---|---|---|---|---|---|---|
| E2a-core → E2a | 19 | 16 | 3 (M-E2a-04 — пробел; M-E2a-28/29 — объяснимо, убиты на E2b как M-E2b-31/32) | 0 | 0 | — |
| E2a-RC → E2a-RC | 16 | 11 (вкл. M-E2a-36 диагностически) | 1 (M-E2a-18) | 0 | 4 (M-E2a-26 composite; 32/33/34 rebind-global на несуществующие Symbols) | — |
| E2b → E2b | 44 | 36 | 8 (M-E2b-16/17/19/22/41 — пробелы со сценариями; 46 — E2d-only; 48/49 — убийца не найден) | 0 | 0 | — |
| E2b → E2d (46/47/48/49/21) | 5 | 3 (46, 47, 21) | 2 (48, 49) | 0 | 0 | — |
| E2c → E2c | 6 | 3 | 3 (04/05/06 — пробелы со сценариями) | 0 | 0 | — |
| E2d (v7.5, предв.) → E2d | 18 | 16 | 1 (M-E2d-03 — пробел со сценарием) | 0 | 0 (M-E2d-23 → killed by frozen mutant source) | 3 (M-E2d-14/15/16) |

- **pending v9 — ни одного.** Выживших в официально исключённых семействах (N18/N19/Q76) я перепроверил: никто из них не убил ни одного выжившего.
- **Каждый выживший, кроме M-E2a-28/29 (объяснимо) и M-E2b-48/49, убиваем минимальным сценарием из требований** (`independent/probe-survivors*.mjs`, `probe-diff.mjs`). Это пробелы покрытия G1 v8, а не эквивалентности.
- **Правило G3 «каждая мутация guard'ов среза убита» не выполнено** для E2a-core, E2a-RC, E2b, E2c и E2d v7.5.
- M-E2b-21: убит на точном E2b 4f933433 (условие C5 ревью v8 закрыто измерением).

## 4. Независимые проверки по требованиям (не тесты G1)

`independent/ind-k2-unl.mjs`. Oracle — из требований, кандидат не используется. Результаты: `independent/ind.<id>.json`.
- **K-2 / WDG-02 / MOD-001** (вопрос 66(b), E2-G1-v8-r §4): Safe→R&D BOTH при in_LV_Faulty_FBK TRUE с p−200 / p+900 / A / A+1 → C1 ON в том же скане, что у контроля без Faulty, без Emergency; после Faulty FALSE (C1_FBK+5000) R&D ≤ +700.
  - F1, R1, E2a-core, E2a-RC, E2b — PASS 4/4.
  - **E2c, E2d v7.5, E2d-v7.4.1 — FAIL p−200 и p+900** (C1 никогда); A и A+1 — PASS.
- **UNL-LVF / CVR-001** (E2-G1-v8-r §4b, READY): Safe, Door TRUE, NC1/NC2 TRUE, LV Faulty TRUE ≥ 1 с, одиночная синяя 1000 мс → Unlock FALSE на P+499, TRUE на P+501…P+999.
  - F1…E2b — PASS.
  - **E2c, E2d v7.5, E2d-v7.4.1 — FAIL** (Unlock не выдан). Контроль без Faulty PASS везде.
- Вывод: K-2 и K-2b появляются в E2c. На E2b и раньше их нет.

**Покрытие требований (пробелы):**
1. UNL-LVF в снимке v8 отсутствует. K-2 проверяется только через FBK-06-NEG/POS, где база недостижима. Нужны тесты v9 по E2-G1-v8-r §4/§4b.
2. Выжившие M-E2a-04, M-E2a-18, M-E2b-16/17/19/22/41, M-E2c-04/05/06, M-E2d-03 — пробелы EMG6-01 / E2-01 / RUN-CONF / HLT-001 (границы q−1/q LV Faulty против квалификации BOTH, удержанный жест через HLT) / Q-REL-AFTER-PERMIT. Минимальные сценарии выше, скрипты `independent/probe-survivors*.mjs`, `independent/probe-diff.mjs`.
3. Restart из Emergency при C1/C2_FBK ON (старт из Safe) — тест есть, но FAIL на всех кандидатах (г).
4. Маршрут AND6 первого скана и LV legacy Network5 — без поведенческого аналога (C5 ревью v8).
5. Трассировка ID → тесты по текстовым меткам: EMG-001/005/007…010/012, CVR-002/005, MOD-007, PLC-003 в тестах снимка явно не упоминаются. Часть покрыта по меткам EMGREF/EMG6-01. Это пробел трассировки, а не доказанное отсутствие покрытия.

## Команды воспроизведения
```
# 1 delta (из SafetyTests)
node program/tester/E2-G3/snapshot/scripts/e2-delta-check.mjs --plan program/architect/E2-status/PLAN.v7_5.json --out <dir>/E2_DELTA_CHECK.json --chain F1=candidates/resumed-f1/native R1=candidates/E2-R1/native E2a-core=candidates/E2a/native E2a-RC=candidates/E2a-RC/native E2b=candidates/E2b/native E2c=candidates/E2c/native E2d=candidates/E2d-v7.5/native
# 2 корень: createSandbox рабочего дерева -> test/src/scripts := program/tester/E2-G3/snapshot/* -> тройка кандидата в MEN001_Dyno/Safety_Dyno
cd <root>/SafetyTests && node scripts/software-check.js
node program/tester/E2-G3/tools/sumroot.mjs <root>/SafetyTests/SOFTWARE_CHECK_RESULTS.json <id>.jsonl
node program/tester/E2-G3/classify.cjs program/tester/E2-G3/regression program/tester/E2-G3/regression/classification.json
# 3 мутации
node program/tester/E2-G3/tools/mutkill.mjs --snap program/tester/E2-G3/snapshot --root <root> --plan program/tester/E2-G3/mutation-plans/PLAN_<p>_on_<c>.json \
  --base program/tester/E2-G3/regression/<c>.jsonl --map program/tester/E2-G3/regression/test-file-map.json \
  --exclude program/tester/E2-G3/mutation-plans/killbase-exclude.json --out <dir> [--ids ...] [--include ...]
# 4 независимые
E2_SOURCE_ROOT=<root> node program/tester/E2-G3/independent/ind-k2-unl.mjs <id>
E2_SOURCE_ROOT=<mutant root from tools/mkmut.mjs> node program/tester/E2-G3/independent/probe-survivors.mjs <id>
```
Карта «имя теста → файл» получена загрузкой файлов снимка с заглушкой node:test (`tools/stubtest.mjs`, `hooks.mjs`, `register.mjs`). Тела тестов при этом не исполняются.

## Допущения и пределы
- Только программная модель SAL стенда: скан 1 мс, плант A2, A1–A9, A12 (helpers/e2-lifecycle.js v8). **Native CRC, IDE Verify, Target и hardware не проверялись и не заявляются.**
- Внутренних инъекций нет. Все стимулы независимых проверок — входы программы. Мутанты — модель неисправностей SAL (без CRC, diagram не обновлён).
- Классификация FAIL текстовая (по именам и ошибкам). На E2a-core/E2a-RC она грубая по семействам («Emergency вне Run до E2b»). Содержательно E2a-нормы аварий проверяются с E2b.
- Отнесение «L» (норма позднего среза) — по префиксу имени теста E2a…E2d и спискам knownFail плана, без построчной сверки с normativeFrom.
- Исполнитель мутаций отличается от стандартного раннера:
  - одиночные процессы на тест;
  - ранняя остановка;
  - kill-база шире плана: 28 файлов вместо 21;
  - мой фильтр «(1,1)» шире официального списка Q76.
  - Для выживших база выполнена полностью.
- Снимок src/scripts — на момент старта, в манифест v8 не входит. fixtures и корневые JSON — рабочее дерево на старте (дрейф D2).
- E2d v7.5 — предварительно; E2d v7.6 и v7.7 не проверялись.
- Пути кандидатов изменились во время работы:
  - E2d v7.5 теперь в candidates/E2d-v7.5 (2276d773);
  - в candidates/E2d сейчас лежит SAL c2f9ccd7…, который мне не объявлялся.
  - Все прогоны E2d шли на копии 2276d773, снятой и сверенной на старте.
- Время прогонов: регресс 8 корней ≈ 25–75 мин на корень при параллельной нагрузке; мутации — около 10 ч суммарно.

## Вопросы аналитику (через ведущего)
1. EMGREF L2 −1 скан вне SU. Исходно: устойчивый R&D (или R&D→Safe, Safe→R&D). Событие: in_Estop_PLC TRUE в e. Факт E2b…E2d: C1 OFF на +2004 против эталона steady Run +2005; разрешено [2005, 2006]. Входит ли это в TD-10, или нужна своя норма?
2. EMGREF-RUN L3: Run, in_Estop_PLC → Discharge на +7010 против эталона 4495a1f +7008 (разрешено [7008, 7009]). Допустим ли сдвиг +2 после переупорядочения R1/E2b?
3. E2-02 (Q-RC-16): потеря LV Healthy в Run→R&D с восстановлением на h+1/h+3. Ожидается R&D→Safe; на E2c/E2d R&D сохраняется. Подтвердить, что HLT-01 действует и при восстановлении до прихода в R&D.

## Что передать
- **Архитектору/редактору:**
  - K-1 появляется уже в E2b (регрессия относительно E2a-RC, 3 теста);
  - Restart из Emergency при C1/C2_FBK ON (старт из Safe) выходит на +100;
  - HLT-01b на E2c;
  - FBK10-PLC-REG (1) −2 скана;
  - выжившие со сценариями: M-E2a-04/18, M-E2b-16/17/19/22/41, M-E2c-04/05/06, M-E2d-03;
  - M-E2b-48/49 → решение equivalentBySearch.
- **Тестировщику v9:**
  - DIS-HOLD: Restart до конца цепочки;
  - B43-02 precondition;
  - B51-01 (TD-14 S2);
  - убийцы для выживших: сценарии P04, P18, P16/17/19/22/41, C04 k=999/1000, C05, D03;
  - UNL-LVF и K-2 по §4/§4b;
  - LEG11-OFF.
- **Стенду:** STATE-кейсы и ESTOP:restart-fault-recovery под R1/E2b; PRIORITY Step12 NC (V14-Q7); BOOT preflight под кандидата; D2 expected-deltas 25 → 33.
- **Ведущему:** финальный G3 на E2d v7.6 — после ACCEPT G1 v9.
