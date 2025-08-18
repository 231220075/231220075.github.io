const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');

// 加载环境变量
require('dotenv').config();

const app = express();

// 创建缓存实例，缓存时间10分钟
const cache = new NodeCache({ stdTTL: 600 });

// 中间件
app.use(cors({
  origin: ['http://localhost:4000', 'http://localhost:4001', 'https://231220075.github.io', 'http://127.0.0.1:4000', 'http://127.0.0.1:4001'],
  credentials: true
}));
app.use(express.json());

// API密钥配置（需要注册获取）
const API_CONFIG = {
  // Football-Data.org - 免费账户每月10次请求
  footballData: {
    baseURL: 'https://api.football-data.org/v4',
    headers: {
      'X-Auth-Token': process.env.FOOTBALL_DATA_TOKEN || 'YOUR_FOOTBALL_DATA_TOKEN'
    }
  },
  // API-Football - 免费账户每天100次请求
  apiSports: {
    baseURL: 'https://v3.football.api-sports.io',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'YOUR_RAPIDAPI_KEY',
      'x-rapidapi-host': 'v3.football.api-sports.io'
    }
  }
};

// 工具函数：处理API错误
const handleAPIError = (error, res, fallbackData = null) => {
  console.error('API Error:', error.message);
  
  if (fallbackData) {
    res.json({
      success: true,
      data: fallbackData,
      source: 'fallback',
      message: '使用备用数据'
    });
  } else {
    res.status(500).json({
      success: false,
      error: '数据获取失败',
      message: error.message
    });
  }
};

// 获取英超积分榜
app.get('/api/premier-league/standings', async (req, res) => {
  const cacheKey = 'pl-standings';
  
  try {
    // 检查缓存
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData.standings || cachedData,
        season: cachedData.season,
        source: 'cache',
        message: '从缓存获取数据',
        lastUpdated: cachedData.lastUpdated || new Date().toISOString()
      });
    }

    // 首先尝试 Football-Data.org (2025-26赛季最新数据)
    try {
      const response = await axios.get(
        `${API_CONFIG.footballData.baseURL}/competitions/PL/standings`,
        { headers: API_CONFIG.footballData.headers, timeout: 10000 }
      );

      if (response.data && response.data.standings) {
        const standings = response.data.standings[0].table;
        const season = response.data.season;
        
        const result = {
          standings: standings,
          season: season,
          source: 'football-data.org',
          lastUpdated: new Date().toISOString()
        };
        
        cache.set(cacheKey, result);
        
        return res.json({
          success: true,
          data: standings,
          season: season,
          source: 'football-data.org',
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('Football-Data.org 失败，尝试 API-Sports...');
    }

    // 备用：API-Sports (使用2025赛季最新数据)
    try {
      const response = await axios.get(
        `${API_CONFIG.apiSports.baseURL}/standings?league=39&season=2025`,
        { headers: API_CONFIG.apiSports.headers, timeout: 10000 }
      );

      if (response.data && response.data.response) {
        const standings = response.data.response[0].league.standings[0].map((team, index) => ({
          position: team.rank,
          team: {
            name: team.team.name,
            shortName: team.team.code,
            crest: team.team.logo
          },
          playedGames: team.all.played,
          won: team.all.win,
          draw: team.all.draw,
          lost: team.all.lose,
          goalsFor: team.all.goals.for,
          goalsAgainst: team.all.goals.against,
          goalDifference: team.goalsDiff,
          points: team.points,
          form: team.form
        }));

        cache.set(cacheKey, standings);
        
        return res.json({
          success: true,
          data: standings,
          source: 'api-sports',
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('API-Sports 也失败了');
    }

    // 如果所有API都失败，使用模拟数据
    const fallbackData = generateFallbackStandings();
    cache.set(cacheKey, fallbackData);
    
    res.json({
      success: true,
      data: fallbackData,
      source: 'fallback',
      message: 'API暂时不可用，使用模拟数据'
    });

  } catch (error) {
    handleAPIError(error, res);
  }
});

// 获取比赛信息
app.get('/api/premier-league/matches', async (req, res) => {
  const { dateFrom, dateTo, status = 'SCHEDULED' } = req.query;
  const cacheKey = `pl-matches-${status}-${dateFrom}-${dateTo}`;
  
  try {
    // 检查缓存
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        source: 'cache'
      });
    }

    // 计算默认日期范围
    const today = new Date();
    const fromDate = dateFrom || today.toISOString().split('T')[0];
    const toDate = dateTo || new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 尝试 Football-Data.org
    try {
      const response = await axios.get(
        `${API_CONFIG.footballData.baseURL}/competitions/PL/matches`,
        {
          headers: API_CONFIG.footballData.headers,
          params: { dateFrom: fromDate, dateTo: toDate },
          timeout: 10000
        }
      );

      if (response.data && response.data.matches) {
        const matches = response.data.matches.filter(match => 
          status === 'ALL' || match.status === status
        );
        
        cache.set(cacheKey, matches);
        
        return res.json({
          success: true,
          data: matches,
          source: 'football-data.org',
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('Football-Data.org 比赛数据获取失败');
    }

    // 备用：生成模拟比赛数据
    const fallbackData = generateFallbackMatches(status, fromDate, toDate);
    cache.set(cacheKey, fallbackData);
    
    res.json({
      success: true,
      data: fallbackData,
      source: 'fallback',
      message: 'API暂时不可用，使用模拟数据'
    });

  } catch (error) {
    handleAPIError(error, res);
  }
});

// 获取球队详细信息
app.get('/api/premier-league/team/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const cacheKey = `pl-team-${teamId}`;
  
  try {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        source: 'cache'
      });
    }

    // 尝试获取球队信息
    const response = await axios.get(
      `${API_CONFIG.footballData.baseURL}/teams/${teamId}`,
      { headers: API_CONFIG.footballData.headers, timeout: 10000 }
    );

    if (response.data) {
      cache.set(cacheKey, response.data);
      
      res.json({
        success: true,
        data: response.data,
        source: 'football-data.org',
        lastUpdated: new Date().toISOString()
      });
    }

  } catch (error) {
    handleAPIError(error, res);
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  const stats = cache.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache_stats: stats
  });
});

