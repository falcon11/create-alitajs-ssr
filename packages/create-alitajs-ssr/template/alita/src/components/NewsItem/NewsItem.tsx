import React, { FC } from 'react';
import * as moment from '@/utils/moment';
import styles from './index.less';

interface Props {
  news: any;
}

const NewsItem: FC<Props> = ({ news }) => {
  return (
    <div className={styles.cell}>
      <h3>
        <a href={news?.url}>{news?.title}</a>
      </h3>
      <div>
        by: {news.by} {moment.relativeTime(news.time)}
      </div>
    </div>
  );
};

export default NewsItem;
