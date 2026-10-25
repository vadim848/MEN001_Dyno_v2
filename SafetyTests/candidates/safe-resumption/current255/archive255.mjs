import fs from 'node:fs';
import crypto from 'node:crypto';
const base=new URL('./',import.meta.url),dest=new URL('current255/',base);
const expected={sal:'64fec23446e0c321b7e7a2b864b5f5bcfb440492ea76a26e94b7695205a14560',gvl:'1981d66fb889882a75346a58c789a5f03c9b4bd03f68d0fe01022d68c6838476'};
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(sha(new URL('TwinSafeGroup1.sal',base))!==expected.sal||sha(new URL('GVL1.sgvl',base))!==expected.gvl)throw Error('Frozen pair changed');
fs.mkdirSync(dest,{recursive:true});
const files={};for(const f of fs.readdirSync(base,{withFileTypes:true}).filter(f=>f.isFile())){fs.copyFileSync(new URL(f.name,base),new URL(f.name,dest));files[f.name]=sha(new URL(f.name,base));}
const result={revision:'reviewed partial255',frozen:expected,targetResults:{nativeBindings:'PASS',invariants:'PASS',rndRaw:{pass:69,fail:0},earlySto:{pass:88,fail:0},B1:{pass:2,fail:0},safeRun:{pass:13,fail:2},gapChecks:{pass:3,fail:0}},limits:['two Run invalid-short-chord failures retained','conditional lifecycle independent tester','full BOOT group native hardware unverified'],files};
fs.writeFileSync(new URL('RESULTS255.json',dest),JSON.stringify(result,null,2));console.log({snapshot:'current255',files:Object.keys(files).length,frozen:expected});
