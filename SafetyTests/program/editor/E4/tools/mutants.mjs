// Editor self-check mutants (in-memory): deactivate a guard input, expect the named catalog row to FAIL.
// Run from SafetyTests: CATALOG_SAL_DIR=candidates/E4/native CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC node program/editor/E4/tools/mutants.mjs
import {program, programFromModel, runScenario} from '../../../../test/helpers/catalog-program.js';
for (const l of ['k', 'c', 'e', 'u', 'd', 'h', 'w', 'p', 'g']) await import(`../../../../test/catalog/lib/${l}.js`);
const P = program();
const M = [
  ['//Network1/PA_R2RUN/AndIn2', ['P-06']],
  ['//Network1/PA_R2RUN/AndIn5', ['P-02']],
  ['//Network1/PK_OK/AndIn1', ['P-09']],
  ['//Network1/PK_OK/AndIn3', ['P-07']],
  ['//Network1/FBEstop1/EStopIn7', ['P-11']],
  ['//Network1/FBAndNotRunSu/AndIn4', ['G-05']],
  ['//Network1/PA_CFG/AndIn6', ['G-02']],
  ['//Network1/PA_CFG/AndIn2', ['G-02']],
  ['//Network1/CFG_OFF/AndIn2', ['G-04']],
  ['//Network6/SU_ABORT_CAUSE/OrIn3', ['P-04']],
];
for (const [port, ids] of M) {
  const m = structuredClone(P.m);
  const p = m.networks.flatMap(n => n.blocks.flatMap(b => b.inputs)).find(p => p.path === port);
  if (!p) {console.log(port, 'NO PORT'); continue;}
  p.channelInterface = port.endsWith('EStopIn7') ? 'Both Deactivated' : 'Deactivated';
  const Pm = programFromModel(m, {...P.identity, label: 'mutant'}, {});
  for (const id of ids) {
    let r;
    try {r = runScenario(id, Pm);} catch (e) {console.log(port, id, 'ERROR', String(e).slice(0, 100)); continue;}
    console.log(port, id, r.fails.length ? 'KILLED' : 'SURVIVED', r.fails.slice(0, 1).join('').slice(0, 100));
  }
}
