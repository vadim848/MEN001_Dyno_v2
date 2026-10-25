import { effectiveEstopInputs } from "./estop-native-pairs.js";
function variableName(reference) {
  return reference?.resolvedName ?? reference?.lastKnownPath?.split(".").at(-1);
}

function activePorts(ports) {
  return ports.filter(port => !["Deactivated", "Both Deactivated"].includes(port.channelInterface));
}

export const SAL_CLOCK_CONTRACT = Object.freeze({
  version:"observed-fixed-scan-v1",edgeOrigin:"First observed enabled/loss sample has elapsed0",
  scope:"Fixed scanMs per scenario; no physical/native timing claim; off-grid event timestamps are unsupported"
});

// E0-stand P1: a value the executed model does not produce and the test did
// not establish is an ERROR, never a silent FALSE. "record" keeps the legacy
// FALSE fallback but registers every such read (assumption registry).
export class SalUndefinedInputError extends Error {
  constructor(message, detail) { super(message); this.name = "SalUndefinedInputError"; this.detail = detail; }
}
export const SAL_INPUT_CONTRACT = Object.freeze({
  version: "undefined-input-error-v1",
  rule: "Reads of an external variable, a cut wire or a get() key that no executed block produces must be established by setInputs/assumedInputs/values; otherwise SalUndefinedInputError. Unbound ports require an explicit unconnectedInput Boolean.",
  internalInitialValue: "FALSE before the producing executed block first runs (documented STOP/SAFE output 0; first-cycle feedback value not natively verified)"
});

// Process-wide ledger of record-mode reads, so reports can publish every assumed value.
export const SAL_UNDEFINED_INPUT_LEDGER = new Map();

export function ledgerSnapshot() { return new Map([...SAL_UNDEFINED_INPUT_LEDGER].map(([k, v]) => [k, v.reads])); }
export function undefinedReadsSince(snapshot) {
  return [...SAL_UNDEFINED_INPUT_LEDGER.values()].filter(v => v.reads > (snapshot.get(v.key) ?? 0)).map(({ key, kind, value }) => ({ key, kind, value }));
}

export class SalRuntime {
  constructor(model, { scanMs = 10, executionOrder = "global", unconnectedInput, undefinedInputs = "error", assumedInputs = {} } = {}) {
    if (!["global", "legacy-network"].includes(executionOrder)) throw new Error("Unknown execution order");
    if (unconnectedInput !== undefined && typeof unconnectedInput !== "boolean") throw new Error("unconnectedInput must be an explicit Boolean assumption");
    if (!["error", "record"].includes(undefinedInputs)) throw new Error('undefinedInputs must be "error" or "record"');
    this.model = model;
    if (model.bindingMode === "current") {
      if(model.bindingAudit?.status !== "PASS")throw Error("Current SAL requires namespace/relationship validation before execution");
      for(const block of model.networks.flatMap(n=>n.blocks))for(const port of [...block.inputs,...block.outputs])
        for(const global of port.globals)if(!global.resolvedName)throw Error(`Unresolved current global namespace at ${port.path}`);
    }
    this.scanMs = scanMs;
    this.executionOrder = executionOrder;
    this.unconnectedInput = unconnectedInput;
    this.assumedUnconnectedPorts = new Set();
    this.limitations = new Set();
    this.values = new Map();
    this.memory = new Map();
    this.variableSources = new Map();
    this.outputVariables = new Map();
    this.variableTargets = new Map();
    this.unsupported = new Set();
    this.undefinedInputs = undefinedInputs;
    this.undefinedInputReads = new Map();
    this.declaredAssumptions = new Map();
    // Keys produced by blocks that this runtime actually executes.
    this.internalKeys = new Set();
    const executedOutputs = new Set(model.networks.flatMap(n => n.blocks.flatMap(b => b.outputs.map(o => o.path))));
    for (const network of model.networks) for (const block of network.blocks) for (const output of block.outputs) {
      this.internalKeys.add(output.path);
      for (const global of output.globals) { const name = variableName(global); if (name) this.internalKeys.add(`var:${name}`); }
      for (const target of output.targets) this.internalKeys.add(target);
    }

    for (const variable of model.variables) {
      for (const source of variable.sourcePorts) {
        this.variableSources.set(variable.name, source);
        if (!this.outputVariables.has(source)) this.outputVariables.set(source, []);
        this.outputVariables.get(source).push(variable.name);
      }
      for (const target of variable.targetPorts) this.variableTargets.set(target, variable.name);
      if (variable.sourcePorts.some(source => executedOutputs.has(source))) this.internalKeys.add(`var:${variable.name}`);
    }
    for (const [name, value] of Object.entries(assumedInputs)) {
      if (typeof value !== "boolean") throw new Error(`assumedInputs.${name} must be Boolean`);
      this.declaredAssumptions.set(name, value);
      this.values.set(`var:${name}`, value);
    }
  }

