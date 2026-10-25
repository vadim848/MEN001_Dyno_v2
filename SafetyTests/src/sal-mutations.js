// E0 stand: surgical, self-checked mutations of a SAL XML text (never the
// canonical file; the runner applies them to a sandbox copy). Each operator
// changes exactly one attribute of one port/parameter of one block and the
// result is re-parsed to prove that the parsed model differs from the
// original in exactly that attribute and nowhere else.
// E2-runner-ops adds three structural operators, each with its own exact
// parsed-delta proof (verifyMutation, by change.kind):
//   swap-order            orderOfExecution permutation (moveAfter/moveBefore/swapWith);
//                         the global sequence of all other blocks is preserved
//   deactivate-input-pair two inputs of one safeAnd/safeOr Activated -> Deactivated
//   rewire                one input fed by exactly one output-side wiredLink is
//                         re-fed by another outPort of the SAME network
// E2a-rename adds:
//   rebind-global         one input read from exactly one global Symbol (SGVL) reads another
//                         EXISTING Symbol: SAL reference variableId/lastKnownPath changed and the
//                         SGVL TargetUsage of that port moved between the two Variables (same
//                         usage Id). Needs the SGVL text; returns a mutated SGVL as well.
import { parseSalFile } from "./sal-parser.js";
import { validateSalBindings } from "./sal-binding-validator.js";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const NC = "Break Contact (NC)", NO = "Make Contact (NO)";
const ESTOP_MODES = ["Single-Channel 1 Activated", "Single-Channel 2 Activated", "Single-Channel Both Activated", "Both Deactivated", "Two-Channel"];

