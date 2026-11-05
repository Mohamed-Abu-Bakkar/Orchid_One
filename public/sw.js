/* Only cache public static assets; never cache authenticated HR pages or API responses. */
const CACHE="orchid-static-v1";
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);if(r.method!=="GET"||u.origin!==self.location.origin||u.pathname.startsWith("/api/"))return;if(u.pathname.startsWith("/_next/static/"))e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(r);if(hit)return hit;const response=await fetch(r);if(response.ok)c.put(r,response.clone());return response}))});