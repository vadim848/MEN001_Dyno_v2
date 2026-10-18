function variableName(reference) {
  return reference?.lastKnownPath?.split(".").at(-1);
}

function activePorts(ports) {
  return ports.filter(port => !["Deactivated", "Both Deactivated"].includes(port.channelInterface));
}

export class SalRuntime {
  constructor(model, { scanMs = 10 } = {}) {
    this.model = model;
    this.scanMs = scanMs;
    this.values = new Map();
    this.memory = new Map();
    this.variableSources = new Map();
    this.outputVariables = new Map();
    this.variableTargets = new Map();
    this.unsupported = new Set();

    for (const variable of model.variables) {
      for (const source of variable.sourcePorts) {
        this.variableSources.set(variable.name, source);
        if (!this.outputVariables.has(source)) this.outputVariables.set(source, []);
        this.outputVariables.get(source).push(variable.name);
      }
      for (const target of variable.targetPorts) this.variableTargets.set(target, variable.name);
    }
  }

  setInputs(values) {
    for (const [name, value] of Object.entries(values)) this.values.set(`var:${name}`, Boolean(value));
    return this;
  }

  get(name) {
    return Boolean(this.values.get(name.startsWith("//") || name.startsWith("var:") ? name : `var:${name}`));
  }

  read(port) {
    let raw;
    if (port.sources.length) raw = this.get(port.sources[0]);
    else if (port.globals.length) raw = this.get(`var:${variableName(port.globals[0])}`);
    const variable = this.variableTargets.get(port.path);
    if (raw === undefined && variable) raw = this.get(`var:${variable}`);
    if (raw === undefined && this.values.has(port.path)) raw = this.get(port.path);
    // An unconnected activated input is stored as its neutral TRUE value.
    if (raw === undefined) raw = true;
    // In this SAL encoding "Make Contact (NO)" is the negated contact. This is
    // observable in Network12: it prevents the single-button branch while the
    // other physical button is active.
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
    const inputs = activePorts(block.inputs).map(port => this.read(port));
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
        const reset = this.read(block.inputs.find(port => port.name === "Reset"));
        const set = this.read(block.inputs.find(port => port.name === "Set"));
        const previous = this.memory.get(block.path)?.value ?? false;
        const value = reset ? false : set ? true : previous;
        this.memory.set(block.path, { value });
        this.write(block.outputs[0], value);
        break;
      }
      case "safeTon": {
        const enabled = inputs[0] ?? false;
        const delayMs = Number(block.parameters.find(p => p.timing)?.timing ?? 0) * 1000;
        const previous = this.memory.get(block.path)?.elapsedMs ?? 0;
        const elapsedMs = enabled ? previous + dtMs : 0;
        this.memory.set(block.path, { elapsedMs });
        this.write(block.outputs[0], enabled && elapsedMs >= delayMs);
        break;
      }
      case "safeEstop": {
        const safetyInputs = block.inputs.filter(port =>
          port.name.startsWith("EStopIn") && !["Deactivated", "Both Deactivated"].includes(port.channelInterface)
        );
        const safe = safetyInputs.every(port => this.read(port));
        const restart = this.read(block.inputs.find(port => port.name === "Restart"));
        const previous = this.memory.get(block.path) ?? { enabled: false, delayMs: 0 };
        const enabled = safe && (previous.enabled || restart);
        const configuredDelay = Number(block.parameters.find(p => p.timing)?.timing ?? 0);
        const delayMs = enabled ? previous.delayMs + dtMs : 0;
        this.memory.set(block.path, { enabled, delayMs });
        this.write(block.outputs.find(port => port.name === "Error"), false);
        this.write(block.outputs.find(port => port.name === "EStopOut"), enabled);
        this.write(block.outputs.find(port => port.name === "EStopDelOut"), enabled && delayMs >= configuredDelay);
        break;
      }
      default:
        this.unsupported.add(block.functionName || block.type);
    }
  }

  scan(dtMs = this.scanMs) {
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
