class ActionsQueue {
    constructor(dbHelper) {
        this.indexedDBPromise = dbHelper.indexedDBPromise;

        this.active = false;
    }

    start() {
        if (this.active) return;

        this.active = true;

        this.processNextAction();
    }

    /**
     * Must be called when action is not successful
     */
    errorCallback(error) {
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
    }

    /**
     * Must be overridden in implementations
     */
    processNextAction() {
        this.active = false;
    }
}

export default ActionsQueue;