  undefinedRead(key, context, legacyValue = false) {
    const detail = { key, ...context, value: legacyValue };
    if (this.undefinedInputs === "error")
      throw new SalUndefinedInputError(`Undefined input ${key} (${context.kind}${context.port ? " at " + context.port : ""}): no executed block produces it and the test did not establish it`, detail);
    const entry = this.undefinedInputReads.get(key) ?? { ...detail, reads: 0 };
    entry.reads += 1;
    this.undefinedInputReads.set(key, entry);
    const ledger = SAL_UNDEFINED_INPUT_LEDGER.get(key) ?? { key, kind: context.kind, value: legacyValue, ports: [], reads: 0 };
    ledger.reads += 1;
    if (context.port && !ledger.ports.includes(context.port)) ledger.ports.push(context.port);
    SAL_UNDEFINED_INPUT_LEDGER.set(key, ledger);
    return legacyValue;
  }

  bound(key, context) {
    if (this.values.has(key)) return this.values.get(key);
    if (this.internalKeys.has(key)) return false;
    return this.undefinedRead(key, context);
  }

  setInputs(values) {
    for (const [name, value] of Object.entries(values)) this.values.set(`var:${name}`, Boolean(value));
    return this;
  }

  get(name) {
    const key = name.startsWith("//") || name.startsWith("var:") ? name : `var:${name}`;
    return Boolean(this.bound(key, { kind: "get" }));
  }

  readRaw(port) {
    let raw;
    // Same precedence as before P1: wire, then global reference, then alias
    // variable, then explicit port injection; only the missing-value result changed.
    if (port.sources.length) raw = Boolean(this.bound(port.sources[0], { kind: "wire", port: port.path }));
    else if (port.globals.length) raw = Boolean(this.bound(`var:${variableName(port.globals[0])}`, { kind: "global", port: port.path }));
    const variable = this.variableTargets.get(port.path);
    if (raw === undefined && variable) raw = Boolean(this.bound(`var:${variable}`, { kind: "alias", port: port.path }));
    if (raw === undefined && this.values.has(port.path)) raw = Boolean(this.values.get(port.path));
    // SAL does not establish a universal value for unconnected ports. Require an
    // explicit assumption and record it so partial execution is not validation.
    if (raw === undefined) {
      if (this.unconnectedInput === undefined)
        return Boolean(this.undefinedRead(port.path, { kind: "unconnected", port: port.path }, true));
      this.assumedUnconnectedPorts.add(port.path);
      raw = this.unconnectedInput;
    }
    // In this SAL encoding "Make Contact (NO)" is the negated contact. This is
    // observable in Network12: it prevents the single-button branch while the
    // other physical button is active.
    return raw;
  }

  read(port) {
    const raw=this.readRaw(port);
    return port.deactivate1 === "Make Contact (NO)" ? !raw : raw;
  }

  write(port, value) {
    const logical = Boolean(value);
    this.values.set(port.path, logical);
    for (const name of this.outputVariables.get(port.path) ?? []) {
      this.values.set(`var:${name}`, logical);
    }
    for (const global of port.globals) {
      const name = variableName(global);
      if (name) this.values.set(`var:${name}`, logical);
    }
    for (const target of port.targets) this.values.set(target, logical);
  }

