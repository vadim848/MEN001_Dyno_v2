# Лимит FB и ресурсов для нашей цели (EL1918) — E-FB-limit

2026-10-21, v2-stand-engineer. Только чтение: без download, Target/ADS и оборудования.
Reference и canonical не менялись. Машиночитаемая версия — `FB_LIMIT.json`.

## Итог

| Ресурс (на одну цель, все группы) | Лимит EL1918 rev #x00100000 | Наш HEAD | Достоверность |
|---|---:|---:|---|
| Функциональные блоки | **512** | 242 | SDK-CODE + SDK-RUNTIME (fallback) + ESI + DOC (EL6910; EL1918 = функции EL6910) |
| TwinSAFE-группы | 128 | 1 | SDK-CODE + ESI + DOC (EL6910) |
| TwinSAFE-соединения (= SafetyAliasDevice с IO) | 128 | 7 | SDK-CODE + ESI + DOC (EL1918) |
| Страницы Safe Logic cfg (буферы по 2048 Б) | 12 | NV | SDK-CODE + ESI |
| Внутренний process image | 24576 Б | NV | SDK-CODE + ESI |
| Near process image | 8192 Б | NV | SDK-CODE + ESI |
| Std PLC in / out | 1484 / 1484 Б | NV | SDK-CODE + ESI |
| EtherCAT PDO на направление | 1486 Б | NV | SDK-CODE + ESI |
| Mapping code | 24572 Б | NV | SDK-CODE + ESI |
| Safe user param pages | 4 | — | SDK-CODE + ESI |
| FSoE message / user param | 255 / 244 Б | — | SDK-CODE + ESI |
| Send-message CRC | 255 | — | SDK-CODE + ESI |
| TwinSAFE SC master | 212 | 0 | SDK-CODE + ESI (rev 00100000) |
| Networks в группе (IntId 1..255) | 255 | 14 | SDK-CODE (SALDesigner.dll) |
| Symbols / SGVL / порты | явного счётного лимита не найдено | 75 / 85 / — | NV (ограничены косвенно байтовыми бюджетами) |

Число **255** относится к классу `TargetSystemConfigEL6900`. Наш
TargetSystemConfig.xml выбирает `TargetSystemConfigEL1918`, а не EL6900. Для
EL6900 SDK также даёт 32 группы и 2912 Б process image. Аппаратно подтверждено
(со слов ведущего, здесь не перепроверено) ≥205 FB. Canonical с 242 FB на железо
не загружался.

**Главный открытый риск — бюджет страниц, а не счётчик FB.** 12 страниц
по 2048 Б делят группы, соединения и data sets всех FB. При каком числе FB он
кончится, зависит от типов FB и портов; это NV. Ошибка в этом случае:
«Too many functionblocks, connections or groups have been added for the
selected target system.»

## Цепочка выбора класса (SDK 1.4.16, v170)

1. `TargetSystemConfig.xml`: `TargetSystemType=HSafetyPLC`, `TargetSystemSubType=EL1918`.
   SHA256 v2 `b455dc24…f36c4`, reference `a0a506cf…08cfee1`. В обоих EL1918.
2. `TargetSystemHandler::.ctor` и `RefreshStoredTargetSystemConfigFromHardDisk`
   читают `/TargetSystemConfig/TargetSystemSubType`. Если значение пустое, по умолчанию
   берётся **"EL6900"**.
3. `TargetSystemHandler::CreateNewTargetSystemConfigHSafetyPlcObject` — строковый
   switch: IL 0x0139 `ldstr "EL1918"` → 0x0361 `newobj TargetSystemConfigEL1918::.ctor`.
4. Наследование: `EL1918 → LogicAndIOEK1960Based → EK1960Base → EL6910 → HSafetyPLC`.
5. `LogicAndIOEK1960Based::get_Max_FunctionBlockNumber`:
   `ModuleTwinSAFELogic != null ? ModuleTwinSAFELogic.FBs : EL6910::get_Max_FunctionBlockNumber (ldc.i4 512)`.
6. `EL6910::get_ModuleTwinSAFELogic` берёт локальное FSoE alias device из ESI
   (`EsiFsoeAliasDevice.TwinSAFELogic`, `LogicType==2`) → `BaseTwinSAFELogic.FBs`.
   Для нашей ревизии в ESI `Beckhoff EL19xx.xml` (SHA256 `b11c315a…98f9d0`) стоит
   `<FBs>512</FBs>`: устройство rev #x00100000, строка 45, и модуль #x0010077e, строка 14755.
   Ревизия в tsproj — `RevisionNo="#x00100000"`.
