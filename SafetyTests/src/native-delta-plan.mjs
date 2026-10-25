// Plan interpreter for exact multi-slice native delta proofs (stand D2, 2026-10-22).
// Reads ONLY the architect plan (program/architect/E2-status/PLAN.json) and the base source of a pair; it never reads
// the candidate. Each structural plan item is translated into operations on an abstract program model of the base
// (blocks, port states, input bindings, output Symbol bindings, Symbols); the expected model is then compared by the
// driver (scripts/e2-delta-check.mjs) with the candidate model. Items that cannot be translated are returned as
// UNINTERPRETED and make the pair FAIL - they are never skipped silently.
//
// Interpretation rules (stated once here, apply to every slice):
//  I-1  "P := S" binds input P to source S and activates it. Contact: "S NO" or "not S" -> Make Contact (NO, inverted);
//       "S NC" or plain "S" -> Break Contact (NC, direct). Precedent: F1 plan "OrIn1/OrIn2 Activated NC (direct),
//       OrIn3 Activated NO (inverted)"; E2a-core "N11/FBAnd4.AndIn3 contact NC -> NO (D-ARCH-POL)".
//  I-2  "wire B" = the single output port of block B (an error if B has several outputs and no port is named).
//  I-3  "P deactivate" -> channelInterface Deactivated, no contact attribute, no binding.
//  I-4  Deleting a block removes its ports, every wire touching them and every Symbol usage on them; inputs of
//       retained blocks that were fed by it keep their state and become unbound unless the plan rebinds/deactivates them.
//  I-5  Deleting a Symbol removes the declaration and every usage; its consumer inputs become unbound unless rebound.
//  I-6  A new block takes its port list and port attributes from the base blocks of the same functionName; unlisted
//       inputs are Deactivated without contact; listed inputs are bound in the order given (I-1); "<t> s" sets timing.
//  I-7  Text in parentheses is an ASSERTION when it has one of the forms "remove wire A->B", "existing Symbol on P;
//       second targetUsage", "<Port> <source>[, ...]" (checked on base and expected model); any other parenthesis
//       is a comment and is listed in the report.
//  I-8  Order: "X before/after Y", "A, B before Y", chain "A -> B -> C", and the head list (PLAN.v4.md section 2.2:
//       head of 15 blocks, in E2a 14 without FBOrS12Reset) from E2a-core on. Moved blocks (subjects, chain members,
//       head members) are exempt from the rule "all other retained blocks keep their relative order".
//  I-9  New Symbol kind (only where the plan creates one): link* -> SAL local variable, b_* -> SGVL Symbol.
import { canon } from './native-delta-model.mjs';

