import { formatChangePct, formatNum, getPctDirection } from '../../utils/format';
import type { IndexTrend } from '../../types';

interface IndexStatsProps {
  data: Pick<IndexTrend, 'preClose' | 'open' | 'close' | 'changePct'>;
}

export function IndexStats({ data }: IndexStatsProps) {
  const cls = getPctDirection(data.changePct);

  return (
    <div className="stats">
      <div className="stat-item">
        <span className="stat-label">昨收</span>
        <span className="stat-value">{formatNum(data.preClose)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">开盘</span>
        <span className={`stat-value ${cls}`}>{formatNum(data.open)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">收盘</span>
        <span className={`stat-value ${cls}`}>{formatNum(data.close)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">涨跌幅</span>
        <span className={`stat-value ${cls}`}>
          {formatChangePct(data.changePct)}
        </span>
      </div>
    </div>
  );
}
