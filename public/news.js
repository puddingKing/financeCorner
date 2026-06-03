const newsListEl = document.getElementById('news-list');
const newsHintEl = document.getElementById('news-hint');
const newsErrorEl = document.getElementById('news-error');

function apiPath(path) {
  const pathname = window.location.pathname;
  const base = pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname.replace(/\/[^/]*$/, '');
  return `${base || ''}${path}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderNewsList(items) {
  newsListEl.innerHTML = items
    .map(
      (item) => `
    <li class="news-item">
      <a class="news-item__title" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
        ${escapeHtml(item.title)}
      </a>
      ${
        item.summary
          ? `<p class="news-item__summary">${escapeHtml(item.summary)}</p>`
          : ''
      }
      <div class="news-item__meta">
        <span class="news-item__source">${escapeHtml(item.source)}</span>
        <time class="news-item__time">${escapeHtml(item.time)}</time>
      </div>
    </li>
  `
    )
    .join('');
}

async function loadNews() {
  newsHintEl.textContent = '加载中…';
  newsErrorEl.classList.add('hidden');

  try {
    const res = await fetch(apiPath('/api/news?limit=15'));
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `请求失败 (${res.status})`);
    }
    const data = await res.json();
    if (!data.items?.length) {
      throw new Error('暂无新闻');
    }
    renderNewsList(data.items);
    newsHintEl.textContent = `共 ${data.items.length} 条`;
  } catch (err) {
    newsListEl.innerHTML = '';
    newsHintEl.textContent = '';
    newsErrorEl.textContent = err.message || '新闻加载失败';
    newsErrorEl.classList.remove('hidden');
  }
}

loadNews();
