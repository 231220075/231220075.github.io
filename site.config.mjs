/**
 * 站点配置 —— 网站名称、个人信息、项目和社交链接。
 * 改完运行 `./blog build` 或 `./blog publish` 即可生效。
 */

export default {
  // ---------- 基本信息 ----------
  title: 'Summer Flower',
  description:
    'forever 的文章与项目。',
  affiliation: 'NJU CS',
  focus: 'Rust / 开发工具 / 项目实践',
  keywords: ['博客', '技术', '计算机', '摄影', 'forever', 'Summer Flower'],
  author: 'forever',
  email: '231220075@smail.nju.edu.cn',
  github: 'https://github.com/231220075',
  lang: 'zh-CN',

  /** 站点根地址。GitHub Pages 用户站固定为下面这个，不要改成别的域名。 */
  siteUrl: 'https://231220075.github.io',

  // ---------- 外观 ----------
  favicon: '/img/terminal.svg',
  /** 主题色（用于页面高亮、按钮） */
  accent: '#a3e08c',

  projects: [
    {
      name: 'Env Controller',
      url: 'https://github.com/231220075/env-controller',
      description: 'macOS 开发环境诊断工具，查看工作区实际使用的 Node、Python 和 Rust 版本、来源与项目要求。',
      featured: true,
      article: '/2026/11/18/env-controller/',
      preview: {
        url: 'https://github.com/231220075/env-controller/releases/download/v0.3.0/EnvController-0.3.0-macos-arm64-preview.zip',
        label: '下载预览版 · macOS arm64',
      },
    },
    {
      name: 'edge-orchestrator',
      url: 'https://github.com/231220075/edge-orchestrator',
      description: 'Rust 分布式任务编排。libp2p 组网、Raft 节点管理、CAS 工作区分发与虚拟机执行。',
    },
    {
      name: 'git',
      url: 'https://github.com/231220075/git',
      description: '与同伴用 Rust 实现轻量 Git，包含对象存储、索引、提交与分支操作。',
    },
    {
      name: 'mega',
      url: 'https://github.com/gitmono-dev/mega',
      description: 'Rust Git 兼容 monorepo。参与 Tag、Diff、提交历史和在线编辑等功能。',
    },
  ],

  // ---------- 功能开关 ----------
  features: {
    /** 文章右侧目录 */
    toc: true,
    /** 图片点击放大 */
    lightbox: true,
    /** 代码块复制按钮 */
    copyCode: true,
    /** 阅读进度条 */
    readingProgress: true,
  },

  /** 评论系统（Giscus，基于 GitHub Discussions） */
  giscus: {
    enable: true,
    repo: '231220075/231220075.github.io',
    repoId: 'R_kgDOOA3Tzw',
    category: 'Announcements',
    categoryId: 'DIC_kwDOOA3Tz84Ct7NB',
    mapping: 'pathname',
  },

  // ---------- 旧地址跳转（选填） ----------
  // 迁移前的旧链接如果被人收藏过，可以在这里写「旧地址」:「新地址」，
  // 构建时会自动生成一个跳转页，用户访问旧地址会自动跳到新地址。
  legacyRedirects: {
    '/archives/page/2/': '/archives/',
    '/search.xml': '/search.json',
    '/sitemap.txt': '/sitemap.xml',
    '/categories/技术学习/': '/categories/技术/',
    '/categories/技术分享/': '/categories/技术/',
    '/categories/学习记录/': '/categories/技术/',
    '/categories/技术实践/': '/categories/技术/',
    '/categories/生活随想/': '/categories/随笔/',
    '/categories/未分类/': '/categories/随笔/',
    '/tags/JAVA/': '/tags/Java/',
    '/tags/rust/': '/tags/Rust/',
    '/tags/git/': '/tags/Git/',
    '/tags/React/': '/tags/前端/',
    '/tags/Vue/': '/tags/前端/',
    '/tags/学习/': '/categories/技术/',
    '/tags/macOS/': '/tags/终端/',
    '/tags/zsh/': '/tags/终端/',
    '/tags/效率工具/': '/tags/终端/',
    '/tags/域名/': '/tags/网络/',
    '/tags/DNS/': '/tags/网络/',
    '/tags/GitHub-Pages/': '/tags/博客/',
    '/tags/网站部署/': '/tags/博客/',
    '/tags/乡愁/': '/categories/随笔/',
    '/tags/start/': '/tags/博客/',
    '/tags/面试/': '/categories/面试/',
    '/tags/HP/': '/categories/随笔/',
    '/tags/多媒体/': '/tags/前端/',
    '/tags/测试/': '/tags/博客/',
  },
}
