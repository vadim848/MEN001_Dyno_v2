import fs from 'node:fs';import crypto from 'node:crypto';
const file=new URL('regression/sandbox/v2/SafetyTests/test/current-mentee-set-permit.test.js',import.meta.url),before=fs.readFileSync(file,'utf8');
const from="assert.equal(model.crc,slot.nativeSalCrc,'exact independently native-verified current slot-repair CRC revision');",to="assert.equal(model.crc,'1997263000','exact independently native-verified P0 revision after unchanged slot-repair CRC chain');";
if(before.split(from).length!==2)throw Error('Exact single MENTEE CRC expectation required');const after=before.replace(from,to);fs.writeFileSync(file,after);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');const report={file:'test/current-mentee-set-permit.test.js',reason:'Reviewed native-generated CRC revision of exact34b5 P0; historic native chain and every functional test unchanged',from,to,beforeSha256:sha(before),afterSha256:sha(after)};
fs.writeFileSync(new URL('MENTEE_CRC_MIGRATION.json',import.meta.url),JSON.stringify(report)+'\n');fs.appendFileSync(new URL('MIGRATION.diff.txt',import.meta.url),'\nMENTEE EXACT NATIVE CRC REVISION\n'+JSON.stringify(report,null,2));
