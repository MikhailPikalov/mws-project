import ReviewsQueue from './reviews-queue';
import DBHelper from "./dbhelper";

class ReviewsHelper {
    constructor(dbHelper) {
        this.indexedDBPromise = dbHelper.indexedDBPromise;

        this.queue = new ReviewsQueue(dbHelper);
    }

    static normalizeReviewsResponseData(reviews) {
        reviews.forEach(review => {
            review.id = +review.id;
        });
    }


    /**
     * Fetch reviews for a restaurant
     */
    fetchRestaurantReviews(restaurant, callback) {
        fetch(DBHelper.DATABASE_URL + `reviews/?restaurant_id=${restaurant.id}`)
            .then(response => response.json())
            .then(reviews => {
                reviews = reviews || [];

                ReviewsHelper.normalizeReviewsResponseData(reviews);

                this.updateReviewsStatusFromReviewsDBQueue(restaurant, reviews, () => {
                    reviews = reviews.filter(review => review.status !== 'to_be_deleted');


                    // Cache reviews to IndexedDB

                    this.indexedDBPromise.then(function (db) {
                        if (!db) return;

                        const tx = db.transaction('reviews', 'readwrite');
                        const store = tx.objectStore('reviews');


                        // Add/rewrite already existing (confirmed by receiving them directly from server) review

                        reviews.filter(review => review.status === 'already_existing').forEach(review => {
                            store.put(review);
                        });
                    });


                    // Return reviews

                    callback(null, reviews);
                });
            })
            .catch(error => {
                const errorMessage = `Restaurant's reviews request failed: ${error.message}`;

                this.indexedDBPromise.then(db => {
                    if (!db) {
                        callback(errorMessage, null);

                        return;
                    }

                    const tx = db.transaction('reviews', 'readonly');
                    const store = tx.objectStore('reviews');
                    const byRestaurantIndex = store.index('by_restaurant');

                    byRestaurantIndex.getAll(restaurant.id).then(reviews => {
                        this.updateReviewsStatusFromReviewsDBQueue(restaurant, reviews, () => {
                            reviews = reviews.filter(review => review.status !== 'to_be_deleted');

                            callback(null, reviews);
                        });
                    });
                });
            });
    }

    updateReviewsStatusFromReviewsDBQueue(restaurant, reviews, callback) {
        let onDone = () => {
            this.indexedDBPromise.then(function (db) {
                if (!db) {
                    callback();

                    return;
                }

                const tx = db.transaction('reviews_actions', 'readonly');
                const store = tx.objectStore('reviews_actions');
                const byStatusIndex = store.index('by_status');

                byStatusIndex.getAll('to_be_added').then(toBeAddedReviews => {
                    toBeAddedReviews.sort((a, b) => {
                        return a.updatedAt > b.updatedAt ? 1 : -1;
                    });

                    reviews.push(...toBeAddedReviews);

                    callback();
                });
            });
        };

        if (!reviews.length) {
            onDone();

            return;
        }

        let restaurantsDone = 0;

        reviews.forEach((review) => {
            this.actualizeReviewStatusFromDBQueue(review, (status) => {
                review.status = status;

                restaurantsDone++;

                if (restaurantsDone === reviews.length) onDone();
            });
        });
    }

    actualizeReviewStatusFromDBQueue(review, callback) {
        // Get favorite status for restaurant from db

        this.indexedDBPromise.then(function (db) {
            if (!db) {
                callback('already_existing');
                return;
            }

            const reviewsActionsTx = db.transaction('reviews_actions', 'readwrite');
            const reviewsActionsStore = reviewsActionsTx.objectStore('reviews_actions');

            reviewsActionsStore.get(review.id).then(data => {
                if (!data) {
                    callback('already_existing');
                    return;
                }


                // Check if queue status is outdated and need to be cleared

                const queueReviewStatus = data.reviewStatus; // Can only be 'to_be_deleted' here


                // Queue status is more up-to-date

                callback(queueReviewStatus);
            });
        });
    }

    addReview(restaurantId, name, rating, comment, time) {
        const newReviewTemporaryId = Math.round(Math.random() * 1000000);

        const errorCallback = (errorMessage) => {
            console.log(errorMessage);
        };

        this.indexedDBPromise.then((db) => {
            if (!db) {
                errorCallback('Adding new review error: DB promise failed');

                return;
            }

            const reviewsActionsTx = db.transaction('reviews_actions', 'readwrite');
            const reviewsActionsStore = reviewsActionsTx.objectStore('reviews_actions');


            reviewsActionsStore.put({
                restaurant_id: restaurantId,

                id: newReviewTemporaryId,

                name: name,
                rating: rating,
                comments: comment,

                updatedAt: time,

                reviewStatus: 'to_be_added'
            });

            this.queue.start();
        });

        return newReviewTemporaryId;
    }

    removeReview(reviewId) {
        const errorCallback = (errorMessage) => {
            console.log(errorMessage);
        };

        this.indexedDBPromise.then((db) => {
            if (!db) {
                errorCallback('Remove review status error: DB promise failed');

                return;
            }


            const reviewsActionsTx = db.transaction('reviews_actions', 'readwrite');
            const reviewsActionsStore = reviewsActionsTx.objectStore('reviews_actions');


            // Might rewrite currently processing request for 'to_be_added' action for te same review
            // Must be considered in the to_be_added action callback

            reviewsActionsStore.put({
                id: reviewId,

                reviewStatus: 'to_be_deleted'
            });

            this.queue.start();
        });
    }
}

export default ReviewsHelper;
