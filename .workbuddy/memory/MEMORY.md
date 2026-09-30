# 项目长期约定 —— Summer Flower 博客

## 技术栈
- 纯静态站点，**零 npm 依赖**，构建器用 Node 原生模块手写
- 不使用 Hexo、不使用任何前端框架、不引入 CDN 资源
- 部署：GitHub Actions 构建 → GitHub Pages（用户站 `231220075.github.io`）
- 站点根地址固定 `https://231220075.github.io`，**不存在自定义域名**

## 目录约定
| 路径 | 用途 |
| --- | --- |
| `content/posts/*.md` | 文章 |
| `content/pages/*.md` | 固定页面 |
| `assets/{css,js,img,photos,photos-gallery}` | 静态资源（构建时分别拷到 public 的 /css /js /img /photos /photos-gallery） |
| `static/` | 原样复制到 public 根目录 |
| `site.config.mjs` | 唯一站点配置入口 |
| `tools/` | 生成器（markdown.mjs / build.mjs / server.mjs） |
| `.hexo-backup/` | Hexo 时代归档，**不要删除**，已 gitignore |

## 文章约定
- 文件开头为 YAML front matter：title / date / tags / categories / description / cover / comments
- URL 规则 `/年/月/日/文件名/`（沿用旧站，保证外链不失效）；**发布后不要改文件名**
- 文件名直接使用中文标题

## 编码红线
1. `tools/markdown.mjs` 的 HTML 块识别必须用增量状态机（`createHtmlScanner`），
   不要退回"整段扫描深度"的实现
2. 清理目录用 `unlinkSync` + `rmdirSync` 手动递归，不要用 `fs.rmSync`
   （本机 safe-delete shim 会移到回收站并超时）
3. 写文件用原生路径（中文目录名），生成 href 时统一走 `link()` 做 URL 编码
4. 任何对外链接都不允许出现 `summer-flower.com`

## 用户画像
- 非前端背景，希望维护成本越低越好
- 偏好"一条命令搞定"的交互；命令帮助要写清楚中文说明
- 全部交流使用简体中文
