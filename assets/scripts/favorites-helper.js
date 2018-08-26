import FavoritesQueue from './favorites-queue';

class FavoritesHelper {
    constructor(dbHelper) {
        this.indexedDBPromise = dbHelper.indexedDBPromise;

        this.queue = new FavoritesQueue(dbHelper);
    }

    createAndAppendCheckbox(containerElement, restaurant) {
        const favoriteCheckbox = document.createElement('div');
        favoriteCheckbox.className = 'b-favorite-checkbox';


        const checkboxId = 'b-favorite-checkbox__toggle--' + restaurant.id;


        // Favorite checkbox input

        const favoriteCheckboxInput = document.createElement('input');

        favoriteCheckboxInput.id = checkboxId;
        favoriteCheckboxInput.type = 'checkbox';
        favoriteCheckboxInput.className = 'b-favorite-checkbox__toggle';

        favoriteCheckboxInput.checked = restaurant.is_favorite;

        favoriteCheckboxInput.addEventListener('change', (event) => {
            const checked = event.target.checked;

            updateActionText(checked);

            this.applyRestaurantStatus(restaurant, checked);
        });

        favoriteCheckbox.appendChild(favoriteCheckboxInput);


        // Favorite indicator

        const favoriteIndicator = document.createElement('label');

        function updateActionText(isFavorite) {
            const actionText = isFavorite ? 'Uncheck restaurant as favorite' : 'Mark as favorite';

            favoriteIndicator.title = actionText;
            favoriteIndicator.textContent = actionText;
        }

        favoriteIndicator.htmlFor = checkboxId;
        favoriteIndicator.className = 'b-favorite-checkbox__indicator';

        updateActionText(restaurant.is_favorite);

        favoriteCheckbox.appendChild(favoriteIndicator);

        containerElement.appendChild(favoriteCheckbox);
    }

    applyRestaurantStatus(restaurant, newStatus) {
        const errorCallback = (errorMessage) => {
            console.log(errorMessage);
        };

        this.indexedDBPromise.then((db) => {
            if (!db) {
                errorCallback('Apply restaurant status error: DB promise failed');

                return;
            }


            // Get current restaurant favorite status from queue
            // Then update element in queue if it is not the same

            const favoritesActionsTx = db.transaction('favorites_actions', 'readwrite');
            const favoritesActionsStore = favoritesActionsTx.objectStore('favorites_actions');

            favoritesActionsStore.get(restaurant.id).then(data => {
                if (data) {
                    const currentFavoriteStatus = data.favoriteStatus;
                    if (newStatus === currentFavoriteStatus) return;
                }

                favoritesActionsStore.put({
                    restaurant_id: restaurant.id,

                    favoriteStatus: newStatus
                });

                this.queue.start();
            });


            // Update restaurant's status in the restaurant itself

            const restaurantsTx = db.transaction('restaurants', 'readwrite');
            const restaurantsStore = restaurantsTx.objectStore('restaurants');

            restaurantsStore.get(restaurant.id).then(restaurant => {
                restaurant.is_favorite = newStatus;

                restaurantsStore.put(restaurant);
            });
        });
    }
}

export default FavoritesHelper;
