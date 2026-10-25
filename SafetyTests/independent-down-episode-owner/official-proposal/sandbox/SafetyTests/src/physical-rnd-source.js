import { effectiveEstopInputs } from "./estop-native-pairs.js";
import { SalRuntime,SAL_CLOCK_CONTRACT } from "./sal-runtime.js";
import { ObservedSamples } from "./observed-samples.js";

export const PHYSICAL_SIGNALS={up:"b_Set_Transition_3",down:"b_Set_Transition_2",blue:"b_Set_Door_Unlock_1",
  hvRequest:"b_Set_HV_C2_1",hv:"out_HV_C2",lv:"out_LV_C1",unlock:"out_Door_Unlock_Solonoeid"};
const phaseNames=["b_Step1","b_Step2","b_Step3","b_Step4","b_Step5","b_Step6","b_Step12","b_Step_RnD"];
const external={in_ES_NC_1:true,in_ES_NC_2:true,in_LV_Connector_Interlock:true,in_HV_Connector_Interlock:true,
  in_InterLock_NC_1:true,in_InterLock_NC_2:true,in_Mentee_EStop:false,in_LV_C1_FBK:true,in_HV_C2_FBK:false,
  in_STO_DR1_FBK:false,in_STO_DR2_FBK:false,in_Reset_PB:false,in_Safety_Run:false,in_LV_Healthy_FBK:true,
  in_HV_Healthy_FBK:true,in_C3_Manual_Set:false,in_C3_Manual_Reset:false,in_RBM_Manual_Set:false,in_RBM_Manual_Reset:false,
  in_Relase_Door_PB:false,in_Door_Monitor:true,in_False_SI2_CH8:false,in_Estop_PLC:false,
  inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,inPLC_BypassC1C2:false};

