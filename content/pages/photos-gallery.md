---
title: 📸 Photo Gallery
date: 2025-08-11
type: photos
layout: photos
comments: false
description: 图片展览
---

# 📸 Photo Gallery

## 📅 按日期浏览

<div class="date-filter">
  <button class="date-btn active" onclick="showDate('all')">全部</button>
  <button class="date-btn" onclick="showDate('2025-08-11')">2025年8月11日</button>
</div>

<div class="photo-gallery" id="photo-gallery">
  
  <div class="date-section" data-date="2025-08-11">
    <h3>2025年8月11日</h3>
    <div class="photos-grid">
      <img src="/photos-gallery/1.jpg" alt="图片1" onclick="openLightbox(this.src, '图片1')">
      <img src="/photos-gallery/2.jpg" alt="图片2" onclick="openLightbox(this.src, '图片2')">
      <img src="/photos-gallery/3.jpg" alt="图片3" onclick="openLightbox(this.src, '图片3')">
      <img src="/photos-gallery/4.jpg" alt="图片4" onclick="openLightbox(this.src, '图片4')">
      <img src="/photos-gallery/5.jpg" alt="图片5" onclick="openLightbox(this.src, '图片5')">
      <img src="/photos-gallery/6.jpg" alt="图片6" onclick="openLightbox(this.src, '图片6')">
      <img src="/photos-gallery/7.jpg" alt="图片7" onclick="openLightbox(this.src, '图片7')">
      <img src="/photos-gallery/8.jpg" alt="图片8" onclick="openLightbox(this.src, '图片8')">
    </div>
  </div>

</div>

<script>
// 页面加载完成后显示所有图片
document.addEventListener('DOMContentLoaded', function() {
  showDate('all');
});

// 显示指定日期的照片
function showDate(date) {
  const sections = document.querySelectorAll('.date-section');
  const buttons = document.querySelectorAll('.date-btn');
  
  // 更新按钮状态
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // 显示/隐藏照片区块
  sections.forEach(section => {
    if (date === 'all' || section.dataset.date === date) {
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
}

// 打开图片灯箱
function openLightbox(src, alt) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-content">
      <img src="${src}" alt="${alt}">
      <div class="lightbox-info">
        <h4>${alt}</h4>
      </div>
      <button onclick="closeLightbox()" class="close-btn">✖️</button>
    </div>
  `;
  document.body.appendChild(lightbox);
  
  // 点击背景关闭
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
}

// 关闭灯箱
function closeLightbox() {
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    lightbox.remove();
  }
}

// ESC键关闭灯箱
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeLightbox();
  }
});
</script>

<style>
/* 日期筛选按钮 */
.date-filter {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 20px 0;
  justify-content: center;
}

.date-btn {
  padding: 10px 20px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #333;
}

.date-btn:hover, .date-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
}

/* 图片画廊 */
.photo-gallery {
  margin: 30px 0;
}

.date-section {
  margin-bottom: 40px;
}

.date-section h3 {
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 3px solid #667eea;
  text-align: center;
  font-size: 1.5em;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.photos-grid img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.photos-grid img:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* 灯箱样式 */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lightbox-content {
  max-width: 90%;
  max-height: 90%;
  text-align: center;
  position: relative;
}

.lightbox-content img {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.lightbox-info {
  margin-top: 15px;
  color: white;
}

.lightbox-info h4 {
  margin: 0;
  font-size: 1.2em;
  opacity: 0.9;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .photos-grid img {
    height: 150px;
  }
  
  .date-filter {
    flex-direction: column;
    align-items: center;
  }
  
  .date-btn {
    width: 80%;
    max-width: 300px;
  }
  
  .lightbox-content {
    max-width: 95%;
    max-height: 95%;
  }
}

@media (max-width: 480px) {
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .photos-grid img {
    height: 120px;
    border-radius: 10px;
  }
}
</style>
