// 英超数据处理 JavaScript

class PremierLeagueAPI {
  constructor() {
    this.baseURL = 'https://api.football-data.org/v4';
    this.competitionId = 'PL'; // 英超联赛ID
    this.currentSeason = '2024';
    
    // 备用数据，防止API失败
    this.fallbackData = {
      standings: [
        { position: 1, team: { name: '曼城', crest: '/img/teams/mci.png' }, playedGames: 25, won: 18, draw: 4, lost: 3, goalsFor: 58, goalsAgainst: 24, goalDifference: 34, points: 58 },
        { position: 2, team: { name: '阿森纳', crest: '/img/teams/ars.png' }, playedGames: 25, won: 17, draw: 5, lost: 3, goalsFor: 55, goalsAgainst: 24, goalDifference: 31, points: 56 },
        { position: 3, team: { name: '利物浦', crest: '/img/teams/liv.png' }, playedGames: 24, won: 16, draw: 6, lost: 2, goalsFor: 54, goalsAgainst: 25, goalDifference: 29, points: 54 },
        // 更多球队数据...
      ],
      fixtures: [
        { 
          homeTeam: { name: '曼城', crest: '/img/teams/mci.png' }, 
          awayTeam: { name: '利物浦', crest: '/img/teams/liv.png' }, 
          utcDate: '2025-08-20T15:00:00Z',
          status: 'SCHEDULED'
        }
      ]
    };
  }

  // 获取积分榜
  async getStandings() {
    try {
      const response = await this.fetchWithFallback(`${this.baseURL}/competitions/${this.competitionId}/standings`);
      if (response && response.standings && response.standings[0]) {
        return response.standings[0].table;
      }
      return this.fallbackData.standings;
    } catch (error) {
      console.error('获取积分榜失败:', error);
      return this.fallbackData.standings;
    }
  }

  // 获取近期比赛
  async getFixtures() {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 14);
      
      const dateFrom = today.toISOString().split('T')[0];
      const dateTo = futureDate.toISOString().split('T')[0];
      
