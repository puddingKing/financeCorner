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

生产环境访问：https://www.luca0527.art/stock/

## GitHub 自动部署（CI/CD）

推送到 `main` 分支后，GitHub Actions 会自动打包、上传并重启服务器上的应用。

### 1. 推送代码到 GitHub

```bash
git remote add origin git@github.com:你的用户名/sse-index-trend.git
git push -u origin main
```

### 2. 配置 GitHub Secrets

仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**，添加：

| Secret | 说明 | 示例 |
|--------|------|------|
| `SSH_HOST` | 服务器 IP | `49.233.211.168` |
| `SSH_USER` | SSH 用户 | `root` |
| `SSH_PRIVATE_KEY` | 私钥完整内容（`luca_for_beijing.pem` 全文） | 见下方 |
| `DEPLOY_URL` | 健康检查地址（可选） | `https://www.luca0527.art/stock` |
| `APP_DIR` | 服务器安装目录（可选） | `/opt/sse-index` |

复制私钥到剪贴板：

```bash
cat ~/dev/private/cloud-key/luca_for_beijing.pem | pbcopy
```

粘贴到 `SSH_PRIVATE_KEY` 时须包含 `-----BEGIN ... KEY-----` 与 `-----END ... KEY-----` 整段。

### 3. 触发方式

- **自动**：每次 `git push origin main` 后自动部署
- **手动**：GitHub → **Actions** → **Deploy to Server** → **Run workflow**

### 流程说明

```mermaid
flowchart LR
  push[push main] --> actions[GitHub Actions]
  actions --> scp[SCP 上传代码包]
  scp --> update[update-app.sh]
  update --> pm2[pm2 restart]
```

## 技术栈

- Node.js 18+ / Express
- ECharts（本地静态资源）
- PM2 + Nginx（生产部署）

## 自动部署