export const CONTACT = { NC: 'Break Contact (NC)', NO: 'Make Contact (NO)' };
export const CHAIN = ['F1', 'R1', 'E2a-core', 'E2a-RC', 'E2b', 'E2c', 'E2d'];
const expandNet = s => s.replace(/^N(\d+)\//, 'Network$1/');
const clone = x => structuredClone(x);

// ---------------------------------------------------------------- abstract model of a loaded source
export function abstractModel(S) {
  const s = S.sal, g = S.sgvl, anomalies = [];
  const blocks = new Map(), inPorts = new Map(), outPorts = new Map(), params = new Map();
  for (const b of s.blocks.values()) {
    const { Id, orderOfExecution, ...attrs } = b.attr;
    blocks.set(b.path, { fn: b.attr.functionName, tag: b.tag, network: b.network, name: b.attr.name, attrs, order: +orderOfExecution, ports: b.ports.map(p => ({ name: p.attr.name, kind: p.kind })) });
    for (const p of b.ports) {
      const { Id, ...all } = p.attr;
      if (p.kind === 'inPort') { const { channelInterface, deactivate1, ...rest } = all; inPorts.set(p.path, { block: b.path, name: p.attr.name, ci: channelInterface ?? null, contact: deactivate1 ?? null, src: [], attrs: rest }); }
      else if (p.kind === 'outPort') outPorts.set(p.path, { block: b.path, name: p.attr.name, syms: [], attrs: all });
      else params.set(p.path, { block: b.path, name: p.attr.name, attrs: all });
    }
  }
  const sgvl = new Map([...g.vars.values()].map(v => [v.name, { rest: v.rest }]));
  const salVars = new Map();
  for (const v of s.variables.values()) {
    const { Id, name, ...attrs } = v.attr;
    salVars.set(v.name, { attrs, alias: { source: v.use.source.filter(u => u.kind !== 'port').map(u => u.canon), target: v.use.target.filter(u => u.kind !== 'port').map(u => u.canon) } });
    for (const side of ['source', 'target']) for (const u of v.use[side].filter(u => u.kind === 'port')) {
      if (side === 'target' && inPorts.has(u.port)) inPorts.get(u.port).src.push({ k: 'sym', name: v.name });
      else if (side === 'source' && outPorts.has(u.port)) outPorts.get(u.port).syms.push(v.name);
      else anomalies.push({ what: `SAL variable ${side} usage on a port of the wrong direction or missing`, name: v.name, port: u.port });
    }
  }
  for (const r of s.globals) {
    const name = g.vars.get(r.variableId)?.name; if (!name) { anomalies.push({ what: 'global reference to unknown SGVL variable', port: r.port, variableId: r.variableId }); continue; }
    if (inPorts.has(r.port)) inPorts.get(r.port).src.push({ k: 'sym', name }); else if (outPorts.has(r.port)) outPorts.get(r.port).syms.push(name); else anomalies.push({ what: 'global reference on parameter port', port: r.port });
  }
  for (const w of s.wires) { const t = inPorts.get(w.to); if (!t || !outPorts.has(w.from)) anomalies.push({ what: 'wire endpoint is not out->in', from: w.from, to: w.to }); else t.src.push({ k: 'wire', from: w.from }); }
  for (const n of [...sgvl.keys()]) if (salVars.has(n)) anomalies.push({ what: 'name is both SGVL Symbol and SAL variable', name: n });
  normalize({ inPorts, outPorts });
  return { blocks, inPorts, outPorts, params, sgvl, salVars, anomalies };
}
function normalize(M) {
  for (const p of M.inPorts.values()) p.src.sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);
  for (const p of M.outPorts.values()) p.syms.sort();
}
export const modelCounts = M => ({ fb: M.blocks.size, ports: M.inPorts.size + M.outPorts.size, params: M.params.size, salVars: M.salVars.size, sgvlSymbols: M.sgvl.size,
  wires: [...M.inPorts.values()].reduce((n, p) => n + p.src.filter(s => s.k === 'wire').length, 0),
  globalRefs: [...M.inPorts.values()].reduce((n, p) => n + p.src.filter(s => s.k === 'sym' && M.sgvl.has(s.name)).length, 0) + [...M.outPorts.values()].reduce((n, p) => n + p.syms.filter(s => M.sgvl.has(s)).length, 0) });

// ---------------------------------------------------------------- text helpers
// split at top-level separators (outside parentheses)
function splitTop(text, sep) {
  const out = []; let depth = 0, cur = '';
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (c === '(') depth++; if (c === ')') depth--;
    if (depth === 0 && text.startsWith(sep, i)) { out.push(cur); cur = ''; i += sep.length - 1; continue; }
    cur += c; }
  out.push(cur); return out.map(s => s.trim()).filter(Boolean);
}
// "body (p1) (p2)" -> { body, parens:[p1,p2] } (top-level parentheses only)
function extractParens(text) {
  let depth = 0, body = '', cur = ''; const parens = [];
  for (const c of text) {
    if (c === '(') { if (depth++ === 0) { cur = ''; continue; } }
    if (c === ')') { if (--depth === 0) { parens.push(cur.trim()); continue; } }
    if (depth > 0) cur += c; else body += c;
  }
  return { body: body.replace(/\s+/g, ' ').trim(), parens };
}

