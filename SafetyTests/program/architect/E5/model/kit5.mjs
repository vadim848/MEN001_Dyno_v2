// E5 scratch kit: load E4 candidate (read-only) + E3/E4 kit helpers.
import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
export {kit} from '../../E4/model/kit.mjs';export {ext} from '../../E4/model/kit4.mjs';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/candidates/E4/native';
export function load(){return parseSalFile(root+'/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVL1.sgvl'});}
