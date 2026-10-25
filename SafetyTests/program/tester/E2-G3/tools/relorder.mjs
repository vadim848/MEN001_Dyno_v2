const lib = process.argv[2];
const { loadSource } = await import('file:///' + lib + '/src/native-delta-model.mjs');
const A = loadSource(process.argv[3]).sal, B = loadSource(process.argv[4]).sal;
const seq = (S, keep) => [...S.blocks.values()].filter(b => keep.has(b.attr.Id)).sort((x, y) => +x.attr.orderOfExecution - +y.attr.orderOfExecution).map(b => b.path);
const common = new Set([...A.blocks.keys()].filter(k => B.blocks.has(k)));
const a = seq(A, common), b = seq(B, common);
console.log('retained', common.size, 'relative order identical:', JSON.stringify(a) === JSON.stringify(b));
const ob = [...B.blocks.values()].map(x => +x.attr.orderOfExecution).sort((p, q) => p - q);
console.log('B order is 1..N permutation:', ob.every((v, i) => v === i + 1));
