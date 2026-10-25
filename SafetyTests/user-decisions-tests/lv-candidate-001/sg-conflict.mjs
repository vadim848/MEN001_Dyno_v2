import fs from 'node:fs';import assert from 'node:assert/strict';import {gzipSync} from 'node:zlib';
import {createSafeRunFixture as baseline} from '../../test/helpers/safe-run-source.js';
import {createSafeRunFixture as candidate} from './regression/SafetyTests/test/helpers/safe-run-source.js';
const reports=[];
for(const [source,fixture]of [['baseline',baseline],['candidate',candidate]]){
 const rows=[];
 for(const fault of [null,'in_ES_NC_1','in_InterLock_NC_2']){
 const x=fixture('Safe');x.sample({b_Step_RnD:true});x.advance(2100);const start=x.sample({in_Reset_PB:true});x.advance(520);
 const qualified=x.r.get('//RndPhysicalCompact/STATE_SG/RsOut');if(fault){x.sample({[fault]:false});x.advance(10);if(fault==='in_ES_NC_1'){assert.equal(x.get('estop'),false);assert.equal(x.r.get('//RndPhysicalCompact/STATE_SG/RsOut'),false);}assert.equal(x.get('unlock'),false);}
 assert.deepEqual(x.unbound(),[]);const row={fault,qualified,postFault:x.r.get('//RndPhysicalCompact/STATE_SG/RsOut')};rows.push(row);fs.writeFileSync(new URL('sg-'+source+'-'+(fault??'healthy')+'.json.gz',import.meta.url),gzipSync(JSON.stringify({source,start,row,scope:x.scope,frames:x.frames,limits:['Explicit conflicting phase component boundary before gesture; not reachability','Endpoint policy not invented; preserved SG producer availability compared']})));
 }
 reports.push({source,rows});
}
assert.deepEqual(reports[0].rows,reports[1].rows);fs.writeFileSync(new URL('SG_RESULTS.json',import.meta.url),JSON.stringify({status:'PASS',reports},null,2));console.log('SG conflict/fault preservation3/3 PASS');
