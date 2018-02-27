/**
* Most of the code in this service worker is adapted from the 'wittr' project 
*/

// Cache for pages and css/js files
var mainCacheName = 'rra-static-<%= STATIC_CACHE_VERSION %>';

// Cache for content images
var imagesCacheName = 'rra-images-1.0';

// Cache for foreign resources
var foreignCacheName = 'rra-foreign-1.0';


var allCaches = [
    mainCacheName,
    imagesCacheName,
    foreignCacheName
];


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

    event.respondWith(
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
    var storageUrl = request.url;

    return caches.open(imagesCacheName).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());

                return networkResponse;
            }).catch(function (error) {
                // TODO: Get from url requested image size
                // TODO: Look in cache for images of other sizes, first up, then down
                return Response.error();
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
                    return cacheName.startsWith('rra-') && !allCaches.includes(cacheName);
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