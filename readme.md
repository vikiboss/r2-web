# R2 Web 管理器

📁 Web 原生实现的 Cloudflare R2 管理器，支持文件上传、目录预览和文件操作等功能，界面简洁优雅，适用于桌面和移动设备。

![screenshot](https://image.viki.moe/github/e5a933e9.png)

## 在线访问

访问 [https://r2.viki.moe](https://r2.viki.moe) 直接使用，纯前端实现，无任何后端服务，安全可靠。

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

## 技术细节

- HTML5/CSS3/JavaScript ES6+
- 原生的 Fetch API、CSS 嵌套、dialog 等元素
- Import Map + esm.sh，模块化组织代码
- JSDoc 注释提供类型安全和开发提示
- dayjs 处理时间，AWS4Fetch 处理 R2 API 调用
- 代码开源，无任何后端服务，安全可靠

## 后续计划

- 内置图片压缩，考虑用 Web Assembly
- 首页、列表等大量细节优化，极度重视 UI/UX

## 其他

项目使用 Claude 4.6 Opus 模型 Vibe Coding 完成，如果对开发过程或者提示词感兴趣，请参考 [plan.md](./plan.md)，全是一个字一个字手敲的。

## License

MIT License
