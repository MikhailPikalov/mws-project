import DBHelper from './dbhelper';


function appendGoogleMaps() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_MAPS_API_KEY}&language=en&v=3.32.13&callback=MAP_READY_CALLBACK`;

    document.body.appendChild(script);
}


/**
 * Page object
 */

class PageObj {
    // Adapted from modernizr check for webp support
    // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/img/webp-lossless.js
    static webpSupported(cb) {
        const image = new Image();

        image.onerror = function () {
            cb(false);
        };

        image.onload = function () {
            cb(image.width === 1);
        };

        image.src = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    }

    static getUrlParameterByName(name, url) {
        url = url || window.location.href;

        name = name.replace(/[\[\]]/g, '\\$&');

        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
            results = regex.exec(url);

        if (!results) return null;
        if (!results[2]) return '';

        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    constructor() {
        this.map = {
            object: null,
            markers: []
        };
    }

    init(mapElementSelector) {
        this.dbHelper = new DBHelper();

        this.refs = {
            map: document.querySelector(mapElementSelector)
        };

        window.MAP_READY_CALLBACK = this.onMapReady.bind(this);


        // Google maps

        function enableMap() {
            const mapSectionElement = document.querySelector('.b-main__section--map');
            mapSectionElement.classList.add('b-main__section--map-enabled');

            appendGoogleMaps();
        }

        function shouldMapBeEnabled() {
            return window.innerWidth >= 640;
        }

        const enableMapsFromTheStart = shouldMapBeEnabled();

        if (enableMapsFromTheStart) {
            enableMap();
        } else {
            const seeOnGoogleMapsButton = document.querySelector('.b-main__map-enable-button');
            seeOnGoogleMapsButton.addEventListener('click', (event) => {
                enableMap()
            });

            window.addEventListener('resize', function onWindowResizeMapFix(event) {
                if (!shouldMapBeEnabled()) return;

                enableMap();

                window.removeEventListener('resize', onWindowResizeMapFix);
            });
        }


        // Service worker

        this._registerServiceWorker();
    }

    run() {
        this.init();
    }

    onMapReady(callback) {
        const mapElement = document.querySelector('.b-main__map');

        this.map.object = new google.maps.Map(mapElement, {
            zoom: 12,
            center: {
                lat: 40.722216,
                lng: -73.987501
            },

            scaleControl: false,
            scrollwheel: false,
            rotateControl: false,
            fullscreenControl: false,

            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DEFAULT,
                mapTypeIds: ['roadmap', 'satellite'],
                position: google.maps.ControlPosition.TOP_LEFT
            },

            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },

            streetViewControl: false
        });

        google.maps.event.addListenerOnce(this.map.object, 'tilesloaded', () => {
            mapElement.classList.add('b-main__map--tiles-loaded');
        });

        if (callback) callback();


        // Some fixes for 'best practices' audit in lighthouse

        (function fixTermsLink(tryNumber = 1) {
            const termsLink = document.querySelector('a[href$="terms_maps.html"]'),
                  seeOnGoogleMapsLink = document.querySelector('a[href^="https://maps.google.com/maps?ll"]');

            if (termsLink) {
                termsLink.setAttribute('rel', 'noopener');
                seeOnGoogleMapsLink.setAttribute('rel', 'noopener');
                return;
            }

            if (tryNumber < 100) setTimeout(() => {
                fixTermsLink(tryNumber + 1);
            }, 100);
        })();
    }

    _registerServiceWorker() {
        if (!navigator.serviceWorker) return;

        navigator.serviceWorker.register('/sw.js').then((reg) => {
            if (!navigator.serviceWorker.controller) {
                return;
            }

            if (reg.waiting) {
                this._updateReady(reg.waiting);
                return;
            }

            if (reg.installing) {
                this._trackInstalling(reg.installing);
                return;
            }

            reg.addEventListener('updatefound', () => {
                this._trackInstalling(reg.installing);
            });
        });
    }

    _trackInstalling(worker) {
        worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') {
                this._updateReady(worker);
            }
        });
    }

    _updateReady(worker) {
        // TODO: Prompt about new version available

        const promptYesCallback = () => {
            worker.postMessage({action: 'skip-waiting'});
        };
    }
}

export default PageObj;