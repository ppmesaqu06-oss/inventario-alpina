/* Service worker · ALPINA · TOMA DE INVENTARIO
   El nombre del cache lleva el sello de compilacion: cada build nuevo invalida
   el anterior y la app se actualiza sola en el celular.                        */
var V = "2026.09.09.0051";
var C = "alpina-inventario-" + V;
var ASSETS = ["./","./index.html","./manifest.webmanifest","./icon-192.png",
              "./icon-512.png","./icon-maskable.png","./apple-touch-icon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(C).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
      .catch(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ return k===C ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("message", function(e){
  if(e.data==="skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var esPagina = req.mode==="navigate" || /\/(index\.html)?(\?.*)?$/.test(new URL(req.url).pathname);

  if(esPagina){
    /* La pagina siempre se pide primero a la red: asi el usuario ve la version nueva
       apenas se publica, y si no hay señal cae al cache.                            */
    e.respondWith(
      fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(C).then(function(c){ c.put("./index.html", copy); });
        return res;
      }).catch(function(){
        return caches.match("./index.html").then(function(hit){ return hit || caches.match(req); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.status===200 && res.type==="basic"){
          var copy=res.clone();
          caches.open(C).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
