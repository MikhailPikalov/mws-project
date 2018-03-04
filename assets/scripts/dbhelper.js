import idb from 'idb';


/**
 * Common database helper class.
 */

class DBHelper {
    constructor() {
        this.indexedDBPromise = DBHelper.openIndexedDB();
    }


    /**
     * *****************************************
     * Static infrastructure methods
     * *****************************************
     */


    /**
     * Server API endpoint URL.
     */
    static get DATABASE_URL() {
        const port = 1337; // API endpoint port

        return `http://localhost:${port}/`;
    }

    static get indexedDBVersion() {
        return 1;
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
            }
        });
    }


    /**
     * *****************************************
     * Static helpers
     * *****************************************
     */


    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        if (typeof google === 'undefined') return null;

        const marker = new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP
        });

        return marker;
    }


    /**
     * *****************************************
     * Dynamic methods
     * *****************************************
     */


    /**
     * Fetch all restaurants.
     */
    fetchRestaurants(callback) {
        fetch(DBHelper.DATABASE_URL + 'restaurants/')
            .then(response => response.json())
            .then(restaurants => {
                // Cache restaurants to IndexedDB

                this.indexedDBPromise.then(function (db) {
                    if (!db) return;

                    const tx = db.transaction('restaurants', 'readwrite');
                    const store = tx.objectStore('restaurants');

                    restaurants.forEach(function (restaurant) {
                        store.put(restaurant);
                    });
                });


                // Return results

                callback(null, restaurants);
            })
            .catch(error => {
                const errorMessage = `Restaurants request failed: ${error.message}`;

                this.indexedDBPromise.then(function (db) {
                    if (!db) {
                        callback(errorMessage, null);

                        return;
                    }

                    const tx = db.transaction('restaurants', 'readonly');
                    const store = tx.objectStore('restaurants');

                    store.getAll().then(restaurants => {
                        callback(errorMessage, restaurants);
                    });
                });
            });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    fetchRestaurantById(id, callback) {
         fetch(DBHelper.DATABASE_URL + `restaurants/${id}`)
            .then(response => response.json())
            .then(restaurant => {
                // Cache restaurant to IndexedDB

                this.indexedDBPromise.then(function (db) {
                    if (!db) return;

                    const tx = db.transaction('restaurants', 'readwrite');
                    const store = tx.objectStore('restaurants');

                    store.put(restaurant);
                });


                // Return restaurant

                callback(null, restaurant);
            })
            .catch(error => {
                const errorMessage = `Restaurant request failed: ${error.message}`;

                this.indexedDBPromise.then(function (db) {
                    if (!db) {
                        callback(errorMessage, null);

                        return;
                    }

                    const tx = db.transaction('restaurants', 'readonly');
                    const store = tx.objectStore('restaurants');

                    store.get(id).then(restaurant => {
                        callback(errorMessage, restaurant);
                    });
                });
            });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants every time

        this.fetchRestaurants((error, restaurants) => {
            let results = restaurants || [];

            if (cuisine !== 'all') { // filter by cuisine
                results = results.filter(r => r.cuisine_type === cuisine);
            }

            if (neighborhood !== 'all') { // filter by neighborhood
                results = results.filter(r => r.neighborhood === neighborhood);
            }

            callback(error, results);
        });
    }
}

export default DBHelper;