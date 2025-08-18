// 增强版英超数据API - 支持多数据源
class EnhancedPremierLeagueAPI {
  constructor() {
    this.dataSources = [
      {
        name: 'BBC Sport',
        baseURL: 'https://push.api.bbci.co.uk/batch',
        standingsPath: '/data/bbc-morph-sport-scores-match-list-data/endDate/{endDate}/startDate/{startDate}/tournament/premier-league/version/2.4.6',
        delay: 500
      },
      {
        name: 'Sky Sports',
        baseURL: 'https://www.skysports.com',
        standingsPath: '/premier-league-table',
        delay: 800
      },
      {
        name: 'ESPN',
        baseURL: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1',
        standingsPath: '/standings',
        delay: 600
      }
    ];
    
    this.cache = {
      standings: null,
      fixtures: null,
      results: null,
      lastUpdate: null
    };
    
    this.cacheTime = 10 * 60 * 1000; // 10分钟缓存
  }

  // 获取缓存数据或从API获取
  async getStandings() {
    if (this.isDataFresh('standings')) {
      return this.cache.standings;
    }

    try {
      // 尝试从实际API获取数据
      const data = await this.fetchFromMultipleSources('standings');
      if (data) {
        this.cache.standings = data;
        this.cache.lastUpdate = Date.now();
        return data;
      }
    } catch (error) {
      console.log('API获取失败，使用模拟数据');
    }

    // 如果API失败，使用模拟数据
    const mockData = this.generateEnhancedMockStandings();
    this.cache.standings = mockData;
    return mockData;
  }

  async getFixtures() {
    if (this.isDataFresh('fixtures')) {
      return this.cache.fixtures;
    }

    try {
      const data = await this.fetchFromMultipleSources('fixtures');
      if (data) {
        this.cache.fixtures = data;
        return data;
      }
    } catch (error) {
      console.log('API获取失败，使用模拟数据');
    }

    const mockData = this.generateEnhancedMockFixtures();
    this.cache.fixtures = mockData;
    return mockData;
  }

  async getResults() {
    if (this.isDataFresh('results')) {
      return this.cache.results;
    }

    try {
      const data = await this.fetchFromMultipleSources('results');
      if (data) {
        this.cache.results = data;
        return data;
      }
    } catch (error) {
      console.log('API获取失败，使用模拟数据');
    }

    const mockData = this.generateEnhancedMockResults();
    this.cache.results = mockData;
    return mockData;
  }

  // 检查缓存是否新鲜
  isDataFresh(type) {
    return this.cache[type] && 
           this.cache.lastUpdate && 
           (Date.now() - this.cache.lastUpdate) < this.cacheTime;
  }

