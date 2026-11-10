/**
 * 站点配置 —— 想改网站名字、导航、社交链接，只改这个文件就够了。
 * 改完运行 `./blog build` 或 `./blog publish` 即可生效。
 */

export default {
  // ---------- 基本信息 ----------
  title: 'Summer Flower',
  description:
    'forever 的文章与项目。',
  keywords: ['博客', '技术', '计算机', '摄影', 'forever', 'Summer Flower'],
  author: 'forever',
  email: '231220075@smail.nju.edu.cn',
  github: 'https://github.com/231220075',
  lang: 'zh-CN',

  /** 站点根地址。GitHub Pages 用户站固定为下面这个，不要改成别的域名。 */
  siteUrl: 'https://231220075.github.io',
  /** 部署在子路径时填写，例如 '/blog'；用户站留空 */
  basePath: '',

  // ---------- 外观 ----------
  favicon: '/img/terminal.svg',
  /** 主题色（用于页面高亮、按钮） */
  accent: '#a3e08c',

  // ---------- 导航 ----------
  // 次要入口通过 help 访问。
  nav: [
    { name: 'proj', url: '/proj/' },
  ],

  projects: [
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
    /** 本地全文搜索（零依赖，纯前端） */
    search: true,
    /** 文章右侧目录 */
    toc: true,
    /** 图片点击放大 */
    lightbox: true,
    /** 代码块复制按钮 */
    copyCode: true,
    /** 暗色模式切换 */
    darkMode: true,
    /** 阅读进度条 */
    readingProgress: true,
    /** 相关文章推荐 */
    relatedPosts: false,
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
  },

  // ---------- 页脚 ----------
  footer: {
    since: 2025,
    /** 备案号，没有就留空字符串 */
    icp: '',
  },
}
