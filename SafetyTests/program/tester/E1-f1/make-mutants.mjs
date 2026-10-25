// Tester E1-f1: manual guard mutants of the F1 recognizer/owner (E0 SAL-mutation framework not used).
// Usage: node make-mutants.mjs <f1NativeDir> <outRoot>
// Writes <outRoot>/<ID>/MEN001_Dyno/Safety_Dyno/{TwinSafeGroup1/TwinSafeGroup1.sal,TwinSafeGroup1/TwinSafeGroup1.sal.diagram,GVLs/GVL1.sgvl}
// Each edit is an exact, single-occurrence text change on the native XML (asserted). CRC is NOT recomputed:
// the behavioral stand ignores CRC; native CRC checks are expected to reject every mutant (negative control).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const [srcDir, outRoot] = process.argv.slice(2);
const sal0 = fs.readFileSync(path.join(srcDir, 'TwinSafeGroup1.sal'), 'utf8');
const ids = {};
// Resolve port Ids by exact block/port path from the raw XML (own scan, no stand parser).
function portId(sal, net, block, port) {
  const n = sal.indexOf(` name="${net}" networkName=`); if (n < 0) throw Error("net " + net);
  const nEnd = sal.indexOf('</Network>', n);
  const br = new RegExp(` name="${block}" instanceName="[^"]*" orderOfExecution=`, "g"); br.lastIndex = n; const bm = br.exec(sal); const b = bm ? bm.index : -1; if (b < 0 || b > nEnd) throw Error('block ' + block);
  const bEnd = sal.indexOf('</networkHasFunctionBlocks>', b);
  const re = new RegExp(`<(?:inPort|outPort|parameterPort) Id="([0-9a-f-]{36})" name="${port.replace(/[()]/g, '\\$&')}"`, 'g'); re.lastIndex = b;
  const m = re.exec(sal); if (!m || m.index > bEnd) throw Error('port ' + block + '/' + port);
  return m[1];
}
const P = (net, block, port) => portId(sal0, net, block, port);
const once = (s, a, b) => { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) throw Error('not exactly once: ' + a.slice(0, 120)); return s.slice(0, i) + b + s.slice(i + a.length); };
function portTag(s, id) { const i = s.indexOf(`Id="${id}"`); const st = s.lastIndexOf('<', i), en = s.indexOf('>', i); return { st, en, tag: s.slice(st, en + 1) }; }
function setPort(s, id, { ci, contact }) {
  const { st, en, tag } = portTag(s, id); let t = tag;
  t = t.replace(/channelInterface="[^"]*"/, `channelInterface="${ci}"`);
  if (contact === null) t = t.replace(/ deactivate1="[^"]*"/, '');
  else if (/deactivate1=/.test(t)) t = t.replace(/deactivate1="[^"]*"/, `deactivate1="${contact}"`);
  else t = t.replace(/(channelInterface="[^"]*")/, `$1 deactivate1="${contact}"`);
  if (t === tag) throw Error('no-op port mutation ' + id);
  return s.slice(0, st) + t + s.slice(en + 1);
}
function setTiming(s, id, v) { const { st, en, tag } = portTag(s, id); const t = tag.replace(/timing="[^"]*"/, `timing="${v}"`); if (t === tag) throw Error('timing'); return s.slice(0, st) + t + s.slice(en + 1); }
function setOrder(s, blockId, order) { const { st, en, tag } = portTag(s, blockId); const t = tag.replace(/orderOfExecution="\d+"/, `orderOfExecution="${order}"`); return s.slice(0, st) + t + s.slice(en + 1); }
const blockId = (net, block) => { const n = sal0.indexOf(` name="${net}" networkName=`); const m = new RegExp(`Id="([0-9a-f-]{36})" name="${block}" instanceName="[^"]*" orderOfExecution="(\\d+)"`, 'g'); m.lastIndex = n; const r = m.exec(sal0); return { id: r[1], order: +r[2] }; };
function retargetWire(s, wireId, newTarget) { const i = s.indexOf(`<wiredLink Id="${wireId}">`); if (i < 0) throw Error('wire'); const j = s.indexOf('<inPortMoniker name="', i), k = s.indexOf('"', j + 21); return s.slice(0, j + 21) + newTarget + s.slice(k); }
function moveWireSource(s, wireId, newSourcePortId) {
  const i = s.indexOf(`<wiredLink Id="${wireId}">`); const st = s.lastIndexOf('\n', i) + 1; const en = s.indexOf('</wiredLink>', i) + '</wiredLink>'.length + 1;
  const block = s.slice(st, en); let r = s.slice(0, st) + s.slice(en);
  // if the old container became empty, drop it
  r = r.replace(/\s*<targetFunctionBlockPorts>\s*<\/targetFunctionBlockPorts>/, '');
  const { en: pe, tag } = portTag(r, newSourcePortId); if (tag.endsWith('/>')) throw Error('unsupported self-closing target');
  const tfp = r.indexOf('<targetFunctionBlockPorts>', pe); const close = r.indexOf('</outPort>', pe);
  if (tfp < 0 || tfp > close) throw Error('target has no wire container');
  const ins = r.indexOf('\n', tfp) + 1; return r.slice(0, ins) + block + r.slice(ins);
}
function addSymbolReader(s, varName, targetPath) {
  const v = s.indexOf(`name="${varName}" isLocal=`); if (v < 0) throw Error('var'); const tu = s.indexOf('<targetUsages>', v); const us = s.indexOf('<usages>', tu); const ins = s.indexOf('\n', us) + 1;
  const g = () => crypto.randomUUID();
  const x = `                <variableUsagesHasUsages Id="${g()}">\n                  <fbPortUsage Id="${g()}">\n                    <functionBlockPort>\n                      <fbPortUsageReferencesFunctionBlockPort Id="${g()}">\n                        <inPortMoniker name="${targetPath}" />\n                      </fbPortUsageReferencesFunctionBlockPort>\n                    </functionBlockPort>\n                  </fbPortUsage>\n                </variableUsagesHasUsages>\n`;
  return s.slice(0, ins) + x + s.slice(ins);
}
const NC = 'Break Contact (NC)', NO = 'Make Contact (NO)';
const and24 = n => P('Network6', 'FBAnd24', 'AndIn' + n), and23 = n => P('Network6', 'FBAnd23', 'AndIn' + n), reset = n => P('Network6', 'RUN_DOWN_RESET', 'OrIn' + n);
const owner = blockId('Network6', 'RUN_DOWN_OWNER'), resetB = blockId('Network6', 'RUN_DOWN_RESET'), a23 = blockId('Network6', 'FBAnd23'), a24 = blockId('Network6', 'FBAnd24');
const mutants = [
  ['MU01', 'MODE.OrIn3 (b_Step3) deactivated: recognizer not enabled in Run', s => setPort(s, P('SafeResumption', 'MODE', 'OrIn3'), { ci: 'Deactivated', contact: null })],
  ['MU02', 'MODE.OrIn3 inverted (NOT b_Step3)', s => setPort(s, P('SafeResumption', 'MODE', 'OrIn3'), { ci: 'Activated', contact: NO })],
  ['MU03', 'And24.AndIn3 linkRndGreenQualified deactivated (no green requirement)', s => setPort(s, and24(3), { ci: 'Deactivated', contact: null })],
  ['MU04', 'And24.AndIn3 inverted (NOT green qualified)', s => setPort(s, and24(3), { ci: 'Activated', contact: NO })],
  ['MU05', 'And24.AndIn1 NOT ResetPB_Lock deactivated (lock ignored)', s => setPort(s, and24(1), { ci: 'Deactivated', contact: null })],
  ['MU06', 'And24.AndIn2 NOT in_False deactivated', s => setPort(s, and24(2), { ci: 'Deactivated', contact: null })],
  ['MU07', 'Revert: And23.AndIn3 raw blue suppression restored (NOT in_Relase_Door_PB)', s => addSymbolReader(setPort(s, and23(3), { ci: 'Activated', contact: NO }), 'in_Relase_Door_PB', '//Network6/FBAnd23/AndIn3')],
  ['MU08', 'And23.AndIn2 Run qualifier deactivated', s => setPort(s, and23(2), { ci: 'Deactivated', contact: null })],
  ['MU09', 'And23.AndIn1 previous And24 deactivated (capture without qualification)', s => setPort(s, and23(1), { ci: 'Deactivated', contact: null })],
  ['MU10', 'RESET.OrIn1 b_Step_RnD_Set deactivated', s => setPort(s, reset(1), { ci: 'Deactivated', contact: null })],
  ['MU11', 'RESET.OrIn2 b_Step4_Set deactivated', s => setPort(s, reset(2), { ci: 'Deactivated', contact: null })],
  ['MU12', 'RESET.OrIn3 NOT linkRndGatePermit deactivated (no protective owner reset)', s => setPort(s, reset(3), { ci: 'Deactivated', contact: null })],
  ['MU13', 'RESET.OrIn3 polarity flipped (linkRndGatePermit direct)', s => setPort(s, reset(3), { ci: 'Activated', contact: NC })],
  ['MU14', 'Owner bypass: OR5.OrIn1 wired from And23 (non-latching P0 route)', s => moveWireSource(s, '277eb1ad-9b9c-451b-83fd-c8b56e771237', P('Network6', 'FBAnd23', 'AndOut'))],
  ['MU15', 'Owner Set/Reset sources swapped', s => retargetWire(retargetWire(s, '219b6e15-e6e5-428d-a74a-2862c53fbd9e', '//Network6/RUN_DOWN_OWNER/Reset'), '343deeea-ab74-4ad3-acdb-7656ae716646', '//Network6/RUN_DOWN_OWNER/Set')],
  ['MU16', 'Order: OWNER executes before And23 (swap orders)', s => setOrder(setOrder(s, owner.id, a23.order), a23.id, owner.order)],
  ['MU17', 'Order: RESET executes after OWNER (swap orders)', s => setOrder(setOrder(s, owner.id, resetB.order), resetB.id, owner.order)],
  ['MU18', 'OR5.OrIn1 owner route deactivated', s => setPort(s, P('Network6', 'FBOr5', 'OrIn1'), { ci: 'Deactivated', contact: null })],
  ['MU19', 'GREEN TON 0.5 -> 0.4 s', s => setTiming(s, P('RndPhysicalCompact', 'GREEN', 'Delay Time (s)'), '0.4')],
  ['MU20', 'GREEN TON 0.5 -> 0.6 s', s => setTiming(s, P('RndPhysicalCompact', 'GREEN', 'Delay Time (s)'), '0.6')],
  ['MU21', 'RELEASE TON 2 -> 1.5 s', s => setTiming(s, P('RndPhysicalCompact', 'RELEASE', 'Delay Time (s)'), '1.5')],
  ['MU22', 'GATE_005.AndIn2 NOT T removed (attempt owner T ignored)', s => setPort(s, P('RndPhysicalCompact', 'GATE_005', 'AndIn2'), { ci: 'Deactivated', contact: null })],
  ['MU23', 'GATE_004.AndIn3 NOT C removed (consumed attempt ignored)', s => setPort(s, P('RndPhysicalCompact', 'GATE_004', 'AndIn3'), { ci: 'Deactivated', contact: null })],
  ['MU24', 'GATE_016.AndIn4 RELEASE gating removed (rearm without 2 s)', s => setPort(s, P('RndPhysicalCompact', 'GATE_016', 'AndIn4'), { ci: 'Deactivated', contact: null })],
  ['MU25', 'BOTH TON 1 -> 0.9 s', s => setTiming(s, P('RndPhysicalCompact', 'BOTH', 'Delay Time (s)'), '0.9')],
];
// WINDOW is a safeEstop delay parameter; resolve its actual parameter port name/value before mutating.
const winBlock = sal0.indexOf(' name="WINDOW" instanceName=');
const winParam = /<parameterPort Id="([0-9a-f-]{36})" name="([^"]+)"[^>]*timing="([^"]+)"/.exec(sal0.slice(winBlock, sal0.indexOf('</networkHasFunctionBlocks>', winBlock)));
mutants.push(['MU26', `WINDOW ${winParam[2]} ${winParam[3]} -> 300 (chord window widened)`, s => setTiming(s, winParam[1], winParam[3] === '250' ? '300' : winParam[3] === '0.25' ? '0.3' : (() => { throw Error('unexpected window ' + winParam[3]); })())]);
const manifest = [];
for (const [id, label, fn] of mutants) {
  const sal = fn(sal0); if (sal === sal0) throw Error('no-op ' + id);
  const dir = path.join(outRoot, id, 'MEN001_Dyno', 'Safety_Dyno');
  fs.mkdirSync(path.join(dir, 'TwinSafeGroup1'), { recursive: true }); fs.mkdirSync(path.join(dir, 'GVLs'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'TwinSafeGroup1', 'TwinSafeGroup1.sal'), sal);
  fs.copyFileSync(path.join(srcDir, 'TwinSafeGroup1.sal.diagram'), path.join(dir, 'TwinSafeGroup1', 'TwinSafeGroup1.sal.diagram'));
  fs.copyFileSync(path.join(srcDir, 'GVL1.sgvl'), path.join(dir, 'GVLs', 'GVL1.sgvl'));
  manifest.push({ id, label, salSha256: crypto.createHash('sha256').update(sal).digest('hex') });
}
fs.writeFileSync(path.join(outRoot, 'MUTANTS.json'), JSON.stringify({ source: crypto.createHash('sha256').update(sal0).digest('hex'), mutants: manifest }, null, 1));
console.log(manifest.map(m => m.id + ' ' + m.label).join('\n'));
