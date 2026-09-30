---
title: 🎬 Movie Collection
date: 2025-08-09
type: movies
layout: movies
comments: false
description: 电影收藏
---

# 🎬 Movie Collection

## 🎯 视频播放器

<div class="video-player-section">
  <div class="player-controls">
    <div class="input-group">
      <label for="bv-id">B站视频BV号：</label>
      <input type="text" id="bv-id" placeholder="例如：BV1xx411c7mD" value="BV1xx411c7mD">
      <button onclick="loadVideo()">🎬 播放</button>
      <button onclick="clearVideo()">🗑️ 清空</button>
    </div>
  </div>
  
  <div class="video-player-container">
    <iframe id="video-iframe" 
            src="//player.bilibili.com/player.html?bvid=BV1xx411c7mD&page=1" 
            scrolling="no" 
            border="0" 
            frameborder="no" 
            framespacing="0" 
            allowfullscreen="true" 
            width="100%" 
            height="500">
    </iframe>
  </div>
  
  <div class="current-playing" id="current-playing">
    <p>🎬 当前播放：BV1xx411c7mD</p>
  </div>
</div>

---

## 📝 我的电影收藏

<div class="movie-list">
  
  <div class="movie-item">
    <div class="movie-poster">
      <img src="https://img3.doubanio.com/view/photo/s_ratio_poster/public/p480747492.jpg" alt="肖申克的救赎">
    </div>
    <div class="movie-info">
      <h3>🏆 肖申克的救赎</h3>
      <p class="movie-meta">导演：弗兰克·德拉邦特 | 评分：⭐⭐⭐⭐⭐ 9.7</p>
      <div class="movie-review">
        <h4>简评：</h4>
        <p>关于希望、友谊和救赎的经典之作，每一次观看都能发现新的感动...</p>
        <button class="edit-btn" onclick="editReview(this)">✏️ 编辑</button>
      </div>
    </div>
  </div>

  <div class="movie-item">
    <div class="movie-poster">
      <img src="https://img1.doubanio.com/view/photo/s_ratio_poster/public/p2561716440.jpg" alt="你的名字">
    </div>
    <div class="movie-info">
      <h3>✨ 你的名字</h3>
      <p class="movie-meta">导演：新海诚 | 评分：⭐⭐⭐⭐⭐ 8.4</p>
      <div class="movie-review">
        <h4>简评：</h4>
        <p>一部关于时间、命运与爱情的动画杰作，画面美到令人窒息...</p>
        <button class="edit-btn" onclick="editReview(this)">✏️ 编辑</button>
      </div>
    </div>
  </div>

  <div class="movie-item">
    <div class="movie-poster">
      <img src="https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2578014771.jpg" alt="流浪地球">
    </div>
    <div class="movie-info">
      <h3>🚀 流浪地球</h3>
      <p class="movie-meta">导演：郭帆 | 评分：⭐⭐⭐⭐ 7.9</p>
      <div class="movie-review">
        <h4>简评：</h4>
        <p>待添加评价...</p>
        <button class="edit-btn" onclick="editReview(this)">✏️ 编辑</button>
      </div>
    </div>
  </div>

</div>

---

## ➕ 添加新电影

<div class="add-movie-section">
  <div class="add-form">
    <input type="text" id="new-movie-name" placeholder="电影名称">
    <input type="text" id="new-movie-director" placeholder="导演">
    <input type="text" id="new-movie-poster" placeholder="海报图片链接（可选）">
    <textarea id="new-movie-review" placeholder="简评（可选）"></textarea>
    <button onclick="addNewMovie()">➕ 添加到收藏</button>
  </div>
</div>


<script>
function loadVideo() {
  const bvIdInput = document.getElementById('bv-id');
  const iframe = document.getElementById('video-iframe');
  const currentPlaying = document.getElementById('current-playing');
  
  let bvId = bvIdInput.value.trim();
  
  if (!bvId || !/^BV[a-zA-Z0-9]+$/.test(bvId)) {
    alert('请输入有效的BV号格式！（例如：BV1xx411c7mD）');
    return;
  }
  
  const newSrc = `//player.bilibili.com/player.html?bvid=${bvId}&page=1`;
  iframe.src = newSrc;
  currentPlaying.innerHTML = `<p>🎬 当前播放：${bvId}</p>`;
}

function loadPresetVideo(bvId) {
  document.getElementById('bv-id').value = bvId;
  loadVideo();
}

function clearVideo() {
  document.getElementById('bv-id').value = '';
  document.getElementById('video-iframe').src = 'about:blank';
  document.getElementById('current-playing').innerHTML = '<p>请输入BV号来播放视频</p>';
}

