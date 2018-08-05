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

    // TODO: work with dbHelper
}

export default RestaurantHelper;