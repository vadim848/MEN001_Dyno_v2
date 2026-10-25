// E4 out-of-SAL config copies (full files, minimal text edits; encoding/BOM/CRLF preserved).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const REPO = 'C:/Users/user/source/repos/MEN001_Dyno_v2/', OUT = REPO + 'SafetyTests/candidates/E4/config/';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const R = '\r\n';
const manifest = [];
const rd = rel => fs.readFileSync(REPO + rel, 'utf8');
const wr = (rel, text, base, summary, renamedFrom) => {
  const out = OUT + rel;
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, Buffer.from(text, 'utf8'));
  manifest.push({target: rel, renamedFrom: renamedFrom ?? null, base: base === null ? null : sha(Buffer.from(base, 'utf8')), new: sha(Buffer.from(text, 'utf8')), summary});
};
const once = (t, a, b) => {
  const i = t.indexOf(a);
  assert(i >= 0, 'missing: ' + a.slice(0, 80));
  assert(t.indexOf(a, i + 1) < 0, 'ambiguous: ' + a.slice(0, 80));
  return t.replace(a, () => b);
};
const SD = 'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/Alias Devices/PLC_IO/';
// alias device renames (content identical, native sds CRC unchanged)
const REN = [['IN_BIT_RnD_Mode.sds', 'IN_CMD_SAFE_TO_RND.sds', 94], ['IN_BIT_RnD_Mode_2.sds', 'IN_CMD_RND_TO_RUN.sds', 97], ['IN_Bypass1.sds', 'IN_CMD_RUN_TO_RND.sds', 63], ['IN_Bypass2.sds', 'IN_CMD_RND_TO_SAFE.sds', 64], ['IN_BIT_InitSystem.sds', 'IN_PLC_Heartbeat.sds', 48], ['OUT_BIT_MotoCoolingEnable.sds', 'OUT_STS_SAFE.sds', 14]];
for (const [o, n, id] of REN) {
  const t = rd(SD + o);
  wr(SD + n, t, t, `rename only (SDSID ${id}, content and CRC unchanged)`, SD + o);
}
// new sds files are produced by make-sds.ps1 (native writer)
const NEWSDS = [['OUT_STS_RND', 100], ['OUT_STS_RUN', 101], ['OUT_STS_EMG', 102], ['OUT_STS_CFG', 103], ['OUT_STS_COVER_LOCKED', 104], ['OUT_STS_FAULT', 105]];
for (const [n, id] of NEWSDS) {
  const t = fs.readFileSync(OUT + SD + n + '.sds', 'utf8');
  manifest.push({target: SD + n + '.sds', renamedFrom: null, base: null, new: sha(Buffer.from(t, 'utf8')), summary: `NEW Out BIT standard alias device SDSID ${id} (native AliasDevice.ToXml; CRC by native writer)`});
}
// splcproj
{
  const f = 'MEN001_Dyno/Safety_Dyno/Safety_Dyno.splcproj';
  const b = rd(f);
  let t = b;
  const inc = n => `    <None Include="TwinSafeGroup1\\Alias Devices\\PLC_IO\\${n}" />`;
  for (const [o, n] of REN) t = once(t, inc(o), inc(n));
  t = once(t, inc('OUT_STS_SAFE.sds'), inc('OUT_STS_SAFE.sds') + NEWSDS.map(([n]) => R + inc(n + '.sds')).join(''));
  t = once(t, '<NextSdsId>100</NextSdsId>', '<NextSdsId>106</NextSdsId>');
  wr(f, t, b, 'Include paths of 6 renamed alias files, +6 Include lines for new sds 100-105, NextSdsId 100->106; Project Crc attribute NOT recomputed (IDE refreshes on save)');
}
// PLC DUTs
const sub = (n, off) => `\t\t\t<SubItem>${R}\t\t\t\t<Name>${n}</Name>${R}\t\t\t\t<Type GUID="{18071995-0000-0000-0000-000000000030}">BOOL</Type>${R}\t\t\t\t<BitSize>8</BitSize>${R}\t\t\t\t<BitOffs>${off}</BitOffs>${R}\t\t\t</SubItem>${R}`;
const OUTNEW = ['CMD_RUN_TO_RND', 'CMD_RND_TO_SAFE', 'Heartbeat'];
const INNEW = ['STS_SAFE', 'STS_RND', 'STS_RUN', 'STS_EMG', 'STS_CFG', 'STS_COVER_LOCKED', 'STS_FAULT'];
{
  const f = 'MEN001_Dyno/PLC_Dyno/DUTs/ST_TwinSAFE_OUT.TcDUT';
  const b = rd(f);
  let t = b;
  t = once(t, `\tSet_RnD_Mode\t:\tBOOL\t;${R}\tSet_RnD_Mode2\t:\tBOOL\t;${R}`, `\tCMD_SAFE_TO_RND\t:\tBOOL\t;${R}\tCMD_RND_TO_RUN\t:\tBOOL\t;${R}`);
  t = once(t, `\tBypass_C1C2\t:\tBOOL\t;${R}`, `\tBypass_C1C2\t:\tBOOL\t;${R}${R}\tCMD_RUN_TO_RND\t:\tBOOL\t;${R}\tCMD_RND_TO_SAFE\t:\tBOOL\t;${R}\tHeartbeat\t:\tBOOL\t;//0.5 s toggle, TwinSAFE watchdog 3 s${R}`);
  wr(f, t, b, 'Set_RnD_Mode/Set_RnD_Mode2 renamed CMD_SAFE_TO_RND/CMD_RND_TO_RUN (same offsets); +CMD_RUN_TO_RND, CMD_RND_TO_SAFE, Heartbeat');
}
{
  const f = 'MEN001_Dyno/PLC_Dyno/DUTs/ST_TwinSAFE_IN.TcDUT';
  const b = rd(f);
  let t = b;
  t = once(t, `\tHV_Interlock\t:\tBOOL\t;${R}`, `\tHV_Interlock\t:\tBOOL\t;${R}${R}` + INNEW.map(n => `\t${n}\t:\tBOOL\t;${R}`).join(''));
  wr(f, t, b, '+7 status fields STS_SAFE, STS_RND, STS_RUN, STS_EMG, STS_CFG, STS_COVER_LOCKED, STS_FAULT (after HV_Interlock)');
}
// MAIN
{
  const f = 'MEN001_Dyno/PLC_Dyno/POUs/MAIN.TcPOU';
  const b = rd(f);
  let t = b;
  t = once(t, `\tn_SafeSate\t:\tINT\t;${R}END_VAR`, `\tn_SafeSate\t:\tINT\t;${R}${R}\t//TwinSAFE heartbeat (interface v1.4): level toggles every 0.5 s${R}\tHB_On_TON: TON;${R}\tHB_Off_TON: TON;${R}\tbHeartbeat\t:\tBOOL\t;${R}${R}\t//Request source to be connected by PLC side: all CMD_* stay FALSE (idle) while b_PlcRequestActive is FALSE${R}\tb_PlcRequestActive\t:\tBOOL\t;${R}END_VAR`);
  t = once(t, `act_LogicMap();${R}`, `act_LogicMap();${R}${R}//TwinSAFE heartbeat: toggle every 0.5 s (no level change for 3 s -> TwinSAFE Emergency)${R}HB_On_TON(IN:=NOT bHeartbeat, PT:=T#500MS);${R}HB_Off_TON(IN:=bHeartbeat, PT:=T#500MS);${R}IF HB_On_TON.Q AND NOT bHeartbeat THEN bHeartbeat:=TRUE; END_IF;${R}IF HB_Off_TON.Q AND bHeartbeat THEN bHeartbeat:=FALSE; END_IF;${R}GVL_Safety.stTwinSAFE_OUT.Heartbeat:=bHeartbeat;${R}`);
  const a = t.indexOf('<![CDATA[(*' + R + '____');
  assert(a > 0);
  const e = t.indexOf('END_CASE', a);
  assert(e > a);
  const P = 'GVL_Safety.stTwinSAFE_OUT.';
  const nb = [
    '<![CDATA[(*',
    'Interface v1.4: all CMD_* are FALSE (idle) by default. Only while b_PlcRequestActive is TRUE exactly one CMD_* is TRUE (per n_SafeSate case). TwinSAFE detects the rising edge.',
    'Request source to be connected by PLC side (nothing writes b_PlcRequestActive / n_SafeSate yet).',
    `Function\t\t\t\t|\tCommand (${P}...)`,
    'From Safe to RnD\t\t|\tCMD_SAFE_TO_RND',
    'From RnD to Armed (Run)\t|\tCMD_RND_TO_RUN',
    'From Armed (Run) to RnD\t|\tCMD_RUN_TO_RND',
    'From RnD to Safe\t\t|\tCMD_RND_TO_SAFE',
    '*)',
    ';',
    '',
    `${P}CMD_SAFE_TO_RND:=FALSE;`,
    `${P}CMD_RND_TO_RUN:=FALSE;`,
    `${P}CMD_RUN_TO_RND:=FALSE;`,
    `${P}CMD_RND_TO_SAFE:=FALSE;`,
    '',
    'IF b_PlcRequestActive THEN',
    'CASE n_SafeSate OF',
    '\tE_SafetyState.enum_RnD_2_Safe://From RnD to Safe',
    `\t\t${P}CMD_RND_TO_SAFE:=TRUE;`,
    '\tE_SafetyState.enum_Safe_2_RnD://From Safe to RnD',
    `\t\t${P}CMD_SAFE_TO_RND:=TRUE;`,
    '\t',
    '\tE_SafetyState.enum_RnD_2_Armed://From RnD to Armed',
    `\t\t${P}CMD_RND_TO_RUN:=TRUE;`,
    '\t',
    '\tE_SafetyState.enum_Armed_2_RnD://From Armed to RnD',
    `\t\t${P}CMD_RUN_TO_RND:=TRUE;`,
    'END_CASE',
    'END_IF',
    ''].join(R);
  t = t.slice(0, a) + nb + t.slice(e + 'END_CASE'.length + R.length);
  wr(f, t, b, 'heartbeat 0.5 s toggle (2 TON) -> stTwinSAFE_OUT.Heartbeat; act_LogicMap: legacy 2-bit writes replaced by one CMD_* TRUE per n_SafeSate case, all others FALSE every scan');
}
// tsproj
{
  const f = 'MEN001_Dyno/MEN001_Dyno.tsproj';
  const b = rd(f);
  let t = b;
  const dt = (name, fn) => {
    const i = t.indexOf(`>${name}</Name>`);
    assert(i > 0);
    const e = t.indexOf('</DataType>', i);
    const seg = t.slice(i, e); const tail = seg.match(/	*$/)[0]; t = t.slice(0, i) + fn(seg.slice(0, seg.length - tail.length)) + tail + t.slice(e);
  };
  dt('ST_TwinSAFE_OUT', s => {
    s = once(s, '<BitSize>120</BitSize>', '<BitSize>144</BitSize>');
    s = once(s, '<Name>Set_RnD_Mode</Name>', '<Name>CMD_SAFE_TO_RND</Name>');
    s = once(s, '<Name>Set_RnD_Mode2</Name>', '<Name>CMD_RND_TO_RUN</Name>');
    return s + OUTNEW.map((n, i) => sub(n, 120 + 8 * i)).join('');
  });
  dt('ST_TwinSAFE_IN', s => {
    s = once(s, '<BitSize>200</BitSize>', '<BitSize>256</BitSize>');
    return s + INNEW.map((n, i) => sub(n, 200 + 8 * i)).join('');
  });
  const T8 = '\t'.repeat(8);
  const ent = (n, sb) => `${T8}<Entry Name="Standard Out Var ${n}" Index="#x7000" Sub="#x${sb.toString(16).padStart(2, '0')}">${R}${T8}\t<Type>BIT</Type>${R}${T8}</Entry>${R}`;
  const a98 = ent(98, 0x1a);
  const padOld = `${T8}<Entry>${R}${T8}\t<Type GUID="{18071995-0000-0000-0000-002000000007}">ARRAY [0..6] OF BIT</Type>${R}${T8}</Entry>${R}`;
  const padNew = padOld.replace('002000000007', '002000000001').replace('[0..6]', '[0..0]');
  t = once(t, a98 + padOld, a98 + [100, 101, 102, 103, 104, 105].map((n, i) => ent(n, 0x1b + i)).join('') + padNew);
  const L = (g, n, v) => `\t\t\t\t<Link VarA="PlcTask ${g}^GVL_Safety.stTwinSAFE_${g === 'Inputs' ? 'IN' : 'OUT'}^${n}" VarB="${g === 'Inputs' ? 'StandardInputs^Standard Out' : 'StandardOutputs^Standard In'} Var ${v}"/>${R}`;
  const lk = (g, n) => {
    const line = L(g, n, '@@');
    const re = new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('@@', '\\d+'));
    const m = t.match(re);
    assert(m, 'link ' + n);
    return m[0];
  };
  const sto2 = lk('Inputs', 'STO_2');
  t = once(t, sto2, sto2 + [['STS_SAFE', 14], ['STS_RND', 100], ['STS_RUN', 101], ['STS_EMG', 102], ['STS_CFG', 103], ['STS_COVER_LOCKED', 104], ['STS_FAULT', 105]].map(([n, v]) => L('Inputs', n, v)).join(''));
  const byp = lk('Outputs', 'Bypass_C1C2');
  t = once(t, byp, byp + L('Outputs', 'CMD_RND_TO_RUN', 97) + L('Outputs', 'CMD_RND_TO_SAFE', 64) + L('Outputs', 'CMD_RUN_TO_RND', 63) + L('Outputs', 'CMD_SAFE_TO_RND', 94));
  t = once(t, lk('Outputs', 'Set_RnD_Mode'), '');
  t = once(t, lk('Outputs', 'Set_RnD_Mode2'), '');
  const est = lk('Outputs', 'EstopPLC');
  t = once(t, est, est + L('Outputs', 'Heartbeat', 48));
  wr(f, t, b, 'DataType ST_TwinSAFE_OUT (rename 2 fields, +3, 120->144 bit) and ST_TwinSAFE_IN (+7, 200->256 bit); StandardInputs PDO +Standard Out Var 100-105, padding ARRAY[0..6]->[0..0]; task links: +7 STS_* (Out Var 14,100-105), Set_RnD_Mode/2 -> CMD_SAFE_TO_RND(94)/CMD_RND_TO_RUN(97), +CMD_RUN_TO_RND(63), CMD_RND_TO_SAFE(64), Heartbeat(48); TargetSystemConfig/hardware/safe I/O unchanged');
}
fs.writeFileSync(OUT + 'manifest.json', JSON.stringify(manifest, null, 1));
console.log(manifest.map(m => `${m.target}\n  base ${m.base?.slice(0, 12)} new ${m.new.slice(0, 12)}${m.renamedFrom ? ' RENAME from ' + m.renamedFrom : ''}`).join('\n'));
