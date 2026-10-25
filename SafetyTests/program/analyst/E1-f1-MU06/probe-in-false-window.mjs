// v2-analyst E1-f1-MU06 evidence probe (not a test suite; tester owns tests).
// Usage: MEN001_F1_ROOT=<root containing MEN001_Dyno/Safety_Dyno> node probe-in-false-window.mjs
// Roots used: F1 native copied into layout; MU06 from tester make-mutants.mjs (SAL a10cdfde...).
const {createSafeRunFixture}=await import(new URL('../../tester/E1-f1/runners/run-source.js',import.meta.url));
const down=['runResetSto1','runResetSto2','runDischarge','runResetHv'];
const rows=[];
function prep(){const x=createSafeRunFixture('Run');x.sample({in_Reset_PB:false,in_Relase_Door_PB:false});x.advance(2100);return x;}
function summary(x,p){const set=x.frames.find(f=>f.timeMs>=p&&f.consumed.ownerConsumedSet),d=x.frames.find(f=>f.timeMs>=p&&f.signals.runPhysical);
 return {ownerSetConsumedMs:set?set.timeMs-p:null,runPhysicalMs:d?d.timeMs-p:null,downRequestAny:x.frames.some(f=>f.timeMs>=p&&down.some(k=>f.signals[k])),EStopOk:x.r.get('b_EStop_Ok')};}
{const x=prep();const p=x.sample({in_Reset_PB:true});x.advance(600);rows.push({case:'nominal',...summary(x,p)});}
{const x=prep();x.sample({in_False_SI2_CH8:true});x.advance(10);const p=x.sample({in_Reset_PB:true});x.advance(600);x.sample({in_False_SI2_CH8:false});x.advance(900);rows.push({case:'held TRUE before press, cleared at +601 while green held to +1500',...summary(x,p)});}
for(let off=495;off<=503;off++)for(const len of [1,2]){const x=prep();const p=x.sample({in_Reset_PB:true});while(x.frames.at(-1).timeMs<p+off-1)x.sample();const t=x.sample({in_False_SI2_CH8:true});for(let i=1;i<len;i++)x.sample();x.sample({in_False_SI2_CH8:false});x.advance(100);rows.push({case:`pulse at +${t-p} len ${len} scan`,...summary(x,p)});}
console.log(JSON.stringify({root:process.env.MEN001_F1_ROOT,rows},null,1));
