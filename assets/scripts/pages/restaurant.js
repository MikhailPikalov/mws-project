import DBHelper from './../dbhelper';
import PageObj from '../page-obj';

class Page extends PageObj {
    constructor(mapElementId) {
        super(mapElementId);

        this.restaurant = null;
    }

    init() {
        super.init.call(this, 'map');

        this.refs = Object.assign({}, this.refs, {
            breadcrumbs: document.getElementById('breadcrumbs'),

            restaurantName: document.getElementById('restaurant-name'),
            restaurantAddress: document.getElementById('restaurant-address'),
            restaurantImage: document.getElementById('restaurant-img'),
            restaurantCuisine: document.getElementById('restaurant-cuisine'),
            restaurantHours: document.getElementById('restaurant-hours'),

            reviewsContainer: document.getElementById('reviews-container'),
            reviewsList: document.getElementById('reviews-list')
        });
    }

    run() {
        super.run.call(this);


        // Get restaurant data

        this.fetchRestaurantFromURL((error, restaurant) => {
            if (error) { // Got an error!
                console.error(error);
                return;
            }

            this.createMarkerAndAddToMap();

            this.fillBreadcrumb();

            this.fillRestaurantHTML();
        });
    }

    onMapReady() {
        super.onMapReady.call(this);


        // Add restaurant marker to map only if its data is already loaded

        if (this.restaurant) this.createMarkerAndAddToMap();
    }

    fetchRestaurantFromURL(callback) {
        if (this.restaurant) { // restaurant already fetched!
            callback(null, this.restaurant);
            return;
        }

        const id = Page.getUrlParameterByName('id');

        if (!id) { // no id found in URL
            callback('No restaurant id in URL', null);
            return;
        }

        DBHelper.fetchRestaurantById(+id, (error, restaurant) => {
            this.restaurant = restaurant;

            if (!restaurant) {
                console.error(error);
                return;
            }

            callback(null, restaurant)
        });
    }


    // Map markers

    createMarkerAndAddToMap() {
        const marker = DBHelper.mapMarkerForRestaurant(this.restaurant, this.map.object);
        if (!marker) return;

        if (typeof google === 'undefined') return;

        this.map.object.setCenter(this.restaurant.latlng);
    };


    // Fill HTML

    fillRestaurantHTML () {
        const name = this.refs.restaurantName;
        name.innerHTML = this.restaurant.name;

        const address = this.refs.restaurantAddress;
        address.innerHTML = this.restaurant.address;

        const image = this.refs.restaurantImage;
        image.className = 'restaurant-img';
        image.src = DBHelper.imageUrlForRestaurant(this.restaurant);

        const cuisine = this.refs.restaurantCuisine;
        cuisine.innerHTML = this.restaurant.cuisine_type;

        // fill operating hours
        if (this.restaurant.operating_hours) {
            this.fillRestaurantHoursHTML();
        }

        // fill reviews
        this.fillReviewsHTML();
    }

    fillBreadcrumb() {
        const breadcrumbs = this.refs.breadcrumbs;

        const li = document.createElement('li');
        li.innerHTML = this.restaurant.name;

        breadcrumbs.appendChild(li);
    }

    fillRestaurantHoursHTML() {
        const hoursElement = this.refs.restaurantHours;

        for (let weekDay in this.restaurant.operatingHours) {
            const row = document.createElement('tr');

            const day = document.createElement('td');
            day.innerHTML = weekDay;
            row.appendChild(day);

            const time = document.createElement('td');
            time.innerHTML = this.restaurant.operatingHours[weekDay];
            row.appendChild(time);

            hoursElement.appendChild(row);
        }
    }

    fillReviewsHTML() {
        const reviewsContainerElement = this.refs.reviewsContainer;
        const titleElement = document.createElement('h2');

        titleElement.innerHTML = 'Reviews';
        reviewsContainerElement.appendChild(titleElement);

        if (!this.restaurant.reviews) {
            const noReviewsMessageElemenent = document.createElement('p');

            noReviewsMessageElemenent.innerHTML = 'No reviews yet!';
            reviewsContainerElement.appendChild(noReviewsMessageElemenent);

            return;
        }

        const reviewsListElement = this.refs.reviewsList;

        this.restaurant.reviews.forEach(review => {
            reviewsListElement.appendChild(this.createReviewHTML(review));
        });

        reviewsContainerElement.appendChild(reviewsListElement);
    }

    createReviewHTML (review) {
        const reviewElement = document.createElement('li');

        const name = document.createElement('p');
        name.innerHTML = review.name;
        reviewElement.appendChild(name);

        const date = document.createElement('p');
        date.innerHTML = review.date;
        reviewElement.appendChild(date);

        const rating = document.createElement('p');
        rating.innerHTML = `Rating: ${review.rating}`;
        reviewElement.appendChild(rating);

        const comments = document.createElement('p');
        comments.innerHTML = review.comments;
        reviewElement.appendChild(comments);

        return reviewElement;
    }
}

window.Page = new Page();