var staticCacheName = 'rra-static-1.0';
var foreignCacheName = 'rra-foreign-1.0';

self.addEventListener('install', function (event) {
    // TODO: Whatever else will be needed
});

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        // First look in network for the freshest resources

        var response = fetch(event.request).then(function (networkResponse) {
            var responseToStore = networkResponse.clone();

            caches.open(staticCacheName).then(function (cache) {
                cache.put(event.request, responseToStore);
            });

            return networkResponse;
        }).catch(function (error) {
            // Network error, try to find resource in cache

            return caches.open(staticCacheName).then(function (cache) {
                return cache.match(event.request);
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
    // TODO: Whatever else will be needed
});

self.addEventListener('message', function (event) {
    if (!event.data) return;

    if (event.data.action && event.data.action === 'skip-waiting') {
        self.skipWaiting();
    }
});