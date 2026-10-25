import {rt,toRun,gesture,trace} from './run.mjs';
// E2-02 race: Run, accepted green down, waiting C2_FBK OFF; Healthy loss at h; C2_FBK OFF at h+d
function race(opts,which,d){
 const r=rt(opts); toRun(r);
 r.plantC2=false; r.hold={in_HV_C2_FBK:true};
 gesture(r,{green:true}); r.step(300); // owner active, Ton1 0.2 done, C2 cmd off but FBK held on
 const k=which==='L'?'in_LV_Healthy_FBK':'in_HV_Healthy_FBK';
 r.step(1,{[k]:true}); for(let i=1;i<d;i++)r.step(1); r.hold={in_HV_C2_FBK:false};
 const tr=trace(r,3000,()=>'|C1='+r.get('out_LV_C1')); return {end:r.ph()+'|'+r.sts(),viol:r.viol.length,firstViol:r.viol[0],tr};
}
for(const [name,opts] of [['canonicalF1',{e2a:false,e2b:false,e2c:false,e2d:false}],['E2',{}],['E2 mut guard-noOwner',{mut:['guard-noOwner']}]])
 for(const w of ['L','H'])for(const d of [1,2,3,4,5]){const x=race(opts,w,d);console.log(name,w,d,'end',x.end,'viol',x.viol,x.firstViol||'',' TR',x.tr.slice(0,160));}
