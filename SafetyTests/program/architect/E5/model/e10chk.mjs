import {programFromModel} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/test/helpers/catalog-program.js';
import {load,kit} from './kit5.mjs';import {apply} from './e5.mjs';
const m=load();apply(m,kit(m));const P=programFromModel(m,{label:'d',salSha256:'x',sgvlSha256:'x'});
{const y=P.rnd();const g=y.green(550);const o=y.until(s=>!s.out_LV_C1,2000,'C1 OFF');const f=y.fall('out_LV_C1',g.p);const ff=y.fall('c1f',g.p);
 console.log('test-instant o',o-g.p,'actual C1 OFF',f-g.p,'FBK OFF',ff-g.p,'status at o',y.status());}
{const y=P.rnd();y.hold.in_LV_C1_FBK=true;const g=y.green(550);y.wait(1000);const f=y.fall('out_LV_C1',g.p);const e=y.first(s=>s.st.includes('EMG'),g.p);
 console.log('stuck before C1 OFF: EMG at C1 OFF+',e-f);}
