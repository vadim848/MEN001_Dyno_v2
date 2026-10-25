# FB_SEMANTICS — соответствие функциональных блоков симулятора документации Beckhoff (E0-stand)

Владелец: v2-stand-engineer. Дата: 2026-10-21. Источник SAL: canonical
`MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`
SHA256 `34b5b8504e0c21ed75e8bc2c3646cd99e34adbe5fc36426f110f68e0497f0b0b`.
Симулятор: `SafetyTests/src/sal-runtime.js` SHA256 `14d50f182e42c7aea814eb0c221fbeadbc9becf20f7ac575d263b8cb4f14698e`,
`SafetyTests/src/estop-native-pairs.js` SHA256 `18bcb570739e5a20abd45fc831deae612e52d74d2590191fe4eeda3eed5d6ec8`.

## Первичный источник

**Beckhoff, «TwinSAFE Logic FB», Version 4.3.0, 2025-12-03**,
https://download.beckhoff.com/download/document/automation/twinsafe/twinsafe-logic-fb_en.pdf
(скачан 2026-10-21, PDF SHA256 `b303b4e8c314e0a2a6e9290491cc2ad2a996e8eacda261958bfc1d43e577cc8c`).
Ниже «§» — номер раздела, «с.» — печатная страница этого издания.
Дополнительно (не руководство, а реверс установленного SDK, только чтение IL):
`SafetyTests/03B_NATIVE_PAIR_FIX_PLAN.md` — TwinCAT Safety 1.4.16 `SALDesigner.dll`/`SALDesignerControl.dll`.

## Статусы

- **DOC** — ожидаемое значение прямо следует из текста раздела; тест-оракул взят из текста, а не из симулятора.
- **DERIVED** — логическое следствие документированного правила; прямой формулировки нет. Использовать, но не выдавать за доказанное.
- **SDK** — подтверждено только IL установленного SDK (не руководством).
- **NV** — не проверено/не моделируется. PASS, зависящий от этого пункта, не доказывает поведение целевой системы.
- **REJECT** — конфигурация, для которой семантика NV, симулятором отвергается исключением (не эмулируется).

## Конфигурация canonical, определяющая значимость пунктов

Подсчёт по разобранной canonical модели (241 блок; orderOfExecution 1..241 без пропусков и повторов):

| FB | шт. | входы активные NC / NO / неактивные | примечание |
|---|---|---|---|
| safeAnd | 115 | 218 / 114 / 588 | все активные входы связаны; все несвязанные — Deactivated |
| safeOr | 50 | 132 / 3 / 265 | то же |
| safeRs | 27 | Reset 23 NC + 4 NO, Set 27 NC | все Activated |
| safeTon | 20 | 20 NC | задержки 0.1/0.2/0.5/1/2/5/10 с |
| safeDecouple | 27 | 76 связанных / 140 несвязанных входов | **10 асимметричных пар вход/выход** (см. DEC-3) |
| safeEstop | 2 | FBEstop1: master8 Both Activated NC/NC, master10 Both Activated NC/NO; WINDOW: master8 1 Activated NC | EDM1/2 без атрибута активации, resetTime 0; maxDeviation 0; Two-Channel нет |

## Таблица соответствия

