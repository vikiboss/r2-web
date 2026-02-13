# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 提供仓库开发指南。

## 项目速览

**R2 Web** — 纯客户端 Cloudflare R2 存储桶文件管理器，零构建、零框架、零后端。

**核心特性** 文件上传、目录浏览、文件预览、文件操作、图片压缩、PWA、多语言（zh/en/ja）、浅色/深色主题。

**代码规模** script.js 2914 行，components.css 1453 行，tokens.css 85 行。

**快速启动**
```bash
npx serve src
# 或
python3 -m http.server 5500 --directory src
```

## 代码地图

### 快速定位表

| 任务 | 文件 | 搜索关键词 | 行号 |
|------|------|-----------|------|
| 修改文件名模板逻辑 | script.js | `function applyFilenameTemplate` | 631 |
| 修改图片压缩逻辑 | script.js | `async function compressFile` | 1595 |
| 添加 i18n 文案 | script.js | `const I18N = {` | 37 |
| 修改按钮样式 | css/components.css | `.btn {` | - |
| 添加设计 Token | css/tokens.css | `@layer tokens {` | - |
| 修改 R2 API 操作 | script.js | `class R2Client {` | 730 |
| 修改文件浏览逻辑 | script.js | `class FileExplorer {` | 865 |
| 修改上传管理逻辑 | script.js | `class UploadManager {` | 1780 |

### 全局函数列表

**重要：以下是全局函数，不是类方法**

- `t(key, vars)` - i18n 翻译函数
- `applyFilenameTemplate(file, template)` - 631 行 - 文件名模板处理
  - 占位符：`[name]`、`[ext]`、`[hash:N]`、`[date:FORMAT]`、`[timestamp]`、`[uuid]`、`/`
  - 被 `UploadManager` 调用（1862 行）
- `compressFile(file, options)` - 1595 行 - 图片压缩
  - 内部通过 `config.compressMode` 判断模式（local/cloud/none）
  - **PNG 特殊处理**：直接优化缓冲区，不重新编码（与其他格式不同）
  - **自适应逻辑**：如果压缩后文件更大，使用原文件
  - 被 `UploadManager.uploadFiles()` 调用（1861 行）

## 项目结构

```
r2-web/
├── plan.md            — 原始需求文档
├── readme.md          — 项目说明、使用指南
├── package.json       — 依赖声明（仅用于类型提示）
├── jsconfig.json      — JSDoc 类型检查配置
└── src/               — 源码目录（即部署目录）
     ├── index.html    — 应用外壳、import map、对话框模板
     ├── script.js     — 应用逻辑（类架构，2914 行）
     ├── style.css     — 样式主入口（仅导入 css 子目录）
     └── css/          — 样式模块（CSS Layers）
          ├── reset.css       — CSS Reset
          ├── tokens.css      — 设计 Token（85 行，定义所有变量）
          ├── base.css        — 全局基础样式
          ├── layout.css      — 布局容器
          ├── components.css  — 通用 UI 组件（1453 行）
          ├── utilities.css   — 工具类
          └── animations.css  — 动画与过渡
```

## 开发环境

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

## 架构速查

### JavaScript 类架构

所有类定义在 `src/script.js` 中，采用单文件组织：

| 类 | 职责 | 搜索关键词 | 起始行 |
| --- | --- | --- | --- |
| `ConfigManager` | localStorage 持久化、Base64 配置分享 | `class ConfigManager` | 654 |
| `R2Client` | S3 API 客户端（基于 `aws4fetch` 签名） | `class R2Client` | 730 |
| `UIManager` | 主题、Toast、对话框、上下文菜单、Tooltip | `class UIManager` | 865 |
| `FileExplorer` | 目录导航、排序、分页、懒加载缩略图、列表缓存 | `class FileExplorer` | 1068 |
| `UploadManager` | 拖拽/粘贴上传、文件名模板、图片压缩 | `class UploadManager` | 1780 |
| `FilePreview` | 图片/视频/音频/文本预览 | `class FilePreview` | 2084 |
| `FileOperations` | 重命名、复制、移动、删除（递归删除文件夹） | `class FileOperations` | 2279 |
| `App` | 主协调器、i18n 处理 | `class App` | 2604 |

**应用初始化** 在 `src/script.js` 末尾（2914 行）：

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

// 缓存键包含 continuationToken，分页独立缓存
const cacheKey = `${prefix}::${continuationToken}`

