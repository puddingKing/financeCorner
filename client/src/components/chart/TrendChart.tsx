import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { IndexTrend } from '../../types';
import { buildChartOption } from './buildChartOption';

interface TrendChartProps {
  data: IndexTrend;
}

export function TrendChart({ data }: TrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = echarts.init(el);
    chart.setOption(buildChartOption(data));

    const resize = () => {
      requestAnimationFrame(() => chart.resize());
    };

    window.addEventListener('resize', resize);
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    requestAnimationFrame(() => chart.resize());

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      chart.dispose();
    };
  }, [data]);

  return (
    <div className="chart-wrap">
      <div ref={containerRef} className="chart" />
    </div>
  );
}