// ---------------------------------------------------------------- operations on the expected model
export class PlanApplier {
  constructor(base, sliceId) {
    this.M = { blocks: clone(base.blocks), inPorts: clone(base.inPorts), outPorts: clone(base.outPorts), params: clone(base.params), sgvl: clone(base.sgvl), salVars: clone(base.salVars) };
    this.base = base; this.slice = sliceId;
    this.items = []; this.asserts = []; this.order = []; this.touched = { inPorts: new Set(), outPorts: new Set(), blocksAdded: new Set(), blocksDeleted: new Set(), symbolsDeleted: new Set(), symbolsAdded: new Set(), renamed: new Map(), deletedPorts: new Set() };
    this.newBlockOutputsNoSymbol = false; this.absentSymbols = [];
  }
  // ---- resolution against the expected model (never the candidate)
  blockPath(ref, ctxNet) {
    ref = expandNet(ref.trim());
    if (ref.includes('/')) { const p = '//' + ref; if (!this.M.blocks.has(p)) throw Error(`unknown block ${ref}`); return p; }
    const inCtx = ctxNet && this.M.blocks.has(`//${ctxNet}/${ref}`) ? `//${ctxNet}/${ref}` : null;
    if (inCtx) return inCtx;
    const all = [...this.M.blocks.keys()].filter(p => p.endsWith('/' + ref));
    if (all.length !== 1) throw Error(`block ${ref} ${all.length ? 'ambiguous ' + all.join(',') : 'unknown'} (context ${ctxNet ?? '-'})`);
    return all[0];
  }
  netOf(path) { return path.split('/')[2]; }
  portPaths(ref, ctx) { // ref: "Net/Block.Port", "Block.Port", "Port", "Port1..4"
    ref = ref.trim(); let blockRef, port;
    const m = ref.match(/^(.*)\.([A-Za-z]+\d*(?:\.\.\d+)?)$/);
    if (m) { blockRef = m[1]; port = m[2]; } else { if (!ctx?.block) throw Error(`port ${ref} without block context`); port = ref; }
    const block = blockRef ? this.blockPath(blockRef, ctx?.net) : ctx.block;
    const r = port.match(/^([A-Za-z]+)(\d+)\.\.(\d+)$/);
    const names = r ? Array.from({ length: +r[3] - +r[2] + 1 }, (_, i) => r[1] + (+r[2] + i)) : [port];
    return { block, paths: names.map(n => `${block}/${n}`) };
  }
  singleOutput(block, port) {
    if (port) { const p = `${block}/${port}`; if (!this.M.outPorts.has(p)) throw Error(`no output ${p}`); return p; }
    const outs = [...this.M.outPorts.keys()].filter(p => this.M.outPorts.get(p).block === block);
    if (outs.length !== 1) throw Error(`block ${block} has ${outs.length} outputs; output port must be named (I-2)`);
    return outs[0];
  }
  symbolExists(name) { return this.M.sgvl.has(name) || this.M.salVars.has(name); }
  parseSource(text, ctx) {
    text = text.trim();
    let m = text.match(/^wire\s+(\S+)$/);
    if (m) { const mm = m[1].match(/^(.*?)(?:\.([A-Za-z]+\d*))?$/); const b = this.blockPath(mm[1], ctx?.net); return { src: { k: 'wire', from: this.singleOutput(b, mm[2]) }, contact: CONTACT.NC }; }
    let contact = CONTACT.NC;
    if ((m = text.match(/^not\s+(\S+)$/))) { text = m[1]; contact = CONTACT.NO; }
    else if ((m = text.match(/^(\S+)\s+(NO|NC)$/))) { text = m[1]; contact = CONTACT[m[2]]; }
    if (!/^\S+$/.test(text)) throw Error(`unrecognized source "${text}"`);
    if (!this.symbolExists(text)) throw Error(`unknown Symbol ${text}`);
    return { src: { k: 'sym', name: text }, contact };
  }
  // ---- primitive operations
  bind(path, { src, contact }) {
    const p = this.M.inPorts.get(path); if (!p) throw Error(`no input ${path}`);
    // ports without channelInterface (e.g. safeDecouple inputs) carry no state attributes
    p.src = [src]; if (p.ci !== null) { p.ci = 'Activated'; p.contact = contact; } this.touched.inPorts.add(path);
    if (src.k === 'wire') this.touched.outPorts.add(src.from);
  }
  deactivate(path) { const p = this.M.inPorts.get(path); if (!p) throw Error(`no input ${path}`); if (p.ci === null) throw Error(`${path} has no channelInterface to deactivate`); for (const s of p.src) if (s.k === 'wire') this.touched.outPorts.add(s.from); p.src = []; p.ci = 'Deactivated'; p.contact = null; this.touched.inPorts.add(path); }
  setContact(path, from, to) { const p = this.M.inPorts.get(path); if (!p) throw Error(`no input ${path}`); this.assertNow(`${path} contact was ${from}`, p.contact === CONTACT[from], p.contact); p.contact = CONTACT[to]; this.touched.inPorts.add(path); }
  deleteBlock(path) {
    const b = this.M.blocks.get(path); if (!b) throw Error(`unknown block ${path}`);
    this.M.blocks.delete(path); this.touched.blocksDeleted.add(path);
    for (const coll of ['inPorts', 'outPorts', 'params']) for (const [k, v] of [...this.M[coll]]) if (v.block === path) { this.M[coll].delete(k); this.touched.deletedPorts.add(k); }
    for (const [k, p] of this.M.inPorts) { const before = p.src.length; p.src = p.src.filter(s => !(s.k === 'wire' && s.from.startsWith(path + '/'))); if (p.src.length !== before) this.touched.inPorts.add(k); }
  }
  deleteSymbol(name) {
    if (!this.symbolExists(name)) throw Error(`unknown Symbol ${name}`);
    this.M.sgvl.delete(name); this.M.salVars.delete(name); this.touched.symbolsDeleted.add(name);
    for (const [k, p] of this.M.inPorts) if (p.src.some(s => s.k === 'sym' && s.name === name)) { p.src = p.src.filter(s => !(s.k === 'sym' && s.name === name)); this.touched.inPorts.add(k); }
    for (const [k, p] of this.M.outPorts) if (p.syms.includes(name)) { p.syms = p.syms.filter(s => s !== name); this.touched.outPorts.add(k); }
  }
  outUnbind(path, name) { const p = this.M.outPorts.get(path); if (!p) throw Error(`no output ${path}`); this.assertNow(`${path} writes ${name} in base`, !!this.base.outPorts.get(path)?.syms.includes(name)); p.syms = p.syms.filter(s => s !== name); this.touched.outPorts.add(path); }
  outBind(path, name) {
    const p = this.M.outPorts.get(path); if (!p) throw Error(`no output ${path}`);
    if (!this.symbolExists(name)) { // I-9
      if (/^link/.test(name)) this.M.salVars.set(name, { attrs: null, alias: { source: [], target: [] }, created: true });
      else if (/^b_/.test(name)) this.M.sgvl.set(name, { rest: null, created: true });
      else throw Error(`new Symbol ${name}: kind not derivable (I-9)`);
      this.touched.symbolsAdded.add(name);
    }
    if (!p.syms.includes(name)) p.syms.push(name); this.touched.outPorts.add(path);
  }
  rename(from, to) {
    if (!this.M.salVars.has(from)) throw Error(`rename: no SAL variable ${from}`);
    if (this.symbolExists(to)) throw Error(`rename target ${to} already exists`);
    this.M.salVars.set(to, this.M.salVars.get(from)); this.M.salVars.delete(from); this.touched.renamed.set(from, to);
    for (const p of this.M.inPorts.values()) for (const s of p.src) if (s.k === 'sym' && s.name === from) s.name = to;
    for (const p of this.M.outPorts.values()) p.syms = p.syms.map(s => s === from ? to : s);
  }
  addBlock(path, fn, inputs, timing) {
    if (this.M.blocks.has(path)) throw Error(`block ${path} already exists`);
    const templates = [...this.base.blocks.entries()].filter(([, b]) => b.fn === fn).sort(([a], [b]) => a < b ? -1 : 1);
    if (!templates.length) throw Error(`no base block of ${fn} to take ports from (I-6)`);
    const shapes = new Set(templates.map(([, b]) => JSON.stringify(b.ports))); if (shapes.size !== 1) throw Error(`base blocks of ${fn} differ in port lists`);
    const [tPath, t] = templates[0], name = path.split('/').pop(), net = path.split('/')[2];
    const tAttrs = { ...t.attrs }; delete tAttrs.name; delete tAttrs.instanceName;
    this.M.blocks.set(path, { fn, tag: t.tag, network: net, name, attrs: { ...tAttrs, name, instanceName: name }, order: null, ports: clone(t.ports), templateFrom: tPath, templateKeys: Object.keys(tAttrs) });
    this.touched.blocksAdded.add(path);
    const portAttrs = (coll, pname) => { // uniform attribute values across all base blocks of fn for this port name
      const vals = templates.map(([bp]) => this.base[coll].get(`${bp}/${pname}`)?.attrs).filter(Boolean); const keys = new Set(vals.flatMap(Object.keys)); const out = {}, varying = [];
      for (const k of keys) { const set = new Set(vals.map(v => v[k])); if (set.size === 1) out[k] = vals[0][k]; else varying.push(k); }
      return { attrs: out, varying };
    };
    for (const pt of t.ports) {
      const pp = `${path}/${pt.name}`;
      if (pt.kind === 'inPort') { const a = portAttrs('inPorts', pt.name); const hasCi = templates.some(([bp]) => this.base.inPorts.get(`${bp}/${pt.name}`)?.ci != null); this.M.inPorts.set(pp, { block: path, name: pt.name, ci: hasCi ? 'Deactivated' : null, contact: null, src: [], attrs: a.attrs, varying: a.varying, isNew: true }); }
      else if (pt.kind === 'outPort') { const a = portAttrs('outPorts', pt.name); this.M.outPorts.set(pp, { block: path, name: pt.name, syms: [], attrs: a.attrs, varying: a.varying, isNew: true }); }
      else { const a = portAttrs('params', pt.name); const attrs = { ...a.attrs }; let varying = a.varying; if (timing !== undefined) { attrs.timing = timing; varying = varying.filter(k => k !== 'timing'); } this.M.params.set(pp, { block: path, name: pt.name, attrs, varying, isNew: true }); }
    }
    const ins = t.ports.filter(p => p.kind === 'inPort').map(p => p.name);
    inputs.forEach((inp, i) => { const port = inp.port ?? ins[i]; if (!ins.includes(port)) throw Error(`${path}: no input ${port}`); this.bind(`${path}/${port}`, this.parseSource(inp.src, { net, block: path })); });
  }
  assertNow(name, ok, detail) { this.asserts.push({ name, phase: 'base', status: ok ? 'PASS' : 'FAIL', ...(detail === undefined ? {} : { detail }) }); }
  assertFinal(name, fn) { this.asserts.push({ name, phase: 'final', fn }); }
}

