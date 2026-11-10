# Summer Flower

forever 的个人博客。Markdown 写作，零依赖 Node.js 构建，GitHub Pages 托管。

## 写作

需要 Node.js 20+。

```sh
./blog new "Rust 笔记" --tags Rust,Git --edit
./blog edit "Rust 笔记"
./blog dev
./blog publish "post: Rust 笔记"
```

`new` 生成最小文章模板，无交互确认。`edit` 支持标题、文件名、路径或唯一关键词；保存有变化时自动记录 `updated`。使用 `VISUAL` / `EDITOR` 指定编辑器，例如 `export EDITOR="code --wait"`；macOS 未设置时使用默认应用并等待编辑结束。

在其他编辑器里改好文章后：

```sh
./blog update "Rust 笔记"
```

只更新 `updated`，保留原 `date`、文件名和文章 URL。时间采用执行环境的本地时区。

```sh
./blog new "还没写完" --draft
./blog list
./blog update "还没写完" --no-draft
./blog publish
```

草稿不进入页面、搜索、归档、RSS 或 sitemap；本地预览同样隐藏草稿。`--no-draft` 表示准备发布，实际推送仍需 `publish`。

## 命令

运行 `./blog help` 查看全部选项。

| 命令 | 作用 |
| --- | --- |
| `new "标题"` | 新建；支持 `--tags`、`--category`、`--description`、`--slug`、`--draft`、`--edit` |
| `edit "标题或文件名"` | 编辑并自动更新时间 |
| `update "标题或文件名"` | 记录更新时间；支持 `--edit`、`--draft`、`--no-draft` |
| `list [关键词]` | 查找文章，包含草稿 |
| `dev [端口]` | 本地预览，默认 <http://localhost:4000>，保存后自动刷新 |
| `build` | 生成到 `public/` |
| `publish ["说明"]` | 构建、提交当前仓库改动、正常推送到 origin |
| `status` | 查看 Git 改动 |
| `rm "标题或文件名"` | 移到 `.trash/` |
| `clean` | 清空构建产物 |
| `setup` | 首次配置 origin，不推送 |

`publish` 沿用 GitHub Actions 部署；仅推送到 `main` 会触发当前部署工作流。推送冲突时停止并保留 Git 错误。脚本不覆盖远程历史。

## 文章格式

```yaml
---
title: "Rust 笔记"
date: 2026-11-10 12:00:00
updated: 2026-11-10 13:00:00
tags:
  - Rust
categories:
  - 技术
description: 一句话摘要
draft: false
---
```

`title`、`date` 由新建命令填写，其余按需使用。正文支持常用 Markdown、代码高亮和复制、图片放大、表格、音视频 HTML。图片放在 `assets/photos/`，引用为 `![](/photos/文件.jpg)`。

已发布文章的网址为 `/年份/月/日/文件名/`，避免改动 `date` 和文件名。`updated` 不影响排序和 URL。首页使用纯文本列表，已有 `cover` 字段仍可保留。

## 站内终端

主导航保留文章、归档、关于。输入 `help` 或点击顶部 `help` 展开全部功能；无 JavaScript 时可访问 `/help/`。

- `ls` / `posts`：最新文章
- `archive`、`tags`、`categories`：归档、标签、分类
- `whoami` / `about`、`links`：关于、友链
- `search 关键词`（别名 `grep`）：全文搜索
- `open 标题`（别名 `cat`）：打开唯一匹配的文章；多条结果可点击选择
- `rss`、`github`、`email`：订阅与联系
- `theme dark|light|auto`：主题；默认暗色并记住选择
- `clear`：清空输出

快捷键：`/` 或 `⌘/Ctrl K` 聚焦，`↑ ↓` 历史，`Tab` 补全唯一命令，`Esc` 清空。

## 结构

```text
blog                      命令入口
site.config.mjs           站名、导航、评论与功能开关
content/posts/            文章
content/pages/            关于、友链
assets/css/style.css      终端主题
assets/js/main.js         命令与阅读交互
assets/photos/            配图
static/                   原样复制的资源
tools/cli.mjs              写作与发布命令
tools/build.mjs            静态生成器
tools/markdown.mjs         Markdown 渲染器
tools/server.mjs           预览与自动刷新
public/                   构建产物，Git 忽略
.github/workflows/        GitHub Pages 部署
```

发现、AI 助手、独立娱乐页、留言板、上传页、PWA 安装已移除；保留文章评论、RSS、目录和阅读进度。已有文章与配图保留。

## 验证

```sh
node --test tools/cli.test.mjs
./blog build
```
