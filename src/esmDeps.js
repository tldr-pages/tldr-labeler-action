// @actions/core and @actions/github are published as ESM-only packages.
// Written in plain JS (not compiled by TypeScript) because ts-jest, under
// this project's `"module": "commonjs"` tsconfig, downlevels `await
// import(...)` into `Promise.resolve().then(() => require(...))` - which
// still throws on an ESM-only package. Node's own module loader does not
// rewrite dynamic import() this way, so keeping it out of TS's hands (and
// letting esbuild bundle this file like any other) makes it actually work.

module.exports.loadCore = () => import('@actions/core');
module.exports.loadGithub = () => import('@actions/github');
