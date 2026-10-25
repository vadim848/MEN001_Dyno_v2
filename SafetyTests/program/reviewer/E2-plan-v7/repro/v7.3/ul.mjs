import {cand,boot} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
import {V} from './v76.mjs';
for(const vn of ['base','v76'])for(const f of [true,false]){const r=cand('E2d-v7.5',V[vn]);boot(r);r.step(1,{in_LV_Faulty_FBK:f});const P=r.t+1;r.step(1,{in_Relase_Door_PB:true});let on=null,off=null;for(let i=0;i<1500;i++){r.step(1);const u=r.get('out_Door_Unlock_Solonoeid');if(u&&on==null)on=r.t-P;if(!u&&on!=null&&off==null)off=r.t-P;if(i===700)r.setInputs({in_Relase_Door_PB:false});}
 console.log(vn,'LV Faulty',f,'Unlock on P+'+on,'off P+'+off);}
