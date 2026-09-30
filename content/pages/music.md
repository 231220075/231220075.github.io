---
title: 🎵 Music Collection
date: 2025-08-09
type: music
layout: music
comments: false
description: 音乐收藏
---

# 🎵 Music Collection

## 🎼 音乐播放器

<div class="music-player-section">
  <div class="player-controls">
    <div class="input-group">
      <label for="song-id">网易云音乐歌曲ID：</label>
      <input type="text" id="song-id" placeholder="例如：28391863" value="28391863">
      <button onclick="loadMusic()">🎵 播放</button>
      <button onclick="clearMusic()">🗑️ 清空</button>
    </div>
  </div>
  
  <div class="music-player-container">
    <iframe id="music-iframe" 
            frameborder="no" 
            border="0" 
            marginwidth="0" 
            marginheight="0" 
            width="100%" 
            height="152" 
            src="//music.163.com/outchain/player?type=2&id=28391863&auto=0&height=132">
    </iframe>
  </div>
  
  <div class="current-playing" id="current-playing">
    <p>🎵 当前播放：歌曲ID 28391863</p>
  </div>
</div>

---

## 📝 我的音乐收藏

<div class="music-list">
  
  <div class="music-item">
    <div class="music-info">
      <h3>🌟 周杰伦 - 以父之名</h3>
      <p class="music-id">歌曲ID: 28391863</p>
      <div class="music-review">
        <h4>简评：</h4>
        <p>经典R&B风格，歌词深沉有力...</p>
        <button class="edit-btn" onclick="editReview(this)">✏️ 编辑</button>
      </div>
    </div>
  </div>
  
  <div class="music-item">
    <div class="music-info">
      <h3>🎯 陈奕迅 - 富士山下</h3>
      <p class="music-id">歌曲ID: 22677433</p>
      <div class="music-review">
        <h4>简评：</h4>
        <p>情感细腻，旋律优美...</p>
        <button class="edit-btn" onclick="editReview(this)">✏️ 编辑</button>
      </div>
    </div>
  </div>
  
  <div class="music-item">
    <div class="music-info">
      <h3>🎵 许嵩 - 有何不可</h3>
      <p class="music-id">歌曲ID: 566599</p>
      <div class="music-review">
        <h4>简评：</h4>
        <p>待添加评价...</p>
        <button class="edit-btn" onclick="editReview(this)">✏️ 编辑</button>
      </div>
    </div>
  </div>
  
  <div class="music-item">
    <div class="music-info">
      <h3>🎶 林俊杰 - 江南</h3>
      <p class="music-id">歌曲ID: 317151</p>
      <div class="music-review">
        <h4>简评：</h4>
        <p>待添加评价...</p>
        <button class="edit-btn" onclick="editReview(this)">✏️ 编辑</button>
      </div>
    </div>
  </div>

</div>

---

## ➕ 添加新音乐

<div class="add-music-section">
  <div class="add-form">
    <input type="text" id="new-song-name" placeholder="歌曲名 - 歌手">
    <input type="text" id="new-song-id" placeholder="网易云音乐ID">
    <textarea id="new-song-review" placeholder="简评（可选）"></textarea>
    <button onclick="addNewMusic()">➕ 添加到收藏</button>
  </div>
</div>

<script>
function loadMusic() {
  const songIdInput = document.getElementById('song-id');
  const iframe = document.getElementById('music-iframe');
  const currentPlaying = document.getElementById('current-playing');
  
  let songId = songIdInput.value.trim();
  
  if (!songId || !/^\d+$/.test(songId)) {
    alert('请输入有效的数字ID！');
    return;
  }
  
  const newSrc = `//music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=132`;
  iframe.src = newSrc;
  currentPlaying.innerHTML = `<p>🎵 当前播放：歌曲ID ${songId}</p>`;
}

function loadPresetMusic(songId) {
  document.getElementById('song-id').value = songId;
  loadMusic();
}

function clearMusic() {
  document.getElementById('song-id').value = '';
  document.getElementById('music-iframe').src = 'about:blank';
  document.getElementById('current-playing').innerHTML = '<p>请输入歌曲ID来播放音乐</p>';
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

function addNewMusic() {
  const name = document.getElementById('new-song-name').value.trim();
  const id = document.getElementById('new-song-id').value.trim();
  const review = document.getElementById('new-song-review').value.trim() || '待添加评价...';
  
  if (!name || !id || !/^\d+$/.test(id)) {
    alert('请填写完整的歌曲信息和有效ID！');
    return;
  }
  
  const musicList = document.querySelector('.music-list');
  const newItem = document.createElement('div');
  newItem.className = 'music-item';
  newItem.innerHTML = `
    <div class="music-info">
      <h3>🎵 ${name}</h3>
      <p class="music-id">歌曲ID: ${id}</p>
      <div class="music-review">
        <h4>简评：</h4>
        <p>${review}</p>
        <button class="edit-btn" onclick="editReview(this)">✏️ 编辑</button>
      </div>
    </div>
  `;
  
  musicList.appendChild(newItem);
  
  // 清空表单
  document.getElementById('new-song-name').value = '';
  document.getElementById('new-song-id').value = '';
  document.getElementById('new-song-review').value = '';
  
  alert('音乐已添加到收藏！');
}

// 回车键支持
document.getElementById('song-id').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') loadMusic();
});
</script>

<style>
.music-player-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.input-group button:hover {
  transform: translateY(-2px);
}

.preset-songs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.preset-songs span {
  font-weight: bold;
}

.preset-songs button {
  padding: 8px 15px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.preset-songs button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.music-player-container {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
}

.current-playing {
  text-align: center;
  font-weight: bold;
}

.music-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.music-item {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-left: 5px solid #667eea;
}

.music-info h3 {
  color: #333;
  margin-bottom: 10px;
}

.music-id {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 15px;
}

.music-review h4 {
  color: #667eea;
  margin-bottom: 10px;
  font-size: 1em;
}

.music-review p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}

.edit-btn {
  background: #f8f9fa;
  color: #667eea;
  border: 1px solid #e9ecef;
  padding: 5px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.edit-btn:hover {
  background: #667eea;
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

.add-music-section {
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
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.add-form button:hover {
  background: #5a6fd8;
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
  
  .preset-songs {
    justify-content: center;
  }
  
  .music-list {
    grid-template-columns: 1fr;
  }
}
</style>
