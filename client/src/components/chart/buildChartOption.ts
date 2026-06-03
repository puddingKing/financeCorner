import type { EChartsOption } from 'echarts';
import type { IndexTrend } from '../../types';

export function buildChartOption(data: IndexTrend): EChartsOption {
  const isUp = data.close >= data.preClose;
  const lineColor = isUp ? '#e54545' : '#1aad19';
  const areaColor = isUp
    ? 'rgba(229, 69, 69, 0.15)'
    : 'rgba(26, 173, 25, 0.15)';

  const times = data.points.map((p) => p.time);
  const prices = data.points.map((p) => p.price);
  const volumes = data.points.map((p) => p.volume);

  return {
    animation: true,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter(params) {
        if (!Array.isArray(params)) return '';
        const priceItem = params.find((p) => p.seriesName === '指数');
        const volItem = params.find((p) => p.seriesName === '成交量');
        if (!priceItem || typeof priceItem.dataIndex !== 'number') return '';
        const idx = priceItem.dataIndex;
        const price = prices[idx];
        const pct = data.preClose
          ? (((price - data.preClose) / data.preClose) * 100).toFixed(2)
          : '0.00';
        const sign = Number(pct) > 0 ? '+' : '';
        const volText = volItem?.value
          ? `${(Number(volItem.value) / 1e8).toFixed(2)} 亿`
          : '-';
        return `${priceItem.name}<br/>指数: ${price.toFixed(2)} (${sign}${pct}%)<br/>成交量: ${volText}`;
      },
    },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    grid: [
      { left: 60, right: 20, top: 30, height: '58%' },
      { left: 60, right: 20, top: '74%', height: '18%' },
    ],
    xAxis: [
      {
        type: 'category',
        data: times,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#ccc' } },
        axisLabel: { color: '#666', interval: Math.floor(times.length / 8) },
        gridIndex: 0,
      },
      {
        type: 'category',
        data: times,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#ccc' } },
        axisLabel: { show: false },
        gridIndex: 1,
      },
    ],
    yAxis: [
      {
        type: 'value',
        scale: true,
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#666' },
        gridIndex: 0,
      },
      {
        type: 'value',
        scale: true,
        splitLine: { show: false },
        axisLabel: {
          color: '#666',
          formatter: (v: number) => `${(v / 1e8).toFixed(0)}亿`,
        },
        gridIndex: 1,
      },
    ],
    series: [
      {
        name: '指数',
        type: 'line',
        data: prices,
        smooth: false,
        symbol: 'none',
        lineStyle: { width: 1.5, color: lineColor },
        areaStyle: { color: areaColor },
        xAxisIndex: 0,
        yAxisIndex: 0,
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#999' },
          label: {
            formatter: `昨收 ${data.preClose.toFixed(2)}`,
            position: 'insideEndTop',
          },
          data: [{ yAxis: data.preClose }],
        },
      },
      {
        name: '成交量',
        type: 'bar',
        data: volumes,
        itemStyle: { color: 'rgba(22, 119, 255, 0.45)' },
        xAxisIndex: 1,
        yAxisIndex: 1,
      },
    ],
  };
}
