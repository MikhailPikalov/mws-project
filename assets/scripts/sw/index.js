var staticCacheName = 'rra-static-<%= STATIC_CACHE_VERSION %>';
var foreignCacheName = 'rra-foreign-1.0';

var allCaches = [
    staticCacheName,
    foreignCacheName
];

self.addEventListener('install', function (event) {
    // TODO: Whatever else will be needed
});

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        // Look in the cache first, if response found, use it, otherwise send network request.
        // Send request to network to update resource anywway if cached version was used..b-filters

        var response = caches.open(staticCacheName).then(function (cache) {
            return cache.match(event.request).then(function (cachedResponse) {
                var newFetch = fetch(event.request).then(function (networkResponse) {
                    cache.put(event.request, networkResponse.clone());

                    return networkResponse;
                }).catch(function (error) {
                    return Response.error();
                });

                return cachedResponse || newFetch;
            });
        });

        event.respondWith(response);

        return;
    }


    // Foreign requests, like google maps and analytics

    event.respondWith(
        caches.open(foreignCacheName).then(function (cache) {
            return cache.match(event.request).then(function (cachedResponse) {
                var newFetch = fetch(event.request).then(function (networkResponse) {
                    cache.put(event.request, networkResponse.clone());

                    return networkResponse;
                }).catch(function (error) {
                    return Response.error();
                });

                return cachedResponse || newFetch;
            })
        })
    );
});

self.addEventListener('activate', function (event) {
    // Remove all our old caches

    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('rra-') && !allCaches.includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('message', function (event) {
    if (!event.data) return;

    if (event.data.action && event.data.action === 'skip-waiting') {
        self.skipWaiting();
    }
});