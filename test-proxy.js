const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testProxyServer() {
  console.log('🧪 测试英超数据代理服务器...\n');

  try {
    // 测试健康检查
    console.log('1️⃣ 测试健康检查...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data.status);
    console.log('📊 缓存统计:', healthResponse.data.cache_stats);
    console.log('');

    // 测试积分榜
    console.log('2️⃣ 测试积分榜数据...');
    const standingsResponse = await axios.get(`${API_BASE}/premier-league/standings`);
    console.log('✅ 积分榜获取成功');
    console.log('📊 数据源:', standingsResponse.data.source);
    console.log('🏆 前3名球队:');
    standingsResponse.data.data.slice(0, 3).forEach(team => {
      console.log(`   ${team.position}. ${team.team.name} - ${team.points}分`);
    });
    console.log('');

    // 测试近期比赛
    console.log('3️⃣ 测试近期比赛数据...');
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const fixturesResponse = await axios.get(`${API_BASE}/premier-league/matches`, {
      params: {
        dateFrom: today,
        dateTo: futureDateStr,
        status: 'SCHEDULED'
      }
    });
    console.log('✅ 近期比赛获取成功');
    console.log('📊 数据源:', fixturesResponse.data.source);
    console.log('⚽ 找到', fixturesResponse.data.data.length, '场比赛');
    if (fixturesResponse.data.data.length > 0) {
      const match = fixturesResponse.data.data[0];
      console.log(`   下场比赛: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    }
    console.log('');

    // 测试缓存功能
    console.log('4️⃣ 测试缓存功能...');
    const start = Date.now();
    await axios.get(`${API_BASE}/premier-league/standings`);
    const cacheTime = Date.now() - start;
    console.log('✅ 缓存测试完成');
    console.log('⚡ 缓存响应时间:', cacheTime, 'ms');
    console.log('');

    console.log('🎉 所有测试通过！代理服务器工作正常。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📄 响应数据:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 提示: 请确保代理服务器正在运行 (npm start)');
    }
  }
}

// 运行测试
if (require.main === module) {
  testProxyServer();
}

module.exports = testProxyServer;
