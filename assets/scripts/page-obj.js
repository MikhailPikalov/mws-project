/**
 * Page object
 */
class PageObj {
    static getUrlParameterByName (name, url) {
        url = url || window.location.href;

        name = name.replace(/[\[\]]/g, '\\$&');

        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
            results = regex.exec(url);

        if (!results)return null;
        if (!results[2]) return '';

        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    };

    constructor() {
        this.map = {
            object: null,
            markers: []
        };
    }

    init(mapElementId) {
        this.refs = {
            map: document.getElementById(mapElementId)
        };

        if (window.MAP_READY) {
            this.onMapReady();
        } else {
            window.MAP_READY_CALLBACK = this.onMapReady.bind(this);
        }
    }

    run() {
        this.init();
    }

    onMapReady() {
        let loc = {
            lat: 40.722216,
            lng: -73.987501
        };

        this.map.object = new google.maps.Map(this.refs.map, {
            zoom: 12,
            center: loc,
            scrollwheel: false
        });

        (function fixTermsLink(tryNumber = 1) {
            const termsLink = document.querySelector('a[href$="terms_maps.html"]');

            if (termsLink) {
                termsLink.setAttribute('rel', 'noopener');
                return;
            }

            if (tryNumber < 100) setTimeout(() => {
                fixTermsLink(tryNumber + 1);
            }, 100);
        })();
    }
}

export default PageObj;