// 清除缓存端点
app.get('/api/clear-cache', (req, res) => {
  cache.flushAll();
  res.json({
    success: true,
    message: '缓存已清除',
    timestamp: new Date().toISOString()
  });
});

// 清除缓存端点
app.post('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({
    success: true,
    message: '缓存已清除'
  });
});

// 生成备用积分榜数据
function generateFallbackStandings() {
  const teams = [
    { name: '曼城', shortName: 'MCI', crest: 'https://resources.premierleague.com/premierleague/badges/t43.png' },
    { name: '阿森纳', shortName: 'ARS', crest: 'https://resources.premierleague.com/premierleague/badges/t3.png' },
    { name: '利物浦', shortName: 'LIV', crest: 'https://resources.premierleague.com/premierleague/badges/t14.png' },
    { name: '阿斯顿维拉', shortName: 'AVL', crest: 'https://resources.premierleague.com/premierleague/badges/t7.png' },
    { name: '托特纳姆热刺', shortName: 'TOT', crest: 'https://resources.premierleague.com/premierleague/badges/t6.png' },
    // ... 添加更多球队
  ];

  return teams.map((team, index) => {
    const playedGames = 25;
    const basePoints = Math.max(5, 65 - (index * 3));
    const won = Math.floor(basePoints / 3);
    const lost = Math.floor((playedGames - won) * 0.4);
    const draw = playedGames - won - lost;
    const points = won * 3 + draw;
    
    return {
      position: index + 1,
      team,
      playedGames,
      won,
      draw,
      lost,
      goalsFor: Math.floor(40 + (20 - index) * 2),
      goalsAgainst: Math.floor(20 + index * 1.5),
      goalDifference: Math.floor((40 + (20 - index) * 2) - (20 + index * 1.5)),
      points
    };
  });
}

// 生成备用比赛数据
function generateFallbackMatches(status, dateFrom, dateTo) {
  const teams = ['曼城', '阿森纳', '利物浦', '切尔西', '曼联', '托特纳姆热刺'];
  const matches = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 3)) {
    const homeTeam = teams[Math.floor(Math.random() * teams.length)];
    let awayTeam = teams[Math.floor(Math.random() * teams.length)];
    while (awayTeam === homeTeam) {
      awayTeam = teams[Math.floor(Math.random() * teams.length)];
    }
    
    matches.push({
      id: `match_${matches.length}`,
      homeTeam: { name: homeTeam },
      awayTeam: { name: awayTeam },
      utcDate: new Date(d).toISOString(),
      status: status,
      competition: { name: '英超联赛' }
    });
  }
  
  return matches;
}

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: error.message
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 英超数据代理服务器启动在端口 ${PORT}`);
  console.log(`📊 API端点：`);
  console.log(`   - 积分榜: http://localhost:${PORT}/api/premier-league/standings`);
  console.log(`   - 比赛信息: http://localhost:${PORT}/api/premier-league/matches`);
  console.log(`   - 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
