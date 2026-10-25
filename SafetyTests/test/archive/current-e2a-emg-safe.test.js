// E2 G1 v2 (v2-tester) — EMG6-01/EMGREF/EMGREF-LV + E2-01: Emergency in Safe and in accepted Safe->R&D (Q-ARCH-01 (2)), Restart -> only Safe.
// Oracle and scenario definitions: helpers/e2-emergency.js (header lists sources); assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import * as E from '../helpers/e2-emergency.js';
E.defineEmergencyTests(test,['Safe','Safe->R&D'],['PLC','ES1','ES2','MENTEE','LVC','HVC','LVC1','HVC1']);