7. Оба пути, ESI и fallback, дают 512. В офлайн-вызове getter'а (без project node
   путь ESI недоступен) получено 512: `sdk-limit-getters.out.json`.

## Проверка в верификаторе

`TargetSystemConfigHSafetyPLC+VerifierHSafetyPLC::VerifyProcessImage`, IL 0x029D..0x030B:
`AllFunctionBlocks.Count > Max_FunctionBlockNumber` → ошибка. 512 допустимо, **513 —
первая ошибка**. Текст (Common/Resources.dll, ключ
`TargetSystemConfigHSafetyPLC_VerifyProcessImage_MaxFunctionBlockNumber`):
«Too many function blocks configured for chosen target system {0} (maximum number of {1} allowed).»
`AllFunctionBlocks` — объединение FB всех групп цели. Экземпляры User FB
раскрываются во внутренние FB (`SafetyDsl::CacheFunctionBlocks` → `AddFunctionBlocksFromUserFb`).
По той же схеме проверяются группы (`> Max_GroupNumber`), соединения
(`SafetyAliasDevices.Count > Max_TsConnnectionNumber`) и process image.
Страницы проверяет `VerifierEL6910::VerifyDataSets`: `mSafeLogicDataSets.Count > Max_SafeLogicPages`.

## Офлайн-проверка синтетического кандидата — НЕ выполнена

Проверки FB, страниц и mappings находятся в Verifier/Publisher и требуют
`SafetyProjectNode`: VS hierarchy, ErrorListHandler, каталог alias devices.
Headless-точки входа в DLL SDK нет. Единственный офлайн-путь — IDE «Verify» в
TcXaeShell, target для него не нужен. В этом read-only срезе он не запускался.
Предлагаемая процедура описана в JSON (`offlineSyntheticCheck`): 512 → без ошибки;
513 → текст выше; дополнительно зафиксировать, не появится ли раньше ошибка страниц.

## Документация (WebFetch 2026-10-21)

- EL1918: функции соответствуют EL6910, ограничение — 128 safe connections. Число FB не указано.
  https://www.beckhoff.com/en-en/products/i-o/ethercat-terminals/el1xxx-digital-input/el1918.html
- EL6910: up to 512 FB, 212 safe connections, 128 groups; цикл ~1 мс в зависимости от размера проекта.
  https://www.beckhoff.com/en-en/products/i-o/ethercat-terminals/el6xxx-communication/el6910.html
- EL6900: up to 255 FB, 128 connections, 32 groups, 8 users.
  https://www.beckhoff.com/en-en/products/i-o/ethercat-terminals/el6xxx-communication/el6900.html
- PDF EL1918 (document.beckhoff.com): HTTP 403, не прочитан.

## Риски

- R1. Бюджет страниц (12×2048 Б) может кончиться раньше 512 FB; NV.
- R2. Лимит редактора берётся из ESI/SDK. У firmware V01.08 своя проверка при
  загрузке («The received number of FBs (%d) was too big…», текст diag из ESI); значение
  офлайн недоступно, NV. ESI и документация согласованно указывают 512.
- R3. Если `TargetSystemSubType` пуст или отсутствует (например, при регенерации
  TargetSystemConfig.xml в работах V14-Q2), редактор выберет EL6900: 255 FB, 32 группы.
- R4. EL1918 rev #x00110000 имеет другой блок ESI (process image 20224, SC master 128);
  лимиты FB, групп и соединений те же.
- R5. Лимит действует на цель целиком, по всем группам; User FB считаются по внутренним FB.
- R6. Время цикла растёт с размером проекта (влияние на FSoE watchdog) — не оценивалось.

## Воспроизведение

Команды — в `FB_LIMIT.json` → `reproduce`. Инструменты: `tools/sdk-il-dump.ps1`
(ReflectionOnly + IL с разрешением токенов), `tools/sdk-limit-getters.ps1`
(вызов getter'ов на объекте без конструктора, офлайн) и `tools/sdk-resources.ps1`
(тексты ошибок). Все работают в Windows PowerShell 5.1 без IDE и Target. Прежний
`scripts/read-sdk-il.ps1` в этой среде не компилируется: C# 8 в Add-Type PS 5.1 —
«MetadataReader is inaccessible».
