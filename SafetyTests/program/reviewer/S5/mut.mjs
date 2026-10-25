// v2-reviewer S5: survivors of architect E5 PLAN §6 not in [M]; each mutant run against W-*, E-09/10, G-07, D-09, H-0x
import {program,programFromModel,runScenario,SCENARIOS} from '../../../test/helpers/catalog-program.js';
for(const l of 'k c e u d h w p g'.split(' '))await import(`../../../test/catalog/lib/${l}.js`);
const P=program();
const MUTS={
 'WDC1_SPONT.AndIn4(scope)':['//RndPhysicalCompact/WDC1_SPONT/AndIn4'],
 'WDC2_SPONT.AndIn4(scope)':['//RndPhysicalCompact/WDC2_SPONT/AndIn4'],
 'WDC2_SEEN_SET.AndIn1':['//RndPhysicalCompact/WDC2_SEEN_SET/AndIn1'],
 'WDC1_SEEN_SET.AndIn1':['//RndPhysicalCompact/WDC1_SEEN_SET/AndIn1'],
 'WDC2_FAIL_SET.AndIn3':['//RndPhysicalCompact/WDC2_FAIL_SET/AndIn3'],
 'WDC2_OK_SET.AndIn3':['//RndPhysicalCompact/WDC2_OK_SET/AndIn3'],
 'SF_ACK.AndIn3':['//RndPhysicalCompact/SF_ACK/AndIn3'],
 'SF_SET.OrIn1(roll S12)':['//RndPhysicalCompact/SF_SET/OrIn1'],
 'SF_SET.OrIn2(roll SU)':['//RndPhysicalCompact/SF_SET/OrIn2'],
 'BA_SET_G.AndIn2':['//RndPhysicalCompact/BA_SET_G/AndIn2'],
 'SU_SET_G.AndIn2':['//RndPhysicalCompact/SU_SET_G/AndIn2'],
 'WD_FAIL_ANY.OrIn1':['//RndPhysicalCompact/WD_FAIL_ANY/OrIn1'],
};
const only=process.argv[2];const RX=/^(W-|E-09|E-10|G-07|D-09|H-0)/;const ids=[...SCENARIOS.keys()].filter(i=>RX.test(i));
const base=new Map(ids.map(id=>[id,runScenario(id,P).fails.length]));
console.log('base fails:',ids.filter(i=>base.get(i)).join(',')||'none');
for(const [k,ports] of Object.entries(MUTS)){if(only&&!k.startsWith(only))continue;
 const m=structuredClone(P.m);const pm=new Map(m.networks.flatMap(n=>n.blocks.flatMap(b=>b.inputs.map(p=>[p.path,p]))));
 for(const p of ports){const e=pm.get(p);if(!e||e.channelInterface!=='Activated')throw Error('locator '+p);e.channelInterface='Deactivated';}
 const Pm=programFromModel(m,{...P.identity,label:'mutant'},{});
 const k2=ids.filter(id=>!base.get(id)&&runScenario(id,Pm).fails.length);
 console.log(`${k}: ${k2.length?'KILLED by '+k2.join(','):'SURVIVED (scoped scenarios)'}`);}
