// Q-S6-2 gate mutations M62-1..7 (program/architect/S6/PLAN_Q62.md) on candidates/E6w/native, in memory.
// Usage (from SafetyTests): CATALOG_SAL_DIR=candidates/E6w/native CATALOG_SYM_TRIGGER_EMG=in_Estop_PLC node program/tester/S1/q62-gate.mjs M62-1 ...
import {program,programFromModel,runScenario,SCENARIOS} from '../../../test/helpers/catalog-program.js';
for(const l of ['k','c','e','u','d','h','w','p','g'])await import(`../../../test/catalog/lib/${l}.js`);
const P=program();const N='//Network1/';
const blk=(m,p)=>m.networks.flatMap(n=>n.blocks).find(b=>b.path===p);
const prt=(m,p)=>m.networks.flatMap(n=>n.blocks).flatMap(b=>b.inputs).find(x=>x.path===p);
const flip=x=>{x.deactivate1=x.deactivate1==='Make Contact (NO)'?'Break Contact (NC)':'Make Contact (NO)';};
const MUT={
 'M62-1':m=>{const x=prt(m,N+'FBEstop1/Restart');x.sources=[];m.variables.find(v=>v.name==='in_Reset_PB').targetPorts.push(x.path);},
 'M62-2':m=>{prt(m,N+'Q62_RST/AndIn2').channelInterface='Deactivated';},
 'M62-3':m=>flip(prt(m,N+'Q62_RST/AndIn2')),
 'M62-4':m=>flip(prt(m,N+'Q62_BLK/Set')),
 'M62-5':m=>flip(prt(m,N+'Q62_BLK/Reset')),
 'M62-6':m=>{blk(m,N+'Q62_BLK').orderOfExecution=blk(m,N+'FBEstop1').orderOfExecution-0.5;},
 'M62-7':m=>{blk(m,N+'Q62_RST').orderOfExecution=blk(m,N+'FBEstop1').orderOfExecution+0.5;}
};
const first=['E-05','B-01','B-02','E-04','B-03'];
const ids=[...first,...[...SCENARIOS.keys()].filter(i=>!first.includes(i))];
for(const k of process.argv.slice(2)){const m=structuredClone(P.m);MUT[k](m);let kill=null;
 for(const id of ids){const r=runScenario(id,programFromModel(m,{...P.identity,label:k}));if(r.fails.length){kill=`${id}: ${r.fails[0].slice(0,150)}`;break;}}
 console.log(`${k} | ${kill?'KILLED by '+kill:'SURVIVED (all scenarios pass)'}`);}
