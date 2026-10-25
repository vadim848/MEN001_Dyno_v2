// Reviewer G4 E1-f1: independent reproduction of Step4^Step12 race on a REAL lifecycle
// (declared initial Safe -> BOTH -> RnD -> BOTH launch -> Run; no phase seed after protocol start).
// Usage: MEN001_F1_ROOT=<root containing MEN001_Dyno/Safety_Dyno> node race-lifecycle.mjs <label>
const {createRndDownFixture}=await import('../../../tester/E1-f1/runners/lifecycle-source.js');
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
function wait(x,k,v,b=2500){const end=x.clock.timeMs+b;while(x.get(k)!==v&&x.clock.timeMs<end)x.sample();if(x.get(k)!==v)throw Error('missing '+k+'='+v);return x.clock.timeMs;}
function toRun(){const x=createRndDownFixture();
 x.sample(both);x.advance(1000);wait(x,'lv',true);x.sample({in_LV_C1_FBK:true});wait(x,'b_Step_RnD',true);x.sample(off);x.advance(2100);
 x.sample({in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_HV_C2_FBK:true,in_HV_Healthy_FBK:true});x.sample(both);x.advance(1000);
 wait(x,'SU',true);wait(x,'sto1',true);wait(x,'sto2',true);x.sample({in_LV_Healthy_FBK:false,in_HV_Healthy_FBK:false});wait(x,'b_Step3',true);x.sample(off);x.advance(2100);
 if(!x.get('b_Step3'))throw Error('no Run');return x;}
const ph=['b_Step1','b_Step2','b_Step3','b_Step4','b_Step5','b_Step6','b_Step12','b_Step_RnD'];
for(const releaseAt of [null,550,800])for(const loss of ['in_HV_Healthy_FBK','in_LV_Healthy_FBK'])for(let d=0;d<=7;d++){
 const x=toRun();const g=x.sample({in_Reset_PB:true});let ton=null;
 for(let i=0;i<1500;i++){if(releaseAt!=null&&x.clock.timeMs-g===releaseAt)x.sample({in_Reset_PB:false});else x.sample();if(ton==null&&x.get('//Network6/FBTon1/TonOut'))ton=x.clock.timeMs-g;if(ton!=null&&x.clock.timeMs-g>Math.max(ton+20,(releaseAt??0)+5))break;}
 x.advance(50);const pre=ph.filter(p=>x.get(p)).join('+')+'/ton='+x.get('//Network6/FBTon1/TonOut');
 x.sample({[loss]:true});let both2=false,lvInStep4=false;
 for(let s=1;s<=80;s++){if(s===d)x.sample({in_HV_C2_FBK:false});else x.sample();if(x.get('b_Step4')&&x.get('b_Step12'))both2=true;if(s>10&&x.get('b_Step4')&&x.get('lv'))lvInStep4=true;}
 console.log(process.argv[2],'release='+releaseAt,loss,'d='+d,'tonAt='+ton,'pre='+pre,'Step4&Step12='+both2,'final='+ph.filter(p=>x.get(p)).join('+'),'lvInStep4='+lvInStep4);
}
