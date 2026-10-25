// Sensitivity probe (tester only): make the False operand non-neutral at FALSE by flipping the contact of the
// given port (env PORT, default //Network1/FBAnd1/AndIn2) to Break Contact (NC) (idempotent: parsed models may be shared) before the first scan of every runtime.
import {SalRuntime} from '../../../src/sal-runtime.js';
const target=process.env.PORT||'//Network1/FBAnd1/AndIn2';const scan=SalRuntime.prototype.scan;let n=0;
SalRuntime.prototype.scan=function(dt){if(!this.__probe){this.__probe=true;for(const b of this.model.networks.flatMap(x=>x.blocks))for(const p of b.inputs)if(p.path===target&&!p.__probed){if(p.deactivate1!=='Make Contact (NO)')throw Error('probe expects NO');p.deactivate1='Break Contact (NC)';p.__probed=true;n++;}}return scan.call(this,dt);};
process.on('exit',()=>console.log('# probe flipped '+target+' in runtimes: '+n));
