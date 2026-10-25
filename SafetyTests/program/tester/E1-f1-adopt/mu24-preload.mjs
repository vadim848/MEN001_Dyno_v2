// Mutation preload (tester repro only, not part of the regression): applies MU24 to the model held by every
// SalRuntime before its first scan: //RndPhysicalCompact/GATE_016 AndIn4 channelInterface -> 'Deactivated'.
// Usage: node --import <this file URL> --test test/current-btn-release-after-permit.test.js
import {SalRuntime} from '../../../src/sal-runtime.js';
const scan=SalRuntime.prototype.scan;let applied=0;
SalRuntime.prototype.scan=function(dt){
 if(!this.__mu24){this.__mu24=true;const b=this.model.networks.flatMap(n=>n.blocks).find(x=>x.path==='//RndPhysicalCompact/GATE_016');
  if(!b)throw Error('MU24 target missing');const p=b.inputs.find(x=>x.name==='AndIn4');if(p.channelInterface==='Deactivated')throw Error('MU24 already deactivated');p.channelInterface='Deactivated';applied++;}
 return scan.call(this,dt);};
process.on('exit',()=>console.log('# MU24 preload applied to runtimes: '+applied));
