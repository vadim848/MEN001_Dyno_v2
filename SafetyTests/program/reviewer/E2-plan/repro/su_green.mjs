import {make} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/program/architect/E2-status/repro/h.mjs';
function run(label, holdC2Off, act){
 const {r}=make({in_LV_Healthy_FBK:true});
 r.plant=false;
 const st=(n=1,inp)=>{ if(inp) r.setInputs(inp); for(let i=0;i<n;i++){ const p={in_LV_C1_FBK:r.get('out_LV_C1'),in_STO_DR1_FBK:!r.get('STO_DR1'),in_STO_DR2_FBK:!r.get('STO_DR2')}; if(!holdC2Off) p.in_HV_C2_FBK=r.get('out_HV_C2'); else p.in_HV_C2_FBK=false; r.setInputs(p); r.scan(1); r.t++; } };
 st(10); st(1,{in_Reset_PB:true}); st(1,{in_Reset_PB:false}); st(2100);
 st(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); st(1100); st(1,{in_Reset_PB:false,in_Relase_Door_PB:false}); st(2500);
 const a=r.ph();
 act(r,st);
 return label+' : afterSafe->RnD='+a;
}
console.log(run('SU+green', true, (r,st)=>{
  st(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); st(1100); st(1,{in_Reset_PB:false,in_Relase_Door_PB:false});
  console.log(' SU after both', r.get('recRndC_SU'), 'STO1', r.get('STO_DR1'), 'C2', r.get('out_HV_C2'), r.ph());
  st(3000);
  console.log(' SU after 3s', r.get('recRndC_SU'), 'C', r.get('recRndC_C'), 'A', r.get('recRndC_A'));
  let sg=false, c1off=false;
  st(1,{in_Reset_PB:true}); for(let i=0;i<700;i++){ st(1); if(r.get('recRndC_SG')) sg=true; if(!r.get('out_LV_C1')) c1off=true;} st(1,{in_Reset_PB:false}); st(500);
  console.log(' green in SU: SG ever=',sg,' C1 ever off=',c1off, 'SU',r.get('recRndC_SU'), r.ph(), 'linkGreenQ', r.get('linkRndGreenQualified'));
}));
console.log(run('SG+both', false, (r,st)=>{
  // start R&D->Safe by green but hold C1_FBK on to keep SG active
  st(1,{in_Reset_PB:true}); st(600); st(1,{in_Reset_PB:false});
  console.log(' SG', r.get('recRndC_SG'), r.ph());
  st(3000);
  let su=false;
  st(1,{in_Reset_PB:true,in_Relase_Door_PB:true}); for(let i=0;i<1200;i++){ st(1); if(r.get('recRndC_SU')) su=true;} st(1,{in_Reset_PB:false,in_Relase_Door_PB:false});
  console.log(' both during SG/after: SU ever=',su, r.ph());
}));
