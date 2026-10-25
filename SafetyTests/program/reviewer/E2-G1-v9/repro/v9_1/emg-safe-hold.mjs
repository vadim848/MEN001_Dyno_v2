// Reviewer probe: steady Safe, in_Estop_PLC held H ms, removed, Restart -> stage trace (is the Step4->Step6 delay preserved behaviour?)
const L=await import('file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/e2-lifecycle.js');const {OFF}=L;
for(const H of [3000,6000,8000]){const x=L.cached('Safe');x.step(OFF,2100);const e=x.t+1;x.step({in_Estop_PLC:true},H);x.step({in_Estop_PLC:false},100);
 const st=[];const seen=n=>{const s=x.stageSet().join('+');if(st[st.length-1]?.s!==s)st.push({t:x.t-e,s});};x.log.filter(q=>q.t>=e).forEach(q=>{const s=q.stages.join('+');if(st[st.length-1]?.s!==s)st.push({t:q.t-e,s});});
 L.restart(x);for(let i=0;i<6000;i++){x.step();seen();}console.log(JSON.stringify({H,restartAt:H+100,stages:st}));}
