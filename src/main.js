import { App } from './js/app.js'

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {})
}

new App()
