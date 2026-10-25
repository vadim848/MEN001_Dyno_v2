# MIG-8 — регенерация BOOT_PREFLIGHT_SOURCE_MANIFEST.json для F1 (подготовлено, НЕ выполнено)

Стенд E1-f1-c5, 2026-10-21. Владелец исполнения: v2-stand-engineer (по указанию ведущего после G4 и checkpoint-коммита).

## Предусловия (все обязательны)

1. Canonical перенос F1 завершён редактором; в рабочем дереве (raw SHA256):
   - `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal` = `04b45456ae1c64fcea61e96e351f8035f9f409aec9e3b19f16d84fa8c60d28a3` (LF-нормализ. `cfdc0d8b…d113d`)
   - `MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl` = `dc103abed49fd1c3ec1c031595d2c7482e41032890ac3370c86ef559d60a9104` (LF-нормализ. `dd99b05d…6a86`)
   - `SafetyTests/src/sal-runtime.js` не изменён: raw `14d50f18…698e`, LF-нормализ. `21f71612…e7bf` (= текущий манифест).
2. Сделан локальный checkpoint-коммит `<X>`, содержащий эти три файла (и MIG-1…7). Push не нужен и не разрешён.
3. Нужен git: скрипт делает `git show <X>:<path>` для sal/sgvl/runtime из корня репозитория
   и сравнивает LF-нормализованные байты с рабочим деревом. В изолированной копии без `.git`
   MIG-8 невыполним (это maintenance-скрипт, не часть рантайма набора; `check:software` git не требует).

## Команды

```sh
cd C:/Users/user/source/repos/MEN001_Dyno_v2
X=$(git rev-parse --short HEAD)            # checkpoint с F1
for p in MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl SafetyTests/src/sal-runtime.js; do
  git cat-file blob $X:$p | sha256sum; sha256sum $p; done   # raw должны совпасть (файлы -text)
cp SafetyTests/BOOT_PREFLIGHT_SOURCE_MANIFEST.json "$(mktemp -d)/manifest.before.json"  # before = 1cf9b279…921e
```

Единственная правка скрипта (стенд, без изменения поведения кроме пина):
`SafetyTests/scripts/build-boot-manifest.js`, строка 7: `const checkpoint='a0b0d38'` → `const checkpoint='<X>'`.
Без неё скрипт бросает `Not the reviewed source sal` (a0b0d38 — early-STO, не P0/F1; текущий манифест P0
был поставлен не этим скриптом, а `resumed-development-2026-10-21/tester/p0/stage-boot-manifest.mjs`
с меткой `isolated-P0-native-34b5b850-plan-79a62ea`).

```sh
cd SafetyTests
node scripts/build-boot-manifest.js
node -e "const m=require('./BOOT_PREFLIGHT_SOURCE_MANIFEST.json'),c=require('crypto'),i=m.inventory;console.log(m.acceptedCheckpoint,m.rawLocalEvidenceSha256,m.normalizedSha256,c.createHash('sha256').update(JSON.stringify(i)).digest('hex'),i.networks.length,i.blocks.length,i.blocks.filter(b=>b.stateful).length,i.globalWriters.length,i.globalReaders.length,i.aliases.length,i.outwardOutputs.length,i.globalDeclarations.length,i.groupDeclarations.length,i.groupBindings.length)"
npm run check:software
```

Затем отдельный коммит `<Y>` только с манифестом и литералом checkpoint (манифест ссылается на `<X>`,
поэтому не может входить в сам `<X>`). Между `<X>` и `<Y>` BOOT-тест ожидаемо падает
(`UNSUPPORTED_SOURCE_REVISION`/`SOURCE_COVERAGE_MISMATCH`) — не маскировать.

## Ожидаемый результат (предсказан dry-run инвентаря P0-фикстура vs candidates/resumed-f1/native, без записи)

| поле | P0 (текущий манифест) | F1 |
|---|---|---|
| inventory SHA256 (JSON.stringify) | `76f04e12f752bf82ff1a89272aa49cc3ebc3a8f57013d4aadc69aaff30f9d52a` | `05e1deeb52abb344c350286499a33c721c01b42b8d1914aee0cfd3b871a0a1ba` |
| networks | 14 | 14 (Network6 список блоков изменён) |
| blocks | 241 | 242 (−//Network6/FBTon2; +//Network6/RUN_DOWN_RESET, +//Network6/RUN_DOWN_OWNER) |
| stateful | 49 | 49 |
| globalWriters | 85 | 85 (без изменений) |
| globalReaders | 121 | 124 (+RUN_DOWN_RESET/OrIn1, +RUN_DOWN_RESET/OrIn2, +//SafeResumption/MODE/OrIn3) |
| aliases | 75 | 75 (4 записи: targetPorts — плановые localReaderRemove/Add) |
| outwardOutputs | 37 | 37 |
| globalDeclarations | 85 | 85 (3 записи: usageIndices.ports — 3 новых reader'а) |
| groupDeclarations / groupBindings | 13 / 2 | 13 / 2 |

Сохранённые блоки: 45 отличаются только `orderOfExecution` (плановая перенумерация fullOrderedManifest),
2 — `channelInterface/deactivate1` (плановые portAttributeDelta MODE.OrIn3 / And23.AndIn3),
плюс sources/aliasTargets/targets/globals ровно планных wire/reader изменений.
Уточнение к тексту MIG-8 тестировщика «all other inventory lists unchanged»: неизменны **счётчики**;
содержимое aliases/globalDeclarations/networks меняется ровно на плановые дельты.

Ожидаемые поля манифеста: `acceptedCheckpoint='<X>'`, rawLocalEvidenceSha256 = {sal 04b45456…, sgvl dc103abe…, runtime 14d50f18…},
normalizedSha256 = {sal cfdc0d8b…, sgvl dd99b05d…, runtime 21f71612…}. Любое расхождение — стоп, не подгонять.
Скрипт не пишет поля `authority`/`parentManifestSha256` (их писал P0 stage-скрипт); `src/boot-preflight.js`
использует только inventory, normalizedSha256 и acceptedCheckpoint (как метку).

## Не принимается
- scratch-манифест `SCRATCH-UNREVIEWED-F1-04b45456` (G4 C1/MIG-8);
- регенерация до коммита `<X>` или с ослаблением сравнения в скрипте;
- functionalBootPass остаётся 0; BOOT NV-кейсы (Network4 unbound, group lifecycle) не меняются.