// 刷新时可传 bypassCache = true 强制重新加载
await #loadPage(isInitial, bypassCache = false)
```

## CSS 速查

### CSS Layers

样式通过 `@layer` 组织优先级（`src/style.css`）：

```css
@layer reset, tokens, base, layout, components, utilities, animations;

@import './css/reset.css';
@import './css/tokens.css';
/* ... */
```

### 设计 Token

所有样式值通过 CSS 自定义属性定义（`src/css/tokens.css`，85 行）：

**Token 类别**
- **间距** `--sp-*`（1/2/3/4/5/6/8/10/12）
- **字体** `--text-*`（xs/sm/base/md/lg/xl）
- **颜色** `--bg-*`、`--text-*`、`--border-*`（light-dark 自适应）
- **圆角** `--radius-*`（sm/md/lg/xl/full）
- **动画** `--duration-*`（fast/normal/slow）、`--ease-*`（out/in-out）
- **Z-index** `--z-*`（dropzone/upload-panel/context-menu/dialog/toast/tooltip）

**使用方式** 在 `src/css/tokens.css` 查看完整定义。

**示例**
```css
.card {
  padding: var(--sp-4);
  gap: var(--sp-2);
  font-size: var(--text-base);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-out);
}
```

### 组件速查

**优先使用 `src/css/components.css`（1453 行）中的组件类**

**组件列表**
- 按钮：`.btn` `.btn-primary` `.btn-secondary` `.btn-danger` `.icon-btn`
- 输入：`.input` `.select` `.textarea`
- 对话框：`.dialog-header` `.dialog-body` `.dialog-footer`
- 卡片：`.card` `.card-header` `.card-body` `.card-footer`
- 标签：`.badge` `.tag`
- 其他：`.tooltip` `.context-menu` `.toast` `.dropzone`

**使用方式** 在 `src/css/components.css` 搜索组件名查看完整定义。

**Toast 和 Tooltip** 通过 JS 控制

```javascript
// Toast
uiManager.toast('操作成功', 'success')
uiManager.toast('操作失败', 'error')

// Tooltip
element.dataset.tooltip = '提示文本'
element.dataset.tooltipKey = 'i18nKey' // 支持 i18n
```

### 设计风格

- 黑白灰 + R2 橙色强调（`--accent: #f6821f`）
- 小圆角（4-8px）、扁平化、无阴影或极少阴影
- 紧凑小边距

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

## i18n 速查

### 多语言机制

- **I18N 对象** `script.js` 第 37 行（150+ 键值）
- **翻译函数** `t(key, vars)` 支持变量替换
- **支持语言** zh（中文）、en（英语）、ja（日语）
- **语言切换** `App.updateLanguage()` 自动更新所有文案

### 添加新文案

1. 在 `I18N` 对象添加 zh/en/ja 键值（script.js:37）
2. 代码中使用 `t('key')` 或 `t('key', { var: 'value' })`
3. HTML 元素使用 `data-tooltip-key="key"` 支持动态更新

**示例**

```javascript
// 1. 在 I18N 对象添加
const I18N = {
  zh: {
    deleteConfirm: '确定删除 {name} 吗？',
    deleteSuccess: '删除成功'
  },
  en: {
    deleteConfirm: 'Delete {name}?',
    deleteSuccess: 'Deleted successfully'
  },
  ja: {
    deleteConfirm: '{name} を削除しますか？',
    deleteSuccess: '削除しました'
  }
}

// 2. 代码中使用
const message = t('deleteConfirm', { name: fileName })
uiManager.toast(t('deleteSuccess'), 'success')

// 3. Tooltip 使用
button.dataset.tooltipKey = 'deleteConfirm'
button.dataset.tooltip = t('deleteConfirm')
```

## R2 API 集成

### CORS 要求

R2 桶必须配置 CORS 允许应用域名（详见 `readme.md`）。

### R2Client 类方法

完整方法列表（`src/script.js`，730 行起）：

| 方法 | 功能 | 位置 |
|------|------|------|
| `listObjects(prefix, continuationToken)` | 列出对象（ListObjectsV2） | 749 |
| `getPresignedUrl(key, expiresIn)` | 生成预签名 URL | 804 |
| `getPublicUrl(key)` | 生成公开 URL | 814 |
| `getObjectMetadata(key)` | 获取对象元数据（HEAD） | 823 |
| `deleteObject(key)` | 删除对象 | 836 |
| `copyObject(sourceKey, targetKey)` | 复制对象 | 843 |
| `createFolder(key)` | 创建文件夹（零字节对象） | 856 |
| `uploadFile(key, file, onProgress)` | 上传文件（PUT） | 786 |

