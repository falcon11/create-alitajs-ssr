'use strict';

const Controller = require('egg').Controller;

class NewsController extends Controller {
  async list() {
    const ctx = this.ctx;
    const page = ctx.query.page || 1;
    const newsList = await ctx.service.news.getNewsList(page);
    ctx.body = newsList;
  }
}

module.exports = NewsController;
