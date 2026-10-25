// v3 kill checks for new guards (model)
import {rt,toRun,gesture} from './run.mjs';
const boot=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);};
const toRnd=(r)=>{boot(r);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const restart=(r)=>{r.step(20);r.step(1,{in_Reset_PB:true});r.step(100);r.step(1,{in_Reset_PB:false});r.step(50);};
const S={
 rndEstop:r=>{toRnd(r);r.step(1,{in_ES_NC_1:false});r.step(12000);return `${r.ph()} C1=${+r.get('out_LV_C1')}`;},
 s12Estop:r=>{boot(r);r.plant=false;r.hold={in_LV_C1_FBK:false};gesture(r,{green:true,blue:true,ms:1100});r.step(30);r.step(1,{in_ES_NC_1:false});r.hold={};r.plant=true;r.step(50);return `${r.ph()} viol=${r.viol.length}`;},
 earlyRestart:r=>{toRun(r);r.step(1,{in_ES_NC_1:false});r.step(100);r.step(1,{in_ES_NC_1:true});restart(r);r.step(12000);return r.ph();},
 c1Stuck:r=>{toRnd(r);r.plant=false;r.hold={in_LV_C1_FBK:true};r.step(1,{in_ES_NC_1:false});r.step(12000);r.step(1,{in_ES_NC_1:true});restart(r);return `${r.ph()} C1FBK=${+r.get('in_LV_C1_FBK')}`;},
 estopHeld:r=>{toRnd(r);r.step(1,{in_ES_NC_1:false});r.step(12000);restart(r);return r.ph();},
 c1:r=>{toRnd(r);r.step(2100);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(998);r.step(1,{in_LV_Healthy_FBK:true});let b=false;for(let i=0;i<3000;i++){r.step(1);if(r.get('recRndC_SU')&&r.get('recRndC_SG'))b=true;}return 'SU&SG='+b;},
 c2:r=>{toRnd(r);r.step(2100);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(500);r.step(1,{in_LV_Healthy_FBK:true});let b=false;for(let i=0;i<4000;i++){r.step(1);if(r.get('b_Step12'))b=true;}return 'S12='+b;},
 blueSafe:r=>{boot(r);r.step(1,{in_InterLock_NC_1:false});r.step(10);r.step(1,{in_Relase_Door_PB:true});r.step(700);return 'UL='+(+r.get('out_Door_Unlock_Solonoeid'));},
 blueRnd:r=>{toRnd(r);r.step(1,{in_Relase_Door_PB:true});r.step(700);return 'UL='+(+r.get('out_Door_Unlock_Solonoeid'));},
};
const D=(b,p)=>({op:'deactivate-input',block:b,port:p});
const MUT=[['base',null,Object.keys(S)],
 ['STAGE_LVON.OrIn2',D('//Network6/STAGE_LVON','OrIn2'),['rndEstop']],
 ['STAGE_LVON.OrIn1',D('//Network6/STAGE_LVON','OrIn1'),['s12Estop']],
 ['FBAndLvEmg.AndIn2',D('//Network6/FBAndLvEmg','AndIn2'),['rndEstop']],
 ['FBOrS12Reset.OrIn2',D('//Network3/FBOrS12Reset','OrIn2'),['s12Estop']],
 ['G10.AndIn2',D('//Network3/G10_EXIT','AndIn2'),['estopHeld']],
 ['G10.AndIn3',D('//Network3/G10_EXIT','AndIn3'),['earlyRestart']],
 ['G10.AndIn4',D('//Network3/G10_EXIT','AndIn4'),['earlyRestart']],
 ['G10.AndIn5',D('//Network3/G10_EXIT','AndIn5'),['c1Stuck']],
 ['GATE_020.AndIn7',D('//RndPhysicalCompact/GATE_020','AndIn7'),['c1']],
 ['GATE_030.OrIn6',D('//RndPhysicalCompact/GATE_030','OrIn6'),['c2']],
 ['IL_SCOPE.OrIn1',D('//SafeResumption/IL_SCOPE','OrIn1'),['blueSafe']],
 ['IL_SCOPE.OrIn2',D('//SafeResumption/IL_SCOPE','OrIn2'),['blueRnd']],
];
for(const [n,m,sc] of MUT)for(const s of sc){const r=rt({mut:m?[m]:[]});console.log(n.padEnd(20),s.padEnd(13),S[s](r));}
