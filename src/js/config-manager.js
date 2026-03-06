import {
  STORAGE_KEY,
  REMEMBER_PW_KEY,
  THEME_KEY,
  LANG_KEY,
  VIEW_KEY,
  DENSITY_KEY,
  SORT_BY_KEY,
  SORT_ORDER_KEY,
} from './constants.js'

const PBKDF2_ITERATIONS = 100_000
const AES_GCM_IV_LEN = 12
const AES_KEY_LEN = 256

/** @typedef {{ accountId?: string; accessKeyId?: string; secretAccessKey?: string; bucket?: string; filenameTpl?: string; filenameTplScope?: string; customDomain?: string; compressMode?: string; compressLevel?: string; tinifyKey?: string }} AppConfig */
/** @typedef {AppConfig & { theme?: string; lang?: string; view?: string; density?: string; sortBy?: string; sortOrder?: string }} SharePayload */

/**
 * Derive AES key from password using PBKDF2
 * @param {string} password
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LEN },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypt plaintext with AES-GCM
 * @param {string} plaintext
 * @param {string} password
 * @returns {Promise<{ salt: string; iv: string; ciphertext: string }>}
 */
async function encrypt(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LEN))
  const key = await deriveKey(password, salt)
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  )
  return {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  }
}

/**
 * Decrypt ciphertext with AES-GCM
 * @param {{ salt: string; iv: string; ciphertext: string }} blob
 * @param {string} password
 * @returns {Promise<string>}
 */
async function decrypt(blob, password) {
  const salt = Uint8Array.from(atob(blob.salt), (c) => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(blob.iv), (c) => c.charCodeAt(0))
  const ciphertext = Uint8Array.from(atob(blob.ciphertext), (c) => c.charCodeAt(0))
  const key = await deriveKey(password, salt)
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(dec)
}

class ConfigManager {
  /** @type {AppConfig | null} */
  #cached = null
  /** @type {string | null} */
  #password = null

  /** @returns {string | null} */
  getRaw() {
    return localStorage.getItem(STORAGE_KEY)
  }