// ---------------------------------------------------------------- slice items
function sliceOf(plan, id) { const s = plan.slices.find(x => x.id === id); if (!s) throw Error(`slice ${id} not in plan`); return s; }
const STRUCTURAL_FIELDS = ['delete', 'rewire', 'deactivate', 'deleteSymbols', 'extra', 'deleteBlocks', 'newBlocks', 'changes', 'order', 'disHold.changes'];
// Fields of a slice that carry no structural SAL/SGVL change (text, references, timing notes) - listed in the report.
export function sliceItems(plan, id) {
  const s = sliceOf(plan, id), items = [];
  const get = f => f.split('.').reduce((o, k) => o?.[k], s);
  for (const f of STRUCTURAL_FIELDS) { const v = get(f); if (v === undefined) continue; for (const [i, t] of (Array.isArray(v) ? v : [v]).entries()) items.push({ field: f, index: i, text: t }); }
  const ignored = Object.keys(s).filter(k => !STRUCTURAL_FIELDS.some(f => f.split('.')[0] === k));
  const disHoldIgnored = s.disHold ? Object.keys(s.disHold).filter(k => k !== 'changes').map(k => 'disHold.' + k) : [];
  return { slice: s, items, ignoredFields: [...ignored, ...disHoldIgnored] };
}
// mechanism.order.moves entries assigned to a slice: suffix "(E2x)" overrides the "E2x:" prefix; "E2a" = E2a-core.
export function orderMovesFor(plan, id) {
  return (plan.mechanism?.order?.moves ?? []).filter(t => { const pre = t.match(/^(E2\w*):/)?.[1], suf = t.match(/\((E2[\w-]+)\)\s*$/)?.[1]; const sl = suf ?? (pre === 'E2a' ? 'E2a-core' : pre); return sl === id; }).map(t => t.replace(/^E2\w*:\s*/, ''));
}
export const headApplies = id => CHAIN.indexOf(id) >= CHAIN.indexOf('E2a-core');

