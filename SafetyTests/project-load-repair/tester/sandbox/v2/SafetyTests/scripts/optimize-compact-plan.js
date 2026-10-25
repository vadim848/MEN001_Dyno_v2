// Design-only derivation; never writes SAL/SGVL or modifies baseline netlist.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parseSalFile } from '../src/sal-parser.js';
const root = new URL('../', import.meta.url);
const baselineBytes = fs.readFileSync(new URL('03B_COMPACT_NETLIST_PLAN.json', root));
const p = JSON.parse(baselineBytes);
const sourceBytes = fs.readFileSync(new URL('../../' + p.source, import.meta.url));
const model = parseSalFile(new URL('../../' + p.source, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const real = model.networks.flatMap(n => n.blocks);
for (const entry of p.sequence.filter(x => x.oldPath)) {
  const b=real.find(b=>b.path===entry.oldPath);
  assert(b, `Missing original block ${entry.oldPath}`);
  assert.equal(b.orderOfExecution,entry.oldOrder,`Changed source order ${entry.oldPath}`);
}
for (const usage of p.aliasTargetUsageAdditions) {
  assert(model.variables.some(v=>v.id===usage.variableId&&v.name===usage.name),`Alias identity changed ${usage.name}`);
}
const permit = real.find(b => b.path === '//Network1/FBAndLvCurrentPermit');
const proof = [];
for (const [name, port] of [['in_InterLock_NC_1','AndIn4'],['in_InterLock_NC_2','AndIn5']]) {
  const v = model.variables.find(v => v.name === name);
  const i = permit.inputs.find(i => i.name === port);
  assert.equal(permit.functionName, 'safeAnd');
  assert.equal(i.channelInterface, 'Activated');
  assert.equal(i.deactivate1, 'Break Contact (NC)');
  assert(v.targetPorts.includes(i.path));
  proof.push({alias: name, variableId:v.id, target:i.path, order:permit.orderOfExecution, direct:true});
}
assert(permit.orderOfExecution < p.blocks.find(b => b.name === 'GATE_001').order);
const gone = p.blocks.find(b => b.name === 'GATE_INTERLOCK_PAIR');
assert(gone);
const removedPath = gone.outputs[0].path;
const finish = p.blocks.find(b => b.outputs.some(o => o.path === p.symbols.FinishUp.path));
assert.equal(finish.inputs.filter(i => i.source.path === removedPath).length,1);
const input = finish.inputs.find(i => i.source.path === removedPath);
finish.inputs = finish.inputs.filter(i => i !== input);
const native = finish.nativePorts.inputs.find(i => i.Id === input.id);
native.active = false; native.channelInterface = 'Deactivated'; delete native.bindingSource;
p.blocks = p.blocks.filter(b => b !== gone);
delete p.symbols.UpAllowed;
p.aliasTargetUsageAdditions = p.aliasTargetUsageAdditions.filter(x => !x.targetPort.includes('/GATE_INTERLOCK_PAIR/'));
p.canonicalWires = p.canonicalWires.filter(x => x.source !== removedPath && !x.target.includes('/GATE_INTERLOCK_PAIR/'));
p.sequence = p.sequence.filter(x => !JSON.stringify(x).includes('/GATE_INTERLOCK_PAIR'));
// Preserve the exact existing relative ordering; close only the removed slot.
for (const b of p.blocks) if (b.order > gone.order) b.order--;
for (const s of p.sequence) if (s.newOrder > gone.order) s.newOrder--;
assert.equal(p.sequence.length,253);
p.capacity = {...p.capacity, graph:47, netNew:44, final:253};
p.sha256 = crypto.createHash('sha256').update(sourceBytes).digest('hex');
p.sgvlSha256 = crypto.createHash('sha256').update(fs.readFileSync(new URL('../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl', import.meta.url))).digest('hex');
p.status = 'OPTIMIZATION CANDIDATE 253/255; independent review required; not implemented SAL';
p.optimization = {baselineSha256:crypto.createHash('sha256').update(baselineBytes).digest('hex'), removedBlock:gone.name,
  sourceImplication:'current Permit implies both direct InterLock raw inputs in same scan', proof,
  unchanged:'old Network12/FBAnd16 interlock pair and all existing source blocks',
  boundary:'Other active real Permit inputs healthy; Permit cannot be injected independently of InterLocks'};
const matrix=[];
for (const nc1 of [false,true]) for(const nc2 of [false,true]) for(const other of [false,true]) for(const eligibleRest of [false,true]) {
  const permitValue=nc1&&nc2&&other, e=permitValue&&eligibleRest;
  const before=e&&nc1&&nc2, after=e;
  assert.equal(before,after); matrix.push({nc1,nc2,other,eligibleRest,before,after});
}
p.optimization.counterfactualMatrix=matrix;
p.boundaries.doorLatest='DoorMonitor only existing solenoid logic. Explicit new NC-pair block eliminated because same-scan real CurrentPermit already implies both NC; original And16 pair preserved.';
fs.writeFileSync(new URL('03B_COMPACT_OPTIMIZED_PLAN.json',root),JSON.stringify(p)+'\n');
console.log(JSON.stringify({sourceSHA:p.sha256, baselineSHA:p.optimization.baselineSha256, proof, matrixCases:matrix.length, blocks:p.blocks.length, final:p.sequence.length}));
