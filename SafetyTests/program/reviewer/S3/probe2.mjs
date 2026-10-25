// v2-reviewer S3: mutants of the new E3 guards vs catalog rows (model evidence). CATALOG_SAL_DIR=candidates/E3/native
import {program,programFromModel,runScenario} from '../../../test/helpers/catalog-program.js';
import '../../../test/catalog/lib/k.js';import '../../../test/catalog/lib/c.js';import '../../../test/catalog/lib/e.js';
import '../../../test/catalog/lib/u.js';import '../../../test/catalog/lib/d.js';import '../../../test/catalog/lib/h.js';import fs from 'node:fs';
const P=program();const SEL=(process.argv[2]??'').split(',').filter(Boolean).map(Number);const IDS0=['C-05','C-06','C-07','D-01','D-02','D-03','D-05','D-07','D-08','D-09','E-07','H-02','H-03','H-06','H-07','K-07','K-10','K-11','U-07','D-06','E-05'];
const IDS=['C-06','C-07','D-01','D-02','D-03','D-05','D-09','E-07','H-02','H-03','H-06','H-07','K-07','U-07'];const base=new Map();const out=[];
function mut(fn){const m=structuredClone(P.m);const ports=new Map(m.networks.flatMap(n=>n.blocks.flatMap(b=>b.inputs.map(p=>[p.path,p]))));fn(m,ports);return programFromModel(m,{...P.identity,label:'mut'});}
const deact=(...ps)=>(m,ports)=>{for(const p of ps){const q=ports.get(p);if(!q)throw Error('no '+p);q.channelInterface='Deactivated';}};
const revar=(port,from,to)=>(m,ports)=>{const a=m.variables.find(v=>v.name===from),b=m.variables.find(v=>v.name===to);a.targetPorts=a.targetPorts.filter(p=>p!==port);b.targetPorts.push(port);};
const M=[
 ['RD_HLOSS.OrIn1+2 off (no protective descent)',deact('//Network6/RD_HLOSS/OrIn1','//Network6/RD_HLOSS/OrIn2')],
 ['RD_STO_TRIG.OrIn2 off (no immediate STO on Healthy loss)',deact('//Network6/RD_STO_TRIG/OrIn2')],
 ['RD_PROT_SET.AndIn3 off (protective also after STO)',deact('//Network6/RD_PROT_SET/AndIn3')],
 ['RD_DIS.AndIn2 off (no coast)',deact('//Network6/RD_DIS/AndIn2')],
 ['DN_C2.AndIn2 off (no discharge hold)',deact('//Network6/DN_C2/AndIn2')],
 ['SU_ABORT_CAUSE.OrIn1 off (no green abort)',deact('//Network6/SU_ABORT_CAUSE/OrIn1')],
 ['SU_ABORT_CAUSE.OrIn2 off (no LV abort)',deact('//Network6/SU_ABORT_CAUSE/OrIn2')],
 ['SU_ABORT_END.AndIn2+3 off (abort end without C2/FBK OFF)',deact('//Network6/SU_ABORT_END/AndIn2','//Network6/SU_ABORT_END/AndIn3')],
 ['SU_RESET.OrIn2 off (abort does not end SU)',deact('//RndPhysicalCompact/SU_RESET/OrIn2')],
 ['DN_STO.OrIn2 off (no STO in abort)',deact('//Network6/DN_STO/OrIn2')],
 ['N1/FBAnd2.AndIn4 off (SS1 not requested at descent start)',deact('//Network1/FBAnd2/AndIn4')],
 ['N1/FBAndNotRunSu.AndIn3 off (cover in abort not EMG)',deact('//Network1/FBAndNotRunSu/AndIn3')],
 ['RUN_DOWN_RESET.OrIn4 off (protective keeps normal owner)',deact('//Network6/RUN_DOWN_RESET/OrIn4')],
 ['N12/FBAnd2.AndIn5+6 off (Unlock in SU/abort)',deact('//Network12/FBAnd2/AndIn5','//Network12/FBAnd2/AndIn6')],
 ['SG_OWNER_SET.AndIn3 off',deact('//SafeResumption/SG_OWNER_SET/AndIn3')],
 ['HLT_LV.AndIn5 off',deact('//SafeResumption/HLT_LV/AndIn5')],
 ['HLT_DESC_SET.AndIn2 back to linkRunDownOwner',revar('//SafeResumption/HLT_DESC_SET/AndIn2','linkDescActive','linkRunDownOwner')],
 ['RD_RESET.OrIn2 off (no reset by Safe)',deact('//Network6/RD_RESET/OrIn2')],
 ['SU_ABORT_RESET.OrIn2 off (no reset by Safe)',deact('//Network6/SU_ABORT_RESET/OrIn2')],
];
for(const [i,[lbl,fn]] of M.entries()){if(SEL.length&&!SEL.includes(i))continue;let Pm;try{Pm=mut(fn);}catch(e){out.push(lbl+' ERROR '+e.message);continue;}
 const k=[];for(const id of IDS){const r=runScenario(id,Pm);if(r.fails.length)k.push(id+(id==='D-03'||id==='D-09'?'('+r.fails[0].slice(0,70)+')':''));}
 out.push(`${lbl}: killed by ${k.join(', ')||'NONE (survives)'}`);console.log(out.at(-1));}
fs.writeFileSync(new URL('./probe2.out.'+(process.argv[2]??'all').replace(/,/g,'_')+'.txt',import.meta.url),out.join('\n')+'\n');
