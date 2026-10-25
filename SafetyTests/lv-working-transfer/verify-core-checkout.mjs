import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../..');
const crlf = new Set(['sal-runtime.js', 'sal-parser.js', 'estop-native-pairs.js']);
const names = [...crlf, 'observed-samples.js', 'sal-binding-validator.js', 'boot-preflight.js', 'boot-source-inventory.js'];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const rows = names.map(name => {
  const file = 'SafetyTests/src/' + name;
  const original = execFileSync('git', ['show', 'HEAD:' + file], { cwd: root });
  const projected = crlf.has(name) ? Buffer.from(original.toString('utf8').replace(/\r?\n/g, '\r\n')) : original;
  const actual = fs.readFileSync(path.join(root, file));
  return { path: file, proposedAttribute: crlf.has(name) ? 'text eol=crlf' : '-text', workingSha256: sha(actual), projectedCheckoutSha256: sha(projected), match: projected.equals(actual) };
});
const result = { status: rows.every(r => r.match) ? 'PASS' : 'HOLD', note: 'Read-only Git blob projection; no protected implementation bytes were written.', rows };
fs.writeFileSync(path.join(import.meta.dirname, 'CORE_CHECKOUT_PROJECTION.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ status: result.status, files: rows.length }));
