// E2a-core editor self-check (NOT an acceptance oracle; does not replace G3).
// node self-check.mjs <sourceDir R1> <stagedDir> <nativeDir> <out.json>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse, walk, anc} from './xmlpos.mjs';
import {inspectNativeSalStructure} from '../../../../src/sal-native-structure.js';
import {validateSalBindings} from '../../../../src/sal-binding-validator.js';

const [srcDir, stagedDir, nativeDir, outFile] = process.argv.slice(2);
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const files = d => Object.fromEntries(['TwinSafeGroup1.sal', 'GVL1.sgvl', 'TwinSafeGroup1.sal.diagram'].map(f => [f, fs.readFileSync(path.join(d, f), 'utf8')]));
const text = (xml, n) => xml.slice(n.openEnd, n.end - `</${n.tag}>`.length).trim();
const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';

function netlist(dir) {
  const F = files(dir), sal = F['TwinSafeGroup1.sal'], gvl = F['GVL1.sgvl'];
  const S = walk(parse(sal)), G = walk(parse(gvl));
  const symById = new Map(G.filter(n => n.tag === 'Variable').map(v => [v.attr.Id, text(gvl, v.children.find(c => c.tag === 'Name'))]));
  const pn = p => `${anc(p, 'Network').attr.name}/${anc(p, 'networkHasFunctionBlocks').children[0].attr.name}/${p.attr.name}`;
  const blocks = {}, portIdToName = new Map();
  for (const b of S.filter(n => n.parent?.tag === 'networkHasFunctionBlocks')) {
    const key = `${anc(b, 'Network').attr.name}/${b.attr.name}`;
    const ports = {};
    for (const p of walk(b).filter(n => ['inPort', 'outPort', 'parameterPort'].includes(n.tag))) {
      if (p.tag !== 'parameterPort') portIdToName.set(p.attr.Id, pn(p));
      const {Id, ...attrs} = p.attr;
      ports[p.attr.name] = {tag: p.tag, Id, attrs,
        globals: walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference').map(r => ({symbol: symById.get(r.attr.variableId) ?? `DANGLING:${r.attr.variableId}`, path: r.attr.lastKnownPath})),
        wires: walk(p).filter(n => n.tag === 'wiredLink').map(w => ({Id: w.attr.Id, to: w.children[0].attr.name.slice(2)}))};
    }
    const {orderOfExecution, ...battrs} = b.attr;
    blocks[key] = {tag: b.tag, Id: b.attr.Id, order: +orderOfExecution, attrs: battrs, ports};
  }
  const variables = {};
  for (const v of S.filter(n => n.tag === 'variable')) {
    variables[v.attr.Id] = {name: v.attr.name, attrs: v.attr, usages: walk(v).filter(n => n.tag === 'variableUsagesHasUsages').map(u => {
      const m = walk(u).find(n => n.tag.endsWith('Moniker')); const k = u.children[0];
      return {Id: u.attr.Id, role: anc(u, 'targetUsages') ? 'T' : 'S', kind: k.tag, ref: m ? m.attr.name.slice(2) : JSON.stringify({sdsId: k.attr.sdsId, channelId: k.attr.channelId, functionId: k.attr.functionId})};
    })};
  }
  const symbols = {};
  for (const v of G.filter(n => n.tag === 'Variable')) {
    const use = r => v.children.find(c => c.tag === r).children.map(u => {const id = text(gvl, u.children.find(c => c.tag === 'ModelElementId')); return portIdToName.get(id) ?? `DANGLING:${id}`;});
    symbols[symById.get(v.attr.Id)] = {Id: v.attr.Id, source: use('SourceUsages'), target: use('TargetUsages')};
  }
  const networks = S.filter(n => n.tag === 'Network').map(n => ({...n.attr, blocks: walk(n).filter(x => x.parent?.tag === 'networkHasFunctionBlocks').length}));
  return {F, sal, gvl, blocks, variables, symbols, networks, crc: {sal: S.find(n => n.tag === 'safetyApplication').attr.Crc, sgvl: G.find(n => n.tag === 'GlobalVariables').attr.Crc}};
}
const src = netlist(srcDir), stg = netlist(stagedDir), nat = netlist(nativeDir);
const STAGING = JSON.parse(fs.readFileSync(path.join(stagedDir, '..', 'STAGING.json'), 'utf8'));
const report = {generatedAt: new Date().toISOString(), note: 'editor self-check, not a requirement PASS', sha: {}, checks: []};
for (const [k, d] of [['source', srcDir], ['staged', stagedDir], ['native', nativeDir]]) report.sha[k] = Object.fromEntries(Object.entries(files(d)).map(([f, x]) => [f, hash(x)]));
const check = (id, ok, detail) => {report.checks.push({id, status: ok ? 'PASS' : 'FAIL', detail}); console.log(ok ? 'PASS' : 'FAIL', id, typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 400));};

