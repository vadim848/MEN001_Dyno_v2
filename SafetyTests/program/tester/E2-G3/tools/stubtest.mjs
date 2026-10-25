const nm = (a) => typeof a === 'string' ? a : (a && a.name) || '';
const reg = (name) => { process.stdout.write(JSON.stringify({ file: process.env.STUB_FILE, name }) + '\n'); };
function test(a, b, c) { reg(nm(a)); const r = Promise.resolve(); return r; }
test.skip = test; test.todo = test; test.only = test;
const describe = (a, b, c) => { const fn = typeof b === 'function' ? b : c; reg('[suite] ' + nm(a)); };
const noop = () => {};
export default test; export { test, test as it, describe, describe as suite, noop as before, noop as after, noop as beforeEach, noop as afterEach };
export const mock = { fn: () => noop, method: noop, timers: { enable: noop, tick: noop, reset: noop } };
