// S6 gate mutations M1..M8 (program/architect/S6/PLAN.md, G3) on candidates/E6v/native, in memory.
// Usage (from SafetyTests): CATALOG_SAL_DIR=candidates/E6v/native CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC node program/tester/S1/s6-gate.mjs M1 [M2 ...]
// For each mutant: input-rule check (src/sal-input-rule.js) error delta vs base, then catalog scenarios until the first FAIL (P/G/W first).
import {program,programFromModel,runScenario,SCENARIOS} from '../../../test/helpers/catalog-program.js';
import {inputRuleCheck} from '../../../src/sal-input-rule.js';
for(const l of ['k','c','e','u','d','h','w','p','g'])await import(`../../../test/catalog/lib/${l}.js`);
const P=program();const dir=P.identity.dir;
const N1='//Network1/';
const port=(m,p)=>m.networks.flatMap(n=>n.blocks).flatMap(b=>b.inputs.map(x=>({b,x}))).find(e=>e.x.path===p);
const block=(m,p)=>m.networks.flatMap(n=>n.blocks).find(b=>b.path===p);
const inv=e=>{e.x.deactivate1=e.x.deactivate1==='Make Contact (NO)'?'Break Contact (NC)':'Make Contact (NO)';};
const MUT={
 M1:m=>{port(m,N1+'S6_G_R2RUN/AndIn1').x.channelInterface='Deactivated';},
 M2:m=>inv(port(m,N1+'S6_G_HB/AndIn1')),
 M3:m=>{block(m,N1+'S6_TRUE').functionName='safeAnd';},
 M4:m=>{port(m,N1+'S6_TRUE/OrIn2').x.deactivate1='Break Contact (NC)';},
 M5:m=>{const o=block(m,N1+'PK_PREV').orderOfExecution;['S2R','R2RUN','RUN2R','R2S','BYP'].forEach((k,i)=>{block(m,N1+'S6_G_'+k).orderOfExecution=o+0.1+i*0.01;});},
 M6:m=>inv(port(m,N1+'HB_LO/AndIn2')),
 M7:m=>inv(port(m,'//Network6/HEALTHY_OK/AndIn4')),
 M8:m=>{const e=port(m,N1+'PK_PREV/DecIn4');e.x.sources=[];m.variables.find(v=>v.name==='CMD_RND_TO_SAFE').targetPorts.push(e.x.path);}
};
const base=inputRuleCheck(P.m,dir).errors?.length??0;
const ids=[...SCENARIOS.keys()].sort((a,b)=>(/^[PGW]/.test(b)?1:0)-(/^[PGW]/.test(a)?1:0));
for(const k of process.argv.slice(2)){const m=structuredClone(P.m);MUT[k](m);
 const ir=inputRuleCheck(m,dir).errors?.length??0;let kill=null;
 for(const id of ids){const r=runScenario(id,programFromModel(m,{...P.identity,label:k}));if(r.fails.length){kill=`${id}: ${r.fails[0].slice(0,140)}`;break;}}
 console.log(`${k} | input-rule errors ${ir} (base ${base}) | catalog: ${kill?'KILLED by '+kill:'SURVIVED (all scenarios pass)'}`);}
