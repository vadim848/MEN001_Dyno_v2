# Grant probes (robust probes, not oracle)

SAL 5648e31cec9fea6d82ed2392a4be21a26c599eb4872969f5adab2ef3b87fd40b
SGVL e60698840e556dbd6d838958eadb8545735a81aaff8efbfceabc3613a4e08010
Source: program/architect/E2-status/PLAN.md section 6 (v5): robust probes on ring grants, not oracle E2-01
Scope: Network3 isolated; grants injected for exactly 1 scan, then 5 quiet scans; stages observed at state RS outputs
Grants read by the ring: b_Step12_Set, b_Step12_Set_2, b_Step2_Set_2, b_Step3_Set_2, b_Step4_Set, b_Step5_Set, b_Step6_Set, b_Step_RnD_Set
Swept non-grant Symbols: {"b_EStop_Ok":[false,true],"in_False_SI2_CH8":[false,true],"in_Safety_Run":[false,true]}
Unconnected active inputs (runtime assumption, both values): //Network3/FBDecouple1/DecIn2, //Network3/FBDecouple1/DecIn3, //Network3/FBDecouple1/DecIn4, //Network3/FBDecouple1/DecIn5, //Network3/FBDecouple1/DecIn6, //Network3/FBDecouple1/DecIn7, //Network3/FBDecouple1/DecIn8

Normative seeds: program/architect/E2-status/PLAN.md (v6) §9 «Пробы стенда G-1…G-4 — где ожидание нормативно», relayed by lead 2026-10-22

| probe | injected (1 scan) | construction | normative seeds | NORMATIVE A / D / E | OBSERVATION A / D / E |
|---|---|---|---|---|---|
| G-1 | b_Step2_Set_2 + b_Step4_Set | S4 only (g7 in Reset of S1 and SR) | Step_RnD | 16 / 0 / 0 | 80 / 32 / 0 |
| G-2 | b_Step3_Set_2 + b_Step4_Set | S4 only | Step_RnD | 16 / 0 / 0 | 64 / 48 / 0 |
| G-3 | b_Step12_Set_2 + b_Step4_Set | S4 only | Step3 | 16 / 0 / 0 | 64 / 48 / 0 |
| G-4 | b_Step12_Set + b_Step3_Set_2 | two stages expected: different sources, grant binding violated; shows the limit of the ring, not a defect | none (limit; observation only) | 0 / 0 / 0 | 80 / 48 / 0 |

A = AS-CONSTRUCTED, D = DEVIATES, E = ERROR. Only NORMATIVE rows carry the verdict; OBSERVATION rows are reported.


## DEVIATES / ERROR rows

| probe | role | seed | env | unconnected | pre | after injection | settled | status |
|---|---|---|---|---|---|---|---|---|
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-1 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-2 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step12 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step12 | Step12,Step4 | Step12,Step4 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step5 | Step4,Step5 | Step4,Step5 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-3 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step6 | Step4,Step6 | Step4,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":false,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | false | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":false} | true | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | false | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":false,"in_Safety_Run":true} | true | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | false | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":false} | true | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step4 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step4 | Step12,Step3,Step4 | Step12,Step3,Step4 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step5 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step5 | Step12,Step3,Step5 | Step12,Step3,Step5 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | false | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |
| G-4 | OBSERVATION | Step6 | {"b_EStop_Ok":true,"in_False_SI2_CH8":true,"in_Safety_Run":true} | true | Step6 | Step12,Step3,Step6 | Step12,Step3,Step6 | DEVIATES |

- Robust probe, not an oracle (PLAN v5 section 6): the verdict compares with the architect's constructive expectation only
- Isolated ring network: upstream grant producers, their mutual exclusion and the binding of grants to sources are NOT exercised
- Seeds are single stages set directly at the RS outputs (no reachability claim); seedHeld=false marks a seed the ring itself changed before injection
- Unconnected active inputs follow the runtime assumption, both values reported
- Only NORMATIVE rows (normativeSeeds per probe) carry the probe verdict; OBSERVATION rows (other seeds) are reported, not judged. G-4 has no normative seed (ring limit)
