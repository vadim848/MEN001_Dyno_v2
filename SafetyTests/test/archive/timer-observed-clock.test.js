import test from "node:test";
import assert from "node:assert/strict";
import { parseSalFile } from "../../src/sal-parser.js";
import { SalRuntime } from "../../src/sal-runtime.js";
import { ObservedSamples } from "../helpers/observed-samples.js";
const model=parseSalFile(new URL("../../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal",import.meta.url));
const blocks=model.networks.flatMap(n=>n.blocks),originalStop=blocks.find(b=>b.functionName==="safeEstop");
const input=(name,path,source)=>({name,path,sources:source?[source]:[],globals:[],targets:[],channelInterface:"Activated",deactivate1:"Break Contact (NC)"});
const output=(name,path)=>({name,path,sources:[],globals:[],targets:[]});
function standalone(blocks,step) { return new SalRuntime({networks:[{blocks}],variables:[],bindingMode:"explicit-test-injection"},{scanMs:step,unconnectedInput:false}); }
function timer(delay) { return {path:"//Clock/TON",name:"TON",functionName:"safeTon",orderOfExecution:1,
  inputs:[input("TonIn","//Clock/TON/TonIn")],outputs:[output("TonOut","//Clock/TON/TonOut")],parameters:[{timing:String(delay/1000)}]}; }
function estop(delay) {
  const b=structuredClone(originalStop);b.path="//Clock/Window";b.orderOfExecution=3;
  for(const p of [...b.inputs,...b.outputs]) {p.path=`${b.path}/${p.name}`;p.sources=[];p.targets=[];p.globals=[];}
  for(const p of b.inputs) {
    if(p.name.startsWith("EStopIn"))p.channelInterface=p.name==="EStopIn1"?"Single-Channel 1 Activated":"Both Deactivated";
    else delete p.channelInterface;
    p.deactivate1="Break Contact (NC)";p.deactivate2="Break Contact (NC)";
  }
  b.parameters.find(p=>p.timing).timing=String(delay);return b;
}
function setPort(r,b,name,value){r.values.set(b.inputs.find(p=>p.name===name).path,value);}
function preparedStop(step,delay) {
  const b=estop(delay),r=standalone([b],step),s=new ObservedSamples(r,step);
  setPort(r,b,"EStopIn1",true);setPort(r,b,"Restart",false);s.sample();
  assert.equal(r.get(`${b.path}/EStopDelOut`),false,"healthy startup must not create window");
  setPort(r,b,"Restart",true);s.sample();assert.equal(r.get(`${b.path}/EStopOut`),false);
  setPort(r,b,"Restart",false);s.sample();assert.equal(r.get(`${b.path}/EStopOut`),true);
  return {b,r,s};
}

test("Observed dispatcher records exact fixed-grid deltas and rejects off-grid events",()=>{
  for(const dt of [1,2,5,10]) {
    let scans=0;const s=new ObservedSamples({setInputs(){},scan(step){assert.equal(step,dt);scans++;}},dt);
    const first=s.sample();assert.equal(first,0);assert.equal(s.observeAfter(first,250,{second:true})-first,250);
    assert.equal(scans,250/dt+1);
    if(dt>1)assert.throws(()=>s.advance(1),/representable/);
  }
});

for(const dt of [1,2,5,10])for(const actual of blocks.filter(b=>b.functionName==="safeTon"))test(`OBS-TON ${actual.path} fixed${dt}: observed-edge boundary, interruption and rehold`,()=>{
  const b=structuredClone(actual),delay=Number(b.parameters.find(p=>p.timing).timing)*1000;
  for(const p of [...b.inputs,...b.outputs]){p.sources=[];p.targets=[];p.globals=[];}
  const r=standalone([b],dt),s=new ObservedSamples(r,dt);
  setPort(r,b,"TonIn",false);s.sample();setPort(r,b,"TonIn",true);const first=s.sample();
  assert.equal(r.get(b.outputs[0].path),false);
  s.advance(delay-dt);assert.equal(s.timeMs-first,delay-dt);assert.equal(r.get(b.outputs[0].path),false);
  s.sample();assert.equal(s.timeMs-first,delay);assert.equal(r.get(b.outputs[0].path),true);
  s.sample();assert.equal(r.get(b.outputs[0].path),true);
  setPort(r,b,"TonIn",false);s.sample();assert.equal(r.get(b.outputs[0].path),false);
  setPort(r,b,"TonIn",true);s.sample();s.advance(Math.floor(delay/(2*dt))*dt);
  assert.equal(r.get(b.outputs[0].path),false,"partial hold cannot complete");
  setPort(r,b,"TonIn",false);s.sample();assert.equal(r.get(b.outputs[0].path),false);
  setPort(r,b,"TonIn",true);const again=s.sample();s.advance(delay-dt);
  assert.equal(r.get(b.outputs[0].path),false);s.sample();assert.equal(s.timeMs-again,delay);assert.equal(r.get(b.outputs[0].path),true);
});