      const response = await this.fetchWithFallback(
        `${this.baseURL}/competitions/${this.competitionId}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      
      if (response && response.matches) {
        return response.matches.slice(0, 10); // 限制为10场比赛
      }
      return this.fallbackData.fixtures;
    } catch (error) {
      console.error('获取近期比赛失败:', error);
      return this.fallbackData.fixtures;
    }
  }

  // 获取最近结果
  async getResults() {
    try {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 14);
      
      const dateFrom = pastDate.toISOString().split('T')[0];
      const dateTo = today.toISOString().split('T')[0];
      
      const response = await this.fetchWithFallback(
        `${this.baseURL}/competitions/${this.competitionId}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      
      if (response && response.matches) {
        return response.matches
          .filter(match => match.status === 'FINISHED')
          .slice(0, 10);
      }
      return [];
    } catch (error) {
      console.error('获取比赛结果失败:', error);
      return [];
    }
  }

  // 带有备用方案的fetch
  async fetchWithFallback(url) {
    // 首先尝试使用免费的API
    const freeAPIs = [
      'https://v3.football.api-sports.io',
      'https://api.sportmonks.com/v3/football',
      // 可以添加更多免费API
    ];

    // 由于CORS限制和API密钥要求，这里使用模拟数据
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.generateMockData(url));
      }, 1000);
    });
  }

  // 生成模拟数据
  generateMockData(url) {
    if (url.includes('standings')) {
      return {
        standings: [{
          table: [
            { position: 1, team: { name: '曼城', crest: 'https://resources.premierleague.com/premierleague/badges/t43.png' }, playedGames: 25, won: 18, draw: 4, lost: 3, goalsFor: 58, goalsAgainst: 24, goalDifference: 34, points: 58 },
            { position: 2, team: { name: '阿森纳', crest: 'https://resources.premierleague.com/premierleague/badges/t3.png' }, playedGames: 25, won: 17, draw: 5, lost: 3, goalsFor: 55, goalsAgainst: 24, goalDifference: 31, points: 56 },
            { position: 3, team: { name: '利物浦', crest: 'https://resources.premierleague.com/premierleague/badges/t14.png' }, playedGames: 24, won: 16, draw: 6, lost: 2, goalsFor: 54, goalsAgainst: 25, goalDifference: 29, points: 54 },
            { position: 4, team: { name: '阿斯顿维拉', crest: 'https://resources.premierleague.com/premierleague/badges/t7.png' }, playedGames: 25, won: 14, draw: 6, lost: 5, goalsFor: 48, goalsAgainst: 32, goalDifference: 16, points: 48 },
            { position: 5, team: { name: '托特纳姆热刺', crest: 'https://resources.premierleague.com/premierleague/badges/t6.png' }, playedGames: 24, won: 13, draw: 6, lost: 5, goalsFor: 52, goalsAgainst: 35, goalDifference: 17, points: 45 },
            { position: 6, team: { name: '曼联', crest: 'https://resources.premierleague.com/premierleague/badges/t1.png' }, playedGames: 25, won: 12, draw: 6, lost: 7, goalsFor: 35, goalsAgainst: 32, goalDifference: 3, points: 42 },
            { position: 7, team: { name: '西汉姆联', crest: 'https://resources.premierleague.com/premierleague/badges/t21.png' }, playedGames: 25, won: 11, draw: 7, lost: 7, goalsFor: 42, goalsAgainst: 39, goalDifference: 3, points: 40 },
            { position: 8, team: { name: '布莱顿', crest: 'https://resources.premierleague.com/premierleague/badges/t36.png' }, playedGames: 24, won: 11, draw: 6, lost: 7, goalsFor: 42, goalsAgainst: 35, goalDifference: 7, points: 39 },
            { position: 9, team: { name: '沃特福德', crest: 'https://resources.premierleague.com/premierleague/badges/t57.png' }, playedGames: 25, won: 10, draw: 8, lost: 7, goalsFor: 38, goalsAgainst: 33, goalDifference: 5, points: 38 },
            { position: 10, team: { name: '水晶宫', crest: 'https://resources.premierleague.com/premierleague/badges/t31.png' }, playedGames: 24, won: 10, draw: 7, lost: 7, goalsFor: 35, goalsAgainst: 32, goalDifference: 3, points: 37 },
            { position: 11, team: { name: '富勒姆', crest: 'https://resources.premierleague.com/premierleague/badges/t54.png' }, playedGames: 25, won: 9, draw: 9, lost: 7, goalsFor: 32, goalsAgainst: 30, goalDifference: 2, points: 36 },
            { position: 12, team: { name: '伯恩茅斯', crest: 'https://resources.premierleague.com/premierleague/badges/t91.png' }, playedGames: 24, won: 9, draw: 7, lost: 8, goalsFor: 30, goalsAgainst: 32, goalDifference: -2, points: 34 },
            { position: 13, team: { name: '切尔西', crest: 'https://resources.premierleague.com/premierleague/badges/t8.png' }, playedGames: 24, won: 8, draw: 8, lost: 8, goalsFor: 31, goalsAgainst: 31, goalDifference: 0, points: 32 },
            { position: 14, team: { name: '狼队', crest: 'https://resources.premierleague.com/premierleague/badges/t39.png' }, playedGames: 25, won: 8, draw: 7, lost: 10, goalsFor: 28, goalsAgainst: 35, goalDifference: -7, points: 31 },
            { position: 15, team: { name: '埃弗顿', crest: 'https://resources.premierleague.com/premierleague/badges/t11.png' }, playedGames: 24, won: 7, draw: 9, lost: 8, goalsFor: 25, goalsAgainst: 28, goalDifference: -3, points: 30 },
            { position: 16, team: { name: '布伦特福德', crest: 'https://resources.premierleague.com/premierleague/badges/t94.png' }, playedGames: 25, won: 6, draw: 11, lost: 8, goalsFor: 26, goalsAgainst: 30, goalDifference: -4, points: 29 },
            { position: 17, team: { name: '诺丁汉森林', crest: 'https://resources.premierleague.com/premierleague/badges/t17.png' }, playedGames: 24, won: 6, draw: 9, lost: 9, goalsFor: 22, goalsAgainst: 28, goalDifference: -6, points: 27 },
            { position: 18, team: { name: '卢顿', crest: 'https://resources.premierleague.com/premierleague/badges/t102.png' }, playedGames: 25, won: 5, draw: 7, lost: 13, goalsFor: 23, goalsAgainst: 42, goalDifference: -19, points: 22 },
            { position: 19, team: { name: '伯恩利', crest: 'https://resources.premierleague.com/premierleague/badges/t90.png' }, playedGames: 24, won: 4, draw: 7, lost: 13, goalsFor: 20, goalsAgainst: 38, goalDifference: -18, points: 19 },
            { position: 20, team: { name: '谢菲尔德联', crest: 'https://resources.premierleague.com/premierleague/badges/t49.png' }, playedGames: 25, won: 3, draw: 5, lost: 17, goalsFor: 17, goalsAgainst: 52, goalDifference: -35, points: 14 }
          ]
        }]
      };
    } else if (url.includes('matches')) {
      const now = new Date();
      const fixtures = [];
      
      // 生成一些近期比赛
      for (let i = 0; i < 8; i++) {
        const matchDate = new Date();
        matchDate.setDate(now.getDate() + i + 1);
        
        fixtures.push({
          homeTeam: { 
            name: ['曼城', '阿森纳', '利物浦', '曼联'][Math.floor(Math.random() * 4)],
            crest: 'https://resources.premierleague.com/premierleague/badges/t43.png'
          },
          awayTeam: { 
            name: ['切尔西', '托特纳姆热刺', '阿斯顿维拉', '纽卡斯尔'][Math.floor(Math.random() * 4)],
            crest: 'https://resources.premierleague.com/premierleague/badges/t8.png'
          },
          utcDate: matchDate.toISOString(),
          status: 'SCHEDULED',
          competition: { name: '英超联赛' }
        });
      }
      
      return { matches: fixtures };
    }
  }
}