所有请求通过 AWS Signature Version 4 签名（`aws4fetch` 库）。

### 添加新 API 操作

在 `R2Client` 类中添加方法（`src/script.js:730`）：

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

## 性能优化

### 关键优化点

- **IntersectionObserver** 懒加载缩略图（`FileExplorer.#setupIntersectionObserver()`）
- **列表缓存** 5 分钟 TTL，减少 API 请求（`FileExplorer.#cache`）
- **防抖节流** 搜索、滚动事件（使用原生 `debounce`/`throttle`）
- **Promise.all** 批量操作（删除、复制等）
- **ViewTransition API** 平滑页面切换（`document.startViewTransition()`）
- **图片压缩自适应** 压缩后更大则用原文件（`compressFile()` 1595 行）

### 性能监控

- **Network** 监控 R2 API 请求（签名、CORS）
- **Performance** 分析渲染性能、IntersectionObserver 触发频率
- **Lighthouse** 审计 PWA、性能、可访问性

## 开发原则

### 核心原则

1. **简洁优先** 不过度设计、避免不必要的抽象
2. **原生优先** 能用原生 API 就不引入库
3. **组件复用** 优先使用 `components.css` 中的通用组件
4. **Token 优先** 颜色、间距、字体通过 CSS 变量引用
5. **类型安全** JSDoc 注解 + 类型检查
6. **无构建依赖** 代码直接运行在浏览器

### 文案规范

遵循「盘古之白」中文排版规范：

- 中文与英文/数字之间加空格 `R2 Web 是一个文件管理器`
- 数字与单位之间加空格 `文件大小 10 MB`
- 例外：度数、百分号不加空格 `50%`、`30°`

### UI/UX 重点

- 极度重视细节，动画流畅、交互响应快、反馈清晰
- 性能优先，懒加载、IntersectionObserver、防抖节流
- 响应式，移动端与桌面端体验一致

## 常见开发任务

### 添加新功能完整流程

1. 需求确认
2. 检查是否有可复用组件（`src/css/components.css`）
3. 使用设计 Token（`src/css/tokens.css`），避免硬编码
4. 新增文案添加到 `I18N` 对象（`src/script.js:37`）
5. 添加 JSDoc 注解
6. 手动测试（需配置 R2 桶 CORS）

### 添加新组件样式

在 `src/css/components.css` 中定义：

```css
@layer components {
  .new-component {
    padding: var(--sp-4);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    transition: all var(--duration-fast) var(--ease-out);

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

### 修改现有组件样式

1. 优先检查 `src/css/tokens.css` 是否有合适的 Token
2. 在 `src/css/components.css` 中查找对应组件类
3. 修改或扩展组件样式，使用 CSS Nesting
4. 避免在 `src/style.css` 主文件中直接添加样式

### 添加新对话框

1. 在 `src/index.html` 中添加 `<dialog>` 元素
2. 在 `src/script.js` 中添加控制逻辑（`showModal()`、`close()` 等）
3. 在 `I18N` 对象中添加相关文案

## 调试指南

### DevTools 使用

- **Network** 监控 R2 API 请求（查看请求头、响应状态）
- **Console** 查看错误日志、`console.log()` 调试输出
- **Application** 检查 localStorage（配置持久化）、Service Worker 状态
- **Performance** 分析渲染性能、IntersectionObserver 触发频率

### 常见问题速查

| 问题 | 检查项 |
|------|--------|
| 上传失败 | CORS 配置、凭证有效性 |
| 预览无法加载 | Pre-signed URL 是否过期（默认 1 小时） |
| 样式不生效 | CSS Layer 顺序、Token 引用是否正确 |
| i18n 未更新 | I18N 对象键值、`t()` 调用是否正确 |
| 缓存不刷新 | 传 `bypassCache = true` 参数 |
| 压缩失败 | 检查文件格式、压缩库是否加载 |

### 安全注意

- 用户输入通过 `textContent` 插入 DOM，避免 `innerHTML`
- 配置分享链接包含凭证，提示用户谨慎分享
- 文件名、路径校验，防止路径遍历

## 总结

R2 Web 是一个极简、现代、高性能的纯前端应用，开发时应：

- ✅ 拥抱原生、组件复用、Token 驱动、i18n 优先、类型安全、细节至上
- ❌ 避免过度工程、避免硬编码

保持代码简洁、性能优先、用户体验至上。
