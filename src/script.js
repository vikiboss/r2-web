// ========================================================================
// R2 Manager — Application Script (ES Module)
// ========================================================================

import { AwsClient } from 'aws4fetch'
import dayjs from 'dayjs'
import imageCompression from 'browser-image-compression'
import { filesize } from 'filesize'

// --- Constants ---
const STORAGE_KEY = 'r2-manager-config'
const THEME_KEY = 'r2-manager-theme'
const LANG_KEY = 'r2-manager-lang'
const VIEW_KEY = 'r2-manager-view'
const DENSITY_KEY = 'r2-manager-density'
const SORT_BY_KEY = 'r2-manager-sort-by'
const PAGE_SIZE = 100
const TOAST_DURATION = 3000
const MAX_UPLOAD_SIZE = 300 * 1024 * 1024 // 300 MB

// File type patterns
const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|avif)$/i
const TEXT_RE =
  /\.(txt|md|json|xml|csv|html|css|js|ts|jsx|tsx|yaml|yml|toml|ini|cfg|conf|log|sh|bash|py|rb|go|rs|java|c|cpp|h|hpp|sql|env|gitignore|dockerfile)$/i
const AUDIO_RE = /\.(mp3|wav|ogg|flac|aac|m4a|wma)$/i
const VIDEO_RE = /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i

// --- i18n ---
const I18N = {
  zh: {
    appTitle: 'R2 Web',
    connectTitle: '连接到 R2',
    connectDesc: '填写你的 R2 凭据即可开始，放心，数据只留在你的浏览器里。',
    accountId: '账户 ID（Account ID）',
    accessKeyId: '访问密钥 ID（Access Key ID）',
    secretAccessKey: '秘密访问密钥（Secret Access Key）',
    bucketName: '存储桶名称（Bucket Name）',
    filenameTpl: '文件名模板（Filename Template）',
    filenameTplHint:
      '占位符: [name] 原始名, [ext] 扩展名, [hash:N] 哈希, [date:FORMAT] 日期, [timestamp] 时间戳, [uuid], 斜杠代表目录',
    cancel: '取消',
    connect: '连接',
    newFolder: '新建目录',
    upload: '上传',
    dropToUpload: '松手即可上传',
    pasteToUpload: '已粘贴 {count} 个文件',
    uploadHint: '拖放、粘贴或点击即可上传',
    pasteHint: '粘贴文件到当前目录',
    uploading: '正在上传...',
    root: '根目录',
    emptyFolder: '这里空空的，上传点什么吧',
    uploadFiles: '上传文件',
    loadMore: '加载更多',
    preview: '预览',
    download: '下载',
    rename: '重命名',
    copy: '复制',
    move: '移动',
    delete: '删除',
    confirm: '确认',
    ok: '好的',
    deleteConfirmTitle: '删除确认',
    deleteConfirmMsg: '确定要删除 "{name}" 吗？删除后无法恢复哦。',
    deleteFolderConfirmMsg: '确定要删除目录 "{name}" 及其所有内容吗？删除后无法恢复哦。',
    renameTitle: '重命名',
    renameLabel: '新名称',
    copyTitle: '复制到',
    copyLabel: '目标路径',
    moveTitle: '移动到',
    moveLabel: '目标路径',
    newFolderTitle: '新建目录',
    newFolderLabel: '目录名称',
    authFailed: '连接失败了，检查一下凭据吧',
    customDomain: '自定义域名（Custom Domain）',
    customDomainHint: '可选，配置后可一键复制文件的公开链接',
    copyLink: '复制链接',
    copyUrl: '复制 URL 直链',
    copyMarkdown: '复制为 Markdown 格式',
    copyHtml: '复制为 HTML 格式',
    copyPresigned: '复制 R2 预签名 URL',
    linkCopied: '链接已复制好啦',
    corsError:
      'CORS 还没配置好。去 Cloudflare 仪表盘 → R2 → 存储桶设置添加 CORS 规则，允许当前域名的 GET/PUT/DELETE/HEAD 请求即可。',
    networkError: '网络好像有点问题: {msg}',
    uploadSuccess: '{count} 个文件上传成功',
    uploadPartialFail: '{success} 个成功，{fail} 个没能上传',
    fileTooLarge: '文件 "{name}" 太大了（超过 5GB），试试 rclone 等工具吧',
    deleteSuccess: '"{name}" 已删除',
    renameSuccess: '已重命名为 "{name}"',
    copySuccess: '已复制到 "{name}"',
    moveSuccess: '已移动到 "{name}"',
    folderCreated: '目录 "{name}" 创建好了',
    previewNotAvailable: '这种文件类型暂时还不能预览',
    size: '大小',
    lastModified: '最后修改',
    contentType: '类型',
    settings: '设置',
    toggleTheme: '切换主题',
    close: '关闭',
    shareConfig: '分享配置',
    shareConfigCopied: '分享链接已复制，含凭据请谨慎分享',
    configLoadedFromUrl: '已从链接加载配置，开始使用吧',
    preferences: '偏好设置',
    uploadSettings: '上传设置',
    r2Connection: 'R2 连接',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    sort: '排序',
    sortName: '按名称',
    sortDate: '按日期',
    sortSize: '按大小',
    sortAsc: '升序',
    sortDesc: '降序',
    viewGrid: '网格',
    viewList: '列表',
    densityCompact: '紧凑',
    densityNormal: '标准',
    densityLoose: '宽松',
    save: '保存',
    heroDesc: '轻盈优雅的 Web 原生 Cloudflare R2 文件管理器，一切皆在浏览器中完成。',
    heroConnect: '开始连接',
    heroF1: '简单优雅高效',
    heroF2: '纯本地客户端',
    heroF3: '目录文件管理',
    heroF4: '常见类型预览',
    heroF5: '拖拽粘贴上传',
    heroF6: '上传自动压缩',
    heroF7: '一键复制外链',
    heroF8: '一键分享配置',
    refresh: '刷新',
    logout: '安全退出',
    logoutConfirmTitle: '安全退出',
    logoutConfirmMsg: '退出后会清除浏览器中的凭据，存储桶里的文件不会受影响。确定退出吗？',
  },
  en: {
    appTitle: 'R2 Web',
    connectTitle: 'Connect to R2',
    connectDesc:
      'Enter your R2 credentials to get started. Everything stays safely in your browser.',
    accountId: 'Account ID',
    accessKeyId: 'Access Key ID',
    secretAccessKey: 'Secret Access Key',
    bucketName: 'Bucket Name',
    filenameTpl: 'Filename Template',
    filenameTplHint:
      'Placeholders: [name] original, [ext] extension, [hash:N] hash, [date:FORMAT] date, [timestamp] ts, [uuid], / = directory',
    cancel: 'Cancel',
    connect: 'Connect',
    newFolder: 'New Folder',
    upload: 'Upload',
    dropToUpload: 'Drop to upload',
    pasteToUpload: 'Pasted {count} file(s)',
    uploadHint: 'Drag, paste, or click to upload',
    pasteHint: 'Paste files to current directory',
    uploading: 'Uploading...',
    root: 'Root',
    emptyFolder: 'Nothing here yet — upload something!',
    uploadFiles: 'Upload Files',
    loadMore: 'Load More',
    preview: 'Preview',
    download: 'Download',
    rename: 'Rename',
    copy: 'Copy',
    move: 'Move',
    delete: 'Delete',
    confirm: 'Confirm',
    ok: 'OK',
    deleteConfirmTitle: 'Delete Confirmation',
    deleteConfirmMsg: 'Delete "{name}"? This can\'t be undone.',
    deleteFolderConfirmMsg: 'Delete folder "{name}" and everything inside? This can\'t be undone.',
    renameTitle: 'Rename',
    renameLabel: 'New name',
    copyTitle: 'Copy to',
    copyLabel: 'Destination path',
    moveTitle: 'Move to',
    moveLabel: 'Destination path',
    newFolderTitle: 'New Folder',
    newFolderLabel: 'Folder name',
    authFailed: "Couldn't connect — double-check your credentials",
    customDomain: 'Custom Domain',
    customDomainHint: 'Optional. Enables one-click public URL copying.',
    copyLink: 'Copy Link',
    copyUrl: 'Copy Direct URL',
    copyMarkdown: 'Copy as Markdown',
    copyHtml: 'Copy as HTML',
    copyPresigned: 'Copy R2 Pre-signed URL',
    linkCopied: 'Link copied!',
    corsError:
      "CORS isn't set up yet. Head to Cloudflare Dashboard → R2 → Bucket Settings and add a CORS rule allowing GET/PUT/DELETE/HEAD from your origin.",
    networkError: 'Network hiccup: {msg}',
    uploadSuccess: '{count} file(s) uploaded!',
    uploadPartialFail: "{success} uploaded, {fail} didn't make it",
    fileTooLarge: '"{name}" is too large (over 5GB) — try rclone for big uploads',
    deleteSuccess: '"{name}" deleted',
    renameSuccess: 'Renamed to "{name}"',
    copySuccess: 'Copied to "{name}"',
    moveSuccess: 'Moved to "{name}"',
    folderCreated: 'Folder "{name}" created!',
    previewNotAvailable: "Can't preview this file type yet",
    size: 'Size',
    lastModified: 'Last Modified',
    contentType: 'Type',
    settings: 'Settings',
    toggleTheme: 'Toggle Theme',
    close: 'Close',
    shareConfig: 'Share Config',
    shareConfigCopied: 'Share link copied (contains credentials)',
    configLoadedFromUrl: 'Config loaded, ready to go!',
    preferences: 'Preferences',
    uploadSettings: 'Upload',
    r2Connection: 'R2',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    sort: 'Sort',
    sortName: 'By Name',
    sortDate: 'By Date',
    sortSize: 'By Size',
    sortAsc: 'Ascending',
    sortDesc: 'Descending',
    viewGrid: 'Grid',
    viewList: 'List',
    densityCompact: 'Compact',
    densityNormal: 'Standard',
    densityLoose: 'Loose',
    save: 'Save',
    heroDesc: 'A lightweight & elegant R2 bucket manager, all in your browser.',
    heroConnect: 'Get Started',
    heroF1: 'Simple & elegant',
    heroF2: 'Pure local client',
    heroF3: 'File management',
    heroF4: 'Common type preview',
    heroF5: 'Drag & paste upload',
    heroF6: 'Auto compress upload',
    heroF7: 'One-click copy link',
    heroF8: 'One-click share config',
    refresh: 'Refresh',
    logout: 'Logout',
    logoutConfirmTitle: 'Logout',
    logoutConfirmMsg:
      "This will clear your saved credentials. Files in the bucket won't be affected. Continue?",
  },
  ja: {
    appTitle: 'R2 Web',
    connectTitle: 'R2 に接続',
    connectDesc: 'R2 の認証情報を入力して始めましょう。データはブラウザにのみ保存されます。',
    accountId: 'アカウント ID（Account ID）',
    accessKeyId: 'アクセスキー ID（Access Key ID）',
    secretAccessKey: 'シークレットアクセスキー（Secret Access Key）',
    bucketName: 'バケット名（Bucket Name）',
    filenameTpl: 'ファイル名テンプレート（Filename Template）',
    filenameTplHint:
      'プレースホルダ: [name] 元名, [ext] 拡張子, [hash:N] ハッシュ, [date:FORMAT] 日付, [timestamp] タイムスタンプ, [uuid], / ディレクトリ',
    cancel: 'キャンセル',
    connect: '接続',
    newFolder: '新規フォルダ',
    upload: 'アップロード',
    dropToUpload: 'ドロップしてアップロード',
    pasteToUpload: '{count} 個のファイルを貼り付けました',
    uploadHint: 'ドラッグ、貼り付け、クリックでアップロード',
    pasteHint: '現在のディレクトリにファイルを貼り付け',
    uploading: 'アップロード中...',
    root: 'ルート',
    emptyFolder: 'まだ何もありません — アップロードしてみましょう',
    uploadFiles: 'ファイルをアップロード',
    loadMore: 'もっと読み込む',
    preview: 'プレビュー',
    download: 'ダウンロード',
    rename: '名前変更',
    copy: 'コピー',
    move: '移動',
    delete: '削除',
    confirm: '確認',
    ok: 'OK',
    deleteConfirmTitle: '削除の確認',
    deleteConfirmMsg: '"{name}" を削除しますか？元に戻せません。',
    deleteFolderConfirmMsg: 'フォルダ "{name}" とその中身をすべて削除しますか？元に戻せません。',
    renameTitle: '名前変更',
    renameLabel: '新しい名前',
    copyTitle: 'コピー先',
    copyLabel: 'コピー先パス',
    moveTitle: '移動先',
    moveLabel: '移動先パス',
    newFolderTitle: '新規フォルダ',
    newFolderLabel: 'フォルダ名',
    authFailed: '接続できませんでした — 認証情報を確認してみてください',
    customDomain: 'カスタムドメイン（Custom Domain）',
    customDomainHint: '任意。設定するとワンクリックで公開URLをコピーできます。',
    copyLink: 'リンクをコピー',
    copyUrl: '直接 URL をコピー',
    copyMarkdown: 'Markdown 形式でコピー',
    copyHtml: 'HTML 形式でコピー',
    copyPresigned: 'R2 署名付き URL をコピー',
    linkCopied: 'リンクをコピーしました！',
    corsError:
      'CORS がまだ設定されていません。Cloudflare ダッシュボード → R2 → バケット設定で CORS ルールを追加してください。',
    networkError: 'ネットワークに問題があるようです: {msg}',
    uploadSuccess: '{count} 個のファイルをアップロードしました！',
    uploadPartialFail: '{success} 個成功、{fail} 個は失敗しました',
    fileTooLarge: '"{name}" は大きすぎます（5GB超）— rclone などをお試しください',
    deleteSuccess: '"{name}" を削除しました',
    renameSuccess: '"{name}" に名前を変更しました',
    copySuccess: '"{name}" にコピーしました',
    moveSuccess: '"{name}" に移動しました',
    folderCreated: 'フォルダ "{name}" を作成しました！',
    previewNotAvailable: 'このファイルタイプはまだプレビューできません',
    size: 'サイズ',
    lastModified: '最終更新',
    contentType: 'タイプ',
    settings: '設定',
    toggleTheme: 'テーマ切替',
    close: '閉じる',
    shareConfig: '設定を共有',
    shareConfigCopied: '共有リンクをコピー（認証情報を含む）',
    configLoadedFromUrl: '設定を読み込みました、始めましょう！',
    preferences: '設定',
    uploadSettings: 'アップロード',
    r2Connection: 'R2',
    theme: 'テーマ',
    themeLight: 'ライト',
    themeDark: 'ダーク',
    sort: '並び替え',
    sortName: '名前順',
    sortDate: '日付順',
    sortSize: 'サイズ順',
    sortAsc: '昇順',
    sortDesc: '降順',
    viewGrid: 'グリッド',
    viewList: 'リスト',
    densityCompact: 'コンパクト',
    densityNormal: '標準',
    densityLoose: 'ルーズ',
    save: '保存',
    heroDesc: '軽量でエレガントな R2 バケットマネージャー、すべてブラウザで完結。',
    heroConnect: '始めましょう',
    heroF1: 'シンプル＆エレガント',
    heroF2: 'ローカルクライアント',
    heroF3: 'ファイル管理',
    heroF4: '一般プレビュー',
    heroF5: 'ドラッグ＆ペースト',
    heroF6: 'アップロード自動圧縮',
    heroF7: 'ワンクリックリンクコピー',
    heroF8: 'ワンクリック設定共有',
    refresh: 'リフレッシュ',
    logout: 'ログアウト',
    logoutConfirmTitle: 'ログアウト',
    logoutConfirmMsg:
      '保存された認証情報が削除されます。バケット内のファイルには影響しません。続行しますか？',
  },
}

