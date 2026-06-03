# 上证指数昨日趋势图

展示 A 股上证指数上一交易日分时走势的 Web 应用。

## 功能

- 自动识别上一交易日（跳过周末）
- 分时折线图 + 成交量副图（ECharts）
- 昨收参考线，红涨绿跌
- 数据源：东方财富（优先）/ 腾讯财经（服务器备用）

## 本地运行

```bash
yarn install   # 或 npm install
yarn start     # http://localhost:3000
```

## 部署到服务器

```bash
./deploy.sh remote root@你的服务器IP --domain 你的域名
```

私钥默认从 `~/dev/private/cloud-key/*.pem` 自动读取，也可用 `--identity` 指定。

## 技术栈

- Node.js 18+ / Express
- ECharts（本地静态资源）
- PM2 + Nginx（生产部署）
