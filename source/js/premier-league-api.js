// 新的英超API模块 - 专门处理真实API数据
class PremierLeagueAPI {
  constructor() {
    this.baseURL = this.getAPIBaseURL();
    this.cache = new Map();
    this.cacheTime = 5 * 60 * 1000; // 5分钟缓存
  }

  // 获取API基础URL
  getAPIBaseURL() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api/premier-league';
    } else {
      // 生产环境 - 需要部署代理服务器
      return 'https://your-proxy-server.vercel.app/api/premier-league';
    }
  }

  // 缓存检查
  isDataFresh(key) {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheTime;
  }

  // 通用请求方法
  async request(endpoint) {
    const cacheKey = endpoint;
    
    // 检查缓存
    if (this.isDataFresh(cacheKey)) {
      console.log('📦 从缓存获取数据:', endpoint);
      return this.cache.get(cacheKey).data;
    }

    try {
      console.log('🌐 从API获取数据:', endpoint);
      const url = `${this.baseURL}${endpoint}`;
      console.log('🔗 请求URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });

      console.log('📡 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 API响应数据:', data);
      
      if (data.success) {
        // 缓存数据
        this.cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
        
        console.log('✅ API调用成功:', endpoint);
        return data;
      } else {
        throw new Error(data.message || 'API返回错误');
      }
    } catch (error) {
      console.error('❌ API调用失败:', error.message);
      console.error('❌ 错误详情:', error);
      throw error;
    }
  }

  // 测试连接
  async testConnection() {
    try {
      console.log('🧪 测试API连接...');
      const response = await fetch(`${this.baseURL}/../health`, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 连接测试成功:', data);
        return true;
      } else {
        console.log('❌ 连接测试失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ 连接测试出错:', error);
      return false;
    }
  }

  // 获取积分榜
  async getStandings() {
    return await this.request('/standings');
  }

  // 获取比赛信息
  async getMatches(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/matches?${queryString}` : '/matches';
    return await this.request(endpoint);
  }

  // 获取已结束的比赛
  async getResults() {
    return await this.request('/matches?status=FINISHED');
  }

  // 获取即将到来的比赛
  async getFixtures() {
    return await this.request('/matches?status=SCHEDULED');
  }

  // 清除缓存
  clearCache() {
    this.cache.clear();
    console.log('🗑️ 缓存已清除');
  }
}

// 新的排行榜渲染器
class StandingsRenderer {
  constructor() {
    this.seasonTitleElement = document.getElementById('season-title');
    this.tableBodyElement = document.getElementById('table-body');
    this.timestampElement = document.getElementById('table-updated');
  }

  // 更新赛季标题
  updateSeasonTitle(seasonData) {
    if (!this.seasonTitleElement) return;

    let title = '英超积分榜';
    
    if (seasonData && seasonData.startDate) {
      const startYear = new Date(seasonData.startDate).getFullYear();
      const endYear = startYear + 1;
      title = `${startYear}-${endYear.toString().slice(2)}赛季英超积分榜`;
      
      // 添加轮次信息
      if (seasonData.currentMatchday) {
        title += ` (第${seasonData.currentMatchday}轮)`;
      }
    }

    this.seasonTitleElement.textContent = title;
    console.log('📅 赛季标题已更新:', title);
  }

  // 渲染积分榜
  renderStandings(standings, seasonData = null) {
    if (!this.tableBodyElement) {
      console.error('❌ 找不到table-body元素');
      return;
    }

    // 更新赛季标题
    this.updateSeasonTitle(seasonData);

    // 清空表格
    this.tableBodyElement.innerHTML = '';

    // 渲染每一行
    standings.forEach((team, index) => {
      const row = this.createTeamRow(team, index + 1);
      this.tableBodyElement.appendChild(row);
    });

    // 更新时间戳
    this.updateTimestamp();
    
    console.log(`✅ 积分榜已渲染: ${standings.length}支球队`);
  }

  // 创建球队行
  createTeamRow(team) {
    const row = document.createElement('tr');
    
    // 根据排名添加样式
    if (team.position <= 4) {
      row.classList.add('champions-league');
    } else if (team.position <= 6) {
      row.classList.add('europa-league');
    } else if (team.position >= 18) {
      row.classList.add('relegation');
    }

    row.innerHTML = `
      <td class="position">${team.position}</td>
      <td class="team">
        <div class="team-info">
          <img src="${team.team.crest || '/img/default-team.svg'}" 
               alt="${team.team.name}" 
               class="team-logo" 
               onerror="this.src='/img/default-team.svg'">
          <span class="team-name" title="${team.team.name}">
            ${team.team.shortName || team.team.name}
          </span>
        </div>
      </td>
      <td class="played">${team.playedGames}</td>
      <td class="won">${team.won}</td>
      <td class="draw">${team.draw}</td>
      <td class="lost">${team.lost}</td>
      <td class="goals-for">${team.goalsFor}</td>
      <td class="goals-against">${team.goalsAgainst}</td>
      <td class="goal-difference ${team.goalDifference >= 0 ? 'positive' : 'negative'}">
        ${team.goalDifference > 0 ? '+' : ''}${team.goalDifference}
      </td>
      <td class="points"><strong>${team.points}</strong></td>
    `;

    return row;
  }

  // 更新时间戳
  updateTimestamp() {
    if (this.timestampElement) {
      const now = new Date();
      const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      this.timestampElement.textContent = timeString;
    }
  }

  // 显示错误信息
  showError(message) {
    if (this.tableBodyElement) {
      this.tableBodyElement.innerHTML = `
        <tr>
          <td colspan="10" class="error-message">
            <div class="error-content">
              <span class="error-icon">⚠️</span>
              <span class="error-text">${message}</span>
              <button onclick="window.premierLeague.loadStandings()" class="retry-btn">重试</button>
            </div>
          </td>
        </tr>
      `;
    }
  }

  // 显示加载状态
  showLoading() {
    if (this.tableBodyElement) {
      this.tableBodyElement.innerHTML = `
        <tr>
          <td colspan="10" class="loading-message">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <span>正在加载积分榜数据...</span>
            </div>
          </td>
        </tr>
      `;
    }
  }
}

// 主要的英超页面控制器
class PremierLeagueController {
  constructor() {
    this.api = new PremierLeagueAPI();
    this.standingsRenderer = new StandingsRenderer();
    this.isLoading = false;
    
    console.log('🏈 英超页面控制器已初始化');
  }

  // 加载积分榜
  async loadStandings() {
    if (this.isLoading) {
      console.log('⏳ 正在加载中，跳过重复请求');
      return;
    }

    this.isLoading = true;
    this.standingsRenderer.showLoading();

    try {
      console.log('🚀 开始加载积分榜数据');
      const response = await this.api.getStandings();
      
      console.log('📊 API响应:', response);

      if (response.success && response.data) {
        this.standingsRenderer.renderStandings(response.data, response.season);
        console.log('✅ 积分榜加载成功');
      } else {
        throw new Error('API返回数据格式错误');
      }
    } catch (error) {
      console.error('❌ 加载积分榜失败:', error);
      this.standingsRenderer.showError(`加载失败: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  // 刷新数据
  async refresh() {
    console.log('🔄 刷新数据');
    this.api.clearCache();
    await this.loadStandings();
  }

  // 初始化页面
  async init() {
    console.log('🎯 初始化英超页面');
    
    // 先测试连接
    const connectionOk = await this.api.testConnection();
    if (!connectionOk) {
      console.warn('⚠️ API连接失败，可能需要启动代理服务器');
      this.standingsRenderer.showError('无法连接到数据服务器，请确保代理服务器已启动');
      return;
    }
    
    // 添加刷新按钮事件
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh());
    }

    // 加载初始数据
    await this.loadStandings();
  }
}

// 全局变量
window.premierLeague = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM已加载完成');
  
  try {
    window.premierLeague = new PremierLeagueController();
    await window.premierLeague.init();
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PremierLeagueAPI,
    StandingsRenderer,
    PremierLeagueController
  };
}
