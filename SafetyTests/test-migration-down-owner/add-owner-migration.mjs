import fs from 'node:fs';
const p=new URL('run.mjs',import.meta.url);let s=fs.readFileSync(p,'utf8');const cone=JSON.parse(fs.readFileSync(new URL('owner-cone.json',import.meta.url)));
const addition=`
edit('current-plc-pulse-set-permit.test.js',s=>s.replace('const globals={','const globals={b_Step1:false,b_Step_RnD:false,').replace('const rawHealthy={','const rawHealthy={inPLC_RnD_Mode:false,inPLC_RnD_Mode_2:false,in_Relase_Door_PB:false,in_STO_DR1_FBK:true,in_STO_DR2_FBK:true,in_LV_C1_FBK:false,in_HV_C2_FBK:false,').replace('const selected=[','const selected=[...(route===\'legacy\'?${JSON.stringify(cone.blocks)}.map(get):[]),').replace('const writers=new Set','selected.splice(0,selected.length,...new Map(selected.map(b=>[b.path,b])).values());\n const writers=new Set'));
`;
s=s.replace("fs.writeFileSync(new URL('edits.json',base)",addition+"fs.writeFileSync(new URL('edits.json',base)");fs.writeFileSync(p,s);