| ID | Аспект | Документация (раздел, с.) | Реализация симулятора | Тест | Статус |
|---|---|---|---|---|---|
| AND-1 | Выход = AND **активных** входов | §4.1.1 с.31; §4.1.2 статусы RUN/SAFE «all active inputs» с.32–33 | `evaluate` case safeAnd + `activePorts` (sal-runtime.js:6,94,96) | `test/stand-fb-semantics.test.js` FB-AND | DOC |
| AND-2 | Make contact (NO) инвертирует вход до AND | §4.1.1 с.31 «A make contact means that the corresponding input signal is negated, before it affects the AND» | `read()` sal-runtime.js:75 | FB-AND | DOC (ранее «выведено из наблюдений» — теперь доказано текстом) |
| AND-3 | Только AndIn1 может быть Standard-In | §4.1.1/§4.1.2 с.31 | не проверяется симулятором | структурные `current-safe-input-slots`, native validation | вне симулятора (структура) |
| AND-4 | Ошибок не формирует | §4.1.3 с.34 | нет Error | — | DOC |
| OR-1/2 | OR активных входов; NO инвертирует | §4.2.1 с.34; §4.2.2 статусы с.36 | case safeOr, `read()` | FB-OR | DOC |
| RS-1 | Set1/Reset0→1; Set0/Reset1→0; оба 1→Reset доминирует (0); оба 0→хранение | §4.10.1 с.89 | case safeRs sal-runtime.js:105 | FB-RS (синтетический), `sal-semantics` SAL-SEM02 (реальный FBRs2) | DOC |
| RS-2 | Контакт NC/NO параметризуется для Reset/Set | §4.10.2 с.90 | `read()` | FB-RS §4.10.2 (NO Reset) | DOC; в canonical 4 Reset NO |
| RS-3 | Неактивный вход RS | §4.10.3 с.92 (по умолчанию оба выключены), значение не описано | сейчас читается как активный | — | NV; в canonical отсутствует; **патч P1 добавляет REJECT** |
| RS-4 | Начальное состояние после старта группы = 0 | §4.10.2 статус STOP: RsOut=0 с.91 | memory по умолчанию false | FB-RS | DERIVED (старт из STOP); сохранение через перезапуск группы — NV |
| TON-1 | 1 на входе передаётся на выход через задержку; при падении входа до истечения выход не включается | §4.12.1 с.96 | case safeTon sal-runtime.js:114 | FB-TON | DOC |
| TON-2 | Вход 0 → немедленно 0 (SAFE); новый фронт запускает задержку заново (SAFE→DELAYIN) | §4.12.2 статусы с.98 | elapsed сбрасывается при enabled=false | FB-TON | DOC |
| TON-3 | Квантование: базы времени 1/10 мс выбираются редактором; граница на уровне цикла | §4.12.4 с.99 | непрерывные мс, elapsed=0 на первом скане, `SAL_CLOCK_CONTRACT` observed-fixed-scan-v1 | `current-timer-one-ms`, `timer-observed-clock` | NV для точной цикловой границы натива (время цикла EL6910 и фаза не заданы) |
| TON-4 | Неактивный вход TON | §4.12.3 с.99 «deactivated in the default state» | читается как активный | — | NV; в canonical отсутствует; **P1: REJECT** |
| DEC-1 | Входы 1:1 на выходы | §4.6.1 с.65 | case safeDecouple sal-runtime.js:102 | FB-DECOUPLE | DOC |
| DEC-2 | Контакты NC/NO у DECOUPLE | не описаны | атрибута нет, инверсии нет | — | DOC (отсутствие параметра) |
| DEC-3 | «The associated output must be linked as soon as one of the inputs is used. The converse is also valid.» | §4.6.1 с.65 | несвязанный вход читается по `unconnectedInput` (по умолчанию TRUE) | `sal-semantics` SAL-SEM03 (чувствительность) | **Противоречие с canonical**: 8 пар Network4/FBDecouple1 DecIn1–7 и Network6/FBDecouple2 DecIn5 — выход связан, вход нет; Network7/FBDecouple1 DecIn2 и RndPhysicalCompact/SNAP_0 DecIn8 — обратное. Значение NV; **P1: требует явного unconnectedInput, иначе ошибка** |
| EST-1 | Канал NC: 0 = запрос безопасного состояния; NO: 1 = запрос | §4.4.1 с.45; §4.4.2 с.47 | `effectiveEstopInputs` (inverted для NO) | FB-ESTOP make-contact | DOC |
| EST-2 | EStopOut падает сразу; EStopDelOut — после Delay Time (off-delay), в DELAYOUT EStopOut=0, EStopDelOut=1 | §4.4.1 с.45; статус DELAYOUT с.49 | delayed/offElapsedMs sal-runtime.js:123–147 | FB-ESTOP DELAYOUT; `sal-estop-runtime` V2-ESTOP02 | DOC (качественно); цикловая граница задержки — NV как TON-3 |
| EST-3 | Выход из безопасного состояния только по фронту 1→0 Restart при всех активных входах TRUE; START при Restart=1 и входах TRUE (Sample 2: Restart может подняться до восстановления входов) | §4.4.2 Restart с.46; §4.4.4 с.50–52 Sample 2 и 4 | restartArmed=safe∧restart; enabled при спаде | FB-ESTOP startup/restore/Sample 2/unsafe release | DOC (без EDM; с EDM — EST-6) |
| EST-4 | После старта группы — требуется спад Restart | §4.4.2 Restart с.46 | начальное enabled=false | FB-ESTOP startup | DOC |
| EST-5 | Пары master/slave, выбор активных каналов (`Single-Channel 1/2/Both Activated`, `Both Deactivated`), контакт slave из master.Deactivate2 | руководство описывает пары только для discrepancy (§4.4.1 с.46); точные строки TC3 — нет | `src/estop-native-pairs.js` | `current-estop-native-pairs` (R3PAIR) | SDK (03B_NATIVE_PAIR_FIX_PLAN.md), не руководство |
| EST-6 | EDM1/EDM2 (контроль обратной связи, Reset Time) | §4.4.1 с.46; §4.4.5 с.53–54 | активный/связанный EDM → исключение | FB-ESTOP NV guard; V2-ESTOP05 | REJECT/NV. Отсутствие атрибута активации в SAL не доказывает «EDM выключен» в редакторе |
| EST-7 | Discrepancy пар (Two-Channel) и «Safe Inputs after Disc Error» | §4.4.1 с.46; §4.4.6 с.55 | Two-Channel → исключение | FB-ESTOP NV guard | REJECT/NV; в canonical Two-Channel нет, maxDeviation=0 |
| EST-8 | Error=1 только в состоянии ERROR (discrepancy/EDM); сброс только ErrAck группы | §4.4.2 Error с.47; статусы ERROR/RESET с.48–49 | Error всегда FALSE | — | NV. Согласуется с конфигурацией лишь при условии EST-6/EST-7; «Error=FALSE» симулятора не доказывает отсутствие ошибки |
| GRP-1 | Порядок выполнения = нумерация execution order (без пропусков) | §3.1 с.18 | `executionOrder:"global"` сортировка orderOfExecution | `sal-semantics` SAL-SEM01; GROUP §3.1 | DOC (порядок); canonical 1..241 без пропусков |
| GRP-2 | Читатель с меньшим номером видит значение производителя с большим номером с предыдущего цикла; входы цикла постоянны в течение цикла | следствие §3.1 (явно не сформулировано) | значения в `values` между сканами | GROUP §3.1 (derived) | DERIVED |
| GRP-3 | Ошибка FB/коммуникации → все выходы группы 0; Run/Stop; ErrAck FALSE→TRUE→FALSE; ComErr/FbErr/OutErr; запуск группы | §3.1 с.18; §3.1.1 с.18–20 | не моделируется | — | NV (group lifecycle). Все PASS, зависящие от старта/ошибки группы, условны |
| GRP-4 | Начальные значения выходов FB до первого выполнения = 0 | следствие статусов STOP (каждый FB: выход 0) | `values` пусто → false | — | DERIVED; P1 разрешает это только для блоков, реально исполняемых в данном срезе |
| IO-1 | Значение несвязанного/незаданного входа | не определено руководством | сейчас: тихий FALSE для незаданной переменной/разрезанного провода, TRUE (по умолчанию) для несвязанного порта | — | NV. **P1: ошибка `SalUndefinedInputError`, либо явный реестр `undefinedInputs:"record"` / `assumedInputs` / явный `unconnectedInput`** |

