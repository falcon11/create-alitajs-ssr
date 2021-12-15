'use strict';

const commander = require('commander');
const chalk = require('chalk');
const execSync = require('child_process').execSync;
const fs = require('fs-extra');
const spawn = require('cross-spawn');
const path = require('path');

const packageJson = require('./package.json');

let projectName;

function init() {
  const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .arguments('<project-directory>')
    .usage(`${chalk.green('<project-directory>')} [options]`)
    .action(name => {
      projectName = name;
    })
    .allowUnknownOption()
    .option('--help', () => {
      console.log(` Only ${chalk.green('<project-directory>')} is required.`);
    })
    .parse(process.argv);

  if (program.info) {
    console.log('program info', program.info);
  }

  if (typeof projectName === 'undefined') {
    console.error('Please specify the project directory:');
    console.log(
      ` ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
    );
    console.log();
    console.log('For example:');
    console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-app')}`);
    console.log();
    process.exit(1);
  }
  createApp(projectName);
}

function createApp(name) {
  const root = path.resolve(name);
  const appName = path.basename(root);
  console.log('root', root, 'app name', appName);

  fs.ensureDirSync(name);
  process.chdir(root);

  run(root, appName);
}

function run(root, appName) {
  initEgg(root);
  const alitaPath = initAlita(root);
  const eggPackageJsonPath = path.resolve(root, 'package.json');
  const alitaPackageJsonPath = path.resolve(alitaPath, 'package.json');
  const eggPackageJson = require(eggPackageJsonPath);
  const alitaPackageJson = require(alitaPackageJsonPath);
  console.log(
    'eggPackageJson',
    eggPackageJson,
    'alitaPackageJson',
    alitaPackageJson
  );
  fs.writeFileSync(
    eggPackageJsonPath,
    JSON.stringify(
      mergePackageJson(
        eggPackageJson,
        alitaPackageJson,
        path.relative(alitaPath, root)
      )
    )
  );
}

function initEgg(root) {
  const eggInitCommand = 'npm';
  const eggInitOptions = ['init', 'egg', '--type=simple'];
  const eggInitChildOutput = spawn.sync(eggInitCommand, eggInitOptions, {
    stdio: 'inherit',
  });
  if (eggInitChildOutput.status !== 0) {
    console.error('egg init fail', eggInitChildOutput.error);
    process.exit(1);
  }
  fs.copySync(
    path.resolve(__dirname, 'template/eslintignore.tpl'),
    path.resolve(root, '.eslintignore')
  );
  fs.copySync(
    path.resolve(__dirname, 'template/gitignore.tpl'),
    path.resolve(root, '.gitignore')
  );
}

function initAlita(root) {
  const originalCwd = process.cwd();
  const appPath = path.resolve(root, 'app');
  process.chdir(appPath);
  const alitaInitCommand = 'yarn';
  const alitaInitOptions = ['create', 'alita', 'web'];
  const alitaInitOutput = spawn.sync(alitaInitCommand, alitaInitOptions, {
    stdio: 'inherit',
  });
  process.chdir(originalCwd);
  if (alitaInitOutput.status !== 0) {
    console.error('alita init fail', alitaInitOutput.error);
    process.exit(1);
  }
  const alitaPath = path.resolve(appPath, 'web');
  // copy config.ts
  fs.copySync(
    path.resolve(__dirname, 'template/alita/config.tpl'),
    path.resolve(alitaPath, 'config/config.ts')
  );
  // config .env
  fs.copySync(
    path.resolve(__dirname, 'template/alita/env.tpl'),
    path.resolve(alitaPath, '.env')
  );
  return alitaPath;
}

function mergePackageJson(eggPackageJson, alitaPackageJson, alitaPath) {
  eggPackageJson = JSON.parse(JSON.stringify(eggPackageJson));

  // merge dependencies
  const alitaDependencies = alitaPackageJson.dependencies;
  Object.keys(alitaDependencies).forEach(key => {
    // eslint-disable-next-line no-prototype-builtins
    if (!eggPackageJson.dependencies.hasOwnProperty(key)) {
      eggPackageJson.dependencies[key] = alitaDependencies[key];
    }
  });

  // merge devDependencies
  Object.keys(alitaPackageJson.devDependencies).forEach(key => {
    // eslint-disable-next-line no-prototype-builtins
    if (!eggPackageJson.devDependencies.hasOwnProperty(key)) {
      eggPackageJson.devDependencies[key] =
        alitaPackageJson.devDependencies[key];
    }
  });

  // merge scripts
  eggPackageJson.scripts[
    'start-web'
  ] = `cross-env APP_ROOT=${alitaPath} alita dev`;
  eggPackageJson.scripts[
    'build-web'
  ] = `cross-env APP_ROOT=${alitaPath} alita build`;
  eggPackageJson.scripts[
    'ci'
  ] = `npm run build-web && ${eggPackageJson.scripts['ci']}`;
  return eggPackageJson;
}

module.exports = {
  init,
};
