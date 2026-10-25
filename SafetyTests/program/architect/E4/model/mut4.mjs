// Editor self-check mutants for E4 guards (architect scratch): deactivate one input, run its killing row.
import {programFromModel,runScenario,SCENARIOS} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
for(const l of ['k','c','e','u','d','h','w','p','g'])await import(`file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/catalog/lib/${l}.js`);
import {load,kit} from './kit.mjs';import {apply} from './e4.mjs';
const MU=[['//Network1/PA_R2RUN/AndIn2','P-06'],['//Network1/PA_R2RUN/AndIn3','P-06'],['//Network1/PA_R2RUN/AndIn5','P-02'],['//Network1/PK_OK/AndIn1','P-09'],['//Network1/PK_OK/AndIn3','P-07'],
 ['//Network1/PE_ERR/Set','P-07'],['//Network1/FBEstop1/EStopIn7','P-11'],['//Network1/FBAndNotRunSu/AndIn4','G-05'],
 ['//Network1/PA_CFG/AndIn6','G-02'],['//Network1/PA_CFG/AndIn2','G-02'],['//Network1/CFG_OFF/AndIn2','G-04'],['//Network1/PA_R2S_AB/AndIn3','P-05'],['//Network6/SU_ABORT_CAUSE/OrIn3','P-04']];
for(const [pp,id] of MU){const m=load();const k=kit(m);apply(m,k);
 if(pp.endsWith('EStopIn7')){k.clear(pp);k.port(pp).channelInterface='Both Deactivated';}else k.off(pp);
 const P=programFromModel(m,{label:'mu',salSha256:'x',sgvlSha256:'x'});const r=runScenario(id,P);
 console.log(r.fails.length?'KILLED':'SURVIVED',pp,id,r.fails.join(' | ').slice(0,140));}
void SCENARIOS;