export function buildExpected(plan, baseModel, id) {
  const A = new PlanApplier(baseModel, id), { slice, items, ignoredFields } = sliceItems(plan, id);
  const log = (item, status, detail) => A.items.push({ ...item, status, ...(detail ? { detail } : {}) });
  // renames first: they change names only and later items of the slice use the new names
  const ordered = [...items.filter(i => /^SAL variable rename/.test(i.text)), ...items.filter(i => !/^SAL variable rename/.test(i.text))];
  for (const item of ordered) {
    try { const comments = applyItem(A, item); log(item, 'APPLIED', comments.length ? { comments } : undefined); }
    catch (e) { log(item, 'UNINTERPRETED', e.message); }
  }
  for (const t of orderMovesFor(plan, id)) { try { A.order.push(parseOrder(A, t, 'mechanism.order.moves')); A.items.push({ field: 'mechanism.order.moves', text: t, status: 'APPLIED' }); } catch (e) { A.items.push({ field: 'mechanism.order.moves', text: t, status: 'UNINTERPRETED', detail: e.message }); } }
  if (headApplies(id)) {
    const head = (plan.mechanism?.order?.head15 ?? []).map(h => '//' + h).filter(p => A.M.blocks.has(p));
    A.order.push({ kind: 'head', blocks: head, source: 'mechanism.order.head15 (PLAN.v4.md 2.2)' });
  }
  normalize(A.M);
  return { applier: A, slice, ignoredFields };
}

