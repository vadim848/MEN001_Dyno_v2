// v2-reviewer S4: own mutants of E4 guards (in-memory, model evidence). Run from SafetyTests with
// CATALOG_SAL_DIR=candidates/E4/native CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC node program/reviewer/S4/mut.mjs [all]
import {program, programFromModel, runScenario, SCENARIOS} from '../../../test/helpers/catalog-program.js';
for (const l of ['k','c','e','u','d','h','w','p','g']) await import(`../../../test/catalog/lib/${l}.js`);
const P = program();
const ALL = process.argv[2]==='all';
const ids = [...SCENARIOS.values()].filter(s => ALL ? ['E2','E3','E4'].includes(s.stage) : s.stage==='E4').map(s=>s.id);
const M = (process.env.MUTS ?? [
 '//Network1/PA_R2RUN/AndIn3','//Network1/PA_R2S_AB/AndIn3','//Network1/PA_R2S_ST/AndIn3','//Network1/PA_R2S_ST/AndIn2','//Network1/PA_R2S_AB/AndIn2',
 '//Network1/PA_R2RUN/AndIn4','//Network1/PA_R2RUN/AndIn6','//Network1/PA_S2R/AndIn2','//Network1/PA_S2R/AndIn3','//Network1/PA_S2R/AndIn4',
 '//Network1/PA_RUN2R_T/AndIn2','//Network1/PA_RUN2R_T/AndIn3','//Network1/PA_RUN2R/AndIn2','//Network1/PA_CFG/AndIn3','//Network1/PA_CFG/AndIn4',
 '//Network1/PA_CFG/AndIn5','//Network1/PA_CFG/AndIn7','//Network1/PE_SET/AndIn2','//Network1/PC_A5/AndIn1','//Network1/PE_ALLF/AndIn5',
 '//Network1/PK_OK/AndIn2','//Network1/PS_RND/AndIn3','//Network1/PS_RND/AndIn4','//Network1/PS_RND/AndIn5','//Network1/PS_RUN/AndIn3',
 '//Network1/CFG_DONE/AndIn4','//Network1/CFG_DONE/AndIn5','//Network1/CFG_EX_SET/AndIn2','//Network3/FBAnd2/AndIn5','//Network6/STAGE_LVON/OrIn3',
 '//Network1/FBAnd4/AndIn5','//Network1/FBOr1/OrIn1','//Network1/FBOr5/OrIn1','//Network1/FBOr2/OrIn3','//Network1/FBOr6/OrIn2',
 '//Network3/FBOr1/OrIn1','//Network3/FBOr2/OrIn1','//Network3/CFG_RST/OrIn2','//Network1/HB_OK/AndIn2','//Network3/DEC_CFG/AndIn2','//Network3/DEC_EMG/AndIn4',
 '//Network1/PE_T_CLR/TonIn','//Network1/PF_OR/OrIn1'].join(',')).split(',');
for (const port of M) {
  const m = structuredClone(P.m);
  const p = m.networks.flatMap(n => n.blocks.flatMap(b => b.inputs)).find(p => p.path === port);
  if (!p) {console.log(port, 'NO PORT'); continue;}
  p.channelInterface = 'Deactivated';
  const Pm = programFromModel(m, {...P.identity, label: 'mutant'}, {});
  const killers=[];
  for (const id of ids) {let r;try {r = runScenario(id, Pm);} catch (e) {killers.push(id+':ERR');continue;} if (r.fails.length) killers.push(id);}
  console.log(port, killers.length ? 'KILLED by '+killers.join(',') : 'SURVIVED');
}
