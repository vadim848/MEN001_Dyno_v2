import {program,programFromModel} from '../../../test/helpers/catalog-program.js';
import fs from 'node:fs';
const P0=program();const m=structuredClone(P0.m);
for(const v of m.variables)if(['in_LV_C1_FBK','in_HV_C2_FBK'].includes(v.name))v.targetPorts=v.targetPorts.filter(p=>!p.startsWith('//Network1/FBK_OFF/'));
const PM=programFromModel(m,{...P0.identity,label:'mut'});const out=[];
for(const [k,P] of [['base',P0],['noFbkFix',PM]])for(const [from,mk] of [['Safe',()=>P.safe()],['R&D',()=>P.rnd()]]){
 const x=mk();x.step({in_Estop_PLC:true},300);x.step({in_Estop_PLC:false});let t0=x.t;while(x.t-t0<15000)x.step();
 x.hold.in_LV_C1_FBK=true;x.wait(500);x.restart();x.wait(1000);
 const eok=x.r.get('b_EStop_Ok');out.push(`${k} from ${from}: C1_FBK ON whole press -> EOk=${eok} status=${x.status()} stages=${x.stages()}`);
 delete x.hold.in_LV_C1_FBK;x.wait(1000);out.push(`   after FBK OFF, no press: EOk=${x.r.get('b_EStop_Ok')} status=${x.status()}`);
 x.restart();x.wait(500);out.push(`   new press: status=${x.status()} viol=${x.viol.count}`);}
console.log(out.join('\n'));fs.writeFileSync(new URL('./probe4.out.txt',import.meta.url),out.join('\n')+'\n');
