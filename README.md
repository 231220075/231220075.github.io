# Summer Flower

Markdown 博客，零依赖 Node.js 构建，GitHub Pages 托管。

## 写作

需要 Node.js 20+。

```sh
./blog new "Rust 笔记" --category 学习记录 --tags Rust --edit
./blog edit "Rust 笔记"
./blog dev
./blog publish "post: Rust 笔记"
```

`new` 生成最小模板，无交互确认。`edit` 支持标题、文件名、路径或唯一关键词；保存有变化时自动记录 `updated`。使用 `VISUAL` / `EDITOR` 指定编辑器，如 `export EDITOR="code --wait"`；macOS 默认使用系统应用并等待编辑结束。

在外部编辑器修改后，运行 `./blog update "Rust 笔记"` 记录更新时间。原 `date`、文件名和文章 URL 保持不变。

```sh
./blog new "还没写完" --category 学习记录 --draft
./blog list
./blog update "还没写完" --no-draft
```

草稿不进入页面、终端目录、搜索、归档或 sitemap。准备好后再运行 `publish`。`./blog help` 列出全部写作选项。

## 站内终端

首页只有终端，初始列出分类文件夹。点击或使用命令浏览：

```sh
ls
cd 学习记录
ls
open "用rust复刻git.md"
cd ..
proj
```

- `ls [目录]`：列出分类或文章；文章可直接点击。
- `cd <目录>`：进入并列出目录；`cd ..` 返回，`cd /` 回到根目录。
- `pwd`：显示当前目录。
- `open <文件 / 标题>`（别名 `cat`）：打开文章。
- `proj`：项目简介与 GitHub 链接。
- `search <关键词>`（别名 `grep`）：全文搜索。
- `archive`、`tags`、`categories`、`whoami`、`links`、`github`、`email`：其他入口。
- `theme [dark|light|auto]`、`clear`、`help`：主题、清空、帮助。

`/` 或 `⌘/Ctrl K` 聚焦，`↑ ↓` 历史，`Tab` 补全命令或路径，`Esc` 清空。路径支持引号、空格、中文、`~` 和绝对路径。无分类文章归入 `未分类/`；多分类文章可从各分类访问。没有 JavaScript 时，文件夹链接仍可进入分类页阅读。

首页不生成文章卡片或分页。阅读页保留顶部终端。项目简介配置在 `site.config.mjs`，构建无需联网。

## 文章

```yaml
---
title: "Rust 笔记"
date: 2026-11-10 12:00:00
updated: 2026-11-10 13:00:00
categories:
  - 学习记录
tags:
  - Rust
draft: false
---
```

文章位于 `content/posts/`，网址按 `/年份/月/日/文件名/` 生成。发布后避免改动 `date` 和文件名。图片放在 `assets/photos/`，引用为 `![](/photos/文件.jpg)`。

## 维护

`./blog build` 构建，`./blog dev [端口]` 自动预览，`./blog rm "标题"` 备份至 `.trash/`。构建成功后替换旧产物，失败保留上一版本。`publish` 构建、提交并正常推送；当前 GitHub Actions 工作流在推送 `main` 时部署。

```sh
node --test tools/*.test.mjs
./blog build
```

中文终端使用本地 [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font)，OFL-1.1；字体与许可证位于 `assets/fonts/`。文章正文保留常规字体。

项目简介依据仓库 README；Mega 参与内容可见 [Tag](https://github.com/gitmono-dev/mega/pull/1550)、[Diff](https://github.com/gitmono-dev/mega/pull/1650)、[提交历史](https://github.com/gitmono-dev/mega/pull/1689)、[在线编辑](https://github.com/gitmono-dev/mega/pull/1568) 的已合并 PR。
