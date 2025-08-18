#!/bin/bash

echo "🧪 英超排行榜模块测试"
echo "======================"

echo ""
echo "1️⃣  测试代理服务器状态..."
if curl -s "http://localhost:3001/api/health" > /dev/null; then
    echo "✅ 代理服务器正常运行"
else
    echo "❌ 代理服务器未响应"
    exit 1
fi

echo ""
echo "2️⃣  测试积分榜API..."
API_DATA=$(curl -s "http://localhost:3001/api/premier-league/standings")
if echo "$API_DATA" | grep -q '"success":true'; then
    echo "✅ 积分榜API正常返回"
    echo "📊 数据源: $(echo "$API_DATA" | python3 -c "import json,sys; print(json.load(sys.stdin).get('source', '未知'))")"
    echo "🏆 第一名: $(echo "$API_DATA" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['data'][0]['team']['name'] + ' (' + str(data['data'][0]['points']) + '分)')" 2>/dev/null || echo '解析失败')"
else
    echo "❌ 积分榜API返回错误"
    echo "$API_DATA"
    exit 1
fi

echo ""
echo "3️⃣  测试前端页面..."
if curl -s "http://localhost:4001/premier-league/" | grep -q "season-title"; then
    echo "✅ 前端页面包含动态标题元素"
else
    echo "❌ 前端页面缺少必要元素"
fi

if curl -s "http://localhost:4001/js/premier-league-api.js" | grep -q "PremierLeagueController"; then
    echo "✅ 新的API模块已部署"
else
    echo "❌ 新的API模块未找到"
fi

echo ""
echo "4️⃣  测试完整数据流..."
echo "🔄 清除缓存..."
curl -s "http://localhost:3001/api/clear-cache" > /dev/null

echo "📡 重新获取数据..."
FRESH_DATA=$(curl -s "http://localhost:3001/api/premier-league/standings")
SEASON_INFO=$(echo "$FRESH_DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
season = data.get('season', {})
if season and 'startDate' in season:
    start_year = season['startDate'][:4]
    end_year = str(int(start_year) + 1)
    print(f'{start_year}-{end_year[2:]}赛季')
else:
    print('未知赛季')
" 2>/dev/null)

echo "📅 当前赛季: $SEASON_INFO"

echo ""
echo "🎉 测试完成！"
echo ""
echo "🌐 访问地址: http://localhost:4001/premier-league/"
echo "🔧 如果页面显示不正确，请:"
echo "   1. 在浏览器中强制刷新 (Ctrl+F5)"
echo "   2. 打开开发者工具查看控制台输出"
echo "   3. 点击页面上的'🔄 刷新数据'按钮"
