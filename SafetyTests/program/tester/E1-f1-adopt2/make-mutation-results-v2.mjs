import fs from 'node:fs';import crypto from 'node:crypto';
const [base,taps,out]=process.argv.slice(2);
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const m=JSON.parse(fs.readFileSync(base+'/MUTATION_RESULTS.json','utf8'));
const fileOf=n=>n.startsWith('EARLYSTO')?'test/current-early-sto.test.js':n.startsWith('RNDPHYS')?'test/current-rnd-physical-integration.test.js':n.startsWith('SR-SC-')?'test/current-safe-run-gestures.test.js':n.startsWith('current SAL:')?'test/current-rnd-down-no-reenergy.test.js':n.startsWith('R3PAIR')?'test/current-estop-native-pairs.test.js':'?';
const notOk=t=>fs.readFileSync(t,'utf8').split(/\r?\n/).filter(l=>/^not ok \d+ - /.test(l)).map(l=>l.replace(/^not ok \d+ - /,''));
const v2=structuredClone(m);
v2.version=2;v2.supersedes={file:'program/tester/E1-f1/MUTATION_RESULTS.json',sha256:sha(base+'/MUTATION_RESULTS.json'),note:'v1 kept unchanged; v2 adds annotations only (reviewer E1-kill-audit remarks 1-4); verdicts/counts unchanged'};
v2.annotatedAt=new Date().toISOString();v2.annotatedBy='v2-tester E1-f1-adopt2';
v2.units={'battery.fails':'number of runner CASES with status FAIL, summed over the 5 battery runners: qualification(16)+Run20(20)+lifecycle(2)+phase-exit(3)+f1-gaps(17) = 58 cases per source; one FAIL case may contain several violated checks, they are not counted separately','battery.errors':'number of runner CASES with status ERROR (exception in fixture preparation or body), same 58-case universe; an ERROR case is never also a FAIL','verification':'re-derived from archived logs results/mutants/<ID>/*.log TOTAL lines: MU01 fails 9+19+0+0+15=43, errors 0+0+1+0+1=2; MU22 errors 0+0+2+3+4=9; MU05 fails 1; recomputed for all 26/26 mutants, 0 mismatches. Both fields are in the SAME unit (cases); E1-kill-audit remark 2 (fails=checks vs errors=cases, 43 fails at 16 tests) compared against qualification only and is corrected here','sharedSuites.failed':'number of failed node:test top-level TESTS (not ok) in the 8 shared current-* files'};
const sharedKillers=(id,exclude=[])=>notOk(`${base}/results/mutants/${id}/shared.tap`).map(n=>({suite:'shared',file:fileOf(n),id:n,...(exclude.some(x=>n.startsWith(x))?{counted:false,reason:'parameter pin (configured WINDOW delay), not behavioural; discarded per E1-kill-audit'}:{})}));
for(const x of v2.mutants){
 if(['MU22','MU25','MU26'].includes(x.id)){x.killers=sharedKillers(x.id,x.id==='MU26'?['R3PAIR']:[]);x.killersSource=`program/tester/E1-f1/results/mutants/${x.id}/shared.tap (not ok lines; file mapped by test-name prefix)`;
  x.killersByFile=Object.entries(x.killers.reduce((a,k)=>(a[k.file]=(a[k.file]??0)+(k.counted===false?0:1),a),{})).map(([file,count])=>({file,countedFailedTests:count}));}
 if(x.id==='MU22')x.annotation='Killed only via loss of liveness (BOTH 1 s no longer yields StepUp/LV); the protective role of NOT T (attempt owner) is NOT demonstrated by any test. 2 fixture-ERRORs not counted (E1-kill-audit).';
 if(x.id==='MU25')x.annotation='Killed only by shared current-* files; the battery is Run-only and cannot observe BOTH (E1-kill-audit).';
 if(x.id==='MU26')x.annotation='Killed only by shared current-* files; 1 of 15 failures (R3PAIR parameter pin) discarded, 14 behavioural remain (E1-kill-audit).';
 if(x.id==='MU07'){x.shaDeterministic=false;x.annotation='mutantSalSha256 is NOT reproducible: make-mutants.mjs addSymbolReader uses crypto.randomUUID for wrapper Ids; only the behaviour is reproducible (E1-kill-audit: 25/26 SHA match, MU07 differs). Kill at delta 500 AND 501 (new regression neighbour), survives at 600 by design (owner already latched).';}
 if(x.id==='MU05')x.annotation='Single killer test adopted into regression (E1-f1-adopt2).';
 if(['MU05','MU07'].includes(x.id)){const t=notOk(`${taps}/${x.id}.tap`);x.regressionKillers=t.map(n=>({suite:'check:software current',file:'test/current-f1-lock-and-q500.test.js',id:n}));x.regressionEvidence=`program/tester/E1-f1-adopt2/${x.id}.tap (F1: program/tester/E1-f1-adopt2/F1.tap all ok)`;}
}
v2.summary.annotations=['MU22 killed only via loss of liveness, not via a forbidden transition','MU25/MU26 killed only by shared current-* files (killers now filled)','MU05/MU07 single-test killers adopted into test/current-f1-lock-and-q500.test.js (in check:software current group)','MU07 SHA not reproducible (random UUID); behaviour reproducible'];
fs.writeFileSync(out,JSON.stringify(v2,null,1)+'\n');console.log('written',out);