// 0. source identity
check('source-is-R1-candidate', report.sha.source['TwinSafeGroup1.sal'] === 'ca841a01fe44f776a5868968fde70cce728657aaf411d6b8bfa6689cfadc7bb3' && report.sha.source['GVL1.sgvl'] === '4f205138337ea3de3660d5ef2d8978db438e3e8d19f2e9dd393ec7a5816cdb36' && report.sha.source['TwinSafeGroup1.sal.diagram'] === 'b82aa41a6ee065267852d78ccaff961714eca1e8e8c006f087de715fb2a137b6', report.sha.source);
// 1. staged == native semantically
const strip = n => JSON.stringify({blocks: n.blocks, variables: n.variables, symbols: n.symbols, networks: n.networks});
check('native-equals-staged-semantics', strip(stg) === strip(nat), 'blocks/ports/attrs/order/wires/global refs/SAL usages/SGVL usages identical; only CRC/formatting differ');
// 2. native structure + binding audit on native and on source (baseline)
const ns = inspectNativeSalStructure(nat.sal); check('native-structure-preflight', ns.status === 'PASS' && ns.counts.crossNetworkWires === 0, ns);
const nsSrc = inspectNativeSalStructure(src.sal); report.sourcePreflight = nsSrc;
const ba = validateSalBindings(nat.sal, nat.gvl); check('binding-audit', ba.status === 'PASS' && ba.errors.length === 0, {status: ba.status, errors: ba.errors});
// 3. counts
const portCount = n => Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).filter(p => p.tag !== 'parameterPort').length, 0);
const wireCount = n => Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).reduce((x, p) => x + p.wires.length, 0), 0);
const counts = n => ({networks: n.networks.length, fb: Object.keys(n.blocks).length, ports: portCount(n), symbols: Object.keys(n.symbols).length, salVariables: Object.keys(n.variables).length, wires: wireCount(n), globalRefs: Object.values(n.blocks).reduce((a, b) => a + Object.values(b.ports).reduce((x, p) => x + p.globals.length, 0), 0), sgvlUsages: Object.values(n.symbols).reduce((a, s) => a + s.source.length + s.target.length, 0), salFbUsages: Object.values(n.variables).reduce((a, v) => a + v.usages.filter(u => u.kind === 'fbPortUsage').length, 0), aliasUsages: Object.values(n.variables).reduce((a, v) => a + v.usages.filter(u => u.kind !== 'fbPortUsage').length, 0)});
report.counts = {source: counts(src), native: counts(nat)};
const c = report.counts.native, c0 = report.counts.source;
check('counts-215-1832-65-75-14', c.fb === 215 && c.ports === 1832 && c.symbols === 65 && c.salVariables === 75 && c.networks === 14, report.counts);
check('wire-delta-minus8-plus6', c.wires === c0.wires - 8 + 6, {source: c0.wires, native: c.wires});
check('global-refs-equal-sgvl-usages', c.globalRefs === c.sgvlUsages && c.globalRefs === c0.globalRefs - 6 + 11, {native: c.globalRefs, sgvl: c.sgvlUsages, source: c0.globalRefs});
check('sal-usage-counts-unchanged', c.salFbUsages === c0.salFbUsages && c.aliasUsages === c0.aliasUsages, {source: [c0.salFbUsages, c0.aliasUsages], native: [c.salFbUsages, c.aliasUsages]});
// 4. dangling / pairing / symbol cardinality
const allPorts = new Set(Object.entries(nat.blocks).flatMap(([k, b]) => Object.keys(b.ports).map(p => `${k}/${p}`)));
const dangling = [
  ...Object.entries(nat.symbols).flatMap(([s, v]) => [...v.source, ...v.target].filter(x => x.startsWith('DANGLING')).map(x => `sgvl ${s} ${x}`)),
  ...Object.entries(nat.blocks).flatMap(([k, b]) => Object.entries(b.ports).flatMap(([p, x]) => [...x.globals.filter(g => g.symbol.startsWith('DANGLING')).map(g => `ref ${k}/${p} ${g.symbol}`), ...x.wires.filter(w => !allPorts.has(w.to)).map(w => `wire ${k}/${p} -> ${w.to}`)])),
  ...Object.values(nat.variables).flatMap(x => x.usages.filter(u => u.kind === 'fbPortUsage' && !allPorts.has(u.ref)).map(u => `var ${x.name} ${u.ref}`))];