export function physicalRndSource(model,stepMs=1,{entryButtons={},observedSignals={}}={}) {
  for(const [key,value] of Object.entries(observedSignals))if(Object.hasOwn(PHYSICAL_SIGNALS,key)&&PHYSICAL_SIGNALS[key]!==value)throw Error('Cannot rebind physical observation '+key);
  const signals={...PHYSICAL_SIGNALS,...observedSignals};
  if(model.bindingAudit?.status!=="PASS")throw Error("Full actual-source binding audit required before selection");
  const all=model.networks.flatMap(n=>n.blocks),ports=new Map(),owners=new Map(),writers=new Map(),aliasTargets=new Map(),cuts=[],unknown=[];
  const addWriter=(name,port)=>{if(!writers.has(name))writers.set(name,[]);writers.get(name).push(port);};
  for(const block of all)for(const p of [...block.inputs,...block.outputs]){ports.set(p.path,p);owners.set(p.path,block);}
  for(const v of model.variables){for(const p of v.sourcePorts)addWriter(v.name,p);for(const p of v.targetPorts)aliasTargets.set(p,v);}
  for(const block of all)for(const p of block.outputs)for(const g of p.globals)addWriter(g.resolvedName??g.lastKnownPath.split(".").at(-1),p.path);
  const demanded=new Set(),demandedInputs=new Set(),selected=new Set(),pending=[];
  function variable(name,consumer) {
    if(phaseNames.includes(name)){
      const g=all.flatMap(b=>b.outputs.flatMap(p=>p.globals)).find(g=>(g.resolvedName??g.lastKnownPath.split(".").at(-1))===name);
      cuts.push({name,id:g?.variableId,source:writers.get(name),consumer,reason:"Network3 state owner intentionally excluded; explicit phase boundary, not reachability"});return;}
    const producers=writers.get(name);
    if(producers?.length)pending.push(...producers);
    else {
      const v=model.variables.find(v=>v.name===name);
      if(!v?.alias||!Object.hasOwn(external,name))throw Error(`Undeclared typed input boundary ${name}`);
      cuts.push({name,id:v.id,alias:v.alias,initialValue:external[name],consumer,reason:"Explicit given program input; initial PLC request levels fixed FALSE, no handshake policy inferred"});
    }
  }
  for(const signal of Object.values(signals))variable(signal,"observed actual output");
  while(pending.length) {
    const output=pending.pop();if(demanded.has(output))continue;demanded.add(output);
    const block=owners.get(output);if(!block)throw Error(`Output writer missing ${output}`);
    if(block.path.startsWith("//Network3/"))throw Error("Uncut state owner entered branch dependency closure");
    selected.add(block);
    const inputs=block.functionName==="safeEstop"?
      [block.inputs.find(p=>p.name==="Restart"),...effectiveEstopInputs(block,{isBound:p=>p.sources.length>0||p.globals.length>0||aliasTargets.has(p.path)}).map(({port})=>port)]:
      block.functionName==="safeDecouple"?[block.inputs[block.outputs.findIndex(p=>p.path===output)]]:
      block.inputs.filter(p=>!["Deactivated","Both Deactivated"].includes(p.channelInterface)&&!p.name.startsWith("EDM"));
    for(const p of inputs) {
      demandedInputs.add(p.path);
      if(p.sources.length)pending.push(...p.sources);
      else if(p.globals.length)for(const g of p.globals)variable(g.resolvedName??g.lastKnownPath.split(".").at(-1),p.path);
      else if(aliasTargets.has(p.path))variable(aliasTargets.get(p.path).name,p.path);
      else unknown.push(p.path);
    }
  }
  if(unknown.length)throw Error(`Command dependency requires unbound input: ${[...new Set(unknown)].join(",")}`);
  const scope={clockContract:SAL_CLOCK_CONTRACT,stepMs,selectedBlocks:[...selected].map(b=>b.path).sort(),
    demandedInputs:[...demandedInputs].sort(),
    boundaries:[...new Map(cuts.map(c=>[`${c.name}:${c.consumer}`,c])).values()],
    limit:"Actual physical R&D branch with typed input/Network3 ownership boundary; not full lifecycle/PLC handshake/reachability"};
  const r=new SalRuntime({...model,networks:model.networks.map(n=>({...n,blocks:n.blocks.filter(b=>selected.has(b))})).filter(n=>n.blocks.length)},
    {scanMs:stepMs,unconnectedInput:false});
  r.setInputs({...external,...Object.fromEntries(phaseNames.map(n=>[n,false]))});
  const clock=new ObservedSamples(r,stepMs),transitions=[],frames=[],rises=Object.fromEntries(Object.keys(signals).map(k=>[k,0]));
  let observedMs=-stepMs;
  let previous=Object.fromEntries(Object.keys(signals).map(k=>[k,false])),capture=true;
  const nativeScan=r.scan.bind(r);r.scan=(dt=stepMs)=>{nativeScan(dt);observedMs+=dt;if(capture){
    const current=Object.fromEntries(Object.entries(signals).map(([k,v])=>[k,r.get(v)]));
    for(const k of Object.keys(current))if(current[k]&&!previous[k])rises[k]++;
    const raw={...Object.fromEntries(Object.keys(external).map(name=>[name,r.get(name)])),b_Step_RnD:r.get("b_Step_RnD")};
    if(Object.keys(current).some(k=>current[k]!==previous[k]))transitions.push({timeMs:observedMs,signals:current,raw});
    const internal=model.networks.some(n=>n.name==="RndPhysicalCompact")?Object.fromEntries(Object.entries({finishUp:"GATE_020/AndOut",finishGreen:"GATE_017/AndOut",finishBlue:"GATE_018/AndOut",windowError:"WINDOW/Error",restart:"GATE_007/AndOut",ready:"WINDOW/EStopOut",delayed:"WINDOW/EStopDelOut",release:"RELEASE/TonOut",P:"STATE_P/RsOut",A:"STATE_A/RsOut",C:"STATE_C/RsOut",L:"STATE_L/RsOut",T:"STATE_T/RsOut"}).map(([key,path])=>[key,r.get("//RndPhysicalCompact/"+path)])):undefined;
    frames.push({timeMs:observedMs,signals:current,raw,internal});previous=current;
  }return r;};
  // Real manual restart; state boundary deliberately not R&D until setup ends.
  clock.sample();clock.advance(10*stepMs);clock.sample({in_Reset_PB:true});clock.sample({in_Reset_PB:false});
  if(!r.get("b_EStop_Ok"))throw Error("Actual main EStop manual preparation did not enable");
  // Raise LV through its real Step12 producer/OR/SetPermit/RS, not an injected output.
  clock.sample({b_Step12:true});for(let i=0;i<100&&!r.get("out_LV_C1");i++)clock.sample();
  if(!r.get("out_LV_C1"))throw Error("Real LV setup positive control failed");
  // Keep observer continuous through each scenario; setup trace is separate.
  const setupTransitions=transitions.splice(0);frames.length=0;for(const k of Object.keys(rises))rises[k]=0;
  previous=Object.fromEntries(Object.entries(signals).map(([k,v])=>[k,r.get(v)]));
  clock.sample({b_Step12:false,b_Step_RnD:true,...entryButtons});clock.advance(2100);
  return {r,clock,scope,frames,transitions,rises,setupTransitions,
    get:k=>r.get(signals[k]),sample:inputs=>clock.sample(inputs),advance:ms=>clock.advance(ms),
    edgeAfter:(first,delta,inputs)=>clock.observeAfter(first,delta,inputs),
    clearFrames(){frames.length=0;},
    any:k=>frames.some(f=>f.signals[k]),
    observed(){return {scope,transitions,rises,assumptions:[...r.assumedUnconnectedPorts],
      commandConeUnconnected:[...r.assumedUnconnectedPorts].filter(p=>demandedInputs.has(p)),
      interpretation:"Rises count actual existing request/output transitions, not invented accepted-launch events"};}};
}
