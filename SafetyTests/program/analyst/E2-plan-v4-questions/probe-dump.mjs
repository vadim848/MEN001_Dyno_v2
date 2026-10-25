// Analyst probe: dump inputs of N3/FBAnd1 (g1) and N1/FBEstop1 in the E2 v4 model stack (diagnostic).
import {build} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/proto.mjs';
const {m}=build({});
for(const p of ['//Network3/FBAnd1','//Network1/FBEstop1','//Network1/FBAnd1']){
 const b=m.networks.flatMap(n=>n.blocks).find(x=>x.path===p);
 console.log(p,b.functionName);
 for(const i of b.inputs)console.log('  ',i.name,i.channelInterface,i.deactivate1??'',JSON.stringify(i.globals.map(g=>g.resolvedName)),JSON.stringify(i.sources));
}
