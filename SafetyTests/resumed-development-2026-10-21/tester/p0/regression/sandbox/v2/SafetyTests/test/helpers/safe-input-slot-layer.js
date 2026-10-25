import assert from 'node:assert/strict';import fs from 'node:fs';
export const slotLayer=JSON.parse(fs.readFileSync(new URL('../../SAFE_INPUT_SLOT_REPAIR_LAYER.json',import.meta.url)));assert.equal(slotLayer.version,'safe-input-slot-repair-3-v1');assert.equal(slotLayer.pairs.length,3);
const moves=new Map(slotLayer.pairs.flatMap(([a,z])=>[[a,z],[z,a]]));export const expectedTarget=p=>moves.get(p)??p;
// Expected-only composition. Never edits actual parsed models/audits/sources.
export function composeNetworkExpected(history){const e=structuredClone(history);e.preservedLocalWires=e.preservedLocalWires.map(w=>({...w,to:expectedTarget(w.to)}));e.baselineEffectiveEdges=e.baselineEffectiveEdges.map(w=>{const[f,t]=w.split('->');return f+'->'+expectedTarget(t);}).sort();e.newSymbols=e.newSymbols.map(v=>({...v,targets:v.targets.map(expectedTarget)}));return e;}
export function expectedContact(p){return slotLayer.pairs.some(([a])=>a===p.path)?'Make Contact (NO)':slotLayer.pairs.some(([,z])=>z===p.path)?'Break Contact (NC)':p.deactivate1;}
export function expectedInputs(block){return block.inputs.map(p=>{const otherPath=expectedTarget(p.path),q=block.inputs.find(x=>x.path===otherPath);return q&&q!==p?{...p,deactivate1:q.deactivate1,sources:[...q.sources],targets:[...q.targets],globals:structuredClone(q.globals)}:p;});}
