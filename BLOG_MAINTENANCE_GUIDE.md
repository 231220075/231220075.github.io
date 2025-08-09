# 📚 Hexo 博客完整维护指南

> 适用于 GitHub Pages + Butterfly 主题的 Hexo 博客

---

## 📋 目录

- [环境配置](#环境配置)
- [日常写作流程](#日常写作流程)
- [本地预览与调试](#本地预览与调试)
- [部署与发布](#部署与发布)
- [主题配置与优化](#主题配置与优化)
- [便捷脚本](#便捷脚本)
- [维护任务](#维护任务)
- [故障排查](#故障排查)
- [检查清单](#检查清单)

---

## 🛠️ 环境配置

### 1. 检查项目状态

```bash
cd /Users/macbook/Desktop/code/blog
ls -la

# 检查关键文件
ls -la | grep -E "(package\.json|_config\.yml|source/)"

# 检查 Hexo 版本
cat package.json | grep hexo
```

### 2. 安装依赖

```bash
# 安装项目依赖
npm install

# 安装全局 Hexo CLI（推荐）
npm install -g hexo-cli

# 验证安装
hexo version
```

### 3. 安装必要插件

```bash
# 部署插件
npm install hexo-deployer-git --save

# SEO 插件
npm install hexo-generator-sitemap --save
npm install hexo-generator-searchdb --save
npm install hexo-generator-feed --save

# 性能优化插件（可选，可能有兼容性问题）
# npm install hexo-all-minifier --save
# npm install hexo-imagemin --save
```

---

## ✍️ 日常写作流程

### 1. 创建新文章

```bash
# 方法一：使用 Hexo 命令
hexo new "文章标题"

# 方法二：使用脚本
./new-post.sh "文章标题"

# 方法三：手动创建
touch source/_posts/new-article.md
```

### 2. 文章模板格式

```markdown
---
title: 文章标题
date: 2025-08-07 10:00:00
updated: 2025-08-07 10:00:00
tags: 
  - 标签1
  - 标签2
categories: 
  - 分类名
description: 文章简介
cover: /images/cover.jpg
top: false        # 是否置顶
comments: true    # 是否开启评论
toc: true        # 是否显示目录
mathjax: false   # 是否开启数学公式
copyright: true  # 是否显示版权信息
---

# 文章标题

文章正文内容...

## 二级标题

### 三级标题

- 列表项
- 列表项

```代码块
console.log("Hello World");
```

![图片描述](/images/image.jpg)
```

### 3. 图片管理

```bash
# 创建图片目录
mkdir -p source/images

# 复制图片到目录
cp /path/to/your/image.jpg source/images/

# 在文章中引用
![图片描述](/images/image.jpg)
```

---

## 🔍 本地预览与调试

### 1. 基本预览流程

```bash
cd /Users/macbook/Desktop/code/blog

# 清理缓存
hexo clean

# 生成静态文件
hexo generate
# 简写：hexo g

# 启动本地服务器
hexo server
# 简写：hexo s

# 一键执行（推荐）
hexo clean && hexo g && hexo s

# 使用不同端口
hexo server -p 4001
```

### 2. 预览地址

- 本地地址：`http://localhost:4000`
- 替代端口：`http://localhost:4001`

### 3. 实时预览

```bash
# 监听文件变化，自动重新生成
hexo server --watch

# 生成草稿预览
hexo server --draft
```

---

## 🚀 部署与发布

### 1. 配置部署设置

编辑 `_config.yml` 文件：

```yaml
# 部署配置
deploy:
  type: git
  repo: https://github.com/231220075/231220075.github.io.git
  branch: main
  message: "Site updated: {{ now('YYYY-MM-DD HH:mm:ss') }}"
```

### 2. 部署流程

```bash
# 生成并部署
hexo clean && hexo generate && hexo deploy
# 简写：hexo clean && hexo g && hexo d

# 或使用项目脚本
./deploy.sh
```

### 3. 华为云域名配置

```bash
# 创建 CNAME 文件
echo "yourdomain.com" > source/CNAME

# 华为云 DNS 设置
# 记录类型: CNAME
# 主机记录: www 或 @
# 记录值: 231220075.github.io
```

---

## � 多媒体内容

### 音乐播放

#### 使用 APlayer + Meting
```markdown
# 播放网易云音乐单曲
{% meting "歌曲ID" "netease" "song" "theme:#FF6B6B" %}

# 播放歌单
{% meting "歌单ID" "netease" "playlist" "autoplay:false" %}

# 播放专辑
{% meting "专辑ID" "netease" "album" %}
```

#### HTML5 音频
```html
<audio controls>
  <source src="/music/song.mp3" type="audio/mpeg">
  您的浏览器不支持音频播放。
</audio>
```

### 视频播放

#### 本地视频
```html
<video width="100%" controls>
  <source src="/videos/demo.mp4" type="video/mp4">
  <source src="/videos/demo.webm" type="video/webm">
  您的浏览器不支持视频播放。
</video>
```

#### YouTube 视频
```html
<iframe width="100%" height="400" 
        src="https://www.youtube.com/embed/VIDEO_ID" 
        frameborder="0" 
        allowfullscreen>
</iframe>
```

#### Bilibili 视频
```html
<iframe src="//player.bilibili.com/player.html?bvid=BV号&page=1" 
        width="100%" 
        height="400" 
        scrolling="no" 
        border="0" 
        frameborder="no" 
        allowfullscreen="true">
</iframe>
```

#### 响应式视频容器
```html
<div class="video-container">
  <iframe src="视频地址" frameborder="0" allowfullscreen></iframe>
</div>

<style>
.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  height: 0;
  overflow: hidden;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
```

## �🎨 自定义样式

### 1. Butterfly 主题基本配置

编辑 `_config.butterfly.yml`：

```yaml
# 基本信息
site:
  name: Summer Flower
  slogon: forever的技术博客

# 头像
avatar:
  img: /images/avatar.jpg
  effect: true

# 导航菜单
menu:
  首页: / || fas fa-home
  归档: /archives/ || fas fa-archive
  标签: /tags/ || fas fa-tags
  分类: /categories/ || fas fa-folder-open
  关于: /about/ || fas fa-heart

# 社交链接
social:
  fab fa-github: https://github.com/231220075 || Github
  fas fa-envelope: mailto:231220075@smail.nju.edu.cn || Email

# 评论系统
comments:
  use: gitalk
  gitalk:
    client_id: your_client_id
    client_secret: your_client_secret
    repo: blog-comments
    owner: 231220075
    admin: 231220075

# 网站统计
google_analytics: your_ga_id
baidu_analytics: your_baidu_id

# 不蒜子访问统计
busuanzi:
  site_uv: true
  site_pv: true
  page_pv: true
```

### 2. SEO 配置

在 `_config.yml` 中添加：

```yaml
# SEO 配置
sitemap:
  path: sitemap.xml
  
search:
  path: search.xml
  field: post
  content: true

# RSS 订阅
feed:
  enable: true
  type: atom
  path: atom.xml
  limit: 20

# URL 配置
url: https://yourdomain.com  # 你的域名
root: /
permalink: :year/:month/:day/:title/
```

---

## 🛠️ 便捷脚本

### 1. 创建新文章脚本

```bash
cat > new-post.sh << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
    echo "用法: ./new-post.sh '文章标题'"
    exit 1
fi

cd /Users/macbook/Desktop/code/blog
hexo new "$1"
echo "✅ 文章已创建: source/_posts/$1.md"
echo "🚀 开始编辑..."
code "source/_posts/$1.md"
EOF
chmod +x new-post.sh
```

### 2. 预览脚本

```bash
cat > preview.sh << 'EOF'
#!/bin/bash
cd /Users/macbook/Desktop/code/blog
echo "🧹 清理缓存..."
hexo clean
echo "🏗️ 生成静态文件..."
hexo generate
echo "🚀 启动本地服务器..."
echo "📱 访问地址: http://localhost:4000"
echo "❌ 按 Ctrl+C 停止服务器"
hexo server
EOF
chmod +x preview.sh
```

### 3. 部署脚本

```bash
cat > deploy.sh << 'EOF'
#!/bin/bash
cd /Users/macbook/Desktop/code/blog

echo "🧹 清理缓存..."
hexo clean

echo "🏗️ 生成静态文件..."
hexo generate

echo "🚀 部署到 GitHub Pages..."
hexo deploy

echo "✅ 部署完成!"
echo "🌐 访问地址: https://231220075.github.io"
echo "🔗 自定义域名: https://yourdomain.com"
EOF
chmod +x deploy.sh
```

### 4. 快速备份脚本

```bash
cat > backup.sh << 'EOF'
#!/bin/bash
cd /Users/macbook/Desktop/code/blog

echo "📦 备份博客源码..."
git add .
git commit -m "backup: $(date '+%Y-%m-%d %H:%M:%S')"

echo "☁️ 推送到远程仓库..."
git push origin main

echo "🗑️ 清理缓存文件..."
hexo clean

echo "✅ 备份完成!"
EOF
chmod +x backup.sh
```

---

## 📅 维护任务

### 日常任务（写作时）

```bash
# 1. 创建新文章
./new-post.sh "今天学到的内容"

# 2. 编辑文章内容
# VS Code 会自动打开文件

# 3. 本地预览检查
./preview.sh

# 4. 确认无误后部署
./deploy.sh
```

### 每周任务

```bash
# 1. 备份源码
./backup.sh

# 2. 检查依赖更新
npm outdated
npm update

# 3. 清理缓存
hexo clean
rm -rf .deploy_git/

# 4. 检查网站状态
curl -I https://231220075.github.io
```

### 每月任务

```bash
# 1. 更新 Hexo
npm install hexo@latest

# 2. 更新主题
npm install hexo-theme-butterfly@latest

# 3. 完整备份
tar -czf blog-backup-$(date +%Y%m%d).tar.gz /Users/macbook/Desktop/code/blog/

# 4. 性能检查
# 使用 Google PageSpeed Insights
# 检查网站加载速度
```

---

## 🔧 故障排查

### 常见问题解决

#### 1. 端口被占用
```bash
# 查看占用端口的进程
lsof -i :4000

# 使用不同端口
hexo server -p 4001

# 杀死占用端口的进程
kill -9 $(lsof -t -i:4000)
```

#### 2. 生成失败
```bash
# 完全清理重新生成
rm -rf .deploy_git/ public/ db.json
hexo clean && hexo generate

# 检查文章格式错误
hexo generate --debug
```

#### 3. 部署失败
```bash
# 检查 Git 配置
git config --global user.name "forever"
git config --global user.email "231220075@smail.nju.edu.cn"

# 重新配置部署仓库
git remote -v
git remote set-url origin https://github.com/231220075/231220075.github.io.git
```

#### 4. 主题加载失败
```bash
# 重新安装主题
npm uninstall hexo-theme-butterfly
npm install hexo-theme-butterfly

# 检查主题配置文件
ls -la _config.butterfly.yml
```

#### 5. 图片不显示
```bash
# 检查图片路径
ls source/images/

# 确认图片引用格式
# 正确格式：![描述](/images/image.jpg)
# 错误格式：![描述](images/image.jpg)
```

#### 6. 安全漏洞问题
```bash
# 检查安全漏洞
npm audit

# 尝试自动修复
npm audit fix

# 强制修复（可能有破坏性变更）
npm audit fix --force

# 删除有问题的包（如果不是必需的）
npm uninstall hexo-helper-live2d
```

#### 7. 插件安装失败
```bash
# 如果 hexo-imagemin 安装失败，可以跳过
# 这个插件需要系统编译工具，可能在某些系统上失败

# 安装系统编译工具（macOS）
xcode-select --install

# 或者使用替代方案
npm install hexo-filter-optimize --save
```

### 性能优化

```bash
# 安装基础压缩插件
npm install hexo-filter-optimize --save

# 启用压缩（在 _config.yml 中）
filter_optimize:
  enable: true
  css: true
  js: true
  html: true
```

---

## 📋 检查清单

### 📝 写作前检查
- [ ] 确认开发环境正常
- [ ] 本地服务器可以启动
- [ ] 上一篇文章已正确部署

### ✍️ 写作时检查
- [ ] Front Matter 格式正确
- [ ] 标签和分类合理
- [ ] 图片路径正确
- [ ] 链接可正常访问

### 🔍 发布前检查
- [ ] 本地预览显示正常
- [ ] 文章内容无错误
- [ ] 图片正常显示
- [ ] 代码块格式正确

### 🚀 发布后检查
- [ ] 网站可正常访问
- [ ] 新文章显示在首页
- [ ] RSS 订阅更新
- [ ] 搜索功能正常

### 📅 定期维护检查

#### 每周
- [ ] 备份源码到 Git
- [ ] 检查网站访问速度
- [ ] 更新必要依赖
- [ ] 清理缓存文件

#### 每月
- [ ] 更新 Hexo 版本
- [ ] 更新主题版本
- [ ] 检查 SEO 设置
- [ ] 分析访问统计
- [ ] 完整项目备份

#### 每季度
- [ ] 检查域名解析
- [ ] 更新评论系统配置
- [ ] 优化网站性能
- [ ] 整理文章分类标签
- [ ] 更新关于页面信息

---

## 🎯 完整工作流程示例

### 日常写作流程

```bash
# 1. 进入项目目录
cd /Users/macbook/Desktop/code/blog

# 2. 创建新文章
./new-post.sh "学习 Rust 所有权机制的心得"

# 3. 编写文章内容
# 在自动打开的 VS Code 中编写

# 4. 本地预览
./preview.sh
# 在浏览器中查看 http://localhost:4000

# 5. 确认无误后部署
./deploy.sh

# 6. 备份源码
./backup.sh
```

### 周末维护流程

```bash
# 1. 检查项目状态
cd /Users/macbook/Desktop/code/blog
git status

# 2. 更新依赖
npm outdated
npm update

# 3. 清理缓存
hexo clean
rm -rf .deploy_git/

# 4. 备份项目
./backup.sh

# 5. 测试网站功能
./preview.sh
```

---

## 📞 获取帮助

### 官方文档
- [Hexo 官方文档](https://hexo.io/docs/)
- [Butterfly 主题文档](https://butterfly.js.org/)
- [GitHub Pages 文档](https://docs.github.com/pages)

### 社区资源
- [Hexo GitHub Issues](https://github.com/hexojs/hexo/issues)
- [Butterfly 主题 GitHub](https://github.com/jerryc127/hexo-theme-butterfly)

### 常用命令速查

```bash
# Hexo 基本命令
hexo init [folder]    # 初始化项目
hexo new [title]      # 创建新文章
hexo generate         # 生成静态文件
hexo server           # 启动本地服务器
hexo deploy           # 部署网站
hexo clean            # 清理缓存
hexo list             # 列出信息
hexo version          # 显示版本信息

# 常用组合命令
hexo clean && hexo g && hexo s    # 清理+生成+预览
hexo clean && hexo g && hexo d    # 清理+生成+部署

# Git 配置（解决部署问题）
git config --global http.postBuffer 524288000      # 增加缓冲区
git config --global http.maxRequestBuffer 524288000 # 增加请求缓冲区
```

### 常见问题排查

#### 1. 部署失败

**HTTP 400 RPC 错误解决方案：**
```bash
# 增加 Git HTTP 缓冲区大小（解决大文件推送问题）
git config --global http.postBuffer 524288000
git config --global http.maxRequestBuffer 524288000

# 检查 _config.yml 部署配置，确保使用正确的字段名
deploy:
  type: git
  repo: https://github.com/username/username.github.io.git  # 使用 repo 而不是 repository
  branch: main
```

**其他部署问题：**
- 检查 GitHub 仓库地址是否正确
- 确认网络连接稳定
- 确保 hexo-deployer-git 插件已正确安装

#### 2. 本地预览问题
```bash
# 清理缓存后重新生成
hexo clean
hexo generate
hexo server

# 检查端口占用
lsof -ti:4000
kill -9 $(lsof -ti:4000)  # 释放 4000 端口
```

#### 3. 插件安装失败
```bash
# 清理 npm 缓存
npm cache clean --force

# 重新安装 node_modules
rm -rf node_modules package-lock.json
npm install

# 单独安装失败的插件
npm install hexo-plugin-name --save
```

---

## 🎉 结语

这份指南涵盖了 Hexo 博客从环境搭建到日常维护的完整流程。建议：

1. **收藏此指南**：作为日常操作的参考手册
2. **逐步实践**：从基本操作开始，逐渐掌握高级功能
3. **定期备份**：养成良好的备份习惯
4. **持续学习**：关注 Hexo 和主题的更新

祝您博客写作愉快！🌸

---

*最后更新时间：2025-08-07*
*维护者：forever (231220075@smail.nju.edu.cn)*
