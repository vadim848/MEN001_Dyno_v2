// R1-D-2 (+ D-2 connectors addendum) geometry self-check: base vs candidate native diagram (copy of E2a/tools/geom-check.mjs, FB count 225).
// (a) inside each lane, preserved shapes keep relative position (single lane shift, dx=0, size 0);
//     preserved connectors keep routing points up to the same lane shift (jump markers reported separately);
// (b) lane shifts only from lane height fit; (c) no shapes for removed blocks, shape count = block count;
// new shapes: inside their lane, no overlap with other FB shapes.
// node geom-check.mjs <r1Diagram> <e2aDiagram> <out.json>
import fs from 'node:fs';
import {parse, walk, anc} from './xmlpos.mjs';
const [fa, fb, out] = process.argv.slice(2);
const A = walk(parse(fs.readFileSync(fa, 'utf8'))), B = walk(parse(fs.readFileSync(fb, 'utf8')));
const bounds = n => n.attr.absoluteBounds.split(',').map(Number);
const laneName = n => {const l = n.tag === 'networkSwimLane' ? n : anc(n, 'networkSwimLane'); return l ? walk(l).find(c => c.tag === 'networkMoniker').attr.name.slice(2) : '(root)';};
const r9 = v => +v.toFixed(9);
const mb = new Map(B.filter(n => n.attr.absoluteBounds).map(n => [n.attr.Id, n]));
const laneDelta = {}, containers = {}, violations = [];
let preserved = 0, removed = 0;
for (const n of A.filter(n => n.attr.absoluteBounds)) {
  const m = mb.get(n.attr.Id);
  if (!m) {removed++; continue;}
  const d = bounds(m).map((v, i) => r9(v - bounds(n)[i]));
  const lane = laneName(n);
  if (n.tag === 'networkSwimLane' || n.tag.endsWith('Diagram')) {containers[lane + ' ' + n.tag] = d; continue;}
  preserved++;
  if (d[0] !== 0 || d[2] !== 0 || d[3] !== 0) violations.push({id: n.attr.Id, tag: n.tag, lane, d});
  (laneDelta[lane] ??= new Set()).add(d[1]);
}
const multiShift = Object.entries(laneDelta).filter(([, s]) => s.size !== 1).map(([l, s]) => ({lane: l, shifts: [...s]}));
// connectors
const pts = c => [...c.attr.edgePoints.matchAll(/\(([-\d.]+) : ([-\d.]+)(?: : (\w+))?\)/g)].map(m => ({x: +m[1], y: +m[2], k: m[3] || ''}));
const cb = new Map(B.filter(n => n.tag === 'wiredLinkConnector').map(n => [n.attr.Id, n]));
const conn = {same: 0, shiftedOnly: 0, jumpOnly: 0, rerouted: []};
let connRemoved = 0;
for (const c of A.filter(n => n.tag === 'wiredLinkConnector')) {
  const m = cb.get(c.attr.Id); if (!m) {connRemoved++; continue;}
  const lane = laneName(c); const dy = [...(laneDelta[lane] ?? new Set([0]))][0];
  const p = pts(c), q = pts(m);
  const noJ = a => a.filter(x => !x.k).map(x => `${r9(x.x)}:${r9(x.y)}`);
  const shift = a => a.filter(x => !x.k).map(x => `${r9(x.x)}:${r9(x.y + dy)}`);
  if (c.attr.edgePoints === m.attr.edgePoints) conn.same++;
  else if (JSON.stringify(p.map(x => ({...x, y: r9(x.y + dy), x: r9(x.x)}))) === JSON.stringify(q.map(x => ({...x, x: r9(x.x), y: r9(x.y)})))) conn.shiftedOnly++;
  else if (JSON.stringify(shift(p)) === JSON.stringify(noJ(q))) conn.jumpOnly++;
  else conn.rerouted.push({id: c.attr.Id, lane, from: c.attr.edgePoints, to: m.attr.edgePoints});
}
// new shapes
const ma = new Set(A.filter(n => n.attr.Id).map(n => n.attr.Id));
const newShapes = B.filter(n => /^fB\w+Shape$/.test(n.tag) && !ma.has(n.attr.Id)).map(n => ({block: n.children[0].attr.name, lane: laneName(n), bounds: n.attr.absoluteBounds}));
const overlaps = [];
for (const s of newShapes) {
  const [x, y, w, h] = s.bounds.split(',').map(Number);
  const lane = B.find(n => n.tag === 'networkSwimLane' && laneName(n) === s.lane); const [lx, ly, lw, lh] = bounds(lane);
  if (x < lx || y < ly || x + w > lx + lw || y + h > ly + lh) overlaps.push({block: s.block, outsideLane: true});
  for (const o of B.filter(n => /^fB\w+Shape$/.test(n.tag) && n.children[0].attr.name !== s.block)) {
    const [ox, oy, ow, oh] = bounds(o);
    if (x < ox + ow && ox < x + w && y < oy + oh && oy < y + h) overlaps.push({block: s.block, with: o.children[0].attr.name});
  }
}
const newConn = B.filter(n => n.tag === 'wiredLinkConnector' && !ma.has(n.attr.Id)).map(n => ({id: n.attr.Id, lane: laneName(n), edgePoints: n.attr.edgePoints}));
const fbShapes = B.filter(n => /^fB\w+Shape$/.test(n.tag)).length;
const result = {criterion: 'R1-D-2', preservedShapes: preserved, removedShapes: removed, shapeSizeOrXViolations: violations, laneShifts: Object.fromEntries(Object.entries(laneDelta).map(([l, s]) => [l, [...s]])), multiShiftLanes: multiShift, containers,
  connectors: {...conn, rerouted: conn.rerouted.length, reroutedList: conn.rerouted, removed: connRemoved, added: newConn}, newShapes, newShapeOverlaps: overlaps, fbShapes,
  verdict: {a_shapes: violations.length === 0 && multiShift.length === 0, a_connectors: conn.rerouted.length === 0, c_count: fbShapes === 227, newShapesPlaced: overlaps.length === 0}};
fs.writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
console.log(JSON.stringify({...result, connectors: {...result.connectors, reroutedList: result.connectors.reroutedList.map(r => r.id + ' ' + r.lane), added: newConn.map(c => c.lane)}}, null, 1));
