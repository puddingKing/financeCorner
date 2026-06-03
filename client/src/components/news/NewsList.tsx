import type { NewsItem as NewsItemType } from '../../types';
import { NewsItem } from './NewsItem';

interface NewsListProps {
  items: NewsItemType[];
}

export function NewsList({ items }: NewsListProps) {
  return (
    <ul className="news-list">
      {items.map((item) => (
        <NewsItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
