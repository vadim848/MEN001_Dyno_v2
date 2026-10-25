// Reviewer v7 (rerun on architect v7 proto) x4: EMG6-01-BOOT on architect's v6 model - FBK goes OFF after Restart WITHOUT a new Restart. Model.
import {rt} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/run.mjs';
for(const [name,fbk] of [['C1_FBK',{in_LV_C1_FBK:true}],['C2_FBK',{in_HV_C2_FBK:true}],['both',{in_LV_C1_FBK:true,in_HV_C2_FBK:true}]])
for(const gOff of ['r+1','r+2000','never']){
 const r=rt({},fbk);r.plant=false;r.plantC2=false;r.hold={...fbk};r.step(400);
 r.step(1,{in_Reset_PB:true});const pr=r.t;r.step(100);r.step(1,{in_Reset_PB:false});const rr=r.t;
 if(gOff==='r+2000')r.step(1999);
 const at50=r.ph()+'/'+r.sts();
 if(gOff!=='never')r.hold={in_LV_C1_FBK:false,in_HV_C2_FBK:false};
 let first='';for(let i=0;i<3000;i++){r.step(1);const s=r.ph()+'/'+r.sts();if(!first&&s!=='none/EMG')first=`${s} at g+${i+1}`;}
 console.log(`${name} FBK OFF at ${gOff}: before g ${at50}; after g without new Restart (3000 ms): ${first||'stays none/EMG'}  EOk=${+r.get('b_EStop_Ok')}`);
}
