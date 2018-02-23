let restaurant;


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
            return;
        }

        window.MAP_OBJECT = new google.maps.Map(document.getElementById('map'), {
            zoom: 16,
            center: restaurant.latlng,
            scrollwheel: false
        });

        fillBreadcrumb();

        DBHelper.mapMarkerForRestaurant(self.restaurant, window.MAP_OBJECT);
    });
};


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }

    const id = getUrlParameterByName('id');

    if (!id) { // no id found in URL
        callback('No restaurant id in URL', null);
        return;
    }

    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
        self.restaurant = restaurant;

        if (!restaurant) {
            console.error(error);
            return;
        }

        fillRestaurantHTML();

        callback(null, restaurant)
    });
};


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }

    // fill reviews
    fillReviewsHTML();
};


/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hoursElement = document.getElementById('restaurant-hours');
    
    for (let weekDay in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = weekDay;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[weekDay];
        row.appendChild(time);

        hoursElement.appendChild(row);
    }
};


/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const reviewsContainerElement = document.getElementById('reviews-container');
    const titleElement = document.createElement('h2');
    
    titleElement.innerHTML = 'Reviews';
    reviewsContainerElement.appendChild(titleElement);

    if (!reviews) {
        const noReviewsMessageElemenent = document.createElement('p');
        
        noReviewsMessageElemenent.innerHTML = 'No reviews yet!';
        reviewsContainerElement.appendChild(noReviewsMessageElemenent);
        
        return;
    }
    
    const reviewsListElement = document.getElementById('reviews-list');
    
    reviews.forEach(review => {
        reviewsListElement.appendChild(createReviewHTML(review));
    });
    
    reviewsContainerElement.appendChild(reviewsListElement);
};


/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
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
};


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    
    breadcrumb.appendChild(li);
};


/**
 * Get a parameter by name from page URL.
 */
getUrlParameterByName = (name, url) => {
    url = url || window.location.href;

    name = name.replace(/[\[\]]/g, '\\$&');

    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);

    if (!results)return null;
    if (!results[2]) return '';

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};