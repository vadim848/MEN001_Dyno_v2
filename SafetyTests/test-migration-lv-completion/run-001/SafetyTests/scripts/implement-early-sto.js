// One-shot source-bound implementation of the approved minimal-order package.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateSalBindings} from '../src/sal-binding-validator.js';
const file=new URL('../../MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',import.meta.url);
const gvl=fs.readFileSync(new URL('../../MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',import.meta.url),'utf8');
let xml=fs.readFileSync(file,'utf8');const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const sourceSha256='dd9fd938fd5493795a7eea7b29cb027d7e994e2a55e2ad02d2ca66cb4beb6923';
const sourceNormalizedSha256=hash(xml.replaceAll('\r\n','\n'));
if(hash(xml)!==sourceSha256)throw Error('Unexpected source baseline');
if(validateSalBindings(xml,gvl).status!=='PASS')throw Error('Baseline full binding audit failed');
const ids={};function id(key){if(!ids[key]){const h=hash('MEN001/EARLY_STO/minimal-order/v1/'+key);ids[key]=`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;}return ids[key];}
const network=xml.match(/<Network\b[^>]*name="Network1"[\s\S]*?<\/Network>/)[0];
const template=network.match(/<networkHasFunctionBlocks\b[^>]*>\s*<fBAnd\b[^>]*name="FBAndLvSetPermit"[\s\S]*?<\/fBAnd>\s*<\/networkHasFunctionBlocks>/)[0];
// Retain all253 old relative positions, inserting guards immediately before RS3/4.
xml=xml.replace(/orderOfExecution="(\d+)"/g,(_,n)=>`orderOfExecution="${+n<10?+n:+n===10?11:+n+2}"`);
for(const target of ['//Network1/FBRs3/Set','//Network1/FBRs4/Set']){
 const oldSource=target.includes('FBRs3')?'//Network1/FBOr8/OrOut':'//Network1/FBOr10/OrOut';
 const re=new RegExp('<wiredLink\\b[^>]*>\\s*<(?:inPortMoniker name="'+target+'"|outPortMoniker name="'+oldSource+'")\\s*\\/>\\s*<\\/wiredLink>','g');
 const matches=[...xml.matchAll(re)];if(matches.length!==1)throw Error('Old canonical edge count '+target);xml=xml.replace(re,'');
}
xml=xml.replace(/<sourceFunctionBlockPorts>\s*<\/sourceFunctionBlockPorts>/g,'');
// The two deleted serialized wires leave indentation-only blank lines.
xml=xml.replace(/(<targetFunctionBlockPorts>\r?\n)[ \t]+\r?\n(?=\s*<\/targetFunctionBlockPorts>)/g,'$1\r\n');
function edge(source,target){const wire=`<wiredLink Id="${id('wire:'+source+'->'+target)}"><inPortMoniker name="${target}" /></wiredLink>`;
 const name=source.slice(source.lastIndexOf('/')+1),block=source.slice(0,source.lastIndexOf('/')).split('/').at(-1);
 const net=source.split('/')[2],nre=new RegExp('<Network\\b[^>]*name="'+net+'"[\\s\\S]*?<\\/Network>');
 let n=xml.match(nre)[0];const bre=new RegExp('<fB\\w+\\b[^>]*name="'+block+'"[\\s\\S]*?<\\/fB\\w+>');let b=n.match(bre)[0];
 const pre=new RegExp('<outPort\\b[^>]*name="'+name+'"[^>]*(?:\\/>|>[\\s\\S]*?<\\/outPort>)');let p=b.match(pre)[0],q;
 if(p.endsWith('/>'))q=p.slice(0,-2)+`><targetFunctionBlockPorts>${wire}</targetFunctionBlockPorts></outPort>`;
 else if(p.includes('<targetFunctionBlockPorts>'))q=p.replace('</targetFunctionBlockPorts>',wire+'</targetFunctionBlockPorts>');
 else q=p.replace('</outPort>',`<targetFunctionBlockPorts>${wire}</targetFunctionBlockPorts></outPort>`);
 const next=b.replace(p,q);xml=xml.replace(n,n.replace(b,next));
}
for(const drive of [1,2]){
 const name=`FBAndSto${drive}SetPermit`,rs=`FBRs${drive+2}`,or=`FBOr${drive===1?8:10}`;
 let b=template.replaceAll('FBAndLvSetPermit',name).replace(/orderOfExecution="3"/,`orderOfExecution="${drive===1?10:12}"`)
  .replaceAll('//Network1/FBRs1/Set',`//Network1/${rs}/Set`).replace(/\bId="([^"]+)"/g,(_,old)=>`Id="${id(name+':clone:'+old)}"`);
 const marker='        </functionBlocks>';
 const first=xml.indexOf(marker);if(first<0)throw Error('Network1 end');xml=xml.slice(0,first)+b+'\r\n'+xml.slice(first);
 edge(`//Network1/${or}/OrOut`,`//Network1/${name}/AndIn1`);
 edge('//Network1/FBAndLvCurrentPermit/AndOut',`//Network1/${name}/AndIn2`);
 edge('//Network1/FBAnd1/AndOut',`//Network1/${name}/AndIn4`);
 // Clone the native alias logical-fanout wrapper, preserving its hardware descriptor.
 const variable=xml.match(/<variable\b[^>]*name="in_Mentee_EStop"[\s\S]*?<\/variable>/)[0];
 const usage=variable.match(/<variableUsagesHasUsages\b[^>]*>\s*<fbPortUsage\b[^>]*>\s*<functionBlockPort>\s*<fbPortUsageReferencesFunctionBlockPort\b[^>]*>\s*<inPortMoniker name="\/\/Network1\/FBAndLvSetPermit\/AndIn3"\s*\/>[\s\S]*?<\/variableUsagesHasUsages>/)[0];
 const extra=usage.replaceAll('FBAndLvSetPermit',name).replace(/\bId="([^"]+)"/g,(_,old)=>`Id="${id(name+':usage:'+old)}"`);
 const targets=variable.match(/<targetUsages>[\s\S]*?<\/targetUsages>/)[0];
 xml=xml.replace(variable,variable.replace(targets,targets.replace('</usages>',extra+'\r\n</usages>')));
 const portId=drive===1?'270d8d89-2f99-4e2b-84ac-f4ecadcd4d3c':'45bbd24a-adec-4b7e-bfb9-c31d26a9c676';
 xml=xml.replace(new RegExp('(<inPort Id="'+portId+'"[^>]*channelInterface=")Deactivated("[^>]*\\/>)'), '$1Activated" deactivate1="Break Contact (NC)$2');
 edge('//RndPhysicalCompact/STATE_SU/RsOut',`//Network1/${or}/OrIn3`);
}
const audit=validateSalBindings(xml,gvl);if(audit.status!=='PASS')throw Error(JSON.stringify(audit.errors));
fs.writeFileSync(file,xml);
fs.writeFileSync(new URL('../EARLY_STO_NATIVE_MANIFEST.json',import.meta.url),JSON.stringify({sourceSha256,sourceNormalizedSha256,resultSha256:hash(xml),sgvlSha256:hash(gvl),guidNamespace:'MEN001/EARLY_STO/minimal-order/v1/',ids,orders:{guard1:10,rs3:11,guard2:12,rs4:13,oldBelow10:'unchanged',old10:11,oldAbove10:'old+2'},audit})+'\n');
console.log('Full binding audit PASS; SAL SHA256 '+hash(xml));
