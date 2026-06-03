const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const statsEl = document.getElementById('stats');
const statusEl = document.getElementById('status');
const chartWrapEl = document.getElementById('chart-wrap');
const errorEl = document.getElementById('error');
const errorMsgEl = document.getElementById('error-msg');
const retryBtn = document.getElementById('retry-btn');

let chartInstance = null;

function apiPath(path) {
  const pathname = window.location.pathname;
  const base = pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname.replace(/\/[^/]*$/, '');
  return `${base || ''}${path}`;
}

function showLoading() {
  statusEl.classList.remove('hidden');
  chartWrapEl.classList.add('hidden');
  errorEl.classList.add('hidden');
}

function showChart() {
  statusEl.classList.add('hidden');
  chartWrapEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
}

function showError(msg) {
  statusEl.classList.add('hidden');
  chartWrapEl.classList.add('hidden');
  errorEl.classList.remove('hidden');
  errorMsgEl.textContent = msg;
}

function formatNum(n, digits = 2) {
  return Number(n).toFixed(digits);
}

function pctClass(pct) {
  if (pct > 0) return 'up';
  if (pct < 0) return 'down';
  return 'flat';
}

function renderHeader(data) {
  titleEl.textContent = data.name;
  subtitleEl.textContent = `${data.date} 分时走势（上一交易日）`;

  const cls = pctClass(data.changePct);
  const sign = data.changePct > 0 ? '+' : '';

  statsEl.innerHTML = `
    <div class="stat-item">
      <span class="stat-label">昨收</span>
      <span class="stat-value">${formatNum(data.preClose)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">开盘</span>
      <span class="stat-value ${cls}">${formatNum(data.open)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">收盘</span>
      <span class="stat-value ${cls}">${formatNum(data.close)}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">涨跌幅</span>
      <span class="stat-value ${cls}">${sign}${formatNum(data.changePct)}%</span>
    </div>
  `;
}

function resizeChart() {
  if (!chartInstance) return;
  requestAnimationFrame(() => chartInstance.resize());
}

function renderChart(data) {
  const chartDom = document.getElementById('chart');
  if (!chartInstance) {
    chartInstance = echarts.init(chartDom);
    window.addEventListener('resize', resizeChart);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resizeChart).observe(chartDom);
    }
  }

  const isUp = data.close >= data.preClose;
  const lineColor = isUp ? '#e54545' : '#1aad19';
  const areaColor = isUp
    ? 'rgba(229, 69, 69, 0.15)'
    : 'rgba(26, 173, 25, 0.15)';

  const times = data.points.map((p) => p.time);
  const prices = data.points.map((p) => p.price);
  const volumes = data.points.map((p) => p.volume);

  chartInstance.setOption({
    animation: true,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter(params) {
        const priceItem = params.find((p) => p.seriesName === '指数');
        const volItem = params.find((p) => p.seriesName === '成交量');
        if (!priceItem) return '';
        const idx = priceItem.dataIndex;
        const price = prices[idx];
        const pct = data.preClose
          ? (((price - data.preClose) / data.preClose) * 100).toFixed(2)
          : '0.00';
        const sign = Number(pct) > 0 ? '+' : '';
        return `
          ${priceItem.axisValue}<br/>
          指数: ${price.toFixed(2)} (${sign}${pct}%)<br/>
          成交量: ${volItem ? (volItem.value / 1e8).toFixed(2) + ' 亿' : '-'}
        `;
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
          formatter: (v) => (v / 1e8).toFixed(0) + '亿',
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
  });

  resizeChart();
}

async function loadData() {
  showLoading();
  try {
    const res = await fetch(apiPath('/api/index/trend'));
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `请求失败 (${res.status})`);
    }
    const data = await res.json();
    if (!data.points?.length) {
      throw new Error('暂无行情数据');
    }
    renderHeader(data);
    showChart();
    renderChart(data);
  } catch (err) {
    showError(err.message || '数据加载失败');
  }
}

retryBtn.addEventListener('click', loadData);
loadData();
