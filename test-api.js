const axios = require('axios');

async function testFootballDataAPI() {
  console.log('🧪 测试 Football-Data.org API...');
  
  const API_TOKEN = '6fb5d05d476c47aeaa0ea249923f1d9a';
  
  try {
    console.log('📡 发送请求到 Football-Data.org...');
    const response = await axios.get(
      'https://api.football-data.org/v4/competitions/PL/standings',
      {
        headers: {
          'X-Auth-Token': API_TOKEN
        },
        timeout: 10000
      }
    );

    console.log('✅ API调用成功!');
    console.log('📊 响应状态:', response.status);
    console.log('🏆 获得数据:', response.data.standings[0].table.length, '支球队');
    console.log('🥇 第一名:', response.data.standings[0].table[0].team.name);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ API调用失败:');
    console.error('   错误代码:', error.response?.status);
    console.error('   错误信息:', error.response?.data?.message || error.message);
    console.error('   完整错误:', error.response?.data);
    
    if (error.response?.status === 403) {
      console.log('💡 403错误可能的原因:');
      console.log('   - API密钥无效');
      console.log('   - 超出免费额度限制');
      console.log('   - 需要验证邮箱');
    }
    
    return null;
  }
}

testFootballDataAPI();
