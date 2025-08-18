#!/bin/bash

# 英超数据服务停止脚本
# 使用方法: ./stop-services.sh

echo "🛑 停止英超数据服务..."

# 停止代理服务器
if pgrep -f "node proxy-server.js" > /dev/null; then
    echo "📡 停止代理服务器..."
    pkill -f "node proxy-server.js"
    echo "✅ 代理服务器已停止"
else
    echo "ℹ️  代理服务器未运行"
fi

# 停止博客服务器
if pgrep -f "hexo server" > /dev/null; then
    echo "📝 停止博客服务器..."
    pkill -f "hexo server"
    echo "✅ 博客服务器已停止"
else
    echo "ℹ️  博客服务器未运行"
fi

echo "🎉 所有服务已停止完成！"
