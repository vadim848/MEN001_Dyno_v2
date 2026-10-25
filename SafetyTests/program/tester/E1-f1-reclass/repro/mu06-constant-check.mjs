// Tester E1-f1-reclass: MU06 (Network6/FBAnd24.AndIn2 = NOT in_False_SI2_CH8 deactivated) under Q-MU06-01 B
// (in_False_SI2_CH8 is a technical constant FALSE). Exhaustive single-block truth table F1 vs MU06 over the
// remaining operands with in_False=FALSE, on the actual parsed canonical block and the stand runtime.
import {parseSalFile} from '../../../../src/sal-parser.js';
import {SalRuntime} from '../../../../src/sal-runtime.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno/';
const load=()=>parseSalFile(root+'TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'GVLs/GVL1.sgvl'});
const get=(m,p)=>m.networks.flatMap(n=>n.blocks).find(b=>b.path===p);
const mF=load(),mM=load();const bF=get(mF,'//Network6/FBAnd24'),bM=get(mM,'//Network6/FBAnd24');
const portM=bM.inputs.find(p=>p.name==='AndIn2');console.log('F1 AndIn2',JSON.stringify({ci:bF.inputs[1].channelInterface,contact:bF.inputs[1].deactivate1}));
portM.channelInterface='Deactivated';
const active=bF.inputs.filter(p=>p.channelInterface==='Activated').map(p=>p.name);console.log('F1 active inputs',active.join(','));
let rows=0,diff=0,diffWithFalseTrue=0;
for(const lock of [false,true])for(const green of [false,true])for(const fal of [false,true]){
 const inp={b_ResetPB_Lock:lock,linkRndGreenQualified:green,in_False_SI2_CH8:fal};
 const out=(m,b)=>{const r=new SalRuntime({...m,networks:[{blocks:[b]}]},{unconnectedInput:false});r.setInputs(inp).scan();return r.get(b.outputs[0].path);};
 const a=out(mF,bF),c=out(mM,bM);if(!fal){rows++;if(a!==c)diff++;}else if(a!==c)diffWithFalseTrue++;
 console.log(JSON.stringify(inp),'F1',a,'MU06',c);}
console.log('rows with in_False=FALSE',rows,'differing',diff,'| rows with in_False=TRUE differing (out of scope per Q-MU06-01)',diffWithFalseTrue);
process.exitCode=diff?1:0;