check('no-dangling-references', dangling.length === 0, dangling);
const pairing = [];
for (const [k, b] of Object.entries(nat.blocks)) for (const [p, x] of Object.entries(b.ports)) for (const g of x.globals) {
  const s = nat.symbols[g.symbol]; const role = x.tag === 'outPort' ? 'source' : 'target';
  if (!s || s[role].filter(u => u === `${k}/${p}`).length !== 1) pairing.push(`${k}/${p} ${g.symbol} ${role}`);
  if (g.path !== `GVL1.${g.symbol}`) pairing.push(`lastKnownPath ${k}/${p} ${g.path}`);
}
for (const [s, v] of Object.entries(nat.symbols)) for (const [role, list] of [['source', v.source], ['target', v.target]]) for (const pk of list) {
  const [n, b, p] = pk.split('/'); const port = nat.blocks[`${n}/${b}`]?.ports[p];
  if (!port || port.globals.filter(g => g.symbol === s).length !== 1) pairing.push(`sgvl ${s} ${role} ${pk} without SAL ref`);
}
check('global-ref-sgvl-usage-pairing-1to1', pairing.length === 0, pairing);
const halfBound = Object.entries(nat.symbols).filter(([, s]) => !s.source.length || !s.target.length).map(([n, s]) => `${n} S${s.source.length}/T${s.target.length}`);
check('every-symbol-has-source-and-consumer', halfBound.length === 0, halfBound);
check('every-symbol-single-source', Object.values(nat.symbols).every(s => s.source.length === 1), Object.entries(nat.symbols).filter(([, s]) => s.source.length !== 1).map(([n]) => n));
check('symbol-set-and-ids-unchanged', JSON.stringify(Object.entries(src.symbols).map(([n, s]) => n + s.Id).sort()) === JSON.stringify(Object.entries(nat.symbols).map(([n, s]) => n + s.Id).sort()), '');
// 5. single source per input; activated have source; deactivated none
const sourcesPerIn = {}; const pairs = new Set(); let dupPairs = 0;
for (const [k, b] of Object.entries(nat.blocks)) for (const [p, x] of Object.entries(b.ports)) for (const w of x.wires) {const pr = `${k}/${p}>${w.to}`; if (pairs.has(pr)) dupPairs++; pairs.add(pr); sourcesPerIn[w.to] = (sourcesPerIn[w.to] ?? 0) + 1;}
for (const x of Object.values(nat.variables)) for (const u of x.usages) if (u.role === 'T' && u.kind === 'fbPortUsage') sourcesPerIn[u.ref] = (sourcesPerIn[u.ref] ?? 0) + 1;
for (const x of Object.values(nat.symbols)) for (const t of x.target) sourcesPerIn[t] = (sourcesPerIn[t] ?? 0) + 1;
const multi = Object.entries(sourcesPerIn).filter(([, n]) => n > 1);
check('single-source-per-input-and-unique-wire-pairs', dupPairs === 0 && multi.length === 0, {dupPairs, multi});
const activeNoSrc = [], deactWithSrc = [], srcActiveNoSrc = [];
const srcSources = {};
for (const [k, b] of Object.entries(src.blocks)) for (const [p, x] of Object.entries(b.ports)) for (const w of x.wires) srcSources[w.to] = 1;
for (const x of Object.values(src.variables)) for (const u of x.usages) if (u.role === 'T') srcSources[u.ref] = 1;
for (const x of Object.values(src.symbols)) for (const t of x.target) srcSources[t] = 1;
for (const [k, b] of Object.entries(nat.blocks)) for (const [p, x] of Object.entries(b.ports)) if (x.tag === 'inPort') {
  const n = sourcesPerIn[`${k}/${p}`] ?? 0;
  if (x.attrs.channelInterface === 'Activated' && n === 0) activeNoSrc.push(`${k}/${p}`);
  if (x.attrs.channelInterface === 'Deactivated' && n > 0) deactWithSrc.push(`${k}/${p}`);
  if (x.attrs.channelInterface === 'Deactivated' && 'deactivate1' in x.attrs) deactWithSrc.push(`${k}/${p} has deactivate1`);
}
for (const [k, b] of Object.entries(src.blocks)) for (const [p, x] of Object.entries(b.ports)) if (x.tag === 'inPort' && x.attrs.channelInterface === 'Activated' && !srcSources[`${k}/${p}`]) srcActiveNoSrc.push(`${k}/${p}`);
check('activated-inputs-have-source', activeNoSrc.length === 0, {native: activeNoSrc, R1baseline: srcActiveNoSrc});
check('deactivated-inputs-have-no-source', deactWithSrc.length === 0, deactWithSrc);
// 6. plan deltas: deleted / new blocks
const deleted = Object.keys(src.blocks).filter(k => !(k in nat.blocks)).sort();
const added = Object.keys(nat.blocks).filter(k => !(k in src.blocks)).sort();
check('deleted-blocks-equal-plan', JSON.stringify(deleted) === JSON.stringify(['Network3/FBOr11', 'Network3/FBOr6']), deleted);
check('new-blocks-equal-plan', JSON.stringify(added) === JSON.stringify(['Network6/HEALTHY_OK', 'Network6/HEALTH_GUARD']), added);
const inSrcOf = (n, key) => {
  const r = [];
  for (const [k, b] of Object.entries(n.blocks)) for (const [p, x] of Object.entries(b.ports)) for (const w of x.wires) if (w.to === key) r.push('wire:' + k + '/' + p);
  const [nn, bb, pp] = key.split('/'); for (const g of n.blocks[`${nn}/${bb}`].ports[pp].globals) r.push('sym:' + g.symbol);
  for (const v of Object.values(n.variables)) for (const u of v.usages) if (u.ref === key && u.role === 'T') r.push('var:' + v.name);
  return r;
};
const portOf = (n, key) => {const [a, b, p] = key.split('/'); return n.blocks[`${a}/${b}`].ports[p];};
const EXPECT_IN = {
  'Network3/FBOr1/OrIn3': ['sym:b_Step12_Set', NC], 'Network3/FBOr1/OrIn4': ['sym:b_Step4_Set', NC],
  'Network3/FBOr5/OrIn2': ['sym:b_Step4_Set', NC], 'Network3/FBOr7/OrIn2': ['sym:b_Step5_Set', NC], 'Network3/FBOr9/OrIn2': ['sym:b_Step6_Set', NC],
  'Network3/FBRs6/Reset': ['wire:Network3/FBOr2/OrOut', NC], 'Network3/FBRs8/Set': ['sym:b_Step12_Set', NC],
  'Network3/FBOr16/OrIn1': ['sym:b_Step_RnD_Set', NC], 'Network3/FBRs7/Set': ['wire:Network3/FBOr16/OrOut', NC],
  'Network3/FBRs3/Set': ['sym:b_Step3_Set_2', NC], 'Network3/FBOr13/OrIn2': ['sym:b_Step4_Set', NC],
  'Network6/FBAnd18/AndIn4': ['wire:Network6/FBAnd1/AndOut', NC], 'Network6/RUN_DOWN_RESET/OrIn1': ['sym:b_Step12_Set_2', NC],
  'Network7/FBAnd8/AndIn5': ['sym:b_Step4', NC], 'Network6/FBAnd9/AndIn6': ['wire:Network6/HEALTH_GUARD/OrOut', NC], 'Network6/FBAnd9/AndIn7': [null, null],
  'Network11/FBAnd4/AndIn3': ['var:in_LV_Faulty_FBK', NO],
  'Network6/HEALTHY_OK/AndIn1': ['var:in_LV_Faulty_FBK', NO], 'Network6/HEALTHY_OK/AndIn2': ['var:in_HV_Faulty_FBK', NO],
  'Network6/HEALTH_GUARD/OrIn1': ['wire:Network6/RUN_DOWN_OWNER/RsOut', NC], 'Network6/HEALTH_GUARD/OrIn2': ['wire:Network6/HEALTHY_OK/AndOut', NC],
  // unchanged neighbours that the ring relies on
  'Network3/FBRs1/Reset': ['wire:Network3/FBOr1/OrOut', NC], 'Network3/FBRs1/Set': ['wire:Network3/FBOr2/OrOut', NC],
  'Network3/FBRs3/Reset': ['wire:Network3/FBOr5/OrOut', NC], 'Network3/FBRs4/Set': ['sym:b_Step4_Set', NC], 'Network3/FBRs4/Reset': ['wire:Network3/FBOr7/OrOut', NC],
  'Network3/FBRs5/Set': ['sym:b_Step5_Set', NC], 'Network3/FBRs5/Reset': ['wire:Network3/FBOr9/OrOut', NC], 'Network3/FBRs6/Set': ['sym:b_Step6_Set', NC],
  'Network3/FBRs7/Reset': ['wire:Network3/FBOr13/OrOut', NC], 'Network3/FBRs8/Reset': ['sym:b_Step_RnD_Set', NC],
  'Network3/FBOr16/OrIn2': ['sym:b_Step12_Set_2', NC], 'Network3/FBOr5/OrIn3': ['sym:b_Step12_Set_2', NC],
  'Network3/FBOr13/OrIn3': ['sym:b_Step2_Set_2', NC], 'Network3/FBOr13/OrIn4': ['sym:b_Step3_Set_2', NC],
  'Network3/FBOr2/OrIn2': ['wire:Network3/FBAnd1/AndOut', NC], 'Network3/FBOr2/OrIn5': ['sym:b_Step2_Set_2', NC],
};
const planBad = [];
for (const [k, [srcExp, contact]] of Object.entries(EXPECT_IN)) {
  const got = inSrcOf(nat, k), port = portOf(nat, k);
  if (srcExp === null) {if (got.length || port.attrs.channelInterface !== 'Deactivated') planBad.push({k, got, ci: port.attrs.channelInterface}); continue;}
  if (got.length !== 1 || got[0] !== srcExp || port.attrs.channelInterface !== 'Activated' || port.attrs.deactivate1 !== contact) planBad.push({k, expected: [srcExp, contact], got, ci: port.attrs.channelInterface, contact: port.attrs.deactivate1});
}
for (const [blk, n] of [['Network6/HEALTHY_OK', 2], ['Network6/HEALTH_GUARD', 2]]) {
  const act = Object.entries(nat.blocks[blk].ports).filter(([, p]) => p.tag === 'inPort' && p.attrs.channelInterface === 'Activated').length;
  if (act !== n) planBad.push({blk, activated: act});
}
check('plan-input-sources-and-contacts', planBad.length === 0, planBad);
// new block outputs: only the planned wires, no Symbols
const nbOut = ['Network6/HEALTHY_OK/AndOut', 'Network6/HEALTH_GUARD/OrOut'].map(k => ({k, wires: portOf(nat, k).wires.map(w => w.to), globals: portOf(nat, k).globals.length}));
check('new-block-outputs', JSON.stringify(nbOut) === JSON.stringify([{k: 'Network6/HEALTHY_OK/AndOut', wires: ['Network6/HEALTH_GUARD/OrIn2'], globals: 0}, {k: 'Network6/HEALTH_GUARD/OrOut', wires: ['Network6/FBAnd9/AndIn6'], globals: 0}]), nbOut);
// new block template conformity: same port attribute signature as every native safeAnd/safeOr
const sig = b => JSON.stringify([b.tag, b.attrs.functionName, b.attrs.mapState, b.attrs.mapDiag, Object.entries(b.ports).map(([n, p]) => {const {channelInterface, deactivate1, ...a} = p.attrs; return [n, p.tag, a];})]);
const tmplAnd = sig(src.blocks['Network6/FBAnd9']), tmplOr = sig(src.blocks['Network6/FBOr5']);
check('new-blocks-native-template-signature', sig(nat.blocks['Network6/HEALTHY_OK']) === tmplAnd && sig(nat.blocks['Network6/HEALTH_GUARD']) === tmplOr && nat.blocks['Network6/HEALTHY_OK'].attrs.instanceName === 'HEALTHY_OK', '');
// every surviving port: only planned deltas
const planned = new Set(Object.keys(EXPECT_IN).filter(k => !k.startsWith('Network6/HEALTH')));
const outPlanned = new Set(['Network3/FBRs1/RsOut', 'Network3/FBRs4/RsOut', 'Network3/FBRs5/RsOut', 'Network3/FBRs6/RsOut', 'Network3/FBOr16/OrOut', 'Network3/FBOr2/OrOut', 'Network6/FBAnd1/AndOut', 'Network6/RUN_DOWN_OWNER/RsOut']);
const unexpected = [];
for (const [k, b] of Object.entries(nat.blocks)) {
  const a = src.blocks[k]; if (!a) continue;
  if (a.tag !== b.tag || a.Id !== b.Id || JSON.stringify(a.attrs) !== JSON.stringify(b.attrs)) unexpected.push({block: k, kind: 'block'});
  for (const [p, y] of Object.entries(b.ports)) {
    const x = a.ports[p]; const key = `${k}/${p}`;
    if (!x || x.Id !== y.Id) {unexpected.push({port: key, kind: 'id'}); continue;}
    const changed = JSON.stringify(x.attrs) !== JSON.stringify(y.attrs) || JSON.stringify(x.globals) !== JSON.stringify(y.globals) || JSON.stringify(x.wires) !== JSON.stringify(y.wires);
    if (changed && !(planned.has(key) || outPlanned.has(key))) unexpected.push({port: key, from: {a: x.attrs, g: x.globals, w: x.wires}, to: {a: y.attrs, g: y.globals, w: y.wires}});
    if (changed && outPlanned.has(key) && (JSON.stringify(x.attrs) !== JSON.stringify(y.attrs) || JSON.stringify(x.globals) !== JSON.stringify(y.globals))) unexpected.push({port: key, kind: 'out attrs/globals'});
    if (changed && planned.has(key)) {const {channelInterface: c1, deactivate1: d1, ...r1} = x.attrs, {channelInterface: c2, deactivate1: d2, ...r2} = y.attrs; if (JSON.stringify(r1) !== JSON.stringify(r2)) unexpected.push({port: key, kind: 'non-contact attrs changed'});}
  }
}
check('surviving-port-deltas-only-planned', unexpected.length === 0, unexpected);
// exact wire delta
const wl = n => new Set(Object.entries(n.blocks).flatMap(([k, b]) => Object.entries(b.ports).flatMap(([p, x]) => x.wires.map(w => `${k}/${p}>${w.to}`))));
const W0 = wl(src), W1 = wl(nat);
const wRemoved = [...W0].filter(x => !W1.has(x)).sort(), wAdded = [...W1].filter(x => !W0.has(x)).sort();
const expRemoved = ['Network3/FBOr11/OrOut>Network3/FBRs6/Reset', 'Network3/FBOr16/OrOut>Network3/FBRs8/Set', 'Network3/FBOr6/OrOut>Network3/FBOr13/OrIn2', 'Network3/FBOr6/OrOut>Network3/FBRs3/Set', 'Network3/FBRs1/RsOut>Network3/FBOr11/OrIn2', 'Network3/FBRs4/RsOut>Network3/FBOr5/OrIn2', 'Network3/FBRs5/RsOut>Network3/FBOr7/OrIn2', 'Network3/FBRs6/RsOut>Network3/FBOr9/OrIn2'].sort();
const expAdded = ['Network3/FBOr16/OrOut>Network3/FBRs7/Set', 'Network3/FBOr2/OrOut>Network3/FBRs6/Reset', 'Network6/FBAnd1/AndOut>Network6/FBAnd18/AndIn4', 'Network6/HEALTHY_OK/AndOut>Network6/HEALTH_GUARD/OrIn2', 'Network6/HEALTH_GUARD/OrOut>Network6/FBAnd9/AndIn6', 'Network6/RUN_DOWN_OWNER/RsOut>Network6/HEALTH_GUARD/OrIn1'].sort();
check('wire-delta-exact', JSON.stringify(wRemoved) === JSON.stringify(expRemoved) && JSON.stringify(wAdded) === JSON.stringify(expAdded), {wRemoved, wAdded});
// SAL variables: Ids, alias usages, attrs (except 4 renames), usage moves only
const RN = {in_LV_Healthy_FBK: 'in_LV_Faulty_FBK', in_HV_Healthy_FBK: 'in_HV_Faulty_FBK', outPLC_LV_Healthy: 'outPLC_LV_Faulty', outPLC_HV_Healthy: 'outPLC_HV_Faulty'};
const varBad = [];
for (const [id, a] of Object.entries(src.variables)) {
  const b = nat.variables[id]; if (!b) {varBad.push({id, missing: true}); continue;}
  const expName = RN[a.name] ?? a.name;
  if (b.name !== expName) varBad.push({id, name: b.name, expName});
  const {name: n1, ...r1} = a.attrs, {name: n2, ...r2} = b.attrs; if (JSON.stringify(r1) !== JSON.stringify(r2)) varBad.push({id, attrs: true});
  const ua = a.usages.map(u => JSON.stringify(u)), ub = b.usages.map(u => JSON.stringify(u));
  if (JSON.stringify(ua) !== JSON.stringify(ub)) {
    const moves = {'Network6/FBAnd9/AndIn6': 'Network6/HEALTHY_OK/AndIn1', 'Network6/FBAnd9/AndIn7': 'Network6/HEALTHY_OK/AndIn2'};
    const remapped = a.usages.map(u => JSON.stringify(moves[u.ref] && ['in_LV_Healthy_FBK', 'in_HV_Healthy_FBK'].includes(a.name) && u.role === 'T' ? {...u, ref: moves[u.ref]} : u));
    if (JSON.stringify(remapped) !== JSON.stringify(ub)) varBad.push({var: a.name, from: a.usages, to: b.usages});
  }
}
check('sal-variables-only-renames-and-planned-usage-moves', varBad.length === 0 && Object.keys(nat.variables).length === Object.keys(src.variables).length, varBad);
const renamed = Object.entries(RN).map(([o, n]) => ({o, n, id: Object.entries(nat.variables).find(([, v]) => v.name === n)?.[0], srcId: Object.entries(src.variables).find(([, v]) => v.name === o)?.[0]}));
check('rename-4-name-attributes-only-same-Id', renamed.every(r => r.id && r.id === r.srcId) && Object.keys(RN).every(o => !nat.sal.includes(`"${o}"`)), renamed);
check('rename-not-in-sgvl-or-diagram', Object.keys(RN).every(o => !nat.gvl.includes(o) && !nat.F['TwinSafeGroup1.sal.diagram'].includes(o)) && Object.keys(RN).every(o => !src.gvl.includes(o) && !src.F['TwinSafeGroup1.sal.diagram'].includes(o)), '');
const aliasOf = (n, name) => Object.values(n.variables).find(v => v.name === name).usages.filter(u => u.kind !== 'fbPortUsage');
check('renamed-variables-alias-usage-unchanged', Object.entries(RN).every(([o, nn]) => JSON.stringify(aliasOf(src, o)) === JSON.stringify(aliasOf(nat, nn))), Object.entries(RN).map(([o, nn]) => ({nn, alias: aliasOf(nat, nn).map(u => u.ref)})));
// 7. order
const ord = Object.entries(nat.blocks).sort((a, b) => a[1].order - b[1].order).map(([k]) => k);
const contiguous = Object.values(nat.blocks).map(b => b.order).sort((a, b) => a - b).every((o, i) => o === i + 1);
const HEAD = ['Network3/FBOr2', 'Network3/FBOr1', 'Network3/FBOr16', 'Network3/FBOr13', 'Network3/FBOr5', 'Network3/FBOr7', 'Network3/FBOr9', 'Network3/FBRs1', 'Network3/FBRs8', 'Network3/FBRs7', 'Network3/FBRs3', 'Network3/FBRs4', 'Network3/FBRs5', 'Network3/FBRs6'];
const pos = k => ord.indexOf(k);
const ordChecks = {
  contiguous, head14: JSON.stringify(ord.slice(0, 14)) === JSON.stringify(HEAD),
  FBAnd15_after_N12FBDecouple1: pos('Network12/FBAnd15') === pos('Network12/FBDecouple1') + 1,
  N3FBAnd2_before_N3FBAnd1: pos('Network3/FBAnd2') === pos('Network3/FBAnd1') - 1,
  N2FBAnd11_before_N2FBAnd91: pos('Network2/FBAnd11') === pos('Network2/FBAnd91') - 1,
  HEALTHY_OK_HEALTH_GUARD_before_FBAnd9: pos('Network6/HEALTHY_OK') === pos('Network6/FBAnd9') - 2 && pos('Network6/HEALTH_GUARD') === pos('Network6/FBAnd9') - 1,
  B3_2_FBAnd16_CONNECTORS_SCOPE_before_N1FBAnd1: JSON.stringify(ord.slice(pos('Network1/FBAnd1') - 3, pos('Network1/FBAnd1'))) === JSON.stringify(['Network12/FBAnd16', 'SafeResumption/CONNECTORS', 'SafeResumption/CONNECTOR_SCOPE']),

};
const moved = new Set([...HEAD, 'Network12/FBAnd15', 'Network3/FBAnd2', 'Network2/FBAnd11', 'Network6/HEALTHY_OK', 'Network6/HEALTH_GUARD', 'Network12/FBAnd16', 'SafeResumption/CONNECTORS', 'SafeResumption/CONNECTOR_SCOPE']);
const relRest = ord.filter(k => !moved.has(k)).join('|') === Object.entries(src.blocks).filter(([k]) => k in nat.blocks && !moved.has(k)).sort((a, b) => a[1].order - b[1].order).map(([k]) => k).join('|');
ordChecks.relativeOrderOfUnmovedBlocksPreserved = relRest;
report.orderInfo = {note: 'per PLAN 2.2/proto: HEALTH_GUARD (before FBAnd9) reads RUN_DOWN_OWNER (late in scan) from the previous scan', HEALTH_GUARD: pos('Network6/HEALTH_GUARD') + 1, RUN_DOWN_OWNER: pos('Network6/RUN_DOWN_OWNER') + 1};
report.order = ord.map((k, i) => `${i + 1}:${k}`);
check('order-of-execution-per-plan', Object.values(ordChecks).every(Boolean), ordChecks);
// 8. timers / parameters
const params = n => JSON.stringify(Object.entries(n.blocks).filter(([k]) => k in src.blocks && k in nat.blocks).map(([k, b]) => [k, Object.entries(b.ports).filter(([, p]) => p.tag === 'parameterPort').map(([pn, p]) => [pn, p.attrs])]));
check('timer-and-parameter-ports-unchanged', params(src) === params(nat), '');
const tonParamsSrc = Object.entries(src.blocks).filter(([, b]) => b.attrs.functionName === 'safeTon').length, tonParamsNat = Object.entries(nat.blocks).filter(([, b]) => b.attrs.functionName === 'safeTon').length;
check('no-new-or-removed-timers', tonParamsSrc === tonParamsNat, {source: tonParamsSrc, native: tonParamsNat});
// 9. networks
check('networks-unchanged-attrs', JSON.stringify(src.networks.map(({blocks, ...n}) => n)) === JSON.stringify(nat.networks.map(({blocks, ...n}) => n)), nat.networks.map(n => `${n.name}:${n.blocks}`));
// 10. CRC
check('staged-kept-source-crc', stg.crc.sal === src.crc.sal && stg.crc.sgvl === src.crc.sgvl && nat.crc.sal !== src.crc.sal, {source: src.crc, staged: stg.crc, native: nat.crc});
// 11. safe-source rule for SAL variables newly placed on non-first slots
const slotRows = ['Network6/HEALTHY_OK/AndIn1', 'Network6/HEALTHY_OK/AndIn2'].map(k => ({k, filter: portOf(nat, k).attrs.filter, alias: Object.values(nat.variables).find(v => v.usages.some(u => u.ref === k))?.usages.filter(u => u.kind !== 'fbPortUsage').map(u => u.ref)}));
check('new-variable-slots-use-sds61-fsoe-safe-inputs', slotRows.every(r => r.alias?.length === 1 && JSON.parse(r.alias[0]).sdsId === '61'), slotRows);
// 12. diagram
const D = walk(parse(nat.F['TwinSafeGroup1.sal.diagram'])), DS = walk(parse(src.F['TwinSafeGroup1.sal.diagram']));
const dcount = d => Object.fromEntries(['fBAndShape', 'fBOrShape', 'fBRsShape', 'fBTonShape', 'fBDecoupleShape', 'fBEstopShape', 'inPortShape', 'outPortShape', 'wiredLinkConnector', 'networkSwimLane'].map(t => [t, d.filter(n => n.tag === t).length]));
report.diagramCounts = {source: dcount(DS), native: dcount(D)};
const fbShapes = Object.entries(report.diagramCounts.native).filter(([t]) => /^fB/.test(t)).reduce((a, [, v]) => a + v, 0);
check('diagram-shapes-match-model', fbShapes === 215 && report.diagramCounts.native.inPortShape + report.diagramCounts.native.outPortShape === 1832 && report.diagramCounts.native.wiredLinkConnector === c.wires, report.diagramCounts);
const shapeIds = new Set(D.filter(n => /Shape$/.test(n.tag)).map(n => n.attr.Id));
const badConn = D.filter(n => n.tag === 'wiredLinkConnector').flatMap(cc => walk(cc).filter(x => x.tag.endsWith('PortShapeMoniker') && !shapeIds.has(x.attr.Id)).map(() => cc.attr.Id));
const wireIds = new Set(Object.values(nat.blocks).flatMap(b => Object.values(b.ports).flatMap(p => p.wires.map(w => w.Id))));
const connWire = D.filter(n => n.tag === 'wiredLinkConnector').map(cc => cc.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id);
check('diagram-connectors-resolve-one-per-wire', badConn.length === 0 && connWire.every(id => wireIds.has(id)) && new Set(connWire).size === wireIds.size && connWire.length === wireIds.size, {badConn, connectors: connWire.length, wires: wireIds.size});
const monikers = D.filter(n => n.tag.endsWith('Moniker') && n.attr.name).map(n => n.attr.name);
const blockShapeLane = D.filter(n => /^fB\w+Shape$/.test(n.tag)).map(n => ({b: n.children[0].attr.name.slice(2), lane: walk(anc(n, 'networkSwimLane')).find(x => x.tag === 'networkMoniker').attr.name.slice(2)}));
check('diagram-no-deleted-block-refs-and-lane-membership', !monikers.some(m => /\/\/Network3\/FBOr(6|11)(\/|$)/.test(m)) && blockShapeLane.every(x => x.b.split('/')[0] === x.lane) && blockShapeLane.length === 215, blockShapeLane.filter(x => x.b.startsWith('Network6/HEALTH')));
fs.writeFileSync(outFile, JSON.stringify(report, null, 1) + '\n');
const fails = report.checks.filter(x => x.status !== 'PASS');
console.log(`\n${report.checks.length - fails.length}/${report.checks.length} self-checks PASS`);
process.exitCode = fails.length ? 1 : 0;
