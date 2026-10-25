# B1 repair — READY редактору

2026-10-19. Приоритет перед03B. База SAL SHA256
85b99f594117b6752ff8ea84d6d24db0c5cb79e86003d2a2dc94510f2cc40323,
checkpoint c024. Прочитаны текущие AGENTS, статус, NATIVE_BINDING_REVIEW,
рабочий SAL, fixture и GVL1.sgvl. Архитектура01/02 логически сохраняется;
исправляется сериализация программных связей и проверка её стендом.
Поведение native loader (reject/ignore) не заявляется и не требуется для
исправления очевидного несовпадения с сохранённым DSL relationship pattern.

## 1. Удалить12 bare references и восстановить правильные механизмы

Все непосредственные inPort/fbPortGlobalVariableReference, добавленные01/02,
удалить. Для11 alias links НЕ создавать GVL1.in_* declarations.
В existing SAL variable.targetUsages дописать каждый новый consumer по образцу
fixture in_ES_NC_1 (строка9434):

```xml
<targetUsages>
  <variableHasTargetUsages Id="existing-or-new">
    <variableUsages Id="existing-or-new">
      <usages>
        <variableUsagesHasUsages Id="NEW">
          <fbPortUsage Id="NEW">
            <functionBlockPort>
              <fbPortUsageReferencesFunctionBlockPort Id="NEW">
                <inPortMoniker name="//Network1/BLOCK/PORT" />
              </fbPortUsageReferencesFunctionBlockPort>
            </functionBlockPort>
          </fbPortUsage>
        </variableUsagesHasUsages>
      </usages>
    </variableUsages>
  </variableHasTargetUsages>
</targetUsages>
```

Существующие targetUsages/variableUsages/usages контейнеры использовать,
не дублировать. Только новый usage subtree получает новые GUID. Existing
sourceUsages/aliasDeviceIoUsage и alias sdsId/channelId/functionId не менять.

| SAL alias variable | Новые consumer monikers |
|---|---|
| in_Relase_Door_PB | Network1/FBOr3/OrIn3; Network1/FBAndUnlockHold/AndIn2 |
| in_Reset_PB | Network1/FBOr3/OrIn4; Network1/FBAndUnlockHold/AndIn3 |
| in_ES_NC_1 | Network1/FBAndLvCurrentPermit/AndIn2 |
| in_ES_NC_2 | Network1/FBAndLvCurrentPermit/AndIn3 |
| in_InterLock_NC_1 | Network1/FBAndLvCurrentPermit/AndIn4 |
| in_InterLock_NC_2 | Network1/FBAndLvCurrentPermit/AndIn5 |
| in_LV_Connector_Interlock | Network1/FBAndLvCurrentPermit/AndIn6 |
| in_HV_Connector_Interlock | Network1/FBAndLvCurrentPermit/AndIn7 |
| in_Estop_PLC | Network1/FBAndLvCurrentPermit/AndIn8 |

Moniker prefix каждой строки `//`. Это11 связей, не11 разных variables.
Контактные полярности/активации портов не менять.

Настоящий global b_EStop_Ok остаётся в SGVL namespace. На
FBAndLvCurrentPermit/AndIn1 создать исходные wrappers:

```xml
<fbPortGlobalVariableReferences>
  <functionBlockPortHasFbPortGlobalVariableReferences Id="NEW">
    <fbPortGlobalVariableReference Id="existing-or-new"
      variableId="98ab783a-9ee4-42cd-8375-54abc169e250"
      lastKnownPath="GVL1.b_EStop_Ok" />
  </functionBlockPortHasFbPortGlobalVariableReferences>
</fbPortGlobalVariableReferences>
```

В GVL1.sgvl, Variable этого GUID, в existing TargetUsages дописать
`FbPortUsage Id=NEW / ModelElementId=e38bf21e-15b3-448f-89c8-2795d5bf62db`
(фактический ID AndIn1 сверить перед записью). Существующие usage indices,
SourceUsages и variable declaration сохранить. Это ordinary program usage,
не аппаратный mapping/group parameter. Embedded SGVL CRC не выдавать новым
native CRC; regeneration остаётся вне текущего доказательства.

## 2. Аудит всех новых прямых проводов и DSL ролей

Сохранённый формат wire:
`outPort/targetFunctionBlockPorts/wiredLink/inPortMoniker`, ЛИБО
`inPort/targetFunctionBlockPorts/wiredLink/outPortMoniker`.
Оригинал часто хранит связь только с одной стороны, например fixture
Network2/FBTon1→FBAnd2/AndIn1; принимающий input selfclosing. Поэтому нельзя
требовать две XML записи и создавать два разных wiredLink для одной пары.
Прежний test oracle «reciprocal wire» и требование одновременного заполнения
parser.sources/parser.targets на обоих концах исправить с этой исходной
проверяемой ссылкой на fixture. Runtime/dependency graph должен нормализовать
одну relationship запись любого из двух направлений в один canonical edge;
удаление лишней XML стороны не должно удалять реальную runtime связь.