  // 从多个数据源获取数据
  async fetchFromMultipleSources(type) {
    for (const source of this.dataSources) {
      try {
        await this.delay(source.delay);
        
        // 这里由于CORS限制，实际上无法直接访问外部API
        // 在实际部署中，你需要设置代理服务器或使用服务端API
        console.log(`尝试从${source.name}获取数据...`);
        
        // 模拟API调用失败
        throw new Error('CORS限制');
        
      } catch (error) {
        console.log(`从${source.name}获取数据失败:`, error.message);
        continue;
      }
    }
    return null;
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 生成增强的模拟积分榜数据
  generateEnhancedMockStandings() {
    const teams = [
      { name: '曼城', shortName: 'MCI', crest: 'https://resources.premierleague.com/premierleague/badges/t43.png', form: 'WWWDW' },
      { name: '阿森纳', shortName: 'ARS', crest: 'https://resources.premierleague.com/premierleague/badges/t3.png', form: 'WDWWW' },
      { name: '利物浦', shortName: 'LIV', crest: 'https://resources.premierleague.com/premierleague/badges/t14.png', form: 'WWWWD' },
      { name: '阿斯顿维拉', shortName: 'AVL', crest: 'https://resources.premierleague.com/premierleague/badges/t7.png', form: 'WDWLW' },
      { name: '托特纳姆热刺', shortName: 'TOT', crest: 'https://resources.premierleague.com/premierleague/badges/t6.png', form: 'LDWWL' },
      { name: '曼联', shortName: 'MUN', crest: 'https://resources.premierleague.com/premierleague/badges/t1.png', form: 'WLWDD' },
      { name: '西汉姆联', shortName: 'WHU', crest: 'https://resources.premierleague.com/premierleague/badges/t21.png', form: 'DWWLD' },
      { name: '布莱顿', shortName: 'BHA', crest: 'https://resources.premierleague.com/premierleague/badges/t36.png', form: 'WDLWW' },
      { name: '纽卡斯尔联', shortName: 'NEW', crest: 'https://resources.premierleague.com/premierleague/badges/t4.png', form: 'DDWLW' },
      { name: '切尔西', shortName: 'CHE', crest: 'https://resources.premierleague.com/premierleague/badges/t8.png', form: 'LDWDL' },
      { name: '富勒姆', shortName: 'FUL', crest: 'https://resources.premierleague.com/premierleague/badges/t54.png', form: 'DWDDD' },
      { name: '伯恩茅斯', shortName: 'BOU', crest: 'https://resources.premierleague.com/premierleague/badges/t91.png', form: 'LLWDW' },
      { name: '水晶宫', shortName: 'CRY', crest: 'https://resources.premierleague.com/premierleague/badges/t31.png', form: 'DWLLD' },
      { name: '狼队', shortName: 'WOL', crest: 'https://resources.premierleague.com/premierleague/badges/t39.png', form: 'LLDDW' },
      { name: '埃弗顿', shortName: 'EVE', crest: 'https://resources.premierleague.com/premierleague/badges/t11.png', form: 'DLDLW' },
      { name: '布伦特福德', shortName: 'BRE', crest: 'https://resources.premierleague.com/premierleague/badges/t94.png', form: 'DDDLW' },
      { name: '诺丁汉森林', shortName: 'NFO', crest: 'https://resources.premierleague.com/premierleague/badges/t17.png', form: 'LWDLL' },
      { name: '卢顿', shortName: 'LUT', crest: 'https://resources.premierleague.com/premierleague/badges/t102.png', form: 'LLDLW' },
      { name: '伊普斯维奇', shortName: 'IPS', crest: 'https://resources.premierleague.com/premierleague/badges/t40.png', form: 'LLLDD' },
      { name: '莱斯特城', shortName: 'LEI', crest: 'https://resources.premierleague.com/premierleague/badges/t13.png', form: 'LLLLL' }
    ];

    // 生成随机但合理的数据
    return teams.map((team, index) => {
      const playedGames = 25 + Math.floor(Math.random() * 3);
      const basePoints = Math.max(5, 65 - (index * 3) + Math.floor(Math.random() * 6) - 3);
      const won = Math.floor(basePoints / 3) + Math.floor(Math.random() * 3);
      const lost = Math.floor((playedGames - won) * (0.3 + Math.random() * 0.4));
      const draw = playedGames - won - lost;
      const points = won * 3 + draw;
      
      const goalsFor = Math.max(10, Math.floor(40 + (20 - index) * 2 + Math.random() * 20));
      const goalsAgainst = Math.max(8, Math.floor(20 + index * 1.5 + Math.random() * 15));
      
      return {
        position: index + 1,
        team: {
          name: team.name,
          shortName: team.shortName,
          crest: team.crest
        },
        playedGames,
        won,
        draw,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points,
        form: team.form,
        nextFixture: null,
        lastResult: null
      };
    });
  }

  // 生成增强的模拟赛程数据
  generateEnhancedMockFixtures() {
    const teams = ['曼城', '阿森纳', '利物浦', '切尔西', '曼联', '托特纳姆热刺', '纽卡斯尔联', '阿斯顿维拉'];
    const fixtures = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
      const matchDate = new Date();
      matchDate.setDate(now.getDate() + i + 1);
      matchDate.setHours(15 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60));

      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam = teams[Math.floor(Math.random() * teams.length)];
      while (awayTeam === homeTeam) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      }

