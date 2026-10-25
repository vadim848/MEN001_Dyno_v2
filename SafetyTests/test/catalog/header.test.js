// S1 catalog report header: target path and SHA256 (contract S1S2_PLAN.md).
import test from 'node:test';
import {program} from '../helpers/catalog-program.js';
test('[HDR] catalog target identity',t=>{const P=program();const i=P.identity;
 t.diagnostic(`CATALOG target ${i.dir}`);t.diagnostic(`SAL ${i.sal} sha256=${i.salSha256}`);t.diagnostic(`SGVL ${i.sgvl} sha256=${i.sgvlSha256}`);
 t.diagnostic(`blocks=${i.blocks} status=${i.statusMode} stages=${i.stages} CATALOG_STAGES=${process.env.CATALOG_STAGES??'(all)'}`);});
