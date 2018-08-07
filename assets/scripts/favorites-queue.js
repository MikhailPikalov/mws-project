import DBHelper from './dbhelper';
import RestaurantHelper from './restaurant-helper';
import ActionsQueue from './actions-queue';

class FavoritesQueue extends ActionsQueue {
    processNextAction() {
        const errorCallback = (error) => {
            console.log(error.message || error);

            setTimeout(() => {
                if (navigator.onLine) {
                    this.processNextAction();
                    return;
                }

                const onOnline = () => {
                    window.removeEventListener('online', onOnline);
                    this.processNextAction();
                };

                window.addEventListener('online', onOnline);
            }, 5000);
        };

        this.indexedDBPromise.then((db) => {
            if (!db) {
                this.errorCallback('Process favorite action error: DB promise failed');

                return;
            }

            const favoritesActionsTx = db.transaction('favorites_actions', 'readwrite');
            const favoritesActionsStore = favoritesActionsTx.objectStore('favorites_actions');

            favoritesActionsStore.getAll().then(actions => {
                if (!actions || !actions.length) {
                    this.active = false; // Stop queue
                    return;
                }

                const nextAction = actions[0];

                fetch(DBHelper.DATABASE_URL + `restaurants/${nextAction.restaurant_id}/?is_favorite=${nextAction.favoriteStatus ? 'true' : 'false'}`, {
                    method: 'PUT'
                }).then(response => {
                    return response.json();
                }).then(restaurant => {
                    RestaurantHelper.normalizeRestaurantResponseData(restaurant);

                    const favoritesActionsTx = db.transaction('favorites_actions', 'readwrite');
                    const favoritesActionsStore = favoritesActionsTx.objectStore('favorites_actions');

                    favoritesActionsStore.get(nextAction.restaurant_id).then(action => {
                        if (nextAction.favoriteStatus !== action.favoriteStatus) {
                            this.processNextAction();
                            return;
                        }

                        if (nextAction.favoriteStatus !== restaurant.is_favorite) {
                            this.processNextAction();
                            return;
                        }


                        // Action successful — remove from queue

                        favoritesActionsStore.delete(nextAction.restaurant_id).then(() => {
                            this.processNextAction();
                        }).catch(error => {
                            error.message = `Favorite action sync delete from DB failed: ${error.message}`;

                            this.errorCallback(error);
                        });
                    });
                }).catch(error => {
                    error.message = `Favorite action sync request failed: ${error.message}`;

                    this.errorCallback(error);
                });
            }).catch((error) => {
                this.errorCallback(error);
            });
        });
    }
}

export default FavoritesQueue;
