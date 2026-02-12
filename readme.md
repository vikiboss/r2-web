![93c1205d.png](https://image.viki.moe/github/93c1205d.png)

# R2 Web

📁 轻盈优雅的 Web 原生 Cloudflare R2 文件管理器，一切皆在浏览器中完成。

![836ba8a8.png](https://image.viki.moe/github/836ba8a8.png)

## 在线访问

访问 [r2.viki.moe](https://r2.viki.moe) 立即开始使用，纯前端实现，源码公开，安全可靠。

## 前置要求

请在 R2 储存桶开启公网访问，并配置 `CORS` 允许跨域：

> 配置仅供参考，如果是私有部署，请修改为你部署的域名。

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

## 关于配置分享链接

项目支持复制一个配置分享链接，包含了访问密钥 ID、访问密钥、桶名称等敏感信息，请谨慎分享。

## 关于缓存

建议在 域 > 域名 > 规则 > 页面规则 配置并开启自定义域名的资源缓存以提高图片等资源加载速度。

![fca0bf44.png](https://image.viki.moe/github/fca0bf44.png)

## 技术细节

- HTML5/CSS3/JavaScript ES6+
- 原生的 Fetch API、CSS 嵌套、dialog 等元素
- Import Map + esm.sh，模块化组织代码
- JSDoc 注释提供类型安全和开发提示
- dayjs 处理时间，AWS4Fetch 处理 R2 API 调用
- 代码开源，无任何后端服务，安全可靠
- 支持图片自动压缩，可选配置压缩模式和质量
- 支持本地压缩和云压缩
  - 本地使用 browser-image-compression，基于 Canvas 在浏览器中直接处理
  - 云压缩使用 Tinify 服务，需要配置 API Key，出于跨域问题做了中转

## 后续计划

- 大量细节优化、文件预览优化、极度重视 UI/UX
- 提供自部署代理服务，解决 Tinify API 跨域问题
- 考虑用 [WebAssembly](https://developer.mozilla.org/zh-CN/docs/WebAssembly)、[WebCodecs](https://developer.mozilla.org/zh-CN/docs/Web/API/WebCodecs_API) 等现代化技术优化本地压缩功能，就像 [GoogleChromeLabs/squoosh](https://github.com/GoogleChromeLabs/squoosh) 项目做的那样


## 其他

项目使用 Claude 4.6 Opus 模型 Vibe Coding 完成，如果对开发过程或者提示词感兴趣，请参考 [plan.md](./plan.md)，全是一个字一个字手敲的。

## License

MIT License
