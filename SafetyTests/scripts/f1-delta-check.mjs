// Independent exact P0 -> F1 native delta checker (tester E1-f1, 2026-10-21).
// Stand copy (E1-f1-c5, review condition C5) of SafetyTests/program/tester/E1-f1/delta-check.mjs
// (source SHA256 654a041a39eccfe345c98ac49efd7fa906044ce8da6349d595173184a8de81c7). Check logic unchanged;
// only the output location handling and the self-reported tool path differ.
// Own XML tokenizer; does not use SafetyTests/src parsers or editor/reviewer scripts.
// Authority for allowed deltas: architect F1_RUN_RECOGNIZER_PLAN.json (frozen SHA b52f6b0e...).
// Usage: node scripts/f1-delta-check.mjs <p0Dir> <f1Dir> <plan.json> [out.json]
//   out.json omitted -> written to a fresh os.tmpdir() mkdtemp directory (path printed).
//   Writing into SafetyTests/program/tester/ is refused (role-owned evidence).
//   p0Dir/f1Dir contain TwinSafeGroup1.sal, TwinSafeGroup1.sal.diagram, GVL1.sgvl.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const [p0Dir, f1Dir, planPath, outArg] = process.argv.slice(2);
if (!planPath) { console.error('usage: node scripts/f1-delta-check.mjs <p0Dir> <f1Dir> <plan.json> [out.json]'); process.exit(64); }
const testerDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'program', 'tester');
const outPath = outArg ? path.resolve(outArg) : path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'f1-delta-check-')), 'DELTA_CHECK.json');
if ((outPath.toLowerCase() + path.sep).startsWith(testerDir.toLowerCase() + path.sep)) { console.error('refusing to write into ' + testerDir + ' (tester-owned evidence); pass an out path elsewhere or omit it'); process.exit(64); }
console.log('DELTA OUT', outPath);
// Each dir is either a flat triple folder or a Safety_Dyno project folder (TwinSafeGroup1/, GVLs/).
const file = (dir, name) => fs.existsSync(path.join(dir, name)) ? path.join(dir, name) : path.join(dir, name.endsWith('.sgvl') ? 'GVLs' : 'TwinSafeGroup1', name);
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const errors = [], notes = [], checks = [];
const check = (name, ok, detail) => { checks.push({ name, status: ok ? 'PASS' : 'FAIL', ...(detail === undefined ? {} : { detail }) }); if (!ok) errors.push(name); };

