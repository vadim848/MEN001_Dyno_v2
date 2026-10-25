// Netlist dump of selected blocks: node dump.mjs <dir> <blockRegex>
import fs from 'node:fs'; import path from 'node:path';
import {parse, walk, anc} from '../../E2a/tools/xmlpos.mjs';
const [dir, re] = process.argv.slice(2);
const sal = fs.readFileSync(path.join(dir, 'TwinSafeGroup1.sal'), 'utf8'), gvl = fs.readFileSync(path.join(dir, 'GVL1.sgvl'), 'utf8');
const S = walk(parse(sal)), G = walk(parse(gvl));
const text = (x, n) => x.slice(n.openEnd, n.end - `</${n.tag}>`.length).trim();
const sym = new Map(G.filter(n => n.tag === 'Variable').map(v => [v.attr.Id, text(gvl, v.children.find(c => c.tag === 'Name'))]));
const pk = p => `${anc(p, 'Network').attr.name}/${anc(p, 'networkHasFunctionBlocks').children[0].attr.name}/${p.attr.name}`;
const src = {};
for (const w of S.filter(n => n.tag === 'wiredLink')) (src[w.children[0].attr.name.slice(2)] ??= []).push('wire:' + pk(w.parent.parent));
for (const v of S.filter(n => n.tag === 'variable')) for (const u of walk(v).filter(n => n.tag === 'variableUsagesHasUsages')) {const m = walk(u).find(n => n.tag.endsWith('Moniker')); if (m) (src[m.attr.name.slice(2)] ??= []).push((anc(u, 'targetUsages') ? 'var:' : 'varSRC:') + v.attr.name);}
for (const b of S.filter(n => n.parent?.tag === 'networkHasFunctionBlocks')) {
  const k = `${anc(b, 'Network').attr.name}/${b.attr.name}`; if (!new RegExp(re).test(k)) continue;
  console.log(`${k} ${b.attr.functionName} order=${b.attr.orderOfExecution}`);
  for (const p of walk(b).filter(n => ['inPort', 'outPort', 'parameterPort'].includes(n.tag))) {
    const g = walk(p).filter(n => n.tag === 'fbPortGlobalVariableReference').map(r => 'sym:' + sym.get(r.attr.variableId));
    const w = walk(p).filter(n => n.tag === 'wiredLink').map(x => '->' + x.children[0].attr.name.slice(2));
    if (p.tag === 'parameterPort') {console.log(`   P ${p.attr.name} ${JSON.stringify(Object.fromEntries(Object.entries(p.attr).filter(([a]) => !['Id', 'name'].includes(a))))}`); continue;}
    if (p.tag === 'inPort' && p.attr.channelInterface === 'Deactivated' && !g.length && !(src[pk(p)])) continue;
    console.log(`   ${p.tag === 'inPort' ? 'I' : 'O'} ${p.attr.name} ${p.attr.channelInterface ?? ''} ${p.attr.deactivate1 ?? ''} ${[...(src[pk(p)] ?? []), ...g, ...w].join(' ')}`);
  }
}