function parseOrder(A, text, field) {
  const { body } = extractParens(text);
  let m;
  if ((m = body.match(/^(.+?)\s+(before|after)\s+(\S+)$/))) {
    const target = A.blockPath(m[3]);
    const subjects = m[1].split(/,\s*|\s+and\s+/).map(x => x.trim()).filter(Boolean).map(x => A.blockPath(x, A.netOf(target)));
    return { kind: m[2], subjects, target, source: field, text };
  }
  if (/->/.test(body)) { const parts = body.split('->').map(s => s.trim()); let net = null; const chain = [];
    for (const p of parts) { const b = A.blockPath(p, net); chain.push(b); net = A.netOf(b); }
    return { kind: 'chain', blocks: chain, source: field, text }; }
  throw Error(`order form not recognized: ${text}`);
}

function applyItem(A, item) {
  const text = item.text, comments = [];
  if (item.field === 'delete') { const m = text.match(/^(\S+)\/\*\s*\((\d+)\)$/);
    if (m) { const net = expandNet(m[1]); const all = [...A.M.blocks.keys()].filter(p => p.split('/')[2] === net); A.assertNow(`${net}/* deletes ${m[2]} blocks`, all.length === +m[2], all.length); all.forEach(p => A.deleteBlock(p)); return comments; }
    A.deleteBlock(A.blockPath(text)); return comments; }
  if (item.field === 'deleteBlocks') { A.deleteBlock(A.blockPath(text)); return comments; }
  if (item.field === 'deactivate') { A.portPaths(text).paths.forEach(p => A.deactivate(p)); return comments; }
  if (item.field === 'deleteSymbols') { const { body, parens } = extractParens(text); comments.push(...parens); A.deleteSymbol(body); return comments; }
  if (item.field === 'order') { A.order.push(parseOrder(A, text, 'order')); return comments; }
  if (item.field === 'newBlocks') { applyNewBlock(A, text, comments); return comments; }
  // rewire / changes / extra / disHold.changes: clause list
  const ctx = { item }; // shared: a clause may name a port relative to the block of the previous clause
  for (const clause of splitTop(text, ';')) applyClause(A, clause, comments, ctx);
  return comments;
}

function applyNewBlock(A, text, comments) {
  const m = text.match(/^(\S+)\s+(safe\w+)\s*(?:([\d.]+)\s*s\s*)?(?:\((.*)\))?\s*(?:->\s*(\S+))?\s*$/);
  if (!m) throw Error('new block form not recognized');
  const path = '//' + expandNet(m[1]), fn = m[2], timing = m[3], spec = m[4] ?? '', out = m[5];
  const inputs = splitTop(spec, ',').map(s => { const n = s.match(/^([A-Z][A-Za-z]*In\d*)\s+(.+)$/); return n ? { port: n[1], src: n[2] } : { src: s }; });
  for (const i of inputs) if (/\b(see|inputs)\b/.test(i.src)) throw Error(`input list not explicit: "${spec}"`);
  A.addBlock(path, fn, inputs, timing);
  if (out) A.outBind(A.singleOutput(path), out);
}

