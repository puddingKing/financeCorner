const express = require('express');
const path = require('path');
const { getLastTradingDay } = require('./tradingDay');
const { fetchSseIndexTrend } = require('./fetchIndex');
const { fetchFinanceNews } = require('./fetchNews');

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, '..', 'public');

app.get('/api/index/trend', async (req, res) => {
  try {
    const date = req.query.date || getLastTradingDay();
    const data = await fetchSseIndexTrend(date);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || '获取数据失败' });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const data = await fetchFinanceNews(page, limit);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || '获取新闻失败' });
  }
});

app.use(express.static(publicDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`上证指数趋势图服务已启动: http://localhost:${PORT}`);
});
