import { DEFAULT_EXTENSIONS } from '@babel/core';
import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import { join, extname } from 'path';
import { existsSync, readFileSync } from 'fs';

const defaultEntry = (rootPath, source) => {
  if (source) {
    return join(rootPath, source);
  }
  const srcIndexJS = join(rootPath, 'src/index.js');
  const srcIndexJSX = join(rootPath, 'src/index.jsx');
  const srcIndexTs = join(rootPath, 'src/index.ts');
  const srcIndexTSX = join(rootPath, 'src/index.tsx');
  const res = [srcIndexJS, srcIndexJSX, srcIndexTs, srcIndexTSX].find(existsSync);
  if (res) {
    return res;
  }
  throw new Error('Please set source in package.json');
};

const isTsFile = p => (extname(p) === '.ts') || (extname(p) === '.tsx');

const extensions = [...DEFAULT_EXTENSIONS, '.ts', '.tsx'];

const build = async (rootPath) => {
  const pkgPath = join(rootPath, 'package.json');
  const pkgJson = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : undefined;
  if (!pkgJson) {
    return;
  }
  const {
    source, main, module, umd, dependencies = {}, peerDependencies = {},
  } = pkgJson;
  const entry = defaultEntry(rootPath, source);
  const inputOptions = {
    input: entry,
    plugins: [
      isTsFile(entry) && typescript({
        tsconfigDefaults: {
          compilerOptions: {
            declaration: true,
            jsx: 'react',
          },
        },
        include: ['*.ts+(|x)', '**/*.ts+(|x)'],
        exclude: ['*.d.ts', '**/*.d.ts'],
        tsconfigOverride: {
          compilerOptions: {
            target: 'esnext',
          },
        },
      }),
      babel({
        exclude: 'node_modules/**',
        presets: [
          [require.resolve('@babel/preset-env'), { modules: false }],
          require.resolve('@babel/preset-react'),
        ],
        plugins: [
          require.resolve('babel-plugin-transform-async-to-promises'),
          [
            require.resolve('@babel/plugin-proposal-class-properties'),
            { loose: true },
          ],
        ],
        // https://github.com/rollup/rollup-plugin-babel/issues/274#issuecomment-441611857
        extensions,
      }),
      resolve({
        mainFields: ['module', 'jsnext', 'main'],
      }),
      commonjs({
        include: /\/node_modules\//,
      }),
      json(),
    ],
    external: (id) => {
      const externals = [...Object.keys(dependencies), ...Object.keys(peerDependencies)];
      const externalPattern = new RegExp(`^(${externals.join('|')})($|/)`);
      return externalPattern.test(id);
    },
  };
  const outputOptions = [
    {
      format: 'cjs',
      file: join(rootPath, main || 'dist/index.js'),
    },
  ];

  if (module) {
    outputOptions.push({
      format: 'esm',
      file: join(rootPath, module),
    });
  }
  if (umd) {
    outputOptions.push({
      format: 'umd',
      file: join(rootPath, umd),
    });
  }

  // create a bundle
  const bundle = await rollup(inputOptions);

  // generate code
  await Promise.all(
    outputOptions.map(option => bundle.write(option)),
  );
};

export default build;
