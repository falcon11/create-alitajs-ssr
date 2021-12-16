import React, { FC } from 'react';
import qs from 'qs';
import { IGetInitialProps } from 'alita';
import { getNewsList } from './service';
import NewsItem from '@/components/NewsItem';
import styles from './index.less';

interface HomePageProps {
  newsList: any[];
}

const HomePage: FC<HomePageProps> & { getInitialProps: IGetInitialProps } = ({ newsList }) => {
  const renderNewsItem = (newsItem: any) => {
    return <NewsItem key={newsItem.id} news={newsItem} />;
  };
  return <div className={styles.page}>{newsList?.map?.(renderNewsItem)}</div>;
};

HomePage.getInitialProps = async (ctx) => {
  const { isServer, history, pageSize } = ctx;
  const query = qs.parse(history.location.search, {
    ignoreQueryPrefix: true,
  }) as any;
  if (isServer) {
    const { service } = ctx;
    const newsList = await service.news.getNewsList(query.page);
    return { newsList, pageSize };
  }
  const newsList = (await getNewsList({ page: query.page })) || [];
  return { newsList, pageSize: 20 };
};

export default HomePage;
