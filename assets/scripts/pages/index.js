import DBHelper from './../dbhelper';

let restaurants,
    neighborhoods,
    cuisines;

window.MAP_OBJECT = undefined;
window.MARKERS = [];


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    fetchNeighborhoods();
    fetchCuisines();
});


/**
 * Fetch all neighborhoods and set their HTML.
 */
window.fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
            return;
        }

        self.neighborhoods = neighborhoods;
        fillNeighborhoodsHTML();
    });
};


/**
 * Set neighborhoods HTML.
 */
window.fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');

    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');

        option.innerHTML = neighborhood;
        option.value = neighborhood;

        select.append(option);
    });
};


/**
 * Fetch all cuisines and set their HTML.
 */
window.fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
            return;
        }

        self.cuisines = cuisines;
        fillCuisinesHTML();
    });
};


/**
 * Set cuisines HTML.
 */
window.fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');

        option.innerHTML = cuisine;
        option.value = cuisine;

        select.append(option);
    });
};


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };

    window.MAP_OBJECT = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });

    updateRestaurants();
};

if (window.MAP_READY) setTimeout(initMap, 0);


/**
 * Update page and map for current restaurants.
 */
window.updateRestaurants = () => {
    const cuisinesSelect = document.getElementById('cuisines-select');
    const neighborhoodsSelect = document.getElementById('neighborhoods-select');

    const cIndex = cuisinesSelect.selectedIndex;
    const nIndex = neighborhoodsSelect.selectedIndex;

    const cuisine = cuisinesSelect[cIndex].value;
    const neighborhood = neighborhoodsSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
            return;
        }

        resetRestaurants(restaurants);
        fillRestaurantsHTML();
    });
};


/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
window.resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];

    // Clear restaurants HTML
    const restaurantsListElement = document.getElementById('restaurants-list');
    restaurantsListElement.innerHTML = '';

    // Remove all map markers
    window.MARKERS.forEach(m => m.setMap(null));
    window.MARKERS = [];

    window.restaurants = restaurants;
};


/**
 * Create all restaurants HTML and add them to the webpage.
 */
window.fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const restaurantsListElement = document.getElementById('restaurants-list');

    restaurants.forEach(restaurant => {
        restaurantsListElement.append(createRestaurantHTML(restaurant));
    });

    addMarkersToMap();
};


/**
 * Create restaurant HTML.
 */
window.createRestaurantHTML = (restaurant) => {
    const restaurantElement = document.createElement('li');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    restaurantElement.append(image);

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    restaurantElement.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    restaurantElement.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    restaurantElement.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    restaurantElement.append(more);

    return restaurantElement;
};


/**
 * Add markers for current restaurants to the map.
 */
window.addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, window.MAP_OBJECT);

        google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url
        });

        window.MARKERS.push(marker);
    });
};