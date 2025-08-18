// 生产环境英超数据API - 使用代理服务器
class ProductionPremierLeagueAPI {
  constructor() {
    // 根据环境选择API基础URL
    this.baseURL = this.getAPIBaseURL();
    this.cache = new Map();
    this.cacheTime = 10 * 60 * 1000; // 10分钟缓存
    
    console.log('🚀 使用生产环境API:', this.baseURL);
  }

  // 获取API基础URL
  getAPIBaseURL() {
    // 检测当前环境
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // 本地开发环境
      return 'http://localhost:3001/api/premier-league';
    } else if (hostname.includes('github.io')) {
      // GitHub Pages 生产环境 - 需要部署代理服务器
      return 'https://your-proxy-server.herokuapp.com/api/premier-league';
    } else {
      // 其他环境
      return 'http://localhost:3001/api/premier-league';
    }
  }

  // 通用API请求方法
  async request(endpoint, params = {}) {
    const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
    
    // 检查缓存
    if (this.isDataFresh(cacheKey)) {
      console.log('📦 从缓存获取数据:', endpoint);
      return this.cache.get(cacheKey).data;
    }

    try {
      console.log('🌐 从API获取数据:', endpoint);
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url + this.buildQueryString(params), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 10秒超时
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // 缓存成功的响应
        this.cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
          source: result.source
        });

        console.log('✅ 数据获取成功，来源:', result.source);
        return result.data;
      } else {
        throw new Error(result.message || '数据获取失败');
      }

    } catch (error) {
      console.error('❌ API请求失败:', error.message);
      
      // 如果有缓存数据，即使过期也使用
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        console.log('🔄 使用过期缓存数据');
        return cachedData.data;
      }

      throw error;
    }
  }

  // 构建查询字符串
  buildQueryString(params) {
    const queryParams = new URLSearchParams(params);
    return queryParams.toString() ? `?${queryParams.toString()}` : '';
  }

  // 检查缓存是否新鲜
  isDataFresh(cacheKey) {
    const cachedData = this.cache.get(cacheKey);
    return cachedData && 
           (Date.now() - cachedData.timestamp) < this.cacheTime;
  }

  // 获取积分榜
  async getStandings() {
    try {
      return await this.request('/standings');
    } catch (error) {
      console.error('获取积分榜失败，使用备用数据');
      return this.generateFallbackStandings();
    }
  }

  // 获取近期比赛
  async getFixtures() {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 14);
      
      const params = {
        dateFrom: today.toISOString().split('T')[0],
        dateTo: futureDate.toISOString().split('T')[0],
        status: 'SCHEDULED'
      };

      return await this.request('/matches', params);
    } catch (error) {
      console.error('获取近期比赛失败，使用备用数据');
      return this.generateFallbackFixtures();
    }
  }

  // 获取比赛结果
  async getResults() {
    try {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 14);
      
      const params = {
        dateFrom: pastDate.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0],
        status: 'FINISHED'
      };

      return await this.request('/matches', params);
    } catch (error) {
      console.error('获取比赛结果失败，使用备用数据');
      return this.generateFallbackResults();
    }
  }

  // 获取球队详细信息
  async getTeamDetails(teamId) {
    try {
      return await this.request(`/team/${teamId}`);
    } catch (error) {
      console.error('获取球队详情失败');
      return null;
    }
  }

  // 清除缓存
  clearCache() {
    this.cache.clear();
    console.log('🗑️ 缓存已清除');
  }

  // 获取缓存统计
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // 生成备用积分榜数据
  generateFallbackStandings() {
    const teams = [
      { name: '曼城', shortName: 'MCI', crest: 'https://resources.premierleague.com/premierleague/badges/t43.png' },
      { name: '阿森纳', shortName: 'ARS', crest: 'https://resources.premierleague.com/premierleague/badges/t3.png' },
      { name: '利物浦', shortName: 'LIV', crest: 'https://resources.premierleague.com/premierleague/badges/t14.png' },
      { name: '阿斯顿维拉', shortName: 'AVL', crest: 'https://resources.premierleague.com/premierleague/badges/t7.png' },
      { name: '托特纳姆热刺', shortName: 'TOT', crest: 'https://resources.premierleague.com/premierleague/badges/t6.png' },
      { name: '曼联', shortName: 'MUN', crest: 'https://resources.premierleague.com/premierleague/badges/t1.png' },
      { name: '西汉姆联', shortName: 'WHU', crest: 'https://resources.premierleague.com/premierleague/badges/t21.png' },
      { name: '布莱顿', shortName: 'BHA', crest: 'https://resources.premierleague.com/premierleague/badges/t36.png' },
      { name: '纽卡斯尔联', shortName: 'NEW', crest: 'https://resources.premierleague.com/premierleague/badges/t4.png' },
      { name: '切尔西', shortName: 'CHE', crest: 'https://resources.premierleague.com/premierleague/badges/t8.png' },
      { name: '富勒姆', shortName: 'FUL', crest: 'https://resources.premierleague.com/premierleague/badges/t54.png' },
      { name: '伯恩茅斯', shortName: 'BOU', crest: 'https://resources.premierleague.com/premierleague/badges/t91.png' },
      { name: '水晶宫', shortName: 'CRY', crest: 'https://resources.premierleague.com/premierleague/badges/t31.png' },
      { name: '狼队', shortName: 'WOL', crest: 'https://resources.premierleague.com/premierleague/badges/t39.png' },
      { name: '埃弗顿', shortName: 'EVE', crest: 'https://resources.premierleague.com/premierleague/badges/t11.png' },
      { name: '布伦特福德', shortName: 'BRE', crest: 'https://resources.premierleague.com/premierleague/badges/t94.png' },
      { name: '诺丁汉森林', shortName: 'NFO', crest: 'https://resources.premierleague.com/premierleague/badges/t17.png' },
      { name: '卢顿', shortName: 'LUT', crest: 'https://resources.premierleague.com/premierleague/badges/t102.png' },
      { name: '伊普斯维奇', shortName: 'IPS', crest: 'https://resources.premierleague.com/premierleague/badges/t40.png' },
      { name: '莱斯特城', shortName: 'LEI', crest: 'https://resources.premierleague.com/premierleague/badges/t13.png' }
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
  generateFallbackFixtures() {
    const teams = ['曼城', '阿森纳', '利物浦', '切尔西', '曼联', '托特纳姆热刺'];
    const fixtures = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
      const matchDate = new Date();
      matchDate.setDate(now.getDate() + i + 1);
      matchDate.setHours(15, 0, 0, 0);

      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam = teams[Math.floor(Math.random() * teams.length)];
      while (awayTeam === homeTeam) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      }

      fixtures.push({
        id: `fixture_${i}`,
        homeTeam: { name: homeTeam },
        awayTeam: { name: awayTeam },
        utcDate: matchDate.toISOString(),
        status: 'SCHEDULED',
        competition: { name: '英超联赛' }
      });
    }

    return fixtures;
  }

  // 生成备用结果数据
  generateFallbackResults() {
    const teams = ['曼城', '阿森纳', '利物浦', '切尔西', '曼联', '托特纳姆热刺'];
    const results = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
      const matchDate = new Date();
      matchDate.setDate(now.getDate() - i - 1);
      matchDate.setHours(15, 0, 0, 0);

      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam = teams[Math.floor(Math.random() * teams.length)];
      while (awayTeam === homeTeam) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      }

      results.push({
        id: `result_${i}`,
        homeTeam: { name: homeTeam },
        awayTeam: { name: awayTeam },
        utcDate: matchDate.toISOString(),
        status: 'FINISHED',
        score: {
          fullTime: {
            home: Math.floor(Math.random() * 4),
            away: Math.floor(Math.random() * 4)
          }
        },
        competition: { name: '英超联赛' }
      });
    }

    return results.reverse();
  }
}

