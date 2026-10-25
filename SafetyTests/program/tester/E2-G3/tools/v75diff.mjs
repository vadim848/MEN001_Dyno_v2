const lib = process.argv[2];
const { loadSource } = await import('file:///' + lib + '/src/native-delta-model.mjs');
const { nativeDiff, counts } = await import('file:///' + lib + '/src/native-delta-diff.mjs');
const A = loadSource(process.argv[3]), B = loadSource(process.argv[4]);
const d = nativeDiff(A, B);
console.log(JSON.stringify({ countsA: counts(A), countsB: counts(B), atoms: d.atoms, orderChanged: d.order.length }, null, 1));
