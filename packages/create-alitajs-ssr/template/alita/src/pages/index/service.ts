import { request } from 'alita';

export async function getNewsList({ page = 1 }): Promise<any> {
  return request('/api/news', { method: 'get', params: { page } });
}
