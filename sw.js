const CACHE = 'adivinueve-v10';
const THEME_FILES = ['arte', 'entretenimiento', 'deportes', 'historia', 'geografia', 'gastronomia', 'ciencia', 'sociedad'];
const ASSETS = [
  './', './index.html', './app.js', './manifest.json', './icon.svg', './icon-180.png', './icon-512.png',
  ...THEME_FILES.flatMap(t => [`./questions/${t}.js`, `./questions/${t}2.js`]),
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  if (isFont) {
    // polices : cache d'abord (elles ne changent pas), pour fonctionner hors ligne
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    })));
    return;
  }

  // fichiers de l'app : réseau d'abord (toujours la dernière version), cache en secours hors ligne
  e.respondWith((async () => {
    try {
      const resp = await fetch(e.request, { cache: 'no-store' });
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      }
      return resp;
    } catch (err) {
      return (await caches.match(e.request)) || (await caches.match('./index.html'));
    }
  })());
});
