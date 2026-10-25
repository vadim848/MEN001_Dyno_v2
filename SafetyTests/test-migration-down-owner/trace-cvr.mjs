import fs from 'node:fs';
import {createSafeRunFixture} from './sandbox/SafetyTests/test/helpers/safe-run-source.js';
import {parseSalFile} from './sandbox/SafetyTests/src/sal-parser.js';
const m=parseSalFile(new URL('sandbox/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url));
const blocks=m.networks.flatMap(n=>n.blocks).filter(b=>b.path.startsWith('//RndPhysicalCompact/')&&(b.functionName==='safeTon'||b.name==='STATE_BA'||b.name==='GATE_021')||b.path==='//Network2/FBAnd7'||b.path==='//Network1/FBRs6');
const x=createSafeRunFixture('Safe'),start=x.sample({in_Relase_Door_PB:true}),frames=[];
for(let t=1;t<=505;t++){x.advance(1);if(t>=498)frames.push({t,...Object.fromEntries(blocks.flatMap(b=>b.outputs.map(p=>[p.path,x.r.get(p.path)]))),safeBlue:x.get('safeBlue'),grant:x.get('grant'),unlock:x.get('unlock')});}
const report={start,ledger:blocks.map(b=>({path:b.path,order:b.orderOfExecution,function:b.functionName,inputs:b.inputs.map(p=>({path:p.path,sources:p.sources,globals:p.globals.map(g=>g.resolvedName)})),parameters:b.parameters})),frames,limits:'Observed source pipeline trace, not timing oracle relaxation'};fs.writeFileSync(new URL('cvr-timing-trace.json',import.meta.url),JSON.stringify(report,null,2));console.log(frames);

