import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const here=new URL('./',import.meta.url),repo=new URL('../../../',here),out=new URL('sandbox/',here);
fs.mkdirSync(out,{recursive:true});
for(const dir of ['src','test'])fs.cpSync(new URL('SafetyTests/'+dir,repo),new URL('SafetyTests/'+dir,out),{recursive:true});
for(const f of fs.readdirSync(new URL('SafetyTests/',repo)))if(f.endsWith('.json'))fs.copyFileSync(new URL('SafetyTests/'+f,repo),new URL('SafetyTests/'+f,out));
for(const [src,dst]of [['TwinSafeGroup1.sal','TwinSafeGroup1/TwinSafeGroup1.sal'],['GVL1.sgvl','GVLs/GVL1.sgvl']]){const target=new URL('MEN001_Dyno/Safety_Dyno/'+dst,out);fs.mkdirSync(new URL('./',target),{recursive:true});fs.copyFileSync(new URL(src,here),target);}
const tests=['current-rnd-physical-integration.test.js','current-early-sto.test.js'];
for(const test of tests){const r=spawnSync(process.execPath,['--test','SafetyTests/test/'+test],{cwd:out,encoding:'utf8',maxBuffer:32*1024*1024});fs.writeFileSync(new URL(test+'.log',here),r.stdout+r.stderr);console.log(test,{exit:r.status,summary:r.stdout.match(/# tests[^]*$/)?.[0]});}
// Repeat unchanged oracle with the three retired internal observation names
// redirected to their planned replacement native TON outputs. Raw logs remain.
const observer=new URL('SafetyTests/src/physical-rnd-source.js',out);
fs.writeFileSync(observer,fs.readFileSync(observer,'utf8').replaceAll('GATE_020/AndOut','BOTH/TonOut').replaceAll('GATE_017/AndOut','GREEN/TonOut').replaceAll('GATE_018/AndOut','BLUE/TonOut'));
const mapped=spawnSync(process.execPath,['--test','SafetyTests/test/current-rnd-physical-integration.test.js'],{cwd:out,encoding:'utf8',maxBuffer:32*1024*1024});
fs.writeFileSync(new URL('rnd-mapped-observations.log',here),mapped.stdout+mapped.stderr);console.log('mapped native observations',{exit:mapped.status,summary:mapped.stdout.match(/# tests[^]*$/)?.[0]});
