// E2 G1 v2 (v2-tester) — EMGREF-LV (Q-ARCH-01 (1)) + EMG6-01 + EMG4-03 + E2-01: Emergency in steady R&D and in R&D->Safe, Restart -> only Safe.
// Oracle and scenario definitions: helpers/e2-emergency.js (header lists sources); assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import * as E from '../helpers/e2-emergency.js';
E.defineEmergencyTests(test,['R&D','R&D->Safe'],['PLC','ES1','ES2','MENTEE','LVC','HVC','LVC1','HVC1']);
// G1 v3 (review M-a): cause removed at e+500, Restart at e+1000 before C1_FBK OFF -> stays Emergency.
E.defineRemovedRestartTests(test,['R&D'],['PLC','ES1','ES2','MENTEE','LVC','HVC']);
