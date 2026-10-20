import fs from 'node:fs';
import crypto from 'node:crypto';
const base=new URL('./',import.meta.url),files=[];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function walk(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+entry.name,url=new URL(entry.name+(entry.isDirectory()?'/':''),dir);if(entry.isDirectory()){if(entry.name==='fixtures'||prefix.startsWith('fixtures/'))walk(url,rel+'/');continue;}if(rel==='package-identity.json')continue;const bytes=fs.statSync(url).size;if(prefix.startsWith('fixtures/')||/\.(mjs|md|gz|log)$/.test(rel)||(rel.endsWith('.json')&&bytes<100000))files.push({path:rel,bytes,sha256:hash(url)});}}
walk(base);
const runtime=fs.readdirSync(new URL('sandbox/SafetyTests/src/',base)).filter(n=>n.endsWith('.js')).map(name=>({name,sha256:hash(new URL('sandbox/SafetyTests/src/'+name,base))}));
fs.writeFileSync(new URL('package-identity.json',base),JSON.stringify({status:'v2 bounded owner/SG evidence; overall acceptance remains separate',sources:JSON.parse(fs.readFileSync(new URL('identities.json',base))),runtime,files:files.sort((a,b)=>a.path.localeCompare(b.path)),excluded:['sandbox','large raw local JSON','self-hash']},null,2));console.log({files:files.length,bytes:files.reduce((a,f)=>a+f.bytes,0)});
