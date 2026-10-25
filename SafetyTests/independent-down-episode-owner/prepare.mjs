import fs from 'node:fs';
import crypto from 'node:crypto';
const base=new URL('./',import.meta.url),repo=new URL('../',base);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pairs={candidate:{root:'candidates/down-episode-owner/',sal:'f6d4fb7fa4f2ee0d29f19f8e43a87fca657ddf329bab0a7afb54e50b87cd6966',sgvl:'ab0f0ef25e29b4bf82722fcefc783daf8b01157c6c6d228f0e6948b4a568452a'},prior:{root:'candidates/safe-resumption/',sal:'64fec23446e0c321b7e7a2b864b5f5bcfb440492ea76a26e94b7695205a14560',sgvl:'1981d66fb889882a75346a58c789a5f03c9b4bd03f68d0fe01022d68c6838476'},baseline:{root:'independent-safe-resumption/fixtures/baseline/MEN001_Dyno/Safety_Dyno/',sal:'0fc39751781cf9525765b223e08c909f31353b976ad4c796881268b39f0fa909',sgvl:'06010caf8e8b8acf82a24f092a54a175573d55e91deaaf6f98f4678ec1c65af5'}};
for(const [label,p]of Object.entries(pairs))for(const [name,rel,key]of [['TwinSafeGroup1.sal','TwinSafeGroup1/TwinSafeGroup1.sal','sal'],['GVL1.sgvl','GVLs/GVL1.sgvl','sgvl']]){const src=new URL(p.root+(label==='baseline'?rel:name),repo);if(hash(src)!==p[key])throw Error('Freeze mismatch '+label+name);const dst=new URL('fixtures/'+label+'/MEN001_Dyno/Safety_Dyno/'+rel,base);fs.mkdirSync(new URL('./',dst),{recursive:true});fs.copyFileSync(src,dst);}
fs.mkdirSync(new URL('sandbox/SafetyTests/test/helpers/',base),{recursive:true});
fs.cpSync(new URL('src/',repo),new URL('sandbox/SafetyTests/src/',base),{recursive:true});
fs.writeFileSync(new URL('sandbox/SafetyTests/package.json',base),' {"type":"module"}');
fs.writeFileSync(new URL('identities.json',base),JSON.stringify(pairs,null,2));
console.log('Three frozen pairs copied; runtime copied unchanged');