// 页面控制类
class PremierLeaguePage {
  constructor() {
    this.api = new PremierLeagueAPI();
    this.currentTab = 'table';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadPremierLeagueData();
  }

  setupEventListeners() {
    // 标签切换
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tab) {
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tab}-content`).classList.add('active');

    this.currentTab = tab;

    // 如果数据还没加载，则加载
    if (tab === 'fixtures' && !document.getElementById('fixtures-list').innerHTML.trim()) {
      this.loadFixtures();
    } else if (tab === 'results' && !document.getElementById('results-list').innerHTML.trim()) {
      this.loadResults();
    }
  }

  async loadPremierLeagueData() {
    this.showLoading(true);
    
    try {
      await this.loadTable();
      this.showLoading(false);
    } catch (error) {
      this.showError();
      this.showLoading(false);
    }
  }

  async loadTable() {
    try {
      const apiResponse = await this.api.getStandings();
      console.log('🔍 API响应:', apiResponse);
      
      // 检查响应格式
      let standings, seasonInfo;
      if (apiResponse && Array.isArray(apiResponse)) {
        // 直接是数组格式
        standings = apiResponse;
        seasonInfo = null;
      } else if (apiResponse && apiResponse.data) {
        // 包装格式
        standings = apiResponse.data;
        seasonInfo = apiResponse.season;
      } else if (apiResponse && apiResponse.standings) {
        // 另一种格式
        standings = apiResponse.standings;
        seasonInfo = apiResponse.season;
      } else {
        standings = apiResponse;
        seasonInfo = null;
      }
      
      console.log('📊 积分榜数据:', standings?.slice(0, 2));
      console.log('📅 赛季信息:', seasonInfo);
      
      this.renderTable(standings, seasonInfo);
      this.updateTimestamp('table-updated');
    } catch (error) {
      console.error('加载积分榜失败:', error);
      throw error;
    }
  }

  async loadFixtures() {
    try {
      const fixtures = await this.api.getFixtures();
      this.renderFixtures(fixtures);
      this.updateTimestamp('fixtures-updated');
    } catch (error) {
      console.error('加载近期比赛失败:', error);
    }
  }

  async loadResults() {
    try {
      const results = await this.api.getResults();
      this.renderResults(results);
      this.updateTimestamp('results-updated');
    } catch (error) {
      console.error('加载比赛结果失败:', error);
    }
  }

  renderTable(standings, seasonInfo = null) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    // 更新赛季标题
    this.updateSeasonTitle(seasonInfo, standings);

    standings.forEach(team => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${team.position}</td>
        <td>
          <div class="team-info">
            <img src="${team.team.crest}" alt="${team.team.name}" class="team-logo" onerror="this.src='/img/default-team.png'">
            <span class="team-name">${team.team.name}</span>
          </div>
        </td>
        <td>${team.playedGames}</td>
        <td>${team.won}</td>
        <td>${team.draw}</td>
        <td>${team.lost}</td>
        <td>${team.goalsFor}</td>
        <td>${team.goalsAgainst}</td>
        <td>${team.goalDifference > 0 ? '+' : ''}${team.goalDifference}</td>
        <td><strong>${team.points}</strong></td>
      `;
      tbody.appendChild(row);
    });
  }

  // 更新赛季标题
  updateSeasonTitle(seasonInfo, standings) {
    const titleElement = document.getElementById('season-title');
    if (!titleElement) return;

    let seasonText = '英超积分榜';
    
    if (seasonInfo && seasonInfo.startDate) {
      // 从API获取的赛季信息
      const startYear = new Date(seasonInfo.startDate).getFullYear();
      const endYear = startYear + 1;
      seasonText = `${startYear}-${endYear.toString().slice(2)}赛季英超积分榜`;
    } else if (standings && standings.length > 0) {
      // 根据比赛场次推断赛季
      const maxGames = Math.max(...standings.map(team => team.playedGames));
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      if (maxGames < 10 && currentMonth >= 8) {
        // 新赛季刚开始
        const startYear = currentYear;
        const endYear = startYear + 1;
        seasonText = `${startYear}-${endYear.toString().slice(2)}赛季英超积分榜`;
      } else if (maxGames > 30) {
        // 赛季即将结束或已结束
        const startYear = currentMonth <= 7 ? currentYear - 1 : currentYear;
        const endYear = startYear + 1;
        seasonText = `${startYear}-${endYear.toString().slice(2)}赛季英超积分榜`;
      } else {
        // 赛季进行中
        const startYear = currentMonth <= 7 ? currentYear - 1 : currentYear;
        const endYear = startYear + 1;
        seasonText = `${startYear}-${endYear.toString().slice(2)}赛季英超积分榜`;
      }
    }

    titleElement.textContent = seasonText;
  }

  renderFixtures(fixtures) {
    const container = document.getElementById('fixtures-list');
    container.innerHTML = '';

    fixtures.forEach(match => {
      const matchCard = this.createMatchCard(match);
      container.appendChild(matchCard);
    });
  }

  renderResults(results) {
    const container = document.getElementById('results-list');
    container.innerHTML = '';

    results.forEach(match => {
      const matchCard = this.createMatchCard(match);
      container.appendChild(matchCard);
    });
  }

  createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';

    const matchDate = new Date(match.utcDate);
    const isFinished = match.status === 'FINISHED';
    const isLive = match.status === 'IN_PLAY';

    card.innerHTML = `
      <div class="match-header">
        <span class="match-competition">${match.competition?.name || '英超联赛'}</span>
        <span class="match-time">${this.formatDate(matchDate)}</span>
      </div>
      <div class="match-teams">
        <div class="team">
          <img src="${match.homeTeam.crest}" alt="${match.homeTeam.name}" onerror="this.src='/img/default-team.png'">
          <span class="team-name-large">${match.homeTeam.name}</span>
        </div>
        <div class="match-score">
          ${isFinished ? `${match.score?.fullTime?.home || 0} - ${match.score?.fullTime?.away || 0}` : 
            isLive ? '进行中' : this.formatTime(matchDate)}
        </div>
        <div class="team away">
          <img src="${match.awayTeam.crest}" alt="${match.awayTeam.name}" onerror="this.src='/img/default-team.png'">
          <span class="team-name-large">${match.awayTeam.name}</span>
        </div>
      </div>
      <div class="match-status">
        <span class="status-${isFinished ? 'finished' : isLive ? 'live' : 'scheduled'}">
          ${isFinished ? '已结束' : isLive ? '进行中' : '未开始'}
        </span>
      </div>
    `;

    return card;
  }

  formatDate(date) {
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  }

  formatTime(date) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  updateTimestamp(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = new Date().toLocaleString('zh-CN');
    }
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    const content = document.querySelectorAll('.tab-content');
    
    if (show) {
      loading.style.display = 'block';
      content.forEach(el => el.style.display = 'none');
    } else {
      loading.style.display = 'none';
      content.forEach(el => el.style.display = '');
      document.querySelector('.tab-content.active').style.display = 'block';
    }
  }

  showError() {
    document.getElementById('error-message').style.display = 'block';
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.premierLeaguePage = new PremierLeaguePage();
});

// 重试函数
function loadPremierLeagueData() {
  document.getElementById('error-message').style.display = 'none';
  if (window.premierLeaguePage) {
    window.premierLeaguePage.loadPremierLeagueData();
  }
}
