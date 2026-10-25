Срез / роль / дата: E1-f1-migration (MIG-1…7 после G4 ACCEPT bounded, условия C1/C5/C7) / v2-tester / 2026-10-21

Источник (canonical, сверено sha256): SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3 SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104 diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603
P0-фикстура fixtures/resumed-p0-canonical: SAL 34b5b850…0b0b, SGVL 517fdadd…2635, diagram 7b5eb794…78ce (совпадают с MANIFEST стенда).
Checker стенда scripts/f1-delta-check.mjs sha256 8fbb8d9888bc80681e7f0e632d1354e8811cacf61d1c8449cf27e828402b0e92 (не изменялся).

Сделано:
- MIG-1 test/helpers/v2-structural.js: SHA-пины live → F1; пины P0-фикстуры (SAL/SGVL/diagram); доказательство 59bf→P0 (check-source-pair.mjs) переведено на fixtures/resumed-p0-canonical; добавлено доказательство P0→F1 через scripts/f1-delta-check.mjs (фикстура P0 → canonical MEN001_Dyno/Safety_Dyno → frozen план b52f6b0e…), без 4-го аргумента (вывод в os.tmpdir). Раскладку canonical (TwinSafeGroup1/ и GVLs/ раздельно) checker принимает (функция file() с fallback на подпапки): прямой запуск DELTA PASS 43/43, exit 0.
- MIG-2 test/helpers/safe-run-source.js: runTonQ/runTonInput → //RndPhysicalCompact/GREEN/TonOut|TonIn (диагностика chronology, ни в одном assert).
- MIG-3/4/5: блоки 241→242 (door-interlock, mentee-set-permit, unlock-estop-permit); CRC 1997263000→3702999762 (mentee).
- MIG-6 test/current-native-structure.test.js: счётчики 242/2076/307; переименовано p0RetiredUsageIds → plannedRetiredUsageIds, комментарий перечисляет P0c (6 id) и F1 localReaderRemove (fe3c924f/c74e2d07, 0587c93c/58d3ae1a), сообщение assert «planned (P0c/F1)».
- MIG-7 test/boot-preflight.test.js: inventory 241→242; CRC-мутация 3702999762→3702999763 (литерал присутствует в SAL ровно 1 раз).
- MIG-8 не трогал. DELTA_CHECK.scratch.json в program/tester/E1-f1/ отсутствовал (удаление no-op).
- MUTATION_RECLASS.json: MU06/MU10 EQUIVALENT-by-proof (условия GRP-2 / топология Network3, MU10 переоценить после E2), MU11 OPEN (KILLABLE, E2), MU24 — killed on component boundary; reachable kill conditional on Q-MU06-01.
Поведенческие ожидания, тайминги, окна, оракулы — не изменены.

Изменённые файлы (git diff --stat; по door-interlock 4 из 6 строк — патч E0 P2 ведущего, моё — 1 строка 241→242):
 test/boot-preflight.test.js              |  4 ++--   sha256 1d5ff5b8…2485
 test/current-door-interlock.test.js      |  6 +++---  sha256 d7eee899…be71
 test/current-mentee-set-permit.test.js   |  4 ++--   sha256 388a6eca…2a94
 test/current-native-structure.test.js    |  6 +++---  sha256 8cf03154…8e83
 test/current-unlock-estop-permit.test.js |  2 +-     sha256 466fb583…59a9
 test/helpers/safe-run-source.js          |  4 ++--   sha256 1c0b3282…7ad7b
 test/helpers/v2-structural.js            | 13 ++++++++-----  sha256 a6b86bbc…5f13
 новые: program/tester/E1-f1-migration/{MUTATION_RECLASS.json (fee77758…e237), HANDOFF.md}
Побочно (выход npm run check:software, не мои пути): SOFTWARE_CHECK_RESULTS.json/.md, BOOT_PREFLIGHT_RESULTS.json, SAL_NATIVE_STRUCTURE_RESULTS.json перезаписаны прогоном.

ID матрицы и их новый статус: без изменений статусов ID (миграция структурная; C6 — G4 ID не закрывает).

