// Native SAL/SGVL/diagram model for exact multi-slice delta proofs (stand D2, 2026-10-22).
// Own XML tokenizer and loaders, taken over from scripts/f1-delta-check.mjs (itself a stand copy of
// tester E1-f1/delta-check.mjs, SHA256 654a041a…). The loaders are unchanged in what they accept; they
// additionally record alias/group-port usages and SGVL usage ids so that the usage ledger can be
// compared per usage id. No dependency on src/sal-parser.js (independent of the simulator parser).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const sha256 = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
// A source dir is either a flat triple folder or a Safety_Dyno project folder (TwinSafeGroup1/, GVLs/).
export const sourceFile = (dir, name) => fs.existsSync(path.join(dir, name)) ? path.join(dir, name) : path.join(dir, name.endsWith('.sgvl') ? 'GVLs' : 'TwinSafeGroup1', name);

export function parseXml(text) {
  text = text.replace(/^﻿/, '');
  const root = { tag: '#root', attr: {}, children: [], parent: null };
  let cur = root;
  const re = /<\?[^>]*\?>|<!--[\s\S]*?-->|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*"[^"]*")*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[1]) { if (cur.tag !== m[1]) throw Error('Mismatched close ' + m[1] + ' vs ' + cur.tag); cur = cur.parent; }
    else if (m[2]) {
      const attr = {}; const ar = /([\w:.-]+)\s*=\s*"([^"]*)"/g; let a;
      while ((a = ar.exec(m[3]))) { if (Object.hasOwn(attr, a[1])) throw Error('Duplicate attribute ' + a[1]); attr[a[1]] = a[2]; }
      const node = { tag: m[2], attr, children: [], parent: cur }; cur.children.push(node);
      if (!m[4]) cur = node;
    } else if (m[5] && m[5].trim()) cur.text = (cur.text ?? '') + m[5].trim();
  }
  if (cur !== root) throw Error('Unclosed element ' + cur.tag);
  return root.children[0];
}
export const walk = n => [n, ...n.children.flatMap(walk)];
export const kids = (n, tag) => n.children.filter(c => c.tag === tag);
export const one = (n, tag) => { const k = kids(n, tag); if (k.length !== 1) throw Error(`Expected one ${tag} under ${n.tag} ${n.attr.Id ?? ''}, got ${k.length}`); return k[0]; };
export const canon = n => n.tag + JSON.stringify(Object.entries(n.attr).sort()) + (n.text ?? '') + '[' + n.children.map(canon).join(',') + ']';

