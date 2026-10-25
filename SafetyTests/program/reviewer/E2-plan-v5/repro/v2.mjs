// Reviewer v5: variable (alias/IO) bindings into named blocks, R1 candidate (or F1 with arg F1).
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const which=process.argv[2];
const root=which==='F1'?'C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno':'C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/E2-R1/native';
const sal=which==='F1'?root+'/TwinSafeGroup1/TwinSafeGroup1.sal':root+'/TwinSafeGroup1.sal';
const sg=which==='F1'?root+'/GVLs/GVL1.sgvl':root+'/GVL1.sgvl';
const m=parseSalFile(sal,{bindingMode:'current',sgvlPath:sg});
const pats=process.argv.slice(3);
for(const v of m.variables){const hits=[...v.targetPorts,...v.sourcePorts].filter(p=>pats.some(x=>p.includes(x)));if(hits.length)console.log(v.name,'src=',v.sourcePorts.filter(p=>pats.some(x=>p.includes(x))),'tgt=',v.targetPorts.filter(p=>pats.some(x=>p.includes(x))));}
