# Summer Flower · 博客使用手册

> 网站地址：**https://231220075.github.io**
> 这是一个纯静态网站，由自己写的生成器构建，**不再依赖 Hexo**，也不需要安装一堆 npm 包。

---

## 一、上线（只需要做一次）

在终端里执行：

```bash
cd ~/Desktop/code/blog
./blog setup
```

这个命令会连接 GitHub 仓库、构建一次、提交并推送。过程中会提示你确认覆盖远程分支——**确认即可**：旧网页已备份在本地 `.hexo-backup/` 目录，脚本还会自动在远程建一个 `legacy-hexo-site` 分支做第二份备份。

推送完成后，脚本会自动检查并切换 GitHub Pages 的构建方式（需要本机 `gh` 已登录，已登录就全自动）。如果提示切换失败，手动做一次即可：

1. 打开 https://github.com/231220075/231220075.github.io/settings/pages
2. 找到 **Build and deployment → Source**
3. 选择 **GitHub Actions**（不要选 "Deploy from a branch"）
4. 保存

完成后网站会在 1 分钟内自动上线。以后每次 `./blog publish`，GitHub 都会自动重新构建部署，你不用再管。

> ⚠️ 从「Deploy from a branch」切到「GitHub Actions」的瞬间，旧网站会短暂不可访问，等第一次自动部署完成（约 1 分钟）就恢复。这是唯一一次需要动 GitHub 设置。

---

## 二、日常写作：三个命令就够了

打开「终端」，进入博客目录：

```bash
cd ~/Desktop/code/blog
```

### 1. 写一篇新文章

```bash
./blog new "我的新文章标题"
```

