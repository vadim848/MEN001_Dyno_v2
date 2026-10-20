import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';

const root = path.resolve(import.meta.dirname, '../independent-down-episode-owner/v2');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package-identity.json')));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const rows = [];
for (const file of manifest.files) {
  const filename = path.resolve(root, file.path);
  if (!filename.startsWith(root + path.sep)) throw Error('Outside proof package');
  const bytes = fs.readFileSync(filename);
  if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw Error('Package mismatch: ' + file.path);
  const row = { path: file.path, manifestMatch: true };
  if (file.path.endsWith('.gz')) {
    const raw = filename.slice(0, -3);
    if (!fs.existsSync(raw)) throw Error('Missing local raw proof: ' + raw);
    const hash = crypto.createHash('sha256');
    let size = 0;
    await pipeline(fs.createReadStream(filename), createGunzip(), new Writable({
      write(chunk, encoding, callback) { hash.update(chunk); size += chunk.length; callback(); }
    }));
    row.uncompressedSha256 = hash.digest('hex');
    row.rawMatch = row.uncompressedSha256 === sha(fs.readFileSync(raw));
    row.uncompressedBytes = size;
    if (!row.rawMatch) throw Error('Lossless mismatch: ' + file.path);
  }
  rows.push(row);
}
const result = { status: 'PASS', packageManifestSha256: sha(fs.readFileSync(path.join(root, 'package-identity.json'))), files: rows.length, archives: rows.filter(r => r.rawMatch).length, rows };
fs.writeFileSync(path.join(import.meta.dirname, 'PROOF_PACKAGE_INTEGRITY.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, files: result.files, archives: result.archives }));
