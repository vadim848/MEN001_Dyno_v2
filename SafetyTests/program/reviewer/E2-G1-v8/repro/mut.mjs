import fs from 'node:fs';
const [,,srcMod,sal]=process.argv;
const {applyMutation}=await import(srcMod);
const xml=fs.readFileSync(sal,'utf8');
const r=applyMutation(xml,{id:'M-E2b-21',op:'deactivate-input',block:'//RndPhysicalCompact/GATE_030',port:'OrIn5'});
fs.writeFileSync(sal,r.xml);console.log(JSON.stringify(r.change));
