import PageObj from '../page-obj';

import RestaurantHelper from './../restaurant-helper';
import FavoritesHelper from './../favorites-helper';

class Page extends PageObj {
    constructor() {
        super();

        this.restaurant = null;
    }

    init() {
        super.init.call(this, '.b-main__map');

        this.refs = Object.assign({}, this.refs, {
            breadcrumbsList: document.querySelector('.b-header__breadcrumbs-list'),
            breadcrumbsHomeLink: document.querySelector('.b-header__breadcrumb:first-child a'),

            mapSection: document.querySelector('.b-main__section--map'),
            mapEnableButton: document.querySelector('.b-main__map-enable-button'),

            restaurantName: document.querySelector('.b-restaurant__title'),
            restaurantAddress: document.querySelector('.b-restaurant__address'),
            restaurantImageContainer: document.querySelector('.b-restaurant__image-container'),
            restaurantCuisine: document.querySelector('.b-restaurant__cuisine'),
            restaurantHoursTable: document.querySelector('.b-restaurant__hours-table'),

            reviewsContainer: document.querySelector('.b-restaurant-reviews'),
            reviewsList: document.querySelector('.b-restaurant-reviews__list'),

            newReviewForm: document.querySelector('.b-restaurant-reviews__form'),
            newReviewFormName: document.querySelector('.b-restaurant-reviews__form-reviewer-input'),
            newReviewFormComment: document.querySelector('.b-restaurant-reviews__form-comment-textarea'),
            newReviewFormFifthRatingInput: document.querySelector('.b-restaurant-reviews__form-rating-item-input[value="5"]')
        });


        // Skip map tab actions

        this.refs.breadcrumbsHomeLink.addEventListener('keydown', (event) => {
            // Tab key and no Shift key

            if (event.keyCode === 9 && !event.shiftKey) {
                event.preventDefault();

                if (!this.refs.mapSection.classList.contains('b-main__section--map-enabled')) {
                    this.refs.mapEnableButton.focus();
                } else {
                    this.refs.restaurantName.focus();
                }
            }
        });

        this.refs.restaurantName.addEventListener('keydown', (event) => {
            // Tab key and Shift key

            if (event.keyCode === 9 && event.shiftKey) {
                event.preventDefault();

                if (!this.refs.mapSection.classList.contains('b-main__section--map-enabled')) {
                    this.refs.mapEnableButton.focus();
                } else {
                    this.refs.breadcrumbsHomeLink.focus();
                }
            }
        });

        this.refs.mapEnableButton.addEventListener('keydown', (event) => {
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
            if (error) {
                // Do not interrupt program, flow, just log the error
                console.error(error);
            }


            if (!restaurant) {
                // No restaurant found for any reason - interrupt
                // TODO: Might be better to display error, maybe some distinct scenario if it is explicitly 404, but not really required
                return;
            }


            // Get restaurant's reviews

            this.reviewsHelper.fetchRestaurantReviews(restaurant, (error, reviews) => {
                if (error) {
                    // Do not interrupt program, flow, just log the error and show empty reviews
                    console.error(error);

                    reviews = [];
                }


                // Save data

                this.restaurant = restaurant;
                this.restaurant.reviews = reviews;


                // Generate page by received data

                this.createMarkerAndAddToMap();

                this.fillBreadcrumb();

                this.fillRestaurantHTML();


                // Start favorites queue

                this.favoritesHelper.queue.start();
                this.reviewsHelper.queue.start();
            });
        });
    }

    onMapReady() {
        super.onMapReady.call(this, () => {
            // Add restaurant marker to map only if its data is already loaded

            if (this.restaurant) this.createMarkerAndAddToMap();
        });
    }

    fetchRestaurantFromURL(callback) {
        const id = Page.getUrlParameterByName('id');

        if (!id) { // no id found in URL
            callback('No restaurant id in URL', null);
            return;
        }

        this.restaurantHelper.fetchRestaurantById(+id, callback);
    }


    // Map markers

