import DBHelper from './dbhelper';
import ReviewsHelper from './reviews-helper';
import ActionsQueue from './actions-queue';

class ReviewsQueue extends ActionsQueue {
    processNextAction() {
        this.indexedDBPromise.then((db) => {
            if (!db) {
                this.errorCallback('Process review action error: DB promise failed');

                return;
            }

            const reviewsActionsTx = db.transaction('reviews_actions', 'readwrite');
            const reviewsActionsStore = reviewsActionsTx.objectStore('reviews_actions');

            reviewsActionsStore.getAll().then(actions => {
                if (!actions || !actions.length) {
                    this.active = false; // Stop queue
                    return;
                }

                const nextAction = actions[0];

                if (nextAction.reviewStatus === 'to_be_added') {

                    fetch(DBHelper.DATABASE_URL + `reviews/`, {
                        method: 'POST',
                        body: JSON.stringify({
                            restaurant_id: nextAction.restaurant_id,

                            name: nextAction.name,
                            rating: nextAction.rating,
                            comments: nextAction.comments
                        })
                    }).then(response => {
                        return response.json();
                    }).then(review => {
                        ReviewsHelper.normalizeReviewsResponseData([review]);

                        const reviewsActionsTx = db.transaction('reviews_actions', 'readwrite');
                        const reviewsActionsStore = reviewsActionsTx.objectStore('reviews_actions');

                        const temporaryId = nextAction.id;

                        reviewsActionsStore.get(temporaryId).then(action => {
                            if (action.reviewStatus === 'to_be_deleted') {
                                // Review was deleted during ADDITION request

                                reviewsActionsStore.delete(temporaryId).then(() => {
                                    reviewsActionsStore.put({
                                        id: review.id,

                                        reviewStatus: 'to_be_deleted'
                                    }).then(() => {
                                        this.processNextAction();
                                    }).catch(error => {
                                        error.message = `Failed update of to_be_deleted action after review addition: ${error.message}`;

                                        this.errorCallback(error);
                                    });
                                }).catch(error => {
                                    error.message = `Failed update of to_be_deleted action after review addition: ${error.message}`;

                                    this.errorCallback(error);
                                });

                                return;
                            }


                            // Action successful — remove from queue, update all db data and page html

                            reviewsActionsStore.delete(temporaryId).then(() => {
                                // Add review to DB

                                const reviewsTransaction = db.transaction('reviews', 'readwrite');
                                const reviewsStore = reviewsTransaction.objectStore('reviews');

                                reviewsStore.put(review).then(() => {
                                    // Update review id on page

                                    const onPageReviewElement = document.querySelector(`.b-restaurant-reviews__item[data-review-id="${temporaryId}"]`);
                                    onPageReviewElement.dataset.reviewId = review.id;

                                    this.processNextAction();
                                }).catch(error => {
                                    error.message = `Failed to add review to db after successful sync with server: ${error.message}`;

                                    this.errorCallback(error);
                                });
                            }).catch(error => {
                                error.message = `Review addition action sync delete from DB failed: ${error.message}`;

                                this.errorCallback(error);
                            });
                        });


                    }).catch(error => {
                        error.message = `Favorite action sync request failed: ${error.message}`;

                        this.errorCallback(error);
                    });

                    return;
                }


                if (nextAction.reviewStatus === 'to_be_deleted') {
                    fetch(DBHelper.DATABASE_URL + `reviews/${nextAction.id}`, {
                        method: 'DELETE'
                    }).then(response => {
                        if (response.status === 404) {
                            return {};
                        }

                        return response.json();
                    }).then(data => {
                        // Remove review from DB

                        const reviewsActionsTx = db.transaction('reviews_actions', 'readwrite');
                        const reviewsActionsStore = reviewsActionsTx.objectStore('reviews_actions');

                        reviewsActionsStore.delete(nextAction.id).then(() => {
                            const reviewsTransaction = db.transaction('reviews', 'readwrite');
                            const reviewsStore = reviewsTransaction.objectStore('reviews');

                            reviewsStore.delete(nextAction.id).then(() => {
                                // Update review id on page

                                this.processNextAction();
                            }).catch(error => {
                                error.message = `Failed to remove review item from db: ${error.message}`;

                                this.errorCallback(error);
                            });

                            this.processNextAction();
                        }).catch(error => {
                            error.message = `Failed to clear to_be_deleted action from db after successful removal from server: ${error.message}`;

                            this.errorCallback(error);
                        });
                    }).catch(error => {
                        error.message = `Failed to remove review from server: ${error.message}`;

                        this.errorCallback(error);
                    });

                    return;
                }
            }).catch((error) => {
                this.errorCallback(error);
            });
        });
    }
}

export default ReviewsQueue;
