# 英超数据获取解决方案

## 概述
为了解决浏览器CORS限制和免费API的限制，这里提供几种解决方案来获取真实的英超数据。

## 方案一：使用代理服务器 (推荐)

### 1. 创建 Node.js 代理服务器

创建 `proxy-server.js` 文件：

```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// 英超积分榜代理
app.get('/api/premier-league/standings', async (req, res) => {
  try {
    // 使用免费的 football-data.org API
    const response = await axios.get('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: {
        'X-Auth-Token': 'YOUR_API_KEY' // 需要注册获取
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 英超比赛信息代理
app.get('/api/premier-league/matches', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const response = await axios.get(`https://api.football-data.org/v4/competitions/PL/matches`, {
      params: { dateFrom, dateTo },
      headers: {
        'X-Auth-Token': 'YOUR_API_KEY'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

app.listen(3001, () => {
  console.log('代理服务器运行在 http://localhost:3001');
});
```

### 2. 安装依赖
```bash
npm install express cors axios
```

### 3. 更新前端代码
```javascript
// 更新 API 基础URL
this.baseURL = 'http://localhost:3001/api/premier-league';
```

## 方案二：使用免费API服务

### 1. Football-Data.org (推荐)
- 网址：https://www.football-data.org/
- 免费额度：每月10次请求
- 支持：积分榜、比赛、球员数据

### 2. API-Sports
- 网址：https://www.api-football.com/
- 免费额度：每天100次请求
- 支持：实时数据、统计信息

### 3. SportDB
- 网址：https://www.thesportsdb.com/
- 完全免费
- 数据可能不够实时

## 方案三：网页抓取 (谨慎使用)

创建 `scraper.js` 文件：

```javascript
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class PremierLeagueScraper {
  async getStandings() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto('https://www.premierleague.com/tables');
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const standings = [];
      $('.leagueTable tbody tr').each((index, element) => {
        const team = $(element).find('.team .name').text();
        const points = $(element).find('.points').text();
        // ... 解析其他数据
        
        standings.push({
          position: index + 1,
          team: { name: team },
          points: parseInt(points)
        });
      });
      
      return standings;
    } finally {
      await browser.close();
    }
  }
}
```

## 方案四：使用云函数服务

### 1. Vercel Functions
创建 `api/premier-league.js`：

```javascript
export default async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_API_KEY
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
}
```

### 2. Netlify Functions
创建 `netlify/functions/premier-league.js`：

```javascript
exports.handler = async (event, context) => {
  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/PL/standings', {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_API_KEY
      }
    });
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '获取数据失败' })
    };
  }
};
```

## 推荐实施步骤

1. **短期解决方案**：使用当前的模拟数据，确保页面功能正常
2. **中期解决方案**：申请 football-data.org 免费API，设置简单的代理服务器
3. **长期解决方案**：考虑使用云函数或购买付费API服务

## 注意事项

1. **API限制**：免费API通常有请求限制，需要合理使用缓存
2. **CORS问题**：浏览器直接请求外部API会遇到CORS限制
3. **数据更新频率**：足球数据实时性要求高，需要平衡更新频率和API限制
4. **错误处理**：必须有fallback机制，确保页面在API失败时仍可用
5. **法律合规**：使用网页抓取需要遵守网站的robots.txt和服务条款

## 当前实现状态

目前的实现包括：
- ✅ 完整的页面布局和样式
- ✅ 模拟数据展示
- ✅ 自动刷新机制
- ✅ 错误处理和重试
- ✅ 缓存机制
- ✅ 响应式设计
- 🔄 真实API集成 (需要后续实现)

你可以选择任何一种方案来集成真实数据，建议从方案一开始。