function parseXml(text) {
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
const walk = n => [n, ...n.children.flatMap(walk)];
const kids = (n, tag) => n.children.filter(c => c.tag === tag);
const one = (n, tag) => { const k = kids(n, tag); if (k.length !== 1) throw Error(`Expected one ${tag} under ${n.tag} ${n.attr.Id ?? ''}, got ${k.length}`); return k[0]; };
const canon = n => n.tag + JSON.stringify(Object.entries(n.attr).sort()) + (n.text ?? '') + '[' + n.children.map(canon).join(',') + ']';

function loadSal(dir) {
  const x = parseXml(fs.readFileSync(file(dir, 'TwinSafeGroup1.sal'), 'utf8'));
  const blocks = new Map(), ports = new Map(), wires = [], globals = [], networks = [];
  for (const rel of kids(one(x, 'networks'), 'safetyApplicationHasNetworks')) {
    const net = one(rel, 'Network'); networks.push({ relId: rel.attr.Id, attr: net.attr });
    for (const fr of kids(one(net, 'functionBlocks'), 'networkHasFunctionBlocks')) {
      if (fr.children.length !== 1) throw Error('FB wrapper multiplicity ' + fr.attr.Id);
      const b = fr.children[0], bpath = `//${net.attr.name}/${b.attr.name}`;
      const rec = { path: bpath, network: net.attr.name, tag: b.tag, attr: b.attr, relId: fr.attr.Id, ports: [] };
      if (blocks.has(b.attr.Id)) throw Error('Duplicate block id');
      blocks.set(b.attr.Id, rec);
      for (const [group, wrapTag, portTag] of [['inPorts', 'functioBlockHasInPorts', 'inPort'], ['outPorts', 'functionBlockHasOutPorts', 'outPort'], ['parameterPorts', 'functionBlockHasParamPorts', 'parameterPort']]) {
        for (const g of kids(b, group)) for (const w of kids(g, wrapTag)) {
          const p = one(w, portTag), ppath = `${bpath}/${p.attr.name}`;
          const prec = { path: ppath, kind: portTag, block: b.attr.Id, attr: p.attr, relId: w.attr.Id, wires: [], globals: [], other: [] };
          for (const c of p.children) {
            if (c.tag === 'targetFunctionBlockPorts') for (const wl of kids(c, 'wiredLink')) { const t = one(wl, 'inPortMoniker').attr.name; prec.wires.push({ id: wl.attr.Id, to: t }); wires.push({ id: wl.attr.Id, from: ppath, to: t }); }
            else if (c.tag === 'fbPortGlobalVariableReferences') for (const gr of kids(c, 'functionBlockPortHasFbPortGlobalVariableReferences')) { const r = one(gr, 'fbPortGlobalVariableReference'); const row = { relId: gr.attr.Id, id: r.attr.Id, variableId: r.attr.variableId, lastKnownPath: r.attr.lastKnownPath, port: ppath, portId: p.attr.Id }; prec.globals.push(row); globals.push(row); }
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
        else use[side].push({ kind: 'other', relId: h.attr.Id, canon: canon(u) });
      }
    }
    for (const c of v.children) if (!['sourceUsages', 'targetUsages'].includes(c.tag)) throw Error('Unknown variable child ' + c.tag);
    variables.set(v.attr.Id, { relId: rel.attr.Id, attr: v.attr, use });
  }
  const nonProgram = x.children.filter(c => !['networks', 'variables'].includes(c.tag)).map(canon);
  return { x, blocks, ports, wires, globals, variables, networks, nonProgram, rootAttr: x.attr };
}

function loadDiagram(dir) {
  const x = parseXml(fs.readFileSync(file(dir, 'TwinSafeGroup1.sal.diagram'), 'utf8'));
  const shapes = new Map();
  for (const n of walk(x)) if (n.attr.Id && n.tag !== 'wiredLinkMoniker' && !n.tag.endsWith('ShapeMoniker')) {
    const mon = n.children.find(c => c.tag.endsWith('Moniker') && !c.tag.endsWith('ShapeMoniker'));
    shapes.set(n.attr.Id, { tag: n.tag, attr: n.attr, moniker: mon ? (mon.attr.name ?? mon.attr.Id) : null, nodes: kids(n, 'nodes').flatMap(k => k.children.map(c => c.attr.Id)) });
  }
  return { x, shapes };
}
function loadSgvl(dir) {
  const x = parseXml(fs.readFileSync(file(dir, 'GVL1.sgvl'), 'utf8'));
  const vars = new Map();
  for (const v of kids(x, 'Variable')) {
    const name = kids(v, 'Name')[0]?.text;
    const side = t => kids(v, t).flatMap(s => kids(s, 'FbPortUsage').map(u => ({ id: u.attr.Id, port: kids(u, 'ModelElementId')[0]?.text })));
    vars.set(v.attr.Id, { name, source: side('SourceUsages'), target: side('TargetUsages'), rest: v.children.filter(c => !['Name', 'SourceUsages', 'TargetUsages'].includes(c.tag)).map(canon) });
  }
  return { x, vars, rootAttr: x.attr, other: x.children.filter(c => c.tag !== 'Variable').map(canon) };
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
process.on('uncaughtException', e => { try { fs.writeFileSync(outPath, JSON.stringify({ status: 'ERROR', error: String(e.stack), checks, failed: errors }, null, 1)); } catch {} for (const c of checks) console.log(c.status, c.name); console.log('DELTA ERROR (treated as FAIL):', e.message); process.exit(2); });
const report = { generatedAt: new Date().toISOString(), tool: 'SafetyTests/scripts/f1-delta-check.mjs', toolOrigin: { path: 'SafetyTests/program/tester/E1-f1/delta-check.mjs', sha256: '654a041a39eccfe345c98ac49efd7fa906044ce8da6349d595173184a8de81c7' }, toolSha256: sha(new URL(import.meta.url)),
  inputs: Object.fromEntries([['p0', p0Dir], ['f1', f1Dir]].flatMap(([k, d]) => ['TwinSafeGroup1.sal', 'TwinSafeGroup1.sal.diagram', 'GVL1.sgvl'].map(f => [`${k}/${f}`, sha(file(d, f))]))), planSha256: sha(planPath) };
check('plan frozen SHA b52f6b0e', report.planSha256 === 'b52f6b0e440a09ce138ad91e633b2fcd78f431d246a4dbdabc083809a0a08b60', report.planSha256);
check('plan source equals P0 SAL', plan.source.salSha256 === report.inputs['p0/TwinSafeGroup1.sal'] && plan.source.sgvlSha256 === report.inputs['p0/GVL1.sgvl'] && plan.source.diagramSha256 === report.inputs['p0/TwinSafeGroup1.sal.diagram']);

const A = loadSal(p0Dir), B = loadSal(f1Dir);
// ---- counts
const counts = s => ({ networks: s.networks.length, blocks: s.blocks.size, ports: [...s.ports.values()].filter(p => p.kind !== 'parameterPort').length, params: [...s.ports.values()].filter(p => p.kind === 'parameterPort').length, variables: s.variables.size, globalRefs: s.globals.length, wires: s.wires.length });
report.counts = { p0: counts(A), f1: counts(B) };
check('P0 counts equal plan.sourceCounts', ['blocks', 'ports', 'variables', 'globalRefs', 'wires'].every(k => report.counts.p0[k] === plan.sourceCounts[k]), report.counts.p0);
check('F1 counts equal plan.expectedCounts (242/2076/75/209/307)', ['blocks', 'ports', 'variables', 'globalRefs', 'wires'].every(k => report.counts.f1[k] === plan.expectedCounts[k]), report.counts.f1);
check('networks 14 and parameter ports 22->21', report.counts.p0.networks === 14 && report.counts.f1.networks === 14 && report.counts.f1.params === report.counts.p0.params - 1, { p0: report.counts.p0.params, f1: report.counts.f1.params });

// ---- root/networks/non-program
const rootDiff = Object.keys({ ...A.rootAttr, ...B.rootAttr }).filter(k => A.rootAttr[k] !== B.rootAttr[k]);
check('safetyApplication root attributes unchanged except Crc', rootDiff.every(k => k === 'Crc'), rootDiff);
check('networks (ids, wrappers, attributes, order) unchanged', JSON.stringify(A.networks) === JSON.stringify(B.networks));
check('non-program SAL records (alias ports etc.) byte-canonical identical', JSON.stringify(A.nonProgram) === JSON.stringify(B.nonProgram), { p0: A.nonProgram.length, f1: B.nonProgram.length });

// ---- blocks
const retiredBlock = [...A.blocks.values()].find(b => b.path === plan.retire.path);
const removed = [...A.blocks.keys()].filter(id => !B.blocks.has(id)), added = [...B.blocks.keys()].filter(id => !A.blocks.has(id));
check('exactly one block removed = plan.retire //Network6/FBTon2', removed.length === 1 && removed[0] === retiredBlock?.attr.Id && retiredBlock.tag === 'fBTon', removed.map(id => A.blocks.get(id).path));
check('exactly planned new blocks added (ids/paths/functionName)', added.length === 2 && plan.newBlocks.every(nb => { const b = B.blocks.get(nb.id); return b && b.path === nb.path && b.attr.functionName === nb.functionName && b.attr.name === nb.name && b.attr.instanceName === nb.name; }), added.map(id => B.blocks.get(id).path));
const retiredPortIds = new Set(retiredBlock.ports.map(p => p.attr.Id));
check('retired block ports are exactly plan.retire port ids', [...plan.retire.inputPorts, ...plan.retire.outputPorts, ...plan.retire.parameters].every(p => retiredPortIds.has(p.Id)) && retiredPortIds.size === 3);
check('retired timer parameter was the duplicate Run TON 0.5 s', retiredBlock.ports.find(p => p.kind === 'parameterPort')?.attr.timing === '0.5');
const blockAttrDiffs = [];
for (const [id, a] of A.blocks) { const b = B.blocks.get(id); if (!b) continue;
  if (a.path !== b.path || a.relId !== b.relId || a.tag !== b.tag) blockAttrDiffs.push({ path: a.path, what: 'identity/wrapper' });
  for (const k of new Set([...Object.keys(a.attr), ...Object.keys(b.attr)])) if (k !== 'orderOfExecution' && a.attr[k] !== b.attr[k]) blockAttrDiffs.push({ path: a.path, attr: k, p0: a.attr[k], f1: b.attr[k] }); }
check('retained 241-1 blocks: identity, wrappers, network and all attributes except order unchanged', blockAttrDiffs.length === 0, blockAttrDiffs);

// ---- order
const manifest = new Map(plan.fullOrderedManifest.map(r => [r.id, r]));
const orderDiffs = [];
for (const [id, b] of B.blocks) { const m = manifest.get(id); if (!m || String(m.newOrder) !== b.attr.orderOfExecution || m.path !== b.path) orderDiffs.push({ path: b.path, f1: b.attr.orderOfExecution, plan: m?.newOrder }); }
for (const [id, a] of A.blocks) { const m = manifest.get(id); if (m && String(m.oldOrder) !== a.attr.orderOfExecution) orderDiffs.push({ path: a.path, p0: a.attr.orderOfExecution, planOld: m.oldOrder }); }
check('every F1 orderOfExecution equals plan fullOrderedManifest (242 rows), P0 oldOrder matches', orderDiffs.length === 0 && manifest.size === 242, orderDiffs.slice(0, 20));
const orders = [...B.blocks.values()].map(b => +b.attr.orderOfExecution).sort((a, b) => a - b);
check('F1 orders are a permutation 1..242', orders.every((o, i) => o === i + 1));
const retainedSorted = [...A.blocks.values()].filter(b => B.blocks.has(b.attr.Id)).sort((a, b) => a.attr.orderOfExecution - b.attr.orderOfExecution);
check('relative execution order of all retained blocks preserved', retainedSorted.every((b, i, arr) => !i || +B.blocks.get(b.attr.Id).attr.orderOfExecution > +B.blocks.get(arr[i - 1].attr.Id).attr.orderOfExecution));
const ord = p => +([...B.blocks.values()].find(b => b.path === p)?.attr.orderOfExecution ?? NaN);
report.keyOrders = Object.fromEntries(['//Network6/FBOr5', '//Network6/FBAnd23', '//Network6/FBAnd24', '//Network6/RUN_DOWN_RESET', '//Network6/RUN_DOWN_OWNER', '//RndPhysicalCompact/GREEN', '//SafeResumption/MODE'].map(p => [p, ord(p)]));
check('chronology: OR5 < And23 < And24, RESET = And24+1, OWNER = And24+2 (plan text)', ord('//Network6/FBOr5') < ord('//Network6/FBAnd23') && ord('//Network6/FBAnd23') < ord('//Network6/FBAnd24') && ord('//Network6/RUN_DOWN_RESET') === ord('//Network6/FBAnd24') + 1 && ord('//Network6/RUN_DOWN_OWNER') === ord('//Network6/FBAnd24') + 2, report.keyOrders);
check('shared GREEN executes before And24 (plan: GREEN TRUE before late And24)', ord('//RndPhysicalCompact/GREEN') < ord('//Network6/FBAnd24'), report.keyOrders);

// ---- ports
const pad = new Map(plan.portAttributeDelta.map(d => [d.portId, d]));
const portDiffs = [];
for (const [id, a] of A.ports) { if (retiredPortIds.has(id)) continue; const b = B.ports.get(id);
  if (!b) { portDiffs.push({ path: a.path, what: 'missing' }); continue; }
  if (a.path !== b.path || a.relId !== b.relId || a.kind !== b.kind) portDiffs.push({ path: a.path, what: 'identity/wrapper' });
  const d = pad.get(id); const expected = { ...a.attr };
  if (d) { for (const [k, v] of Object.entries(d.after)) if (k === 'removeDeactivate1') delete expected.deactivate1; else expected[k] = v; }
  for (const k of new Set([...Object.keys(expected), ...Object.keys(b.attr)])) if (expected[k] !== b.attr[k]) portDiffs.push({ path: a.path, attr: k, expected: expected[k], f1: b.attr[k] });
  if (JSON.stringify(a.other) !== JSON.stringify(b.other)) portDiffs.push({ path: a.path, what: 'other children' }); }
check('all retained ports: identity/wrapper/attributes identical except the 2 planned portAttributeDelta', portDiffs.length === 0, portDiffs.slice(0, 30));
check('planned portAttributeDelta applied: MODE.OrIn3 Activated NC; And23.AndIn3 Deactivated without contact', (() => { const m = B.ports.get('ac0f79c2-038c-441d-bdf5-6b22637dac4b'), a = B.ports.get('9e99da86-e0a8-4ec9-adcb-163edafcf2cc'); return m.attr.channelInterface === 'Activated' && m.attr.deactivate1 === 'Break Contact (NC)' && a.attr.channelInterface === 'Deactivated' && !('deactivate1' in a.attr); })());
const paramDiffs = [...A.ports.values()].filter(p => p.kind === 'parameterPort' && !retiredPortIds.has(p.attr.Id)).filter(p => B.ports.get(p.attr.Id)?.attr.timing !== p.attr.timing).map(p => p.path);
check('all 21 retained timer parameters: GUID and timing value unchanged', paramDiffs.length === 0, paramDiffs);
report.timers = [...B.ports.values()].filter(p => p.kind === 'parameterPort').map(p => ({ path: p.path, timing: p.attr.timing }));

// new block ports vs templates
const tmpl = { safeOr: [...A.blocks.values()].find(b => b.path === plan.newBlockTemplates.safeOr), safeRs: [...A.blocks.values()].find(b => b.path === plan.newBlockTemplates.safeRs) };
const newPortIssues = [];
for (const nb of plan.newBlocks) { const b = B.blocks.get(nb.id), t = tmpl[nb.functionName];
  if (t.tag !== b.tag) newPortIssues.push({ block: nb.path, what: 'tag', t: t.tag, b: b.tag });
  for (const k of Object.keys(t.attr)) if (!['Id', 'name', 'instanceName', 'orderOfExecution'].includes(k) && t.attr[k] !== b.attr[k]) newPortIssues.push({ block: nb.path, attr: k, t: t.attr[k], b: b.attr[k] });
  const planned = [...nb.inputs, ...nb.outputs];
  if (b.ports.length !== planned.length || planned.some(p => !b.ports.find(q => q.attr.Id === p.id && q.attr.name === p.name))) newPortIssues.push({ block: nb.path, what: 'port ids/names differ from plan' });
  for (const q of b.ports) { const tp = t.ports.find(x => x.attr.name === q.attr.name); if (!tp) { newPortIssues.push({ port: q.path, what: 'no template port' }); continue; }
    for (const k of ['portName', 'portNum', 'objectIndex', 'varId', 'filter', 'portDataType', 'maxDeviation', 'resetTime', 'replacementValue']) if (tp.attr[k] !== q.attr[k]) newPortIssues.push({ port: q.path, attr: k, template: tp.attr[k], f1: q.attr[k] }); } }
check('new OR/RS port shapes equal native template ports (portNum/objectIndex/varId/filter/type)', newPortIssues.length === 0, newPortIssues);
const pr = p => B.ports.get(p) ?? [...B.ports.values()].find(x => x.path === p);
const active = [...B.blocks.get(plan.newBlocks[0].id).ports].filter(p => p.kind === 'inPort').map(p => ({ n: p.attr.name, ci: p.attr.channelInterface, c: p.attr.deactivate1 ?? null }));
report.resetOrInputs = active;
check('RUN_DOWN_RESET: OrIn1/OrIn2 Activated NC (direct), OrIn3 Activated NO (inverted), OrIn4..8 Deactivated without contact attrs',
  JSON.stringify(active) === JSON.stringify([{ n: 'OrIn1', ci: 'Activated', c: 'Break Contact (NC)' }, { n: 'OrIn2', ci: 'Activated', c: 'Break Contact (NC)' }, { n: 'OrIn3', ci: 'Activated', c: 'Make Contact (NO)' }, ...[4, 5, 6, 7, 8].map(i => ({ n: 'OrIn' + i, ci: 'Deactivated', c: null }))]), active);
const rsIn = B.blocks.get(plan.newBlocks[1].id).ports.filter(p => p.kind === 'inPort').map(p => ({ n: p.attr.name, ci: p.attr.channelInterface, c: p.attr.deactivate1 }));
report.ownerInputs = rsIn;
check('RUN_DOWN_OWNER Reset/Set Activated NC (direct, no inversion)', rsIn.every(p => p.ci === 'Activated' && p.c === 'Break Contact (NC)') && rsIn.length === 2, rsIn);
// semantic check of And24 / And23 / OR5 / MODE inputs (independent read of plan equations)
const blockInputs = p => [...B.blocks.values()].find(b => b.path === p).ports.filter(q => q.kind === 'inPort').map(q => ({ n: q.attr.name, ci: q.attr.channelInterface, c: q.attr.deactivate1 ?? null, src: B.wires.filter(w => w.to === q.path).map(w => w.from), glob: q.globals.map(g => g.lastKnownPath), sym: [...B.variables.values()].filter(v => v.use.target.some(u => u.port === q.path)).map(v => v.attr.name) }));
report.semanticInputs = Object.fromEntries(['//Network6/FBAnd24', '//Network6/FBAnd23', '//Network6/FBOr5', '//Network6/RUN_DOWN_RESET', '//Network6/RUN_DOWN_OWNER', '//SafeResumption/MODE'].map(p => [p, blockInputs(p)]));

// ---- wires
const key = w => `${w.from}->${w.to}#${w.id}`;
const wa = new Set(A.wires.map(key)), wb = new Set(B.wires.map(key));
const wRemoved = [...wa].filter(k => !wb.has(k)), wAdded = [...wb].filter(k => !wa.has(k));
check('wire delta = plan.wireRemove (2) / plan.wireAdd (3) exactly, with planned ids', JSON.stringify(wRemoved.sort()) === JSON.stringify(plan.wireRemove.map(key).sort()) && JSON.stringify(wAdded.sort()) === JSON.stringify(plan.wireAdd.map(key).sort()), { wRemoved, wAdded });
check('F1 wires equal plan.expectedCanonicalWires (307)', JSON.stringify([...wb].sort()) === JSON.stringify(plan.expectedCanonicalWires.map(key).sort()));
const net = p => p.split('/')[2];
check('no cross-network graphical wiredLink', B.wires.every(w => net(w.from) === net(w.to)));
const wireTargets = new Map(); for (const w of B.wires) wireTargets.set(w.to, (wireTargets.get(w.to) ?? 0) + 1);
check('no input port driven by more than one wire', [...wireTargets.values()].every(v => v === 1));
check('every wire endpoint exists as out/in port', B.wires.every(w => [...B.ports.values()].some(p => p.path === w.from && p.kind === 'outPort') && [...B.ports.values()].some(p => p.path === w.to && p.kind === 'inPort')));

// ---- global references
const gkey = g => `${g.port}|${g.variableId}|${g.id}|${g.relId}|${g.lastKnownPath}`;
const ga = new Set(A.globals.filter(g => !retiredPortIds.has(g.portId)).map(gkey)), gb = new Set(B.globals.map(gkey));
const gRemoved = [...ga].filter(k => !gb.has(k)), gAdded = B.globals.filter(g => !ga.has(gkey(g)));
check('global refs: none removed; exactly the 3 planned readers added (variableId/port/referenceId)', gRemoved.length === 0 && gAdded.length === 3 && plan.globalReaderAdd.every(p => gAdded.some(g => g.variableId === p.variableId && g.portId === p.portId && g.id === p.referenceId && g.port === p.target && g.lastKnownPath === 'GVL1.' + p.name)), { gRemoved, gAdded });
check('retired block had no global refs', A.globals.every(g => !retiredPortIds.has(g.portId)));

// ---- variables / Symbols
const varIssues = [];
for (const [id, a] of A.variables) { const b = B.variables.get(id); if (!b) { varIssues.push({ id, what: 'missing' }); continue; }
  if (a.relId !== b.relId || JSON.stringify(a.attr) !== JSON.stringify(b.attr) || JSON.stringify(a.use.wrappers) !== JSON.stringify(b.use.wrappers)) varIssues.push({ name: a.attr.name, what: 'identity/wrappers' });
  if (JSON.stringify(a.use.source) !== JSON.stringify(b.use.source)) varIssues.push({ name: a.attr.name, what: 'sourceUsages changed' });
  const removedT = a.use.target.filter(u => !b.use.target.some(v => JSON.stringify(v) === JSON.stringify(u))).map(u => u.port);
  const addedT = b.use.target.filter(u => !a.use.target.some(v => JSON.stringify(v) === JSON.stringify(u)));
  const expRemoved = plan.localReaderRemove.filter(r => r.name === a.attr.name).map(r => r.target), expAdded = plan.localReaderAdd.filter(r => r.variableId === id);
  if (JSON.stringify(removedT.sort()) !== JSON.stringify(expRemoved.sort()) || addedT.length !== expAdded.length || !expAdded.every(e => addedT.some(u => u.port === e.target && u.moniker === 'inPortMoniker')))
    varIssues.push({ name: a.attr.name, removedT, addedT: addedT.map(u => u.port), expRemoved, expAdded: expAdded.map(e => e.target) });
  const keptOrder = a.use.target.filter(u => !removedT.includes(u.port)).map(u => u.relId), bOrder = b.use.target.filter(u => !addedT.includes(u)).map(u => u.relId);
  if (JSON.stringify(keptOrder) !== JSON.stringify(bOrder)) varIssues.push({ name: a.attr.name, what: 'retained usage order/ids changed' }); }
check('75 Symbols: ids/wrappers/sources identical; target usages differ only by plan.localReaderRemove/localReaderAdd', B.variables.size === 75 && varIssues.length === 0, varIssues);
const usagePorts = [...B.variables.values()].flatMap(v => [...v.use.source, ...v.use.target].filter(u => u.kind === 'port').map(u => u.port));
check('every Symbol usage resolves to an existing F1 port', usagePorts.every(p => [...B.ports.values()].some(q => q.path === p)));
check('no retired port referenced by any Symbol', usagePorts.every(p => !p.startsWith(plan.retire.path + '/')));
const allIds = [...walk(B.x)].map(n => n.attr.Id).filter(Boolean);
check('all F1 SAL object/relationship Ids unique', new Set(allIds).size === allIds.length, allIds.length);
const aIds = new Set([...walk(A.x)].map(n => n.attr.Id).filter(Boolean));
const newIds = allIds.filter(i => !aIds.has(i));
report.newSalIds = newIds.length;

// ---- SGVL
const GA = loadSgvl(p0Dir), GB = loadSgvl(f1Dir);
const sgIssues = [];
const rootSg = Object.keys({ ...GA.rootAttr, ...GB.rootAttr }).filter(k => GA.rootAttr[k] !== GB.rootAttr[k]);
if (!rootSg.every(k => k === 'Crc')) sgIssues.push({ root: rootSg });
if (JSON.stringify(GA.other) !== JSON.stringify(GB.other)) sgIssues.push('non-variable SGVL content changed');
if (GA.vars.size !== 85 || GB.vars.size !== 85 || JSON.stringify([...GA.vars.keys()]) !== JSON.stringify([...GB.vars.keys()])) sgIssues.push('85 declaration ids/order');
for (const [id, a] of GA.vars) { const b = GB.vars.get(id); if (!b) continue;
  if (a.name !== b.name || JSON.stringify(a.rest) !== JSON.stringify(b.rest) || JSON.stringify(a.source) !== JSON.stringify(b.source)) sgIssues.push({ name: a.name, what: 'decl/source' });
  const added = b.target.filter(u => !a.target.some(v => v.id === u.id && v.port === u.port)), removedU = a.target.filter(u => !b.target.some(v => v.id === u.id && v.port === u.port));
  const exp = plan.globalReaderAdd.filter(g => g.variableId === id);
  if (removedU.length || added.length !== exp.length || !exp.every(e => added.some(u => u.port === e.portId))) sgIssues.push({ name: a.name, added, removedU, exp: exp.map(e => e.portId) }); }
check('SGVL: 85 declarations unchanged; only Crc and 3 TargetUsages for planned global readers added', sgIssues.length === 0, sgIssues);
// SGVL usage <-> SAL global ref consistency (both directions) for F1
const salRefs = new Set(B.globals.map(g => g.variableId + '|' + g.portId));
const sgRefs = new Set([...GB.vars].flatMap(([id, v]) => [...v.source, ...v.target].map(u => id + '|' + u.port)));
check('F1 SGVL FbPortUsages and SAL fbPortGlobalVariableReferences are the same set', salRefs.size === sgRefs.size && [...salRefs].every(k => sgRefs.has(k)), { sal: salRefs.size, sgvl: sgRefs.size });

// ---- diagram
const DA = loadDiagram(p0Dir), DB = loadDiagram(f1Dir);
const shapeMoniker = new Map([...DA.shapes].map(([id, s]) => [id, s.moniker]));
const retiredMonikers = s => s.moniker && (s.moniker === plan.retire.path || s.moniker.startsWith(plan.retire.path + '/'));
const removedWireIds = new Set(plan.wireRemove.map(w => w.id)), addedWireIds = new Set(plan.wireAdd.map(w => w.id));
const geo = { compared: 0, missing: [], moved: [], unexpectedRemoved: [], edgeChanged: [], containerResized: [] };
for (const [id, s] of DA.shapes) { const t = DB.shapes.get(id);
  const expectedGone = retiredMonikers(s) || (s.tag === 'wiredLinkConnector' && removedWireIds.has(s.moniker));
  if (!t) { (expectedGone ? geo.missing : geo.unexpectedRemoved).push({ id, tag: s.tag, moniker: s.moniker }); continue; }
  if (expectedGone) { geo.unexpectedRemoved.push({ id, tag: s.tag, moniker: s.moniker, what: 'should be gone but present' }); continue; }
  if (s.tag !== t.tag || s.moniker !== t.moniker) geo.moved.push({ id, what: 'tag/moniker', p0: s.moniker, f1: t.moniker });
  if (s.attr.absoluteBounds !== undefined) { geo.compared++; if (s.attr.absoluteBounds !== t.attr.absoluteBounds) { const row = { id, tag: s.tag, moniker: s.moniker, p0: s.attr.absoluteBounds, f1: t.attr.absoluteBounds }; if (['networkSwimLane', 'safetyApplicationLanguageDiagram'].includes(s.tag)) geo.containerResized.push(row); else geo.moved.push(row); } }
  if (s.attr.edgePoints !== undefined && s.attr.edgePoints !== t.attr.edgePoints) geo.edgeChanged.push({ id, wire: s.moniker, p0: s.attr.edgePoints, f1: t.attr.edgePoints });
  const otherAttr = Object.keys({ ...s.attr, ...t.attr }).filter(k => !['absoluteBounds', 'edgePoints', 'Crc'].includes(k) && s.attr[k] !== t.attr[k]);
  if (otherAttr.length) geo.moved.push({ id, what: 'attrs', otherAttr }); }
const newShapes = [...DB.shapes].filter(([id]) => !DA.shapes.has(id)).map(([id, s]) => ({ id, tag: s.tag, moniker: s.moniker }));
report.geometry = { ...geo, newShapes, p0Shapes: DA.shapes.size, f1Shapes: DB.shapes.size };
check('diagram: no retained block/port shape moved or resized (absoluteBounds exact)', geo.moved.length === 0, geo.moved.slice(0, 20));
check('diagram: only retired FBTon2 shapes and the 2 removed wire connectors disappeared', geo.unexpectedRemoved.length === 0 && geo.missing.filter(m => m.tag === 'wiredLinkConnector').length === 2 && geo.missing.filter(m => m.tag !== 'wiredLinkConnector').length === 1 + 3, { unexpected: geo.unexpectedRemoved, missing: geo.missing });
const newBlockShapes = newShapes.filter(s => s.tag.endsWith('Shape') && !['inPortShape', 'outPortShape', 'paramPortShape'].includes(s.tag));
check('diagram: new shapes exactly = 2 new block shapes + their 12 planned port shapes + 3 new wire connectors', newBlockShapes.length === 2 && plan.newBlocks.every(nb => newBlockShapes.some(s => s.moniker === nb.path)) && newShapes.filter(s => s.tag === 'wiredLinkConnector').length === 3 && newShapes.filter(s => s.tag === 'wiredLinkConnector').every(s => addedWireIds.has(s.moniker)) && newShapes.filter(s => ['inPortShape', 'outPortShape'].includes(s.tag)).length === plan.newBlocks.reduce((n, b) => n + b.inputs.length + b.outputs.length, 0) && newShapes.length === 2 + plan.newBlocks.reduce((n, b) => n + b.inputs.length + b.outputs.length, 0) + 3, newShapes);
check('diagram: every wire has exactly one connector and every connector node references existing port shapes', (() => { const con = [...DB.shapes.values()].filter(s => s.tag === 'wiredLinkConnector'); const ids = con.map(c => c.moniker); return con.length === B.wires.length && new Set(ids).size === ids.length && B.wires.every(w => ids.includes(w.id)) && con.every(c => c.nodes.length === 2 && c.nodes.every(n => DB.shapes.has(n))); })());
check('diagram: every block/port has exactly one shape', (() => { const m = new Map(); for (const s of DB.shapes.values()) if (s.moniker && s.tag !== 'wiredLinkConnector') m.set(s.moniker, (m.get(s.moniker) ?? 0) + 1); return [...B.blocks.values()].every(b => m.get(b.path) === 1) && [...B.ports.values()].every(p => m.get(p.path) === 1); })());
report.geometryNotes = { containerResized: geo.containerResized, edgeChangedCount: geo.edgeChanged.length, edgeChangedWires: geo.edgeChanged.map(e => ({ wire: e.wire, ...(B.wires.find(w => w.id === e.wire) ?? {}), p0Points: e.p0.split(";").length, f1Points: e.f1.split(";").length, jumpsOnly: JSON.stringify(e.p0.split(";").filter(s => !/Jump/.test(s)).map(s => s.trim())) === JSON.stringify(e.f1.split(";").filter(s => !/Jump/.test(s)).map(s => s.trim()))})) };
check('diagram: changed connector routes differ only by line-crossing Jump markers (route vertices identical)', report.geometryNotes.edgeChangedWires.every(w => w.jumpsOnly), report.geometryNotes.edgeChangedWires);
notes.push('Connector edgePoints changes (jump markers/routing) are reported, not treated as block geometry; container bounds listed separately.');

report.checks = checks; report.notes = notes; report.status = errors.length ? 'FAIL' : 'PASS'; report.failed = errors;
fs.writeFileSync(outPath, JSON.stringify(report, null, 1) + '\n');
for (const c of checks) console.log(c.status, c.name);
console.log('DELTA', report.status, `${checks.length - errors.length}/${checks.length}`);
process.exitCode = errors.length ? 1 : 0;
