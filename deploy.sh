#!/usr/bin/env bash
# 上证指数趋势图 — 一键部署脚本
#
# 用法:
#   ./deploy.sh pack                          # 打包代码（不含 node_modules）
#   ./deploy.sh install                       # 在当前目录服务器端安装（需 root）
#   ./deploy.sh remote root@1.2.3.4           # 上传并在远程服务器部署
#   ./deploy.sh remote root@1.2.3.4 --domain example.com
#
# 环境变量:
#   APP_DIR=/opt/sse-index   远程安装路径
#   APP_PORT=3000            应用端口
#   DOMAIN=_                 Nginx server_name（默认 _ 表示任意域名/IP）
#   INSTALL_NGINX=1          是否安装配置 Nginx（0 跳过）
#   SSH_IDENTITY=~/.ssh/key.pem   SSH 私钥路径

set -euo pipefail

APP_NAME="sse-index"
APP_DIR="${APP_DIR:-/opt/sse-index}"
APP_PORT="${APP_PORT:-3000}"
DOMAIN="${DOMAIN:-_}"
INSTALL_NGINX="${INSTALL_NGINX:-1}"
SSH_IDENTITY="${SSH_IDENTITY:-}"
if [[ -z "$SSH_IDENTITY" && -d "$HOME/dev/private/cloud-key" ]]; then
  SSH_IDENTITY="$(find "$HOME/dev/private/cloud-key" -maxdepth 1 -name '*.pem' -print -quit 2>/dev/null || true)"
fi
TARBALL="/tmp/${APP_NAME}-deploy.tar.gz"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ssh_cmd() {
  if [[ -n "$SSH_IDENTITY" ]]; then
    ssh -i "$SSH_IDENTITY" -o StrictHostKeyChecking=accept-new "$@"
  else
    ssh -o StrictHostKeyChecking=accept-new "$@"
  fi
}

scp_cmd() {
  if [[ -n "$SSH_IDENTITY" ]]; then
    scp -i "$SSH_IDENTITY" "$@"
  else
    scp "$@"
  fi
}

usage() {
  cat <<'EOF'
上证指数趋势图 — 部署工具

命令:
  pack                 打包项目到 /tmp/sse-index-deploy.tar.gz
  install              在本机/服务器当前目录执行安装（需 root）
  remote <user@host>   打包、上传并在远程服务器一键部署

示例:
  ./deploy.sh pack
  ./deploy.sh remote root@123.456.789.0
  DOMAIN=stock.example.com ./deploy.sh remote root@123.456.789.0

远程部署前请确保:
  1. 已配置 SSH 密钥登录
  2. 腾讯云安全组已放行 22、80、443 端口
EOF
}

pack() {
  echo "[deploy] 构建前端..."
  if [[ -f "$SCRIPT_DIR/package.json" ]]; then
    (cd "$SCRIPT_DIR" && npm run build)
  fi
  echo "[deploy] 打包项目..."
  tar czf "$TARBALL" \
    --exclude=node_modules \
    --exclude='*.tar.gz' \
    --exclude=.git \
    -C "$SCRIPT_DIR" .
  echo "[deploy] 已生成: $TARBALL ($(du -h "$TARBALL" | cut -f1))"
}

remote_install() {
  local host="$1"
  echo "[deploy] 上传到 $host ..."
  ssh_cmd "$host" "mkdir -p $APP_DIR"
  scp_cmd "$TARBALL" "$host:/tmp/"
  scp_cmd "$SCRIPT_DIR/deploy/setup-server.sh" "$host:/tmp/setup-server.sh"

  echo "[deploy] 远程安装..."
  ssh_cmd "$host" "bash -s" <<REMOTE
set -euo pipefail
mkdir -p "$APP_DIR"
tar xzf "$TARBALL" -C "$APP_DIR"
chmod +x /tmp/setup-server.sh
APP_DIR="$APP_DIR" APP_PORT="$APP_PORT" DOMAIN="$DOMAIN" INSTALL_NGINX="$INSTALL_NGINX" \
  bash /tmp/setup-server.sh
REMOTE

  echo "[deploy] 远程部署完成"
  echo "[deploy] 访问: http://${DOMAIN} (若 DOMAIN=_ 请用服务器公网 IP)"
}

cmd="${1:-}"
case "$cmd" in
  pack)
    pack
    ;;
  install)
    if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
      echo "install 命令需要 root 权限，请使用: sudo ./deploy.sh install"
      exit 1
    fi
    APP_DIR="$SCRIPT_DIR" APP_PORT="$APP_PORT" DOMAIN="$DOMAIN" INSTALL_NGINX="$INSTALL_NGINX" \
      bash "$SCRIPT_DIR/deploy/setup-server.sh"
    ;;
  remote)
    [[ -n "${2:-}" ]] || { usage; exit 1; }
    shift
    host="$1"
    shift || true
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --domain) DOMAIN="$2"; shift 2 ;;
        --port) APP_PORT="$2"; shift 2 ;;
        --identity) SSH_IDENTITY="$2"; shift 2 ;;
        --no-nginx) INSTALL_NGINX=0; shift ;;
        *) echo "未知参数: $1"; exit 1 ;;
      esac
    done
    pack
    remote_install "$host"
    ;;
  -h|--help|help|"")
    usage
    ;;
  *)
    echo "未知命令: $cmd"
    usage
    exit 1
    ;;
esac
