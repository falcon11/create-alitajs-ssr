'use strict';

const commander = require('commander');
const chalk = require('chalk');
const fs = require('fs-extra');
const spawn = require('cross-spawn');
const path = require('path');
const mustache = require('mustache');

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

  fs.ensureDirSync(name);
  process.chdir(root);

  run(root);
}

function run(root) {
  initEgg(root);
  const alitaPath = initAlita(root);
  const eggPackageJsonPath = path.resolve(root, 'package.json');
  const alitaPackageJsonPath = path.resolve(alitaPath, 'package.json');
  const eggPackageJson = require(eggPackageJsonPath);
  const alitaPackageJson = require(alitaPackageJsonPath);
  fs.writeFileSync(
    eggPackageJsonPath,
    JSON.stringify(
      mergePackageJson(
        eggPackageJson,
        alitaPackageJson,
        path.relative(root, alitaPath)
      ),
      null,
      2
    )
  );
  // install dependencies
  installDependencies();
  installDependencies('egg-view-assets');
  installDependencies('egg-view-nunjucks');
  installDependencies('mime');
  installDependencies('dayjs');
  installDependencies('qs');
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
    path.resolve(__dirname, 'template/egg/eslintignore.tpl'),
    path.resolve(root, '.eslintignore')
  );
  fs.copySync(
    path.resolve(__dirname, 'template/egg/gitignore.tpl'),
    path.resolve(root, '.gitignore')
  );

  let configDefault = fs.readFileSync(
    path.resolve(__dirname, 'template/egg/config/config.default.tpl'),
    'utf-8'
  );
  configDefault = mustache.render(configDefault, {
    appKey: generateAppKey(),
    alitaPath: path.relative(root, getAlitaPath(root)),
  });
  fs.writeFileSync(
    path.resolve(root, 'config/config.default.js'),
    configDefault
  );

  fs.copySync(
    path.resolve(__dirname, 'template/egg/config/plugin.js'),
    path.resolve(root, 'config/plugin.js')
  );

  fs.copySync(
    path.resolve(__dirname, 'template/egg/config/config.local.js'),
    path.resolve(root, 'config/config.local.js')
  );

  fs.copySync(
    path.resolve(__dirname, 'template/egg/app/controller'),
    path.resolve(root, 'app/controller')
  );

  fs.copySync(
    path.resolve(__dirname, 'template/egg/app/service'),
    path.resolve(root, 'app/service')
  );

  fs.copySync(
    path.resolve(__dirname, 'template/egg/app/view'),
    path.resolve(root, 'app/view')
  );

  fs.copySync(
    path.resolve(__dirname, 'template/egg/app/router.js'),
    path.resolve(root, 'app/router.js')
  );
}

function initAlita(root) {
  const originalCwd = process.cwd();
  const appPath = getAppPath(root);
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
  const alitaPath = getAlitaPath(root);
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

  // copy src
  fs.copySync(
    path.resolve(__dirname, 'template/alita/src'),
    path.resolve(alitaPath, 'src')
  );
  return alitaPath;
}

function getAppPath(root) {
  return path.join(root, 'app');
}

function getAlitaPath(root) {
  return path.resolve(getAppPath(root), 'web');
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
    'start'
  ] = `npm run build-web && ${eggPackageJson.scripts['start']}`;
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

function installDependencies(packageName, isDev) {
  const commander = 'yarn';
  const options = [];
  if (packageName) {
    options.push('add');
    options.push(packageName);
  }
  if (isDev) {
    options.push('-D');
  }
  const output = spawn.sync(commander, options, { stdio: 'inherit' });
  if (output.status !== 0) {
    console.error('install dependencies fail', output.error);
    process.exit(1);
  }
}

function generateAppKey() {
  return `_${new Date().getTime()}_${Math.round(Math.random() * 10000)}`;
}

module.exports = {
  init,
};
