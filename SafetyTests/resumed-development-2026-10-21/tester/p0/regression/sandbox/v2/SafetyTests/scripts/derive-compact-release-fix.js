// Plan-only R1 derivation: no SAL writes.
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const p=JSON.parse(fs.readFileSync(new URL('03B_COMPACT_OPTIMIZED_PLAN.json',root)));
const block=n=>p.blocks.find(b=>b.name===n);
function bind(n,i,source){const b=block(n),port=b.inputs[i];port.source=source;const native=b.nativePorts.inputs.find(x=>x.Id===port.id);native.bindingSource=source;native.deactivate1=source.inverted?'Make Contact (NO)':'Break Contact (NC)';}
bind('STATE_P',1,{...p.symbols.ReleaseEnable});
bind('STATE_P',0,{...p.symbols.ReleaseEnable,inverted:true});
const aset=block('GATE_016'), fourth=aset.nativePorts.inputs.find(i=>i.name==='AndIn4');
const done={path:'//RndPhysicalCompact/RELEASE/TonOut',inverted:false};
aset.inputs.push({name:'AndIn4',id:fourth.Id,source:done});
fourth.active=true;fourth.channelInterface='Activated';fourth.deactivate1='Break Contact (NC)';fourth.bindingSource=done;
bind('STATE_A',0,{...p.symbols.E,inverted:true});
p.canonicalWires=[];
for(const b of p.blocks)for(const i of b.inputs)if(i.source.path)p.canonicalWires.push({source:i.source.path,target:`//${p.network}/${b.name}/${i.name}`,invertedContact:!!i.source.inverted});
for(const b of p.blocks)for(const [name,source]of Object.entries(b.nativeInputs??{}))if(source.path)p.canonicalWires.push({source:source.path,target:`//${p.network}/${b.name}/${name}`,invertedContact:!!source.inverted});
p.status='R1 RELEASE PREPARATION FIX DESIGN; actual SAL acceptance required';
p.releaseFix={unchanged:'all execution orders,2s release,250ms window,500/1000 qualifications,253blocks',rule:'P.Set=ReleaseEnable; P.Reset=!ReleaseEnable; A.Set=P&&off&&WindowReady&&ReleaseDone; A.Reset=!E'};
fs.writeFileSync(new URL('03B_COMPACT_RELEASE_FIX_PLAN.json',root),JSON.stringify(p)+'\n');
