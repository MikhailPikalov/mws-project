class FavoritesHelper {
    constructor(dbHelper) {
        this.dbHelper = dbHelper;

        this.indexedDBPromise = dbHelper.indexedDBPromise;
    }

    // TODO:
}

export default FavoritesHelper;