export function loadSal(dir) {
  const x = parseXml(fs.readFileSync(sourceFile(dir, 'TwinSafeGroup1.sal'), 'utf8'));
  const blocks = new Map(), ports = new Map(), wires = [], globals = [], networks = [];
  for (const rel of kids(one(x, 'networks'), 'safetyApplicationHasNetworks')) {
    const net = one(rel, 'Network');
    const fbs = kids(net, 'functionBlocks');
    networks.push({ relId: rel.attr.Id, attr: net.attr, other: net.children.filter(c => c.tag !== 'functionBlocks').map(canon), fbContainers: fbs.length });
    for (const fbc of fbs) for (const fr of kids(fbc, 'networkHasFunctionBlocks')) {
      if (fr.children.length !== 1) throw Error('FB wrapper multiplicity ' + fr.attr.Id);
      const b = fr.children[0], bpath = `//${net.attr.name}/${b.attr.name}`;
      const rec = { path: bpath, network: net.attr.name, tag: b.tag, attr: b.attr, relId: fr.attr.Id, ports: [] };
      if (blocks.has(b.attr.Id)) throw Error('Duplicate block id');
      blocks.set(b.attr.Id, rec);
      for (const [group, wrapTag, portTag] of [['inPorts', 'functioBlockHasInPorts', 'inPort'], ['outPorts', 'functionBlockHasOutPorts', 'outPort'], ['parameterPorts', 'functionBlockHasParamPorts', 'parameterPort']]) {
        for (const g of kids(b, group)) for (const w of kids(g, wrapTag)) {
          const p = one(w, portTag), ppath = `${bpath}/${p.attr.name}`;
          const prec = { path: ppath, kind: portTag, block: b.attr.Id, blockPath: bpath, attr: p.attr, relId: w.attr.Id, wires: [], globals: [], other: [] };
          for (const c of p.children) {
            if (c.tag === 'targetFunctionBlockPorts') for (const wl of kids(c, 'wiredLink')) { const t = one(wl, 'inPortMoniker').attr.name; prec.wires.push({ id: wl.attr.Id, to: t }); wires.push({ id: wl.attr.Id, from: ppath, to: t, other: wl.children.filter(k => k.tag !== 'inPortMoniker').map(canon) }); }
            else if (c.tag === 'fbPortGlobalVariableReferences') for (const gr of kids(c, 'functionBlockPortHasFbPortGlobalVariableReferences')) { const r = one(gr, 'fbPortGlobalVariableReference'); const row = { relId: gr.attr.Id, id: r.attr.Id, variableId: r.attr.variableId, lastKnownPath: r.attr.lastKnownPath, port: ppath, portId: p.attr.Id, attr: r.attr }; prec.globals.push(row); globals.push(row); }
            else prec.other.push(canon(c));
          }
          rec.ports.push(prec); if (ports.has(p.attr.Id)) throw Error('Duplicate port id ' + p.attr.Id); ports.set(p.attr.Id, prec);
        }
      }
      for (const c of b.children) if (!['inPorts', 'outPorts', 'parameterPorts'].includes(c.tag)) throw Error('Unknown FB child ' + c.tag);
    }
  }
  const variables = new Map();
  for (const rel of kids(one(x, 'variables'), 'safetyApplicationHasVariables')) {
    const v = one(rel, 'variable'); const use = { source: [], target: [], wrappers: {} };
    for (const [side, groupTag, relTag] of [['source', 'sourceUsages', 'variableHasSourceUsages'], ['target', 'targetUsages', 'variableHasTargetUsages']]) {
      const g = kids(v, groupTag);
      if (g.length !== 1) throw Error(`Singleton ${groupTag} violated for ${v.attr.name}`);
      const r = one(g[0], relTag), vu = one(r, 'variableUsages'), us = one(vu, 'usages');
      use.wrappers[side] = { rel: r.attr.Id, variableUsages: vu.attr.Id };
      for (const h of kids(us, 'variableUsagesHasUsages')) {
        if (h.children.length !== 1) throw Error('Usage wrapper multiplicity');
        const u = h.children[0];
        if (u.tag === 'fbPortUsage') { const fr = one(one(u, 'functionBlockPort'), 'fbPortUsageReferencesFunctionBlockPort'); const mon = fr.children[0]; use[side].push({ kind: 'port', relId: h.attr.Id, usageId: u.attr.Id, refRel: fr.attr.Id, moniker: mon.tag, port: mon.attr.name }); }
        else if (u.tag === 'aliasDeviceIoUsage') use[side].push({ kind: 'alias', relId: h.attr.Id, usageId: u.attr.Id, canon: canon(u) });
        else if (u.tag === 'groupPortUsage') use[side].push({ kind: 'groupPort', relId: h.attr.Id, usageId: u.attr.Id, canon: canon(u) });
        else use[side].push({ kind: 'other', relId: h.attr.Id, usageId: u.attr.Id, canon: canon(u) });
      }
    }
    for (const c of v.children) if (!['sourceUsages', 'targetUsages'].includes(c.tag)) throw Error('Unknown variable child ' + c.tag);
    if (variables.has(v.attr.Id)) throw Error('Duplicate variable id');
    variables.set(v.attr.Id, { relId: rel.attr.Id, attr: v.attr, name: v.attr.name, use });
  }
  const nonProgram = x.children.filter(c => !['networks', 'variables'].includes(c.tag)).map(canon);
  return { x, blocks, ports, wires, globals, variables, networks, nonProgram, rootAttr: x.attr,
    blockByPath: new Map([...blocks.values()].map(b => [b.path, b])), portByPath: new Map([...ports.values()].map(p => [p.path, p])) };
}

export function loadSgvl(dir) {
  const x = parseXml(fs.readFileSync(sourceFile(dir, 'GVL1.sgvl'), 'utf8'));
  const vars = new Map();
  for (const v of kids(x, 'Variable')) {
    const name = kids(v, 'Name')[0]?.text;
    const side = t => kids(v, t).flatMap(s => kids(s, 'FbPortUsage').map(u => ({ id: u.attr.Id, port: kids(u, 'ModelElementId')[0]?.text, canon: canon(u) })));
    if (vars.has(v.attr.Id)) throw Error('Duplicate SGVL variable id');
    vars.set(v.attr.Id, { name, attr: v.attr, source: side('SourceUsages'), target: side('TargetUsages'), sideContainers: { source: kids(v, 'SourceUsages').length, target: kids(v, 'TargetUsages').length }, rest: v.children.filter(c => !['Name', 'SourceUsages', 'TargetUsages'].includes(c.tag)).map(canon) });
  }
  return { x, vars, byName: new Map([...vars.values()].map(v => [v.name, v])), rootAttr: x.attr, other: x.children.filter(c => c.tag !== 'Variable').map(canon) };
}

export function loadDiagram(dir) {
  const x = parseXml(fs.readFileSync(sourceFile(dir, 'TwinSafeGroup1.sal.diagram'), 'utf8'));
  const shapes = new Map();
  for (const n of walk(x)) if (n.attr.Id && n.tag !== 'wiredLinkMoniker' && !n.tag.endsWith('ShapeMoniker')) {
    const mon = n.children.find(c => c.tag.endsWith('Moniker') && !c.tag.endsWith('ShapeMoniker'));
    shapes.set(n.attr.Id, { tag: n.tag, attr: n.attr, moniker: mon ? (mon.attr.name ?? mon.attr.Id) : null, nodes: kids(n, 'nodes').flatMap(k => k.children.map(c => c.attr.Id)) });
  }
  return { x, shapes };
}

export function loadSource(dir) {
  return { dir, sha: Object.fromEntries(['TwinSafeGroup1.sal', 'GVL1.sgvl', 'TwinSafeGroup1.sal.diagram'].map(f => [f, sha256(sourceFile(dir, f))])),
    sal: loadSal(dir), sgvl: loadSgvl(dir), diagram: loadDiagram(dir) };
}
