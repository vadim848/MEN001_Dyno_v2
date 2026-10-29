// TMR-1 (Vadim 2026-10-28, SCENARIO_DECISIONS "## TMR-1", TMR-1-Q1 = A): requirement timer values used as catalog oracle.
// Not read from the SAL. SS1 unchanged; coast (RD_T_COAST, shared normal + protective descent) 5 -> 2 s;
// discharge hold (DN_T_HOLD, shared normal descent + StartingRun abort) 1 -> 5 s; p.9 release filter (RELEASE) 2 -> 1 s.
export const T_SS1=2000, T_COAST=2000, T_HOLD=5000, T_REL=1000;