function attrsOf(text) {
  return Object.fromEntries([...text.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
}

function uniqueMatch(text, rx, predicate, what) {
  const found = [...text.matchAll(rx)].filter(predicate);
  if (found.length !== 1) throw new Error(`${what}: expected exactly one match, found ${found.length}`);
  return found[0];
}

/** Absolute [start,end) of the block element `//Network/Block`. */
export function locateBlock(xml, blockPath) {
  const m = blockPath.match(/^\/\/([^/]+)\/([^/]+)$/);
  if (!m) throw new Error(`Block path must be //Network/Block: ${blockPath}`);
  const [, networkName, blockName] = m;
  // Self-closing `<Network .../>` (native empty network, E2-R1 S1) is an empty body,
  // so it can neither swallow the following Network nor host a block.
  const net = uniqueMatch(xml, /<Network\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Network>)/g, x => attrsOf(x[1]).name === networkName, `Network ${networkName}`);
  const bodyStart = net.index + net[0].indexOf(">") + 1;
  const body = net[2] ?? "";
  const block = uniqueMatch(body, /<(fB[A-Za-z0-9]+)\b([^>]*)>([\s\S]*?)<\/\1>/g, x => attrsOf(x[2]).name === blockName, `Block ${blockPath}`);
  return { start: bodyStart + block.index, end: bodyStart + block.index + block[0].length, tag: block[1], attrs: attrsOf(block[2]) };
}

function locateTag(xml, range, tag, name) {
  const slice = xml.slice(range.start, range.end);
  const m = uniqueMatch(slice, new RegExp(`<${tag}\\b([^>]*?)\\/?>`, "g"), x => attrsOf(x[1]).name === name, `${tag} ${name}`);
  return { start: range.start + m.index, end: range.start + m.index + m[0].length, text: m[0], attrs: attrsOf(m[1]) };
}

function setAttr(tagText, attr, from, to) {
  const needle = `${attr}="${from}"`;
  if (tagText.split(needle).length !== 2) throw new Error(`Attribute ${needle} not uniquely present in ${tagText.slice(0, 120)}`);
  return tagText.replace(needle, `${attr}="${to}"`);
}

export const OPERATORS = Object.freeze({
  /** AND/OR input removed from the conjunction/disjunction (guard term deleted). */
  "deactivate-input": (xml, m) => {
    const block = locateBlock(xml, m.block);
    if (!["safeAnd", "safeOr"].includes(block.attrs.functionName)) throw new Error("deactivate-input only for safeAnd/safeOr (other FB activation semantics are NV)");
    const port = locateTag(xml, block, "inPort", m.port);
    if (port.attrs.channelInterface !== "Activated") throw new Error(`${m.block}/${m.port} is not Activated`);
    return { block, port, attr: "channelInterface", before: "Activated", after: "Deactivated", text: setAttr(port.text, "channelInterface", "Activated", "Deactivated") };
  },
  /** NC <-> NO on an activated single-channel input (guard polarity negated). */
  "invert-contact": (xml, m) => {
    const block = locateBlock(xml, m.block);
    const port = locateTag(xml, block, "inPort", m.port);
    const before = port.attrs.deactivate1;
    if (![NC, NO].includes(before)) throw new Error(`${m.block}/${m.port} has no NC/NO deactivate1`);
    const after = before === NC ? NO : NC;
    return { block, port, attr: "deactivate1", before, after, text: setAttr(port.text, "deactivate1", before, after) };
  },
  /** ESTOP channel-pair master mode (adds/removes an emergency channel). */
  "set-channel-mode": (xml, m) => {
    const block = locateBlock(xml, m.block);
    if (block.attrs.functionName !== "safeEstop") throw new Error("set-channel-mode only for safeEstop masters");
    if (!ESTOP_MODES.includes(m.value)) throw new Error(`Unknown ESTOP mode ${m.value}`);
    const port = locateTag(xml, block, "inPort", m.port);
    const before = port.attrs.channelInterface;
    if (before === m.value) throw new Error("Mutation is a no-op");
    return { block, port, attr: "channelInterface", before, after: m.value, text: setAttr(port.text, "channelInterface", before, m.value) };
  },
  /** Timer/delay parameter value (Delay Time (s) for TON, Delay Time (ms) for ESTOP). */
  "set-parameter": (xml, m) => {
    const block = locateBlock(xml, m.block);
    const port = locateTag(xml, block, "parameterPort", m.port);
    const before = port.attrs.timing;
    if (before === undefined || String(m.value) === before) throw new Error("Parameter absent or mutation is a no-op");
    return { block, port, attr: "timing", before, after: String(m.value), text: setAttr(port.text, "timing", before, String(m.value)) };
  },
  /**
   * Execution order fault: block m.block is moved immediately after/before
   * value.moveAfter / value.moveBefore, or exchanges its position with
   * value.swapWith. The multiset of orderOfExecution values is preserved
   * (values are re-assigned by position), so every other block keeps its
   * relative order; only blocks whose value changes are edited.
   */
  "swap-order": (xml, m) => {
    const v = m.value ?? {};
    const modes = ["moveAfter", "moveBefore", "swapWith"].filter(k => v[k] !== undefined);
    if (modes.length !== 1 || typeof v[modes[0]] !== "string") throw new Error("swap-order needs exactly one of value.moveAfter / value.moveBefore / value.swapWith (block path)");
    const mode = modes[0], anchorPath = v[mode];
    if (anchorPath === m.block) throw new Error("swap-order: block and anchor are the same");
    const all = listBlocks(xml);
    const orders = all.map(b => b.order);
    if (orders.some(o => !Number.isInteger(o))) throw new Error("swap-order: a block has no integer orderOfExecution");
    if (new Set(orders).size !== orders.length) throw new Error("swap-order: orderOfExecution values are not unique; the global order is ambiguous");
    const seq = [...all].sort((a, b) => a.order - b.order);
    const values = seq.map(b => b.order);
    const xi = seq.findIndex(b => b.path === m.block), ai = seq.findIndex(b => b.path === anchorPath);
    if (xi < 0) throw new Error(`swap-order: block ${m.block} not found`);
    if (ai < 0) throw new Error(`swap-order: anchor ${anchorPath} not found`);
    let next;
    if (mode === "swapWith") { next = [...seq]; [next[xi], next[ai]] = [next[ai], next[xi]]; }
    else {
      next = seq.filter((_, i) => i !== xi);
      const at = next.findIndex(b => b.path === anchorPath) + (mode === "moveAfter" ? 1 : 0);
      next.splice(at, 0, seq[xi]);
    }
    const edits = [], moved = [];
    next.forEach((b, i) => {
      if (b.order === values[i]) return;
      const range = locateBlock(xml, b.path);
      const open = xml.slice(range.start, xml.indexOf(">", range.start) + 1);
      const text = setAttr(open, "orderOfExecution", String(b.order), String(values[i]));
      edits.push({ start: range.start, end: range.start + open.length, text });
      moved.push({ block: b.path, before: b.order, after: values[i] });
    });
    if (!moved.length) throw new Error("Mutation is a no-op (order already as requested)");
    return { edits, change: { kind: "order", block: m.block, port: "", attr: "orderOfExecution", mode, anchor: anchorPath,
      moved, sequenceAfter: next.map(b => b.path), before: String(seq[xi].order), after: String(values[next.indexOf(seq[xi])]) } };
  },
  /** Two inputs of one safeAnd/safeOr removed together (port "AndIn7+AndIn8"). */
  "deactivate-input-pair": (xml, m) => {
    const names = String(m.port ?? "").split("+").map(s => s.trim());
    if (names.length !== 2 || !names[0] || !names[1] || names[0] === names[1]) throw new Error(`deactivate-input-pair needs port "A+B" with two distinct inputs, got ${JSON.stringify(m.port)}`);
    const block = locateBlock(xml, m.block);
    if (!["safeAnd", "safeOr"].includes(block.attrs.functionName)) throw new Error("deactivate-input-pair only for safeAnd/safeOr (other FB activation semantics are NV)");
    const ports = names.map(n => locateTag(xml, block, "inPort", n));
    for (const [i, p] of ports.entries()) if (p.attrs.channelInterface !== "Activated") throw new Error(`${m.block}/${names[i]} is not Activated`);
    const activeLeft = [...xml.slice(block.start, block.end).matchAll(/<inPort\b([^>]*?)\/?>/g)].map(x => attrsOf(x[1]))
      .filter(a => a.channelInterface === "Activated" && !names.includes(a.name)).length;
    if (!activeLeft) throw new Error(`deactivate-input-pair would leave ${m.block} without any active input (semantics NV)`);
    const edits = ports.map(p => ({ start: p.start, end: p.end, text: setAttr(p.text, "channelInterface", "Activated", "Deactivated") }));
    return { edits, change: { kind: "pair", block: m.block, port: names.join("+"), ports: names, attr: "channelInterface", before: "Activated", after: "Deactivated" } };
  },
  /**
   * Input m.port of m.block, bound by exactly one fbPortGlobalVariableReference (and by no
   * wire/alias), is re-bound to the EXISTING global Symbol value.global (SGVL Variable Name).
   * SAL: variableId + lastKnownPath of that one reference. SGVL: the one TargetUsage FbPortUsage
   * whose ModelElementId is the port Id moves from the old Variable to the new one (Id kept).
   * Refused: no SGVL text, Symbol unknown/ambiguous/same, Symbol without a writer (semantics would be
   * an unconnected-input assumption), new Variable without a TargetUsages container (native form
   * unobserved). If the old Symbol loses its last reader its TargetUsages stays as an empty element
   * (reported as oldSymbolOrphaned). Creating a NEW Symbol is not supported (manual procedure).
   */
  "rebind-global": (xml, m, ctx = {}) => {
    const name = m.value?.global;
    if (typeof name !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error("rebind-global needs value.global = name of an existing GVL Symbol");
    if (typeof ctx.sgvlXml !== "string") throw new Error("rebind-global needs the SGVL text of the source (runner passes it)");
    const sgvl = ctx.sgvlXml;
    const block = locateBlock(xml, m.block);
    const inPort = locateTag(xml, block, "inPort", m.port);
    const target = `${m.block}/${m.port}`;
    const body = inPortBody(xml, inPort);
    const refs = [...body.matchAll(/<fbPortGlobalVariableReference\b([^>]*?)\/>/g)];
    if (refs.length !== 1) throw new Error(`rebind-global: ${target} must be bound by exactly one global Symbol reference (found ${refs.length})`);
    if (/<outPortMoniker\b/.test(body)) throw new Error(`rebind-global: ${target} also carries an input-side wire`);
    if ([...xml.matchAll(new RegExp(`<inPortMoniker\\b[^>]*name="${escapeRx(target)}"[^>]*\\/>`, "g"))].length) throw new Error(`rebind-global: ${target} is also bound by a wire/alias moniker`);
    const ref = attrsOf(refs[0][1]);
    const [gvl, oldName] = String(ref.lastKnownPath ?? "").split(".");
    if (!gvl || !oldName) throw new Error(`rebind-global: unexpected lastKnownPath ${ref.lastKnownPath}`);
    if (oldName === name) throw new Error("Mutation is a no-op (same Symbol)");
    const vars = sgvlVariables(sgvl);
    const byName = vars.filter(v => v.name === name), olds = vars.filter(v => v.id === ref.variableId);
    if (byName.length !== 1) throw new Error(`rebind-global: Symbol ${name} ${byName.length ? "is ambiguous" : "not found"} in SGVL (creating a Symbol is a manual procedure)`);
    if (olds.length !== 1 || olds[0].name !== oldName) throw new Error(`rebind-global: SGVL Variable ${ref.variableId} (${oldName}) not uniquely resolved`);
    const nv = byName[0], ov = olds[0];
    if (!nv.sources.length) throw new Error(`rebind-global: Symbol ${name} has no writer (SourceUsages); semantics NV`);
    if (nv.targetsClose < 0) throw new Error(`rebind-global: Symbol ${name} has no TargetUsages container (native form unobserved)`);
    const usageRx = new RegExp(`[ \\t]*<FbPortUsage Id="([^"]+)">\\s*<ModelElementId>${escapeRx(inPort.attrs.Id)}</ModelElementId>\\s*</FbPortUsage>[ \\t]*\\r?\\n`, "g");
    const usages = [...sgvl.matchAll(usageRx)];
    if (usages.length !== 1) throw new Error(`rebind-global: expected exactly one SGVL FbPortUsage for port ${inPort.attrs.Id}, found ${usages.length}`);
    const u = usages[0];
    if (!(u.index > ov.targetsOpen && u.index < ov.targetsClose)) throw new Error("rebind-global: the port usage is not in the old Variable's TargetUsages");
    // SGVL: remove the usage, insert the same text before the new Variable's </TargetUsages> line.
    const insertAt = sgvl.lastIndexOf("\n", nv.targetsClose) + 1;
    const sgvlEdits = [{ start: u.index, end: u.index + u[0].length, text: "" }, { start: insertAt, end: insertAt, text: u[0] }].sort((a, b) => b.start - a.start);
    let sgvlOut = sgvl; for (const e of sgvlEdits) sgvlOut = sgvlOut.slice(0, e.start) + e.text + sgvlOut.slice(e.end);
    const refStart = inPort.end + refs[0].index, refText = refs[0][0];
    const newRef = setAttr(setAttr(refText, "variableId", ref.variableId, nv.id), "lastKnownPath", ref.lastKnownPath, `${gvl}.${name}`);
    return { edits: [{ start: refStart, end: refStart + refText.length, text: newRef }], sgvl: sgvlOut,
      change: { kind: "global", block: m.block, port: m.port, target, portId: inPort.attrs.Id, attr: "globals", usageId: u[1],
        before: `${gvl}.${oldName}`, after: `${gvl}.${name}`, beforeVariableId: ov.id, afterVariableId: nv.id,
        oldSymbolOrphaned: ov.targets.length === 1 } };
  },
  /**
   * Input m.port of m.block is re-fed from value.source (an outPort of the SAME
   * network). Precondition: the input is bound by exactly one output-side
   * wiredLink (native serialization) and by no Symbol/alias. The old wiredLink
   * is removed and one wiredLink with a deterministic Id is added under the new
   * source outPort. Cross-network sources (Symbol + SGVL usage edits) are refused.
   */
  "rewire": (xml, m) => {
    const source = m.value?.source;
    if (typeof source !== "string") throw new Error("rewire needs value.source = //Network/Block/OutPort");
    const target = `${m.block}/${m.port}`;
    const tm = target.match(/^\/\/([^/]+)\/[^/]+\/[^/]+$/), sm = source.match(/^\/\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (!tm || !sm) throw new Error("rewire: target and source must be //Network/Block/Port");
    if (tm[1] !== sm[1]) throw new Error(`rewire: cross-network source ${source} -> ${target} needs a Symbol/SGVL usage edit; not supported (manual G3 procedure)`);
    if (`//${sm[1]}/${sm[2]}` === m.block) throw new Error("rewire: a block cannot feed its own input");
    const block = locateBlock(xml, m.block);
    const inPort = locateTag(xml, block, "inPort", m.port);
    const inBody = inPortBody(xml, inPort);
    if (/<fbPortGlobalVariableReference\b/.test(inBody)) throw new Error(`rewire: ${target} is bound by a Symbol, not a wire`);
    if (/<outPortMoniker\b/.test(inBody)) throw new Error(`rewire: ${target} carries an input-side wire; only native output-side wires are supported`);
    const monikerRx = new RegExp(`<inPortMoniker\\b[^>]*name="${escapeRx(target)}"[^>]*\\/>`, "g");
    const wireRx = new RegExp(`[ \\t]*<wiredLink\\b[^>]*>\\s*<inPortMoniker\\b[^>]*name="${escapeRx(target)}"[^>]*\\/>\\s*<\\/wiredLink>[ \\t]*\\r?\\n?`, "g");
    const monikers = [...xml.matchAll(monikerRx)], wires = [...xml.matchAll(wireRx)];
    if (wires.length !== 1 || monikers.length !== 1) throw new Error(`rewire: ${target} must be bound by exactly one wiredLink and nothing else (wires ${wires.length}, monikers ${monikers.length})`);
    const old = wires[0];
    const oldSource = ownerOutPort(xml, old.index + old[0].indexOf("<wiredLink"));
    if (oldSource === source) throw new Error("Mutation is a no-op (source unchanged)");
    const srcBlock = locateBlock(xml, `//${sm[1]}/${sm[2]}`);
    const srcPort = locateTag(xml, srcBlock, "outPort", sm[3]);
    const id = deterministicGuid(`${m.id ?? ""}|${source}|${target}`);
    if (xml.includes(`Id="${id}"`)) throw new Error("rewire: generated wire Id collides");
    const indentOf = pos => xml.slice(xml.lastIndexOf("\n", pos) + 1, pos).match(/^[ \t]*/)[0];
    const nl = xml.includes("\r\n") ? "\r\n" : "\n";
    const pi = indentOf(srcPort.start), step = "  ";
    const wire = ind => `${ind}<wiredLink Id="${id}">${nl}${ind}${step}<inPortMoniker name="${target}" />${nl}${ind}</wiredLink>${nl}`;
    // An emptied <targetFunctionBlockPorts> of the old source is removed with the wire (parse-equivalent).
    const oldContainer = emptiedContainer(xml, old.index, old.index + old[0].length);
    const edits = [oldContainer ? { start: oldContainer.start, end: oldContainer.end, text: "" } : { start: old.index, end: old.index + old[0].length, text: "" }];
    if (srcPort.text.endsWith("/>")) {
      edits.push({ start: srcPort.start, end: srcPort.end, text: `${srcPort.text.slice(0, -2).trimEnd()}>${nl}${pi}${step}<targetFunctionBlockPorts>${nl}${wire(pi + step + step)}${pi}${step}</targetFunctionBlockPorts>${nl}${pi}</outPort>` });
    } else {
      const close = xml.indexOf("</outPort>", srcPort.end);
      const body = xml.slice(srcPort.end, close);
      const tf = body.lastIndexOf("</targetFunctionBlockPorts>");
      if (tf >= 0) {
        const at = srcPort.end + tf;
        const lineStart = xml.lastIndexOf("\n", at) + 1;
        edits.push({ start: lineStart, end: lineStart, text: wire(indentOf(at) + step) });
      } else edits.push({ start: srcPort.end, end: srcPort.end, text: `${nl}${pi}${step}<targetFunctionBlockPorts>${nl}${wire(pi + step + step)}${pi}${step}</targetFunctionBlockPorts>` });
    }
    return { edits, change: { kind: "wire", block: m.block, port: m.port, attr: "sources", target, before: oldSource, after: source, wireId: id } };
  }
});

/** SGVL Variables: Id, Name, source/target port Ids and the TargetUsages range. */
export function sgvlVariables(sgvl) {
  return [...sgvl.matchAll(/<Variable Id="([^"]+)">([\s\S]*?)<\/Variable>/g)].map(v => {
    const at = v.index, text = v[0];
    const sec = tag => { const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)); return m ? [...m[1].matchAll(/<ModelElementId>([^<]+)<\/ModelElementId>/g)].map(x => x[1].trim()) : []; };
    const to = text.indexOf("<TargetUsages>"), tc = text.indexOf("</TargetUsages>");
    return { id: v[1], name: (text.match(/<Name>([^<]*)<\/Name>/) ?? [])[1], sources: sec("SourceUsages"), targets: sec("TargetUsages"),
      targetsOpen: to < 0 ? -1 : at + to, targetsClose: tc < 0 ? -1 : at + tc };
  });
}