for(const dt of [1,2,5,10])for(const delay of [100,250])test(`OBS-ESTOP delay${delay} fixed${dt}: startup, loss, threshold, recovery and new window`,()=>{
  const {b,r,s}=preparedStop(dt,delay);setPort(r,b,"EStopIn1",false);const loss=s.sample();
  assert.equal(r.get(`${b.path}/EStopOut`),false);assert.equal(r.get(`${b.path}/EStopDelOut`),true);
  s.advance(delay-dt);assert.equal(r.get(`${b.path}/EStopDelOut`),true);
  s.sample();assert.equal(s.timeMs-loss,delay);assert.equal(r.get(`${b.path}/EStopDelOut`),false);
  setPort(r,b,"EStopIn1",true);s.advance(delay);assert.equal(r.get(`${b.path}/EStopOut`),false,"restoration without reset cannot restart");
  setPort(r,b,"Restart",true);s.sample();setPort(r,b,"Restart",false);s.sample();assert.equal(r.get(`${b.path}/EStopOut`),true);
  setPort(r,b,"EStopIn1",false);const secondLoss=s.sample();s.advance(delay-dt);assert.equal(r.get(`${b.path}/EStopDelOut`),true);
  s.sample();assert.equal(s.timeMs-secondLoss,delay);assert.equal(r.get(`${b.path}/EStopDelOut`),false);
});

for(const dt of [1,2,5,10])for(const delta of [250-dt,250,250+dt])test(`OBS-CAUSAL helper250 fixed${dt} secondDelta${delta}: before-helper capture`,()=>{
  const b=estop(250),startPath="//Clock/Start/AndOut",snapshotPath="//Clock/Snapshot/DecOut1";
  b.orderOfExecution=4;
  const start={path:"//Clock/Start",name:"Start",functionName:"safeAnd",orderOfExecution:3,
    inputs:[input("AndIn1","//Clock/Start/AndIn1"),input("AndIn2","//Clock/Start/AndIn2")],outputs:[output("AndOut",startPath)],parameters:[]};
  const snapshot={path:"//Clock/Snapshot",name:"Snapshot",functionName:"safeDecouple",orderOfExecution:1,
    inputs:[input("DecIn1","//Clock/Snapshot/DecIn1",`${b.path}/EStopDelOut`)],outputs:[output("DecOut1",snapshotPath)],parameters:[]};
  const safety=b.inputs.find(p=>p.name==="EStopIn1");safety.sources=[startPath];safety.deactivate1="Make Contact (NO)";
  const secondInput=input("AndIn2","//Clock/Capture/AndIn2");secondInput.globals=[{lastKnownPath:"Clock.second"}];
  const captureBlock={path:"//Clock/Capture",name:"Capture",functionName:"safeAnd",orderOfExecution:2,
    inputs:[input("AndIn1","//Clock/Capture/AndIn1",snapshotPath),secondInput],outputs:[output("AndOut","//Clock/Capture/AndOut")],parameters:[]};
  const r=standalone([snapshot,captureBlock,start,b],dt),s=new ObservedSamples(r,dt);
  setPort(r,start,"AndIn1",false);setPort(r,start,"AndIn2",true);setPort(r,b,"Restart",true);s.sample();
  setPort(r,b,"Restart",false);s.sample();assert.equal(r.get(`${b.path}/EStopOut`),true,"real helper prepared before primary");
  setPort(r,start,"AndIn1",true);const primary=s.sample();assert.equal(r.get(startPath),true);assert.equal(r.get(`${b.path}/EStopOut`),false,"primary gate causes helper loss in same sample");
  let capture;const realScan=r.scan.bind(r);r.scan=(step)=>{realScan(step);capture=r.get(captureBlock.outputs[0].path);};
  const second=s.observeAfter(primary,delta,{second:true});assert.equal(second-primary,delta);
  assert.equal(capture,delta<=250,"BEFORE-helper snapshot defines inclusive boundary on fixed grid");
  if(delta===250)assert.equal(r.get(`${b.path}/EStopDelOut`),false,"AFTER-helper at threshold is already FALSE");
});
