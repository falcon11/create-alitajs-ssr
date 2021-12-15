#!/usr/bin/env node

'use strict';

const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split('.');
const major = semver[0];

if (major < 14) {
  console.error(
    `You are running Node ${currentNodeVersion}.\n` +
      'Create Alita SSR requires Node 14 or higher.\n' +
      'please update your version of Node.'
  );
  process.exit(1);
}

const { init } = require('./createAlitajsSsr.js');

init();
