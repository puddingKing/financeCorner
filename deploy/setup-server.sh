#!/usr/bin/env bash
# 在腾讯云服务器上运行，完成 Node.js / PM2 / Nginx 安装与应用启动
set -euo pipefail

APP_NAME="sse-index"
APP_DIR="${APP_DIR:-/opt/sse-index}"
APP_PORT="${APP_PORT:-3000}"
DOMAIN="${DOMAIN:-_}"
INSTALL_NGINX="${INSTALL_NGINX:-1}"
INSTALL_NODE="${INSTALL_NODE:-1}"

log() { echo "[setup] $*"; }
need_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    echo "请使用 root 运行，或在命令前加 sudo"
    exit 1
  fi
}

is_debian() { [[ -f /etc/debian_version ]]; }

is_rpm() {
  [[ -f /etc/redhat-release ]] && return 0
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    source /etc/os-release
    case "${ID:-}:${ID_LIKE:-}" in
      *opencloudos*|*rhel*|*centos*|*fedora*|*rocky*|*almalinux*) return 0 ;;
    esac
  fi
  command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1
}

install_node() {
  if command -v node >/dev/null 2>&1 && [[ "$(node -p 'process.version.slice(1).split(".")[0]')" -ge 18 ]]; then
    log "Node.js 已安装: $(node -v)"
    return
  fi

  log "安装 Node.js 20..."
  if is_debian; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  elif is_rpm; then
    if command -v dnf >/dev/null 2>&1; then
      dnf install -y nodejs npm || dnf install -y nodejs20 npm
    else
      yum install -y nodejs npm
    fi
  else
    echo "未识别的 Linux 发行版，请手动安装 Node.js >= 18"
    exit 1
  fi
  log "Node.js 版本: $(node -v)"
}

install_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    log "安装 PM2..."
    npm install -g pm2
  fi
}

install_deps() {
  log "安装应用依赖..."
  cd "$APP_DIR"
  if [[ -f yarn.lock ]] && command -v yarn >/dev/null 2>&1; then
    yarn install --production --frozen-lockfile || yarn install --production
  else
    npm install --omit=dev
  fi
}

start_app() {
  log "启动应用 (PM2)..."
  cd "$APP_DIR"
  export PORT="$APP_PORT"
  pm2 delete "$APP_NAME" 2>/dev/null || true
  pm2 start ecosystem.config.cjs
  pm2 save
  pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup || true
}

install_nginx() {
  [[ "$INSTALL_NGINX" == "1" ]] || return

  if is_debian; then
    apt-get install -y nginx gettext-base
  elif is_rpm; then
    if command -v dnf >/dev/null 2>&1; then
      dnf install -y nginx-core gettext || dnf install -y nginx gettext
    else
      yum install -y nginx gettext
    fi
    systemctl enable nginx
  fi

  log "配置 Nginx..."
  export DOMAIN APP_PORT
  envsubst '${DOMAIN} ${APP_PORT}' \
    < "$APP_DIR/deploy/nginx/sse-index.conf.template" \
    > /etc/nginx/sites-available/sse-index 2>/dev/null \
    || envsubst '${DOMAIN} ${APP_PORT}' \
    < "$APP_DIR/deploy/nginx/sse-index.conf.template" \
    > /etc/nginx/conf.d/sse-index.conf

  if [[ -d /etc/nginx/sites-enabled ]]; then
    ln -sf /etc/nginx/sites-available/sse-index /etc/nginx/sites-enabled/sse-index
    rm -f /etc/nginx/sites-enabled/default
  fi

  nginx -t
  systemctl enable nginx
  systemctl reload nginx || systemctl start nginx
}

main() {
  need_root
  [[ -d "$APP_DIR" ]] || { echo "应用目录不存在: $APP_DIR"; exit 1; }

  [[ "$INSTALL_NODE" == "1" ]] && install_node
  install_pm2
  install_deps
  start_app
  install_nginx

  log "部署完成"
  log "  应用目录: $APP_DIR"
  log "  内部端口: $APP_PORT"
  if [[ "$INSTALL_NGINX" == "1" ]]; then
    log "  访问地址: http://${DOMAIN} (DOMAIN=_ 时用服务器 IP 访问)"
  else
    log "  访问地址: http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
  fi
  log "  PM2 状态: pm2 status"
  log "  查看日志: pm2 logs $APP_NAME"
}

main "$@"
