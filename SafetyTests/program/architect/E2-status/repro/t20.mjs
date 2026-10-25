// v7: DIS-HOLD HV with b_Set_HV_C2_1 and legacy PLC (rows B/C/D of review x1), LV under Emergency, BOOT B6-1; mutants (model)
import {rt,toRun,gesture} from './run.mjs';
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const minOver=(r,sig,n)=>{let mn=1,fs=-1;for(let i=0;i<n;i++){r.step(1);if(!r.get(sig)){mn=0;if(fs<0)fs=i+1;}}return `min=${mn}${fs>0?' firstFALSE@+'+fs:''}`;};
const rndWithReq=(mut)=>{const r=rt({mut});toRun(r);gesture(r,{green:true});r.step(3000);r.step(2100);return r;};
const rows={
 B_rejectedPLC_coverOpen:(m)=>{const r=rndWithReq(m);r.setInputs({in_InterLock_NC_1:false});r.step(5);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});return minOver(r,'out_HV_Discharge_Request',3000);},
 C_RnD_EStop_PLC11:(m)=>{const r=rndWithReq(m);r.setInputs({in_ES_NC_1:false});r.step(1);r.setInputs({inPLC_RnD_Mode:true,inPLC_RnD_Mode_2:true});return minOver(r,'out_HV_Discharge_Request',3000)+' '+r.ph();},
 D_Safe_EStop_PLC10_LV:(m)=>{const r=rt({mut:m});boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);r.step(2100);gesture(r,{green:true});r.step(2000);r.setInputs({in_ES_NC_1:false});r.step(5);r.setInputs({inPLC_RnD_Mode:true});return minOver(r,'out_LV_Discharge_Request',3000)+' '+r.ph();},
 E_button_RnD_to_Run:(m)=>{const r=rndWithReq(m);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});let a=-1,off=-1,u=-1;for(let i=0;i<1100;i++){r.step(1);if(a<0&&r.get('recRndC_SU'))a=r.t;if(u<0&&r.get('out_HV_C2'))u=r.t;if(off<0&&!r.get('out_HV_Discharge_Request'))off=r.t;}return `a=0 u=+${u-a} reqOFF=+${off-a}`;}
};
for(const [n,m] of [['base',[]],['M FBAnd10.AndIn3 (EOk)',[D('//Network12/FBAnd10','AndIn3')]],['M FBAnd4.AndIn2 (cover)',[D('//Network12/FBAnd4','AndIn2')]],['M FBAnd91.AndIn4 (EOk)',[D('//Network2/FBAnd91','AndIn4')]],['M FBOr5.OrIn2',[D('//Network1/FBOr5','OrIn2')]]])
 for(const [k,f] of Object.entries(rows)){ if(n!=='base'&&!({'M FBAnd10.AndIn3 (EOk)':['C_RnD_EStop_PLC11'],'M FBAnd4.AndIn2 (cover)':['B_rejectedPLC_coverOpen'],'M FBAnd91.AndIn4 (EOk)':['D_Safe_EStop_PLC10_LV'],'M FBOr5.OrIn2':['E_button_RnD_to_Run']}[n]||[]).includes(k))continue; console.log(n.padEnd(26),k.padEnd(24),f(m)); }
// BOOT B6-1
const bootCase=(m,gOff,newRestart)=>{const r=rt({mut:m},{in_LV_C1_FBK:true});r.plant=false;r.hold={in_LV_C1_FBK:true};r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(gOff);r.hold={in_LV_C1_FBK:false};r.step(3000);const a=r.ph()+'/'+r.sts();if(newRestart){r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(20);}return a+(newRestart?' -> new Restart '+r.ph()+'/'+r.sts():'');};
for(const [n,m] of [['base',[]],['M Boot.AndIn4 (PrevG)',[D('//Network3/FBAndBootFbkOff','AndIn4')]],['M Boot.AndIn3 (!green)',[D('//Network3/FBAndBootFbkOff','AndIn3')]]])
 for(const g of [1,2000])console.log('BOOT',n.padEnd(24),'FBK OFF at r+'+g,'3 s later:',bootCase(m,g,n==='base'));
