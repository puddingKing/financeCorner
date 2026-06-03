const express = require('express');
const path = require('path');
const { getLastTradingDay } = require('./tradingDay');
const { fetchSseIndexTrend } = require('./fetchIndex');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));

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

app.listen(PORT, () => {
  console.log(`上证指数趋势图服务已启动: http://localhost:${PORT}`);
});
