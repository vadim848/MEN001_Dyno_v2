// Exact atomic difference between two native sources (A = base slice, B = next slice), stand D2 2026-10-22.
// Every difference of the program part of SAL, of the SGVL and of the program structure is emitted as one atomic
// record; nothing is filtered here. Matching against the plan happens in src/plan-delta-spec.mjs.
// Identity: blocks, ports, wires, variables, references and usages by native Id; paths are reported for reading.
export const ORDER_ATTR = 'orderOfExecution';

const sortKey = r => JSON.stringify(r);
const uniqSorted = rows => [...new Map(rows.map(r => [sortKey(r), r])).values()].sort((a, b) => sortKey(a) < sortKey(b) ? -1 : 1);

export function nativeDiff(A, B) {
  const a = A.sal, b = B.sal, out = [];
  const push = r => out.push(r);
  // root / networks / non-program (alias ports, group ports)
  for (const k of new Set([...Object.keys(a.rootAttr), ...Object.keys(b.rootAttr)])) if (k !== 'Crc' && a.rootAttr[k] !== b.rootAttr[k]) push({ t: 'root-attr', attr: k, a: a.rootAttr[k], b: b.rootAttr[k] });
  const netId = n => JSON.stringify({ relId: n.relId, attr: n.attr, other: n.other });
  if (JSON.stringify(a.networks.map(netId)) !== JSON.stringify(b.networks.map(netId))) push({ t: 'networks', a: a.networks.map(n => n.attr.name), b: b.networks.map(n => n.attr.name) });
  // An empty network may be serialized without its functionBlocks container (native, R1 D-1); a container change is
  // reported, and accepted only for a network that has no blocks on either side.
  for (const n of a.networks) { const m = b.networks.find(x => x.relId === n.relId); if (m && m.fbContainers !== n.fbContainers) push({ t: 'network-container', network: n.attr.name, a: n.fbContainers, b: m.fbContainers, emptyInB: ![...b.blocks.values()].some(x => x.network === n.attr.name) }); }
  if (JSON.stringify(a.nonProgram) !== JSON.stringify(b.nonProgram)) push({ t: 'non-program', a: a.nonProgram.length, b: b.nonProgram.length });
  // blocks
  for (const [id, x] of a.blocks) if (!b.blocks.has(id)) push({ t: 'block-removed', path: x.path, fn: x.attr.functionName });
  for (const [id, y] of b.blocks) if (!a.blocks.has(id)) push({ t: 'block-added', path: y.path, fn: y.attr.functionName, ports: y.ports.length });
  for (const [id, x] of a.blocks) { const y = b.blocks.get(id); if (!y) continue;
    if (x.path !== y.path || x.relId !== y.relId || x.tag !== y.tag) push({ t: 'block-identity', path: x.path, b: y.path });
    for (const k of new Set([...Object.keys(x.attr), ...Object.keys(y.attr)])) if (k !== ORDER_ATTR && x.attr[k] !== y.attr[k]) push({ t: 'block-attr', path: x.path, attr: k, a: x.attr[k], b: y.attr[k] }); }
  // ports of retained blocks (ports of added/removed blocks belong to the block record)
  for (const [id, p] of a.ports) { if (!b.blocks.has(p.block)) continue; const q = b.ports.get(id);
    if (!q) { push({ t: 'port-removed', path: p.path }); continue; }
    if (p.path !== q.path || p.relId !== q.relId || p.kind !== q.kind || p.block !== q.block) push({ t: 'port-identity', path: p.path, b: q.path });
    for (const k of new Set([...Object.keys(p.attr), ...Object.keys(q.attr)])) if (p.attr[k] !== q.attr[k]) push({ t: 'port-attr', path: p.path, attr: k, a: p.attr[k] ?? null, b: q.attr[k] ?? null });
    if (JSON.stringify(p.other) !== JSON.stringify(q.other)) push({ t: 'port-other', path: p.path }); }
  for (const [id, q] of b.ports) if (a.blocks.has(q.block) && !a.ports.has(id)) push({ t: 'port-added', path: q.path });
  // wires (by id; endpoint paths)
  const wa = new Map(a.wires.map(w => [w.id, w])), wb = new Map(b.wires.map(w => [w.id, w]));
  for (const [id, w] of wa) { const v = wb.get(id); if (!v) push({ t: 'wire-removed', from: w.from, to: w.to }); else if (v.from !== w.from || v.to !== w.to || JSON.stringify(v.other) !== JSON.stringify(w.other)) { push({ t: 'wire-removed', from: w.from, to: w.to }); push({ t: 'wire-added', from: v.from, to: v.to, reusedId: true }); } }
  for (const [id, v] of wb) if (!wa.has(id)) push({ t: 'wire-added', from: v.from, to: v.to });
  // SAL global references (port -> SGVL Symbol)
  const ga = new Map(a.globals.map(g => [g.id, g])), gb = new Map(b.globals.map(g => [g.id, g]));
  const symName = (S, vid, lkp) => S.sgvl.vars.get(vid)?.name ?? (lkp?.replace(/^GVL1\./, '') + '?');
  for (const [id, g] of ga) { const h = gb.get(id); if (!h) push({ t: 'gref-removed', port: g.port, symbol: symName(A, g.variableId, g.lastKnownPath) });
    else if (h.port !== g.port || h.variableId !== g.variableId || h.relId !== g.relId || JSON.stringify(h.attr) !== JSON.stringify(g.attr)) push({ t: 'gref-changed', port: g.port, symbol: symName(A, g.variableId, g.lastKnownPath), bPort: h.port, bSymbol: symName(B, h.variableId, h.lastKnownPath), attrs: Object.keys({ ...g.attr, ...h.attr }).filter(k => g.attr[k] !== h.attr[k]) }); }
  for (const [id, h] of gb) if (!ga.has(id)) push({ t: 'gref-added', port: h.port, symbol: symName(B, h.variableId, h.lastKnownPath) });
  // SAL variables (alias I/O and local link Symbols) and their usages
  const usageKey = u => u.kind === 'port' ? 'port:' + u.port : u.kind + ':' + u.canon;
  for (const [id, v] of a.variables) { const w = b.variables.get(id);
    if (!w) { push({ t: 'salvar-removed', name: v.name }); continue; }
    for (const k of new Set([...Object.keys(v.attr), ...Object.keys(w.attr)])) if (v.attr[k] !== w.attr[k]) push({ t: 'salvar-attr', name: v.name, attr: k, a: v.attr[k] ?? null, b: w.attr[k] ?? null });
    if (v.relId !== w.relId || JSON.stringify(v.use.wrappers) !== JSON.stringify(w.use.wrappers)) push({ t: 'salvar-wrappers', name: v.name });
    for (const side of ['source', 'target']) {
      const ua = new Map(v.use[side].map(u => [u.usageId, u])), ub = new Map(w.use[side].map(u => [u.usageId, u]));
      for (const [uid, u] of ua) { const x = ub.get(uid); if (!x) push({ t: 'salusage-removed', name: v.name, side, kind: u.kind, at: usageKey(u) }); else if (JSON.stringify(x) !== JSON.stringify(u)) push({ t: 'salusage-changed', name: v.name, side, at: usageKey(u), bAt: usageKey(x) }); }
      for (const [uid, x] of ub) if (!ua.has(uid)) push({ t: 'salusage-added', name: w.name, side, kind: x.kind, at: usageKey(x) });
      const keptA = v.use[side].filter(u => ub.has(u.usageId)).map(u => u.usageId), keptB = w.use[side].filter(u => ua.has(u.usageId)).map(u => u.usageId);
      if (JSON.stringify(keptA) !== JSON.stringify(keptB)) push({ t: 'salusage-order', name: v.name, side });
    } }
  for (const [id, w] of b.variables) if (!a.variables.has(id)) push({ t: 'salvar-added', name: w.name, source: w.use.source.map(usageKey), target: w.use.target.map(usageKey) });
  // SGVL
  const sa = A.sgvl, sb = B.sgvl;
  for (const k of new Set([...Object.keys(sa.rootAttr), ...Object.keys(sb.rootAttr)])) if (k !== 'Crc' && sa.rootAttr[k] !== sb.rootAttr[k]) push({ t: 'sgvl-root-attr', attr: k });
  if (JSON.stringify(sa.other) !== JSON.stringify(sb.other)) push({ t: 'sgvl-other' });
  const portPathA = id => a.ports.get(id)?.path ?? 'unresolved:' + id, portPathB = id => b.ports.get(id)?.path ?? 'unresolved:' + id;
  for (const [id, v] of sa.vars) { const w = sb.vars.get(id);
    if (!w) { push({ t: 'sgvl-removed', name: v.name }); continue; }
    if (v.name !== w.name || JSON.stringify(v.rest) !== JSON.stringify(w.rest) || JSON.stringify(v.attr) !== JSON.stringify(w.attr) || JSON.stringify(v.sideContainers) !== JSON.stringify(w.sideContainers)) push({ t: 'sgvl-decl', name: v.name, b: w.name });
    for (const side of ['source', 'target']) {
      const ua = new Map(v[side].map(u => [u.id, u])), ub = new Map(w[side].map(u => [u.id, u]));
      for (const [uid, u] of ua) { const x = ub.get(uid); if (!x) push({ t: 'sgvl-usage-removed', name: v.name, side, port: portPathA(u.port) }); else if (x.canon !== u.canon) push({ t: 'sgvl-usage-changed', name: v.name, side, port: portPathA(u.port), bPort: portPathB(x.port) }); }
      for (const [uid, x] of ub) if (!ua.has(uid)) push({ t: 'sgvl-usage-added', name: w.name, side, port: portPathB(x.port) });
      const keptA = v[side].filter(u => ub.has(u.id)).map(u => u.id), keptB = w[side].filter(u => ua.has(u.id)).map(u => u.id);
      if (JSON.stringify(keptA) !== JSON.stringify(keptB)) push({ t: 'sgvl-usage-order', name: v.name, side });
    } }
  for (const [id, w] of sb.vars) if (!sa.vars.has(id)) push({ t: 'sgvl-added', name: w.name, source: w.source.map(u => portPathB(u.port)), target: w.target.map(u => portPathB(u.port)) });
  const order = [...b.blocks.values()].filter(y => a.blocks.has(y.attr.Id) && a.blocks.get(y.attr.Id).attr[ORDER_ATTR] !== y.attr[ORDER_ATTR]).map(y => ({ path: y.path, a: +a.blocks.get(y.attr.Id).attr[ORDER_ATTR], b: +y.attr[ORDER_ATTR] }));
  return { atoms: uniqSorted(out), order };
}

export function counts(S) {
  const s = S.sal;
  return { networks: s.networks.length, fb: s.blocks.size, ports: [...s.ports.values()].filter(p => p.kind !== 'parameterPort').length,
    params: [...s.ports.values()].filter(p => p.kind === 'parameterPort').length, salVars: s.variables.size, sgvlSymbols: S.sgvl.vars.size,
    globalRefs: s.globals.length, wires: s.wires.length,
    salPortUsages: [...s.variables.values()].reduce((n, v) => n + v.use.source.length + v.use.target.length, 0),
    sgvlUsages: [...S.sgvl.vars.values()].reduce((n, v) => n + v.source.length + v.target.length, 0) };
}
