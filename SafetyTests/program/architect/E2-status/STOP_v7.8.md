# STOP v7.8 — точка остановки архитектора (2026-10-23, СТОП по прямому указанию Вадима)

Раздел PLAN.md «Addendum v7.8» помечен «ЧЕРНОВИК, прервано». Ревью и редактору не передавался.

## SHA на момент остановки (program/architect/E2-status/)

| Файл | SHA | Последняя утверждённая версия |
|---|---|---|
| PLAN.json | bf55168d2368787843d4c36343ac057d2efc80457c52519d4e4b8c928784b1b6 | PLAN.v7_7.json (c71f9a54…, v7.7 + V77, delta PASS, 0 NV) |
| PLAN.md | 6dcfbd8c71016b2d6190ffde6a1da2a4e36d64ed4793441eb5ab7900188cff05 | PLAN.v7_7.md (fc9c7688…) |
| MUTATION_PLAN_E2d.json | 1097e2505b6da0ce85a1eaf8e79bb6562af6cd91bad42ffc75dbfa93451ea971 | MUTATION_PLAN_E2d.v7_7.json (601b62f5…) |
| MUTATION_PLAN_E2b.json | 1c7bcdfe123546e565f33a2cbdeecca4076d8446b7610f99e4fbb37c3d9ba42c | без изменений после V76-C |

Если v7.8 не продолжается, рабочей версией считать файлы *.v7_7.* (v7.7 + V77).

## Сделано (записано в PLAN.json / PLAN.md / MUTATION_PLAN_E2d, черновик)

- **S4(a) / RND-CONF-T 4.2 — дефект кандидата, общая причина, не legacy-декодер.**
  - WIN_C1 стартует от запроса (N11/FBAnd1 = b_Step12), а не от команды C1.
  - Задержка команды C1 зависит от пути: BOTH — u1−1, R&D на u1+600; legacy (1,0) — u1−2, R&D на u1+599.
  - Исправление: NEW Network11/WIN_C1_IN (FBAnd1 ∧ out_LV_C1) → WIN_C1.TonIn. Оба пути дают u1+601.
  - В PLAN.json (slices E2d, rationale.v78, declaredDelta.vsFrozenE2dV77) и в мутантах M-E2d-39..41.
  - Модель: repro/c11*.out.txt.
  - Interpretation-check инструментом: 38 пунктов, 231/1956/296/185.
  - E2d v7.7 c2f9ccd7 снят из source.candidates и записан в frozenMutantSources['E2d-v7.7']. Каталог candidates/E2d-v7.7 не создан.
- **S4(b) STP-I — атрибуция:** следствие known FAIL STP-I (E3). Кандидат при потере LV в SU уходит в Run на A+602, затем Step4; abort нет. REC: не отдельный дефект.

## Не сделано (только модельные пробы, в план не внесено)

1. **L3 (G3Q-2).** Причина: E2a-core перенёс N3/FBRs5 в голову, и S5 читает b_Step5_Set прошлого скана (+1 против F1).
   - Кандидат-исправление: NEW Network8/FBOrS5 (b_Step5 ∨ b_Step5_Set) → N8/FBAnd1.AndIn1.
   - Модель c14.L3.out.txt: HVD 7010→7009, C2 OFF 8011→8010, остальное без изменений.
   - В план не внесено, мутанты не заданы, регресс не проверен.
2. **EMG6-FBK (Restart при FBK ON).** Дефект подтверждён на v7.7: c12, выход по Restart при FBK ON.
   - Кандидат-исправление: NEW Network1/RESTART_OK (in_Reset_PB ∧ ¬C1_FBK ∧ ¬C2_FBK) → FBEstop1.Restart.
   - c14.RST: отпущено до FBK OFF — Emergency сохраняется; контроль и цепь из R&D без изменений.
   - Открыто: в случае «удержано через FBK OFF» EOk приходит на g+1000 (на отпускании), и у базы так же. Нужна сверка с «цепью reference» и рекомендация (REC).
   - В план не внесено.
3. **E2-02-R (G3Q-3, Q-RC-16 память LV в спуске).** Кандидат-дизайн: HLT_DESC_SET / HLT_MEM / HLT_LV_SRC в SafeResumption. Проба c14.E202 **недействительна**: сценарий не вывел из Run (ошибка стенда пробы). Атрибуция и исправление не завершены.
4. **HLT-01b на E2c:** атрибутировано (c12 B). Крышка ещё в LvCurrentPermit (до E2d) блокирует g5, SG=1, R&D остаётся. Known FAIL «fixed in E2d», с K-2 не связано. В план не записано.
5. **Мутанты G3:**
   - M-E2b-48 на стеке E2b убит в модели (c12 C): Safe, LV connector потерян, синяя → база Unlock +501, мутант нет. Нужна норма Unlock в Safe при потере connector; REC: Unlock допустим (аналогия UNL-LVF/Q-ARCH-04).
   - M-E2b-49 — довод equivalentByProof: вне S1 при ¬connectors ⇒ ¬GATE_001 ⇒ Reset STATE_L доминирует.
   - M-E2a-26 → заменить на rewire FBTon3.TonIn := WIN_C2.TonOut.
   - M-E2a-32/33/34 → rebind-global на существующие SGVL recRndC_T / b_Step3_Set_2 / recRndC_SU. Проба c14.DIS **недействительна**: HVD в исходе был 0, предпосылка DIS-HOLD не воспроизведена.
   - M-E2a-28/29: допустимо (EQUIVALENT на E2a-core по плану, убиты на E2b как M-E2b-31/32).
   - Ничего из этого в MUTATION_PLAN_* не внесено.
6. Ревью v7.8, пересборка E2d, delta-проверка цепочки — не выполнялись.
