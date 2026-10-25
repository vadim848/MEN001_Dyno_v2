// Kill check for new v2 guard mutations (model). Each: mutation, scenario, expected-vs-mutant observable.
import {rt,toRun,gesture} from './run.mjs';
const toRnd=(r)=>{r.step(10);r.step(1,{in_Reset_PB:true});r.step(1,{in_Reset_PB:false});r.step(2100);gesture(r,{green:true,blue:true,ms:1100});r.step(2500);};
const S={
 runIL:(r)=>{toRun(r);r.step(1,{in_InterLock_NC_1:false});r.step(12000);return `${r.ph()} EOk=${r.get('b_EStop_Ok')} C2=${r.get('out_HV_C2')}`;},
 downIL:(r)=>{toRun(r);gesture(r,{green:true});r.step(1,{in_InterLock_NC_1:false});r.step(3000);return `${r.ph()} EOk=${r.get('b_EStop_Ok')}`;},
 suIL:(r)=>{r.plantC2=false;r.hold={in_HV_C2_FBK:false};toRnd(r);gesture(r,{green:true,blue:true,ms:1100});r.step(50);r.step(1,{in_InterLock_NC_1:false});r.step(12000);return `${r.ph()} EOk=${r.get('b_EStop_Ok')} STO1=${r.get('STO_DR1')} C2=${r.get('out_HV_C2')}`;},
 rndBothOpen:(r)=>{toRnd(r);r.step(1,{in_InterLock_NC_1:false});r.step(10);r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});r.step(1500);r.step(1,{in_InterLock_NC_1:true});r.step(1500);return `${r.ph()} SU=${r.get('recRndC_SU')} STO1=${r.get('STO_DR1')}`;},
 runDecoder:(r)=>{toRun(r);r.step(1,{in_ES_NC_1:false});r.step(3);return `viol=${r.viol.length} ${r.viol[0]||''}`;},
 hvRun:(r)=>{toRun(r);r.step(1,{in_HV_Healthy_FBK:false});r.step(100);return r.ph();},
 conn:(r)=>{toRnd(r);r.step(1,{in_LV_Connector_Interlock:false});r.step(20);return `EOk=${r.get('b_EStop_Ok')}`;},
};
const MUT=[
 ['base',null,['runIL','downIL','suIL','rndBothOpen','runDecoder','conn']],
 ['FBOrIlRunOk.OrIn3',{op:'deactivate-input',block:'//Network1/FBOrIlRunOk',port:'OrIn3'},['downIL']],
 ['FBAndNotRunSu.AndIn2',{op:'deactivate-input',block:'//Network1/FBAndNotRunSu',port:'AndIn2'},['suIL']],
 ['FBAndSuEmg.AndIn1',{op:'deactivate-input',block:'//Network6/FBAndSuEmg',port:'AndIn1'},['runDecoder']],
 ['FBOrStep4.OrIn2',{op:'deactivate-input',block:'//Network6/FBOrStep4',port:'OrIn2'},['suIL']],
 ['FBOr13.OrIn2',{op:'deactivate-input',block:'//Network3/FBOr13',port:'OrIn2'},['suIL']],
 ['HEALTHY_OK.AndIn3',{op:'deactivate-input',block:'//Network6/HEALTHY_OK',port:'AndIn3'},['runIL']],
 ['HEALTHY_OK.AndIn2 inv',{op:'invert-contact',block:'//Network6/HEALTHY_OK',port:'AndIn2'},['hvRun']],
 ['GATE_030.OrIn5',{op:'deactivate-input',block:'//RndPhysicalCompact/GATE_030',port:'OrIn5'},['rndBothOpen']],
 ['GATE_020.AndIn6',{op:'deactivate-input',block:'//RndPhysicalCompact/GATE_020',port:'AndIn6'},['rndBothOpen']],
 ['DEC_RUN.AndIn2',{op:'deactivate-input',block:'//Network3/DEC_RUN',port:'AndIn2'},['runDecoder']],
 ['FBAnd1.AndIn4 (conn)',{op:'deactivate-input',block:'//Network1/FBAnd1',port:'AndIn4'},['conn']],
];
for(const [name,mm,sc] of MUT)for(const s of sc){const r=rt({mut:mm?[mm]:[]});console.log(name.padEnd(24),s.padEnd(12),S[s](r));}