function applyClause(A, clauseText, comments, ctx) {
  const { body, parens } = extractParens(clauseText);
  let m;
  // whole-clause forms
  if ((m = body.match(/^SAL variable rename[^:]*:\s*(.+)$/))) { for (const pair of m[1].split(/,\s*/)) { const r = pair.match(/^(\S+)\s*->\s*(\S+)$/); if (!r) throw Error(`rename pair "${pair}"`); A.rename(r[1], r[2]); } return; }
  if ((m = body.match(/^order:\s*(.+)$/))) { A.order.push(parseOrder(A, m[1] + (parens.length ? '' : ''), 'changes')); comments.push(...parens); return; }
  if ((m = body.match(/^delete SGVL Symbols\s+(.+)$/))) { for (const n of m[1].split(/,\s*/)) { if (!A.M.sgvl.has(n)) throw Error(`not an SGVL Symbol: ${n}`); A.deleteSymbol(n); } comments.push(...parens); return; }
  if (/^no Symbol moved to window outputs$/.test(body)) { A.newBlockOutputsNoSymbol = true; return; }
  if ((m = body.match(/^v\d+ (\S+) cancelled$/))) { A.absentSymbols.push(m[1]); return; }
  if ((m = body.match(/^drop Symbol binding (\S+) from (\S+)$/))) { const pp = A.portPaths(m[2]); A.outUnbind(pp.paths[0], m[1]); for (const p of parens) { if (/^wires kept$/.test(p)) { const wires = [...A.base.inPorts.values()].filter(x => x.src.some(s => s.k === 'wire' && s.from === pp.paths[0])).length; A.assertNow(`${pp.paths[0]}: wires kept (${wires} in base)`, true, wires); A.keepWiresFrom = [...(A.keepWiresFrom ?? []), pp.paths[0]]; } else comments.push(p); } return; }
  // review label "C-R1-2 (a): <clause>" - the label (with its parenthesis) is a comment, the rest is the clause
  if ((m = clauseText.match(/^([A-Z]+(?:-[A-Z0-9]+)+(?:\s*\([^)]*\))?)\s*:\s*(.+)$/))) { comments.push('label: ' + m[1]); return applyClause(A, m[2], comments, ctx); }
  // block-scoped list "Net/Block: P := s, P s, ..."
  if ((m = body.match(/^([\w/]+):\s+(.+)$/)) && !/:=/.test(m[1])) {
    const block = A.blockPath(m[1]), net = A.netOf(block);
    for (const part of splitTop(m[2], ',')) { const n = part.match(/^([A-Za-z]+\d*)\s*(?::=\s*)?(.+)$/); if (!n) throw Error(`block list entry "${part}"`); A.bind(`${block}/${n[1]}`, A.parseSource(n[2], { net, block })); }
    comments.push(...parens); return;
  }
  // port := source
  if ((m = body.match(/^(\S+)\s*:=\s*(.+)$/))) {
    const pp = A.portPaths(m[1], ctx.last); const net = A.netOf(pp.block);
    const preAsserts = parens.map(p => parenAssertion(A, p, pp, net)).filter(Boolean);
    preAsserts.forEach(f => f('base'));
    const src = A.parseSource(m[2], { net, block: pp.block });
    pp.paths.forEach(p => A.bind(p, src));
    preAsserts.forEach(f => f('final'));
    for (const p of parens) if (!parenAssertion(A, p, pp, net, true)) comments.push(p);
    ctx.last = { block: pp.block, net }; return;
  }
  if ((m = body.match(/^(\S+)\s+deactivate$/))) { const pp = A.portPaths(m[1], ctx.last); pp.paths.forEach(p => A.deactivate(p)); ctx.last = { block: pp.block, net: A.netOf(pp.block) }; comments.push(...parens); return; }
  if ((m = body.match(/^(\S+)\s+contact (NC|NO) -> (NC|NO)$/))) { const pp = A.portPaths(m[1], ctx.last); pp.paths.forEach(p => A.setContact(p, m[2], m[3])); comments.push(...parens); return; }
  if ((m = body.match(/^(\S+)\s*\+=\s*(\S+)$/))) { const pp = A.portPaths(m[1], ctx.last); A.outBind(pp.paths[0], m[2]); comments.push(...parens); return; }
  if ((m = body.match(/^(\S+)\s*->\s*(?:wire\s+)?(\S+)$/))) { // out port -> in port(s)
    const from = A.portPaths(m[1], ctx.last), net = A.netOf(from.block); if (!A.M.outPorts.has(from.paths[0])) throw Error(`not an output ${from.paths[0]}`);
    const to = A.portPaths(m[2], { net }); to.paths.forEach(p => A.bind(p, { src: { k: 'wire', from: from.paths[0] }, contact: CONTACT.NC }));
    ctx.last = { block: from.block, net }; comments.push(...parens); return; }
  throw Error(`clause form not recognized: "${body}"`);
}

