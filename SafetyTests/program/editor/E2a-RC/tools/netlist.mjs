// Netlist reader (copied from program/editor/E2a/tools/self-check.mjs netlist()).
import fs from 'node:fs';
import path from 'node:path';
import {parse, walk, anc} from './xmlpos.mjs';
export const files = d => Object.fromEntries(['TwinSafeGroup1.sal', 'GVL1.sgvl', 'TwinSafeGroup1.sal.diagram'].map(f => [f, fs.readFileSync(path.join(d, f), 'utf8')]));
const text = (xml, n) => xml.slice(n.openEnd, n.end - `</${n.tag}>`.length).trim();
export function netlist(dir) {
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
