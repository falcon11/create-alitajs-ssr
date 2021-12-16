/* eslint valid-jsdoc: "off" */

'use strict';
const path = require('path');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 * * @param {Egg.EggAppConfig} appConfig app config
 */
module.exports = (appInfo, appConfig = {}) => {
  const assetsDir = (appConfig.assets && appConfig.assets.dir) || '{{{alitaPath}}}';
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '{{appKey}}';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
    // 开启 gzip
    static: {
      gzip: true,
    },
    // 配置 assets
    assets: {
      publicPath: '/public',
      devServer: {
        command: 'alita dev',
        env: {
          APP_ROOT: path.join(appInfo.baseDir, assetsDir),
          PORT: '{port}',
          BROWSER: 'none',
          ESLINT: 'none',
          SOCKET_SERVER: 'http://127.0.0.1:{port}',
          PUBLIC_PATH: 'http://127.0.0.1:{port}/',
        },
      },
    },
    // 配置 view
    view: {
      mapping: {
        '.html': 'nunjucks',
      },
      defaultViewEngine: 'nunjucks',
    },
    news: {
      serverUrl: 'https://hacker-news.firebaseio.com/v0',
      pageSize: 20,
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
