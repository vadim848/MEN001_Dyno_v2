import * as L from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/e2-lifecycle.js';
for(const safetyRun of [false,true]){
 const x=L.create({safetyRun});L.boot(x);
 const tl=[];let prev='';x.listeners.push(s=>{const k=s.stages.join('+');if(k!==prev){tl.push(`${s.t}:${k||'none'}`);prev=k;}});
 try{L.toRnD(x);L.toRun(x);}catch(e){console.log('ERR',e.message);}
 console.log('safetyRun',safetyRun,'mode',L.LV_MODE,'Run stages',x.stageSet(),'\n ',tl.join(' '));
 // in_Estop_PLC in Run then Restart: where does it end?
 x.step({in_Estop_PLC:true},10000);x.step({in_Estop_PLC:false},100);x.step({in_Reset_PB:true},100);x.step({in_Reset_PB:false},3000);
 console.log(' after EStop+Restart stages',x.stageSet(),'ok',x.get('b_EStop_Ok'),'outs',JSON.stringify(x.snap().out));
}
