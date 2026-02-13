# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 提供仓库开发指南。

## 项目概述

**R2 Web** — 纯客户端 Cloudflare R2 存储桶文件管理器，零构建、零框架、零后端。

核心特性：文件上传、目录浏览、文件预览、文件操作、图片压缩、PWA、多语言（zh/en/ja）、浅色/深色主题。

## 项目结构

```
r2-web/
├── plan.md            — 原始需求文档
├── readme.md          — 项目说明、使用指南
├── package.json       — 依赖声明（仅用于类型提示）
├── jsconfig.json      — JSDoc 类型检查配置
└── src/               — 源码目录（即部署目录）
     ├── index.html    — 应用外壳、import map、对话框模板
     ├── script.js     — 应用逻辑（类架构，约 2700+ 行）
     ├── style.css     — 样式主入口（仅导入 css 子目录）
     └── css/          — 样式模块（CSS Layers）
          ├── reset.css       — CSS Reset
          ├── tokens.css      — 设计 Token（重要，定义所有变量）
          ├── base.css        — 全局基础样式
          ├── layout.css      — 布局容器
          ├── components.css  — 通用 UI 组件（约 800+ 行）
          ├── utilities.css   — 工具类
          └── animations.css  — 动画与过渡
```

## 开发环境

### 本地调试

无需构建，使用任意静态服务器：

```bash
npx serve src
# 或
python3 -m http.server 5500 --directory src
```

### 依赖管理

**重要** `package.json` 依赖仅用于类型提示，运行时通过 `import map` 从 CDN 加载。

添加新依赖：

```bash
# 1. 安装获取类型定义
pnpm add -D package-name@x.y.z

# 2. 在 src/index.html 的 <script type="importmap"> 中添加映射
# {
#   "imports": {
#     "package-name": "https://esm.sh/package-name@x.y.z"
#   }
# }

# 3. 在 src/script.js 中导入使用
# import { something } from 'package-name'
```

### 类型检查

- JSDoc 注释提供类型信息
- 运行 `pnpm typecheck` 验证类型

## 架构设计

### JavaScript 类架构

所有类定义在 `src/script.js` 中，采用单文件组织：

| 类               | 职责                                           | 位置（搜索关键词）      |
| ---------------- | ---------------------------------------------- | ----------------------- |
| `ConfigManager`  | localStorage 持久化、Base64 配置分享           | `class ConfigManager`   |
| `R2Client`       | S3 API 客户端（基于 `aws4fetch` 签名）         | `class R2Client`        |
| `UIManager`      | 主题、Toast、对话框、上下文菜单、Tooltip       | `class UIManager`       |
| `FileExplorer`   | 目录导航、排序、分页、懒加载缩略图、列表缓存   | `class FileExplorer`    |
| `UploadManager`  | 拖拽/粘贴上传、文件名模板、图片压缩            | `class UploadManager`   |
| `FilePreview`    | 图片/视频/音频/文本预览                        | `class FilePreview`     |
| `FileOperations` | 重命名、复制、移动、删除（递归删除文件夹）     | `class FileOperations`  |
| `App`            | 主协调器、i18n 处理                            | `class App`             |

**应用初始化** 在 `src/script.js` 末尾：

```javascript
// 启动应用，构造函数内部自动创建所有管理器并初始化
new App()
```

`App` 构造函数内部会自动创建 `ConfigManager`、`R2Client`、`UIManager`，然后根据配置状态决定是否初始化文件浏览器等其他管理器。

### 列表缓存机制

`FileExplorer` 类内置缓存机制（搜索 `#cache`），缓存文件列表 5 分钟，减少 API 请求。

```javascript
/** @typedef {{ data: { folders: FileItem[], files: FileItem[], isTruncated: boolean, nextToken: string }, ts: number }} CacheEntry */
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
#cache = new Map()

// 刷新时可传 bypassCache = true 强制重新加载
await #loadPage(isInitial, bypassCache = false)
```

### 文件名模板

占位符 `[name]`、`[ext]`、`[hash:N]`、`[date:FORMAT]`、`[timestamp]`、`[uuid]`、`/`（目录分隔）

实现位置 `UploadManager.processFilenameTemplate()` 方法。

## CSS 规范

### CSS Layers

