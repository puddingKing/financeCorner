#!/usr/bin/env bash
# 服务器端增量更新（GitHub Actions 或手动上传 tarball 后执行）
set -euo pipefail

APP_NAME="sse-index"
APP_DIR="${APP_DIR:-/opt/sse-index}"
TARBALL="${TARBALL:-/tmp/sse-index-deploy.tar.gz}"

log() { echo "[update] $*"; }

[[ -f "$TARBALL" ]] || { echo "找不到部署包: $TARBALL"; exit 1; }
[[ -d "$APP_DIR" ]] || mkdir -p "$APP_DIR"

log "解压到 $APP_DIR ..."
tar xzf "$TARBALL" -C "$APP_DIR"

log "安装依赖 ..."
cd "$APP_DIR"
if [[ -f yarn.lock ]] && command -v yarn >/dev/null 2>&1; then
  yarn install --production --frozen-lockfile || yarn install --production
else
  npm install --omit=dev
fi

if [[ ! -f "$APP_DIR/public/index.html" ]]; then
  echo "缺少前端构建产物 public/index.html，请在部署前执行 npm run build"
  exit 1
fi

log "重启应用 ..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME"
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

log "更新完成"
pm2 status "$APP_NAME"
