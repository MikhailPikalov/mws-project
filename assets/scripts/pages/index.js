import DBHelper from './../dbhelper';
import PageObj from './../page-obj';

class Page extends PageObj {
    constructor(mapElementId) {
        super(mapElementId);

        this.neighborhoods = null;
        this.cuisines = null;

        this.restaurants = null;
    }

    init() {
        super.init.call(this, 'map');

        this.refs = Object.assign({}, this.refs, {
            neighborhoodsSelect: document.getElementById('neighborhoods-select'),
            cuisinesSelect: document.getElementById('cuisines-select')
        });

        this.refs.neighborhoodsSelect.addEventListener('change', (event) => {
            this.updateRestaurants();
        });

        this.refs.cuisinesSelect.addEventListener('change', (event) => {
            this.updateRestaurants();
        });
    }

    run() {
        super.run.call(this);


        // Get initial selection of restaurants

        this.updateRestaurants();


        // Request all additional options to select

        this.fetchNeighborhoods();
        this.fetchCuisines();
    }

    onMapReady() {
        super.onMapReady.call(this);


        // Add restaurants markers to map only if restaurants are already loaded

        if (this.restaurants) this.createMarkersAndAddToMap();
    }

    updateRestaurants() {
        const cIndex = this.refs.cuisinesSelect.selectedIndex;
        const nIndex = this.refs.neighborhoodsSelect.selectedIndex;

        const cuisine = this.refs.cuisinesSelect[cIndex].value;
        const neighborhood = this.refs.neighborhoodsSelect[nIndex].value;

        DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
            if (error) { // Got an error!
                console.error(error);
                return;
            }

            this.resetRestaurants(restaurants);
        });
    }

    resetRestaurants(newRestaurants) {
        // Clear restaurants HTML

        const restaurantsListElement = document.getElementById('restaurants-list');
        restaurantsListElement.innerHTML = '';


        // Save new restaurants & make new HTML

        this.restaurants = newRestaurants;
        this.fillRestaurantsHTML();


        // Remove all map markers & generate new markers

        this.map.markers.forEach(m => m.setMap(null));
        this.map.markers = [];

        this.createMarkersAndAddToMap();
    }

    fillRestaurantsHTML () {
        const restaurantsListElement = document.getElementById('restaurants-list');

        this.restaurants.forEach(restaurant => {
            restaurantsListElement.append(this.createRestaurantHTML(restaurant));
        });
    }

    createRestaurantHTML (restaurant) {
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
    }


    // Map markers

    createMarkersAndAddToMap() {
        this.restaurants.forEach(restaurant => {
            const marker = DBHelper.mapMarkerForRestaurant(restaurant, this.map.object);
            if (!marker) return;

            if (typeof google === 'undefined') return;

            google.maps.event.addListener(marker, 'click', () => {
                window.location.href = marker.url
            });

            this.map.markers.push(marker);
        });
    };


    // Neighborhoods

    fetchNeighborhoods () {
        DBHelper.fetchNeighborhoods((error, neighborhoods) => {
            if (error) { // Got an error
                console.error(error);
                return;
            }

            this.neighborhoods = neighborhoods;

            this.fillNeighborhoodsHTML();
        });
    }

    fillNeighborhoodsHTML () {
        this.neighborhoods.forEach(neighborhood => {
            const option = document.createElement('option');

            option.innerHTML = neighborhood;
            option.value = neighborhood;

            this.refs.neighborhoodsSelect.append(option);
        });
    }


    // Cuisines

    fetchCuisines() {
        DBHelper.fetchCuisines((error, cuisines) => {
            if (error) { // Got an error!
                console.error(error);
                return;
            }

            this.cuisines = cuisines;

            this.fillCuisinesHTML();
        });
    }

    fillCuisinesHTML () {
        this.cuisines.forEach(cuisine => {
            const option = document.createElement('option');

            option.innerHTML = cuisine;
            option.value = cuisine;

            this.refs.cuisinesSelect.append(option);
        });
    }
}

window.Page = new Page();