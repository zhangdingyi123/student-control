#!/bin/bash
# 上传最新代码 + 为俊萱分配 Hot 100 全覆盖课表 + 重启服务
# 在本机终端执行：bash study-platform/deploy/assign-junxuan-hot100.sh
set -e

HOST="root@47.97.176.185"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REMOTE="/opt/study-platform"

echo "▶ 上传代码到服务器…"
rsync -avz \
  --exclude node_modules \
  --exclude .git \
  --exclude .cursor \
  --exclude 'study-platform/server/data/platform.db' \
  "$REPO_ROOT/" "$HOST:$REMOTE/"

echo "▶ 分配课表并重启…"
ssh "$HOST" bash -s <<'REMOTE'
set -e
cd /opt/study-platform/study-platform/server
npm install --production
node scripts/assign-hot100-plan.js 俊萱 --set-default
pm2 restart study-platform
echo ""
echo "✅ 完成。学员端: http://47.97.176.185:3850/student/"
REMOTE
