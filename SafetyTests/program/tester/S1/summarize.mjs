// Per-ID table from catalog TAP files: node program/tester/S1/summarize.mjs <label=file.tap> ...
import fs from 'node:fs';
const args=process.argv.slice(2);if(!args.length){console.error('usage: node summarize.mjs [label=]file.tap ...');process.exit(2);}
const cols=args.map(a=>{const i=a.indexOf('=');const f=i>0?a.slice(i+1):a;const l=i>0?a.slice(0,i):f.split(/[\/]/).pop().replace(/.tap$/,'');
 if(!fs.existsSync(f)){console.error('TAP file not found: '+f);process.exit(2);}return {l,rows:parse(fs.readFileSync(f,'utf8'))};});
function parse(t){const r=new Map();for(const line of t.split('\n')){const m=line.match(/^(ok|not ok) \d+ - \[(\w+)\] (\S+)(.*?)(# (TODO|SKIP).*)?$/);if(!m)continue;
 const v=m[1]==='not ok'?'FAIL':m[6]==='TODO'?(m[5].includes('NOT ASSESSABLE')?'N/A':'TODO'):m[6]==='SKIP'?'skip':'PASS';r.set(m[3],{stage:m[2],v,title:m[4].trim()});}return r;}
const ids=[...new Set(cols.flatMap(c=>[...c.rows.keys()]))];
console.log('| ID | Stage | '+cols.map(c=>c.l).join(' | ')+' | Title |');console.log('|---|---|'+cols.map(()=>'---|').join('')+'---|');
for(const id of ids){const any=cols.map(c=>c.rows.get(id)).find(Boolean);console.log(`| ${id} | ${any.stage} | ${cols.map(c=>c.rows.get(id)?.v??'-').join(' | ')} | ${(any.title??'').slice(0,90)} |`);}
const cnt=c=>{const o={};for(const v of c.rows.values())o[v.v]=(o[v.v]??0)+1;return JSON.stringify(o);};
for(const c of cols)console.log(`\n${c.l}: ${cnt(c)}`);
