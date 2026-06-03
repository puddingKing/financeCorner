# 上证指数昨日趋势图

展示 A 股上证指数上一交易日分时走势与财经要闻的 Web 应用。

## 功能

- 自动识别上一交易日（跳过周末）
- 分时折线图 + 成交量副图（ECharts）
- 财经要闻列表
- 数据源：东方财富（优先）/ 腾讯财经（服务器备用）

## 技术栈

- **前端**：React 18 + TypeScript + Vite
- **后端**：Node.js 18+ / Express
- **部署**：PM2 + Nginx

## 项目结构

```
client/src/
├── api/              # API 请求封装
├── hooks/            # 数据 hooks
├── types/            # TypeScript 类型
├── utils/            # 工具函数
├── components/
│   ├── common/       # LoadingSpinner、ErrorMessage
│   ├── layout/       # PageContainer
│   ├── index/        # 指数头部、统计、趋势区块
│   ├── chart/        # ECharts 图表
│   └── news/         # 财经新闻列表
├── styles/
├── App.tsx
└── main.tsx
server/               # Express API
public/               # Vite 构建产物（勿手改）
```

## 本地开发

```bash
yarn install
yarn dev:server    # 终端 1：API http://localhost:3000
yarn dev           # 终端 2：前端 http://localhost:5173（代理 /api）
```

生产预览：

```bash
yarn build
yarn start         # http://localhost:3000
```

## 部署

```bash
./deploy.sh remote root@你的服务器IP --domain 你的域名
```

私钥默认从 `~/dev/private/cloud-key/*.pem` 自动读取。

生产环境：https://www.luca0527.art/stock/

## GitHub 自动部署

推送到 `main` 后，Actions 会执行 `npm run build` 并部署到服务器。

需在仓库 Secrets 中配置：`SSH_HOST`、`SSH_USER`、`SSH_PRIVATE_KEY`，可选 `DEPLOY_URL`、`APP_DIR`。
