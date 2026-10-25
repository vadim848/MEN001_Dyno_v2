import fs from 'node:fs';
import {preflightWorkingProgram} from '../src/boot-preflight.js';
const report=preflightWorkingProgram();
if(process.argv.includes('--write'))fs.writeFileSync(new URL('../BOOT_PREFLIGHT_RESULTS.json',import.meta.url),JSON.stringify(report)+'\n');
console.log(JSON.stringify({status:report.status,functionalBootPass:report.functionalBootPass,source:report.source,coverage:report.sourceCoverage,cases:report.cases.map(({id,status,reason,error})=>({id,status,reason,error}))}));
process.exitCode=report.status==='ERROR'?3:2;
