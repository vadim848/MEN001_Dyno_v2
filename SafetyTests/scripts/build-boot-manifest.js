// Explicit reviewed-source maintenance, never called by the capability checker.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseSalFile} from '../src/sal-parser.js';
import {inventoryBootSource} from '../src/boot-source-inventory.js';
const checkpoint='0391fae',root=new URL('../../',import.meta.url);
const paths={sal:'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',sgvl:'MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',runtime:'SafetyTests/src/sal-runtime.js'};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),lf=b=>b.toString('utf8').replaceAll('\r\n','\n');
const bytes=Object.fromEntries(Object.entries(paths).map(([kind,p])=>[kind,fs.readFileSync(new URL(p,root))]));
for(const [kind,p]of Object.entries(paths))if(sha(lf(bytes[kind]))!==sha(lf(execFileSync('git',['show',checkpoint+':'+p],{cwd:root,maxBuffer:4*1024*1024}))))throw Error('Not the reviewed source '+kind);
const model=parseSalFile(new URL(paths.sal,root),{bindingMode:'current',sgvlPath:new URL(paths.sgvl,root)});
const manifest={acceptedCheckpoint:checkpoint,normalization:'UTF-8 bytes decoded preserving BOM; CRLF→LF only',
 rawLocalEvidenceSha256:Object.fromEntries(Object.entries(bytes).map(([k,b])=>[k,sha(b)])),
 normalizedSha256:Object.fromEntries(Object.entries(bytes).map(([k,b])=>[k,sha(lf(b))])),
 inventory:inventoryBootSource(model,bytes.sal.toString('utf8'),bytes.sgvl.toString('utf8'))};
fs.writeFileSync(new URL('../BOOT_PREFLIGHT_SOURCE_MANIFEST.json',import.meta.url),JSON.stringify(manifest)+'\n');
console.log('Reviewed full source inventory written; this is not functional BOOT acceptance');
