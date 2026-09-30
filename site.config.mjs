/**
 * 站点配置 —— 想改网站名字、导航、社交链接，只改这个文件就够了。
 * 改完运行 `./blog build` 或 `./blog publish` 即可生效。
 */

export default {
  // ---------- 基本信息 ----------
  title: 'Summer Flower',
  subtitle: 'Let life be beautiful like summer flowers, and death like autumn leaves',
  description:
    'this is forever’s blog, and I plan to share some photos and cs learning stories, wish can help you and make your day.',
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
  avatar: '/photos/avatar.jpg',
  favicon: '/img/favicon.ico',
  /** 首页每页文章数 */
  postsPerPage: 8,
  /** 主题色（用于页面高亮、按钮） */
  accent: '#3b82f6',

  // ---------- 导航 ----------
  // children 为二级菜单；icon 用内置图标名（见 assets/js/icons.js）
  nav: [
    { name: '首页', url: '/', icon: 'home' },
    {
      name: '发现',
      icon: 'compass',
      children: [
        { name: '音乐', url: '/music/', icon: 'music' },
        { name: '电影', url: '/movies/', icon: 'film' },
        { name: '相册', url: '/photos-gallery/', icon: 'camera' },
        { name: '小游戏', url: '/games/', icon: 'gamepad' },
      ],
    },
    { name: 'AI 助手', url: '/browser/', icon: 'robot' },
    { name: '归档', url: '/archives/', icon: 'archive' },
    { name: '分类', url: '/categories/', icon: 'folder' },
    { name: '标签', url: '/tags/', icon: 'tag' },
    { name: '友链', url: '/links/', icon: 'link' },
    { name: '留言板', url: '/comments/', icon: 'message' },
    { name: '关于', url: '/about/', icon: 'user' },
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
    relatedPosts: true,
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
