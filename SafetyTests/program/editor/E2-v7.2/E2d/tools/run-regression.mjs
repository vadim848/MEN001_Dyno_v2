// Isolated check:software with a candidate overlaid on the canonical paths (createSandbox of the stand,
// destination outside the repository; canonical files are never touched).
// node run-regression.mjs <label> <candidateDir> <sandboxParent> <resultDir>
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createSandbox, CANONICAL} from '../../../../src/stand-sandbox.js';
const [label, cand, parent, resDir] = process.argv.slice(2);
const dest = path.join(parent, label);
fs.rmSync(dest, {recursive: true, force: true});
const sb = createSandbox({dest, overlays: {[CANONICAL.sal]: {from: path.resolve(cand, 'TwinSafeGroup1.sal')}, [CANONICAL.sgvl]: {from: path.resolve(cand, 'GVL1.sgvl')}, [CANONICAL.diagram]: {from: path.resolve(cand, 'TwinSafeGroup1.sal.diagram')}}});
const sha = {sal: sb.sha(CANONICAL.sal), sgvl: sb.sha(CANONICAL.sgvl), diagram: sb.sha(CANONICAL.diagram)};
console.log(label, 'sandbox', dest, JSON.stringify(sha));
const t0 = Date.now();
const r = spawnSync(process.execPath, ['scripts/software-check.js'], {cwd: sb.standRoot, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024});
fs.mkdirSync(resDir, {recursive: true});
fs.writeFileSync(path.join(resDir, 'check-software.log'), `sandbox ${dest}\noverlay ${JSON.stringify(sha)}\nexit ${r.status}\nseconds ${(Date.now() - t0) / 1000}\n--- stdout\n${r.stdout}\n--- stderr\n${r.stderr}\n`);
for (const f of ['SOFTWARE_CHECK_RESULTS.json', 'SOFTWARE_CHECK_RESULTS.md', 'SAL_NATIVE_STRUCTURE_RESULTS.json', 'BOOT_PREFLIGHT_RESULTS.json']) if (fs.existsSync(path.join(sb.standRoot, f))) fs.copyFileSync(path.join(sb.standRoot, f), path.join(resDir, f));
console.log(label, 'exit', r.status, 'seconds', (Date.now() - t0) / 1000); console.log(r.stdout.split('\n').slice(0, 12).join('\n'));
