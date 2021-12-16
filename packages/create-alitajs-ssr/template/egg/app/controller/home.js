'use strict';

const mime = require('mime');
const Controller = require('egg').Controller;

class HomeController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.serverRender = require('../public/umi.server');
  }
  async index() {
    const { ctx } = this;

    global.host = `${ctx.request.protocol}://${ctx.request.host}`;
    global.href = ctx.request.href;

    // 先走 eggjs 的 view 渲染
    const htmlTemplate = await ctx.view.render('index.html');

    // 将 html 模板传到服务端渲染函数中
    const { html, error } = await this.serverRender({
      path: ctx.url,
      getInitialPropsCtx: {
        service: ctx.service,
      },
      htmlTemplate,
    });

    if (error) {
      ctx.logger.error(
        '[SSR ERROR] 渲染报错，切换至客户端渲染',
        error,
        ctx.url
      );
    }
    ctx.type = mime.getType(ctx.url);
    ctx.status = 200;
    ctx.body = html;
  }
}

module.exports = HomeController;
