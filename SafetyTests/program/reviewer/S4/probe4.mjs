// v2-reviewer S4: consequences of surviving Config mutants (model evidence)
import {program,programFromModel} from '../../../test/helpers/catalog-program.js';
const P=program();const BY='inPLC_BypassC1C2';
const mut=port=>{const m=structuredClone(P.m);m.networks.flatMap(n=>n.blocks.flatMap(b=>b.inputs)).find(p=>p.path===port).channelInterface='Deactivated';return programFromModel(m,{...P.identity,label:'mut'},{});};
for(const [lbl,Q] of [['orig',P],['STAGE_LVON.OrIn3',mut('//Network6/STAGE_LVON/OrIn3')],['CFG_RST.OrIn2',mut('//Network3/CFG_RST/OrIn2')]]){
 const x=Q.safe();x.step({[BY]:true},1000);const a=x.t;x.step({in_ES_NC_1:false},10000);const e1=[x.status(),x.r.get('out_LV_C1'),x.r.get('out_HV_C2')];
 x.step({in_ES_NC_1:true,[BY]:false},500);x.restart();x.wait(5000);
 console.log(lbl,'EStop+10s st/C1/C2',e1.join('/'),'| after restart (Bypass FALSE) st',x.status(),'C1',x.r.get('out_LV_C1'),'C2',x.r.get('out_HV_C2'),'cfgActive',x.r.get('linkCfgActive'),'viol',x.viol.count);}
