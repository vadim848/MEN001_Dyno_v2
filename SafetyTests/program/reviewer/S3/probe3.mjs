// v2-reviewer S3: proposed sub-cases vs surviving mutants (model evidence). CATALOG_SAL_DIR=candidates/E3/native
import {program,programFromModel,toStartingRun,stIs,emg} from '../../../test/helpers/catalog-program.js';import fs from 'node:fs';
const P0=program();const out=[];
function mut(fn){if(!fn)return P0;const m=structuredClone(P0.m);const ports=new Map(m.networks.flatMap(n=>n.blocks.flatMap(b=>b.inputs.map(p=>[p.path,p]))));fn(m,ports);return programFromModel(m,{...P0.identity,label:'mut'});}
const deact=(...ps)=>(m,ports)=>{for(const p of ps)ports.get(p).channelInterface='Deactivated';};
const revar=(port,from,to)=>m=>{const a=m.variables.find(v=>v.name===from),b=m.variables.find(v=>v.name===to);a.targetPorts=a.targetPorts.filter(p=>p!==port);b.targetPorts.push(port);};
const cases={
 'SS1 requested at a (D-01 sub-case)':P=>{const x=P.run();const g=x.green(550);const a=g.p+500;x.wait(3000);const s=x.first(s=>!s.out_SS1_DR1&&!s.out_SS1_DR2,a-1);return `SS1 at ${s===undefined?'none':'a+'+(s-a)} (expect a+-50, before STO a+2000)`;},
 'LV 200 ms in Run -> protective, then Safe (H-03 sub-case)':P=>{const x=P.run();const ev=x.t;x.step({in_LV_Faulty_FBK:true},200);x.step({in_LV_Faulty_FBK:false},9000);return `end ${x.status()} (expect SAFE)`;},
 'LV 200 ms in SS1 -> Safe (H-06 sub-case)':P=>{const x=P.run();const g=x.green(550);x.wait(1000);x.step({in_LV_Faulty_FBK:true},200);x.step({in_LV_Faulty_FBK:false},12000);return `end ${x.status()} (expect SAFE)`;},
 'LV in SS1 then NC1 -> EMG (C-07 sub-case)':P=>{const x=P.run();const g=x.green(550);x.wait(1000);x.step({in_LV_Faulty_FBK:true},1000);const ev=x.t;x.step({in_InterLock_NC_1:false},300);return `EMG ${x.first(emg,ev)!==undefined} (expect true)`;},
 'LV blip after STO then NC1 -> no EMG, Safe (H-07 sub-case)':P=>{const x=P.run();const g=x.green(550);x.wait(3000);x.step({in_LV_Faulty_FBK:true},200);x.step({in_LV_Faulty_FBK:false},500);const ev=x.t;x.step({in_InterLock_NC_1:false},9000);return `EMG ${x.first(emg,ev)!==undefined} end ${x.status()} (expect false, SAFE)`;},
 'EMG in descent, Restart, BOTH, BOTH -> Run (E-07 sub-case)':P=>{const x=P.run();const g=x.green(550);x.wait(1000);x.step({in_ES_NC_1:false},12000);x.step({in_ES_NC_1:true},500);x.restart();x.wait(3000);x.both();x.wait(3000);x.wait(2100);x.both();x.wait(3000);return `end ${x.status()} (expect RUN)`;},
 'EMG in SU abort, Restart, BOTH, BOTH -> Run':P=>{const x=P.rnd();toStartingRun(x,{holdHvFaulty:true});x.wait(2100);x.green(550);x.wait(200);x.step({in_ES_NC_1:false},8000);x.step({in_ES_NC_1:true,in_HV_Faulty_FBK:false},500);x.restart();x.wait(3000);x.both();x.wait(3000);x.wait(2100);x.both();x.wait(3000);return `end ${x.status()} (expect RUN)`;},
};
const M=[['E3 candidate',null],['FBAnd2.AndIn4 off',deact('//Network1/FBAnd2/AndIn4')],['RUN_DOWN_RESET.OrIn4 off',deact('//Network6/RUN_DOWN_RESET/OrIn4')],
 ['HLT_DESC_SET back to linkRunDownOwner',revar('//SafeResumption/HLT_DESC_SET/AndIn2','linkDescActive','linkRunDownOwner')],['RD_PROT_SET.AndIn3 off',deact('//Network6/RD_PROT_SET/AndIn3')],
 ['RD_RESET.OrIn2 off',deact('//Network6/RD_RESET/OrIn2')],['SU_ABORT_RESET.OrIn2 off',deact('//Network6/SU_ABORT_RESET/OrIn2')]];
for(const [lbl,fn] of M){const P=mut(fn);for(const [c,f] of Object.entries(cases)){let r;try{r=f(P);}catch(e){r='PRECONDITION/ERR '+e.message.slice(0,80);}out.push(`${lbl} | ${c}: ${r}`);}}
console.log(out.join('\n'));fs.writeFileSync(new URL('./probe3.out.txt',import.meta.url),out.join('\n')+'\n');
