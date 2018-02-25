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
            cuisinesSelect: document.getElementById('cuisines-select'),

            restaurantsList: document.getElementById('restaurants-list')
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

        const restaurantsListElement = this.refs.restaurantsList;
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
        const restaurantsListElement = this.refs.restaurantsList;

        this.restaurants.forEach(restaurant => {
            restaurantsListElement.append(this.createRestaurantHTML(restaurant));
        });
    }

    createRestaurantHTML (restaurant) {
        const restaurantElement = document.createElement('li');
        restaurantElement.classList.add('b-restaurants__item');


        // Image

        const imageContainer = document.createElement('div');
        imageContainer.className = 'b-restaurants__item-img-container';
        restaurantElement.append(imageContainer);

        const image = document.createElement('img');
        image.className = 'b-restaurants__item-img';
        image.setAttribute('alt', '');
        image.src = DBHelper.imageUrlForRestaurant(restaurant);
        imageContainer.append(image);


        // Info block

        const info = document.createElement('div');
        info.className = 'b-restaurants__item-info';
        restaurantElement.append(info);

        const title = document.createElement('h3');
        title.id = `b-restaurants__item-title--${restaurant.id}`;
        title.classList.add('b-restaurants__item-title');
        title.innerHTML = restaurant.name;
        info.append(title);

        const neighborhood = document.createElement('p');
        neighborhood.id = `b-restaurants__item-paragraph--neighborhood--${restaurant.id}`;
        neighborhood.classList.add('b-restaurants__item-paragraph');
        neighborhood.innerHTML = restaurant.neighborhood;
        info.append(neighborhood);

        const address = document.createElement('p');
        address.classList.add('b-restaurants__item-paragraph');
        address.innerHTML = restaurant.address;
        info.append(address);

        const more = document.createElement('a');
        more.id = `b-restaurants__item-link--${restaurant.id}`;
        more.classList.add('b-restaurants__item-link');
        more.innerHTML = 'View Details';
        more.href = DBHelper.urlForRestaurant(restaurant);
        more.setAttribute('aria-labelledby', `${more.id} ${title.id}`);
        info.append(more);

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