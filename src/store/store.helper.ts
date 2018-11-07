export class StoreHelper {

    /**
     * Return whether we need to load data from api for store - check if data was loaded and if data is not too old (depend of lifeTime)
     * @param {number} loadedTime
     * @param {any} expirationTime
     * @return {boolean}
     */
    static dataLoadingIsNotNeeded(loadedTime: number, lifeTime = null): boolean {
        return loadedTime && (!lifeTime || (new Date().getTime() - loadedTime) < lifeTime);
    }

}