会在 `content/posts/` 里生成一个 `.md` 文件，用任何编辑器打开写就行。
推荐 [Typora](https://typora.io)（所见即所得）或 VS Code（免费）。

### 2. 本地看效果

```bash
./blog dev
```

浏览器打开 http://localhost:4000 。
**改文章保存后网页会自动刷新**，看够了按 `Ctrl + C` 退出。

### 3. 发布上线

```bash
./blog publish
```

自动完成「构建 → 提交 → 推送」，等 1 分钟左右网站就更新了。

---

## 三、其它命令

| 命令 | 作用 |
| --- | --- |
| `./blog status` | 看看有没有还没发布的改动 |
| `./blog build` | 只构建，不发布（产物在 `public/`） |
| `./blog rm "文章标题"` | 删除文章（会先备份到 `.trash/`） |
| `./blog clean` | 清空构建产物 |
| `./blog setup` | 首次连接 GitHub 仓库（只跑一次） |
| `./blog help` | 查看帮助 |

---

## 四、目录结构

```
blog/
├── blog                    ← 你用的命令入口
├── site.config.mjs         ← 网站配置（站名、导航、社交链接…）
├── content/
│   ├── posts/              ← 所有文章（Markdown）
│   └── pages/              ← 固定页面：关于、友链、音乐、游戏…
├── assets/
│   ├── css/style.css       ← 主题样式
│   ├── js/main.js          ← 主题交互
│   ├── photos/             ← 图片（文章配图、头像）
│   ├── img/
│   └── photos-gallery/     ← 相册大图
├── static/                 ← 原样复制的文件（404 页、manifest…）
├── tools/
│   ├── markdown.mjs        ← Markdown 渲染器
│   ├── build.mjs           ← 站点生成器
│   └── server.mjs          ← 本地预览服务器
├── .github/workflows/      ← GitHub 自动部署配置
└── public/                 ← 构建产物（自动生成，不用管）
```

---

## 五、写文章格式说明

文件开头的一段 `---` 之间叫「front matter」，用来写文章信息：

````markdown
---
title: 我的新文章标题
date: 2026-09-30 12:00:00
tags:
  - 技术
  - Rust
categories:
  - 学习记录
description: 一句话摘要，会显示在首页列表里
cover: /photos/avatar.jpg
---

正文从这里开始。

## 二级标题

支持 **加粗**、*斜体*、`行内代码`、[链接](https://example.com)。

插入图片：

![](/photos/我的图片.jpg)

插入代码：

```javascript
console.log('hello')
```
````

**可用的字段**（都可以不写）：

| 字段 | 说明 |
| --- | --- |
| `title` | 文章标题，不写就用文件名 |
| `date` | 发布时间，决定排序位置 |
| `tags` | 标签，一行一个，前面加 `- ` |
| `categories` | 分类，同上 |
| `description` | 摘要，显示在首页卡片上 |
| `cover` | 封面图，显示在首页卡片右侧 |
| `comments` | 设为 `false` 可关闭该文章的评论区 |

> 文章网址按 `年份/月/日/文件名/` 生成，修改文件名会导致网址变化，**发布后尽量不要改文件名**。

---

## 六、常见修改

### 改网站标题 / 副标题 / 导航菜单

编辑 `site.config.mjs`，改完 `./blog publish`。

```js
title: 'Summer Flower',
subtitle: '你想要的一句话简介',
nav: [
  { name: '首页', url: '/', icon: 'home' },
  // 增删这里的条目即可调整导航栏
  // 图标可选：home compass music film camera gamepad robot archive
  //          folder tag link message user book globe
],
```

### 加图片

1. 把图片放进 `assets/photos/`
2. 文章里写 `![](/photos/文件名.jpg)`
3. `./blog publish`

### 新增一个固定页面（比如「项目」）

1. 复制 `content/pages/about.md` 为 `content/pages/projects.md`
2. 修改里面的标题和内容
3. 在 `site.config.mjs` 的 `nav` 里加一行：`{ name: '项目', url: '/projects/', icon: 'book' }`

### 换头像

替换 `assets/photos/avatar.jpg` 即可（文件名保持不变）。

### 改主题配色

编辑 `assets/css/style.css` 最上面的 `:root { --accent: … }`，
或在 `site.config.mjs` 里改 `accent` 字段。

---

## 七、出问题了怎么办

| 现象 | 原因与处理 |
| --- | --- |
| `./blog publish` 推送失败，提示历史不一致 | 脚本会自动检测并询问是否覆盖远程分支；确认后它会先备份再覆盖，无需手敲 git 命令 |
| `./blog publish` 提示没有权限 | 检查网络；确认已登录 GitHub（`gh auth status`，或配置 SSH key / token） |
| 推送卡住不动 | 首次推送要上传全部图片（十几 MB），慢是正常的，脚本会显示进度，别按 Ctrl+C |
| 本地预览看不到新内容 | 按 `Ctrl+C` 退出后重新运行 `./blog dev` |
| 网页样式错乱 | 强制刷新：`Cmd + Shift + R` |
| 推送后网站没更新 | 打开 https://github.com/231220075/231220075.github.io/actions 看构建日志 |
| 网站打开是 404 | GitHub Pages 的 Source 不是 GitHub Actions，见本文第一节 |
| 想找回旧的 Hexo 版网页 | 本地 `.hexo-backup/`，或 GitHub 上的 `legacy-hexo-site` 分支 |
| 想撤销一次发布 | `git log --oneline` 找到上一次的提交号，`git revert <提交号>` 后 `./blog publish` |

---

## 八、这套方案为什么不依赖 Hexo 了

| 项目 | 以前（Hexo） | 现在 |
| --- | --- | --- |
| 依赖 | 30+ 个 npm 包，环境一换就跑不起来 | **零依赖**，只用 Node.js 原生模块 |
| 构建 | `hexo clean && hexo generate && hexo deploy` | `./blog publish` 一条命令 |
| 部署 | 本地构建后推送 `public/` | GitHub Actions 云端自动构建部署 |
| 改样式 | 要改主题的 pug / styl 文件 | 只改 `assets/css/style.css` |
| 外部资源 | FontAwesome、APlayer、Fancybox 等 CDN | 全部本地化，无 CDN 依赖 |

只要 Node.js 还在，这个网站就永远能构建出来。
