// E2 G1 v2 (v2-tester) — EMGREF-RUN + EMG6-01 + EMG4-03 + E2-01: Emergency in Run-down (green 600 ms accepted), Restart -> only Safe.
// Oracle and scenario definitions: helpers/e2-emergency.js (header lists sources); assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import * as E from '../helpers/e2-emergency.js';
E.defineEmergencyTests(test,['Run-down'],['PLC','ES1','ES2','MENTEE','LVC','HVC','LVC1','HVC1']);
