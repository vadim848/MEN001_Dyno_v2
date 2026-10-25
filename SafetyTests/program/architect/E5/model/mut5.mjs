// Architect self-check mutants for E5/E6 guards (scratch): deactivate one input / shift a timer, run its killing row.
import {programFromModel,runScenario,SCENARIOS} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
for(const l of ['k','c','e','u','d','h','w','p','g'])await import(`file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/catalog/lib/${l}.js`);
import {load,kit} from './kit5.mjs';import {apply} from './e5.mjs';
const R='//RndPhysicalCompact/';
const MU=[[R+'GATE_SG_SET/OrIn4','W-01'],['//Network6/SU_ABORT_CAUSE/OrIn4','W-02'],['//Network1/CFG_EX_OR/OrIn2','G-07'],
 ['//Network1/FBAnd1/AndIn5','E-09'],[R+'WD_EMG/OrIn2','E-09'],[R+'WD_EMG/OrIn4','E-10'],[R+'WD_EMG/OrIn1','E-09'],[R+'WD_EMG/OrIn3','E-10'],
 [R+'WDC2_FAIL_SET/AndIn3','E-09'],[R+'WDC2_OK_SET/AndIn3','W-02'],[R+'WDC2_SEEN_SET/AndIn1','E-10'],
 [R+'SF_SET/OrIn5','H-02'],[R+'SF_SET/OrIn7','H-05'],[R+'SF_SET/OrIn6','D-09'],[R+'SF_SET/OrIn3','W-09'],[R+'SF_SET/OrIn4','W-09'],
 [R+'SF_ACK/AndIn3','W-09'],[R+'SF_ACK/AndIn4','K-01'],[R+'SF_ACK/AndIn2','W-06'],[R+'SF_ACKC/Set','W-06'],
 ['//Network2/FBAnd4/AndIn4','W-06'],[R+'SU_SET_G/AndIn2','W-08'],['//Network1/PA_CFG/AndIn8','G-01'],['//Network1/PF_OR/OrIn2','W-10'],
 [R+'WDC1_SPONT/AndIn4','E-06'],[R+'WDC2_SPONT/AndIn4','W-09'],
 ['T:'+R+'WDC1_WIN=0.6','W-01'],['T:'+R+'WDC2_WIN=0.6','W-02'],['T:'+R+'WDC2_OFF=0.6','E-10'],['T:'+R+'WDH1_T=29','W-04'],['T:'+R+'WDH2_T=29','W-03']];
const only=process.argv[2];
for(const [pp,id] of MU){if(only&&!pp.includes(only))continue;const m=load();const k=kit(m);apply(m,k);
 if(pp.startsWith('T:')){const [p,v]=pp.slice(2).split('=');k.B(p).parameters[0].timing=v;}else k.off(pp);
 const P=programFromModel(m,{label:'mu',salSha256:'x',sgvlSha256:'x'});const r=runScenario(id,P);
 console.log(r.fails.length?'KILLED':'SURVIVED',pp,id,r.fails.join(' | ').slice(0,160));}
void SCENARIOS;