Для новых/изменённых edges01/02 привести к единственной output-side записи
с relationship wiredLink Id; убрать противоположные дубли при наличии:

- Network1/FBRs6/RsOut → FBAndUnlockHold/AndIn1;
- Network1/FBOr17/OrOut → FBAndLvSetPermit/AndIn1;
- Network1/FBAndLvCurrentPermit/AndOut → FBAndLvSetPermit/AndIn2;
- Network1/FBAndLvSetPermit/AndOut → FBRs1/Set.

Старого OR17→RS1/Set обхода нет. Каждый source/target разрешается в реальный
порт правильного направления. Если исходный wire.Id можно сохранить при
переносе одного representation на другую сторону — сохранить; дублирующие
relation IDs удалить. Новые block/in/out/parameter containers также проверить
по исходным networkHasFunctionBlocks, functioBlockHasInPorts (именно такое
исходное написание), functionBlockHasOutPorts и аналогичным исходным ролям.
Alias output out_Door_Unlock_Solonoeid имеет единственный sourceUsage на
FBAndUnlockHold/AndOut; прежний source Rs6 отсутствует, alias descriptor
неизменён. Ревьюировать ВСЕ XML delta01/02, не только12 найденных refs.

## 3. Стенд должен обнаруживать ошибочные bindings до исполнения

Добавить namespace-aware structural validator реального SAL + SGVL1:

- Каждый global ref находится только в правильной wrapper chain; GUID
  разрешается в SGVL Variable; qualified path соответствует GVL/Name.
  Совпадения одного basename с SAL alias недостаточно.
- Для каждого global input/output ref требуемый port ModelElementId
  присутствует в SGVL TargetUsages/SourceUsages соответственно. Применить
  к новым связям; полные исходные несоответствия показать отдельно с фактами,
  не переписывать исторические файлы ради нового audit.
- SAL alias source/target usage chain валиден, moniker существует и имеет
  правильное направление; новый logical fanout присутствует ровно один раз.
- Wire roles корректны; направление нормализуется в output→input; две XML
  записи одной пары с разными relationship IDs — duplicate, не две связи.
- GUID uniqueness, нет конфликтующих разных producers одного input,
  zero bare refs, exact11alias+1global restored links. Не считать отсутствие
  binding неподключённым разрешающим входом.

Исходная fixture должна проходить wire/role parser без ложного требования
reciprocal records. Сначала прогнать structural audit на ней; если найдены
унаследованные несоответствия, перечислить точный baseline delta отдельно,
не вводить беззвучный allow-all. Alias targetUsages — самостоятельный
механизм: alias input не обязан дополнительно иметь port-global reference.
Для настоящего SGVL требуется обе индексные структуры (ref+usageindex), но
это не две копии wiredLink. Использовать структурный reader без широкой новой
зависимости, если существующий стек позволяет; regex basename matching не
считается namespace-aware валидацией.

Перед current SAL behavior runs вызывать этот validator. Parser/runtime
не должен читать неразрешённый lastKnownPath по basename и получать PASS.
Для scoped selections валидировать полный source ДО subgraph cut, иначе
намеренно срезанный producer будет ошибочно признан отсутствующим. Fixtures
и синтетические unit graphs с явной injection boundary должны иметь явно
отдельный режим, а current-file режим fail-closed. Не менять все исторические
тесты на новые malformed patterns.

Минимальные отрицательные fixtures/mutations: bare ref; alias GUID в global
ref; несуществующий global GUID при корректном basename; неверный qualified
path; отсутствующий SGVL usage; несуществующий port moniker; обратное
направление; missing relationship wrapper; дубликат wire pair. Каждая
обязана FAIL/ERROR до functional pass. Положительный repaired source проходит.

## 4. Проверки сохранения смысла и приёмка

Обновить прежний assertion whole variables unchanged: logical targetUsages
теперь намеренно меняются. Сохранить строгие проверки неизменности alias
descriptor/source, исходных consumers и разрешённой exact delta11; это
усиление доказательства, не ослабление требования. SGVL exact delta только
b_EStop_Ok.TargetUsages newport, остальные declarations/indices неизменны.
Не менять block orders1..208, логику контактов, таймеры и аппаратные секции.

Повторить01/02 targeted actual SAL tests, stale firstfault paired controls,
03A boundary evidence и полный npm run check:software. Остаточные FAIL/NV
не скрывать; новое поведение команды не вводится. Независимый reviewer
сверяет реальные DSL структуры, alias/global namespace, usage indices и
весь diff01/02 против fixture плюсrepair, затем результаты отрицательных
binding tests. B1 закрывается только после этого; прежние greenhost reports
не удаляются, статус переоткрытия/repair фиксируется честно.

Файлы редактора: рабочий SAL, GVL1.sgvl usage index, validator/parser/runtime
и соответствующие current tests/runner/results. SDS/tsproj hardware mappings,
reference и baseline fixture не изменять. 03B/04 ожидают завершения repair.