// Parenthesis assertions (I-7). Returns a checker fn(phase) or null when the text is a comment.
function parenAssertion(A, text, pp, net, probeOnly = false) {
  let m;
  if ((m = text.match(/^remove wire (\S+)->(\S+)$/))) { if (probeOnly) return true;
    return phase => { if (phase !== 'base') return; const from = A.blockPath(m[1], net), to = A.blockPath(m[2], net);
      const ok = to === pp.block && pp.paths.every(p => A.M.inPorts.get(p)?.src.some(s => s.k === 'wire' && s.from.startsWith(from + '/')));
      A.assertNow(`(${text}): base source of ${pp.paths.join(',')} is a wire from ${from}`, ok, pp.paths.map(p => A.M.inPorts.get(p)?.src)); }; }
  if ((m = text.match(/^existing Symbol on (\S+);\s*second targetUsage$/))) { if (probeOnly) return true;
    return phase => { if (phase !== 'base') return; const out = A.portPaths(m[1]).paths[0];
      const syms = A.M.outPorts.get(out)?.syms ?? [];
      A.assertNow(`(${text}): ${out} writes an existing Symbol`, syms.length > 0, syms);
      A.assertFinal(`(${text}): the Symbol bound to ${pp.paths[0]} is written by ${out} and has exactly 2 target usages`, M => { const s = M.inPorts.get(pp.paths[0])?.src[0]; if (s?.k !== 'sym') return { ok: false, detail: s }; const n = [...M.inPorts.values()].filter(p => p.src.some(x => x.k === 'sym' && x.name === s.name)).length; return { ok: (M.outPorts.get(out)?.syms ?? []).includes(s.name) && n === 2, detail: { symbol: s.name, targetUsages: n } }; }); }; }
  // "<Port> <source>[, <Port> <source>]" about other ports of the same block: must hold in base and in expected
  const parts = splitTop(text, ',');
  if (parts.length && parts.every(p => /^[A-Z][A-Za-z]*In\d+\s+\S+(\s+(NO|NC))?$/.test(p))) { if (probeOnly) return true;
    return phase => { for (const part of parts) { const n = part.match(/^(\S+)\s+(.+)$/); const port = `${pp.block}/${n[1]}`; let exp;
      try { exp = A.parseSource(n[2], { net, block: pp.block }); } catch (e) { A.assertNow(`(${part}) on ${port}`, false, e.message); continue; }
      if (phase === 'base') { const p = A.base.inPorts.get(port); A.assertNow(`(${part}) holds on base ${port}`, !!p && p.ci === 'Activated' && p.contact === exp.contact && JSON.stringify(p.src) === JSON.stringify([exp.src]), p && { ci: p.ci, contact: p.contact, src: p.src }); }
      else A.assertFinal(`(${part}) holds on candidate ${port}`, M => { const p = M.inPorts.get(port); return { ok: !!p && p.ci === 'Activated' && p.contact === exp.contact && JSON.stringify(p.src) === JSON.stringify([exp.src]), detail: p && { ci: p.ci, contact: p.contact, src: p.src } }; }); } }; }
  return null;
}
export { canon };
