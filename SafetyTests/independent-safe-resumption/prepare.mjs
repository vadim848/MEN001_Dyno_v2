import fs from 'node:fs';
import crypto from 'node:crypto';
const base=new URL('./',import.meta.url),repo=new URL('../',base);
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pairs=[['TwinSafeGroup1.sal','TwinSafeGroup1/TwinSafeGroup1.sal','64fec23446e0c321b7e7a2b864b5f5bcfb440492ea76a26e94b7695205a14560'],['GVL1.sgvl','GVLs/GVL1.sgvl','1981d66fb889882a75346a58c789a5f03c9b4bd03f68d0fe01022d68c6838476']];
for(const [name,,expected]of pairs)if(digest(new URL('candidates/safe-resumption/'+name,repo))!==expected)throw Error('Frozen source identity mismatch '+name);
for(const [name,target]of pairs){const dst=new URL('sandbox/MEN001_Dyno/Safety_Dyno/'+target,base);fs.mkdirSync(new URL('./',dst),{recursive:true});fs.copyFileSync(new URL('candidates/safe-resumption/'+name,repo),dst);}
fs.mkdirSync(new URL('sandbox/SafetyTests/test/helpers/',base),{recursive:true});
fs.cpSync(new URL('src/',repo),new URL('sandbox/SafetyTests/src/',base),{recursive:true});
const helper=new URL('sandbox/SafetyTests/test/helpers/safe-run-source.js',base);
const original=fs.readFileSync(new URL('test/helpers/safe-run-source.js',repo),'utf8');
const replacements=[['//Network2/FBAnd10/AndOut','//RndPhysicalCompact/BOTH/TonOut'],['//Network2/FBTon3/TonOut','//RndPhysicalCompact/BOTH/TonOut'],['//Network2/FBTon3/TonIn','//RndPhysicalCompact/BOTH/TonIn']];
let adapted=original;for(const [from,to]of replacements)adapted=adapted.replaceAll(from,to);
fs.writeFileSync(helper,adapted);
fs.writeFileSync(new URL('sandbox/SafetyTests/package.json',base),JSON.stringify({type:'module'}));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const hashes=fs.readdirSync(new URL('sandbox/SafetyTests/src/',base)).filter(x=>x.endsWith('.js')).map(name=>({name,sha256:hash(fs.readFileSync(new URL('sandbox/SafetyTests/src/'+name,base)))}));
fs.writeFileSync(new URL('harness-identity.json',base),JSON.stringify({originalHelperSha256:hash(original),adaptedHelperSha256:hash(adapted),observerMappings:replacements,sourceCopies:hashes,limits:['Observer bindings adapted; assertions unchanged','No FinishUp mapping','Production runtime sources copied unchanged']},null,2));
console.log(hash(adapted));
