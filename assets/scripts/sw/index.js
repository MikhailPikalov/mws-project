/**
* Some parts and some logic of the code in this service worker is adapted from the one used in 'wittr' project
*/

// Cache for pages and css/js files
var mainCacheName = 'rra-static-<%= STATIC_CACHE_VERSION %>';

// Cache for content images
var imagesCacheName = 'rra-images-1.0';

// Cache for foreign resources
var foreignCacheName = 'rra-foreign-1.0';


self.addEventListener('install', function (event) {
    // Application is being fully cached here, except for google maps resources and content images

    var urlsToCache = [
        '/',
        '/restaurant.html'

        <% Object.values(ROOT_ASSETS_FILENAMES).map(filename => { %>
            ,'/<%- filename %>'
        <% }) %>

        <% !STYLES_SERIALIZED && Object.values(STYLES_MANIFEST).map(filename => { %>
            ,'/assets/css/<%- filename %>'
        <% }) %>

        <% Object.values(WEBPACK_MANIFEST).map(chunk => { %>
            ,'/assets/js/<%- chunk.js %>'
        <% }) %>
    ];

    event.waitUntil(
        caches.open(mainCacheName).then(function (cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {

        // Home page

        if (requestUrl.pathname === '/') {
            event.respondWith(
                caches.open(mainCacheName).then(function (cache) {
                    return cache.match('/');
                })
            );

            return;
        }


        // Restaurant page

        if (requestUrl.pathname === '/restaurant.html') {
            event.respondWith(
                caches.open(mainCacheName).then(function (cache) {
                    return cache.match('/restaurant.html');
                })
            );

            return;
        }


        // Content images

        if (requestUrl.pathname.startsWith('/assets/images/')) {
            event.respondWith(serveContentImage(event.request));
            return;
        }


        // Root assets

        event.respondWith(
            caches.open(mainCacheName).then(function (cache) {
                return cache.match(event.request).then(function (response) {
                    return response || fetch(event.request);
                });
            })
        );

        return;
    }


    // Foreign requests, like google maps and analytics

    if (<%= CACHE_FOREIGN_RESOURCES %>) event.respondWith(
        caches.open(foreignCacheName).then(function (cache) {
            return cache.match(event.request).then(function (cachedResponse) {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then(function (networkResponse) {
                    cache.put(event.request, networkResponse.clone());

                    return networkResponse;
                }).catch(function (error) {
                    return Response.error();
                });
            })
        })
    );
});

function serveContentImage(request) {
    // Look for image first in cache, then send network request
    // If network is unavailable, look in cache for other sizes of the same image

    var storageUrl = request.url;
    var size = +storageUrl.match(/\/([^\/]*?)\/[^.\/]*?\..*$/)[1];

    return caches.open(imagesCacheName).then(function (cache) {
        return cache.match(storageUrl).then(function (cachedResponse) {
            if (cachedResponse) return cachedResponse;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());

                return networkResponse;
            }).catch(function (error) {
                // Look in cache for images of other sizes, first up from current size, then down

                var sizes = [284, 568, 590, 1180];
                var lookupSizes = sizes.slice(sizes.indexOf(size) + 1).concat(sizes.slice(0, sizes.indexOf(size)).reverse());

                var startLookup;
                var lookup = new Promise(function (resolve, reject) {
                    startLookup = reject;
                });

                lookupSizes.forEach(function (lookupSize) {
                    lookup = lookup.catch(function () {
                        var lookupUrl = storageUrl.replace(size, lookupSize);

                        return cache.match(lookupUrl).then(function (cachedResponse) {
                            return cachedResponse;
                        });
                    });
                });

                lookup = lookup.catch(function () {
                    return Response.error();
                });

                setTimeout(function () {
                    startLookup();
                }, 0);

                return lookup;
            });
        });
    });
}

self.addEventListener('activate', function (event) {
    // Remove all our old caches

    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    // Clear all our own caches, except new 1. main and 2. content images caches
                    return cacheName.startsWith('rra-') && ![mainCacheName, imagesCacheName].includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});


// Not used yet

self.addEventListener('message', function (event) {
    if (!event.data) return;

    if (event.data.action && event.data.action === 'skip-waiting') {
        self.skipWaiting();
    }
});