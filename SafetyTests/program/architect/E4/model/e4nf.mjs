import {apply as a} from './e4.mjs';
export function apply(m,k){a(m,k);m.variables.find(v=>v.name==='STS_FAULT').name='STS_PLCERR_TMP';}
