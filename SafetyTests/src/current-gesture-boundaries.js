import { physicalRndSource } from "./physical-rnd-source.js";
import { SalRuntime } from "./sal-runtime.js";
import { anySignalDuring } from "./scan-observer.js";
import { ObservedSamples } from "./observed-samples.js";
import { withActualNames } from "./signal-names.js";

function includingObservedSample(r,duration,signal,inputs) {
  const atObservedEdge=r.get(signal);
  const later=anySignalDuring(r,duration,signal,inputs); // Always advance the whole interval.
  return atObservedEdge||later;
}

// Acceptance of actual serialized Network12, not a recognizer prototype.
export function currentGestureBoundaryChecks(model) {
  const results = [];
  const integrated=model.networks.some(n=>n.name==="RndPhysicalCompact");
  const upFinish=integrated?"//RndPhysicalCompact/GATE_020/AndOut":"b_Set_Transition_3";
  const timerPath=name=>integrated?`//RndPhysicalCompact/${name==="FBTon4"?"GREEN":"BLUE"}/TonOut`:`//Network12/${name}/TonOut`;
  const ready = { b_Step_RnD:true,b_ResetPB_Lock:false,in_False_SI2_CH8:false,
    in_InterLock_NC_1:true,in_InterLock_NC_2:true,
    in_Door_Monitor:true,inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,
    in_HV_C2_FBK:false,in_HV_Faulty_FBK:false /* R0 nominal (lead 2026-10-22, D-ARCH-POL): raw Faulty FALSE = PS healthy; on F1/R1 mapped to in_HV_Healthy_FBK with the same raw FALSE */,in_Reset_PB:false,in_Relase_Door_PB:false };
  const branch = model.networks.find(n => n.name === "Network12");
  function check(id, requirements, scenario) {
    if (!branch) { results.push({ id,requirements,status:"NOT VERIFIED",reason:"Actual Network12 binding missing" }); return; }
    const actual=integrated?physicalRndSource(model,1):null;
    const r = actual?.r ?? new SalRuntime({ ...model,networks:[branch] },{ scanMs:1,unconnectedInput:false }).setInputs(withActualNames(model,ready));
    const observations = [];
    const expect = (signal,expected,checkpoint,actual=r.get(signal)) => observations.push({ signal,expected,actual,checkpoint });
    try {
      r.runFor(2100); // Neutral precondition; integrated current closure includes real Armed ownership.
      scenario(r,expect,new ObservedSamples(r,1));
      const firstViolation = observations.find(o => o.actual !== o.expected);
      results.push({ id,requirements,status:firstViolation?"FAIL":"PASS",scanMs:1,
        scope:actual?.scope ?? "Actual Network12 R&D component; explicit input prehistory, no complete group/transition lifecycle",
        observations,firstViolation:firstViolation??null,assumedUnconnectedPorts:[...r.assumedUnconnectedPorts] });
    } catch(error) { results.push({ id,requirements,status:"ERROR",error:error.message }); }
  }
  for (const [first,input,other,timer,single] of [
    ["GREEN","in_Reset_PB","in_Relase_Door_PB","FBTon4","b_Set_Transition_2"],
    ["BLUE","in_Relase_Door_PB","in_Reset_PB","FBTon2","b_Set_Door_Unlock_1"]]) {
    check(`EXACT:SINGLE:${first}`,["BTN-003","BTN-004"],(r,e,clock) => {
      clock.sample({[input]:true});clock.advance(499); e(timerPath(timer),false,"499 ms first hold");
      e(single,false,"499 ms request");
      r.scan(); e(timerPath(timer),true,"500 ms TON threshold");
      r.scan(); e(single,true,"501 ms downstream positive; current graph may already accept500, historical consumer lagged");
    });
    for (const delta of [249,250,251,500,510]) check(`EXACT:CHORD:${first}:${delta}`,["BTN-005","BTN-006","BTN-008"],(r,e,clock) => {
      let qualified=false;const nativeScan=r.scan.bind(r);
      r.scan=(...args)=>{const result=nativeScan(...args);qualified ||=r.get(timerPath(timer));return result;};
      const observed=clock.sample({[input]:true});
      clock.observeAfter(observed,delta,{[other]:true});
      e(timerPath(timer),delta>=500,"all-scan observation before consumed reset; not full transition acceptance",qualified);
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
      e(upFinish,false,"no new native FinishUp Set event (not full accepted launch) during entire 1100 ms after incomplete neutral filter",
        includingObservedSample(r,1100,upFinish,{ in_Reset_PB:true,in_Relase_Door_PB:true }));
      if(integrated)e("b_Set_Transition_3",true,"accepted retained Up request remains distinct from no new FinishUp event");
      if(integrated){
        e(upFinish,false,"no new native FinishUp while retained SU owns RnD, including full neutral2100",
          includingObservedSample(r,2100,upFinish,{in_Reset_PB:false,in_Relase_Door_PB:false}));
        e("b_Set_Transition_3",true,"neutral release does not cancel retained Up owner");
        r.setInputs({b_Step_RnD:false}).scan();e("b_Set_Transition_3",false,"explicit injected phase exit ends request ownership");
        r.setInputs({b_Step_RnD:true}).scan().runFor(2100); // Typed Network3 owner boundary, not full-cycle reachability.
      }else r.runFor(2100,{in_Reset_PB:false,in_Relase_Door_PB:false});
      r.setInputs({in_Reset_PB:true,in_Relase_Door_PB:true}).scan();
      e(upFinish,false,"fresh full release: no new native FinishUp event before full BOTH interval",
        includingObservedSample(r,999,upFinish,{ in_Reset_PB:true,in_Relase_Door_PB:true }));
      r.scan(); e(upFinish,true,"fresh owner entry plus full release permits native FinishUp at full1000");
      e("b_Set_Transition_3",true,"actual downstream Up request positive");
    });
    check(`REPEAT:${first}:NO-SECOND-UP`,["BTN-002","BTN-006","BTN-007"],(r,e,clock) => {
      const observed=clock.sample({[input]:true});clock.observeAfter(observed,100,{[other]:true});clock.advance(1001);
      e("b_Set_Transition_3",true,"first qualified chord request");
      r.runFor(10,{ [other]:false }); e("b_Set_Transition_3",integrated,"accepted Up level survives ordinary chord interruption");
      e(upFinish,false,"no second native FinishUp Set event (not full accepted launch) in entire 1100 ms until both released and full filter",
        includingObservedSample(r,1100,upFinish,{ [other]:true }));
    });
  }
  results.push({ id:"LATE:NO-FAULT",requirements:["BTN-008"],status:"NOT VERIFIED",
    reason:"Network12 component has no bound complete group/fault observation; absence of a parsed Error is not proof of no fault" });
  results.push({ id:"LATE:NO-ROLLBACK",requirements:["BTN-008","MOD-004"],status:"NOT VERIFIED",
    reason:"Single request producer is observable, but accepted transition/event ownership and downstream rollback are not bound in this component; no fake latched marker used" });
  return results;
}
