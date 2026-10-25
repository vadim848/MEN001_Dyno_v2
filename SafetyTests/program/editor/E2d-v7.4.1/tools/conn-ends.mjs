// D-2 addendum check: every connector kept from the base diagram keeps both end port shapes
// (outPortShapeMoniker/inPortShapeMoniker) and its wiredLinkMoniker; every candidate connector resolves to
// existing port shapes. Route points/jump markers are not compared (native layout, D-2).
// node conn-ends.mjs <baseDiagram> <candDiagram> <out.json>
import fs from 'node:fs';
import {parse, walk} from './xmlpos.mjs';
const [fa, fb, out] = process.argv.slice(2);
const load = f => walk(parse(fs.readFileSync(f, 'utf8')));
const A = load(fa), B = load(fb);
const shapes = new Set(B.filter(n => n.attr.Id && n.attr.absoluteBounds).map(n => n.attr.Id));
const conns = d => new Map(d.filter(n => n.tag === 'wiredLinkConnector').map(n => [n.attr.Id, n]));
const sig = c => JSON.stringify([c.children.find(x => x.tag === 'wiredLinkMoniker').attr.Id, ...walk(c).filter(x => x.tag.endsWith('PortShapeMoniker')).map(x => x.tag + ':' + x.attr.Id)]);
const CA = conns(A), CB = conns(B);
const res = {base: CA.size, candidate: CB.size, kept: 0, keptSameEnds: 0, removed: [], added: [], problems: []};
for (const [id, c] of CA) {
  const d = CB.get(id); if (!d) {res.removed.push(id); continue;}
  res.kept++; if (sig(c) === sig(d)) res.keptSameEnds++; else res.problems.push({id, kind: 'ends changed', from: sig(c), to: sig(d)});
}
for (const [id, d] of CB) {
  if (!CA.has(id)) res.added.push(id);
  const ends = walk(d).filter(x => x.tag.endsWith('PortShapeMoniker')).map(x => x.attr.Id);
  if (ends.length !== 2 || !ends.every(e => shapes.has(e))) res.problems.push({id, kind: 'unresolved ends', ends});
}
res.verdict = res.problems.length === 0 && res.kept === res.keptSameEnds;
fs.writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
console.log(JSON.stringify({...res, removed: res.removed.length, added: res.added.length}, null, 1));
