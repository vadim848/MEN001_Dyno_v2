import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const base=new URL('./',import.meta.url);
const original=fs.readFileSync(new URL('../test/helpers/safe-run-source.js',base),'utf8');
const pairs=JSON.parse(fs.readFileSync(new URL('identities.json',base))),reports=[];
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const source of ['prior','candidate']){
 const prefix='./fixtures/'+source+'/MEN001_Dyno/Safety_Dyno/';
 for(const [rel,key]of [['TwinSafeGroup1/TwinSafeGroup1.sal','sal'],['GVLs/GVL1.sgvl','sgvl']])assert.equal(digest(new URL(prefix+rel,base)),pairs[source][key]);
 let helper=original.replaceAll('../../src/','./sandbox/SafetyTests/src/').replaceAll('../../../MEN001_Dyno/Safety_Dyno/',prefix);
 for(const [a,b]of [['//Network2/FBAnd10/AndOut','//RndPhysicalCompact/BOTH/TonOut'],['//Network2/FBTon3/TonOut','//RndPhysicalCompact/BOTH/TonOut'],['//Network2/FBTon3/TonIn','//RndPhysicalCompact/BOTH/TonIn']])helper=helper.replaceAll(a,b);
 const name='conflict-helper-'+source+'.mjs';fs.writeFileSync(new URL(name,base),helper);
 const {createSafeRunFixture}=await import(new URL(name,base));
 const cases=[];
 for(const fault of [null,'in_ES_NC_1','in_InterLock_NC_2']){
  const x=createSafeRunFixture('Safe',{scanMs:1});
  // Explicit simultaneous phase component boundary. Network3 is excluded by
  // reviewed helper; this is producer availability, not a reachable phase trace.
  x.sample({b_Step_RnD:true});x.advance(2100);
  const t=x.sample({in_Reset_PB:true});x.advance(520);
  const sg=x.r.get('//RndPhysicalCompact/STATE_SG/RsOut');
  if(fault){x.sample({[fault]:false});x.advance(10);if(fault==='in_ES_NC_1'){assert.equal(x.get('estop'),false);assert.equal(x.r.get('//RndPhysicalCompact/STATE_SG/RsOut'),false);}assert.equal(x.get('unlock'),false);}
  assert.deepEqual(x.unbound(),[]);
  const record={source,fault,scope:x.scope,declaredConflict:{Safe:true,RnD:true,kind:'Typed external phase boundary; no onehot/reachability claim'},qualificationStart:t,qualifiedSgAvailability:sg,postFaultSg:x.r.get('//RndPhysicalCompact/STATE_SG/RsOut'),frames:x.frames};
  fs.writeFileSync(new URL('conflict-'+source+'-'+(fault??'healthy')+'.json',base),JSON.stringify(record,null,2));cases.push({fault,qualifiedSgAvailability:sg,postFaultSg:record.postFaultSg});
 }
 reports.push({source,helperSha256:digest(new URL(name,base)),cases});
}
fs.writeFileSync(new URL('conflict-results.json',base),JSON.stringify({status:'Changed conflict reaction requires review; no normative endpoint invented',reports},null,2));console.log(reports);
