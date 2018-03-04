import DBHelper from './../dbhelper';
import PageObj from './../page-obj';

class Page extends PageObj {
    constructor() {
        super();

        this.neighborhoods = null;
        this.cuisines = null;

        this.restaurants = null;
    }

    init() {
        super.init.call(this, '.b-main__map');

        this.refs = Object.assign({}, this.refs, {
            headerTitleLink: document.querySelector('.b-header__title-link'),

            neighborhoodsSelect: document.querySelector('.b-filters__select--neighborhoods'),
            cuisinesSelect: document.querySelector('.b-filters__select--cuisines'),

            restaurantsList: document.querySelector('.b-restaurants__list')
        });

        this.refs.neighborhoodsSelect.addEventListener('change', (event) => {
            this.updateRestaurants();
        });

        this.refs.cuisinesSelect.addEventListener('change', (event) => {
            this.updateRestaurants();
        });



        // Intersection observer for images

        function applySrc(target) {
             const img = target.querySelector('img');

            img.srcset = img.dataset.srcset;
            img.src = img.dataset.src;
        }

        this.io = typeof IntersectionObserver !== 'undefined'
            ? new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;

                    applySrc(entry.target);

                    this.io.unobserve(entry.target);
                });
            })
            : {
                observe: (target) => {
                    applySrc(target);
                }
            };


        // Skip map tab actions

        this.refs.headerTitleLink.addEventListener('keydown', (event) => {
            if (event.keyCode === 9 && !event.shiftKey) {
                event.preventDefault();

                this.refs.neighborhoodsSelect.focus();
            }
        });

        this.refs.neighborhoodsSelect.addEventListener('keydown', (event) => {
            if (event.keyCode === 9 && event.shiftKey) {
                event.preventDefault();

                this.refs.headerTitleLink.focus();
            }
        });
    }

    run() {
        super.run.call(this);


        // Get initial selection of restaurants

        this.updateRestaurants(() => {
            // Select data, dependent on all restaurants data

            this.fetchNeighborhoods();
            this.fetchCuisines();
        });
    }

    onMapReady() {
        super.onMapReady.call(this, () => {
            // Add restaurants markers to map only if restaurants are already loaded before map

            if (this.restaurants) this.createMarkersAndAddToMap();
        });
    }

    updateRestaurants(callback) {
        let cIndex = this.refs.cuisinesSelect.selectedIndex;
        let nIndex = this.refs.neighborhoodsSelect.selectedIndex;

        if (cIndex === -1) cIndex = this.refs.cuisinesSelect.selectedIndex = 0;
        if (nIndex === -1) nIndex = this.refs.neighborhoodsSelect.selectedIndex = 0;

        const cuisine = this.refs.cuisinesSelect[cIndex].value;
        const neighborhood = this.refs.neighborhoodsSelect[nIndex].value;

        this.dbHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
            if (error) {
                // Do not interrupt program flow, just log the error
                console.log(error);
            }

            this.resetRestaurants(restaurants);

            if (callback) callback();
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
            restaurantsListElement.appendChild(this.createRestaurantHTML(restaurant));
        });
    }

    createRestaurantHTML (restaurant) {
        const restaurantElement = document.createElement('li');
        restaurantElement.classList.add('b-restaurants__item');


        // Image

        const imageContainer = document.createElement('div');
        imageContainer.className = 'b-restaurants__item-img-container';
        restaurantElement.appendChild(imageContainer);

        const imageFilename = restaurant.photograph;

        imageFilename && Page.webpSupported(webpSupported => {
            const ext = webpSupported ? 'webp' : 'jpg';
            const basename = imageFilename.replace(/\..*$/, '');

            const image = document.createElement('img');

            image.className = 'b-restaurants__item-img';
            image.setAttribute('alt', '');
            image.setAttribute('sizes', '(max-width: 639px) calc(100vw - 48px), 284px');

            image.dataset.srcset =
                `/assets/images/1180/${basename}.${ext} 1180w, ` +
                `/assets/images/590/${basename}.${ext} 590w, ` +
                `/assets/images/568/${basename}.${ext} 568w, ` +
                `/assets/images/284/${basename}.${ext} 284w`;

            image.dataset.src = `/assets/images/284/${basename}.${ext}`;

            imageContainer.appendChild(image);

            this.io.observe(imageContainer);
        });


        // Info block

        const info = document.createElement('div');
        info.className = 'b-restaurants__item-info';
        restaurantElement.appendChild(info);

        const title = document.createElement('h3');
        title.id = `b-restaurants__item-title--${restaurant.id}`;
        title.classList.add('b-restaurants__item-title');
        title.innerHTML = restaurant.name;
        info.appendChild(title);

        const neighborhood = document.createElement('p');
        neighborhood.id = `b-restaurants__item-paragraph--neighborhood--${restaurant.id}`;
        neighborhood.classList.add('b-restaurants__item-paragraph');
        neighborhood.innerHTML = restaurant.neighborhood;
        info.appendChild(neighborhood);

        const address = document.createElement('p');
        address.classList.add('b-restaurants__item-paragraph');
        address.innerHTML = restaurant.address;
        info.appendChild(address);

        const more = document.createElement('a');
        more.id = `b-restaurants__item-link--${restaurant.id}`;
        more.classList.add('b-restaurants__item-link');
        more.innerHTML = 'View Details';
        more.href = DBHelper.urlForRestaurant(restaurant);
        more.setAttribute('aria-labelledby', `${more.id} ${title.id}`);
        info.appendChild(more);

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
        if (!this.restaurants) return;

        // Get all neighborhoods from all restaurants
        const neighborhoods = this.restaurants.map((v, i) => this.restaurants[i].neighborhood);

        // Remove duplicates from neighborhoods
        this.neighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);

        this.fillNeighborhoodsHTML();
    }

    fillNeighborhoodsHTML () {
        this.neighborhoods.forEach(neighborhood => {
            const option = document.createElement('option');

            option.innerHTML = neighborhood;
            option.value = neighborhood;

            this.refs.neighborhoodsSelect.appendChild(option);
        });
    }


    // Cuisines

    fetchCuisines() {
        if (!this.restaurants) return;

        // Get all cuisines from all restaurants
        const cuisines = this.restaurants.map((v, i) => this.restaurants[i].cuisine_type);

        // Remove duplicates from cuisines
        this.cuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);

        this.fillCuisinesHTML();
    }

    fillCuisinesHTML () {
        this.cuisines.forEach(cuisine => {
            const option = document.createElement('option');

            option.innerHTML = cuisine;
            option.value = cuisine;

            this.refs.cuisinesSelect.appendChild(option);
        });
    }
}

window.Page = new Page();