import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../..');
const accepted = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'CORE_CHECKOUT_PROJECTION.json'))).rows;
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const rows = accepted.map(record => {
  const indexed = execFileSync('git', ['show', ':' + record.path], { cwd: root });
  const actual = fs.readFileSync(path.join(root, record.path));
  const attributes = execFileSync('git', ['check-attr', 'text', '--', record.path], { cwd: root, encoding: 'utf8' }).trim();
  return { path: record.path, acceptedSha256: record.workingSha256, workingSha256: sha(actual), indexedSha256: sha(indexed), attributes,
    match: sha(actual) === record.workingSha256 && sha(indexed) === record.workingSha256 && attributes.endsWith(': text: unset') };
});
const result = { status: rows.every(r => r.match) ? 'PASS' : 'HOLD', note: 'No implementation byte writes; exact reviewed bytes preserved in Git index.', rows };
fs.writeFileSync(path.join(import.meta.dirname, 'INDEX_BYTE_INTEGRITY.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, files: rows.length }));
if (result.status !== 'PASS') process.exitCode = 1;
