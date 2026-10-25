import {fix as fix73} from './fix.mjs';import {fix74} from './comb.mjs';
import {cand,toRnd,toRun,boot,gesture} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/cand.mjs';
const V={base:null,both:m=>{fix73(m);fix74(m);}};
// sanity: phases reached
{const r=cand('E2d',V.both);toRun(r);console.log('toRun ->',r.ph(),'C2',+r.get('out_HV_C2'),'STO',+r.get('STO_DR1'));r.step(2100);gesture(r,{green:true});r.step(9000);console.log('Run->R&D ->',r.ph());r.step(2100);gesture(r,{green:true});r.step(5000);console.log('R&D->Safe ->',r.ph());}
{for(const vn of ['base','both']){const r=cand('E2d',V[vn]);boot(r);r.step(1,{inPLC_BypassC1C2:true});r.step(4000);const a=r.ph()+' C1'+(+r.get('out_LV_C1'))+' C2'+(+r.get('out_HV_C2'))+' STO'+(+r.get('STO_DR1'));r.step(1,{inPLC_BypassC1C2:false});r.step(9000);console.log('Config',vn,a,'-> exit',r.ph());}}
// E2d-COV-1 boundaries with combined
function cov(vn,off,ev){const r=cand('E2d',V[vn]);toRnd(r);r.step(2100);r.plantC2=false;r.hold={in_HV_C2_FBK:false};const P=r.t+1;r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});
 const u=P+1001;let c2=0,sto=0,e=null,run=false;for(let i=0;i<9500;i++){const n=r.t+1;if(n===P+1100)r.setInputs({in_Reset_PB:false,in_Relase_Door_PB:false});if(off!=null&&n===u+off)r.setInputs(ev);r.step(1);if(r.t>=u+off){if(r.get('out_HV_C2'))c2++;if(r.get('STO_DR1')||r.get('STO_DR2'))sto++;if(e==null&&!r.get('b_EStop_Ok'))e=r.t-(u+off);}if(r.get('b_Step3')&&r.statusRun)run=true;}
 return `C2 scans>=c: ${c2}, STO released scans>=c: ${sto}, EOk FALSE c+${e}, end ${r.ph()}`;}
for(const vn of ['base','both'])for(const off of [-3,-2,-1,0,1,50])for(const [en,ev] of [['NC1',{in_InterLock_NC_1:false}],['NC2',{in_InterLock_NC_2:false}],['PLC',{in_Estop_PLC:true}]])console.log('COV',vn,'c=u'+(off>=0?'+':'')+off,en,cov(vn,off,ev));
