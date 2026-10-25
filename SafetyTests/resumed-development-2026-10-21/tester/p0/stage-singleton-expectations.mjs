import fs from 'node:fs';import crypto from 'node:crypto';
const f=new URL('regression/sandbox/v2/SafetyTests/test/current-native-structure.test.js',import.meta.url),old=fs.readFileSync(f,'utf8');
const ids=['75c1aadc-f40e-4733-9665-f84f651b8818','dbfc275a-be07-4cef-a780-9858f2b5c332','9fd7707a-7faf-4ac6-a47a-974e69b1a441','d8937929-52e1-4627-95af-7ebca1f4692a','4a326aa6-0f35-4479-a964-fd2c9f6875b1','197c75c7-440c-4511-8ba6-6a58853be6da'];
const needle="for(const id of r.preservedUsageIds)assert.ok(ids.has(id),'preserved usage '+id);";
if(!old.includes(needle))throw Error('Exact singleton expectation not found');
const neo='const p0RetiredUsageIds=new Set('+JSON.stringify(ids)+'); // Only two retired complementary Prev Reset records and their wrappers, approved P0c.\n'+old.replace(needle,"for(const id of r.preservedUsageIds)assert.equal(ids.has(id),!p0RetiredUsageIds.has(id),'preserved or exactly retired P0 usage '+id);");
fs.writeFileSync(f,neo);fs.appendFileSync(new URL('MIGRATION.diff.txt',import.meta.url),'\nNATIVE SINGLETON EXPECTATION EXTENSION\nBEFORE\n'+old+'\nAFTER\n'+neo);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
fs.writeFileSync(new URL('NATIVE_MIGRATION.json',import.meta.url),JSON.stringify({file:'test/current-native-structure.test.js',retiredUsageIds:ids,reason:'Exact two PrevG/PrevB Reset usage record retirements and native wrappers; every other original usage/container preservation and duplicate-container mutation remains enforced.',beforeSha256:sha(old),afterSha256:sha(neo)})+'\n');
