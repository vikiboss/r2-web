export const VERSION = '1.13.2'
export const UPDATED_AT = '2026-11-11T05:10:54.067Z'
export const STORAGE_KEY = 'r2-manager-config'
export const THEME_KEY = 'r2-manager-theme'
export const LANG_KEY = 'r2-manager-lang'
export const VIEW_KEY = 'r2-manager-view'
export const DENSITY_KEY = 'r2-manager-density'
export const SORT_BY_KEY = 'r2-manager-sort-by'
export const SORT_ORDER_KEY = 'r2-manager-sort-order'
export const PAGE_SIZE = 300
export const TOAST_DURATION = 3000
export const MAX_UPLOAD_SIZE = 1024 ** 4 // 1 TiB
export const MULTIPART_UPLOAD_THRESHOLD = 10 * 1024 ** 2 // 10 MiB
export const MULTIPART_MIN_PART_SIZE = 5 * 1024 ** 2 // R2 minimum: 5 MiB
export const MULTIPART_MAX_PARTS = 10_000
export const MULTIPART_CONCURRENCY = 3
export const MULTIPART_MAX_RETRIES = 3

export const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|avif)$/i
export const COMPRESSIBLE_IMAGE_RE = /\.(jpe?g|png|webp|avif)$/i
export const TEXT_RE =
  /\.(txt|md|json|xml|csv|html|css|js|ts|jsx|tsx|yaml|yml|toml|ini|cfg|conf|log|sh|bash|py|rb|go|rs|java|c|cpp|h|hpp|sql|env|gitignore|dockerfile)$/i
export const AUDIO_RE = /\.(mp3|wav|ogg|flac|aac|m4a|wma)$/i
export const VIDEO_RE = /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i
export const DOCUMENT_RE = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp|rtf)$/i
export const ARCHIVE_RE = /\.(zip|rar|7z|tar|gz|bz2|xz|tgz)$/i
export const CODE_RE = /\.(js|ts|jsx|tsx|py|rb|go|rs|java|c|cpp|h|hpp|sh|bash)$/i