样式通过 `@layer` 组织优先级（`src/style.css`）：

```css
@layer reset, tokens, base, layout, components, utilities, animations;

@import './css/reset.css';
@import './css/tokens.css';
/* ... */
```

### 设计 Token

所有样式值通过 CSS 自定义属性定义（`src/css/tokens.css`）：

**间距**
```css
--sp-1: 4px;
--sp-2: 8px;
--sp-4: 16px;
--sp-6: 24px;
/* 使用示例 */
.card {
  padding: var(--sp-4);
  gap: var(--sp-2);
}
```

**字体**
```css
--text-xs: 11px;
--text-sm: 12px;
--text-base: 13px;
--text-md: 14px;
--text-lg: 16px;
/* 使用示例 */
.title {
  font-size: var(--text-lg);
}
```

**颜色**
```css
--accent: #f6821f;  /* R2 橙色 */
--accent-hover: color-mix(in oklch, var(--accent) 82%, black);

/* 语义化颜色（通过 light-dark() 自动适配主题） */
--bg-primary: light-dark(#ffffff, #1a1a1a);
--bg-secondary: light-dark(#f5f5f5, #222222);
--text-primary: light-dark(#1a1a1a, #e8e8e8);
--border: light-dark(#e0e0e0, #333333);

/* 使用示例 */
.btn {
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
}
```

**圆角**
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
```

**动画**
```css
--duration-fast: 120ms;
--duration-normal: 200ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
```

**Z-index** 在 `tokens.css` 中统一管理
```css
--z-dropzone: 100;
--z-context-menu: 200;
--z-dialog: 300;
--z-toast: 400;
--z-tooltip: 2147483647;
```

### 设计风格

- 黑白灰 + R2 橙色强调
- 小圆角（4-8px）、扁平化、无阴影或极少阴影
- 紧凑小边距

### 通用组件

**优先使用 `src/css/components.css` 中的组件类**

**按钮** `.btn`
```html
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-secondary">次要按钮</button>
<button class="btn btn-danger">危险操作</button>
<button class="icon-btn" data-tooltip="图标按钮">
  <svg class="icon"><!-- ... --></svg>
</button>
```

**输入框** `.input`、`.select`、`.textarea`
```html
<input type="text" class="input" placeholder="输入框" />
<select class="select">
  <option>选项 1</option>
</select>
<textarea class="textarea" rows="4"></textarea>
```

**对话框** `.dialog-header`、`.dialog-body`、`.dialog-footer`
```html
<dialog id="my-dialog">
  <div class="dialog-header">
    <h2>对话框标题</h2>
    <button class="icon-btn sm">关闭</button>
  </div>
  <div class="dialog-body">
    <!-- 内容 -->
  </div>
  <div class="dialog-footer">
    <button class="btn btn-secondary">取消</button>
    <button class="btn btn-primary">确认</button>
  </div>
</dialog>
```

**Toast** 通过 `UIManager.toast()` 方法
```javascript
uiManager.toast('操作成功', 'success')
uiManager.toast('操作失败', 'error')
uiManager.toast('提示信息', 'info')
```

**Tooltip** 通过 `data-tooltip` 属性
```html
<button data-tooltip="这是提示文本">按钮</button>
```

Tooltip 通过 `UIManager.initTooltip()` 初始化，监听 `mouseenter`/`mouseleave` 事件。

### 现代 CSS 特性

无需考虑兼容性：CSS Nesting、`light-dark()`、`color-mix()`、`@starting-style`、Popover API、Range Media Queries、`text-wrap: balance`、`:has()` 等。

## JavaScript 规范

### 编码风格

- ES6+ 优先，箭头函数、`const`/`let`、解构、`async`/`await`
- 现代数组方法 `toSorted()`、`toReversed()`、`Object.groupBy()`、`at()`
- 可选链与空值合并 `obj?.prop`、`value ?? default`
- Promise 并发 `Promise.all()` 批量操作

### 现代 Web API

ViewTransition API、IntersectionObserver、Popover API、`<dialog>`、Clipboard API、Drag and Drop API、Service Worker 等。

### JSDoc 类型注解

所有类、方法必须添加 JSDoc：

```javascript
/**
 * 上传文件到 R2
 * @param {File} file - 文件对象
 * @param {string} [customPath] - 自定义路径（可选）
 * @returns {Promise<void>}
 */
