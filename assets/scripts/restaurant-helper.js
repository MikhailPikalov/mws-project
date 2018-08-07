import DBHelper from './dbhelper';

class RestaurantHelper {
    constructor(dbHelper) {
        this.dbHelper = dbHelper;

        this.indexedDBPromise = dbHelper.indexedDBPromise;
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
            url: RestaurantHelper.urlForRestaurant(restaurant),
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
        const regularRequest = (alreadyReceivedRestaurants) => {
            const requestPromise = alreadyReceivedRestaurants
                ? Promise.resolve(alreadyReceivedRestaurants)
                : fetch(DBHelper.DATABASE_URL + 'restaurants/').then(response => response.json());

            requestPromise
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
        };

        if (window.INITIAL_RESTAURANTS_REQUEST_PENDING) {
            window.RESTAURANTS_REQUEST_REGULAR = regularRequest.bind(this);
        } else {
            if (window.INITIAL_RESTAURANTS) {
                regularRequest(window.INITIAL_RESTAURANTS);
            } else {
                regularRequest();
            }
        }
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

export default RestaurantHelper;