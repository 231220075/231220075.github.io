---
title: 英超联赛
date: 2025-08-18
type: "premier-league"
layout: "page"
---

<div class="premier-league-container">
  <!-- 页面导航 -->
  <div class="pl-nav">
    <button class="nav-btn active" data-tab="table">积分榜</button>
    <button class="nav-btn" data-tab="fixtures">近期比赛</button>
    <button class="nav-btn" data-tab="results">比赛结果</button>
  </div>

  <!-- 加载提示 -->
  <div id="loading" class="loading">
    <div class="loading-spinner"></div>
    <p>正在加载英超数据...</p>
  </div>

  <!-- 积分榜 -->
  <div id="table-content" class="tab-content active">
    <div class="table-header">
      <h2 id="season-title">英超积分榜</h2>
      <div class="header-controls">
        <p class="last-updated">最后更新: <span id="table-updated"></span></p>
        <button id="refresh-btn" class="refresh-btn">🔄 刷新数据</button>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="league-table">
        <thead>
          <tr>
            <th>排名</th>
            <th>球队</th>
            <th>赛</th>
            <th>胜</th>
            <th>平</th>
            <th>负</th>
            <th>进</th>
            <th>失</th>
            <th>净胜</th>
            <th>积分</th>
          </tr>
        </thead>
        <tbody id="table-body">
          <!-- 积分榜数据将在这里动态填充 -->
        </tbody>
      </table>
    </div>
  </div>

  <!-- 近期比赛 -->
  <div id="fixtures-content" class="tab-content">
    <div class="fixtures-header">
      <h2>近期比赛</h2>
      <p class="last-updated">最后更新: <span id="fixtures-updated"></span></p>
    </div>
    <div id="fixtures-list" class="fixtures-list">
      <!-- 比赛数据将在这里动态填充 -->
    </div>
  </div>

  <!-- 比赛结果 -->
  <div id="results-content" class="tab-content">
    <div class="results-header">
      <h2>最近比赛结果</h2>
      <p class="last-updated">最后更新: <span id="results-updated"></span></p>
    </div>
    <div id="results-list" class="results-list">
      <!-- 结果数据将在这里动态填充 -->
    </div>
  </div>

  <!-- 错误提示 -->
  <div id="error-message" class="error-message" style="display: none;">
    <h3>数据加载失败</h3>
    <p>无法获取最新的英超数据，请稍后再试。</p>
    <button onclick="loadPremierLeagueData()" class="retry-btn">重试</button>
  </div>
</div>

<script src="/js/premier-league-api.js"></script>

<style>
/* 更新的CSS样式 */
.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.refresh-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background: #0056b3;
}

.refresh-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.team-name {
  font-weight: 500;
}

.loading-content, .error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 1.5rem;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8rem;
}

.retry-btn:hover {
  background: #c82333;
}

/* 排名样式 */
.champions-league {
  background-color: rgba(0, 123, 255, 0.1);
}

.europa-league {
  background-color: rgba(255, 193, 7, 0.1);
}

.relegation {
  background-color: rgba(220, 53, 69, 0.1);
}

.positive {
  color: #28a745;
}

.negative {
  color: #dc3545;
}

@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
  
  .team-name {
    font-size: 0.9rem;
  }
}
</style>
