// S6 scratch kit: load canonical E5 copy candidates/E5/native (SHA 4c4be64b..., read-only) + E4 kit helpers.
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
export {kit} from '../../E4/model/kit.mjs';
export const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/E5/native';
export function load(){return parseSalFile(root+'/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVL1.sgvl'});}