// 生产环境页面控制器
class ProductionPremierLeaguePage extends PremierLeaguePage {
  constructor() {
    super();
    // 使用生产环境API替换原来的API
    this.api = new ProductionPremierLeagueAPI();
    this.setupProductionFeatures();
  }

  setupProductionFeatures() {
    // 添加API状态指示器
    this.createAPIStatusIndicator();
    
    // 添加手动刷新按钮
    this.createRefreshButton();
    
    // 设置连接监控
    this.setupConnectionMonitoring();
  }

  // 创建API状态指示器
  createAPIStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'api-status';
    indicator.className = 'api-status';
    indicator.innerHTML = `
      <span class="status-dot"></span>
      <span class="status-text">连接中...</span>
    `;
    
    // 添加到页面顶部
    const container = document.querySelector('.premier-league-container');
    if (container) {
      container.insertBefore(indicator, container.firstChild);
    }
  }

  // 创建手动刷新按钮
  createRefreshButton() {
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'refresh-btn';
    refreshBtn.innerHTML = '🔄 刷新数据';
    refreshBtn.onclick = () => this.manualRefresh();
    
    // 添加到导航区域
    const nav = document.querySelector('.pl-nav');
    if (nav) {
      nav.appendChild(refreshBtn);
    }
  }

  // 手动刷新数据
  async manualRefresh() {
    this.api.clearCache();
    this.updateAPIStatus('refreshing', '刷新中...');
    
    try {
      await this.loadPremierLeagueData();
      this.updateAPIStatus('connected', '数据已更新');
      
      // 3秒后恢复正常状态
      setTimeout(() => {
        this.updateAPIStatus('connected', '已连接');
      }, 3000);
    } catch (error) {
      this.updateAPIStatus('error', '刷新失败');
    }
  }

  // 设置连接监控
  setupConnectionMonitoring() {
    // 监听在线/离线状态
    window.addEventListener('online', () => {
      this.updateAPIStatus('connected', '网络已连接');
      this.loadPremierLeagueData();
    });

    window.addEventListener('offline', () => {
      this.updateAPIStatus('offline', '网络已断开');
    });

    // 初始状态检查
    if (navigator.onLine) {
      this.updateAPIStatus('connected', '已连接');
    } else {
      this.updateAPIStatus('offline', '离线模式');
    }
  }

  // 更新API状态
  updateAPIStatus(status, text) {
    const indicator = document.getElementById('api-status');
    if (indicator) {
      const dot = indicator.querySelector('.status-dot');
      const textEl = indicator.querySelector('.status-text');
      
      // 移除所有状态类
      dot.className = 'status-dot';
      dot.classList.add(`status-${status}`);
      textEl.textContent = text;
    }
  }

  // 重写加载方法以更新状态
  async loadPremierLeagueData() {
    this.updateAPIStatus('loading', '加载数据...');
    
    try {
      await super.loadPremierLeagueData();
      this.updateAPIStatus('connected', '已连接');
    } catch (error) {
      this.updateAPIStatus('error', '连接失败');
      throw error;
    }
  }
}

// 页面加载完成后使用生产环境版本
document.addEventListener('DOMContentLoaded', () => {
  // 检查是否应该使用生产环境API
  const useProductionAPI = window.location.search.includes('production=true') || 
                          window.location.hostname !== 'localhost';
  
  if (useProductionAPI) {
    console.log('🏭 启用生产环境英超API');
    window.premierLeaguePage = new ProductionPremierLeaguePage();
  } else {
    console.log('🧪 使用开发环境英超API');
    // 使用原来的版本
  }
});
