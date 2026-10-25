// Native-structure preflight + binding audit of a SAL/SGVL dir. node preflight.mjs <dir> <out.json>
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import {inspectNativeSalStructure} from '../../../../src/sal-native-structure.js';
import {validateSalBindings} from '../../../../src/sal-binding-validator.js';
const [dir, out] = process.argv.slice(2);
const r = f => fs.readFileSync(path.join(dir, f), 'utf8');
const sal = r('TwinSafeGroup1.sal'), gvl = r('GVL1.sgvl');
const h = x => crypto.createHash('sha256').update(x).digest('hex');
const ns = inspectNativeSalStructure(sal), ba = validateSalBindings(sal, gvl);
const res = {dir, sha: {sal: h(sal), sgvl: h(gvl), diagram: h(r('TwinSafeGroup1.sal.diagram'))}, preflight: ns, bindingAudit: {status: ba.status, errors: ba.errors, warnings: ba.warnings}};
fs.writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
console.log(JSON.stringify({sha: res.sha, preflight: ns.status, counts: ns.counts, binding: ba.status, errors: ba.errors?.length}, null, 1));
process.exitCode = ns.status === 'PASS' && ba.status === 'PASS' ? 0 : 1;
