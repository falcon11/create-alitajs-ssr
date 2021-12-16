'use strict';
const Serviece = require('egg').Service;

class NewsService extends Serviece {
  async getNewsList(page = 1) {
    const { serverUrl, pageSize } = this.config.news;
    const { data: idList } = await this.ctx.curl(
      `${serverUrl}/topstories.json`,
      {
        data: {
          orderBy: '"$key"',
          startAt: `"${pageSize * (page - 1)}"`,
          endAt: `"${pageSize * page - 1}"`,
        },
        dataType: 'json',
      }
    );
    const newsList = await Promise.all(
      Object.keys(idList).map(key => {
        const url = `${serverUrl}/item/${idList[key]}.json`;
        return this.ctx.curl(url, { dataType: 'json' });
      })
    );
    return newsList.map(item => item.data);
  }
}

module.exports = NewsService;
