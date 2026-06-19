const CACHE='ete-diagnostico-v65-1';
const ASSETS=[
  "assets/header-ete-modelo.png",
  "assets/icons/icon.svg",
  "assets/logo-ete.png",
  "assets/modelo-logo-1.png",
  "assets/modelo-logo-2.png",
  "css/style.css",
  "descritores/matematica-em.json",
  "descritores/portugues-em.json",
  "index.html",
  "js/app.js",
  "js/auth-v63.js",
  "js/banco-questoes.js",
  "js/coordenacao-v608.js",
  "js/correcoes-v605.js",
  "js/descritores.js",
  "js/diagnostico.js",
  "js/evolucao.js",
  "js/exportacao.js",
  "js/exportacoes-v607.js",
  "js/exportacoes-v609.js",
  "js/fichas.js",
  "js/importacao.js",
  "js/impressao.js",
  "js/institucional-v62.js",
  "js/intervencoes.js",
  "js/melhorias-v606.js",
  "js/pedagogico-avancado.js",
  "js/relatorios.js",
  "js/sistema.js",
  "js/supabase-sync.js",
  "js/turmas.js",
  "js/v64-estabilidade.js",
  "manifest.webmanifest"
];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS).catch(()=>null)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('index.html')));
    return;
  }
  if(url.origin!==location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(resp=>{
    const copy=resp.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    return resp;
  }).catch(()=>cached)));
});
