import { effectiveEstopInputs } from "./estop-native-pairs.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertSalBindings } from "./sal-binding-validator.js";

function attrs(text) {
  return Object.fromEntries([...text.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
}

function elements(xml, tagPattern) {
  const rx = new RegExp(`<(${tagPattern})\\b([^>]*)>([\\s\\S]*?)<\\/\\1>`, "g");
  return [...xml.matchAll(rx)].map(m => ({ tag: m[1], attr: attrs(m[2]), body: m[3] }));
}

function ports(body, tag) {
  const rx = new RegExp(`<${tag}\\b([^>]*?)(?:\\/\\>|>([\\s\\S]*?)<\\/${tag}>)`, "g");
  return [...body.matchAll(rx)].map(m => {
    const attr = attrs(m[1]);
    const inner = m[2] ?? "";
    return {
      ...attr,
      targets: [...inner.matchAll(/<inPortMoniker\b[^>]*name="([^"]+)"/g)].map(x => x[1]),
      sources: [...inner.matchAll(/<outPortMoniker\b[^>]*name="([^"]+)"/g)].map(x => x[1]),
      globals: [...inner.matchAll(/<fbPortGlobalVariableReference\b([^>]*)\/>/g)].map(x => attrs(x[1]))
    };
  });
}

export function parseSalFile(file, { bindingMode = "auto", sgvlPath } = {}) {
  const absolute = path.resolve(file instanceof URL ? fileURLToPath(file) : file);
  const working = fileURLToPath(new URL("../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal",import.meta.url));
  const current = bindingMode === "current" || (bindingMode === "auto" && absolute.toLowerCase() === working.toLowerCase());
  const bindingAudit = current ? assertSalBindings(file,sgvlPath === undefined ? new URL("../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl",import.meta.url) : sgvlPath) : null;
  const xml = fs.readFileSync(file, "utf8");
  const networks = [];
  for (const network of elements(xml, "Network")) {
    const blocks = [];
    for (const block of elements(network.body, "fB[A-Za-z0-9]+")) {
      const name = block.attr.name;
      const base = `//${network.attr.name}/${name}`;
      const inputPorts = ports(block.body, "inPort").map(p => ({ ...p, path: `${base}/${p.name}` }));
      const outputPorts = ports(block.body, "outPort").map(p => ({ ...p, path: `${base}/${p.name}` }));
      const parameters = ports(block.body, "parameterPort");
      blocks.push({
        type: block.tag,
        name,
        instanceName: block.attr.instanceName,
        functionName: block.attr.functionName,
        orderOfExecution: Number(block.attr.orderOfExecution),
        path: base,
        inputs: inputPorts,
        outputs: outputPorts,
        parameters
      });
    }
    networks.push({ ...network.attr, blocks });
  }

  const variables = elements(xml, "variable").map(variable => {
    const alias = variable.body.match(/<aliasDeviceIoUsage\b([^>]*)\/>/);
    return {
      name: variable.attr.name,
      id: variable.attr.Id,
      alias: alias ? attrs(alias[1]) : null,
      sourcePorts: [...variable.body.matchAll(/<outPortMoniker\b[^>]*name="([^"]+)"/g)].map(m => m[1]),
      targetPorts: [...variable.body.matchAll(/<inPortMoniker\b[^>]*name="([^"]+)"/g)].map(m => m[1]),
      groupPorts: [...variable.body.matchAll(/<twinSAFEGroupAliasPortMoniker\b[^>]*name="([^"]+)"/g)].map(m => m[1])
    };
  });

  // A DSL wire is serialized at one endpoint. Normalize either representation
  // once before scoped selections so input/output readers see the same edge.
  const allPorts = new Map(networks.flatMap(n => n.blocks.flatMap(b => [...b.inputs,...b.outputs])).map(p => [p.path,p]));
  for (const n of networks) for (const b of n.blocks) {
    for (const out of b.outputs) for (const target of out.targets) {
      const input = allPorts.get(target); if(input && !input.sources.includes(out.path)) input.sources.push(out.path);
    }
    for (const input of b.inputs) for (const source of input.sources) {
      const out = allPorts.get(source); if(out && !out.targets.includes(input.path)) out.targets.push(input.path);
    }
  }
  if(current)for(const port of allPorts.values())for(const g of port.globals) {
    const symbol=bindingAudit.globalRefs.find(r=>r.portId===port.Id&&r.variableId===g.variableId);
    if(!symbol)throw Error(`Unvalidated current global reference ${port.path}`);
    g.resolvedName=symbol.name;
  }
  return { file, bindingMode:current?"current":"fixture-or-explicit-injection", bindingAudit,
    crc: attrs(xml.match(/<safetyApplication\b([^>]*)>/)?.[1] ?? "").Crc, networks, variables };
}

export function buildDependencyGraph(model) {
  const edges = new Map();
  const add = (from, to) => {
    if (!edges.has(from)) edges.set(from, new Set());
    edges.get(from).add(to);
  };

  for (const network of model.networks) {
    for (const block of network.blocks) {
      const estopActive=block.functionName==="safeEstop"?new Set([block.inputs.find(p=>p.name==="Restart")?.path,...effectiveEstopInputs(block).map(({port})=>port.path)]):null;
      for (const input of block.inputs) {
        for (const global of input.globals) {
          add(`var:${global.lastKnownPath?.split(".").at(-1)}`, input.path);
        }
        if (estopActive?estopActive.has(input.path):!["Deactivated", "Both Deactivated"].includes(input.channelInterface)) {
          for (const output of block.outputs) add(input.path, output.path);
        }
      }
      for (const output of block.outputs) {
        for (const target of output.targets) add(output.path, target);
        for (const global of output.globals) add(output.path, `var:${global.lastKnownPath?.split(".").at(-1)}`);
      }
    }
  }

  for (const variable of model.variables) {
    const variableNode = `var:${variable.name}`;
    for (const target of variable.targetPorts) add(variableNode, target);
    for (const source of variable.sourcePorts) add(source, variableNode);
    for (const source of variable.sourcePorts) {
      for (const target of variable.targetPorts) add(source, target);
    }
  }
  return edges;
}

export function findPath(edges, from, to) {
  const queue = [[from]];
  const seen = new Set([from]);
  while (queue.length) {
    const path = queue.shift();
    const node = path.at(-1);
    if (node === to) return path;
    for (const next of edges.get(node) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return null;
}
