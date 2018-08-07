class FavoritesHelper {
    constructor(dbHelper) {
        this.dbHelper = dbHelper;

        this.indexedDBPromise = dbHelper.indexedDBPromise;
    }


    /**
     * *****************************************
     * Static helpers
     * *****************************************
     */

    static createAndAppendCheckbox(containerElement, restaurant) {
        const isFavorite = false; // TODO: Get current favorite status for the restaurant

        const checkboxId = 'b-favorite-checkbox__toggle--' + restaurant.id;

        const favoriteCheckbox = document.createElement('div');
        favoriteCheckbox.className = 'b-favorite-checkbox';

        const favoriteCheckboxInput = document.createElement('input');
        const favoriteIndicator = document.createElement('label');


        favoriteCheckboxInput.id = checkboxId;
        favoriteCheckboxInput.type = 'checkbox';
        favoriteCheckboxInput.className = 'b-favorite-checkbox__toggle';

        favoriteCheckboxInput.checked = isFavorite;

        favoriteCheckboxInput.addEventListener('change', (event) => {
            const checked = event.target.checked;

            favoriteIndicator.textContent = checked ? 'Uncheck restaurant as favorite' : 'Mark as favorite';

            // TODO: Put the action into queue
        });

        favoriteCheckbox.appendChild(favoriteCheckboxInput);


        favoriteIndicator.htmlFor = checkboxId;
        favoriteIndicator.className = 'b-favorite-checkbox__indicator';
        favoriteIndicator.textContent = isFavorite ? 'Uncheck restaurant as favorite' : 'Mark as favorite';

        favoriteCheckbox.appendChild(favoriteIndicator);

        containerElement.appendChild(favoriteCheckbox);
    }


    /**
     * *****************************************
     * Dynamic methods
     * *****************************************
     */

    // TODO: work with dbHelper
}

export default FavoritesHelper;