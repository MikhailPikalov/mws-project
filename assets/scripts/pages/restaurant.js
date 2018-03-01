import DBHelper from './../dbhelper';
import PageObj from '../page-obj';

class Page extends PageObj {
    constructor(mapElementId) {
        super(mapElementId);

        this.restaurant = null;
    }

    init() {
        super.init.call(this, '.b-main__map');

        this.refs = Object.assign({}, this.refs, {
            breadcrumbsList: document.querySelector('.b-header__breadcrumbs-list'),
            breadcrumbsHomeLink: document.querySelector('.b-header__breadcrumb:first-child a'),

            restaurantName: document.querySelector('.b-restaurant__title'),
            restaurantAddress: document.querySelector('.b-restaurant__address'),
            restaurantImageContainer: document.querySelector('.b-restaurant__image-container'),
            restaurantCuisine: document.querySelector('.b-restaurant__cuisine'),
            restaurantHoursTable: document.querySelector('.b-restaurant__hours-table'),

            reviewsContainer: document.querySelector('.b-restaurant-reviews'),
            reviewsList: document.querySelector('.b-restaurant-reviews__list')
        });


        // Skip map tab actions

        this.refs.breadcrumbsHomeLink.addEventListener('keydown', (event) => {
            // Tab key and no Shift key

            if (event.keyCode === 9 && !event.shiftKey) {
                event.preventDefault();

                this.refs.restaurantName.focus();
            }
        });

        this.refs.restaurantName.addEventListener('keydown', (event) => {
            // Tab key and Shift key

            if (event.keyCode === 9 && event.shiftKey) {
                event.preventDefault();

                this.refs.breadcrumbsHomeLink.focus();
            }
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
        const li = document.createElement('li');
        li.classList.add('b-header__breadcrumb');
        li.innerHTML = this.restaurant.name;

        this.refs.breadcrumbsList.appendChild(li);
    }

    fillRestaurantHoursHTML() {
        const hoursTableElement = this.refs.restaurantHoursTable;

        for (let weekDay in this.restaurant.operating_hours) {
            const row = document.createElement('tr');
            row.setAttribute('tabindex', 0);

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

            hoursTableElement.appendChild(row);
        }
    }

    fillReviewsHTML() {
        if (!this.restaurant.reviews || !this.restaurant.reviews.length) {
            const noReviewsMessageElemenent = document.createElement('p');
            noReviewsMessageElemenent.classList.add('b-restaurant-reviews__no-reviews-message');
            noReviewsMessageElemenent.innerHTML = 'No reviews yet!';

            this.refs.reviewsContainer.appendChild(noReviewsMessageElemenent);

            this.refs.reviewsList.classList.add('b-restaurant-reviews__list--empty');

            return;
        }

        this.restaurant.reviews.forEach(review => {
            this.refs.reviewsList.appendChild(this.createReviewHTML(review));
        });
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
        name.setAttribute('tabindex', 0);
        name.setAttribute('aria-label', `Review by ${review.name}`);
        header.appendChild(name);

        const date = document.createElement('p');
        date.classList.add('b-restaurant-reviews__item-date');
        date.innerHTML = review.date;
        date.setAttribute('tabindex', 0);
        date.setAttribute('aria-label', `Review date ${review.date}`);
        header.appendChild(date);

        reviewElement.appendChild(header);


        // Content

        const content = document.createElement('div');
        content.classList.add('b-restaurant-reviews__item-content');

        const rating = document.createElement('p');
        rating.classList.add('b-restaurant-reviews__item-rating');
        rating.innerHTML = `Rating: ${review.rating}`;
        rating.setAttribute('tabindex', 0);
        content.appendChild(rating);

        const comments = document.createElement('p');
        comments.classList.add('b-restaurant-reviews__item-comment');
        comments.innerHTML = review.comments;
        comments.setAttribute('tabindex', 0);
        content.appendChild(comments);

        reviewElement.appendChild(content);


        return reviewElement;
    }
}

window.Page = new Page();