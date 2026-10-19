import fs from "node:fs";
export const compact=JSON.parse(fs.readFileSync(new URL("../../03B_COMPACT_RELEASE_FIX_PLAN.json",import.meta.url)));
export const movedPath=path=>{const b=compact.blocks.find(b=>b.moveExisting===path);return b?"//"+compact.network+"/"+b.name:path;};
export const expectedOrder=path=>compact.sequence.find(s=>s.oldPath===path)?.newOrder??compact.blocks.find(b=>b.moveExisting===path)?.order;
export function removeCompactGvl(xml){
 const ids=new Set(compact.sgvlDeclarations.map(d=>d.id));
 let result=xml.replace(/<Variable\b[^>]*Id="([^"]+)"[^>]*>[\s\S]*?<\/Variable>/g,(m,id)=>ids.has(id)?"":m);
 for(const u of compact.existingSgvlTargetUsageAdditions)result=result.replace(new RegExp('<FbPortUsage\\b[^>]*>\\s*<ModelElementId>'+u.targetPortId+'<\\/ModelElementId>\\s*<\\/FbPortUsage>','g'),"");
 return result;
}
