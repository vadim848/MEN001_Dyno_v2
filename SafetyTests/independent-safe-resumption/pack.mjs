import fs from 'node:fs';
import crypto from 'node:crypto';
import {createGzip,createGunzip} from 'node:zlib';
import {pipeline} from 'node:stream/promises';
import {Writable} from 'node:stream';
const base=new URL('./',import.meta.url),rows=[];
async function digest(file,decompress=false){const h=crypto.createHash('sha256');let size=0;const sink=new Writable({write(chunk,_enc,cb){h.update(chunk);size+=chunk.length;cb();}});if(decompress)await pipeline(fs.createReadStream(file),createGunzip(),sink);else await pipeline(fs.createReadStream(file),sink);return{sha256:h.digest('hex'),bytes:size};}
for(const name of fs.readdirSync(base).filter(n=>n.endsWith('.json')&&fs.statSync(new URL(n,base)).size>100000)){
 const raw=new URL(name,base),zipped=new URL(name+'.gz',base);
 const original=await digest(raw);await pipeline(fs.createReadStream(raw),createGzip({level:9}),fs.createWriteStream(zipped));
 const recovered=await digest(zipped,true),compressed=await digest(zipped);
 if(original.sha256!==recovered.sha256||original.bytes!==recovered.bytes)throw Error('Gzip roundtrip mismatch '+name);
 rows.push({raw:name,...original,gzip:name+'.gz',compressedSha256:compressed.sha256,compressedBytes:compressed.bytes,roundTripVerified:true,rawLocalCopyRetained:true});
}
fs.writeFileSync(new URL('trace-index.json',base),JSON.stringify({files:rows,format:'Lossless gzip of complete per-scan JSON; raw originals retained locally. No sample reduction.'},null,2));
console.log(rows.map(r=>({name:r.raw,raw:r.bytes,gzip:r.compressedBytes})));
