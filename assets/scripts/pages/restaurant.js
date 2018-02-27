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
            restaurantImageContainer: document.getElementById('restaurant-img-container'),
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
        address.innerHTML = `<b>Address</b>: ${this.restaurant.address}`;


        // Generate image HTML

        const imageContainer = this.refs.restaurantImageContainer;
        const imageFilename = this.restaurant.photograph;

        Page.webpSupported(webpSupported => {
            const ext = webpSupported ? 'webp' : 'jpg';
            const basename = imageFilename.replace(/\..*$/, '');

            const image = document.createElement('img');

            image.className = 'b-restaurant__image';
            image.setAttribute('alt', '');
            image.setAttribute('sizes', '(max-width: 639px) calc(100vw - 48px), 590px');

            image.setAttribute('srcset',
                `/assets/images/1180/${basename}.${ext} 1180w, ` +
                `/assets/images/590/${basename}.${ext} 590w, ` +
                `/assets/images/568/${basename}.${ext} 568w, ` +
                `/assets/images/284/${basename}.${ext} 284w`
            );

            image.src = `/assets/images/284/${basename}.${ext}`;

            imageContainer.appendChild(image);
        });

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
        li.classList.add('b-header__breadcrumb');
        li.innerHTML = this.restaurant.name;

        breadcrumbs.appendChild(li);
    }

    fillRestaurantHoursHTML() {
        const hoursElement = this.refs.restaurantHours;

        for (let weekDay in this.restaurant.operating_hours) {
            const row = document.createElement('tr');

            const day = document.createElement('td');
            day.id = `b-restaurant__hours-day-cell--${weekDay.toLowerCase()}`;
            day.innerHTML = weekDay;
            row.appendChild(day);

            const time = document.createElement('td');
            time.id = `b-restaurant__hours-time-cell--${weekDay.toLowerCase()}`;
            time.innerHTML = this.restaurant.operating_hours[weekDay];
            time.setAttribute('aria-hidden', 'true');
            row.appendChild(time);

            day.setAttribute('aria-labelledby', `${day.id} ${time.id}`);

            hoursElement.appendChild(row);
        }
    }

    fillReviewsHTML() {
        const reviewsContainerElement = this.refs.reviewsContainer;

        if (!this.restaurant.reviews) {
            const noReviewsMessageElemenent = document.createElement('p');
            noReviewsMessageElemenent.classList.add('b-restaurant-reviews__no-reviews-message');
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
        reviewElement.classList.add('b-restaurant-reviews__item');


        // Header

        const header = document.createElement('header');
        header.classList.add('b-restaurant-reviews__item-header');

        const name = document.createElement('p');
        name.classList.add('b-restaurant-reviews__item-reviewer');
        name.innerHTML = review.name;
        header.appendChild(name);

        const date = document.createElement('p');
        date.classList.add('b-restaurant-reviews__item-date');
        date.innerHTML = review.date;
        header.appendChild(date);

        reviewElement.appendChild(header);


        // Content

        const content = document.createElement('div');
        content.classList.add('b-restaurant-reviews__item-content');

        const rating = document.createElement('p');
        rating.classList.add('b-restaurant-reviews__item-rating');
        rating.innerHTML = `Rating: ${review.rating}`;
        content.appendChild(rating);

        const comments = document.createElement('p');
        comments.classList.add('b-restaurant-reviews__item-comment');
        comments.innerHTML = review.comments;
        content.appendChild(comments);

        reviewElement.appendChild(content);


        return reviewElement;
    }
}

window.Page = new Page();