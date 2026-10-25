// Q62 scratch kit: base = candidates/E6v/native (SAL 92093190..., read-only) + E4 kit helpers.
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
export {kit} from '../../E4/model/kit.mjs';
export const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/E6v/native';
export function load(){return parseSalFile(root+'/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVL1.sgvl'});}
