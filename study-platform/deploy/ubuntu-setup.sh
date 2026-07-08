#!/bin/bash
# 在阿里云 ECS（Ubuntu 22.04）上首次部署学习计划平台
#
# 方式 A — Git 克隆（GitHub / Gitee 均可）：
#   GIT_REPO='https://github.com/你的用户名/bagu.git' \
#   TEACHER_PASSWORD='你的密码' sudo -E bash ubuntu-setup.sh
#
# 方式 B — 代码已在 /opt/study-platform（rsync 上传）：
#   TEACHER_PASSWORD='你的密码' sudo -E bash ubuntu-setup.sh

set -e

APP_DIR="/opt/study-platform"
SERVER_DIR="$APP_DIR/study-platform/server"
NGINX_SITE="/etc/nginx/sites-available/study-platform"
TEACHER_PW="${TEACHER_PASSWORD:-teacher123}"
GIT_REPO="${GIT_REPO:-}"
GIT_BRANCH="${GIT_BRANCH:-main}"
# 对外端口：3850 专用于学习计划；设为 80 则走域名标准端口
NGINX_PORT="${NGINX_PORT:-3850}"

echo "==> 安装依赖..."
apt-get update -qq
apt-get install -y nginx curl git

if ! command -v node &>/dev/null || [ "$(node -p 'process.versions.node.split(\".\")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

if [ -n "$GIT_REPO" ]; then
  echo "==> Git 克隆 $GIT_REPO ..."
  rm -rf "$APP_DIR"
  git clone --branch "$GIT_BRANCH" --depth 1 "$GIT_REPO" "$APP_DIR"
fi

if [ ! -f "$SERVER_DIR/index.js" ]; then
  echo "❌ 未找到 $SERVER_DIR/index.js"
  echo "   请设置 GIT_REPO 或先把项目放到 $APP_DIR"
  exit 1
fi

# 首次部署：数据由 SQLite 自动初始化（platform.db 不入库）
# 若存在旧版 store.json，服务启动时会自动迁移

echo "==> 安装 Node 依赖..."
cd "$SERVER_DIR"
npm install --production

echo "==> 配置 Nginx（对外端口 ${NGINX_PORT}）..."
if [ "$NGINX_PORT" = "80" ]; then
  cp "$APP_DIR/study-platform/deploy/nginx-domains.conf" "$NGINX_SITE"
else
  cp "$APP_DIR/study-platform/deploy/nginx-port${NGINX_PORT}.conf" "$NGINX_SITE"
fi
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/study-platform
# 不删除 default / 旧项目配置，新域名与旧项目可共存（见 deploy/DEPLOY.md「与旧项目共存」）

reload_nginx_safe() {
  nginx -t || return 1
  if systemctl is-active --quiet nginx 2>/dev/null; then
    systemctl reload nginx && return 0
  fi
  local pf pid
  for pf in /run/nginx.pid /var/run/nginx.pid; do
    if [ -s "$pf" ]; then
      pid=$(cat "$pf")
      if kill -0 "$pid" 2>/dev/null; then
        kill -HUP "$pid" && echo "   已通过 $pf reload Nginx (pid $pid)" && return 0
      fi
    fi
  done
  pid=$(pgrep -f 'nginx: master' | head -1)
  if [ -n "$pid" ]; then
    kill -HUP "$pid" && echo "   已对 master pid $pid 发送 HUP" && return 0
  fi
  if ss -tlnp 2>/dev/null | grep -qE ':80\s'; then
    echo "⚠️  80 有进程但找不到 Nginx master"
    return 1
  fi
  systemctl start nginx 2>/dev/null || nginx
  return 0
}

echo "==> 重载 Nginx 配置..."
systemctl enable nginx
set +e
reload_nginx_safe
NGINX_OK=$?
set -e
if [ "$NGINX_OK" -ne 0 ]; then
  echo "⚠️  Nginx reload 失败，请手动: kill -HUP \$(pgrep -f 'nginx: master' | head -1)"
  echo "   然后继续，Node 仍会启动"
fi

echo "==> 启动 Node（pm2）..."
export TEACHER_PASSWORD="$TEACHER_PW"
pm2 delete study-platform 2>/dev/null || true
pm2 start index.js --name study-platform --cwd "$SERVER_DIR"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

echo ""
echo "✅ 部署完成"
echo "   Node:  http://127.0.0.1:3847"
echo "   学员:  http://47.97.176.185:${NGINX_PORT}/student/"
echo "   教师:  http://47.97.176.185:${NGINX_PORT}/teacher/"
echo "   教师密码: $TEACHER_PW"
