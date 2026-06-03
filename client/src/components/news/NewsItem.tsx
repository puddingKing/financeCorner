import type { NewsItem as NewsItemType } from '../../types';

interface NewsItemProps {
  item: NewsItemType;
}

export function NewsItem({ item }: NewsItemProps) {
  return (
    <li className="news-item">
      <a
        className="news-item__title"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {item.title}
      </a>
      {item.summary && <p className="news-item__summary">{item.summary}</p>}
      <div className="news-item__meta">
        <span className="news-item__source">{item.source}</span>
        <time className="news-item__time">{item.time}</time>
      </div>
    </li>
  );
}
