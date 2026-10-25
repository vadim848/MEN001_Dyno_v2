// Editor self-check mutants (in-memory, scratch): remove guard, expect D-03 / D-09 to FAIL. Run from SafetyTests with CATALOG_SAL_DIR=candidates/E3/native.
import {program,programFromModel,runScenario} from '../../../../test/helpers/catalog-program.js';
for(const l of ['k','c','e','u','d','h','w','p','g'])await import(`../../../../test/catalog/lib/${l}.js`);
const P=program();
for(const [port,ids] of [['//SafeResumption/HLT_LV/AndIn5',['D-03','D-09']],['//SafeResumption/SG_OWNER_SET/AndIn3',['D-03','D-09']],['//Network6/RD_DIS/AndIn2',['D-02']],['//Network6/DN_C2/AndIn2',['D-02']]]){
 const m=structuredClone(P.m);const p=m.networks.flatMap(n=>n.blocks.flatMap(b=>b.inputs)).find(p=>p.path===port);p.channelInterface='Deactivated';
 const Pm=programFromModel(m,{...P.identity,label:'mutant'},{});
 for(const id of ids){const r=runScenario(id,Pm);console.log(port,id,r.fails.length?'KILLED':'SURVIVED',r.fails.slice(0,1).join('').slice(0,120));}
}
