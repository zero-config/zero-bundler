import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import build from '../src/index';

const fixturesFolder = path.join(
  __dirname,
  'fixtures',
);

fs.readdirSync(fixturesFolder)
  .forEach(async (dirName) => {
    const location = path.join(fixturesFolder, dirName);
    if (fs.lstatSync(location).isDirectory()) {
      rimraf.sync(path.join(location, 'dist'));
      await build(location);
    }
  });
