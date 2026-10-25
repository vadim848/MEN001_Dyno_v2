// make a mutant root (MEN001_Dyno/Safety_Dyno only) from a candidate root and a plan mutation id
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const [snap, root, planPath, id, dest] = process.argv.slice(2);
const { applyMutation, verifyMutation } = await import(pathToFileURL(path.join(snap, 'src/sal-mutations.js')).href);
const SAL = 'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal', SGVL = 'MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl';
fs.cpSync(path.join(root, 'MEN001_Dyno'), path.join(dest, 'MEN001_Dyno'), { recursive: true });
const m = JSON.parse(fs.readFileSync(planPath, 'utf8')).mutations.find(x => x.id === id);
const xml = fs.readFileSync(path.join(root, SAL), 'utf8'), sg = fs.readFileSync(path.join(root, SGVL), 'utf8');
const r = applyMutation(xml, m, { sgvlXml: sg }); verifyMutation(xml, r.xml, r.change, { sgvlXml: sg, mutantSgvlXml: r.sgvl });
fs.writeFileSync(path.join(dest, SAL), r.xml); if (r.sgvl !== undefined) fs.writeFileSync(path.join(dest, SGVL), r.sgvl);
console.log('ok', id);
