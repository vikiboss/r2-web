# R2 Web 管理器

纯原生实现的 Cloudflare R2 管理器，支持文件上传、目录预览和文件操作等功能，界面简洁优雅，适用于桌面和移动设备。

## 前置要求

请在 R2 储存桶开启公网访问，并配置 CORS 允许跨域：

```json
[
  {
    "AllowedOrigins": [
      "https://r2.viki.moe",
      "http://127.0.0.1:5500"
    ],
    "AllowedMethods": [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "authorization",
      "content-type",
      "x-amz-content-sha256",
      "x-amz-date"
    ],
    "MaxAgeSeconds": 86400
  }
]
```

## 其他

项目使用 Claude 4.6 Opus 完成，如果对开发过程或者 Prompt 感兴趣，请参考 [plan.md](./plan.md)。
