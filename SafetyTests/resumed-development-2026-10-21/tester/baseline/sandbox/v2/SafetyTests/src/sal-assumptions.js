import { effectiveEstopInputs } from "./estop-native-pairs.js";
// Structural inventory only: no assumed value or electrical polarity is proof.
export function auditAssumptions(model) {
  const blocks = model.networks.flatMap(n => n.blocks);
  const inputs = new Map(blocks.flatMap(b => b.inputs.map(p => [p.path, p])));
  const outputs = new Map(blocks.flatMap(b => b.outputs.map(p => [p.path, p])));
  const incoming = new Map();
  const writers = new Map();
  const add = (map, key, value) => map.set(key, [...new Set([...(map.get(key) ?? []), value])]);
  for (const b of blocks) for (const p of b.outputs) {
    for (const t of p.targets) add(incoming, t, p.path);
    for (const g of p.globals) add(writers, g.lastKnownPath?.split(".").at(-1), p.path);
  }
  for (const v of model.variables) {
    for (const p of v.sourcePorts) add(writers, v.name, p);
    for (const t of v.targetPorts) add(incoming, t, `var:${v.name}`);
  }
  const variables = new Map(model.variables.map(v => [v.name, v]));
  const unresolved = [];
  let activeInputs = 0;
  const nativeEstopInputs=blocks.filter(b=>b.functionName==="safeEstop").flatMap(b=>effectiveEstopInputs(b).map(({port,master,contact})=>({block:b.path,port:port.path,master:master.path,contact})));
  const activeEstop=new Set(nativeEstopInputs.map(p=>p.port));
  for (const b of blocks) for (const p of b.inputs) {
    if (b.functionName==="safeEstop"?p.name!=="Restart"&&!activeEstop.has(p.path):["Deactivated", "Both Deactivated"].includes(p.channelInterface)) continue;
    activeInputs++;
    const refs = [...new Set([
      ...p.sources, ...(incoming.get(p.path) ?? []),
      ...p.globals.map(g => `var:${g.lastKnownPath?.split(".").at(-1)}`)
    ])];
    const affected = b.functionName === "safeDecouple"
      ? b.outputs.filter((o, i) => b.inputs[i]?.path === p.path) : b.outputs;
    const used = affected.filter(o => o.targets.length || o.globals.length ||
      model.variables.some(v => v.sourcePorts.includes(o.path)) ||
      [...inputs.values()].some(i => i.sources.includes(o.path))).map(o => o.path);
    if (!refs.length) unresolved.push({ port: p.path, reason: "unconnected", usedOutputs: used });
    for (const ref of refs) {
      if (ref.startsWith("var:")) {
        const name = ref.slice(4);
        if (variables.get(name)?.alias && !(writers.get(name)?.length)) continue;
        const producers = writers.get(name) ?? [];
        if (!producers.length || producers.some(s => !outputs.has(s))) {
          unresolved.push({ port: p.path, reason: "missing-variable-producer", reference: name, producers, usedOutputs: used });
        }
      } else if (!outputs.has(ref)) {
        unresolved.push({ port: p.path, reason: "missing-port-producer", reference: ref, usedOutputs: used });
      }
    }
  }
  const externalInputs = model.variables.filter(v => v.alias && !(writers.get(v.name)?.length))
    .map(v => ({ name: v.name, sdsId: v.alias.sdsId, channelId: v.alias.channelId,
      functionId: v.alias.functionId, consumers: v.targetPorts,
      electricalPolarity: "UNVERIFIED", runtimeValue: "NOT SUPPLIED" }));
  const order = blocks.map(b => b.orderOfExecution);
  const duplicateOrders = [...new Set(order.filter((x, i) => order.indexOf(x) !== i))];
  return {
    crc: model.crc, blocks: blocks.length, activeInputs, nativeEstopInputs,
    executionOrder: { min: Math.min(...order), max: Math.max(...order), duplicateOrders },
    externalInputs, unresolved,
    summary: {
      externalInputs: externalInputs.length,
      unconnected: unresolved.filter(x => x.reason === "unconnected").length,
      unconnectedWithUsedOutput: unresolved.filter(x => x.reason === "unconnected" && x.usedOutputs.length).length,
      missingProducers: unresolved.filter(x => x.reason !== "unconnected").length
    }
  };
}
