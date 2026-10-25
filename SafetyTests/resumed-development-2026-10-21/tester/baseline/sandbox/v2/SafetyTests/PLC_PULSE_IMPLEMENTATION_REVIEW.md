# Independent implementation review — LV/HV PLC pulse Set guards

2026-10-19. **FINAL ACCEPT — scoped LV/HV PLC pulse Set correction.**
Compare checkpointb5692c3. Reviewer has not edited implementation or tests.

Source diff is exactly two existing AndIn4 activations with direct NC contacts
and two uniquely identified canonical edges from Network1/FBAnd1.AndOut to
LV/HV SetPermit.AndIn4. Original producer→main EStop edge survives. No block,
order, timer, Reset binding, main EStop, SGVL or runtime change is involved.
Guard inputs1–3 keep aggregate/current permission/!Mentee; the fourth reads
the previous existing PLC producer rather than replacing current raw checks.

Independent actual48 plus native-binding20 execution: **68/68 PASS**, zero
skips. Accepted red baseline remains historical48=36PASS/12FAIL; unchanged
functional tests now close those12 first-recovery defects. Real producers,
manual Restart, initial aggregateTRUE/outputFALSE and continuous observations
are unchanged. Already-latched/ResetFALSE and held fault/restart positives
pass; FalseInput retains its documented producer role.

Existing partial LV/HV/Door/Mentee tests explicitly declare healthy excluded
PLCproducer boundary TRUE. They retain their previous truth tables and fault
expectations; they are not presented as PLC pulse evidence. The new48 suite
executes the actual PLCproducer and main EStop, so no constant healthy seed
can conceal its recovery behavior. Active-input metadata is updated exactly
3→4 and a new static check requires the precise producer fanout, direct fourth
contacts, no global source and253-block budget.

First fault is blocked by raw permission; first restoration is blocked by
previous PLCproducerFALSE; later samples are blocked by EStop memory until
manual Restart. This is a Set-inhibit correction, not forceReset or complete
emergency ownership. No immediate raw-False behavior or new timing is claimed.
Full-cycle/phase-cut, EDM/group and earlier residual FAIL/NV limits remain.
Editor final STOP confirmed. Accepted SAL SHA256
`dd9fd938fd5493795a7eea7b29cb027d7e994e2a55e2ad02d2ca66cb4beb6923`;
unchanged SGVL `06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5`.
`PLC_PULSE_CURRENT_RESULTS.json` SHA256
`727db17acae20f5ae13c89749772253e4b81eaa14c04c8b200f422e1566a4a5c`
contains44 continuously observed chain cases plus4 producer truth-table rows,
and exactly12 FAIL→PASS recovery deltas. All recorded source/model/test hashes
and current software/standalone report hashes independently match disk.

Reported full stages178 harness /75 historical /321 current all pass;
functional201 PASS /1 FAIL /5 NV /0 ERROR, standalone47/0/5. Reviewer separately
compared every existing functional case ID/status to b5692c3: delta empty.
No full independent duplicate pipeline is claimed; independently reproduced
68 actual/structural checks are identified above.

No remaining substantive finding in this bounded correction. Existing
Network3 conflict FAIL, five coverage NV and early STO package remain open.
No native Verify/Build/CRC, hardware validation or deployment is claimed.
Reviewer writes STOP.
