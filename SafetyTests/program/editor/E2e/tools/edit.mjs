import fs from 'node:fs';
let t = fs.readFileSync('make-e2e.mjs','utf8');
const rep=(a,b)=>{ if(!t.includes(a)) throw Error('missing '+a.slice(0,60)); t=t.replace(a,b); };
// header + expectations
rep(/\/\/ E2d staging[\s\S]*?\/\/ Usage: node make-e2d.mjs <sourceDir E2c> <stagedDir>/.exec(t)[0],
`// E2e staging: PLAN E2-S2 (4 fixes, +7 FB) over frozen candidate E2d v7.7. Same engine as make-e2d.mjs.
// Stored CRC values are NOT touched; native writers regenerate them.
// Usage: node make-e2e.mjs <sourceDir E2d> <stagedDir>`);
rep(/const EXPECT = \{[^\n]*\n/.exec(t)[0], `const EXPECT = {sal: 'c2f9ccd7a901e40f1ad5a3db780898c32b19180d6993528ce34afaffdb903689', sgvl: 'd845bd26331cfb166e13094c2a4c9cf9918252bb2cb34b6644acccc4c4564433', diagram: '8797b832fee722dc068dce8e7f37ce4390acc8303abea1237f670bd394d71469'}; // E2d v7.7\n`);
// plan check
const a=t.indexOf('// built on PLAN v7.7'), b=t.indexOf('const guid =');
t = t.slice(0,a)+`const PLAN = {md: 'acdb98195c33d7ce974b8f2180af59f2ac3f58504c0d083b4e1b367597499c2a', json: '966827ee4cb5efeb87e398806c0af35d514d26e2baae5998130a5ddc0a94d966'}; // PLAN E2-S2
const planFile = f => fs.readFileSync(new URL('../../../architect/E2-S2/' + f, import.meta.url));
const planArchived = [['PLAN.md', PLAN.md], ['PLAN.json', PLAN.json]].every(([f, h]) => hash(planFile(f)) === h);
assert(planArchived, 'PLAN E2-S2 hash mismatch');
`+t.slice(b);
t=t.replace("hash('E2d/' + label)","hash('E2e/' + label)");
// blocks / inputs
const nb0=t.indexOf('const NEW_BLOCKS = ['), nb1=t.indexOf('const EXP = {');
t = t.slice(0,nb0)+`const NEW_BLOCKS = [
  {net: 'Network8', name: 'FBOrS5', fn: 'safeOr', template: OR, inputs: {OrIn1: {symbol: 'b_Step5', contact: NC}, OrIn2: {symbol: 'b_Step5_Set', contact: NC}}},
  {net: 'SafeResumption', name: 'HLT_DESC_SET', fn: 'safeAnd', template: AND, inputs: {AndIn1: {variable: 'in_LV_Faulty_FBK', contact: NC}, AndIn2: {variable: 'linkRunDownOwner', contact: NC}, AndIn3: {variable: 'in_False_SI2_CH8', contact: NO}}},
  {net: 'SafeResumption', name: 'HLT_MEM', fn: 'safeRs', template: 'RndPhysicalCompact/STATE_SU', inputs: {Set: {wire: 'SafeResumption/HLT_DESC_SET/AndOut', contact: NC}, Reset: {symbol: 'b_Step1', contact: NC}}},
  {net: 'SafeResumption', name: 'HLT_LV_SRC', fn: 'safeOr', template: OR, inputs: {OrIn1: {variable: 'in_LV_Faulty_FBK', contact: NC}, OrIn2: {wire: 'SafeResumption/HLT_MEM/RsOut', contact: NC}}},
  {net: 'Network1', name: 'FBK_OFF', fn: 'safeAnd', template: AND, inputs: {AndIn1: {variable: 'in_LV_C1_FBK', contact: NO}, AndIn2: {variable: 'in_HV_C2_FBK', contact: NO}}},
  {net: 'Network1', name: 'EXIT_FBK_OK', fn: 'safeOr', template: OR, inputs: {OrIn1: {symbol: 'b_EStop_Ok', contact: NC}, OrIn2: {wire: 'Network1/FBK_OFF/AndOut', contact: NC}}},
  {net: 'Network11', name: 'WIN_C1_IN', fn: 'safeAnd', template: AND, inputs: {AndIn1: {wire: 'Network11/FBAnd1/AndOut', contact: NC}, AndIn2: {variable: 'out_LV_C1', contact: NC}}},
];
const DELETE_BLOCKS = [];
const NEW_VARS = [];
const INPUTS = [
  ['Network8/FBAnd1/AndIn1', {wire: 'Network8/FBOrS5/OrOut', contact: NC}, 'L3'],
  ['SafeResumption/HLT_LV/AndIn1', {wire: 'SafeResumption/HLT_LV_SRC/OrOut', contact: NC}, 'E2-02'],
  ['Network1/FBEstop1/EStopIn5', {wire: 'Network1/EXIT_FBK_OK/OrOut', estop: true}, 'EMG6-FBK'],
  ['Network11/WIN_C1/TonIn', {wire: 'Network11/WIN_C1_IN/AndOut', contact: NC}, 'S4a'],
];
`+t.slice(nb1);
t=t.replace(/const EXP = \{[^\n]*\n/, "const EXP = {fb: 237, ports: 2004, symbols: 63, salVariables: 79};\n");
// estop contact
rep("function setContact(open, p, spec) {", `function setContact(open, p, spec) {
  if (spec.estop) {assert(/ channelInterface="Both Deactivated"/.test(open) && !/ deactivate1=/.test(open), 'estop port ' + pkey(p)); return open.replace(' channelInterface="Both Deactivated"', ' channelInterface="Single-Channel 1 Activated" deactivate1="Break Contact (NC)"');}`);
// order
const o0=t.indexOf("insAfter(['RndPhysicalCompact/GATE_PHASE'"); const o1=t.indexOf('\n',o0);
t=t.slice(0,o0)+`insBefore(['Network8/FBOrS5'], 'Network8/FBAnd1');
insBefore(['SafeResumption/HLT_DESC_SET', 'SafeResumption/HLT_MEM', 'SafeResumption/HLT_LV_SRC'], 'SafeResumption/HLT_LV');
insBefore(['Network1/FBK_OFF', 'Network1/EXIT_FBK_OK'], 'Network1/FBEstop1');
insAfter(['Network11/WIN_C1_IN'], 'Network11/FBAnd1');`+t.slice(o1);
t=t.replace("assert.equal(blocks.size, 229)","assert.equal(blocks.size, 230)").replace("assert.equal(ports.size, 1944)","assert.equal(ports.size, 1947)");
fs.writeFileSync('make-e2e.mjs',t);
