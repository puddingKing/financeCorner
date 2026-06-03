const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://finance.sina.com.cn/',
};

const SINA_ROLL_URL = 'https://feed.mix.sina.com.cn/api/roll/get';

function formatNewsTime(ts) {
  const sec = Number(ts);
  if (!sec) return '';
  const d = new Date(sec * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function fetchFinanceNews(page = 1, limit = 15) {
  const url = new URL(SINA_ROLL_URL);
  url.searchParams.set('pageid', '153');
  url.searchParams.set('lid', '2509');
  url.searchParams.set('num', String(limit));
  url.searchParams.set('page', String(page));

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`财经新闻接口请求失败: ${res.status}`);
  }

  const json = await res.json();
  const items = json?.result?.data;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('暂无财经新闻');
  }

  return {
    page,
    limit,
    items: items.map((item) => ({
      id: item.docid,
      title: item.title || '无标题',
      summary: (item.intro || item.summary || '').trim(),
      url: item.url || item.wapurl,
      source: item.media_name || '新浪财经',
      time: formatNewsTime(item.ctime || item.intime),
    })),
  };
}

module.exports = { fetchFinanceNews };
