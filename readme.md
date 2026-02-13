![93c1205d.png](https://image.viki.moe/github/93c1205d.png)

# R2 Web

轻盈优雅的 Web 原生 Cloudflare R2 文件管理器，一切皆在浏览器中完成。

![836ba8a8.png](https://image.viki.moe/github/836ba8a8.png)

## 在线访问

访问 [r2.viki.moe](https://r2.viki.moe) 立即开始使用，纯前端实现，源码公开，安全可靠。

## 核心功能

### 文件管理

- 目录浏览，支持分页加载和懒加载缩略图
- 按名称、日期、大小排序
- 文件操作：重命名、移动、复制、删除，文件夹支持递归操作
- 一键复制链接，支持 URL 直链、Markdown 格式、HTML 格式、预签名 URL

### 文件上传

- 多种上传方式，拖拽、粘贴、文件选择器都行
- 文件名模板支持 `[name]`、`[ext]`、`[hash:N]`、`[date:FORMAT]`、`[timestamp]`、`[uuid]` 等占位符
- 上传前自动压缩图片，支持本地压缩（WebAssembly）和云端压缩（Tinify API）
- 实时显示上传进度

### 文件预览

- 图片预览，支持 JPEG、PNG、WebP、AVIF、GIF、SVG 等格式
- 视频和音频内嵌播放器
- 文本文件预览，支持 TXT、Markdown、JSON、代码文件等

### 图片压缩

- 本地压缩使用 jSquash（WebAssembly），支持 JPEG（MozJPEG）、PNG（OxiPNG）、WebP、AVIF
- 云端压缩使用 Tinify API，效果更好但需要 API Key
- 可配置压缩模式和质量

### 配置与偏好

- 凭证和配置存储在浏览器 localStorage，数据不上传
- 支持生成配置分享链接（Base64 编码）或二维码，快速迁移到其他设备
- 多语言支持，简体中文、英语、日语
- 深色模式，跟随系统或手动切换

### PWA 支持

- 支持安装到桌面，像原生应用一样使用

## 前置要求

需在 R2 储存桶开启公网访问，并配置 CORS 允许跨域。

> 配置仅供参考，私有部署请修改为你的域名。

```json
[
  {
    "AllowedOrigins": [ "https://r2.viki.moe" ],
    "AllowedMethods": [ "GET", "POST", "PUT", "DELETE", "HEAD" ],
    "AllowedHeaders": [ "authorization", "content-type", "x-amz-content-sha256", "x-amz-date", "x-amz-copy-source" ],
    "MaxAgeSeconds": 86400
  }
]
```

## 使用提示

### 配置分享链接

项目支持生成配置分享链接或二维码，包含访问密钥 ID、访问密钥、桶名称等敏感信息，请谨慎分享。链接通过 Base64 编码，可以快速在多设备间同步配置。

### 资源缓存优化

建议在 Cloudflare 控制台配置资源缓存规则，提升图片等资源的加载速度。路径：域 > 域名 > 规则 > 页面规则。

![fca0bf44.png](https://image.viki.moe/github/fca0bf44.png)

### 文件名模板示例
- `[name]_[hash:6].[ext]` 原文件名 + 6 位哈希 + 扩展名（默认）
- `images/[date:YYYY/MM/DD]/[uuid].[ext]` 按日期分目录，UUID 文件名
- `backup/[timestamp]-[name].[ext]` 时间戳前缀备份文件

## 技术栈

这是一个纯前端应用，没有构建步骤，没有 Node.js 服务器，代码写完即可部署。

### 核心技术

- HTML5/CSS3/JavaScript ES6+ 不考虑兼容性，现代浏览器优先
- CSS Layers、CSS Nesting、`light-dark()` 函数、ViewTransition API
- 原生 `<dialog>`、Popover API、IntersectionObserver、Fetch 等现代 Web API
- Import Map + esm.sh 模块化加载依赖

### 依赖库
- `aws4fetch` AWS4 请求签名，处理 R2 S3 API 调用
- `dayjs` 日期格式化，用于文件名模板
- `filesize` 文件大小格式化显示
- `qrcode` 配置分享二维码生成
- `@jsquash/*` WebAssembly 图片压缩，MozJPEG、OxiPNG、libwebp、libavif

### 开发工具
- JSDoc 注释提供类型安全和 IDE 提示
- `pnpm` 管理开发依赖，仅用于类型定义
- 无需 Webpack、Vite 等构建工具，静态服务器直接运行

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/vikiboss/r2-web.git
cd r2-web

# 安装依赖（仅用于类型提示）
pnpm install

# 启动本地服务器（任选其一）
npx serve src
# 或
python3 -m http.server 5500 --directory src
```

浏览器访问 `http://localhost:5500` 即可。

## 设计理念

- 零构建，源码即产物，无需编译打包
- 零框架，原生 Web 技术优先，不依赖 React/Vue 等框架
- 零后端，所有逻辑在浏览器中完成，通过 S3 API 直连 R2
- 极简美学，黑白灰配色 + R2 橙色强调，小圆角、扁平化、紧凑布局
- 性能至上，懒加载、防抖节流
- 细节优先，流畅动画、及时反馈、键盘导航

## 后续计划

- 持续的细节优化和文件预览增强
- 提供自部署代理服务，解决 Tinify API 跨域问题
- 更多文件操作快捷键支持
- 可能的文件编辑功能

## 开发故事

项目使用 Claude 4.6 Opus 模型 Vibe Coding 完成，从需求到实现全程手工提示词驱动。如果你对开发过程或提示词工程感兴趣，可以参考 [plan.md](./plan.md)。

## License

MIT License
