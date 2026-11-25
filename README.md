# Summer Flower

Markdown 博客，零依赖 Node.js 构建，GitHub Pages 托管。

## 写作

需要 Node.js 20+。

```sh
./blog new "Rust 笔记" --category 技术 --tags Rust --edit
./blog edit "Rust 笔记"
./blog dev
./blog publish "post: Rust 笔记"
```

`new` 生成最小模板，无交互确认。`edit` 支持标题、文件名、路径或唯一关键词；保存有变化时自动记录 `updated`。使用 `VISUAL` / `EDITOR` 指定编辑器，如 `export EDITOR="code --wait"`；macOS 默认使用系统应用并等待编辑结束。

在外部编辑器修改后，运行 `./blog update "Rust 笔记"` 记录更新时间。原 `date`、文件名和文章 URL 保持不变。

```sh
./blog new "还没写完" --category 技术 --draft
./blog list
./blog update "还没写完" --no-draft
```

草稿不进入页面、终端目录、搜索、归档或 sitemap。准备好后再运行 `publish`。`./blog help` 列出全部写作选项。

## 站内终端

首页显示简短的博客信息，双行提示符紧随输出。输入命令后按 Enter。点击 `Posts` 的篇数可以浏览文章。

```sh
ls -l ~/posts
ls ~/posts -t Rust
cd ~/tags/Rust
cat "用rust复刻git.md"
rg 工作区
```

- `ls [-l] [目录] [-t 标签]` 浏览虚拟文件。`-l` 显示权限、日期、文件名和标签。`-t` 按标签筛选，忽略大小写。
- `cd <目录>` 切换目录，`pwd` 显示当前位置。文章平铺在 `~/posts/`，也可从 `~/tags/` 和 `~/categories/` 查找。路径支持中文、引号、空格、`~`、`..` 和绝对路径。
- `cat ~/about.md` 和 `cat ~/projects.md` 查看功能页。`cat` 或 `open` 可用文件名或标题打开文章，直接进入文章原网址。
- `rg <关键词>`（别名 `search`、`grep`）检索标题、标签与正文，从命中处显示上下文。
- `cat ~/settings` 或 `settings` 打开配色设置。可用 `theme [dark|slate|roast|dusk|light|auto]` 切换，也可开启首页与设置页的动态底色。动态底色默认关闭，并遵循系统的减少动态效果设置。选择保存在当前浏览器。
- `clear` 清屏，`reset` 恢复初始状态。`fastfetch` 显示博客信息，`help` 列出命令。

`/` 或 `⌘/Ctrl K` 聚焦输入，`↑ ↓` 浏览当前标签页的命令历史，`Tab` 补全唯一匹配，`Esc` 清空输入。归档、项目和个人页均有静态链接，关闭 JavaScript 仍可浏览。虚拟目录与搜索索引由构建生成，项目简介配置在 `site.config.mjs`。

## 文章

```yaml
---
title: "Rust 笔记"
date: 2026-11-10 12:00:00
updated: 2026-11-10 13:00:00
categories:
  - 技术
tags:
  - Rust
draft: false
---
```

文章位于 `content/posts/`，网址按 `/年份/月/日/文件名/` 生成。发布后避免改动 `date` 和文件名。图片放在 `assets/photos/`，引用为 `![](/photos/文件.jpg)`。

分类按内容分为 `技术`、`随笔`、`面试`，每篇选一个。标签只标具体主题，优先复用 `Rust`、`Git`、`Java`、`前端`、`网络`、`云原生`、`终端`、`开源`、`博客`；没有合适主题时留空，不重复分类。合并前的分类和标签地址通过 `site.config.mjs` 保留跳转。

## 维护

`./blog build` 构建，`./blog dev [端口]` 自动预览，`./blog rm "标题"` 备份至 `.trash/`。构建先在系统临时目录生成产物，再更新 `public/` 中变动的文件并清除过期文件。`./blog clean` 清空产物，保留 `public/` 目录。`publish` 构建、提交并正常推送；当前 GitHub Actions 工作流在推送 `main` 时部署。

```sh
node --test tools/*.test.mjs
./blog build
```

终端使用系统等宽字体。

项目简介依据仓库 README；Mega 参与内容可见 [Tag](https://github.com/gitmono-dev/mega/pull/1550)、[Diff](https://github.com/gitmono-dev/mega/pull/1650)、[提交历史](https://github.com/gitmono-dev/mega/pull/1689)、[在线编辑](https://github.com/gitmono-dev/mega/pull/1568) 的已合并 PR。
