#!/bin/bash
# 服务器上拉取最新代码并重启（保留 data/platform.db）
set -e

APP_DIR="/opt/study-platform"
SERVER_DIR="$APP_DIR/study-platform/server"

cd "$APP_DIR"
git pull

cd "$SERVER_DIR"
npm install --production
pm2 restart study-platform

echo "✅ 已更新并重启 study-platform"
