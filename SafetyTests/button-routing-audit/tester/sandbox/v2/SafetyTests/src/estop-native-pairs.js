export const SAL_NATIVE_PAIR_CONTRACT=Object.freeze({version:"native-estop-pairs-v1",source:"03B_NATIVE_PAIR_FIX_PLAN.md: SDK master activation and Deactivate1/2",unsupported:"Two-Channel discrepancy, EDM and group lifecycle"});
// Native ESTOP activation/polarity is controlled by each objectIndex8/9 etc master.
// SDK evidence: 03B_NATIVE_PAIR_FIX_PLAN.md. No Two-Channel/EDM lifecycle emulation.
export function effectiveEstopInputs(block,{isBound}={}) {
 if(block.functionName!=="safeEstop")throw Error(`${block.path}: native ESTOP resolver requires safeEstop`);
 const result=[];
 for(let index=8;index<=14;index+=2){
  const master=block.inputs.find(p=>Number(p.objectIndex)===index);
  if(!master)throw Error(`${block.path}: unsupported native channel master objectIndex${index}`);
  const mode=master.channelInterface;
  const channels=mode==="Both Deactivated"?[]:
    mode==="Single-Channel 1 Activated"?[0]:
    mode==="Single-Channel 2 Activated"?[1]:
    mode==="Single-Channel Both Activated"?[0,1]:null;
  if(!channels)throw Error(`${block.path}: unsupported native channel mode ${mode}; Two-Channel discrepancy lifecycle is not modeled`);
  for(const channel of channels){
   const port=block.inputs.find(p=>Number(p.objectIndex)===index+channel);
   if(!port)throw Error(`${block.path}: missing effective active channel objectIndex${index+channel}`);
   const contact=channel===0?master.deactivate1:master.deactivate2;
   if(!["Break Contact (NC)","Make Contact (NO)"].includes(contact))throw Error(`${port.path}: unsupported native master contact ${contact}`);
   if(isBound&&!isBound(port))throw Error(`${port.path}: unbound effective active native ESTOP channel`);
   result.push({port,master,channel,contact,inverted:contact==="Make Contact (NO)"});
  }
 }
 return result;
}