Команды воспроизведения:
 cd SafetyTests && node scripts/f1-delta-check.mjs fixtures/resumed-p0-canonical ../MEN001_Dyno/Safety_Dyno resumed-development-2026-10-21/architect/F1_RUN_RECOGNIZER_PLAN.json   → DELTA PASS 43/43
 cd SafetyTests && npm run check:software   → exit 3
 cd SafetyTests && node --test --test-reporter=tap test/boot-preflight.test.js

Результаты (npm run check:software, exit 3):
 harness ERROR 204/209 (209 = 185+24, совпадает с ожиданием по числу), 5 FAIL — все BOOT-до-MIG-8;
 historical PASS 75/75; current PASS 445/445;
 сценарии current SAL {"PASS":199,"FAIL":1,"NOT VERIFIED":5,"ERROR":1}.
 Ожидание C7 (после MIG-8): 199/1/7/0. Расхождение: BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT и BOOT:UNSUPPORTED_GROUP_LIFECYCLE (NV на HEAD) заменены одним
 ERROR BOOT:SOURCE_REJECTED (BOOT-001, BOOT-002) "Full native inventory differs from the reviewed source: no filtering/masking/writer removal is accepted", code SOURCE_COVERAGE_MISMATCH — причина: BOOT manifest ещё P0 (MIG-8). FAIL STATE:conflicting-set-requests идентичен ("conflicting requests cannot report simultaneous Safe and Run" actual true expected false). NV ACC-B01, ACC-C02-F, ACC-C01-E, LATE:NO-FAULT, LATE:NO-ROLLBACK — как на HEAD.
 Ожидаемые FAIL BOOT до MIG-8 (дословно):
  not ok 1 - BOOT preflight owns fresh full-source parsing, all native inventory and exact two unsupported categories   (status 'ERROR' вместо 'NOT VERIFIED')
  not ok 2 - BOOT Network4 lists eight unbound native inputs, seven precise phase writers/readers, unused channel8   ("Cannot read properties of undefined (reading 'observations')")
  not ok 3 - BOOT declared RunStop/ErrAck are typed connections, not inferred group RUN or main Restart   (то же)
  not ok 5 - BOOT accepts matching relocated file pairs, portable LF/CRLF without dropping any source attributes   (actual 'ERROR')
  not ok 15 - BOOT rejects an unsupported adapter revision rather than inventing group capability   (actual 'SOURCE_COVERAGE_MISMATCH')
 Других расхождений с C7 нет.

Допущения и пределы доказательства:
- До MIG-8 BOOT-негативы («BOOT file mutation rejected: *», включая мигрированную CRC-мутацию 3702999762→…763, и «rejects a dropped trusted inventory entry») проходят невыборочно: исходный F1 уже отвергается из-за manifest. Их различающая сила подтверждается только повторным прогоном после MIG-8.
- MU24: репро ревьюера (held-across-reach.mjs/.txt) прочитано, мной не перезапускалось. Исходные убийцы MU24 используют фикстуру с фиксированным b_Step3 (заданное тестом внутреннее состояние).
- MU06 условен на GRP-2 (DERIVED); MU10 — на текущую топологию Network3/присвоение статусов (E2).
- Офлайн-модельные результаты; не IDE Verify/Build, не Target, не hardware.

Вопросы аналитику/Вадиму: Q-MU06-01 (роль in_False_SI2_CH8 в Run: исходное состояние Run, импульс in_False=TRUE, отпускание и повторное нажатие зелёной через ≥1000 мс нейтрали — должна ли быть принята down) — от ответа зависит достижимый kill MU24. Оракул E2 «потеря Healthy во время принятой Run-down» — для kill MU11.

Что передать следующему и кому: ведущему/стенду — MIG-8 (BOOT manifest) после checkpoint-коммита, затем повторный npm run check:software (ожидание 185+24 PASS, 199/1/7/0) и проверка, что BOOT-негативы снова различают; архитектору E2 — тест-обязательство MU11, переоценка MU10.