async uploadFile(file, customPath) {
  // ...
}
```

**类型定义示例**
```javascript
/**
 * @typedef {Object} R2Config
 * @property {string} accessKeyId - 访问密钥 ID
 * @property {string} secretAccessKey - 秘密访问密钥
 * @property {string} bucketName - 存储桶名称
 * @property {string} endpoint - R2 端点 URL
 */
```

## 国际化（i18n）

### 多语言支持

支持 zh/en/ja，默认中文。`script.js` 中定义 `I18N` 对象（搜索 `const I18N`）：

```javascript
const I18N = {
  zh: {
    confirm: '确认',
    cancel: '取消',
    delete: '删除',
    // ...
  },
  en: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    // ...
  },
  ja: { /* ... */ }
}

/**
 * 获取当前语言的翻译文本
 * @param {string} key - 翻译键
 * @param {{ [key: string]: string }} [vars] - 变量替换
 * @returns {string}
 */
function t(key, vars) {
  const lang = document.documentElement.lang || 'zh'
  let text = I18N[lang]?.[key] || key
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v)
    })
  }
  return text
}
```

### HTML 模板

`src/index.html` 默认文案使用中文，应用初始化后通过 `App.updateLanguage()` 重新注入多语言文本。

### Tooltip 动态更新

Tooltip 文案通过 `data-tooltip` 属性定义，语言切换时需要更新：

```javascript
// App.updateLanguage() 方法中
document.querySelectorAll('[data-tooltip-key]').forEach((el) => {
  const key = el.dataset.tooltipKey
  el.dataset.tooltip = t(key)
})
```

**HTML 中使用**
```html
<!-- 方式 1：直接写文案（初始化后会被 JS 替换） -->
<button data-tooltip="删除文件">删除</button>

<!-- 方式 2：使用 data-tooltip-key（推荐） -->
<button data-tooltip-key="delete">删除</button>
```

### 新功能开发

添加新文案：

1. 在 `I18N` 对象的 zh/en/ja 中添加键值
2. 通过 `t()` 函数获取文本
3. Tooltip 使用 `data-tooltip-key` 属性绑定键名

## 开发原则

### 核心原则

1. 简洁优先，不过度设计、避免不必要的抽象
2. 原生优先，能用原生 API 就不引入库
3. 组件复用，优先使用 `components.css` 中的通用组件
4. Token 优先，颜色、间距、字体通过 CSS 变量引用
5. 类型安全，JSDoc 注解 + 类型检查
6. 无构建依赖，代码直接运行在浏览器

### 文案规范

遵循「盘古之白」中文排版规范：

- 中文与英文/数字之间加空格 `R2 Web 是一个文件管理器`
- 数字与单位之间加空格 `文件大小 10 MB`
- 例外：度数、百分号不加空格 `50%`、`30°`

### UI/UX 重点

- 极度重视细节，动画流畅、交互响应快、反馈清晰
- 性能优先，懒加载、IntersectionObserver、防抖节流
- 响应式，移动端与桌面端体验一致

### 功能开发流程

1. 需求确认
2. 检查是否有可复用组件（`src/css/components.css`）
3. 使用设计 Token（`src/css/tokens.css`），避免硬编码
4. 新增文案添加到 `I18N` 对象（`src/script.js`）
5. 添加 JSDoc 注解
6. 手动测试（需配置 R2 桶 CORS）

### 安全注意

- 用户输入通过 `textContent` 插入 DOM，避免 `innerHTML`
- 配置分享链接包含凭证，提示用户谨慎分享
- 文件名、路径校验，防止路径遍历

## 常见任务

### 添加新组件样式

在 `src/css/components.css` 中定义：

```css
@layer components {
  .new-component {
    padding: var(--sp-4);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);

    &:hover {
      background: var(--bg-tertiary);
    }

    & .title {
      font-size: var(--text-lg);
      color: var(--text-primary);
    }
  }
}
```

### 添加新 i18n 文案

在 `src/script.js` 的 `I18N` 对象中添加：

```javascript
const I18N = {
  zh: {
    // ...
    newFeature: '新功能',
    newFeatureDesc: '这是一个新功能的描述'
  },
  en: {
    // ...
    newFeature: 'New Feature',
    newFeatureDesc: 'This is a description of the new feature'
  },
  ja: {
    // ...
    newFeature: '新機能',
    newFeatureDesc: 'これは新機能の説明です'
  }
}

