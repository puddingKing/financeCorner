const { toCompact, getPreviousTradingDay } = require('./tradingDay');

const SECID = '1.000001';
const INDEX_NAME = '上证指数';
const INDEX_CODE = '000001';
const MAX_FALLBACK_DAYS = 10;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://quote.eastmoney.com/',
};

async function safeFetchJson(url, headers = HEADERS) {
  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchMinuteKline(dateStr) {
  const compact = toCompact(dateStr);
  const url = new URL('https://push2his.eastmoney.com/api/qt/stock/kline/get');
  url.searchParams.set('secid', SECID);
  url.searchParams.set('klt', '1');
  url.searchParams.set('fqt', '0');
  url.searchParams.set('beg', compact);
  url.searchParams.set('end', compact);
  url.searchParams.set('fields1', 'f1,f2,f3,f4,f5,f6');
  url.searchParams.set(
    'fields2',
    'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61'
  );
  url.searchParams.set('ut', 'fa5fd1943c7b386f172d6893dbfba10b');

  const json = await safeFetchJson(url);
  const klines = json?.data?.klines;
  if (!klines || klines.length === 0) {
    return null;
  }

  return parseKlines(dateStr, klines);
}

async function fetchTrendsFallback(dateStr) {
  const url = new URL('https://push2his.eastmoney.com/api/qt/stock/trends2/get');
  url.searchParams.set('secid', SECID);
  url.searchParams.set('ndays', '5');
  url.searchParams.set('iscr', '0');
  url.searchParams.set('iscca', '0');
  url.searchParams.set('fields1', 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13');
  url.searchParams.set('fields2', 'f51,f52,f53,f54,f55,f56,f57,f58');
  url.searchParams.set('ut', 'fa5fd1943c7b386f172d6893dbfba10b');

  const json = await safeFetchJson(url);
  const data = json?.data;
  if (!data?.trends?.length) {
    return null;
  }

  const targetPrefix = `${dateStr} `;
  const dayTrends = data.trends.filter((t) => t.startsWith(targetPrefix));
  if (dayTrends.length === 0) {
    return null;
  }

  const preClose = Number(data.preClose);
  const points = dayTrends.map((row) => {
    const [datetime, price, avgPrice, , , volume, amount] = row.split(',');
    const time = datetime.slice(11, 16);
    const p = Number(price) || Number(avgPrice);
    return {
      time,
      price: p,
      volume: Number(volume),
      amount: Number(amount),
    };
  });

  const open = points[0]?.price ?? preClose;
  const close = points[points.length - 1]?.price ?? preClose;
  const changePct = preClose ? ((close - preClose) / preClose) * 100 : 0;

  return {
    name: INDEX_NAME,
    code: INDEX_CODE,
    date: dateStr,
    preClose,
    open,
    close,
    changePct: round2(changePct),
    points,
  };
}

function formatTencentTime(raw) {
  const padded = String(raw).padStart(4, '0');
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

function compactToDate(compact) {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

async function fetchTencentMinute(dateStr) {
  const latest = await fetchTencentLatest();
  if (!latest || latest.date !== dateStr) {
    return null;
  }
  return latest;
}

async function fetchTencentLatest() {
  const url =
    'https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=sh000001';
  const json = await safeFetchJson(url, {
    'User-Agent': HEADERS['User-Agent'],
    Referer: 'https://finance.qq.com/',
  });

  const block = json?.data?.sh000001;
  const rows = block?.data?.data;
  if (!rows?.length) {
    return null;
  }

  const apiDate = block.data.date;
  const resolvedDate = apiDate ? compactToDate(apiDate) : null;
  if (!resolvedDate) {
    return null;
  }

  const qt = block.qt?.sh000001 || [];
  const preClose = Number(qt[4]) || 0;
  const close = Number(qt[3]) || 0;

  const points = rows
    .map((row) => {
      const [timeRaw, price, volume, amount] = row.split(' ');
      const time = formatTencentTime(timeRaw);
      return {
        time,
        price: Number(price),
        volume: Number(volume),
        amount: Number(amount),
      };
    })
    .filter((p) => isTradingTime(p.time));

  if (points.length === 0) {
    return null;
  }

  const open = Number(qt[5]) || points[0].price;
  const lastClose = close || points[points.length - 1].price;
  const changePct = preClose ? ((lastClose - preClose) / preClose) * 100 : 0;

  return {
    name: INDEX_NAME,
    code: INDEX_CODE,
    date: resolvedDate,
    preClose,
    open,
    close: lastClose,
    changePct: round2(changePct),
    points,
  };
}

function parseKlines(dateStr, klines) {
  const points = klines
    .map((row) => {
      const [datetime, , close, , , volume, amount, , pct] = row.split(',');
      const time = datetime.slice(11, 16);
      return {
        time,
        price: Number(close),
        volume: Number(volume),
        amount: Number(amount),
        pct: Number(pct),
      };
    })
    .filter((p) => isTradingTime(p.time));

  if (points.length === 0) {
    return null;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const preClose = round2(first.price - first.price * (first.pct / 100));
  const changePct = preClose ? ((last.price - preClose) / preClose) * 100 : 0;

  return {
    name: INDEX_NAME,
    code: INDEX_CODE,
    date: dateStr,
    preClose,
    open: first.price,
    close: last.price,
    changePct: round2(changePct),
    points: points.map(({ time, price, volume, amount }) => ({
      time,
      price,
      volume,
      amount,
    })),
  };
}

function isTradingTime(time) {
  const [h, m] = time.split(':').map(Number);
  const minutes = h * 60 + m;
  const morningStart = 9 * 60 + 30;
  const morningEnd = 11 * 60 + 30;
  const afternoonStart = 13 * 60;
  const afternoonEnd = 15 * 60;
  return (
    (minutes >= morningStart && minutes <= morningEnd) ||
    (minutes >= afternoonStart && minutes <= afternoonEnd)
  );
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function fetchSseIndexTrend(requestedDate) {
  let dateStr = requestedDate;
  let attempts = 0;

  while (attempts < MAX_FALLBACK_DAYS) {
    let result = await fetchMinuteKline(dateStr);
    if (!result) {
      result = await fetchTrendsFallback(dateStr);
    }
    if (!result) {
      result = await fetchTencentMinute(dateStr);
    }
    if (result && result.points.length > 0) {
      return result;
    }
    dateStr = getPreviousTradingDay(dateStr);
    attempts += 1;
  }

  const latest = await fetchTencentLatest();
  if (latest?.points?.length) {
    return latest;
  }

  throw new Error('无法获取最近交易日的上证指数数据');
}

module.exports = { fetchSseIndexTrend };
