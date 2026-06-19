const CACHE='vetor-v68-6';
const ASSETS=[
  './',
  './index.html?v=68-6',
  './manifest.webmanifest',
  './css/style.css?v=68-6',
  './assets/vetor-logo.svg',
  './assets/vetor-logo.png',
  './assets/icons/icon.svg',
  './assets/icons/icon.png'
];

self.addEventListener('install', event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;
  event.respondWith(
    fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(req, copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(req).then(cached=>cached || caches.match('./index.html?v=68-6')))
  );
});
