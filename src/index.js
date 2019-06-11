#!/usr/bin/env node
import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

const rootPath = process.cwd();

const build = async (pkgJson) => {
  if (!pkgJson) {
    return;
  }
  const extensions = ['.mjs', '.js', '.jsx', '.ts', 'tsx'];
  const {
    source, main, module, dependencies = {}, peerDependencies = {},
  } = pkgJson;
  const inputOptions = {
    input: join(rootPath, source),
    plugins: [
      // TODO customize tsconfig
      typescript({
        tsconfigDefaults: {
          compilerOptions: {
            declaration: true,
          },
        },
      }),
      resolve({
        extensions,
      }),
      commonjs({
        extensions,
      }),
      babel({
        exclude: 'node_modules/**',
      }),
    ],
    external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)],
  };
  const outputOptions = [
    {
      format: 'cjs',
      file: join(rootPath, main),
    },
  ];

  if (module) {
    outputOptions.push({
      format: 'esm',
      file: join(rootPath, module),
    });
  }

  // create a bundle
  const bundle = await rollup(inputOptions);

  // generate code
  await Promise.all(
    outputOptions.map(option => bundle.write(option)),
  );
};


const pkgPath = join(rootPath, 'package.json');
const pkgJson = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : undefined;
build(pkgJson).catch(console.log);
