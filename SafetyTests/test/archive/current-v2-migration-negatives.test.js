import test from'node:test';import assert from'node:assert/strict';import * as V2 from'../helpers/v2-structural.js';
const block=path=>V2.now.networks.flatMap(n=>n.blocks).find(b=>b.path===path);
function changed(object,key,value,check){const original=object[key];try{object[key]=value;assert.throws(check,'unapproved mutation must be rejected');}finally{object[key]=original;}}
test('V2 DELTA negative: unlisted wire bypass rejected',()=>changed(V2.now.bindingAudit,'edges',[...V2.now.bindingAudit.edges,{from:'//Network1/FBOr18/OrOut',to:'//Network1/FBRs2/Set'}],V2.wires));
test('V2 DELTA negative: native retained port ID mutation rejected',()=>changed(block('//Network1/FBAndSto1SetPermit').inputs[0],'Id','unapproved-port-id',V2.ports));
test('V2 DELTA negative: early STO contact inversion rejected',()=>changed(block('//Network1/FBAndSto1SetPermit').inputs[0],'deactivate1','Make Contact (NO)',V2.early));
test('V2 DELTA negative: unexpected timer value rejected',()=>changed(block('//RndPhysicalCompact/BLUE'),'parameters',[],V2.timers));
test('V2 DELTA negative: moved And15 after Safe publisher rejected',()=>changed(block('//Network12/FBAnd15'),'orderOfExecution',21,V2.orders));
test('V2 DELTA negative: output alias source mapping mutation rejected',()=>{const v=V2.now.variables.find(v=>v.name==='out_Door_Unlock_Solonoeid');changed(v,'sourcePorts',['//Network1/FBRs6/RsOut'],V2.aliases);});