  /** @returns {boolean} */
  isEncrypted() {
    const raw = this.getRaw()
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' && parsed.v === 2
    } catch {
      return false
    }
  }

  /** @returns {boolean} */
  isLegacy() {
    const raw = this.getRaw()
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false
      return parsed.v !== 2 && 'accountId' in parsed
    } catch {
      return false
    }
  }

  /** @returns {AppConfig | null} - Legacy plaintext config for display during migration */
  getLegacyConfig() {
    if (!this.isLegacy()) return null
    try {
      const raw = this.getRaw()
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  /** @returns {boolean} */
  hasStoredConfig() {
    return !!this.getRaw()
  }

  /**
   * Unlock with password, cache config
   * @param {string} password
   * @param {boolean} [remember=false]
   * @returns {Promise<boolean>}
   */
  async unlock(password, remember = false) {
    const raw = this.getRaw()
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw)
      if (parsed.v === 2) {
        const plain = await decrypt(
          { salt: parsed.s, iv: parsed.i, ciphertext: parsed.c },
          password,
        )
        const cfg = JSON.parse(plain)
        if (!cfg || typeof cfg !== 'object') return false
        this.#cached = cfg
        this.#password = password
        if (remember) sessionStorage.setItem(REMEMBER_PW_KEY, password)
        return true
      }
      if (this.isLegacy()) {
        this.#cached = parsed
        this.#password = password
        if (remember) sessionStorage.setItem(REMEMBER_PW_KEY, password)
        return true
      }
    } catch {
      /* decrypt failed */
    }
    return false
  }

  /** Try auto-unlock using remembered password */
  async tryAutoUnlock() {
    const remembered = sessionStorage.getItem(REMEMBER_PW_KEY)
    if (!remembered) return false
    const ok = await this.unlock(remembered, true)
    if (!ok) sessionStorage.removeItem(REMEMBER_PW_KEY)
    return ok
  }

  lock() {
    this.#cached = null
    this.#password = null
    sessionStorage.removeItem(REMEMBER_PW_KEY)
  }

  /** @returns {boolean} */
  isUnlocked() {
    return this.#cached !== null
  }

  /** @returns {AppConfig} */
  get() {
    if (!this.#cached) throw new Error('Config not unlocked')
    return this.#cached
  }

  /**
   * Encrypt and save config
   * @param {AppConfig} cfg
   * @param {string} password
   * @returns {Promise<void>}
   */
  async encryptAndSave(cfg, password) {
    const blob = await encrypt(JSON.stringify(cfg), password)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: 2, s: blob.salt, i: blob.iv, c: blob.ciphertext }),
    )
    this.#cached = cfg
    this.#password = password
  }

  /**
   * @param {AppConfig} cfg
   * @returns {Promise<void>}
   */
  async save(cfg) {
    if (this.#password) {
      await this.encryptAndSave(cfg, this.#password)
      return
    }
    throw new Error('Cannot save: no password. Use encryptAndSave with password.')
  }

  clear() {
    localStorage.removeItem(STORAGE_KEY)
    this.lock()
  }

  isValid() {
    try {
      const c = this.get()
      return !!(c.accountId && c.accessKeyId && c.secretAccessKey && c.bucket)
    } catch {
      return false
    }
  }

  getEndpoint() {
    const c = this.get()
    return `https://${c.accountId}.r2.cloudflarestorage.com`
  }

  getBucketUrl() {
    const c = this.get()
    return `${this.getEndpoint()}/${c.bucket}`
  }

  toBase64() {
    /** @type {SharePayload} */
    const payload = {
      ...this.get(),
      theme: localStorage.getItem(THEME_KEY) || undefined,
      lang: localStorage.getItem(LANG_KEY) || undefined,
      view: localStorage.getItem(VIEW_KEY) || undefined,
      density: localStorage.getItem(DENSITY_KEY) || undefined,
      sortBy: localStorage.getItem(SORT_BY_KEY) || undefined,
      sortOrder: localStorage.getItem(SORT_ORDER_KEY) || undefined,
    }
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  }

  /**
   * Load config from Base64 URL param. Saves preferences only. Returns r2Config for caller to encryptAndSave.
   * @param {string} b64
   * @returns {{ ok: boolean; r2Config?: AppConfig }}
   */
  loadFromBase64(b64) {
    try {
      const json = decodeURIComponent(escape(atob(b64)))
      /** @type {SharePayload} */
      const payload = JSON.parse(json)
      if (!payload || typeof payload !== 'object' || Array.isArray(payload))
        return { ok: false }

      const { theme, lang, view, density, sortBy, sortOrder, ...r2Config } = payload
      if (theme) localStorage.setItem(THEME_KEY, theme)
      if (lang) localStorage.setItem(LANG_KEY, lang)
      if (view) localStorage.setItem(VIEW_KEY, view)
      if (density) localStorage.setItem(DENSITY_KEY, density)
      if (sortBy) localStorage.setItem(SORT_BY_KEY, sortBy)
      if (sortOrder) localStorage.setItem(SORT_ORDER_KEY, sortOrder)

      if (Object.values(r2Config).some(Boolean)) return { ok: true, r2Config }
      return { ok: true }
    } catch {
      return { ok: false }
    }
  }

  /**
   * Migrate legacy plaintext to encrypted
   * @param {string} password
   * @param {boolean} [remember=false]
   * @returns {Promise<boolean>}
   */
  async migrateLegacy(password, remember = false) {
    const raw = this.getRaw()
    if (!raw || !this.isLegacy()) return false
    try {
      const cfg = JSON.parse(raw)
      await this.encryptAndSave(cfg, password)
      if (remember) sessionStorage.setItem(REMEMBER_PW_KEY, password)
      this.#password = password
      return true
    } catch {
      return false
    }
  }

  getShareUrl() {
    const b64 = this.toBase64()
    const url = new URL(window.location.href)
    url.searchParams.set('config', b64)
    url.hash = ''
    return url.toString()
  }
}

export { ConfigManager }
