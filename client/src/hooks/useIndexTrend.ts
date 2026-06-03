import { useCallback, useEffect, useState } from 'react';
import { fetchJson } from '../api/client';
import type { IndexTrend } from '../types';

interface UseIndexTrendResult {
  data: IndexTrend | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useIndexTrend(): UseIndexTrendResult {
  const [data, setData] = useState<IndexTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJson<IndexTrend>('/api/index/trend');
      if (!result.points?.length) {
        throw new Error('暂无行情数据');
      }
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
