import { useIndexTrend } from '../../hooks/useIndexTrend';
import { ErrorMessage } from '../common/ErrorMessage';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { TrendChart } from '../chart/TrendChart';
import { IndexHeader } from './IndexHeader';
import { IndexStats } from './IndexStats';

export function IndexTrendSection() {
  const { data, loading, error, reload } = useIndexTrend();

  if (loading) {
    return <LoadingSpinner message="正在获取行情数据…" />;
  }

  if (error || !data) {
    return <ErrorMessage message={error ?? '数据加载失败'} onRetry={reload} />;
  }

  return (
    <>
      <IndexHeader name={data.name} date={data.date} />
      <IndexStats data={data} />
      <TrendChart data={data} />
    </>
  );
}