## Что изменилось в оценке слабостей ведущего (a)

- «NO=инверсия» — доказано §4.1.1/§4.2.1/§4.10.2 (DOC), не наблюдение.
- «Глобальный orderOfExecution» — доказано §3.1 для порядка; межцикловая видимость — DERIVED.
- «RS reset-dominant» — DOC §4.10.1.
- «TON» — DOC §4.12.1–2 качественно; цикловая граница NV.
- «ESTOP restart по спаду» — DOC §4.4.2/§4.4.4 (без EDM).
- «Error всегда FALSE», discrepancy, EDM, group lifecycle — NV; конфигурации с ними симулятор отвергает (REJECT), кроме group lifecycle, который просто отсутствует.

Тесты SAL-SEM01/02 по-прежнему частично сравнивают модель с собой (SEM01 повторяет сортировку).
Независимый оракул из текста руководства — `test/stand-fb-semantics.test.js` (14 тестов, синтетические
блоки). Его различающая способность подтверждена `node scripts/stand-fb-mutation-check.js`:
9/9 семантических мутантов симулятора убиты (NO, активные входы, RS, TON, ESTOP×3, DECOUPLE, порядок).

## Пределы

- Руководство — описание поведения, а не формальная спецификация; квантование времени, порядок
  внутри цикла относительно обмена FSoE и поведение при старте группы натива не проверены.
- Ни один пункт не является аппаратной валидацией; семантика проверена только для конфигураций,
  перечисленных выше. Новые FB (OPMODE, MON, EDM, TWOHAND, TOF и др.) симулятором не поддерживаются:
  `unsupported` + SAL-RUN01 обнаружат их появление; до появления строки в этой таблице их PASS недопустим.
