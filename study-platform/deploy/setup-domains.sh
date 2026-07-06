#!/bin/bash
# 配置双域名反代到学习计划 Node（默认 :3850）
# 用法：sudo NODE_PORT=3850 bash setup-domains.sh

set -e

NODE_PORT="${NODE_PORT:-3850}"
DIR="$(cd "$(dirname "$0")" && pwd)"
TMP="/tmp/study-platform-domains.conf"
DEST="/etc/nginx/conf.d/study-platform-domains.conf"

echo "==> Node 应监听 ${NODE_PORT}（pm2 + PORT=${NODE_PORT}）"
if ! curl -sf "http://127.0.0.1:${NODE_PORT}/teacher/" >/dev/null; then
  echo "⚠️  http://127.0.0.1:${NODE_PORT}/teacher/ 不可达，请先："
  echo "   PORT=${NODE_PORT} TEACHER_PASSWORD='xxx' pm2 start index.js --name study-platform"
fi

sed "s/127.0.0.1:3850/127.0.0.1:${NODE_PORT}/g" \
  "$DIR/nginx-domains-proxy80.conf" > "$TMP"
cp "$TMP" "$DEST"
echo "   已写入 $DEST"

# 找到正在跑的 nginx master 及其配置文件
MASTER=$(pgrep -f 'nginx: master' | head -1)
if [ -z "$MASTER" ]; then
  echo "❌ 未找到 nginx master，80 端口可能由 Docker 提供"
  docker ps 2>/dev/null || true
  exit 1
fi

CMD=$(tr '\0' ' ' < "/proc/$MASTER/cmdline")
CONF=$(echo "$CMD" | sed -n 's/.*-c \([^ ]*\).*/\1/p')
[ -z "$CONF" ] && CONF=/etc/nginx/nginx.conf
CONF_DIR=$(dirname "$CONF")

echo "   Nginx master pid=$MASTER"
echo "   配置文件: $CONF"

# 若主配置不在 /etc/nginx，同步一份到该目录的 conf.d
if [ "$CONF_DIR" != "/etc/nginx" ] && [ -d "$CONF_DIR" ]; then
  mkdir -p "$CONF_DIR/conf.d"
  cp "$TMP" "$CONF_DIR/conf.d/study-platform-domains.conf"
  echo "   已同步到 $CONF_DIR/conf.d/study-platform-domains.conf"
  if ! grep -rq 'conf\.d' "$CONF" 2>/dev/null; then
    echo "⚠️  $CONF 可能未 include conf.d，请手动添加："
    echo "   include $CONF_DIR/conf.d/*.conf;"
  fi
fi

nginx -t
kill -HUP "$MASTER"
echo "✅ 已 reload Nginx"

echo ""
echo "验证（DNS 生效后）："
echo "  curl -I -H 'Host: 183ehjez.cn' http://127.0.0.1/student/"
echo "  curl -I -H 'Host: 185egugn.cn' http://127.0.0.1/teacher/"
echo ""
echo "浏览器："
echo "  http://183ehjez.cn/student/"
echo "  http://185egugn.cn/teacher/"