function escapeRx(s) { return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"); }

function deterministicGuid(seed) {
  const h = crypto.createHash("sha256").update(`sal-mutation-rewire|${seed}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function inPortBody(xml, port) {
  if (port.text.endsWith("/>")) return "";
  return xml.slice(port.end, xml.indexOf("</inPort>", port.end));
}

/** Path of the outPort that owns the wiredLink starting at pos. */
function ownerOutPort(xml, pos) {
  const open = xml.lastIndexOf("<outPort ", pos);
  if (open < 0 || xml.lastIndexOf("</outPort>", pos) > open) throw new Error("rewire: wiredLink is not inside an outPort");
  const name = attrsOf(xml.slice(open, xml.indexOf(">", open))).name;
  const head = xml.slice(0, open);
  const blockOpen = [...head.matchAll(/<(fB[A-Za-z0-9]+)\b([^>]*)>/g)].at(-1);
  const netOpen = [...head.matchAll(/<Network\b([^>]*?)>/g)].at(-1);
  return `//${attrsOf(netOpen[1]).name}/${attrsOf(blockOpen[2]).name}/${name}`;
}

/** If removing [start,end) leaves its <targetFunctionBlockPorts> without a wiredLink, the container range (with its line). */
function emptiedContainer(xml, start, end) {
  const open = xml.lastIndexOf("<targetFunctionBlockPorts>", start);
  const close = xml.indexOf("</targetFunctionBlockPorts>", end);
  if (open < 0 || close < 0) return null;
  if (/<wiredLink\b/.test(xml.slice(open, start) + xml.slice(end, close))) return null;
  const lineStart = xml.lastIndexOf("\n", open) + 1;
  let stop = close + "</targetFunctionBlockPorts>".length;
  const after = xml.slice(stop).match(/^[ \t]*\r?\n/);
  if (after) stop += after[0].length;
  return { start: lineStart, end: stop };
}

/** Every block of every Network with its global orderOfExecution. */
export function listBlocks(xml) {
  const out = [];
  for (const net of xml.matchAll(/<Network\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Network>)/g)) {
    const name = attrsOf(net[1]).name;
    for (const b of (net[2] ?? "").matchAll(/<(fB[A-Za-z0-9]+)\b([^>]*)>/g)) {
      const a = attrsOf(b[2]);
      out.push({ path: `//${name}/${a.name}`, order: Number(a.orderOfExecution) });
    }
  }
  return out;
}

/** Operators the runner can apply (a plan op outside this set is NOT-RUN only if flagged operatorAvailable:false). */
export const operatorNames = () => Object.keys(OPERATORS);

/** Apply one mutation to SAL XML text. Returns { xml, change }. */
export function applyMutation(xml, mutation, ctx = {}) {
  const op = OPERATORS[mutation.op];
  if (!op) throw new Error(`Unknown mutation operator ${mutation.op}`);
  const r = op(xml, mutation, ctx);
  if (r.edits) {
    const edits = [...r.edits].sort((a, b) => b.start - a.start);
    for (let i = 1; i < edits.length; i++) if (edits[i].end > edits[i - 1].start) throw new Error("Overlapping mutation edits");
    let out = xml;
    for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
    return { xml: out, change: { ...r.change, offset: Math.min(...r.edits.map(e => e.start)) }, ...(r.sgvl !== undefined ? { sgvl: r.sgvl } : {}) };
  }
  const out = xml.slice(0, r.port.start) + r.text + xml.slice(r.port.end);
  if (out.length - xml.length !== r.after.length - r.before.length) throw new Error("Unexpected size delta");
  return { xml: out, change: { block: mutation.block, port: mutation.port, attr: r.attr, before: r.before, after: r.after, offset: r.port.start } };
}

function flatten(model) {
  const rows = new Map();
  for (const n of model.networks) for (const b of n.blocks) {
    rows.set(`${b.path}#block`, JSON.stringify([b.functionName, b.orderOfExecution, b.type]));
    for (const p of [...b.inputs, ...b.outputs]) rows.set(p.path, JSON.stringify(p));
    for (const p of b.parameters) rows.set(`${b.path}#param:${p.name}`, JSON.stringify(p));
  }
  for (const v of model.variables) rows.set(`var:${v.name}`, JSON.stringify(v));
  return rows;
}

const changedFields = (a, b) => Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
const sameSet = (a, b) => a.length === b.length && new Set(a).size === a.length && a.every(x => b.includes(x));

function verifyOrder(ra, rb, diffs, change, mb) {
  const expected = change.moved.map(x => `${x.block}#block`).sort();
  if (!sameSet(diffs, expected)) throw new Error(`Parsed delta mismatch: expected only order of ${JSON.stringify(expected.slice(0, 5))}, got ${JSON.stringify(diffs.slice(0, 5))}`);
  for (const x of change.moved) {
    const a = JSON.parse(ra.get(`${x.block}#block`)), b = JSON.parse(rb.get(`${x.block}#block`));
    if (a[0] !== b[0] || a[2] !== b[2] || a[1] !== x.before || b[1] !== x.after) throw new Error(`Parsed order delta mismatch at ${x.block}`);
  }
  const seq = mb.networks.flatMap(n => n.blocks).sort((a, b) => a.orderOfExecution - b.orderOfExecution).map(b => b.path);
  if (JSON.stringify(seq) !== JSON.stringify(change.sequenceAfter)) throw new Error("Parsed execution sequence differs from the declared one");
  return { parsedDelta: expected, attribute: "orderOfExecution", movedBlocks: change.moved.length };
}

function verifyPair(ra, rb, diffs, change) {
  const expected = change.ports.map(p => `${change.block}/${p}`).sort();
  if (!sameSet(diffs, expected)) throw new Error(`Parsed delta mismatch: expected only ${JSON.stringify(expected)}, got ${JSON.stringify(diffs.slice(0, 5))}`);
  for (const k of expected) {
    const a = JSON.parse(ra.get(k)), b = JSON.parse(rb.get(k)), f = changedFields(a, b);
    if (f.length !== 1 || f[0] !== "channelInterface" || a.channelInterface !== "Activated" || b.channelInterface !== "Deactivated") throw new Error(`Parsed attribute delta mismatch at ${k}: ${JSON.stringify(f)}`);
  }
  return { parsedDelta: expected, attribute: "channelInterface" };
}

function verifyWire(ra, rb, diffs, change) {
  const expected = [change.target, change.before, change.after].sort();
  if (!sameSet(diffs, expected)) throw new Error(`Parsed delta mismatch: expected only ${JSON.stringify(expected)}, got ${JSON.stringify(diffs.slice(0, 5))}`);
  const get = (rows, k) => JSON.parse(rows.get(k));
  const t0 = get(ra, change.target), t1 = get(rb, change.target);
  if (JSON.stringify(changedFields(t0, t1)) !== JSON.stringify(["sources"]) || JSON.stringify(t0.sources) !== JSON.stringify([change.before]) ||
    JSON.stringify(t1.sources) !== JSON.stringify([change.after]) || t1.globals.length) throw new Error(`Parsed wire delta mismatch at ${change.target}`);
  const o0 = get(ra, change.before), o1 = get(rb, change.before);
  if (JSON.stringify(changedFields(o0, o1)) !== JSON.stringify(["targets"]) || !o0.targets.includes(change.target) || !sameSet(o0.targets.filter(t => t !== change.target), o1.targets))
    throw new Error(`Parsed wire delta mismatch at old source ${change.before}`);
  const n0 = get(ra, change.after), n1 = get(rb, change.after);
  if (JSON.stringify(changedFields(n0, n1)) !== JSON.stringify(["targets"]) || n0.targets.includes(change.target) || !sameSet([...n0.targets, change.target], n1.targets))
    throw new Error(`Parsed wire delta mismatch at new source ${change.after}`);
  return { parsedDelta: expected, attribute: "sources" };
}

function verifyGlobal(ra, rb, diffs, change, sgvlBefore, sgvlAfter) {
  if (!sameSet(diffs, [change.target])) throw new Error(`Parsed delta mismatch: expected only ${change.target}, got ${JSON.stringify(diffs.slice(0, 5))}`);
  const a = JSON.parse(ra.get(change.target)), b = JSON.parse(rb.get(change.target));
  if (JSON.stringify(changedFields(a, b)) !== JSON.stringify(["globals"]) || a.globals.length !== 1 || b.globals.length !== 1 ||
    a.globals[0].lastKnownPath !== change.before || b.globals[0].lastKnownPath !== change.after || b.globals[0].variableId !== change.afterVariableId ||
    a.globals[0].Id !== b.globals[0].Id || a.sources.length || b.sources.length) throw new Error(`Parsed global delta mismatch at ${change.target}`);
  if (typeof sgvlBefore !== "string" || typeof sgvlAfter !== "string") throw new Error("rebind-global verification needs original and mutant SGVL");
  const va = sgvlVariables(sgvlBefore), vb = sgvlVariables(sgvlAfter);
  if (va.length !== vb.length) throw new Error("SGVL Variable count changed");
  for (const [i, x] of va.entries()) {
    const y = vb[i];
    const want = x.id === change.beforeVariableId ? x.targets.filter(t => t !== change.portId) : x.id === change.afterVariableId ? [...x.targets, change.portId] : x.targets;
    if (y.id !== x.id || y.name !== x.name || JSON.stringify(y.sources) !== JSON.stringify(x.sources) || JSON.stringify(y.targets) !== JSON.stringify(want))
      throw new Error(`SGVL delta mismatch at Variable ${x.name}`);
  }
  const strip = t => t.replace(new RegExp(`[ \\t]*<FbPortUsage Id="${escapeRx(change.usageId)}">[\\s\\S]*?</FbPortUsage>[ \\t]*\\r?\\n`), "");
  if (strip(sgvlBefore) !== strip(sgvlAfter)) throw new Error("SGVL text differs beyond the moved FbPortUsage");
  return { parsedDelta: [change.target], attribute: "globals", sgvlDelta: { usageId: change.usageId, from: change.before, to: change.after, oldSymbolOrphaned: change.oldSymbolOrphaned } };
}

/**
 * Prove the mutant differs from the original parse in exactly the declared
 * change. Parses both texts as fixture-or-explicit-injection (no binding audit)
 * from temporary files; the runner separately executes tests on the mutated
 * canonical path with the normal current-mode audit. With `sgvlXml`, a source
 * that passes the SAL/SGVL binding validation must still pass it as a mutant
 * (otherwise every current test would only fail to load: never a kill).
 */
export function verifyMutation(originalXml, mutantXml, change, { sgvlXml, mutantSgvlXml } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "salmut-verify-"));
  try {
    const a = path.join(dir, "a.sal"), b = path.join(dir, "b.sal");
    fs.writeFileSync(a, originalXml); fs.writeFileSync(b, mutantXml);
    const ma = parseSalFile(a, { bindingMode: "fixture" }), mb = parseSalFile(b, { bindingMode: "fixture" });
    const ra = flatten(ma), rb = flatten(mb);
    const keys = new Set([...ra.keys(), ...rb.keys()]);
    const diffs = [...keys].filter(k => ra.get(k) !== rb.get(k));
    let result;
    if (change.kind === "order") result = verifyOrder(ra, rb, diffs, change, mb);
    else if (change.kind === "pair") result = verifyPair(ra, rb, diffs, change);
    else if (change.kind === "wire") result = verifyWire(ra, rb, diffs, change);
    else if (change.kind === "global") result = verifyGlobal(ra, rb, diffs, change, sgvlXml, mutantSgvlXml);
    else {
      const expectedKey = change.attr === "timing" ? `${change.block}#param:${change.port}` : `${change.block}/${change.port}`;
      if (diffs.length !== 1 || diffs[0] !== expectedKey) throw new Error(`Parsed delta mismatch: expected only ${expectedKey}, got ${JSON.stringify(diffs.slice(0, 5))}`);
      const before = JSON.parse(ra.get(expectedKey)), after = JSON.parse(rb.get(expectedKey));
      const changed = changedFields(before, after);
      if (changed.length !== 1 || changed[0] !== change.attr || after[change.attr] !== change.after)
        throw new Error(`Parsed attribute delta mismatch: ${JSON.stringify(changed)}`);
      result = { parsedDelta: expectedKey, attribute: change.attr };
    }
    if (sgvlXml !== undefined && validateSalBindings(originalXml, sgvlXml).status === "PASS") {
      const v = validateSalBindings(mutantXml, mutantSgvlXml ?? sgvlXml);
      if (v.status !== "PASS") throw new Error(`Mutant fails SAL/SGVL binding validation (tests could only fail to load): ${v.errors.slice(0, 3).join("; ")}`);
      result.bindingValidation = "PASS";
    }
    return result;
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
