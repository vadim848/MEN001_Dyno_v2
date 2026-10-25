import {load} from './kit.mjs';
const m=load();
const re=new RegExp(process.argv[2]||'.','i');
for(const v of m.variables.filter(v=>re.test(v.name)))console.log(v.name,'sds='+(v.alias?.sdsId??'-')+'/'+(v.alias?.channelId??''),'| src',v.sourcePorts.join(','),'| tgt',v.targetPorts.join(','));
