// Reviewer v7 x9: B6-1 boundary - FBK OFF at g relative to Restart release scan r (g in r-50..r+2), press 100 ms. Model.
const base='file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/';
const {rt}=await import(base+'run.mjs');
for(const [name,fbk] of [['C1',{in_LV_C1_FBK:true}],['C2',{in_HV_C2_FBK:true}]])for(const k of [-50,-1,0,1,2]){
 const r=rt({},fbk);r.plant=false;r.plantC2=false;r.hold={...fbk};r.step(400);
 const off={in_LV_C1_FBK:false,in_HV_C2_FBK:false};
 // press at p, release scan r=p+101 (green FALSE applied at r)
 r.step(1,{in_Reset_PB:true});for(let i=0;i<100;i++){ if(k<0 && i===100+k) r.hold=off; r.step(1);} 
 if(k===0)r.hold=off; r.step(1,{in_Reset_PB:false});
 if(k>0){ if(k>1)r.step(k-1); r.hold=off; }
 let first='';for(let i=0;i<3000;i++){r.step(1);const s=r.ph()+'/'+r.sts();if(!first&&s!=='none/EMG')first=s+'@+'+(i+1);}
 console.log(name,'FBK OFF at r'+(k>=0?'+':'')+k,'->',first||'stays none/EMG (3 s)');
}
