import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {prefix} from './independent-reproduce.mjs';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rows=[];
for(const bypass of [false,true])for(const options of [
 {delay:9998},{delay:9999},{delay:10000},{delay:10001},
 {delay:10500,followingDelay:0},{delay:10500,followingDelay:1},{delay:10500,followingDelay:2},
 {delay:10500,feedbackOff:false}
]){
 const z=prefix(bypass,options).finish(10);
 const relevant=z.changedEvents.filter(e=>['//Network1/FBTon1','//Network1/FBAnd8','//Network1/FBOr16','//Network1/FBRs2','//Network12/FBAnd15','//Network12/FBAnd6','//Network12/FBDecouple2','//Network3/FBRs1','//Network3/FBRs3','//Network3/FBDecouple1','//Network3/FBDecouple2','//Network1/FBAndUnlockHold'].includes(e.block));
 const row={bypass,...options,error:z.error??null,marks:z.marks,firstMid:z.firstMid??null,firstEnd:z.firstEnd??null,stream:z.stream,protocol:z.protocol,events:relevant,selectedBlocks:z.scope.selected.length,unresolvedDemanded:z.unresolvedDemanded,runtimeUnsupported:z.runtimeUnsupported,limits:z.limits};
 rows.push(row);console.log(JSON.stringify({bypass,...options,error:row.error,firstMid:row.firstMid?.t,firstEnd:row.firstEnd?.t}));
 assert.equal(row.error,null);assert.deepEqual(row.unresolvedDemanded,[]);assert.deepEqual(row.runtimeUnsupported,[]);
}
const files=['fixture.mjs','independent-reproduce.mjs','bypass-boundaries.mjs','../../../src/sal-runtime.js','../../../src/observed-samples.js','../../../src/sal-parser.js','../../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal','../../../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl'];
fs.writeFileSync(new URL('BYPASS_BOUNDARIES.json',import.meta.url),JSON.stringify({classification:'Conditional actual-producer histories from declaredSafe and seven explicit inactive Network4 cuts; no fullBOOT, universal exclusion or physical reachability claim.',identities:files.map(path=>({path,sha256:sha(new URL(path,import.meta.url))})),rows},null,2)+'\n');
