import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),prefix='SafetyTests/resumed-development-2026-10-21/';
const paths=[
 'AGENTS.md','WORK_STATUS_AND_PLAN.md','SafetyTests/SCENARIO_DECISIONS.md',
 'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',
 'MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',
 'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal.diagram',
 'SafetyTests/candidates/resumed-f1/native/TwinSafeGroup1.sal',
 'SafetyTests/candidates/resumed-f1/native/GVL1.sgvl',
 'SafetyTests/candidates/resumed-f1/native/TwinSafeGroup1.sal.diagram',
 'SafetyTests/SOFTWARE_CHECK_RESULTS.json','SafetyTests/SOFTWARE_CHECK_RESULTS.md',
 'SafetyTests/BOOT_PREFLIGHT_SOURCE_MANIFEST.json',
 'SafetyTests/test/helpers/v2-structural.js',
 'SafetyTests/test/helpers/p0-accepted-baseline-controls.js',
 'SafetyTests/test/current-door-interlock.test.js','SafetyTests/test/current-mentee-set-permit.test.js',
 'SafetyTests/test/current-unlock-estop-permit.test.js','SafetyTests/test/current-native-structure.test.js',
 'SafetyTests/test/boot-preflight.test.js','SafetyTests/src/physical-rnd-source.js',
 'SafetyTests/fixtures/p0-repaired-baseline/TwinSafeGroup1.sal',
 'SafetyTests/fixtures/p0-repaired-baseline/TwinSafeGroup1.sal.diagram',
 'SafetyTests/fixtures/p0-repaired-baseline/GVL1.sgvl',
 ...['STOP_HANDOFF.md','save-stop-manifest.mjs','TIMEOUT_DECISIONS_HANDOFF.md',
 'editor/adoption/TRANSFER.json','editor/f1/HANDOFF.md','editor/f1/SELF_CHECK.json',
 'tester/STOP_HANDOFF.md','tester/canonical-p0/REPORT.md','tester/canonical-p0/VERIFIED_RESULTS.json',
 'reviewer/CANONICAL_P0_REVIEW.md','reviewer/F1_CANDIDATE_REVIEW.md',
 'state-exclusion-audit/ANALYST.md','state-exclusion-audit/tester/REPORT.md',
 'state-exclusion-audit/tester/SUMMARY.json','state-exclusion-audit/tester/INDEPENDENT_REPRODUCE.json.gz',
 'state-exclusion-audit/tester/BYPASS_BOUNDARIES.json.gz'].map(p=>prefix+p)
];
const files=paths.map(path=>{const file=new URL(path,root);if(!fs.existsSync(file))throw Error('Missing saved stop artifact '+path);const bytes=fs.readFileSync(file);return{path,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
const git=spawnSync('git',['-c','safe.directory='+fileURLToPath(root).replaceAll('\\','/').replace(/\/$/,''),'status','--short','--untracked-files=no'],{cwd:fileURLToPath(root),encoding:'utf8'});
if(git.status!==0)throw Error(git.stderr);
const manifest={status:'PAUSED by Vadim; no automatic continuation',scope:'Saved file inventory only; not new tests, implementation or acceptance',checkpointCommits:['79a62ea','b74f67e'],laterChanges:'Saved locally; uncommitted tracked modifications and untracked additions; no new STOP commit',files,trackedWorkingTree:git.stdout.trim().split(/\r?\n/)};
fs.writeFileSync(new URL('STOP_MANIFEST.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log('Saved STOP_MANIFEST.json: '+files.length+' artifact hashes; no source mutations or test process launched.');
