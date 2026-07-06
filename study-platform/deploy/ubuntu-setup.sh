#!/bin/bash
# 在阿里云 ECS（Ubuntu 22.04）上首次部署学习计划平台
#
# 方式 A — Git 克隆（推荐）：
#   GIT_REPO='https://gitee.com/你的用户名/bagu.git' \
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

echo "==> 安装依赖..."
apt-get update -qq
apt-get install -y nginx curl git

if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
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

# 首次部署：从示例生成空数据文件（store.json 不入库）
if [ ! -f "$SERVER_DIR/data/store.json" ]; then
  cp "$SERVER_DIR/data/store.json.example" "$SERVER_DIR/data/store.json"
fi

echo "==> 安装 Node 依赖..."
cd "$SERVER_DIR"
npm install --production

echo "==> 配置 Nginx..."
cp "$APP_DIR/study-platform/deploy/nginx-domains.conf" "$NGINX_SITE"
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/study-platform
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "==> 启动 Node（pm2）..."
export TEACHER_PASSWORD="$TEACHER_PW"
pm2 delete study-platform 2>/dev/null || true
pm2 start index.js --name study-platform --cwd "$SERVER_DIR"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

echo ""
echo "✅ 部署完成"
echo "   Node:  http://127.0.0.1:3847"
echo "   学员:  http://183ehjez.cn/student/"
echo "   教师:  http://185egugn.cn/teacher/"
echo "   教师密码: $TEACHER_PW"
