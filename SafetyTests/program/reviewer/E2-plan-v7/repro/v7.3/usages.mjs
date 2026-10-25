import fs from 'node:fs';import {readBindingXml} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-binding-validator.js';
const f=process.argv[2];const s=fs.readFileSync(f,'utf8');
const root=readBindingXml(s);const out=[];
const rec=(n,ctx)=>{let c=ctx;if(n.tag==='variable')c={v:n.attr.name};if(/Moniker$/.test(n.tag||'')&&/Network12\/FBAnd(8|9|10)\/|inPLC|Network12\/FBOr1\//.test(n.attr?.name||''))out.push((c?.v||'?')+' -> '+n.tag+' '+n.attr.name);
 if(n.tag==='variable'&&/inPLC_RnD_Mode/.test(n.attr.name)){/*list all monikers below*/}
 for(const k of n.children||[])rec(k,c);};
rec(root,null);console.log(out.join('\n'));
const vars={};const rec2=(n,c)=>{let cc=c;if(n.tag==='variable')cc=n.attr.name;if(cc&&/inPLC_RnD_Mode/.test(cc)&&/Moniker$/.test(n.tag||''))(vars[cc]??=[]).push(n.tag+' '+n.attr.name);for(const k of n.children||[])rec2(k,cc);};rec2(root,null);console.log(JSON.stringify(vars,null,1));
