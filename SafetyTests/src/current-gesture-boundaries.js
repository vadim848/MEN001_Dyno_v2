import { SalRuntime } from "./sal-runtime.js";
import { anySignalDuring } from "./scan-observer.js";
import { ObservedSamples } from "./observed-samples.js";

function includingObservedSample(r,duration,signal,inputs) {
  const atObservedEdge=r.get(signal);
  const later=anySignalDuring(r,duration,signal,inputs); // Always advance the whole interval.
  return atObservedEdge||later;
}

// Acceptance of actual serialized Network12, not a recognizer prototype.
export function currentGestureBoundaryChecks(model) {
  const results = [];
  const ready = { b_Step_RnD:true,b_ResetPB_Lock:false,in_False_SI2_CH8:false,
    in_Door_Monitor:true,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,
    in_HV_C2_FBK:false,in_HV_Healthy_FBK:true,in_Reset_PB:false,in_Relase_Door_PB:false };
  const branch = model.networks.find(n => n.name === "Network12");
  function check(id, requirements, scenario) {
    if (!branch) { results.push({ id,requirements,status:"NOT VERIFIED",reason:"Actual Network12 binding missing" }); return; }
    const r = new SalRuntime({ ...model,networks:[branch] },{ scanMs:1,unconnectedInput:false }).setInputs(ready);
    const observations = [];
    const expect = (signal,expected,checkpoint,actual=r.get(signal)) => observations.push({ signal,expected,actual,checkpoint });
    try {
      r.runFor(2100); // Neutral precondition; complete Armed ownership remains unimplemented.
      scenario(r,expect,new ObservedSamples(r,1));
      const firstViolation = observations.find(o => o.actual !== o.expected);
      results.push({ id,requirements,status:firstViolation?"FAIL":"PASS",scanMs:1,
        scope:"Actual Network12 R&D component; explicit input prehistory, no complete group/transition lifecycle",
        observations,firstViolation:firstViolation??null,assumedUnconnectedPorts:[...r.assumedUnconnectedPorts] });
    } catch(error) { results.push({ id,requirements,status:"ERROR",error:error.message }); }
  }
  for (const [first,input,other,timer,single] of [
    ["GREEN","in_Reset_PB","in_Relase_Door_PB","FBTon4","b_Set_Transition_2"],
    ["BLUE","in_Relase_Door_PB","in_Reset_PB","FBTon2","b_Set_Door_Unlock_1"]]) {
    check(`EXACT:SINGLE:${first}`,["BTN-003","BTN-004"],(r,e,clock) => {
      clock.sample({[input]:true});clock.advance(499); e(`//Network12/${timer}/TonOut`,false,"499 ms first hold");
      e(single,false,"499 ms request");
      r.scan(); e(`//Network12/${timer}/TonOut`,true,"500 ms TON threshold");
      r.scan(); e(single,true,"501 ms downstream consumer, earlier than TON in execution order");
    });
    for (const delta of [249,250,251,500,510]) check(`EXACT:CHORD:${first}:${delta}`,["BTN-005","BTN-006","BTN-008"],(r,e,clock) => {
      const observed=clock.sample({[input]:true});
      clock.observeAfter(observed,delta,{[other]:true});
      e(`//Network12/${timer}/TonOut`,delta>=500,"single timer at second observed sample; not a full transition acceptance marker");
      e("b_Set_Transition_3",false,"every scan in first 999 ms since second press",
        includingObservedSample(r,999,"b_Set_Transition_3",{ [other]:true }));
      r.scan(); e("b_Set_Transition_3",delta<=250,"1000 ms since second press");
      r.scan(); e("b_Set_Transition_3",delta<=250,"1001 ms since second press");
    });
    check(`EXACT:FLICKER:${first}`,["BTN-006","BTN-007"],(r,e,clock) => {
      const observed=clock.sample({[input]:true});clock.observeAfter(observed,100,{[other]:true});clock.advance(600);
      clock.sample({[other]:false});clock.sample({[other]:true});
      e("b_Set_Transition_3",false,"every scan in first 999 ms since chord restored",
        includingObservedSample(r,999,"b_Set_Transition_3",{ [other]:true }));
      r.scan(); e("b_Set_Transition_3",true,"1000 ms since chord restored");
      r.scan(); e("b_Set_Transition_3",true,"1001 ms since chord restored");
    });
    check(`LATE:BEFORE:${first}:300`,["BTN-005","BTN-007","BTN-008"],(r,e,clock) => {
      const observed=clock.sample({[input]:true});clock.observeAfter(observed,300,{[other]:true});
      let singleSeen=r.get(single),upSeen=r.get("b_Set_Transition_3");
      for(let i=0;i<1500;i++) { r.scan(); singleSeen ||= r.get(single); upSeen ||= r.get("b_Set_Transition_3"); }
      e("any single request",false,"late second before qualification cancels attempt",singleSeen);
      e("any StepUp",false,"late second before qualification cancels attempt",upSeen);
      r.runFor(1,{ [other]:false });
      let degraded=false;
      for(let i=0;i<1000;i++) { r.scan(); degraded ||= r.get(single); }
      e("single after late second released",false,"no new commands before both release/filter",degraded);
    });
    check(`LATE:AFTER:${first}:600`,["BTN-005","BTN-007","BTN-008"],(r,e,clock) => {
      const observed=clock.sample({[input]:true});clock.advance(599); e(single,true,"existing single producer before second; not a full transition-acceptance marker");
      clock.observeAfter(observed,600,{[other]:true}); let upSeen=r.get("b_Set_Transition_3");
      for(let i=0;i<1500;i++) { r.scan(); upSeen ||= r.get("b_Set_Transition_3"); }
      e("any retrospective StepUp",false,"already qualified single cannot become another command",upSeen);
    });
    check(`REARM:${first}:SHORT-NEUTRAL`,["BTN-001","BTN-002","BTN-006"],(r,e,clock) => {
      const observed=clock.sample({[input]:true});clock.observeAfter(observed,100,{[other]:true});clock.advance(1100);
      e("b_Set_Transition_3",true,"first qualified chord");
      r.setInputs({in_Reset_PB:false,in_Relase_Door_PB:false}).scan().runFor(100);
      r.setInputs({in_Reset_PB:true,in_Relase_Door_PB:true}).scan();
      e("b_Set_Transition_3",false,"no new chord during entire 1100 ms after incomplete neutral filter",
        includingObservedSample(r,1100,"b_Set_Transition_3",{ in_Reset_PB:true,in_Relase_Door_PB:true }));
      r.runFor(2100,{ in_Reset_PB:false,in_Relase_Door_PB:false });
      r.setInputs({in_Reset_PB:true,in_Relase_Door_PB:true}).scan();
      e("b_Set_Transition_3",false,"fresh full release: no request in any scan before full BOTH interval",
        includingObservedSample(r,999,"b_Set_Transition_3",{ in_Reset_PB:true,in_Relase_Door_PB:true }));
      r.scan(); e("b_Set_Transition_3",true,"fresh full release permits qualified chord");
    });
    check(`REPEAT:${first}:NO-SECOND-UP`,["BTN-002","BTN-006","BTN-007"],(r,e,clock) => {
      const observed=clock.sample({[input]:true});clock.observeAfter(observed,100,{[other]:true});clock.advance(1001);
      e("b_Set_Transition_3",true,"first qualified chord request");
      r.runFor(10,{ [other]:false }); e("b_Set_Transition_3",false,"chord interrupted after first request");
      e("b_Set_Transition_3",false,"no second request in entire 1100 ms until both released and full filter",
        includingObservedSample(r,1100,"b_Set_Transition_3",{ [other]:true }));
    });
  }
  results.push({ id:"LATE:NO-FAULT",requirements:["BTN-008"],status:"NOT VERIFIED",
    reason:"Network12 component has no bound complete group/fault observation; absence of a parsed Error is not proof of no fault" });
  results.push({ id:"LATE:NO-ROLLBACK",requirements:["BTN-008","MOD-004"],status:"NOT VERIFIED",
    reason:"Single request producer is observable, but accepted transition/event ownership and downstream rollback are not bound in this component; no fake latched marker used" });
  return results;
}