  evaluate(block, dtMs) {
    const inputs = block.functionName === "safeEstop" ? [] : activePorts(block.inputs).map(port => this.read(port));
    switch (block.functionName) {
      case "safeAnd":
        this.write(block.outputs[0], inputs.every(Boolean));
        break;
      case "safeOr":
        this.write(block.outputs[0], inputs.some(Boolean));
        break;
      case "safeDecouple":
        block.outputs.forEach((output, index) => this.write(output, this.read(block.inputs[index])));
        break;
      case "safeRs": {
        // §4.10.3/§4.12.3: RS/TON inputs are deactivated by default; a deactivated input has no documented value.
        for (const p of block.inputs) if (p.channelInterface !== "Activated") throw new Error(`${p.path}: non-activated ${block.functionName} input is unsupported (no documented value)`);
        const reset = this.read(block.inputs.find(port => port.name === "Reset"));
        const set = this.read(block.inputs.find(port => port.name === "Set"));
        const previous = this.memory.get(block.path)?.value ?? false;
        const value = reset ? false : set ? true : previous;
        this.memory.set(block.path, { value });
        this.write(block.outputs[0], value);
        break;
      }
      case "safeTon": {
        for (const p of block.inputs) if (p.channelInterface !== "Activated") throw new Error(`${p.path}: non-activated ${block.functionName} input is unsupported (no documented value)`);
        const enabled = inputs[0] ?? false;
        const delayMs = Number(block.parameters.find(p => p.timing)?.timing ?? 0) * 1000;
        const previous = this.memory.get(block.path) ?? { elapsedMs:0, previousEnabled:false };
        const elapsedMs = enabled ? (previous.previousEnabled ? previous.elapsedMs + dtMs : 0) : 0;
        this.memory.set(block.path, { elapsedMs, previousEnabled:enabled });
        this.write(block.outputs[0], enabled && elapsedMs >= delayMs);
        break;
      }
      case "safeEstop": {
        const edmPorts = block.inputs.filter(port => port.name.startsWith("EDM"));
        if (edmPorts.some(port => port.channelInterface === "Activated" || port.sources.length ||
          port.globals.length || this.variableTargets.has(port.path))) {
          throw new Error(`${block.path}: active/connected EDM is not implemented by this partial adapter`);
        }
        this.limitations.add(`${block.path}: EDM activation absent from parsed configuration; no-EDM assumption, group lifecycle/discrepancy unmodeled`);
        const safetyInputs=effectiveEstopInputs(block,{isBound:port=>port.sources.length>0||port.globals.length>0||
          this.variableTargets.has(port.path)||(this.model.bindingMode==="explicit-test-injection"&&this.values.has(port.path))});
        const safe=safetyInputs.every(({port,inverted})=>{const raw=this.readRaw(port);return inverted?!raw:raw;});
        const restart = this.read(block.inputs.find(port => port.name === "Restart"));
        const previous = this.memory.get(block.path) ?? { enabled: false, restartArmed: false, delayed: false, offElapsedMs: 0 };
        const enabled = safe && (previous.enabled || (previous.restartArmed && !restart));
        const configuredDelay = Number(block.parameters.find(p => p.timing)?.timing ?? 0);
        const offElapsedMs = enabled || previous.enabled ? 0 : previous.offElapsedMs + dtMs;
        const delayed = enabled || (previous.delayed && offElapsedMs < configuredDelay);
        this.memory.set(block.path, { enabled, restartArmed: safe && restart, delayed, offElapsedMs });
        this.write(block.outputs.find(port => port.name === "Error"), false);
        this.write(block.outputs.find(port => port.name === "EStopOut"), enabled);
        this.write(block.outputs.find(port => port.name === "EStopDelOut"), delayed);
        break;
      }
      default:
        this.unsupported.add(block.functionName || block.type);
    }
  }

  scan(dtMs = this.scanMs) {
    if (this.executionOrder === "global") {
      const ordered = this.model.networks.flatMap(network => network.blocks)
        .sort((a, b) => a.orderOfExecution - b.orderOfExecution);
      for (const block of ordered) this.evaluate(block, dtMs);
      return this;
    }
    for (const network of this.model.networks) {
      const ordered = [...network.blocks].sort((a, b) => a.orderOfExecution - b.orderOfExecution);
      for (const block of ordered) this.evaluate(block, dtMs);
    }
    return this;
  }

  runFor(durationMs, inputs) {
    if (inputs) this.setInputs(inputs);
    const scans = Math.ceil(durationMs / this.scanMs);
    for (let index = 0; index < scans; index += 1) this.scan(this.scanMs);
    return this;
  }
}
