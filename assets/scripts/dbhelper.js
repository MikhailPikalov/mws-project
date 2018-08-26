import idb from 'idb';


/**
 * Common database helper class.
 */

class DBHelper {
    constructor() {
        this.indexedDBPromise = DBHelper.openIndexedDB();
    }

    /**
     * Server API endpoint URL.
     */
    static get DATABASE_URL() {
        const port = 1337; // API endpoint port

        return `http://localhost:${port}/`;
    }

    static get indexedDBVersion() {
        return 3;
    }

    static openIndexedDB() {
        if (!navigator.serviceWorker) {
            // If the browser doesn't support service worker,
            // we don't care about having a database

            return Promise.resolve();
        }

        return idb.open('rra', DBHelper.indexedDBVersion, function (upgradeDb) {
            let rraStore;

            switch (upgradeDb.oldVersion) {
                case 0:
                    rraStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});

                case 1:
                    rraStore = upgradeDb.createObjectStore('favorites_actions', {keyPath: 'restaurant_id'});

                case 2:
                    rraStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
                    rraStore.createIndex('by_restaurant', 'restaurant_id');

                    rraStore = upgradeDb.createObjectStore('reviews_actions', {keyPath: 'id'});
                    rraStore.createIndex('by_status', 'reviewStatus');
            }
        });
    }
}

export default DBHelper;