// 使用
const title = t('newFeature')
const description = t('newFeatureDesc')

// 按钮文本
button.textContent = t('newFeature')

// Tooltip
element.dataset.tooltipKey = 'newFeature'
element.dataset.tooltip = t('newFeature')
```

### 修改现有组件样式

1. 优先检查 `src/css/tokens.css` 是否有合适的 Token
2. 在 `src/css/components.css` 中查找对应组件类（搜索 `.btn`、`.card` 等）
3. 修改或扩展组件样式，使用 CSS Nesting
4. 避免在 `src/style.css` 主文件中直接添加样式（仅作为导入入口）

**示例** 修改按钮悬停效果

```css
/* src/css/components.css */
@layer components {
  .btn {
    /* 现有样式 */

    &:hover {
      background: var(--bg-tertiary);
      transform: translateY(-1px); /* 新增悬浮效果 */
    }
  }
}
```

### 添加新对话框

1. 在 `src/index.html` 中添加 `<dialog>` 元素
2. 在 `src/script.js` 中添加控制逻辑（`showModal()`、`close()` 等）
3. 在 `I18N` 对象中添加相关文案

### 添加新 R2 API 操作

在 `R2Client` 类中添加方法（`src/script.js`）：

```javascript
class R2Client {
  /**
   * 新的 API 操作
   * @param {string} key - 对象键
   * @returns {Promise<Response>}
   */
  async newOperation(key) {
    const url = `${this.endpoint}/${encodeURIComponent(key)}`
    const request = new Request(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    // 使用 aws4fetch 签名
    const signedRequest = await this.signer.sign(request)
    const response = await fetch(signedRequest)

    if (!response.ok) {
      throw new Error(`操作失败: ${response.statusText}`)
    }

    return response
  }
}
```

## R2 API 集成

### CORS 要求

R2 桶必须配置 CORS 允许应用域名（详见 `readme.md`）。

### S3 API 操作

通过 `R2Client` 类实现：

- **ListObjectsV2** `R2Client.listObjects(prefix, continuationToken)`
- **PUT** `R2Client.uploadFile(key, file, onProgress)`
- **DELETE** `R2Client.deleteObject(key)`
- **HEAD** `R2Client.getObjectMetadata(key)`
- **COPY** `R2Client.copyObject(sourceKey, targetKey)`

所有请求通过 AWS Signature Version 4 签名（`aws4fetch` 库）。

### 文件预览

通过生成 Pre-signed URL 实现（`R2Client.getPresignedUrl(key, expiresIn)`）。

## 图片压缩

### 本地压缩

实现位置 `UploadManager.compressImageLocal()` 方法。

支持格式：
- **JPEG** 使用 `@jsquash/jpeg`（MozJPEG）
- **PNG** 使用 `@jsquash/oxipng`（OxiPNG 优化）
- **WebP** 使用 `@jsquash/webp`
- **AVIF** 使用 `@jsquash/avif`

### 云端压缩

实现位置 `UploadManager.compressImageCloud()` 方法。

使用 Tinify API，需配置 API Key，通过代理服务器中转（解决跨域）。

## 调试技巧

- **Network** 监控 R2 API 请求（查看请求头、响应状态）
- **Console** 查看错误日志、`console.log()` 调试输出
- **Application** 检查 localStorage（配置持久化）、Service Worker 状态
- **Performance** 分析渲染性能、IntersectionObserver 触发频率

**常见问题**
1. 上传失败 → 检查 CORS 配置、凭证是否正确
2. 预览无法加载 → 检查 Pre-signed URL 是否过期
3. 样式不生效 → 确认 CSS Layer 顺序、Token 引用是否正确
4. i18n 文案未更新 → 检查 `I18N` 对象是否包含键、`t()` 调用是否正确

## 总结

R2 Web 是一个极简、现代、高性能的纯前端应用，开发时应：

- ✅ 拥抱原生、组件复用、Token 驱动、i18n 优先、类型安全、细节至上
- ❌ 避免过度工程、避免硬编码

保持代码简洁、性能优先、用户体验至上。
