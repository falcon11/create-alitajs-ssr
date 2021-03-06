'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  // 所有请求都走 controller.home.index
  router.get('/api/news', controller.news.list);
  router.get('*', controller.home.index);
};
