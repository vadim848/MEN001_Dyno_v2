# MIG-8 — handoff

Срез / роль / дата: E1-f1-mig8 / v2-stand-engineer / 2026-10-21

Источник (рабочее дерево = блобы checkpoint X=0391faeea66a4ab534a39c1dc8649f5364123e5a, raw SHA256 совпали):
SAL 04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3
SGVL dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104
diagram de02bbffee8d707453e6a049bed5ce460efdfb2baebe36bbb21cf30a7185a603
sal-runtime.js 14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e (не изменён)

## Сделано
1. `SafetyTests/scripts/build-boot-manifest.js` строка 7: `const checkpoint='a0b0d38'` -> `const checkpoint='0391fae'`.
   Единственная правка; параметризация не вводилась (короткий SHA — в стиле прежнего литерала; используется
   только для `git show` и как метка `acceptedCheckpoint`, `src/boot-preflight.js` её не сравнивает).
2. `node scripts/build-boot-manifest.js` -> `SafetyTests/BOOT_PREFLIGHT_SOURCE_MANIFEST.json` регенерирован.
   До: 1cf9b2797aa25f4983422a7fd37363da51e076c71ac9d37078c385cf7f65921e (P0, label isolated-P0-native-34b5b850-plan-79a62ea).
   После: c92c817e5e299411ebdc1230ba607d254ff67af57742426c4367f9485223494f.
3. `npm run check:software` до и после.
4. Проба причин отказа BOOT-негативов (scratch-скрипт, вне репозитория: копия mutations из test/boot-preflight.test.js:63-73).

Не коммитил. Тесты, canonical, .gitattributes не трогал.

## Сверка манифеста с MIG8_PROCEDURE (всё совпало)

| поле | ожидание | факт |
|---|---|---|
| acceptedCheckpoint | X | 0391fae |
| raw sal/sgvl/runtime | 04b45456… / dc103abe… / 14d50f18… | совпали |
| normalized sal/sgvl/runtime | cfdc0d8b…d113d / dd99b05d…6a86 / 21f71612…e7bf | совпали |
| inventory SHA256 | 05e1deeb52abb344c350286499a33c721c01b42b8d1914aee0cfd3b871a0a1ba | совпал |
| networks / blocks / stateful | 14 / 242 / 49 | 14 / 242 / 49 |
| globalWriters / globalReaders | 85 / 124 | 85 / 124 |
| aliases / outwardOutputs / globalDeclarations | 75 / 37 / 85 | 75 / 37 / 85 |
| groupDeclarations / groupBindings | 13 / 2 | 13 / 2 |

Дельты: blocks −//Network6/FBTon2, +//Network6/RUN_DOWN_RESET, +//Network6/RUN_DOWN_OWNER;
globalReaders +RUN_DOWN_RESET/OrIn1 (b_Step_RnD_Set), +RUN_DOWN_RESET/OrIn2 (b_Step4_Set), +//SafeResumption/MODE/OrIn3 (b_Step3).
Идентичность sal-runtime (raw и normalized) равна прежней — P1 не применён.
Поля `authority`/`parentManifestSha256` в новом манифесте отсутствуют (скрипт их не пишет; ожидаемо по процедуре).

## Результаты check:software

До (манифест P0): exit 3
- harness: ERROR 209/204/5 — дословно:
  `not ok 1 - BOOT preflight owns fresh full-source parsing, all native inventory and exact two unsupported categories`
  `not ok 2 - BOOT Network4 lists eight unbound native inputs, seven precise phase writers/readers, unused channel8`
  `not ok 3 - BOOT declared RunStop/ErrAck are typed connections, not inferred group RUN or main Restart`
  `not ok 5 - BOOT accepts matching relocated file pairs, portable LF/CRLF without dropping any source attributes`
  `not ok 15 - BOOT rejects an unsupported adapter revision rather than inventing group capability`
- historical 75/75, current 445/445; сценарии PASS 199 / FAIL 1 / NV 5 / ERROR 1 (BOOT:SOURCE_REJECTED).

