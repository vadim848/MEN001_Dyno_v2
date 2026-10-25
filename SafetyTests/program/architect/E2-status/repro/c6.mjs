// E2d-COV-1: R&D->Run accepted (SU at u-2), NC1 FALSE from u. Base E2d candidate vs fix (cover on HV/STO set permits).
import {cand,toRnd} from './cand.mjs';
const NC='Break Contact (NC)';
function fix(m,{skip=[]}={}){const B=new Map(m.networks.flatMap(n=>n.blocks).map(b=>[b.path,b]));
 for(const blk of ['Network1/FBAndHvSetPermit','Network1/FBAndSto1SetPermit','Network1/FBAndSto2SetPermit'])for(const [port,v] of [['AndIn5','in_InterLock_NC_1'],['AndIn6','in_InterLock_NC_2']]){
  if(skip.includes(blk+'.'+port))continue;const p=B.get('//'+blk).inputs.find(q=>q.name===port);if(p.channelInterface==='Activated')throw Error('busy '+blk+port);p.channelInterface='Activated';p.deactivate1=NC;p.globals=[{resolvedName:v}];p.sources=[];}}
function drive(mut,ev,evAt){const r=cand('E2d',mut);toRnd(r);r.step(2100);r.plantC2=false;r.hold={in_HV_C2_FBK:false};
 r.step(1,{in_Reset_PB:true,in_Relase_Door_PB:true});const log=[];for(let i=0;i<9500;i++){if(i===1100)r.setInputs({in_Reset_PB:false,in_Relase_Door_PB:false});if(evAt!=null&&i===evAt)r.setInputs(ev);r.step(1);log.push({t:i,su:r.get('recRndC_SU'),c2:r.get('out_HV_C2'),sto:r.get('STO_DR1'),eok:r.get('b_EStop_Ok')});}return log;}
const ref=drive(null,null,null);const su=ref.find(s=>s.su).t;const u=ref.find(s=>s.c2).t;console.log('no-event: SU at',su,'u (C2 ON) at',u,'STO at',ref.find(s=>s.sto)?.t);
const rep=(n,log)=>{const at=k=>log.filter(s=>s.t>=u&&s[k]).map(s=>s.t-u);const c2=at('c2'),sto=at('sto');const e=log.find(s=>s.t>=u&&!s.eok);console.log(n.padEnd(40),'C2 ON scans from u:',c2.length,c2.length?'(u+'+c2[0]+'..u+'+c2.at(-1)+')':'','| STO released scans:',sto.length,sto.length?'(u+'+sto[0]+'..u+'+sto.at(-1)+')':'','| EOk FALSE at u+'+(e?e.t-u:'-'));};
rep('E2d base, NC1 at u',drive(null,{in_InterLock_NC_1:false},u));
rep('E2d base, in_Estop_PLC at u',drive(null,{in_Estop_PLC:true},u));
rep('E2d + fix, NC1 at u',drive(m=>fix(m),{in_InterLock_NC_1:false},u));
rep('E2d + fix, no event (positive)',drive(m=>fix(m),null,null));
rep('mut HvSetPermit.AndIn5, NC1 at u',drive(m=>fix(m,{skip:['Network1/FBAndHvSetPermit.AndIn5']}),{in_InterLock_NC_1:false},u));
rep('mut Sto1SetPermit.AndIn5, NC1 at u',drive(m=>fix(m,{skip:['Network1/FBAndSto1SetPermit.AndIn5']}),{in_InterLock_NC_1:false},u));