    createMarkerAndAddToMap() {
        const marker = RestaurantHelper.mapMarkerForRestaurant(this.restaurant, this.map.object);
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


            // Favorite checkbox and indicator

            this.favoritesHelper.createAndAppendCheckbox(imageContainer, this.restaurant);
        });

        const cuisine = this.refs.restaurantCuisine;
        cuisine.innerHTML = this.restaurant.cuisine_type;

        // fill operating hours
        if (this.restaurant.operating_hours) {
            this.fillRestaurantHoursHTML();
        }

        // fill reviews
        this.fillReviewsHTML();

        // init new review form
        this.initNewReviewForm();
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
        const noReviews = !this.restaurant.reviews || !this.restaurant.reviews.length;

        this.refs.reviewsContainer.classList.toggle('b-restaurant-reviews--empty', noReviews);

        if (!this.restaurant.reviews || !this.restaurant.reviews.length) {
            this.refs.reviewsContainer.classList.add('b-restaurant-reviews--empty');

            return;
        }

        this.restaurant.reviews.forEach(review => {
            this.refs.reviewsList.appendChild(this.createReviewHTML(review));
        });
    }

    createReviewHTML(review) {
        const reviewElement = document.createElement('li');
        reviewElement.classList.add('b-restaurant-reviews__item');
        reviewElement.dataset.reviewId = review.id;


        // Header

        const header = document.createElement('header');
        header.classList.add('b-restaurant-reviews__item-header');

        const name = document.createElement('p');
        name.classList.add('b-restaurant-reviews__item-reviewer');
        name.innerHTML = review.name;
        name.setAttribute('tabindex', 0);
        name.setAttribute('aria-label', `Review by ${review.name}`);
        header.appendChild(name);

        const updatedAt = new Date(review.updatedAt),
              months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
              formattedUpdatedAt = `${updatedAt.getDate()} ${months[updatedAt.getMonth()]}, ${updatedAt.getFullYear()}`;

        const date = document.createElement('p');
        date.classList.add('b-restaurant-reviews__item-date');
        date.innerHTML = formattedUpdatedAt;
        date.setAttribute('tabindex', 0);
        date.setAttribute('aria-label', `Review date ${formattedUpdatedAt}`);
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


        // Remove button

        const removeButton = document.createElement('button');
        removeButton.classList.add('b-restaurant-reviews__item-remove-button');
        removeButton.setAttribute('aria-label', `Remove review by ${review.name}`);

        removeButton.addEventListener('click', (event) => {
            const reviewId = +reviewElement.dataset.reviewId;

            // Remove review from page

            reviewElement.remove();


            // Show empty list message in case it was the last review that was removed

            if (!this.refs.reviewsList.querySelectorAll('.b-restaurant-reviews__item').length) {
                this.refs.reviewsContainer.classList.add('b-restaurant-reviews--empty');
            }


            this.reviewsHelper.removeReview(reviewId);
        });

        reviewElement.appendChild(removeButton);


        return reviewElement;
    }

    initNewReviewForm() {
        this.refs.newReviewForm.addEventListener('submit', event => {
            event.preventDefault();

            const formData = new FormData(this.refs.newReviewForm);

            const name = (formData.get('new-review-form__name') || '').trim(),
                  rating = +formData.get('new-review-form__rating'),
                  comment = (formData.get('new-review-form__comment') || '').trim();

            if (rating < 1 || rating > 5) return;
            if (!name || !comment) return;


            // Add review to the queue

            const time = new Date().getTime();
            const newReviewTemporaryId = this.reviewsHelper.addReview(+Page.getUrlParameterByName('id'), name, rating, comment, time);


            // Clear form

            this.refs.newReviewFormName.value = '';
            this.refs.newReviewFormComment.value = '';
            this.refs.newReviewFormFifthRatingInput.checked = true;


            // Add review to the page

            const newReviewHTML = this.createReviewHTML({
                id: newReviewTemporaryId,

                name: name,
                rating: rating,
                comments: comment,

                updatedAt: time
            });

            this.refs.reviewsList.appendChild(newReviewHTML);


            // Show list of reviews, since there will be at least one - newly added

            if (this.refs.reviewsList.querySelectorAll('.b-restaurant-reviews__item').length) {
                this.refs.reviewsContainer.classList.remove('b-restaurant-reviews--empty');
            }


            // Set focus after review addition

            const lastReviewReviewerName = this.refs.reviewsList.querySelector('.b-restaurant-reviews__item:last-child').querySelector('.b-restaurant-reviews__item-reviewer');
            lastReviewReviewerName.focus();
        });
    }
}

window.Page = new Page();