После (манифест F1): exit 1 (ожидаемо из-за FAIL сценария)
- harness: PASS 209/209
- historical: PASS 75/75
- current: PASS 445/445
- current SAL: PASS 199 / FAIL 1 / NOT VERIFIED 7 / ERROR 0 — = ожидание C7.
  FAIL: STATE:conflicting-set-requests.
  NV: ACC-B01, ACC-C02-F, ACC-C01-E, LATE:NO-FAULT, LATE:NO-ROLLBACK, BOOT:UNSUPPORTED_UNBOUND_PROGRAM_INPUT, BOOT:UNSUPPORTED_GROUP_LIFECYCLE.
  functionalBootPass = 0.
- not ok: нет (boot-preflight.test.js отдельно: 15/15 ok).

## BOOT-негативы — причина отказа (проба на F1-манифесте)

Контроль: немутированная relocated пара и рабочая программа -> status NOT VERIFIED, inventorySha256 05e1deeb… (источник целиком НЕ отвергается).

| кейс | status | code | message |
|---|---|---|---|
| file mutation: remove complete Network4 | ERROR | SOURCE_COVERAGE_MISMATCH | Full native inventory differs from the reviewed source… (inv fb2c3be0…) |
| file mutation: mask Network4 name | ERROR | SOURCE_COVERAGE_MISMATCH | то же (inv 7b67c38e…) |
| file mutation: remove one actual state writer | ERROR | SOURCE_COVERAGE_MISMATCH | то же (inv 88eaf3bf…) |
| file mutation: foreign namespace relationship | ERROR | SOURCE_AUDIT_REJECTED | SAL binding validation failed before execution: SAL foreign XML namespace … urn:foreign |
| file mutation: alter full-source metadata revision (CRC 3702999762->3) | ERROR | UNSUPPORTED_SOURCE_REVISION | sal portable source identity differs from the reviewed revision (inventory = 05e1deeb…, т.е. отказ по identity SAL) |
| file mutation: change native attribute while preserving count | ERROR | SOURCE_COVERAGE_MISMATCH | то же (inv 6de72cd9…) |
| rejects a dropped trusted inventory entry | ERROR | SOURCE_COVERAGE_MISMATCH | (inventory источника = 05e1deeb…, расходится урезанный trusted) |
| rejects an unsupported adapter revision | ERROR | UNSUPPORTED_SOURCE_REVISION | runtime portable source identity differs from the reviewed revision |

Вывод: каждый негатив отвергается по своей причине при принимаемом контроле.
До MIG-8 все шесть «file mutation rejected» и «dropped trusted inventory entry» проходили (ok) при том,
что сам источник отвергался целиком (SOURCE_COVERAGE_MISMATCH) — т.е. тогда они не различали мутацию.

## Допущения и пределы доказательства
- Проба кодов — scratch-воспроизведение мутаций теста (копия строк 63-73), не сам тест. Тест
  `BOOT file mutation rejected: *` проверяет только status=ERROR, functionalBootPass=0 и отсутствие PASS-кейсов,
  но не `error.code`; поэтому сам по себе он не различает «отказ по мутации» и «отказ всего источника»
  (это и наблюдалось до MIG-8). Различение сейчас обеспечивается связкой с тестом 5 (контроль NOT VERIFIED/MATCH).
- CRC-атрибут не входит в inventory (inventory SHA мутанта = исходному); CRC-мутацию ловит только normalized SHA SAL.
- Манифест — offline программная инвентаризация; не native CRC, не IDE/Target, не функциональный BOOT PASS.

## Вопросы аналитику/Вадиму
Нет.

## Что передать следующему и кому
- Ведущему: отдельный коммит Y только с `SafetyTests/BOOT_PREFLIGHT_SOURCE_MANIFEST.json` и
  `SafetyTests/scripts/build-boot-manifest.js` (манифест ссылается на X, в X войти не может). Результирующие
  отчёты (SOFTWARE_CHECK_RESULTS.*, BOOT_PREFLIGHT_RESULTS.json, SAL_NATIVE_STRUCTURE_RESULTS.json) перезаписаны прогоном — включать по решению ведущего.
- Тестировщику (через ведущего), рекомендация: в `test/boot-preflight.test.js` «BOOT file mutation rejected: *»
  закрепить ожидаемый `r.error.code` по мутации (SOURCE_COVERAGE_MISMATCH ×4, SOURCE_AUDIT_REJECTED для foreign namespace,
  UNSUPPORTED_SOURCE_REVISION для CRC), чтобы негатив не проходил при отказе всего источника.
