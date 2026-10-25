// Targeted last-cycle probes on canonical E6v (stand semantics scanMs 1): latency chains of NEW backward reads on
// Emergency/SafetyFault paths, and 1-scan pulse capture. usage: node targeted.mjs
import {program} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
const P=program();const bl=P.blocks;const port=(fb,p)=>bl.find(b=>(b.instanceName??b.name)===fb).outputs.find(o=>o.name===p).path;
const sig={WD_EMG:port('WD_EMG','OrOut'),FBAnd37:port('FBAnd37','AndOut'),SF_SET:port('SF_SET','OrOut'),SF:port('SF','RsOut'),RD_PROT_SET:port('RD_PROT_SET','AndOut'),
 HLT_LV:port('HLT_LV','AndOut'),SF_ACK:port('SF_ACK','AndOut'),RELEASE:port('RELEASE','TonOut'),FBAnd35:port('FBAnd35','AndOut'),FBAnd29:port('FBAnd29','AndOut'),STATE_C:port('STATE_C','RsOut'),STATE_SG:port('STATE_SG','RsOut')};
const trace=(x,keys,from,n)=>{const rows=[];return rows;};
function run(label,x,stim,n,keys,{after}={}){const t0=x.t;const rows=[];
 for(let i=0;i<n;i++){const st=stim(i);if(st)x.set(st.set??{}),st.hold&&Object.assign(x.hold,st.hold),st.unhold&&st.unhold.forEach(k=>delete x.hold[k]);x.step();
  const s=x.log.at(-1);const r={t:x.t-t0,st:s.st.join('+'),stg:s.stg,fault:s.fault};for(const k of keys)r[k]=+x.r.get(sig[k]);rows.push(r);}
 const first=k=>rows.find(r=>r[k])?.t??null;const firstSt=v=>rows.find(r=>r.st.includes(v))?.t??null;
 const res={label,firstTrue:Object.fromEntries(keys.map(k=>[k,first(k)])),firstEMG:firstSt('EMG'),firstFault:rows.find(r=>r.fault)?.t??null,end:rows.at(-1)};
 if(after)res.check=after(rows,x);console.log(JSON.stringify(res));return res;}
const out=[];
// T1 watchdog C1 loss in steady R&D: hold C1 FBK false (plant drop) -> WD_EMG -> FBAnd37 -> FBEstop1 (EMG)
out.push(run('WD C1 FBK loss in steady R&D (level)',P.rnd(),i=>i===0?{hold:{in_LV_C1_FBK:false}}:null,1500,['WD_EMG','FBAnd37']));
out.push(run('WD C1 FBK loss in steady R&D (1-scan glitch)',P.rnd(),i=>i===0?{hold:{in_LV_C1_FBK:false}}:i===1?{unhold:['in_LV_C1_FBK']}:null,1500,['WD_EMG','FBAnd37']));
out.push(run('WD C2 FBK loss in steady Run (level)',P.run(),i=>i===0?{hold:{in_HV_C2_FBK:false}}:null,1500,['WD_EMG','FBAnd37']));
// T2 Run: 1-scan HV faulty pulse -> RD_PROT_SET pulse (RD_STO lag) -> linkHltRunLost -> SF_SET (next scan) -> SF latched
out.push(run('Run: in_HV_Faulty_FBK 1-scan pulse',P.run(),i=>i===0?{set:{in_HV_Faulty_FBK:true}}:i===1?{set:{in_HV_Faulty_FBK:false}}:null,3000,['RD_PROT_SET','SF_SET','SF'],
 {after:r=>({rdProtSetScans:r.filter(q=>q.RD_PROT_SET).length,sfLatchedAtEnd:!!r.at(-1).SF})}));
out.push(run('Run: in_LV_Faulty_FBK 1-scan pulse',P.run(),i=>i===0?{set:{in_LV_Faulty_FBK:true}}:i===1?{set:{in_LV_Faulty_FBK:false}}:null,3000,['RD_PROT_SET','SF_SET','SF'],
 {after:r=>({rdProtSetScans:r.filter(q=>q.RD_PROT_SET).length,sfLatchedAtEnd:!!r.at(-1).SF})}));
// T3 R&D: LV Healthy loss 1-scan pulse -> HLT_LV -> GATE_SG_SET (same scan) / STATE_C + SF_SET (next scan)
out.push(run('R&D: in_LV_Faulty_FBK 1-scan pulse',P.rnd(),i=>i===0?{set:{in_LV_Faulty_FBK:true}}:i===1?{set:{in_LV_Faulty_FBK:false}}:null,3000,['HLT_LV','STATE_SG','STATE_C','SF_SET','SF'],
 {after:r=>({sgAndCsameScan:r.filter(q=>q.STATE_SG&&q.STATE_C).length})}));
out.push(run('R&D: in_LV_Faulty_FBK level',P.rnd(),i=>i===0?{set:{in_LV_Faulty_FBK:true}}:null,4000,['HLT_LV','STATE_SG','STATE_C','SF_SET','SF'],
 {after:r=>({sgAndCsameScan:r.filter(q=>q.STATE_SG&&q.STATE_C).length})}));
// T4 EStop in Run: FBEstop1 same scan vs FBAnd35 (out_EStop_Status lag) -> FBAnd12 -> Step4
out.push(run('Run: EStop NC1 level',P.run(),i=>i===0?{set:{in_ES_NC_1:false}}:null,50,['FBAnd29','FBAnd35']));
import fs from 'node:fs';fs.writeFileSync(new URL('./targeted.out.json',import.meta.url),JSON.stringify(out,null,1));
