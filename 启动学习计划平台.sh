#!/bin/bash
cd "$(dirname "$0")/study-platform/server" || exit 1
PORT=3847
if lsof -i :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  端口 $PORT 已被占用，尝试结束旧进程..."
  kill $(lsof -t -i:$PORT -sTCP:LISTEN) 2>/dev/null
  sleep 1
fi
echo "📚 启动学习计划平台..."
echo "   首页:     http://localhost:$PORT"
echo "   学员端:   http://localhost:$PORT/student/"
echo "   教师端:   http://localhost:$PORT/teacher/"
echo "   教师密码: teacher123"
echo ""
PORT=$PORT npm start
