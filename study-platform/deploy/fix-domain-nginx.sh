#!/bin/bash
# 诊断 80 端口 Nginx 并注入域名反代配置
# 用法：sudo bash fix-domain-nginx.sh

set -e
NODE_PORT="${NODE_PORT:-3850}"
DIR="$(cd "$(dirname "$0")" && pwd)"
CONF_NAME="study-platform-domains.conf"
TMP="/tmp/$CONF_NAME"

sed "s/127.0.0.1:3850/127.0.0.1:${NODE_PORT}/g" \
  "$DIR/nginx-domains-proxy80.conf" > "$TMP"

echo "========== 1. 检查 Node :${NODE_PORT} =========="
curl -sf "http://127.0.0.1:${NODE_PORT}/student/" >/dev/null \
  && echo "✅ Node 正常" \
  || echo "❌ 请先: PORT=${NODE_PORT} TEACHER_PASSWORD='xxx' pm2 start index.js --name study-platform"

echo ""
echo "========== 2. 谁占用 80 端口 =========="
ss -tlnp | grep -E ':80\s' || true

MASTER=$(pgrep -f 'nginx: master' | head -1)
if [ -z "$MASTER" ]; then
  echo "❌ 未找到 nginx master"
  exit 1
fi
echo "master pid: $MASTER"
tr '\0' ' ' < "/proc/$MASTER/cmdline"
echo ""

# 是否在 Docker 里
ROOT_LINK=$(readlink "/proc/$MASTER/root" 2>/dev/null || echo "")
if [ -n "$ROOT_LINK" ] && [ "$ROOT_LINK" != "/" ]; then
  echo "⚠️  Nginx 很可能跑在 Docker 容器内 (root=$ROOT_LINK)"
fi

echo ""
echo "========== 3. Docker 容器 =========="
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' 2>/dev/null || echo "(无 docker 命令)"

NGINX_CONTAINER=$(docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null | grep '0.0.0.0:80->' | awk '{print $1}' | head -1)

if [ -n "$NGINX_CONTAINER" ]; then
  echo ""
  echo ">>> 发现容器 $NGINX_CONTAINER 占用 80，向容器写入域名配置..."
  docker exec "$NGINX_CONTAINER" mkdir -p /etc/nginx/conf.d 2>/dev/null || true
  docker cp "$TMP" "$NGINX_CONTAINER:/etc/nginx/conf.d/$CONF_NAME"
  docker exec "$NGINX_CONTAINER" nginx -t
  docker exec "$NGINX_CONTAINER" nginx -s reload
  echo "✅ 已 reload 容器内 Nginx"
else
  echo ""
  echo "========== 4. 宿主机 Nginx 配置 =========="
  CMD=$(tr '\0' ' ' < "/proc/$MASTER/cmdline")
  CONF=$(echo "$CMD" | sed -n 's/.*-c \([^ ]*\).*/\1/p')
  [ -z "$CONF" ] && CONF=/etc/nginx/nginx.conf
  CONF_DIR=$(dirname "$CONF")
  echo "配置文件: $CONF"

  mkdir -p /etc/nginx/conf.d "$CONF_DIR/conf.d" 2>/dev/null || true
  cp "$TMP" "/etc/nginx/conf.d/$CONF_NAME"
  [ -d "$CONF_DIR/conf.d" ] && cp "$TMP" "$CONF_DIR/conf.d/$CONF_NAME"

  nginx -t
  kill -HUP "$MASTER"
  echo "✅ 已 HUP reload master pid $MASTER"
fi

echo ""
echo "========== 5. 验证 =========="
curl -sI -H "Host: 183ehjez.cn" http://127.0.0.1/student/ | head -3
TITLE=$(curl -s -H "Host: 183ehjez.cn" http://127.0.0.1/student/ | grep -o '<title>[^<]*</title>')
echo "页面标题: $TITLE"
if echo "$TITLE" | grep -q '学习计划'; then
  echo "✅ 域名反代成功！浏览器访问 http://183ehjez.cn/student/"
else
  echo "❌ 仍是旧项目，请把以下输出发给开发者："
  echo "   docker ps"
  echo "   tr '\\0' ' ' < /proc/$MASTER/cmdline"
  find /etc /usr/local -name 'nginx.conf' 2>/dev/null | head -10
fi
