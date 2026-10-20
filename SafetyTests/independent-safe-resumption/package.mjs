import fs from 'node:fs';
import crypto from 'node:crypto';
const base=new URL('./',import.meta.url),files=[];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function walk(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const relative=prefix+entry.name,url=new URL(entry.name+(entry.isDirectory()?'/':''),dir);if(entry.isDirectory()){if(entry.name==='fixtures')walk(url,relative+'/');else if(prefix.startsWith('fixtures/'))walk(url,relative+'/');continue;}if(relative==='package-identity.json')continue;const size=fs.statSync(url).size;if(prefix.startsWith('fixtures/')||/\.(mjs|md|gz)$/.test(entry.name)||(entry.name.endsWith('.json')&&size<100000))files.push({path:relative,bytes:size,sha256:hash(url)});}}
walk(base);
const report={status:'RED evidence package; no candidate acceptance',baseline:{sal:'0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909',sgvl:'06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5'},traceProvenance:'Recorded baseline trace used identical source bytes from production before immutable fixture pin. Baseline path/pin changed afterward; behavior was not rerun. trace-index contains historical raw/archive identities; this manifest identifies current scripts.',excluded:['sandbox copies','large raw JSON retained locally','this manifest self-hash'],files:files.sort((a,b)=>a.path.localeCompare(b.path))};
fs.writeFileSync(new URL('package-identity.json',base),JSON.stringify(report,null,2));
console.log({files:files.length,totalBytes:files.reduce((sum,f)=>sum+f.bytes,0)});
