import {createFullProgram,declareSafe} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/full-program-source.js';
// Reviewer control (E1-f1-adopt): same protocol with and without the IL episode, F1 vs MU24. Usage: node reviewer-il-control.mjs [F1|MU24]
const MU=process.argv[2]==='MU24';
const off={in_Reset_PB:false,in_Relase_Door_PB:false};
const attempts={BOTH:[{in_Reset_PB:true,in_Relase_Door_PB:true},1100,['out_LV_C1']],BLUE:[{in_Relase_Door_PB:true},700,['out_Door_Unlock_Solonoeid']]};
for(const il of [true,false])for(const [held,h] of [['green',{in_Reset_PB:true}],['blue',{in_Relase_Door_PB:true}]])for(const [an,[press,len,eff]] of Object.entries(attempts))for(const n of [1999,2001]){
 const x=createFullProgram();
 if(MU){const b=x.all.find(b=>b.path==='//RndPhysicalCompact/GATE_016');b.inputs.find(p=>p.name==='AndIn4').channelInterface='Deactivated';}
 declareSafe(x);const {r,s}=x;
 s(h,100); if(il){s({in_InterLock_NC_1:false},300);s({in_InterLock_NC_1:true},700);} else s({},1000);
 const unlockDuringHold=r.get('out_Door_Unlock_Solonoeid');
 s(off,n);const seen={};s(press);for(let i=0;i<len;i++){s();for(const e of eff)if(r.get(e))seen[e]=true;}
 console.log(MU?'MU24':'F1',il?'IL':'noIL',held,an,n,'accepted=',!!seen[eff[0]],'unlockWhileHeld=',unlockDuringHold);
}