/** @typedef {keyof typeof I18N} Lang */
/** @typedef {keyof typeof I18N.en} I18nKey */
/** @typedef {{ accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string; filenameTpl?: string; customDomain?: string; theme?: string; lang?: string; compressMode?: string; compressLevel?: string; tinifyKey?: string }} R2Config */
/** @typedef {{ key: string; isFolder: boolean; size?: number; lastModified?: string }} FileItem */

let currentLang = /** @type {Lang} */ (localStorage.getItem(LANG_KEY) || 'zh')

/** @param {I18nKey} key @param {Record<string, string | number>} [params] @returns {string} */
function t(key, params = {}) {
  let str = I18N[currentLang]?.[key] || I18N.en[key] || key
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(`{${k}}`, String(v))
  }
  return str
}

/** @param {Lang} lang */
function setLang(lang) {
  currentLang = lang
  localStorage.setItem(LANG_KEY, lang)
}

// --- Helpers ---
/** @type {<T extends HTMLElement = HTMLElement>(sel: string, ctx?: ParentNode) => T} */
const $ = (sel, ctx = document) => /** @type {*} */ (ctx.querySelector(sel))

/** @param {string} dateStr @returns {string} */
function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(
    currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : 'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

/** @param {string} key @returns {string} */
function getFileName(key) {
  const parts = key.replace(/\/$/, '').split('/')
  return parts[parts.length - 1]
}

/** @param {string} name @returns {string} */
function getExtension(name) {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(i + 1) : ''
}

/** @param {string} name @returns {string} */
function getBaseName(name) {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

/** @param {string} key @returns {string} */
function getMimeType(key) {
  const ext = getExtension(key).toLowerCase()
  /** @type {Record<string, string>} */
  const map = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    avif: 'image/avif',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    json: 'application/json',
    xml: 'application/xml',
    pdf: 'application/pdf',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
  }
  return map[ext] || 'application/octet-stream'
}

/** @param {string} key @returns {string} */
function encodeS3Key(key) {
  return key.split('/').map(encodeURIComponent).join('/')
}

/** @param {File} file @returns {Promise<string>} */
async function computeFileHash(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** @param {string} template @param {File} file @returns {Promise<string>} */
async function applyFilenameTemplate(template, file) {
  if (!template?.trim()) return file.name

  const originalName = file.name
  const ext = getExtension(originalName)
  const base = getBaseName(originalName)
  const fileHash = await computeFileHash(file)

  let result = template
  result = result.replace(/\[name\]/g, base)
  result = result.replace(/\[ext\]/g, ext)
  result = result.replace(/\[timestamp\]/g, String(Math.floor(Date.now() / 1000)))
  result = result.replace(/\[uuid\]/g, crypto.randomUUID())
  result = result.replace(/\[hash:(\d+)\]/g, (_, n) =>
    fileHash.slice(0, parseInt(/** @type {string} */ (n), 10)),
  )
  result = result.replace(/\[hash\]/g, fileHash.slice(0, 8))
  result = result.replace(/\[date:([^\]]+)\]/g, (_, format) =>
    dayjs().format(/** @type {string} */ (format)),
  )

  return result
}

// ========================================================================
// ConfigManager
// ========================================================================
class ConfigManager {
  /** @returns {R2Config} */
  load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') || {}
    } catch {
      return /** @type {R2Config} */ ({})
    }
  }

  /** @param {R2Config} cfg */
  save(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  }

  /** @returns {R2Config} */
  get() {
    return this.load()
  }

  clear() {
    localStorage.removeItem(STORAGE_KEY)
  }

  isValid() {
    const c = this.load()
    return !!(c.accountId && c.accessKeyId && c.secretAccessKey && c.bucket)
  }

  getEndpoint() {
    const c = this.load()
    return `https://${c.accountId}.r2.cloudflarestorage.com`
  }

  getBucketUrl() {
    const c = this.load()
    return `${this.getEndpoint()}/${c.bucket}`
  }

  toBase64() {
    const cfg = this.load()
    return btoa(unescape(encodeURIComponent(JSON.stringify(cfg))))
  }

  /** @param {string} b64 @returns {boolean} */
  loadFromBase64(b64) {
    try {
      const json = decodeURIComponent(escape(atob(b64)))
      const cfg = JSON.parse(json)
      if (cfg.accountId && cfg.accessKeyId && cfg.secretAccessKey && cfg.bucket) {
        this.save(cfg)
        return true
      }
    } catch {
      /* invalid base64 or JSON */
    }
    return false
  }

  getShareUrl() {
    const b64 = this.toBase64()
    const url = new URL(window.location.href)
    url.searchParams.set('config', b64)
    // Clean hash
    url.hash = ''
    return url.toString()
  }
}

