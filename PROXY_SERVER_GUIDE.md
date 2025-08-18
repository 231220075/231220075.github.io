# 🚀 英超代理服务器使用指南

## 📋 快速开始

### 1. 安装依赖

首先在博客根目录安装代理服务器依赖：

```bash
# 进入博客目录
cd /Users/macbook/Desktop/code/blog

# 复制代理服务器的package.json
cp proxy-package.json package-proxy.json

# 安装代理服务器依赖
npm install express cors axios node-cache nodemon
```

### 2. 获取API密钥

#### Football-Data.org (推荐)
1. 访问：https://www.football-data.org/client/register
2. 注册免费账户
3. 获取API Token
4. 免费额度：每月10次请求

#### API-Sports (备选)
1. 访问：https://rapidapi.com/api-sports/api/api-football
2. 注册RapidAPI账户
3. 订阅免费计划
4. 获取API Key
5. 免费额度：每天100次请求

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的API密钥
nano .env
```

在`.env`文件中填入：
```bash
FOOTBALL_DATA_TOKEN=你的football_data_token
RAPIDAPI_KEY=你的rapidapi_key
PORT=3001
```

### 4. 启动代理服务器

```bash
# 启动代理服务器
node proxy-server.js

# 或者使用开发模式（自动重启）
npm install -g nodemon
nodemon proxy-server.js
```

你应该看到类似输出：
```
🚀 英超数据代理服务器启动在端口 3001
📊 API端点：
   - 积分榜: http://localhost:3001/api/premier-league/standings
   - 比赛信息: http://localhost:3001/api/premier-league/matches
   - 健康检查: http://localhost:3001/api/health
```

### 5. 测试代理服务器

```bash
# 运行测试脚本
node test-proxy.js
```

成功的测试输出：
```
🧪 测试英超数据代理服务器...

1️⃣ 测试健康检查...
✅ 健康检查通过: healthy
📊 缓存统计: { keys: 0, hits: 0, misses: 0 }

2️⃣ 测试积分榜数据...
✅ 积分榜获取成功
📊 数据源: football-data.org
🏆 前3名球队:
   1. 曼城 - 58分
   2. 阿森纳 - 56分
   3. 利物浦 - 54分

3️⃣ 测试近期比赛数据...
✅ 近期比赛获取成功
📊 数据源: football-data.org
⚽ 找到 5 场比赛
   下场比赛: 曼城 vs 利物浦

4️⃣ 测试缓存功能...
✅ 缓存测试完成
⚡ 缓存响应时间: 15 ms

🎉 所有测试通过！代理服务器工作正常。
```

### 6. 启动博客并测试

```bash
# 在另一个终端窗口启动博客
hexo clean && hexo generate && hexo server

# 访问英超页面
open http://localhost:4000/premier-league/
```

## 🔧 API端点说明

### 积分榜
```
GET /api/premier-league/standings
```
返回2024-25赛季英超积分榜

### 比赛信息
```
GET /api/premier-league/matches?dateFrom=2025-08-18&dateTo=2025-08-25&status=SCHEDULED
```
参数：
- `dateFrom`: 开始日期 (YYYY-MM-DD)
- `dateTo`: 结束日期 (YYYY-MM-DD)  
- `status`: 比赛状态 (`SCHEDULED`, `FINISHED`, `ALL`)

### 球队详情
```
GET /api/premier-league/team/{teamId}
```
获取特定球队的详细信息

### 健康检查
```
GET /api/health
```
检查服务器状态和缓存统计

## 🎮 前端集成

代理服务器启动后，前端会自动检测并使用真实API数据：

1. **自动检测**：前端会检测`localhost:3001`是否可用
2. **智能降级**：如果代理不可用，自动使用模拟数据
3. **状态指示**：页面顶部显示连接状态
4. **手动刷新**：点击"🔄 刷新数据"按钮手动更新

## 📊 数据缓存

代理服务器包含智能缓存机制：

- **缓存时间**：10分钟
- **自动清理**：过期数据自动清理
- **手动清理**：`POST /api/cache/clear`
- **缓存统计**：在健康检查端点查看

## 🐛 常见问题

### 问题1：代理服务器启动失败
```bash
Error: listen EADDRINUSE :::3001
```
**解决方案**：端口被占用，杀死占用进程或更换端口
```bash
# 查找占用进程
lsof -i :3001

# 杀死进程
kill -9 <PID>

# 或更换端口
PORT=3002 node proxy-server.js
```

### 问题2：API密钥无效
```bash
❌ 测试失败: Request failed with status code 401
```
**解决方案**：检查`.env`文件中的API密钥是否正确

### 问题3：CORS错误
```bash
Access to fetch at 'http://localhost:3001' from origin 'http://localhost:4000' has been blocked by CORS policy
```
**解决方案**：代理服务器已配置CORS，确保代理服务器正在运行

### 问题4：网络超时
```bash
❌ API请求失败: timeout of 10000ms exceeded
```
**解决方案**：检查网络连接，或增加超时时间

## 🚀 生产环境部署

### Heroku部署
1. 创建Heroku应用
2. 设置环境变量
3. 部署代码
4. 更新前端API基础URL

### Vercel部署
1. 创建`api/`目录
2. 创建API函数文件
3. 设置环境变量
4. 部署

### Railway部署
1. 连接GitHub仓库
2. 设置环境变量
3. 自动部署

## 💡 高级配置

### 自定义缓存时间
```javascript
// 在proxy-server.js中修改
const cache = new NodeCache({ stdTTL: 1800 }); // 30分钟
```

### 添加新的数据源
```javascript
// 在API_CONFIG中添加新的配置
newAPI: {
  baseURL: 'https://new-api.com',
  headers: { 'Authorization': 'Bearer token' }
}
```

### 启用HTTPS
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(3001);
```

## 📈 监控和日志

### 添加日志
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 性能监控
```javascript
const prometheus = require('prom-client');

// 创建指标
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route']
});
```

现在你的英超页面已经可以使用真实的API数据了！🎉⚽
