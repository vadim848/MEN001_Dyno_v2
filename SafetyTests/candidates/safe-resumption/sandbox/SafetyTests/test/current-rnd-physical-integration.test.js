import test,{after} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseSalFile } from "../src/sal-parser.js";
import { physicalRndSource } from "./helpers/physical-rnd-source.js";
const model=parseSalFile(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal",import.meta.url));
const evidence=[],scopes=new Map();
function scenario(name,dt,body,options) {
  test(`RNDPHYS ${name} fixed${dt}`,()=>{
    const x=physicalRndSource(model,dt,options),checks=[],times={};scopes.set(dt,x.scope);
    const e=(label,actual,expected)=>checks.push({label,actual,expected});
    body(x,e,times);
    if(model.networks.some(n=>n.name==="RndPhysicalCompact"))e("adapter Error stub observation only; native/group fault semantics remain unverified",x.frames.some(f=>f.internal?.windowError),false);
    e("no unresolved input in demanded command dependency cone",x.observed().commandConeUnconnected.length,0);
    const row={name,scanMs:dt,times,checks,transitions:x.transitions,rises:{...x.rises},
      status:checks.some(c=>c.actual!==c.expected)?"FAIL":"PASS"};evidence.push(row);
    assert.deepEqual(checks.filter(c=>c.actual!==c.expected),[],JSON.stringify(row.checks));
  });
}
after(()=>{if(process.env.MEN001_RND_EVIDENCE_PATH)fs.writeFileSync(process.env.MEN001_RND_EVIDENCE_PATH,JSON.stringify({scopes:[...scopes.values()],cases:evidence}));});
const noActions=(x,from=0)=>x.frames.slice(from).some(f=>f.signals.up||f.signals.down||f.signals.blue||f.signals.unlock);
const hold=(first,value=true)=>({[first==="green"?"in_Reset_PB":"in_Relase_Door_PB"]:value});
const both={in_Reset_PB:true,in_Relase_Door_PB:true},off={in_Reset_PB:false,in_Relase_Door_PB:false};
for(const first of ["green","blue"]) {
  for(const dt of [1,2,5,10])for(const delta of [250-dt,250,250+dt])scenario(`${first} window${delta}`,dt,(x,e,t)=>{
    t.first=x.sample(hold(first));t.second=x.edgeAfter(t.first,delta,both);
    e("dispatcher actual observed delta",t.second-t.first,delta);
    x.advance(1000-dt);e("no command before complete BOTH interval",noActions(x),false);
    x.sample();t.threshold=x.clock.timeMs;
    e("existing up request at full BOTH threshold",x.get("up"),delta<=250);
    x.advance(2*dt);e("actual HV after known old-consumer propagation",x.get("hv"),delta<=250);
    e("no green/blue command from a chord",x.any("down")||x.any("blue")||x.any("unlock"),false);
    e("up request rise count",x.rises.up,delta<=250?1:0);
    e("actual HV rise count",x.rises.hv,delta<=250?1:0);
  });
  scenario(`${first} single threshold`,1,(x,e,t)=>{
    t.first=x.sample(hold(first));x.advance(499);e("no single before500",noActions(x),false);
    x.sample();t.qualified=x.clock.timeMs;
    // Old source consumers may execute before their TON;500 is a minimum,
    // not a requirement for FALSE at500. Observe the factual next scan too.
    const at500=x.get(first==="green"?"down":"blue");x.sample();
    e("single request qualified by existing one-scan consumer lag",at500||x.get(first==="green"?"down":"blue"),true);
    if(first==="blue"){
      x.sample(); // Existing Or4/RS6 grant executes before the old Network12 blue producer: second propagation scan.
      t.actualGrant=x.clock.timeMs;e("actual unlock after existing grant-latch propagation",x.get("unlock"),true);
    }
  });
  for(const delta of [300,500,600])scenario(`${first} late${delta}`,1,(x,e,t)=>{
    t.first=x.sample(hold(first));t.second=x.edgeAfter(t.first,delta,both);x.advance(1200);
    e("late second cannot create retrospective up",x.any("up"),false);
    if(delta===300)e("late before single acceptance consumes attempt without any single",x.any("down")||x.any("blue")||x.any("unlock"),false);
    if(first==="green"&&delta>=500)e("qualified green request survives late second",x.get("down"),true);
    if(first==="blue"&&delta>=500){
      e("green still forbids visible unlock",x.get("unlock"),false);
      const mark=x.frames.length;x.sample({in_Reset_PB:false});x.advance(700);
      e("consumed blue authorization cannot reappear while blue remains held",x.frames.slice(mark).some(f=>f.signals.blue||f.signals.unlock),false);
    }
  });
  scenario(`${first} primary swap without sampled both-off`,1,(x,e,t)=>{
    t.first=x.sample(hold(first));x.advance(99);x.sample(first==="green"?{in_Reset_PB:false,in_Relase_Door_PB:true}:{in_Reset_PB:true,in_Relase_Door_PB:false});
    x.advance(1200);e("swap cannot produce a new command before both released",noActions(x),false);
  });
  scenario(`${first} piano then held primary without release`,1,(x,e,t)=>{
    t.first=x.sample(hold(first));
    for(let i=0;i<6;i++){x.advance(99);x.sample(i%2?{in_Reset_PB:true,in_Relase_Door_PB:false}:{in_Reset_PB:false,in_Relase_Door_PB:true});}
    x.advance(1200);e("piano cannot arm final held single",noActions(x),false);
  });
  scenario(`${first} chord flicker requires fresh1000 and never degrades`,1,(x,e,t)=>{
    t.first=x.sample(hold(first));t.second=x.edgeAfter(t.first,100,both);x.advance(600);
    x.sample(first==="green"?{in_Relase_Door_PB:false}:{in_Reset_PB:false});t.restored=x.sample(both);
    x.advance(999);e("no up before full restarted1000",x.any("up"),false);
    e("flicker never becomes single",x.any("down")||x.any("blue")||x.any("unlock"),false);
    x.sample();e("fresh continuous1000 still permits up",x.get("up"),true);
  });
  scenario(`${first} short neutral cannot rearm`,1,(x,e,t)=>{
    t.first=x.sample(hold(first));t.second=x.edgeAfter(t.first,100,both);x.advance(1002);
    e("first actual up/HV positive",x.get("up")&&x.get("hv"),true);
    x.sample(off);x.advance(100);x.sample(both);x.advance(1100);
    e("no second up request edge before complete release filter",x.rises.up,1);
    if(model.networks.some(n=>n.name==="RndPhysicalCompact"))e("no second native FinishUp acceptance in held request interval",x.frames.filter(f=>f.internal.finishUp).length,1);
  });
  scenario(`${first} full release permits a fresh single after blue cycle`,1,(x,e,t)=>{
    t.first=x.sample({in_Relase_Door_PB:true});x.advance(502);e("qualified blue plus real grant-latch control",x.get("blue")&&x.get("unlock"),true);
    x.sample(off);x.advance(2000);t.next=x.sample(hold(first));x.advance(499);
    const mark=x.frames.filter(f=>f.timeMs>=t.next);e("fresh full release does not bypass single500",mark.some(f=>f.signals.up||f.signals.down||f.signals.blue||f.signals.unlock),false);
    x.advance(2);e("new full qualification succeeds",x.get(first==="green"?"down":"blue"),true);
  });
}
for(const first of ["green","blue"])scenario(`held-at-RnD-entry ${first}`,1,(x,e)=>{
  x.advance(1200);e("held at entry never creates command by elapsed time",noActions(x),false);
},{entryButtons:hold(first)});

scenario("green request retained after release until explicit phase exit",1,(x,e,t)=>{
  t.first=x.sample({in_Reset_PB:true});x.advance(501);e("green actual request positive",x.get("down"),true);
  const mark=x.frames.length;x.sample(off);x.advance(1000);
  e("accepted downstream level not cancelled by physical release",x.frames.slice(mark).every(f=>f.signals.down),true);
  e("actual LV removal consumer executed",x.get("lv"),false);
  x.sample({b_Step_RnD:false});e("explicit mode ownership boundary ends request",x.get("down"),false);
});
scenario("up request retained after release until explicit phase exit",1,(x,e,t)=>{
  t.first=x.sample(both);x.advance(1002);e("actual up/HV positive",x.get("up")&&x.get("hv"),true);
  const mark=x.frames.length;x.sample(off);x.advance(1000);
  e("accepted up request not cancelled by physical release",x.frames.slice(mark).every(f=>f.signals.up),true);
  x.sample({b_Step_RnD:false});e("explicit mode ownership boundary ends request",x.get("up"),false);
});
scenario("reentry with held chord requires new release",1,(x,e)=>{
  x.sample(both);x.advance(1002);x.sample({b_Step_RnD:false});
  const mark=x.frames.length,entry=x.sample({b_Step_RnD:true});x.advance(1500);
  e("observed interval includes the RnD entry sample",x.frames[mark]?.timeMs,entry);
  e("entry frame observes the asserted RnD boundary",x.frames[mark]?.raw.b_Step_RnD,true);
  e("held reentry never creates a new up request including entry sample",x.frames.slice(mark).some(f=>f.signals.up),false);
  if(model.networks.some(n=>n.name==="RndPhysicalCompact"))e("no native FinishUp acceptance including reentry sample",x.frames.slice(mark).some(f=>f.internal.finishUp),false);
});
for(const fault of ["in_ES_NC_1","in_Estop_PLC","in_Mentee_EStop"])scenario(`safety inhibit ${fault} blocks new physical request`,1,(x,e)=>{
  x.sample({[fault]:fault!=="in_ES_NC_1"});x.sample(both);x.advance(1200);
  e("inhibited branch cannot accept physical up",x.any("up"),false);e("no new HV",x.any("hv"),false);
});
for(const door of [false,true])scenario(`Door${door} energy requires both NC`,1,(x,e)=>{
  x.sample({in_Door_Monitor:door});x.sample(both);x.advance(1002);
  e("actual physical energy advance independent of Door",x.get("hv"),true);
  e("green keeps solenoid off",x.get("unlock"),false);
});
for(const door of [false,true])for(const nc of ["in_InterLock_NC_1","in_InterLock_NC_2"])scenario(`Door${door} missing${nc} never energizes HV`,1,(x,e)=>{
  x.sample({in_Door_Monitor:door,[nc]:false});x.sample(both);x.advance(1200);
  e("either NC FALSE prevents actual HV",x.any("hv"),false);
});
scenario("green consumes qualified blue authorization without automatic resumption",1,(x,e)=>{
  x.sample({in_Relase_Door_PB:true});x.advance(502);e("actual qualified unlock control",x.get("unlock"),true);
  x.sample({in_Reset_PB:true});e("green removes visible Unlock in same sample",x.get("unlock"),false);
  x.advance(100);const mark=x.frames.length;x.sample({in_Reset_PB:false});x.advance(700);
  e("blue remains consumed until both OFF and full release",x.frames.slice(mark).some(f=>f.signals.blue||f.signals.unlock),false);
});
for(const fault of ["in_ES_NC_1","in_Estop_PLC"])scenario(`qualified blue plus ${fault} raw restoration never unlocks without Restart`,1,(x,e)=>{
  x.sample({in_Relase_Door_PB:true});x.advance(502);e("actual qualified unlock control",x.get("unlock"),true);
  x.sample({[fault]:fault!=="in_ES_NC_1"});e("same-scan emergency Unlock drop",x.get("unlock"),false);
  const mark=x.frames.length;x.sample({[fault]:fault==="in_ES_NC_1"});x.advance(100);
  e("raw recovery without main Restart cannot unlock",x.frames.slice(mark).some(f=>f.signals.unlock),false);
});

for(const command of ["green","up"])scenario(`accepted ${command} cleared by actual NC1 inhibit`,1,(x,e)=>{
  x.sample(command==="green"?{in_Reset_PB:true}:both);x.advance(command==="green"?501:1002);
  const key=command==="green"?"down":"up";e("accepted request positive control",x.get(key),true);
  const mark=x.frames.length;x.sample({in_ES_NC_1:false});x.advance(10);
  e("inhibit ends accepted request throughout fault interval",x.frames.slice(mark).some(f=>f.signals[key]),false);
});

// R1 architecture counterexamples: prepare the native window during the real2s release,
// then accept a fresh chord immediately after the filter without an extra timing allowance.
for(const first of ["green","blue"])for(const delta of [249,250,251])scenario(`fresh ${first} chord${delta} after accepted blue and full2000 release`,1,(x,e,t)=>{
  x.sample({in_Relase_Door_PB:true});x.advance(502);e("previous actual blue/Unlock positive",x.get("blue")&&x.get("unlock"),true);
  t.off=x.sample(off);x.advance(1999);e("release TON not early1999",x.r.get("//RndPhysicalCompact/RELEASE/TonOut"),false);
  x.sample();e("release TON complete2000",x.r.get("//RndPhysicalCompact/RELEASE/TonOut"),true);
  const mark=x.frames.length;t.first=x.sample(hold(first));e("first edge immediately after2000",t.first-t.off,2001);
  t.releaseTrace=x.frames.filter(f=>f.timeMs-t.off<=2||[1999,2000,2001].includes(f.timeMs-t.off)).map(f=>({delta:f.timeMs-t.off,internal:f.internal,signals:f.signals}));
  t.second=x.edgeAfter(t.first,delta,both);x.advance(999);
  e("no command throughout fresh chord prethreshold",noActions(x,mark),false);
  x.sample();e("fresh Up at1000 from second iff admitted",x.get("up"),delta<=250);
  x.advance(2);e("fresh actual HV control",x.get("hv"),delta<=250);
});
for(const first of ["green","blue"])scenario(`new ${first} before full1999 release remains invalid`,1,(x,e,t)=>{
  x.sample({in_Relase_Door_PB:true});x.advance(502);e("previous actual blue/Unlock positive",x.get("unlock"),true);
  t.off=x.sample(off);x.advance(1998);const mark=x.frames.length;t.first=x.sample(hold(first));
  e("early observed edge1999",t.first-t.off,1999);x.advance(1200);e("no command from incomplete release",noActions(x,mark),false);
});
