import {parseSalFile} from 'file:///C:/Users/user/source/repos/MEN001_Dyno_v2/SafetyTests/src/sal-parser.js';
const root='C:/Users/user/source/repos/MEN001_Dyno_v2/MEN001_Dyno/Safety_Dyno';
const m=parseSalFile(root+'/TwinSafeGroup1/TwinSafeGroup1.sal',{bindingMode:'current',sgvlPath:root+'/GVLs/GVL1.sgvl'});
const del=new Set(['Network3/FBRs2','Network3/FBOr3','Network3/FBOr4','Network4/FBDecouple1','Network9/FBAnd1','Network12/FBAnd12','Network12/FBAnd13','Network12/FBAnd14','Network1/FBAnd3','Network1/FBAnd9','Network1/FBAnd11','Network6/FBAnd10']);
const deact=new Set(["Network3/FBOr1.OrIn1","Network3/FBOr1.OrIn2","Network3/FBOr2.OrIn1","Network3/FBOr2.OrIn3","Network3/FBOr2.OrIn4","Network3/FBOr5.OrIn1","Network3/FBOr6.OrIn1","Network3/FBOr7.OrIn1","Network3/FBOr9.OrIn1","Network3/FBOr11.OrIn1","Network3/FBAnd1.AndIn3","Network1/FBOr1.OrIn1","Network1/FBOr5.OrIn1","Network1/FBOr8.OrIn1","Network1/FBOr10.OrIn1","Network1/FBOr14.OrIn1","Network1/FBOr17.OrIn1","Network1/FBOr18.OrIn1","Network12/FBOr2.OrIn2","Network3/FBDecouple2.DecIn2","Network1/FBOr12.OrIn2","Network6/FBAnd9.AndIn1"]);
const src={},tgt={};let fb=0,ports=0;
for(const n of m.networks)for(const b of n.blocks){const p=b.path.slice(2); if(n.name==='Network5'||del.has(p)) continue; fb++;
 for(const o of b.outputs)for(const g of o.globals){src[g.resolvedName]=(src[g.resolvedName]||0)+1;}
 for(const i of b.inputs){ if(deact.has(p+'.'+i.name)) continue; for(const g of i.globals){tgt[g.resolvedName]=(tgt[g.resolvedName]||0)+1;}
  // wires from deleted blocks
  for(const s of i.sources){const sb=s.replace(/^\/\//,'').split('/').slice(0,2).join('/'); if(sb.startsWith('Network5/')||del.has(sb)) console.log('DANGLING wire',p+'.'+i.name,'<-',s);}
 }}
const all=new Set([...Object.keys(src),...Object.keys(tgt)]);
console.log('FB',fb,'symbols',all.size);
console.log('no consumer:',[...all].filter(s=>!tgt[s]).join(','));
console.log('no source:',[...all].filter(s=>!src[s]).join(','));
console.log('multi-source:',Object.entries(src).filter(([k,v])=>v>1).map(x=>x.join(':')).join(','));
