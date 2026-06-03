import { useEffect, useState } from 'react';
import { fetchJson } from '../api/client';
import type { NewsItem } from '../types';

interface UseFinanceNewsOptions {
  limit?: number;
}

interface UseFinanceNewsResult {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
}

export function useFinanceNews(
  options: UseFinanceNewsOptions = {}
): UseFinanceNewsResult {
  const { limit = 15 } = options;
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchJson<{ items: NewsItem[] }>(
          `/api/news?limit=${limit}`
        );
        if (!result.items?.length) {
          throw new Error('暂无新闻');
        }
        if (!cancelled) {
          setItems(result.items);
        }
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setError(err instanceof Error ? err.message : '新闻加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { items, loading, error };
}
