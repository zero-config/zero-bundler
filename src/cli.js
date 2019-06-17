#!/usr/bin/env node

import build from './index';

const rootPath = process.cwd();
build(rootPath).catch(console.log);
