import {make,phases} from './sim.mjs';
for(const holdGreen of [true,false])for(let d=1;d<=7;d++){
 const {r}=make('F1');const ph=()=>phases.filter(p=>r.get(p)).join('+');
 r.setInputs({in_Reset_PB:true});let t=0,tonAt=null;
 while(t<3000){r.scan(1);t++;if(tonAt==null&&r.get('//Network6/FBTon1/TonOut'))tonAt=t;if(tonAt!=null&&t>tonAt+20)break;}
 if(!holdGreen)r.setInputs({in_Reset_PB:false});
 for(let i=0;i<50;i++)r.scan(1);
 const pre=ph()+'/ton='+r.get('//Network6/FBTon1/TonOut');
 r.setInputs({in_HV_Healthy_FBK:true});let both=false,lv=false;
 for(let s=1;s<=60;s++){if(s===d)r.setInputs({in_HV_C2_FBK:false});r.scan(1);if(r.get('b_Step4')&&r.get('b_Step12'))both=true;if(r.get('b_Step4')&&r.get('out_LV_C1')&&s>10)lv=true;}
 console.log('holdGreen='+holdGreen,'d='+d,'tonAt='+tonAt,'pre='+pre,'both='+both,'final='+ph(),'out_LV_C1 in Step4 after s10='+lv, 'b_Set_LV_C1_1='+r.get('b_Set_LV_C1_1'));
}
