![93c1205d.png](https://image.viki.moe/github/93c1205d.png)

# R2 Web

📁 轻盈优雅的 Web 原生 Cloudflare R2 文件管理器，一切皆在浏览器中完成。在线访问 **[r2.viki.moe](https://r2.viki.moe)**，源码公开，可以随时 fork 私有部署。

可以当作私有图床使用，支持拖拽/粘贴上传，自动压缩图片，生成 Markdown/HTML 链接。也可以当作临时文件管理工具，直接在浏览器里管理 R2 存储桶里的文件。

![836ba8a8.png](https://image.viki.moe/github/836ba8a8.png)

## 为什么用这个？

**传统方案的痛点：**
- 官方控制台功能基础，登录、操作麻烦
- 第三方客户端要下载安装，跨平台麻烦
- 命令行工具上手门槛高，不适合临时操作

**R2 Web 的解决方案：**
- 打开浏览器就能用，跨平台零成本
- 拖拽、粘贴上传 + 图片压缩，省流量省时间
- PWA 支持，装到桌面像原生应用
- 纯前端实现，数据不经过第三方服务器

## 功能速览

| 功能类别 | 具体功能 |
|---------|---------|
| **文件管理** | 目录浏览、分页加载、懒加载缩略图<br>按名称/日期/大小排序<br>重命名、移动、复制、删除（支持递归） |
| **文件上传** | 拖拽/粘贴/选择器上传<br>文件名模板（哈希、日期、UUID 等占位符）<br>上传前自动压缩图片（WebAssembly） |
| **文件预览** | 图片预览（常见格式）<br>视频/音频内嵌播放器<br>文本文件预览（代码高亮） |
| **链接复制** | URL 直链、Markdown、HTML、预签名 URL |
| **个性化** | 中文/英语/日语<br>深色模式（跟随系统）<br>配置分享链接/二维码 |
| **PWA** | 安装到桌面，原生体验 |

## 快速开始

### 1. 配置 R2 桶 CORS

在 Cloudflare 控制台配置 CORS 规则（路径：R2 → 存储桶 → 设置 → CORS 策略）：

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

**私有部署？** 把 `AllowedOrigins` 改成你的域名。

### 2. 填写凭证连接

访问 [r2.viki.moe](https://r2.viki.moe)，填写：
- 账户 ID（Account ID）
- 访问密钥 ID（Access Key ID）
- 秘密访问密钥（Secret Access Key）
- 存储桶名称（Bucket Name）
- 自定义域名（可选）

凭证只存储在浏览器 localStorage，不会上传。

### 3. 开始使用

拖拽文件或者直接 Ctrl + V 即可上传，右键文件可进行重命名、复制链接等操作。

如果当作图床使用，建议设置文件名模板，生成带哈希的唯一文件名、开启图片压缩，提升性能和安全性。

## 实用技巧

### 文件名模板示例
- `[name]_[hash:6].[ext]` - 原文件名 + 6 位哈希（默认）
- `images/[date:YYYY/MM/DD]/[uuid].[ext]` - 按日期分目录
- `backup/[timestamp]-[name].[ext]` - 时间戳前缀备份

### 配置分享链接
生成配置分享链接或二维码，快速在多设备同步配置。链接包含凭证，请勿公开分享。

### 缓存优化

项目内置支持请求缓存，对目录内容等常见频繁请求返回数据进行了缓存。

对于文件 CDN 缓存，建议在 Cloudflare 控制台配置缓存规则，提升图片加载速度。

![fca0bf44.png](https://image.viki.moe/github/fca0bf44.png)

## 技术实现

纯前端应用，无构建步骤，代码写完即可部署。

**核心技术：** HTML5/CSS3/ES6+，CSS Layers、原生 `<dialog>`、原生 Fetch、Import Maps、WebAssembly

**依赖库：**
- `aws4fetch` - AWS4 请求签名，处理 R2 S3 API
- `dayjs` - 日期格式化
- `@jsquash/*` - WebAssembly 图片压缩（MozJPEG、OxiPNG、libwebp、libavif）
- `qrcode` - 二维码生成

**无需：** Node.js、Webpack、Vite、React、Vue

## 本地开发

```bash
git clone https://github.com/vikiboss/r2-web.git
cd r2-web

# 安装依赖（仅用于类型提示）
pnpm install

# 启动本地服务器
npx serve src
# 或
python3 -m http.server 5500 --directory src
```

详细开发指南见 [CLAUDE.md](./CLAUDE.md)。

## FAQ

**Q: 凭证安全吗？**
A: 凭证只存储在浏览器 localStorage，不会上传到任何服务器。建议使用只读权限的 API 令牌。

**Q: 支持哪些浏览器？**
A: 现代浏览器（Chrome/Edge/Firefox/Safari 最新版），不考虑 IE 兼容。

**Q: 图片压缩在哪里进行？**
A: 本地压缩使用 WebAssembly，完全在浏览器中完成，文件不会上传到第三方服务器。

**Q: 可以私有部署吗？**
A: 可以，fork 仓库后修改 CORS 配置中的 `AllowedOrigins`，部署到任意静态托管服务（Cloudflare Pages、Vercel、Netlify 等）。

**Q: 配置分享链接包含什么信息？**
A: 包含访问密钥 ID、秘密访问密钥、存储桶名称等敏感信息，请勿公开分享。

**Q: 为什么上传失败？**
A: 检查 CORS 配置是否正确、凭证是否有效、文件是否超过 300MB（大文件建议用 rclone）。

## 设计理念

- 零构建，源码即产物，无需编译打包
- 零框架，原生 Web 技术优先，不依赖框架
- 零后端，所有逻辑在浏览器中完成，直连 R2 API
- 极简美学，黑白灰 + R2 橙色，小圆角、扁平化
- 性能至上，懒加载、防抖节流、请求缓存
- 细节优先，流畅动画、及时反馈、键盘导航

## 后续计划

- 持续优化 UI/UX，增加更多快捷操作

## 开发故事

项目使用 Claude 4.6 Opus 模型 Vibe Coding 完成，从需求到实现全程手工提示词驱动。初始提示词可以参考 [plan.md](./plan.md)。

## License

MIT License
