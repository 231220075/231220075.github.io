# 英超数据代理服务器部署指南

## 🚀 部署选项

### 1. Vercel 部署（推荐）
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署代理服务器
vercel --prod
```

### 2. Heroku 部署
```bash
# 安装 Heroku CLI
# 创建应用
heroku create your-pl-proxy

# 设置环境变量
heroku config:set FOOTBALL_DATA_TOKEN=your_token_here

# 部署
git push heroku main
```

### 3. Railway 部署
```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录并部署
railway login
railway deploy
```

## 📋 部署清单

### 必需文件：
- [x] proxy-server.js
- [x] package.json
- [x] .env (包含API密钥)
- [ ] vercel.json (Vercel配置)
- [ ] Procfile (Heroku配置)

### 环境变量：
- [x] FOOTBALL_DATA_TOKEN
- [ ] PORT (云平台自动设置)

## 🔧 部署后修改

部署后需要更新前端代码中的API地址：
```javascript
// 从
const API_BASE = 'http://localhost:3001'

// 改为
const API_BASE = 'https://your-deployed-app.vercel.app'
```

## 💰 成本分析

| 平台 | 免费额度 | 费用 |
|------|---------|------|
| Vercel | 100GB流量/月 | $0 |
| Heroku | 550小时/月 | $0-7/月 |
| Railway | $5免费额度 | $5/月起 |

推荐使用 **Vercel**，免费额度对个人博客足够使用。
