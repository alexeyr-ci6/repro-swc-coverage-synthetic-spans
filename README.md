# SWC coverage metadata for synthetic TypeScript nodes

A single enum demonstrates the problem without a bundler or any other Wasm plugins.

```sh
npm ci
npm test
```

SWC lowers the enum before the coverage plugin's default pass. Generated helpers have synthetic spans, and their coverage metadata contains line 0. Istanbul source-map remapping rejects such positions (`line must be greater than 0`). The script executes only the compiled enum in an isolated context and reports every zero-valued line field.

Expected: synthetic nodes with no source location should be skipped, or otherwise produce coverage compatible with Istanbul's one-based line positions.

`npm test` asserts that expectation and currently fails if line-zero metadata is emitted. No application code is involved.

## Why runPluginFirst is not a general workaround

```sh
npm run overload
```

This companion case moves instrumentation before TypeScript lowering, but a bodyless overload signature then makes the coverage plugin panic with `Unable to process function body node type`. The overload has a normal implementation; it is valid TypeScript. This is additional context for the ordering limitation, not needed for the enum reproduction.

Versions are pinned in package-lock.json. Configuration: @swc/core 1.16.18, swc-plugin-coverage-instrument 0.0.33, Node.js 24 on Linux.
