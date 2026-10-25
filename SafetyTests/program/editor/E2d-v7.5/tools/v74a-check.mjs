// V74-A self-check: new targetUsages of in_InterLock_NC_1/2 on the HV/STO set permits (v7.4) - singleton DSL wrappers,
// multiplicity, contact NC, slot/port attributes, and the atomic removal from LvCurrentPermit / N2/FBAnd1.
// node v74a-check.mjs <baseDir E2c> <candDir E2d> <out.json>
import fs from 'node:fs'; import path from 'node:path';
import {parse, walk, anc} from './xmlpos.mjs';
const [baseDir, candDir, out] = process.argv.slice(2);
const load = d => {const x = fs.readFileSync(path.join(d, 'TwinSafeGroup1.sal'), 'utf8'); return {x, S: walk(parse(x))};};
const B = load(baseDir), C = load(candDir);
const res = {checks: []}; const ck = (id, ok, detail) => {res.checks.push({id, status: ok ? 'PASS' : 'FAIL', detail}); console.log(ok ? 'PASS' : 'FAIL', id, JSON.stringify(detail).slice(0, 300));};
const PERMITS = ['FBAndHvSetPermit', 'FBAndSto1SetPermit', 'FBAndSto2SetPermit'];
const want = Object.fromEntries([1, 2].map(i => ['in_InterLock_NC_' + i, PERMITS.map(b => `//Network1/${b}/AndIn${i + 4}`)]));
const removed = Object.fromEntries([1, 2].map(i => ['in_InterLock_NC_' + i, [`//Network1/FBAndLvCurrentPermit/AndIn${i + 3}`, `//Network2/FBAnd1/AndIn${i + 4}`]]));
const portNode = (S, key) => {const [, , net, blk, p] = key.split('/'); return S.find(n => n.tag === 'inPort' && n.attr.name === p && anc(n, 'networkHasFunctionBlocks')?.children[0].attr.name === blk && anc(n, 'Network').attr.name === net);};
for (const [vn, targets] of Object.entries(want)) {
  for (const [M, label] of [[C, 'cand']]) {
    const v = M.S.find(n => n.tag === 'variable' && n.attr.name === vn);
    const tu = v.children.filter(c => c.tag === 'targetUsages');
    const vht = tu.flatMap(t => t.children.filter(c => c.tag === 'variableHasTargetUsages'));
    const vu = vht.flatMap(t => t.children.filter(c => c.tag === 'variableUsages'));
    const us = vu.flatMap(t => t.children.filter(c => c.tag === 'usages'));
    ck(`${vn} singleton wrappers targetUsages/variableHasTargetUsages/variableUsages/usages`, tu.length === 1 && vht.length === 1 && vu.length === 1 && us.length === 1, {tu: tu.length, vht: vht.length, vu: vu.length, us: us.length});
    const items = us[0].children; const monikers = items.map(i => walk(i).filter(n => n.tag.endsWith('Moniker')).map(m => m.attr.name));
    ck(`${vn} every usage item holds exactly one fbPortUsage/functionBlockPort/reference/moniker`, items.every(i => i.tag === 'variableUsagesHasUsages' && i.children.length === 1 && (i.children[0].tag !== 'fbPortUsage' || (walk(i).filter(n => n.tag === 'fbPortUsage').length === 1 && walk(i).filter(n => n.tag === 'functionBlockPort').length === 1 && walk(i).filter(n => n.tag === 'fbPortUsageReferencesFunctionBlockPort').length === 1 && walk(i).filter(n => n.tag.endsWith('Moniker')).length === 1))), items.length);
    const flat = monikers.flat();
    for (const t of targets) {
      ck(`${vn} -> ${t} exactly once`, flat.filter(m => m === t).length === 1, flat.filter(m => m === t).length);
      const p = portNode(M.S, t); ck(`${t} Activated NC, no global ref, no wire`, p && p.attr.channelInterface === 'Activated' && p.attr.deactivate1 === 'Break Contact (NC)' && !walk(p).some(n => n.tag === 'fbPortGlobalVariableReference') && !M.S.some(n => n.tag === 'inPortMoniker' && anc(n, 'wiredLink') && n.attr.name === t), p?.attr);
      const pb = portNode(B.S, t); ck(`${t} was Deactivated in E2c, non-contact attributes unchanged`, pb && pb.attr.channelInterface === 'Deactivated' && JSON.stringify((({channelInterface, deactivate1, ...r}) => r)(pb.attr)) === JSON.stringify((({channelInterface, deactivate1, ...r}) => r)(p.attr)), {base: pb?.attr.channelInterface});
    }
    for (const t of removed[vn]) {const p = portNode(M.S, t); ck(`${t} deactivated, ${vn} usage removed (atomic with v7.4)`, !flat.includes(t) && p.attr.channelInterface === 'Deactivated' && !('deactivate1' in p.attr), p.attr.channelInterface);}
    const vb = B.S.find(n => n.tag === 'variable' && n.attr.name === vn);
    const ids = n => walk(n).filter(x => x.tag === 'variableUsagesHasUsages').map(x => x.attr.Id);
    const lost = ids(vb).filter(id => !ids(v).includes(id)), added = ids(v).filter(id => !ids(vb).includes(id));
    ck(`${vn} usage delta: -2 (LvCurrentPermit, N2/FBAnd1) +3 (permits), other usage Ids preserved`, lost.length === 2 && added.length === 3, {lost: lost.length, added: added.length});
  }
}
fs.writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
const f = res.checks.filter(c => c.status !== 'PASS'); console.log(`${res.checks.length - f.length}/${res.checks.length} PASS`); process.exitCode = f.length ? 1 : 0;
