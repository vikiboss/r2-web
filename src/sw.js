/**
 * Service Worker - Cache-first strategy for static assets
 * @see https://web.dev/offline-cookbook/#cache-first
 */
const CACHE_NAME = 'r2-web-v1'

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './manifest.json',
  './favicon.ico',
  './icon-192.svg',
  './icon-512.svg',
  './css/reset.css',
  './css/tokens.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/utilities.css',
  './css/animations.css',
  './js/app.js',
  './js/config-manager.js',
  './js/constants.js',
  './js/file-explorer.js',
  './js/file-operations.js',
  './js/file-preview.js',
  './js/i18n.js',
  './js/r2-client.js',
  './js/ui-manager.js',
  './js/upload-manager.js',
  './js/utils.js',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode !== 'navigate' && request.mode !== 'same-origin') return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        const clone = response.clone()
        if (response.status === 200 && request.method === 'GET') {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    }),
  )
})
