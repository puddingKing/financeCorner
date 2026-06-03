import { useFinanceNews } from '../../hooks/useFinanceNews';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { NewsList } from './NewsList';

export function NewsSection() {
  const { items, loading, error } = useFinanceNews({ limit: 15 });

  const hint = loading
    ? '加载中…'
    : error
      ? ''
      : `共 ${items.length} 条`;

  return (
    <section className="news-section" aria-labelledby="news-heading">
      <div className="news-header">
        <h2 id="news-heading" className="news-heading">
          财经要闻
        </h2>
        <span className="news-hint">{hint}</span>
      </div>

      {loading && <LoadingSpinner message="正在加载新闻…" />}

      {!loading && !error && items.length > 0 && <NewsList items={items} />}

      {!loading && error && <p className="news-error">{error}</p>}
    </section>
  );
}
