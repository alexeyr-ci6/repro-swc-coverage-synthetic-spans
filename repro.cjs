const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('@swc/core');

const overload = process.argv.includes('--overload');
const source = overload ?
  'export function identity(value: string): string;\nexport function identity(value: string) { return value; }' :
  'export enum State { Ready, Done }';
const filename = path.join(__dirname, 'input.ts');
const { code } = transformSync(source, {
  filename, configFile: false, swcrc: false,
  jsc: {
    parser: { syntax: 'typescript' }, target: 'es2022',
    experimental: {
      plugins: [[require.resolve('swc-plugin-coverage-instrument'), {}]],
      ...(overload ? { runPluginFirst: true } : {}),
    },
  },
  module: { type: 'commonjs' },
});
const context = vm.createContext({ exports: {} });
vm.runInContext(code, context);
const coverage = context.__coverage__[filename];
assert.ok(coverage, 'Expected coverage instrumentation');
const zeroLines = [];
function visit(value, location) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (key === 'line' && item === 0) zeroLines.push(`${location}.${key}`);
    visit(item, `${location}.${key}`);
  }
}
visit({ statementMap: coverage.statementMap, fnMap: coverage.fnMap, branchMap: coverage.branchMap }, 'coverage');
console.log(JSON.stringify({ source, zeroLines }, null, 2));
assert.equal(zeroLines.length, 0, 'Synthetic nodes should not produce line-zero Istanbul locations');
