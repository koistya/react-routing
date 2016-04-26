/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const del = require('del');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const pkg = require('../package.json');

let promise = Promise.resolve();

// Clean up the output directory
promise = promise.then(() => del(['dist/*']));

// Compile source code into a distributable format with Babel
for (const format of ['es6', 'cjs', 'umd']) {
  promise = promise.then(() => rollup.rollup({
    entry: 'src/index.js',
    external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)),
    plugins: [babel(Object.assign(pkg.babel, {
      babelrc: false,
      exclude: 'node_modules/**',
      runtimeHelpers: true,
      presets: pkg.babel.presets.map(x => (x === 'es2015' ? 'es2015-rollup' : x)),
    }))],
  }).then(bundle => bundle.write({
    dest: `dist/${format === 'cjs' ? 'index' : `index.${format}`}.js`,
    format,
    sourceMap: false,
    moduleName: format === 'umd' ? 'router' : undefined,
  })));

  promise = promise.then(() => rollup.rollup({
    entry: 'src/react/createRouter.browser.js',
    external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)),
    plugins: [babel(Object.assign(pkg.babel, {
      babelrc: false,
      exclude: 'node_modules/**',
      runtimeHelpers: true,
      presets: pkg.babel.presets.map(x => (x === 'es2015' ? 'es2015-rollup' : x)),
    }))],
  }).then(bundle => bundle.write({
    dest: `dist/react/${format === 'cjs' ? 'createRouter.browser' : `createRouter.browser.${format}`}.js`,
    format,
    sourceMap: false,
    moduleName: format === 'umd' ? 'createRouter' : undefined,
  })));

  if (format === 'umd') {
    continue;
  }

  promise = promise.then(() => rollup.rollup({
    entry: 'src/react/createRouter.node.js',
    external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)),
    plugins: [babel(Object.assign(pkg.babel, {
      babelrc: false,
      exclude: 'node_modules/**',
      runtimeHelpers: true,
      presets: pkg.babel.presets.map(x => (x === 'es2015' ? 'node5' : x)),
    }))],
  }).then(bundle => bundle.write({
    dest: `dist/react/${format === 'cjs' ? 'createRouter.node' : `createRouter.node.${format}`}.js`,
    format,
    sourceMap: false,
  })));
}

// Copy package.json and LICENSE.txt
promise = promise.then(() => {
  delete pkg.private;
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.eslintConfig;
  delete pkg.babel;
  fs.writeFileSync('dist/package.json',
    JSON.stringify(pkg, null, '  '), 'utf-8');
  fs.writeFileSync('dist/LICENSE.txt',
    fs.readFileSync('LICENSE.txt', 'utf-8'), 'utf-8');
  fs.writeFileSync('dist/react/package.json',
    fs.readFileSync('src/react/package.json', 'utf-8'), 'utf-8');
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console