// ========================================================================
// R2Client
// ========================================================================
class R2Client {
  /** @type {AwsClient | null} */
  #client = null
  /** @type {ConfigManager | null} */
  #config = null

  /** @param {ConfigManager} configManager */
  init(configManager) {
    this.#config = configManager
    const cfg = configManager.get()
    this.#client = new AwsClient({
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      service: 's3',
      region: 'auto',
    })
  }

  /** @param {string} [prefix] @param {string} [continuationToken] */
  async listObjects(prefix = '', continuationToken = '') {
    const url = new URL(/** @type {ConfigManager} */ (this.#config).getBucketUrl())
    url.searchParams.set('list-type', '2')
    url.searchParams.set('delimiter', '/')
    url.searchParams.set('max-keys', String(PAGE_SIZE))
    if (prefix) url.searchParams.set('prefix', prefix)
    if (continuationToken) url.searchParams.set('continuation-token', continuationToken)

    const res = await /** @type {AwsClient} */ (this.#client).fetch(url.toString())
    if (!res.ok) throw new Error(res.status === 403 ? 'AUTH_FAILED' : `HTTP ${res.status}`)

    const text = await res.text()
    const doc = new DOMParser().parseFromString(text, 'application/xml')

    /** @type {FileItem[]} */
    const folders = [...doc.querySelectorAll('CommonPrefixes > Prefix')].map(el => ({
      key: el.textContent ?? '',
      isFolder: true,
    }))

    /** @type {FileItem[]} */
    const files = [...doc.querySelectorAll('Contents')]
      .map(el => ({
        key: el.querySelector('Key')?.textContent ?? '',
        size: parseInt(el.querySelector('Size')?.textContent ?? '0', 10),
        lastModified: el.querySelector('LastModified')?.textContent ?? '',
        isFolder: false,
      }))
      .filter(f => f.key !== prefix) // filter out the prefix itself

    const isTruncated = doc.querySelector('IsTruncated')?.textContent === 'true'
    const nextToken = doc.querySelector('NextContinuationToken')?.textContent || ''

    return { folders, files, isTruncated, nextToken }
  }

  /** @param {string} key @param {string} contentType */
  async putObjectSigned(key, contentType) {
    const url = `${/** @type {ConfigManager} */ (this.#config).getBucketUrl()}/${encodeS3Key(key)}`
    const req = await /** @type {AwsClient} */ (this.#client).sign(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    })
    return { url: req.url, headers: Object.fromEntries(req.headers.entries()) }
  }

  /** @param {string} key */
  async getObject(key) {
    const url = `${/** @type {ConfigManager} */ (this.#config).getBucketUrl()}/${encodeS3Key(key)}`
    const res = await /** @type {AwsClient} */ (this.#client).fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res
  }

  /** @param {string} key */
  async getPresignedUrl(key) {
    const url = `${/** @type {ConfigManager} */ (this.#config).getBucketUrl()}/${encodeS3Key(key)}`
    const signed = await /** @type {AwsClient} */ (this.#client).sign(url, {
      method: 'GET',
      aws: { signQuery: true },
    })
    return signed.url
  }

  /** @param {string} key */
  getPublicUrl(key) {
    const cfg = /** @type {ConfigManager} */ (this.#config).get()
    if (cfg.customDomain) {
      return `${cfg.customDomain}/${encodeS3Key(key)}`
    }
    return null
  }

  /** @param {string} key */
  async headObject(key) {
    const url = `${/** @type {ConfigManager} */ (this.#config).getBucketUrl()}/${encodeS3Key(key)}`
    const res = await /** @type {AwsClient} */ (this.#client).fetch(url, { method: 'HEAD' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return {
      contentType: res.headers.get('content-type'),
      contentLength: parseInt(res.headers.get('content-length') || '0', 10),
      lastModified: res.headers.get('last-modified'),
      etag: res.headers.get('etag'),
    }
  }

  /** @param {string} key */
  async deleteObject(key) {
    const url = `${/** @type {ConfigManager} */ (this.#config).getBucketUrl()}/${encodeS3Key(key)}`
    const res = await /** @type {AwsClient} */ (this.#client).fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }

  /** @param {string} src @param {string} dest */
  async copyObject(src, dest) {
    const cfg = /** @type {ConfigManager} */ (this.#config).get()
    const url = `${/** @type {ConfigManager} */ (this.#config).getBucketUrl()}/${encodeS3Key(dest)}`
    const res = await /** @type {AwsClient} */ (this.#client).fetch(url, {
      method: 'PUT',
      headers: {
        'x-amz-copy-source': `/${cfg.bucket}/${encodeS3Key(src)}`,
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }

  /** @param {string} prefix */
  async createFolder(prefix) {
    const key = prefix.endsWith('/') ? prefix : prefix + '/'
    const url = `${/** @type {ConfigManager} */ (this.#config).getBucketUrl()}/${encodeS3Key(key)}`
    const res = await /** @type {AwsClient} */ (this.#client).fetch(url, {
      method: 'PUT',
      headers: { 'Content-Length': '0' },
      body: '',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }
}

// ========================================================================
// UIManager
// ========================================================================
class UIManager {
  initTheme() {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'dark' ? 'light' : 'dark'
    const apply = () => {
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem(THEME_KEY, next)
    }
    if (document.startViewTransition) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  /** @param {string} theme */
  setTheme(theme) {
    const apply = () => {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem(THEME_KEY, theme)
    }
    if (document.startViewTransition) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }

  /** @param {string} message @param {'info' | 'success' | 'error'} [type] */
  toast(message, type = 'info') {
    const icons = {
      success:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    }
    const container = $('#toast-container')
    const el = document.createElement('div')
    el.className = `toast ${type}`
    el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`
    container.appendChild(el)
    const duration = message.length > 80 ? TOAST_DURATION * 2 : TOAST_DURATION
    setTimeout(() => {
      el.classList.add('removing')
      el.addEventListener('animationend', () => el.remove())
    }, duration)
  }

  showSkeleton() {
    $('#skeleton-grid').hidden = false
    $('#file-grid').hidden = true
    $('#empty-state').hidden = true
  }

  hideSkeleton() {
    $('#skeleton-grid').hidden = true
    $('#file-grid').hidden = false
  }

  showEmptyState() {
    $('#empty-state').hidden = false
    $('#file-grid').hidden = true
  }

  hideEmptyState() {
    $('#empty-state').hidden = true
  }

  /** @param {number} x @param {number} y @param {string} key @param {boolean} isFolder */
  showContextMenu(x, y, key, isFolder) {
    const menu = $('#context-menu')
    menu.dataset.key = key
    menu.dataset.isFolder = String(isFolder)

    // Hide preview/download/copyLink and their separator for folders
    const previewBtn = $('[data-action="preview"]', menu)
    const downloadBtn = $('[data-action="download"]', menu)
    const copyLinkBtn = $('#ctx-copy-link', menu)
    const fileSep = $('#ctx-sep-file', menu)
    previewBtn.hidden = isFolder
    downloadBtn.hidden = isFolder
    copyLinkBtn.hidden = isFolder
    fileSep.hidden = isFolder

    // Position before showing so getBoundingClientRect works after popover opens
    menu.style.left = x + 'px'
    menu.style.top = y + 'px'
    menu.showPopover()

    // Adjust if overflowing viewport
    const rect = menu.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right > vw) menu.style.left = vw - rect.width - 8 + 'px'
    if (rect.bottom > vh) menu.style.top = vh - rect.height - 8 + 'px'

    // Flip submenu to left if it would overflow viewport right edge
    const submenu = $('.context-submenu', menu)
    if (submenu) {
      submenu.classList.toggle('flip-left', rect.right + 160 > vw)
    }
  }

  hideContextMenu() {
    const menu = $('#context-menu')
    try {
      menu.hidePopover()
    } catch {
      /* already hidden */
    }
  }

  /** @param {string} title @param {string} label @param {string} [defaultValue] @returns {Promise<string | null>} */
  prompt(title, label, defaultValue = '') {
    return new Promise(resolve => {
      const dialog = /** @type {HTMLDialogElement} */ ($('#prompt-dialog'))
      const form = $('#prompt-form')
      const input = /** @type {HTMLInputElement} */ ($('#prompt-input'))
      $('#prompt-title').textContent = title
      $('#prompt-label').textContent = label
      input.value = defaultValue

      /** @type {string | null} */
      let result = null

      /** @param {Event} e */
      const onSubmit = e => {
        e.preventDefault()
        result = input.value.trim() || null
        dialog.close()
      }

      const onCancel = () => dialog.close()

      /** @param {Event} e */
      const onBackdropClick = e => {
        if (e.target === dialog) dialog.close()
      }

      const onClose = () => {
        form.removeEventListener('submit', onSubmit)
        $('#prompt-cancel').removeEventListener('click', onCancel)
        dialog.removeEventListener('click', onBackdropClick)
        resolve(result)
      }

      form.addEventListener('submit', onSubmit)
      $('#prompt-cancel').addEventListener('click', onCancel)
      dialog.addEventListener('click', onBackdropClick)
      dialog.addEventListener('close', onClose, { once: true })
      dialog.showModal()
      input.focus()
      input.select()
    })
  }

  /** @param {string} title @param {string} message @returns {Promise<boolean>} */
  confirm(title, message) {
    return new Promise(resolve => {
      const dialog = /** @type {HTMLDialogElement} */ ($('#confirm-dialog'))
      const form = $('#confirm-form')
      $('#confirm-title').textContent = title
      $('#confirm-message').textContent = message

      let result = false

      /** @param {Event} e */
      const onSubmit = e => {
        e.preventDefault()
        result = true
        dialog.close()
      }

      const onCancel = () => dialog.close()

      /** @param {Event} e */
      const onBackdropClick = e => {
        if (e.target === dialog) dialog.close()
      }

      const onClose = () => {
        form.removeEventListener('submit', onSubmit)
        $('#confirm-cancel').removeEventListener('click', onCancel)
        dialog.removeEventListener('click', onBackdropClick)
        resolve(result)
      }

      form.addEventListener('submit', onSubmit)
      $('#confirm-cancel').addEventListener('click', onCancel)
      dialog.addEventListener('click', onBackdropClick)
      dialog.addEventListener('close', onClose, { once: true })
      dialog.showModal()
    })
  }

  /** Global tooltip — direct binding, body-level element avoids overflow clipping */
  initTooltip() {
    const tip = /** @type {HTMLElement} */ ($('#tooltip'))
    /** @type {number | null} */
    let showTimer = null

    const show = (/** @type {HTMLElement} */ target) => {
      const text = target.dataset.tooltip
      if (!text) return
      tip.textContent = text

      // Position off-screen, force layout to measure
      tip.style.cssText = 'left:-9999px;top:-9999px;opacity:1'
      const tipRect = tip.getBoundingClientRect()

      const rect = target.getBoundingClientRect()
      const GAP = 8

      // Default: below center
      let top = rect.bottom + GAP
      let left = rect.left + rect.width / 2

      // Flip above if overflowing bottom
      if (top + tipRect.height > window.innerHeight) {
        top = rect.top - GAP - tipRect.height
      }

      // Center horizontally, clamp to viewport
      left = Math.max(
        GAP,
        Math.min(left - tipRect.width / 2, window.innerWidth - tipRect.width - GAP),
      )

      tip.style.cssText = `left:${left}px;top:${top}px`
      // Force reflow before adding visible class so transition fires
      tip.offsetHeight // eslint-disable-line no-unused-expressions
      tip.classList.add('visible')
    }

    const hide = () => {
      if (showTimer) {
        clearTimeout(showTimer)
        showTimer = null
      }
      tip.classList.remove('visible')
    }

    // Bind directly to each [data-tooltip] element — mouseenter/mouseleave don't bubble
    // but fire reliably on the target element regardless of child structure
    for (const el of document.querySelectorAll('[data-tooltip]')) {
      el.addEventListener('mouseenter', () => {
        hide()
        showTimer = setTimeout(() => show(/** @type {HTMLElement} */ (el)), 100)
      })
      el.addEventListener('mouseleave', hide)
    }

    document.addEventListener('pointerdown', hide)
    document.addEventListener('scroll', hide, true)
  }
}

// ========================================================================
// FileExplorer
// ========================================================================
/** @typedef {{ data: { folders: FileItem[], files: FileItem[], isTruncated: boolean, nextToken: string }, ts: number }} CacheEntry */

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

class FileExplorer {
  /** @type {R2Client} */ #r2
  /** @type {UIManager} */ #ui
  #prefix = ''
  #continuationToken = ''
  /** @type {IntersectionObserver} */ #thumbnailObserver
  #sortBy = 'name'
  #sortOrder = /** @type {'asc' | 'desc'} */ ('asc')
  /** @type {Map<string, CacheEntry>} */
  #cache = new Map()
  /** @type {FileItem[]} All loaded items for current prefix (for local re-sort) */
  #loadedItems = []

  /** @param {R2Client} r2 @param {UIManager} ui */
  constructor(r2, ui) {
    this.#r2 = r2
    this.#ui = ui

    this.#thumbnailObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const card = /** @type {HTMLElement} */ (entry.target)
            const key = card.dataset.key ?? ''
            this.#thumbnailObserver.unobserve(card)
            this.#lazyLoadThumbnail(card, key)
          }
        }
      },
      { rootMargin: '100px' },
    )
  }

  get currentPrefix() {
    return this.#prefix
  }

  get currentSortBy() {
    return this.#sortBy
  }

  get currentSortOrder() {
    return this.#sortOrder
  }

  /** @param {string} sortBy */
  setSortBy(sortBy) {
    this.#sortBy = sortBy
    this.#resortAndRender()
  }

  /** @param {'asc' | 'desc'} order */
  setSortOrder(order) {
    this.#sortOrder = order
    this.#resortAndRender()
  }

  #resortAndRender() {
    if (this.#loadedItems.length === 0) return
    $('#file-grid').innerHTML = ''
    this.#renderItems(this.#sortItems(this.#loadedItems))
  }

  /** @param {string} prefix */
  async navigate(prefix) {
    this.#prefix = prefix
    this.#continuationToken = ''
    this.#loadedItems = []
    $('#file-grid').innerHTML = ''
    this.#updateBreadcrumb()
    await this.#loadPage(true)
  }

  async loadMore() {
    if (!this.#continuationToken) return
    await this.#loadPage(false)
  }

  /** @param {boolean} isInitial @param {boolean} [bypassCache] */
  async #loadPage(isInitial, bypassCache = false) {
    if (isInitial) this.#ui.showSkeleton()
    try {
      const cacheKey = `${this.#prefix}::${this.#continuationToken}`
      const cached = this.#cache.get(cacheKey)
      let result

      if (!bypassCache && cached && Date.now() - cached.ts < CACHE_TTL) {
        result = cached.data
      } else {
        result = await this.#r2.listObjects(this.#prefix, this.#continuationToken)
        this.#cache.set(cacheKey, { data: result, ts: Date.now() })
      }

      this.#continuationToken = result.isTruncated ? result.nextToken : ''

      if (isInitial) this.#ui.hideSkeleton()

      const items = [...result.folders, ...result.files]
      this.#loadedItems.push(...items)

      if (isInitial) {
        // Initial load: sort all and render
        const sortedItems = this.#sortItems(this.#loadedItems)
        if (sortedItems.length === 0) {
          this.#ui.showEmptyState()
        } else {
          this.#ui.hideEmptyState()
          this.#renderItems(sortedItems)
        }
      } else {
        // Load more: re-sort everything and re-render
        this.#ui.hideEmptyState()
        $('#file-grid').innerHTML = ''
        this.#renderItems(this.#sortItems(this.#loadedItems))
      }

      /** @type {HTMLElement} */ $('#load-more').hidden = !result.isTruncated
    } catch (/** @type {any} */ err) {
      if (isInitial) this.#ui.hideSkeleton()
      if (err.message === 'AUTH_FAILED') {
        this.#ui.toast(t('authFailed'), 'error')
        throw err
      } else if (err instanceof TypeError) {
        this.#ui.toast(t('corsError'), 'error')
      } else {
        this.#ui.toast(t('networkError', { msg: err.message }), 'error')
      }
    }
  }

  /** Invalidate cache entries matching a prefix */
  invalidateCache(prefix = '') {
    if (!prefix) {
      this.#cache.clear()
      return
    }
    for (const key of this.#cache.keys()) {
      if (key.startsWith(prefix + '::') || key.startsWith(prefix)) {
        this.#cache.delete(key)
      }
    }
  }

  /** @param {FileItem[]} items @returns {FileItem[]} */
  #sortItems(items) {
    const { true: folders = [], false: files = [] } = Object.groupBy(items, i => String(i.isFolder))

    /** @type {(a: FileItem, b: FileItem) => number} */
    const byName = (a, b) => getFileName(a.key).localeCompare(getFileName(b.key))

    /** @type {Record<string, (a: FileItem, b: FileItem) => number>} */
    const comparators = {
      name: byName,
      date: (a, b) =>
        new Date(a.lastModified ?? 0).getTime() - new Date(b.lastModified ?? 0).getTime(),
      size: (a, b) => (a.size ?? 0) - (b.size ?? 0),
    }

    const cmp = comparators[this.#sortBy] ?? byName
    const directedCmp =
      this.#sortOrder === 'asc'
        ? cmp
        : (/** @type {FileItem} */ a, /** @type {FileItem} */ b) => cmp(b, a)
    const directedByName =
      this.#sortOrder === 'asc'
        ? byName
        : (/** @type {FileItem} */ a, /** @type {FileItem} */ b) => byName(b, a)
    return [...folders.toSorted(directedByName), ...files.toSorted(directedCmp)]
  }

  /** @param {FileItem[]} items */
  #renderItems(items) {
    const grid = $('#file-grid')
    const frag = document.createDocumentFragment()

    for (const item of items) {
      const card = this.#createFileCard(item)
      frag.appendChild(card)
    }

    grid.appendChild(frag)
  }

  /** @param {FileItem} item @returns {HTMLDivElement} */
  #createFileCard(item) {
    const card = document.createElement('div')
    card.className = 'file-card'
    card.dataset.key = item.key
    card.dataset.isFolder = String(item.isFolder)

    const name = getFileName(item.key)
    const isImage = !item.isFolder && IMAGE_RE.test(item.key)

    let iconHtml
    if (item.isFolder) {
      iconHtml = `<div class="file-card-icon folder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      </div>`
    } else if (isImage) {
      iconHtml = `<img class="file-card-thumb" alt="" loading="lazy">`
    } else {
      iconHtml = `<div class="file-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>`
    }

    card.innerHTML = `
      ${iconHtml}
      <span class="file-card-name" title="${name}">${name}</span>
      ${
        !item.isFolder
          ? `
        <span class="file-card-size">${filesize(item.size ?? 0)}</span>
        <span class="file-card-date">${formatDate(item.lastModified ?? '')}</span>
      `
          : ''
      }
      <div class="file-card-actions">
        <button type="button" class="icon-btn sm file-card-menu" title="More">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </div>
    `

    if (isImage) {
      this.#thumbnailObserver.observe(card)
    }

    return card
  }

  /** @param {HTMLElement} card @param {string} key */
  async #lazyLoadThumbnail(card, key) {
    try {
      const url = this.#r2.getPublicUrl(key) ?? (await this.#r2.getPresignedUrl(key))
      const img = /** @type {HTMLImageElement} */ ($('img', card))
      if (!img) return
      img.onload = () => img.classList.add('loaded')
      img.onerror = () => img.classList.add('loaded')
      img.src = url
    } catch {
      /* ignore thumbnail failures */
    }
  }

  #updateBreadcrumb() {
    const ol = $('#breadcrumb')
    ol.innerHTML = ''

    const rootLi = document.createElement('li')
    rootLi.innerHTML = `<button type="button" class="breadcrumb-btn" data-prefix="">${t('root')}</button>`
    ol.appendChild(rootLi)

    if (this.#prefix) {
      const parts = this.#prefix.replace(/\/$/, '').split('/')
      let accumulated = ''
      for (const part of parts) {
        accumulated += part + '/'
        const li = document.createElement('li')
        li.innerHTML = `<button type="button" class="breadcrumb-btn" data-prefix="${accumulated}">${part}</button>`
        ol.appendChild(li)
      }
    }
  }

  async refresh() {
    this.invalidateCache(this.#prefix)
    this.#continuationToken = ''
    this.#loadedItems = []
    $('#file-grid').innerHTML = ''
    this.#updateBreadcrumb()
    await this.#loadPage(true, true)
  }
}

// ========================================================================
// UploadManager
// ========================================================================
/**
 * Compress image file based on configuration
 * @param {File} file - Original file
 * @param {R2Config} config - R2Config object
 * @param {function(string):void} onStatus - Callback to update status text
 * @returns {Promise<File>}
 */
async function compressFile(file, config, onStatus) {
  // Only compress images (JPG/JPEG/PNG)
  const allowCompress = /\.(jpg|jpeg|png)$/i.test(file.name)
  if (!allowCompress || !config.compressMode || config.compressMode === 'none') {
    return file
  }

  try {
    const originalSize = file.size

    // --- Local Mode ---
    if (config.compressMode === 'local') {
      onStatus && onStatus('压缩中...')

      // Browser Image Compression Options
      // Uses OffscreenCanvas / Web Workers if available (Modern Browser Features)
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.8,
      }

      // Map levels
      const level = config.compressLevel || 'balanced'
      if (level === 'extreme') {
        options.maxSizeMB = 0.2 // Aggressive size limit
        options.maxWidthOrHeight = 1280
        options.initialQuality = 0.6
      } else {
        // Balanced (Default)
        options.maxSizeMB = 1
        options.initialQuality = 0.8
      }

      const compressedBlob = await imageCompression(file, options)

      // Feedback
      const savings = Math.round((1 - compressedBlob.size / originalSize) * 100)
      if (savings > 0) {
        onStatus &&
          onStatus(
            `本地压缩: ${filesize(originalSize)} -> ${filesize(compressedBlob.size)} (省 ${savings}%)`,
          )
        return compressedBlob
      }
    }

    // --- Tinify Mode ---
    if (config.compressMode === 'tinify') {
      if (!config.tinifyKey) return file

      onStatus && onStatus('Cloud 压缩中...')

      const apiUrl = new URL('https://api.tinify.com/shrink')
      apiUrl.searchParams.set('proxy-host', 'api.tinify.com') // Ensure proxy is used for upload
      apiUrl.host = 'proxy.viki.moe' // Force upload through proxy to avoid CORS

      // Tinify API Call
      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa('api:' + config.tinifyKey),
        },
        body: file,
      })

      if (!response.ok) throw new Error('Tinify API Error')

      const data = await response.json()
      const url = new URL(data.output.url)
      url.searchParams.set('proxy-host', 'api.tinify.com') // Ensure proxy is used for download
      url.host = 'proxy.viki.moe' // Force download through proxy to avoid CORS

      // Download result
      const compressedRes = await fetch(url.toString())
      const compressedBlob = await compressedRes.blob()

      const savings = Math.round((1 - compressedBlob.size / originalSize) * 100)
      if (savings > 0) {
        onStatus &&
          onStatus(
            `Tinify: ${filesize(originalSize)} -> ${filesize(compressedBlob.size)} (省 ${savings}%)`,
          )
      }

      return new File([compressedBlob], file.name, { type: file.type })
    }
  } catch (error) {
    console.error('Compression failed:', error)
    onStatus && onStatus('压缩失败，使用原图')
  }

  return file
}

class UploadManager {
  /** @type {R2Client} */ #r2
  /** @type {UIManager} */ #ui
  /** @type {FileExplorer} */ #explorer
  /** @type {ConfigManager} */ #config
  #dragCounter = 0

  /** @param {R2Client} r2 @param {UIManager} ui @param {FileExplorer} explorer @param {ConfigManager} config */
  constructor(r2, ui, explorer, config) {
    this.#r2 = r2
    this.#ui = ui
    this.#explorer = explorer
    this.#config = config
  }

  initDragDrop() {
    const app = $('#app')
    const dropzone = $('#dropzone')

    app.addEventListener('dragenter', e => {
      e.preventDefault()
      this.#dragCounter++
      dropzone.hidden = false
    })

    app.addEventListener('dragleave', e => {
      e.preventDefault()
      this.#dragCounter--
      if (this.#dragCounter <= 0) {
        this.#dragCounter = 0
        dropzone.hidden = true
      }
    })

    app.addEventListener('dragover', (/** @type {DragEvent} */ e) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    })

    app.addEventListener('drop', (/** @type {DragEvent} */ e) => {
      e.preventDefault()
      this.#dragCounter = 0
      dropzone.hidden = true
      const files = [...(e.dataTransfer?.files ?? [])]
      if (files.length > 0) this.uploadFiles(files)
    })

    // Ctrl+V / Cmd+V paste upload
    document.addEventListener('paste', e => {
      // Ignore paste inside input/textarea/contenteditable
      const target = /** @type {HTMLElement} */ (e.target)
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return

      const items = [...(e.clipboardData?.items || [])]
      /** @type {File[]} */
      const files = items
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter(/** @returns {f is File} */ f => f !== null)

      if (files.length > 0) {
        e.preventDefault()
        this.#ui.toast(t('pasteToUpload', { count: files.length }), 'info')
        this.uploadFiles(files)
      }
    })
  }

  /** @param {File[]} files */
  async uploadFiles(files) {
    const panel = $('#upload-panel')
    const body = $('#upload-panel-body')
    const title = $('#upload-panel-title')

    panel.hidden = false
    body.innerHTML = ''
    title.textContent = t('uploading')

    const cfg = this.#config.get()
    const filenameTpl = cfg.filenameTpl || ''

    // Process files sequentially for template resolution (hash computation)
    const uploads = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Check size
      if (file.size > MAX_UPLOAD_SIZE) {
        this.#ui.toast(t('fileTooLarge', { name: file.name }), 'error')
        continue
      }

      const id = `upload-${i}-${Date.now()}`
      const displayName = file.name

      // Apply filename template (async - computes file hash)
      const processedName = await applyFilenameTemplate(filenameTpl, file)
      const key = this.#explorer.currentPrefix + processedName
      const contentType = file.type || getMimeType(file.name)

      // Create progress UI
      const item = document.createElement('div')
      item.className = 'upload-item'
      item.id = id
      item.innerHTML = `
        <div class="upload-item-name" title="${displayName}">${displayName}</div>
        <div class="upload-progress">
          <div class="upload-progress-bar" id="${id}-bar"></div>
        </div>
      `
      body.appendChild(item)

      uploads.push({ id, key, file, contentType })
    }

    // Upload concurrently
    const results = await Promise.allSettled(
      uploads.map(u => this.#uploadSingleFile(u.id, u.key, u.file, u.contentType)),
    )

    const success = results.filter(r => r.status === 'fulfilled').length
    const fail = results.filter(r => r.status === 'rejected').length

    if (fail === 0) {
      this.#ui.toast(t('uploadSuccess', { count: success }), 'success')
    } else {
      this.#ui.toast(t('uploadPartialFail', { success, fail }), 'error')
    }

    title.textContent = `${success}/${uploads.length}`
    await this.#explorer.refresh()
  }

  /** @param {string} id @param {string} key @param {File} file @param {string} contentType */
  async #uploadSingleFile(id, key, file, contentType) {
    // --- Compression Step ---
    /**
     * @param {string} msg
     */
    const updateStatus = msg => {
      const nameEl = $(`#${id} .upload-item-name`)
      if (nameEl) {
        let original = nameEl.dataset.originalName
        if (!original) {
          original = nameEl.textContent || ''
          nameEl.dataset.originalName = original
        }
        nameEl.textContent = `${original} (${msg})`
      }
    }
    // Execute compression (if enabled)
    file = await compressFile(file, this.#config.get(), updateStatus)
    // ------------------------

    const signed = await this.#r2.putObjectSigned(key, contentType)
    const bar = $(`#${id}-bar`)

    if (bar) bar.classList.add('indeterminate')

    const headers = new Headers()
    for (const [k, v] of Object.entries(signed.headers)) {
      if (k.toLowerCase() !== 'host') headers.set(k, v)
    }

    const res = await fetch(signed.url, {
      method: 'PUT',
      headers,
      body: file,
    })

    if (bar) bar.classList.remove('indeterminate')

    if (!res.ok) {
      if (bar) bar.classList.add('error')
      throw new Error(`HTTP ${res.status}`)
    }

    if (bar) {
      bar.classList.add('done')
      bar.style.width = '100%'
    }
  }
}

// ========================================================================
// FilePreview
// ========================================================================
class FilePreview {
  /** @type {R2Client} */ #r2
  /** @type {UIManager} */ #ui
  #currentKey = ''

  /** @param {R2Client} r2 @param {UIManager} ui */
  constructor(r2, ui) {
    this.#r2 = r2
    this.#ui = ui
  }

  get currentKey() {
    return this.#currentKey
  }

  /** @param {string} key */
  async preview(key) {
    this.#currentKey = key
    const dialog = /** @type {HTMLDialogElement} */ ($('#preview-dialog'))
    const body = $('#preview-body')
    const footer = $('#preview-footer')
    const filename = $('#preview-filename')

    filename.textContent = getFileName(key)
    body.innerHTML = '<div style="color:var(--text-tertiary)">Loading...</div>'
    footer.innerHTML = ''
    dialog.showModal()

    try {
      const meta = await this.#r2.headObject(key)
      footer.innerHTML = `
        <span>${t('size')}: ${filesize(meta.contentLength)}</span>
        <span>${t('contentType')}: ${meta.contentType || 'unknown'}</span>
        ${meta.lastModified ? `<span>${t('lastModified')}: ${formatDate(meta.lastModified)}</span>` : ''}
      `

      if (IMAGE_RE.test(key)) {
        const url = this.#r2.getPublicUrl(key) ?? (await this.#r2.getPresignedUrl(key))
        body.innerHTML = `<img src="${url}" alt="${getFileName(key)}">`
      } else if (VIDEO_RE.test(key)) {
        const url = this.#r2.getPublicUrl(key) ?? (await this.#r2.getPresignedUrl(key))
        body.innerHTML = `<video src="${url}" controls></video>`
      } else if (AUDIO_RE.test(key)) {
        const url = this.#r2.getPublicUrl(key) ?? (await this.#r2.getPresignedUrl(key))
        body.innerHTML = `<audio src="${url}" controls></audio>`
      } else if (TEXT_RE.test(key)) {
        const res = await this.#r2.getObject(key)
        const text = await res.text()
        body.innerHTML = ''
        const pre = document.createElement('pre')
        pre.textContent = text
        body.appendChild(pre)
      } else {
        body.innerHTML = `<p style="color:var(--text-tertiary)">${t('previewNotAvailable')}</p>`
      }
    } catch (/** @type {any} */ err) {
      body.innerHTML = `<p style="color:var(--text-danger)">${err.message}</p>`
    }
  }

  async downloadCurrent() {
    if (!this.#currentKey) return
    try {
      const url =
        this.#r2.getPublicUrl(this.#currentKey) ??
        (await this.#r2.getPresignedUrl(this.#currentKey))
      const a = document.createElement('a')
      a.href = url
      a.download = getFileName(this.#currentKey)
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (/** @type {any} */ err) {
      this.#ui.toast(t('networkError', { msg: err.message }), 'error')
    }
  }
}

// ========================================================================
// FileOperations
// ========================================================================
class FileOperations {
  /** @type {R2Client} */ #r2
  /** @type {UIManager} */ #ui
  /** @type {FileExplorer} */ #explorer
  /** @type {ConfigManager} */ #config

  /** @param {R2Client} r2 @param {UIManager} ui @param {FileExplorer} explorer @param {ConfigManager} config */
  constructor(r2, ui, explorer, config) {
    this.#r2 = r2
    this.#ui = ui
    this.#explorer = explorer
    this.#config = config
  }

  /** @param {string} key @param {boolean} isFolder */
  async rename(key, isFolder) {
    const oldName = getFileName(key)
    const newName = await this.#ui.prompt(t('renameTitle'), t('renameLabel'), oldName)
    if (!newName || newName === oldName) return

    try {
      const prefix = key.substring(0, key.lastIndexOf(oldName))
      if (isFolder) {
        const dest = prefix + newName + '/'
        await this.#recursiveOperation(
          key,
          async (/** @type {string} */ srcKey) => {
            const relative = srcKey.substring(key.length)
            await this.#r2.copyObject(srcKey, dest + relative)
          },
          true,
        )
      } else {
        const dest = prefix + newName
        await this.#r2.copyObject(key, dest)
        await this.#r2.deleteObject(key)
      }
      this.#ui.toast(t('renameSuccess', { name: newName }), 'success')
      await this.#explorer.refresh()
    } catch (/** @type {any} */ err) {
      this.#ui.toast(t('networkError', { msg: err.message }), 'error')
    }
  }

  /** @param {string} key @param {boolean} isFolder */
  async copy(key, isFolder) {
    const name = getFileName(key)
    const currentPrefix = this.#explorer.currentPrefix
    const dest = await this.#ui.prompt(
      t('copyTitle'),
      t('copyLabel'),
      currentPrefix + name + (isFolder ? '/' : ''),
    )
    if (!dest) return

    try {
      if (isFolder) {
        await this.#recursiveOperation(
          key,
          async (/** @type {string} */ srcKey) => {
            const relative = srcKey.substring(key.length)
            const destKey = (dest.endsWith('/') ? dest : dest + '/') + relative
            await this.#r2.copyObject(srcKey, destKey)
          },
          false,
        )
      } else {
        await this.#r2.copyObject(key, dest)
      }
      this.#ui.toast(t('copySuccess', { name: dest }), 'success')
      await this.#explorer.refresh()
    } catch (/** @type {any} */ err) {
      this.#ui.toast(t('networkError', { msg: err.message }), 'error')
    }
  }

  /** @param {string} key @param {boolean} isFolder */
  async move(key, isFolder) {
    const name = getFileName(key)
    const currentPrefix = this.#explorer.currentPrefix
    const dest = await this.#ui.prompt(
      t('moveTitle'),
      t('moveLabel'),
      currentPrefix + name + (isFolder ? '/' : ''),
    )
    if (!dest) return

    try {
      if (isFolder) {
        await this.#recursiveOperation(
          key,
          async (/** @type {string} */ srcKey) => {
            const relative = srcKey.substring(key.length)
            const destKey = (dest.endsWith('/') ? dest : dest + '/') + relative
            await this.#r2.copyObject(srcKey, destKey)
          },
          true,
        )
      } else {
        await this.#r2.copyObject(key, dest)
        await this.#r2.deleteObject(key)
      }
      this.#ui.toast(t('moveSuccess', { name: dest }), 'success')
      await this.#explorer.refresh()
    } catch (/** @type {any} */ err) {
      this.#ui.toast(t('networkError', { msg: err.message }), 'error')
    }
  }

  /** @param {string} key @param {boolean} isFolder */
  async delete(key, isFolder) {
    const name = getFileName(key)
    const msg = isFolder ? t('deleteFolderConfirmMsg', { name }) : t('deleteConfirmMsg', { name })

    const ok = await this.#ui.confirm(t('deleteConfirmTitle'), msg)
    if (!ok) return

    try {
      if (isFolder) {
        await this.#recursiveOperation(
          key,
          async srcKey => {
            await this.#r2.deleteObject(srcKey)
          },
          false,
        )
        // Also delete the folder marker itself
        try {
          await this.#r2.deleteObject(key)
        } catch {}
      } else {
        await this.#r2.deleteObject(key)
      }
      this.#ui.toast(t('deleteSuccess', { name }), 'success')
      await this.#explorer.refresh()
    } catch (/** @type {any} */ err) {
      this.#ui.toast(t('networkError', { msg: err.message }), 'error')
    }
  }

  /** @param {string} key */
  async download(key) {
    try {
      const url = this.#r2.getPublicUrl(key) ?? (await this.#r2.getPresignedUrl(key))
      const a = document.createElement('a')
      a.href = url
      a.download = getFileName(key)
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (/** @type {any} */ err) {
      this.#ui.toast(t('networkError', { msg: err.message }), 'error')
    }
  }

  /** @param {string} key @param {'url'|'markdown'|'html'|'presigned'} format */
  async copyAs(key, format) {
    const name = getFileName(key)
    const isImage = IMAGE_RE.test(key)

    let url
    if (format === 'presigned') {
      url = await this.#r2.getPresignedUrl(key)
    } else {
      url = this.#r2.getPublicUrl(key) ?? (await this.#r2.getPresignedUrl(key))
    }

    let text
    switch (format) {
      case 'markdown':
        text = isImage ? `![${name}](${url})` : `[${name}](${url})`
        break
      case 'html':
        text = isImage ? `<img src="${url}" alt="${name}">` : `<a href="${url}">${name}</a>`
        break
      default: // 'url' and 'presigned'
        text = url
        break
    }

    try {
      await navigator.clipboard.writeText(text)
      this.#ui.toast(t('linkCopied'), 'success')
    } catch {
      await this.#ui.prompt(t('copyLink'), '', text)
    }
  }

  /** @param {string} prefix @param {(key: string) => Promise<void>} operation @param {boolean} deleteSource */
  async #recursiveOperation(prefix, operation, deleteSource) {
    // List all objects under prefix
    const allKeys = await this.#collectAllKeys(prefix)

    // Process in batches of 5
    for (let i = 0; i < allKeys.length; i += 5) {
      const batch = allKeys.slice(i, i + 5)
      await Promise.all(batch.map(k => operation(k)))
    }

    // Delete source objects if needed
    if (deleteSource) {
      for (let i = 0; i < allKeys.length; i += 5) {
        const batch = allKeys.slice(i, i + 5)
        await Promise.all(batch.map(k => this.#r2.deleteObject(k)))
      }
      // Delete the folder marker
      try {
        await this.#r2.deleteObject(prefix)
      } catch {}
    }
  }

  /** @param {string} prefix @returns {Promise<string[]>} */
  async #collectAllKeys(prefix) {
    /** @type {string[]} */
    let allKeys = []
    let token = ''
    do {
      const result = await this.#r2.listObjects(prefix, token)
      for (const file of result.files) {
        allKeys.push(file.key)
      }
      for (const folder of result.folders) {
        const subKeys = await this.#collectAllKeys(folder.key)
        allKeys.push(...subKeys)
      }
      token = result.isTruncated ? result.nextToken : ''
    } while (token)
    return allKeys
  }
}

// ========================================================================
// App (Orchestrator)
// ========================================================================
class App {
  /** @type {ConfigManager} */ #config
  /** @type {R2Client} */ #r2
  /** @type {UIManager} */ #ui
  /** @type {FileExplorer | null} */ #explorer = null
  /** @type {UploadManager | null} */ #upload = null
  /** @type {FilePreview | null} */ #preview = null
  /** @type {FileOperations | null} */ #ops = null
  #appEventsBound = false

  constructor() {
    this.#config = new ConfigManager()
    this.#r2 = new R2Client()
    this.#ui = new UIManager()

    this.#ui.initTheme()
    this.#ui.initTooltip()

    // Check for config in URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const configParam = urlParams.get('config')
    if (configParam) {
      if (this.#config.loadFromBase64(configParam)) {
        // Clean URL without reloading
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('config')
        window.history.replaceState({}, '', cleanUrl.toString())
        // If lang is in config, apply it
        const cfg = this.#config.get()
        if (cfg.lang) setLang(/** @type {Lang} */ (cfg.lang))
      }
    }

    this.#applyI18nToHTML()

    if (this.#config.isValid()) {
      this.#connectAndLoad()
      if (configParam) {
        // Delay toast so UI is ready
        setTimeout(() => this.#ui.toast(t('configLoadedFromUrl'), 'success'), 500)
      }
    } else {
      this.#showHero()
    }

    this.#bindGlobalEvents()
    this.#bindHeroEvents()
  }

  #applyI18nToHTML() {
    // Update static text in HTML
    document.title = t('appTitle')
    $('.topbar-title').textContent = t('appTitle')

    // Hero section
    const heroTitle = $('#hero-title')
    if (heroTitle) heroTitle.textContent = t('appTitle')
    const heroDesc = $('#hero-desc')
    if (heroDesc) heroDesc.textContent = t('heroDesc')
    const heroConnectText = $('#hero-connect-text')
    if (heroConnectText) heroConnectText.textContent = t('heroConnect')
    const heroF1 = $('#hero-f1')
    if (heroF1) heroF1.textContent = t('heroF1')
    const heroF2 = $('#hero-f2')
    if (heroF2) heroF2.textContent = t('heroF2')
    const heroF3 = $('#hero-f3')
    if (heroF3) heroF3.textContent = t('heroF3')
    const heroF4 = $('#hero-f4')
    if (heroF4) heroF4.textContent = t('heroF4')
    const heroF5 = $('#hero-f5')
    if (heroF5) heroF5.textContent = t('heroF5')
    const heroF6 = $('#hero-f6')
    if (heroF6) heroF6.textContent = t('heroF6')
    const heroF7 = $('#hero-f7')
    if (heroF7) heroF7.textContent = t('heroF7')
    const heroF8 = $('#hero-f8')
    if (heroF8) heroF8.textContent = t('heroF8')
    const heroLangSelect = /** @type {HTMLSelectElement} */ ($('#hero-lang-select'))
    if (heroLangSelect) heroLangSelect.value = currentLang

    // Topbar language select
    const topbarLangSelect = /** @type {HTMLSelectElement} */ ($('#topbar-lang-select'))
    if (topbarLangSelect) topbarLangSelect.value = currentLang

    // Config dialog — static elements by ID
    $('#config-title').textContent = t('appTitle')
    $('#config-section-r2').textContent = t('r2Connection')
    $('#lbl-account-id').textContent = t('accountId')
    $('#lbl-access-key').textContent = t('accessKeyId')
    $('#lbl-secret-key').textContent = t('secretAccessKey')
    $('#lbl-bucket').textContent = t('bucketName')
    $('#lbl-custom-domain').textContent = t('customDomain')
    $('#custom-domain-hint').textContent = t('customDomainHint')
    $('#config-section-upload').textContent = t('uploadSettings')
    $('#lbl-filename-tpl').textContent = t('filenameTpl')
    $('#filename-tpl-hint').textContent = t('filenameTplHint')
    $('#config-cancel').textContent = t('cancel')
    $('#config-submit').textContent = t('save')

    // Sort order tooltips
    $('#sort-asc-btn').dataset.tooltip = t('sortAsc')
    $('#sort-desc-btn').dataset.tooltip = t('sortDesc')

    // View & density
    $('#view-grid-btn').dataset.tooltip = t('viewGrid')
    $('#view-list-btn').dataset.tooltip = t('viewList')

    const densitySelect = $('#density-select')
    if (densitySelect) {
      $('option[value="compact"]', densitySelect).textContent = t('densityCompact')
      $('option[value="normal"]', densitySelect).textContent = t('densityNormal')
      $('option[value="loose"]', densitySelect).textContent = t('densityLoose')
    }

    // Sort buttons tooltips
    $('#sort-name-btn').dataset.tooltip = t('sortName')
    $('#sort-date-btn').dataset.tooltip = t('sortDate')
    $('#sort-size-btn').dataset.tooltip = t('sortSize')

    // Toolbar buttons
    $('#new-folder-btn span').textContent = t('newFolder')
    $('#upload-btn span').textContent = t('upload')

    // Dropzone
    $('#dropzone-text').textContent = t('dropToUpload')

    // Empty state
    $('#empty-state p').textContent = t('emptyFolder')
    $('#empty-upload-btn').lastChild.textContent = ' ' + t('uploadFiles')
    $('#empty-upload-hint').textContent = t('uploadHint')
    $('#paste-hint-text').textContent = t('pasteHint')

    // Load more
    $('#load-more-btn').textContent = t('loadMore')

    // Context menu — target the span inside each item
    $('[data-action="preview"] span').textContent = t('preview')
    $('[data-action="download"] span').textContent = t('download')
    $('#ctx-copy-link > span').textContent = t('copyLink')
    $('[data-action="copyUrl"] span').textContent = t('copyUrl')
    $('[data-action="copyMarkdown"] span').textContent = t('copyMarkdown')
    $('[data-action="copyHtml"] span').textContent = t('copyHtml')
    $('[data-action="copyPresigned"] span').textContent = t('copyPresigned')
    $('[data-action="rename"] span').textContent = t('rename')
    $('[data-action="copy"] span').textContent = t('copy')
    $('[data-action="move"] span').textContent = t('move')
    $('[data-action="delete"] span').textContent = t('delete')

    // Tooltips
    $('#theme-toggle').dataset.tooltip = t('toggleTheme')
    $('#share-btn').dataset.tooltip = t('shareConfig')
    $('#settings-btn').dataset.tooltip = t('settings')
    $('#logout-btn').dataset.tooltip = t('logout')
    $('#refresh-btn').dataset.tooltip = t('refresh')
    $('#preview-download').dataset.tooltip = t('download')
    $('#preview-close').dataset.tooltip = t('close')
    $('#hero-theme-toggle').dataset.tooltip = t('toggleTheme')
    $('#view-grid-btn').dataset.tooltip = t('viewGrid')
    $('#view-list-btn').dataset.tooltip = t('viewList')
    $('#upload-panel-close').dataset.tooltip = t('close')

    // Prompt dialog
    $('#prompt-cancel').textContent = t('cancel')
    $('#prompt-ok').textContent = t('ok')

    // Confirm dialog
    $('#confirm-cancel').textContent = t('cancel')
    $('#confirm-ok').textContent = t('confirm')
  }

  async #connectAndLoad() {
    try {
      this.#r2.init(this.#config)
      this.#explorer = new FileExplorer(this.#r2, this.#ui)
      this.#upload = new UploadManager(this.#r2, this.#ui, this.#explorer, this.#config)
      this.#preview = new FilePreview(this.#r2, this.#ui)
      this.#ops = new FileOperations(this.#r2, this.#ui, this.#explorer, this.#config)

      // Apply theme from config
      const cfg = this.#config.get()
      if (cfg.theme) {
        this.#ui.setTheme(cfg.theme)
      }

      this.#hideHero()
      $('#app').hidden = false
      this.#restoreViewPrefs()
      if (!this.#appEventsBound) {
        this.#upload.initDragDrop()
        this.#bindAppEvents()
        this.#appEventsBound = true
      }
      await this.#explorer.navigate('')
    } catch (/** @type {any} */ err) {
      if (err.message === 'AUTH_FAILED') {
        this.#config.clear()
        /** @type {HTMLElement} */
        $('#app').hidden = true
        this.#showHero()
      }
    }
  }

  #restoreViewPrefs() {
    const view = localStorage.getItem(VIEW_KEY) || 'grid'
    const density = localStorage.getItem(DENSITY_KEY) || 'normal'
    const sortBy = localStorage.getItem(SORT_BY_KEY) || 'name'
    this.#setView(view)
    this.#setDensity(density)
    this.#setSortBy(sortBy)
  }

  /** @param {string} view */
  #setView(view) {
    $('#file-browser').dataset.view = view
    $('#view-grid-btn').setAttribute('aria-pressed', String(view === 'grid'))
    $('#view-list-btn').setAttribute('aria-pressed', String(view === 'list'))
    localStorage.setItem(VIEW_KEY, view)
  }

  /** @param {string} density */
  #setDensity(density) {
    $('#file-browser').dataset.density = density
    const densitySelect = /** @type {HTMLSelectElement} */ ($('#density-select'))
    densitySelect.value = density
    localStorage.setItem(DENSITY_KEY, density)
  }

  /** @param {string} sortBy */
  #setSortBy(sortBy) {
    // Update sort buttons aria-pressed
    $('#sort-name-btn').setAttribute('aria-pressed', String(sortBy === 'name'))
    $('#sort-date-btn').setAttribute('aria-pressed', String(sortBy === 'date'))
    $('#sort-size-btn').setAttribute('aria-pressed', String(sortBy === 'size'))
    if (this.#explorer) this.#explorer.setSortBy(sortBy)
    localStorage.setItem(SORT_BY_KEY, sortBy)
  }

  /** @param {'asc' | 'desc'} order */
  #setSortOrder(order) {
    $('#sort-asc-btn').setAttribute('aria-pressed', String(order === 'asc'))
    $('#sort-desc-btn').setAttribute('aria-pressed', String(order === 'desc'))
    if (this.#explorer) this.#explorer.setSortOrder(order)
  }

  #showHero() {
    $('#hero').hidden = false
    $('#app').hidden = true
  }

  #hideHero() {
    $('#hero').hidden = true
  }

  #bindHeroEvents() {
    $('#hero-connect-btn').addEventListener('click', () => {
      this.#showConfigDialog()
    })

    $('#hero-theme-toggle').addEventListener('click', () => this.#ui.toggleTheme())

    $('#hero-lang-select').addEventListener('change', (/** @type {Event} */ e) => {
      setLang(/** @type {Lang} */ (/** @type {HTMLSelectElement} */ (e.target).value))
      this.#applyI18nToHTML()
    })
  }

  #showConfigDialog() {
    const dialog = /** @type {HTMLDialogElement} */ ($('#config-dialog'))
    const form = /** @type {HTMLFormElement} */ ($('#config-form'))

    // Pre-fill with existing config
    const cfg = this.#config.get()
    const accountInput = /** @type {HTMLInputElement} */ ($('#cfg-account-id'))
    const accessInput = /** @type {HTMLInputElement} */ ($('#cfg-access-key'))
    const secretInput = /** @type {HTMLInputElement} */ ($('#cfg-secret-key'))
    const bucketInput = /** @type {HTMLInputElement} */ ($('#cfg-bucket'))
    const tplInput = /** @type {HTMLInputElement} */ ($('#cfg-filename-tpl'))
    const domainInput = /** @type {HTMLInputElement} */ ($('#cfg-custom-domain'))

    // Compression Inputs
    const compressModeInput = /** @type {HTMLSelectElement} */ ($('#cfg-compress-mode'))
    const compressLevelInput = /** @type {HTMLSelectElement} */ ($('#cfg-compress-level'))
    const tinifyKeyInput = /** @type {HTMLInputElement} */ ($('#cfg-tinify-key'))

    if (cfg.accountId) accountInput.value = cfg.accountId
    if (cfg.accessKeyId) accessInput.value = cfg.accessKeyId
    if (cfg.secretAccessKey) secretInput.value = cfg.secretAccessKey
    if (cfg.bucket) bucketInput.value = cfg.bucket
    if (cfg.filenameTpl) tplInput.value = cfg.filenameTpl
    if (cfg.customDomain) domainInput.value = cfg.customDomain

    // Fill Compression fields
    if (compressModeInput) compressModeInput.value = cfg.compressMode || 'none'
    if (compressLevelInput) compressLevelInput.value = cfg.compressLevel || 'balanced'
    if (tinifyKeyInput) tinifyKeyInput.value = cfg.tinifyKey || ''

    // Visibility Logic
    const updateCompressVisibility = () => {
      const mode = compressModeInput ? compressModeInput.value : 'none'
      const localOpts = $('#compress-local-options')
      const tinifyOpts = $('#compress-tinify-options')
      if (localOpts) localOpts.hidden = mode !== 'local'
      if (tinifyOpts) tinifyOpts.hidden = mode !== 'tinify'
    }

    if (compressModeInput) {
      compressModeInput.onchange = updateCompressVisibility
      updateCompressVisibility() // Init
    }

    $('#config-cancel').onclick = () => dialog.close()

    const onBackdropClick = (/** @type {Event} */ e) => {
      if (e.target === dialog) dialog.close()
    }
    dialog.addEventListener('click', onBackdropClick)

    dialog.addEventListener(
      'close',
      () => {
        dialog.removeEventListener('click', onBackdropClick)
        if (!this.#config.isValid()) {
          this.#showHero()
        }
      },
      { once: true },
    )

    form.onsubmit = async (/** @type {Event} */ e) => {
      e.preventDefault()

      this.#config.save({
        accountId: accountInput.value.trim(),
        accessKeyId: accessInput.value.trim(),
        secretAccessKey: secretInput.value.trim(),
        bucket: bucketInput.value.trim(),
        filenameTpl: tplInput ? tplInput.value.trim() : '',
        customDomain: domainInput ? domainInput.value.trim().replace(/\/+$/, '') : '',
        compressMode: compressModeInput ? compressModeInput.value : 'none',
        compressLevel: compressLevelInput ? compressLevelInput.value : 'balanced',
        tinifyKey: tinifyKeyInput ? tinifyKeyInput.value.trim() : '',
      })

      dialog.close()
      await this.#connectAndLoad()
    }

    dialog.showModal()
  }

  #bindGlobalEvents() {
    // Theme toggle
    $('#theme-toggle').addEventListener('click', () => this.#ui.toggleTheme())

    // Settings
    $('#settings-btn').addEventListener('click', () => this.#showConfigDialog())

    // Logout
    $('#logout-btn').addEventListener('click', async () => {
      const ok = await this.#ui.confirm(t('logoutConfirmTitle'), t('logoutConfirmMsg'))
      if (!ok) return
      this.#config.clear()
      $('#app').hidden = true
      this.#showHero()
    })

    // Share config
    $('#share-btn').addEventListener('click', async () => {
      if (!this.#config.isValid()) {
        this.#ui.toast(t('authFailed'), 'error')
        return
      }
      const url = this.#config.getShareUrl()
      try {
        await navigator.clipboard.writeText(url)
        this.#ui.toast(t('shareConfigCopied'), 'success')
      } catch {
        // Fallback: prompt with URL
        await this.#ui.prompt(t('shareConfig'), 'URL', url)
      }
    })

    // Topbar language select
    $('#topbar-lang-select').addEventListener('change', (/** @type {Event} */ e) => {
      setLang(/** @type {Lang} */ (/** @type {HTMLSelectElement} */ (e.target).value))
      this.#applyI18nToHTML()
    })

    // Dismiss context menu
    document.addEventListener('click', e => {
      const target = /** @type {HTMLElement} */ (e.target)
      if (!target.closest('.context-menu') && !target.closest('.file-card-menu')) {
        this.#ui.hideContextMenu()
      }
    })

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.#ui.hideContextMenu()
      }
    })
  }

  #bindAppEvents() {
    // Refresh button
    $('#refresh-btn').addEventListener('click', async () => {
      const btn = /** @type {HTMLElement} */ ($('#refresh-btn'))
      btn.classList.add('refreshing')
      btn.addEventListener('animationend', () => btn.classList.remove('refreshing'), { once: true })
      await this.#explorer.refresh()
    })

    // Breadcrumb clicks
    $('#breadcrumb').addEventListener('click', e => {
      const btn = /** @type {HTMLElement | null} */ (
        /** @type {HTMLElement} */ (e.target).closest('.breadcrumb-btn')
      )
      if (btn) {
        /** @type {FileExplorer} */ this.#explorer.navigate(btn.dataset.prefix ?? '')
      }
    })

    // File grid clicks
    $('#file-grid').addEventListener('click', e => {
      const target = /** @type {HTMLElement} */ (e.target)
      // Menu button
      const menuBtn = /** @type {HTMLElement | null} */ (target.closest('.file-card-menu'))
      if (menuBtn) {
        e.stopPropagation()
        const card = /** @type {HTMLElement} */ (menuBtn.closest('.file-card'))
        const rect = menuBtn.getBoundingClientRect()
        this.#ui.showContextMenu(
          rect.right,
          rect.bottom,
          card.dataset.key ?? '',
          card.dataset.isFolder === 'true',
        )
        return
      }

      // Card click
      const card = /** @type {HTMLElement | null} */ (target.closest('.file-card'))
      if (card) {
        if (card.dataset.isFolder === 'true') {
          /** @type {FileExplorer} */ this.#explorer.navigate(card.dataset.key ?? '')
        } else {
          /** @type {FilePreview} */ this.#preview.preview(card.dataset.key ?? '')
        }
      }
    })

    // Right-click context menu
    $('#file-grid').addEventListener('contextmenu', e => {
      const card = /** @type {HTMLElement | null} */ (
        /** @type {HTMLElement} */ (e.target).closest('.file-card')
      )
      if (card) {
        e.preventDefault()
        this.#ui.showContextMenu(
          e.clientX,
          e.clientY,
          card.dataset.key ?? '',
          card.dataset.isFolder === 'true',
        )
      }
    })

    // Context menu actions
    $('#context-menu').addEventListener('click', e => {
      const item = /** @type {HTMLElement | null} */ (
        /** @type {HTMLElement} */ (e.target).closest('.context-menu-item')
      )
      if (!item) return

      const action = item.dataset.action
      // Ignore clicks on the submenu parent (no data-action)
      if (!action) return

      const menu = /** @type {HTMLElement} */ ($('#context-menu'))
      const key = menu.dataset.key ?? ''
      const isFolder = menu.dataset.isFolder === 'true'

      this.#ui.hideContextMenu()

      switch (action) {
        case 'preview':
          /** @type {FilePreview} */ this.#preview.preview(key)
          break
        case 'download':
          /** @type {FileOperations} */ this.#ops.download(key)
          break
        case 'copyUrl':
          /** @type {FileOperations} */ this.#ops.copyAs(key, 'url')
          break
        case 'copyMarkdown':
          /** @type {FileOperations} */ this.#ops.copyAs(key, 'markdown')
          break
        case 'copyHtml':
          /** @type {FileOperations} */ this.#ops.copyAs(key, 'html')
          break
        case 'copyPresigned':
          /** @type {FileOperations} */ this.#ops.copyAs(key, 'presigned')
          break
        case 'rename':
          /** @type {FileOperations} */ this.#ops.rename(key, isFolder)
          break
        case 'copy':
          /** @type {FileOperations} */ this.#ops.copy(key, isFolder)
          break
        case 'move':
          /** @type {FileOperations} */ this.#ops.move(key, isFolder)
          break
        case 'delete':
          /** @type {FileOperations} */ this.#ops.delete(key, isFolder)
          break
      }
    })

    // Upload button
    const fileInput = /** @type {HTMLInputElement} */ ($('#file-input'))
    $('#upload-btn').addEventListener('click', () => fileInput.click())
    $('#empty-upload-btn').addEventListener('click', () => fileInput.click())

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        /** @type {UploadManager} */ this.#upload.uploadFiles([...fileInput.files])
        fileInput.value = ''
      }
    })

    // New folder
    $('#new-folder-btn').addEventListener('click', async () => {
      const name = await this.#ui.prompt(t('newFolderTitle'), t('newFolderLabel'))
      if (!name) return
      try {
        const key = this.#explorer.currentPrefix + name
        await this.#r2.createFolder(key)
        this.#ui.toast(t('folderCreated', { name }), 'success')
        await this.#explorer.refresh()
      } catch (/** @type {any} */ err) {
        this.#ui.toast(t('networkError', { msg: err.message }), 'error')
      }
    })

    // Load more
    $('#load-more-btn').addEventListener('click', () =>
      /** @type {FileExplorer} */ (this.#explorer).loadMore(),
    )

    // Preview close
    const previewDialog = /** @type {HTMLDialogElement} */ ($('#preview-dialog'))
    $('#preview-close').addEventListener('click', () => previewDialog.close())
    previewDialog.addEventListener('click', e => {
      if (e.target === previewDialog) previewDialog.close()
    })
    $('#preview-download').addEventListener('click', () =>
      /** @type {FilePreview} */ (this.#preview).downloadCurrent(),
    )

    // Upload panel close
    $('#upload-panel-close').addEventListener('click', () => {
      $('#upload-panel').hidden = true
    })

    // Sort buttons
    $('#sort-name-btn').addEventListener('click', () => this.#setSortBy('name'))
    $('#sort-date-btn').addEventListener('click', () => this.#setSortBy('date'))
    $('#sort-size-btn').addEventListener('click', () => this.#setSortBy('size'))

    // Sort order toggle
    $('#sort-asc-btn').addEventListener('click', () => this.#setSortOrder('asc'))
    $('#sort-desc-btn').addEventListener('click', () => this.#setSortOrder('desc'))

    // View toggle
    $('#view-grid-btn').addEventListener('click', () => this.#setView('grid'))
    $('#view-list-btn').addEventListener('click', () => this.#setView('list'))

    // Density select
    $('#density-select').addEventListener('change', (/** @type {Event} */ e) =>
      this.#setDensity(/** @type {HTMLSelectElement} */ (e.target).value),
    )
  }
}

// --- Boot ---
new App()