function editReview(button) {
  const reviewDiv = button.parentElement;
  const reviewText = reviewDiv.querySelector('p');
  const currentText = reviewText.textContent;
  
  if (button.textContent === '✏️ 编辑') {
    const textarea = document.createElement('textarea');
    textarea.value = currentText;
    textarea.className = 'review-edit';
    reviewDiv.replaceChild(textarea, reviewText);
    button.textContent = '💾 保存';
  } else {
    const textarea = reviewDiv.querySelector('.review-edit');
    const newText = textarea.value.trim() || '待添加评价...';
    const newP = document.createElement('p');
    newP.textContent = newText;
    reviewDiv.replaceChild(newP, textarea);
    button.textContent = '✏️ 编辑';
  }
}

function addNewMovie() {
  const name = document.getElementById('new-movie-name').value.trim();
  const director = document.getElementById('new-movie-director').value.trim();
  const poster = document.getElementById('new-movie-poster').value.trim() || 'https://via.placeholder.com/200x300?text=No+Poster';
  const review = document.getElementById('new-movie-review').value.trim() || '待添加评价...';
  
  if (!name || !director) {
    alert('请填写电影名称和导演！');
    return;
  }
  
  const movieList = document.querySelector('.movie-list');
  const newItem = document.createElement('div');
  newItem.className = 'movie-item';
  newItem.innerHTML = `
    <div class="movie-poster">
      <img src="${poster}" alt="${name}">
    </div>
    <div class="movie-info">
      <h3>🎬 ${name}</h3>
      <p class="movie-meta">导演：${director} | 评分：待评分</p>
      <div class="movie-review">
        <h4>简评：</h4>
        <p>${review}</p>
        <button class="edit-btn" onclick="editReview(this)">✏️ 编辑</button>
      </div>
    </div>
  `;
  
  movieList.appendChild(newItem);
  
  // 清空表单
  document.getElementById('new-movie-name').value = '';
  document.getElementById('new-movie-director').value = '';
  document.getElementById('new-movie-poster').value = '';
  document.getElementById('new-movie-review').value = '';
  
  alert('电影已添加到收藏！');
}

// 回车键支持
document.getElementById('bv-id').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') loadVideo();
});
</script>


<style>
.video-player-section {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  border-radius: 15px;
  padding: 30px;
  margin: 20px 0;
  color: white;
}

.player-controls {
  margin-bottom: 25px;
}

.input-group {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.input-group label {
  font-weight: bold;
  min-width: 150px;
}

.input-group input {
  flex: 1;
  min-width: 200px;
  padding: 10px;
  border: none;
  border-radius: 8px;
}

.input-group button {
  padding: 10px 20px;
  background: white;
  color: #ff9a9e;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.input-group button:hover {
  transform: translateY(-2px);
}

.preset-videos {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.preset-videos span {
  font-weight: bold;
}

.preset-videos button {
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.preset-videos button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.video-player-container {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
}

.current-playing {
  text-align: center;
  font-weight: bold;
}

.movie-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
  margin: 30px 0;
}

.movie-item {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  display: flex;
}

.movie-item:hover {
  transform: translateY(-5px);
}

.movie-poster {
  width: 150px;
  flex-shrink: 0;
}

.movie-poster img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.movie-info {
  padding: 20px;
  flex: 1;
}

.movie-info h3 {
  color: #333;
  margin-bottom: 10px;
}

.movie-meta {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 15px;
}

.movie-review h4 {
  color: #ff9a9e;
  margin-bottom: 10px;
  font-size: 1em;
}

.movie-review p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}

.edit-btn {
  background: #f8f9fa;
  color: #ff9a9e;
  border: 1px solid #e9ecef;
  padding: 5px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.edit-btn:hover {
  background: #ff9a9e;
  color: white;
}

.review-edit {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  resize: vertical;
  min-height: 60px;
}

.add-movie-section {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 25px;
  margin: 30px 0;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.add-form input, .add-form textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.add-form textarea {
  resize: vertical;
  min-height: 60px;
}

.add-form button {
  background: #ff9a9e;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.add-form button:hover {
  background: #ff8a90;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .input-group label {
    min-width: auto;
  }
  
  .preset-videos {
    justify-content: center;
  }
  
  .movie-list {
    grid-template-columns: 1fr;
  }
  
  .movie-item {
    flex-direction: column;
  }
  
  .movie-poster {
    width: 100%;
  }
  
  .movie-poster img {
    height: 300px;
  }
}
</style>
