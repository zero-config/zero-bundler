import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { join } from 'path';
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

const build = async (rootPath) => {
  const pkgPath = join(rootPath, 'package.json');
  const pkgJson = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : undefined;
  if (!pkgJson) {
    return;
  }
  const extensions = ['.mjs', '.js', '.jsx', '.ts', 'tsx'];
  const {
    source, main, module, umd, dependencies = {}, peerDependencies = {},
  } = pkgJson;
  const inputOptions = {
    input: defaultEntry(rootPath, source),
    plugins: [
      typescript({
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
