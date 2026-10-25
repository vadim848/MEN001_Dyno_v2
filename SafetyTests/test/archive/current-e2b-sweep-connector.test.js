// E2 G1 v2 (v2-tester) — E2-01 + EMG4-03: LV/HV connector -3..+3 scans around C2_FBK OFF in Run-down (reviewer G1 M4; Q-RC-14).
// Oracle and scenario definitions: helpers/e2-emergency.js (header lists sources); assumptions A1..A9: helpers/e2-lifecycle.js.
import test from 'node:test';
import * as E from '../helpers/e2-emergency.js';
E.defineSweepTests(test,['LVC','HVC']);
