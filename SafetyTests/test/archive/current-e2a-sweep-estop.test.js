// E2 G1 v3: + in_Estop_PLC sweep (rule L2 base for L1 of the other causes). E2 G1 v2 (v2-tester) — E2-01 + EMG6-01: ES_NC_1/ES_NC_2/Mentee -3..+3 scans around C2_FBK OFF in Run-down (reviewer G1 M4/M5).
// Oracle and scenario definitions: helpers/e2-emergency.js (header lists sources); assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import * as E from '../helpers/e2-emergency.js';
E.defineSweepTests(test,['PLC','ES1','ES2','MENTEE']);
