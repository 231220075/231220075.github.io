#!/bin/bash

# 英超数据服务启动脚本
# 使用方法: ./start-services.sh

echo "🚀 启动英超数据服务..."

# 检查代理服务器是否已经在运行
if pgrep -f "node proxy-server.js" > /dev/null; then
    echo "⚠️  代理服务器已在运行"
else
    echo "📡 启动代理服务器..."
    nohup node proxy-server.js > proxy-server.log 2>&1 &
    echo "✅ 代理服务器已启动 (PID: $!)"
fi

# 等待服务器启动
sleep 3

# 检查服务器状态
if curl -s "http://localhost:3001/api/health" > /dev/null; then
    echo "✅ 代理服务器运行正常"
    echo "📊 API端点："
    echo "   - 积分榜: http://localhost:3001/api/premier-league/standings"
    echo "   - 比赛信息: http://localhost:3001/api/premier-league/matches"
    echo "   - 健康检查: http://localhost:3001/api/health"
else
    echo "❌ 代理服务器启动失败"
    exit 1
fi

# 启动博客服务器
echo ""
echo "📝 启动博客服务器..."
if pgrep -f "hexo server" > /dev/null; then
    echo "⚠️  博客服务器已在运行"
else
    echo "🌐 启动博客服务器在端口 4001..."
    nohup npm run server -- -p 4001 > hexo-server.log 2>&1 &
    echo "✅ 博客服务器已启动"
fi

echo ""
echo "🎉 所有服务已启动完成！"
echo "🌐 访问地址: http://localhost:4001"
echo "⚽ 英超页面: http://localhost:4001/premier-league/"
echo ""
echo "📝 日志文件:"
echo "   - 代理服务器: proxy-server.log"
echo "   - 博客服务器: hexo-server.log"
echo ""
echo "🛑 停止服务: ./stop-services.sh"