      fixtures.push({
        id: `fixture_${i}`,
        homeTeam: {
          name: homeTeam,
          crest: `https://resources.premierleague.com/premierleague/badges/t${Math.floor(Math.random() * 50) + 1}.png`
        },
        awayTeam: {
          name: awayTeam,
          crest: `https://resources.premierleague.com/premierleague/badges/t${Math.floor(Math.random() * 50) + 1}.png`
        },
        utcDate: matchDate.toISOString(),
        status: 'SCHEDULED',
        competition: { name: '英超联赛' },
        venue: `${homeTeam} Stadium`,
        matchday: 26 + i,
        referee: `裁判员 ${i + 1}`,
        weather: Math.random() > 0.7 ? '雨天' : '晴天'
      });
    }

    return fixtures;
  }

  // 生成增强的模拟结果数据
  generateEnhancedMockResults() {
    const teams = ['曼城', '阿森纳', '利物浦', '切尔西', '曼联', '托特纳姆热刺', '纽卡斯尔联', '阿斯顿维拉'];
    const results = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
      const matchDate = new Date();
      matchDate.setDate(now.getDate() - i - 1);
      matchDate.setHours(15 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60));

      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam = teams[Math.floor(Math.random() * teams.length)];
      while (awayTeam === homeTeam) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      }

      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 4);

      results.push({
        id: `result_${i}`,
        homeTeam: {
          name: homeTeam,
          crest: `https://resources.premierleague.com/premierleague/badges/t${Math.floor(Math.random() * 50) + 1}.png`
        },
        awayTeam: {
          name: awayTeam,
          crest: `https://resources.premierleague.com/premierleague/badges/t${Math.floor(Math.random() * 50) + 1}.png`
        },
        utcDate: matchDate.toISOString(),
        status: 'FINISHED',
        score: {
          fullTime: {
            home: homeScore,
            away: awayScore
          },
          halfTime: {
            home: Math.floor(homeScore / 2),
            away: Math.floor(awayScore / 2)
          }
        },
        competition: { name: '英超联赛' },
        attendance: Math.floor(30000 + Math.random() * 40000),
        referee: `裁判员 ${i + 1}`
      });
    }

    return results.reverse(); // 最新的比赛在前
  }
}

// 更新主页面类以使用增强API
class EnhancedPremierLeaguePage extends PremierLeaguePage {
  constructor() {
    super();
    this.api = new EnhancedPremierLeagueAPI();
    this.autoRefreshInterval = null;
    this.setupAutoRefresh();
  }

  // 设置自动刷新
  setupAutoRefresh() {
    // 每15分钟自动刷新一次数据
    this.autoRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.refreshCurrentTab();
      }
    }, 15 * 60 * 1000);

    // 页面变为可见时刷新数据
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.refreshCurrentTab();
      }
    });
  }

  // 刷新当前标签的数据
  refreshCurrentTab() {
    switch(this.currentTab) {
      case 'table':
        this.loadTable();
        break;
      case 'fixtures':
        this.loadFixtures();
        break;
      case 'results':
        this.loadResults();
        break;
    }
  }

  // 增强的表格渲染，包含更多信息
  renderTable(standings) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    standings.forEach(team => {
      const row = document.createElement('tr');
      
      // 根据排名添加不同的背景色
      let rankClass = '';
      if (team.position <= 4) rankClass = 'champions-league';
      else if (team.position === 5) rankClass = 'europa-league';
      else if (team.position === 6) rankClass = 'conference-league';
      else if (team.position >= 18) rankClass = 'relegation';
      
      row.className = rankClass;
      row.innerHTML = `
        <td>${team.position}</td>
        <td>
          <div class="team-info">
            <img src="${team.team.crest}" alt="${team.team.name}" class="team-logo" onerror="this.src='/img/default-team.svg'">
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
      
      // 添加tooltip显示近期战绩
      if (team.form) {
        row.title = `近期战绩: ${team.form.split('').join(' ')}`;
      }
      
      tbody.appendChild(row);
    });
  }

  // 增强的比赛卡片创建
  createMatchCard(match) {
    const card = super.createMatchCard(match);
    
    // 添加额外信息
    if (match.venue) {
      const venueInfo = document.createElement('div');
      venueInfo.className = 'match-venue';
      venueInfo.innerHTML = `<small>📍 ${match.venue}</small>`;
      card.appendChild(venueInfo);
    }

    if (match.weather) {
      const weatherInfo = document.createElement('div');
      weatherInfo.className = 'match-weather';
      weatherInfo.innerHTML = `<small>🌤️ ${match.weather}</small>`;
      card.appendChild(weatherInfo);
    }

    if (match.attendance) {
      const attendanceInfo = document.createElement('div');
      attendanceInfo.className = 'match-attendance';
      attendanceInfo.innerHTML = `<small>👥 观众: ${match.attendance.toLocaleString()}</small>`;
      card.appendChild(attendanceInfo);
    }

    return card;
  }

  // 清理资源
  destroy() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
  }
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  if (window.enhancedPremierLeaguePage) {
    window.enhancedPremierLeaguePage.destroy();
  }
});

// 使用增强版本替代原版本
document.addEventListener('DOMContentLoaded', () => {
  window.enhancedPremierLeaguePage = new EnhancedPremierLeaguePage();
});
