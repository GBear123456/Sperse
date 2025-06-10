import * as _ from 'underscore';

export class ArrayHelper {

    /**
     * Compare two arrays for differences
     * @param dataA
     * @param dataB
     * @return {boolean}
     */
    static dataChanged(dataA, dataB): boolean {
        /** If arrays elements are objects - then convert them to strings and compare */
        if ((dataA && dataA[0] instanceof Object) || (dataB && dataB[0] instanceof Object)) {
            dataA = JSON.stringify(dataA);
            dataB = JSON.stringify(dataB);
            return dataA !== dataB;
        }
        /** Else - compare with underscore difference method */
        return !!(_.difference(dataA, dataB).length || _.difference(dataB, dataA).length);
    }
}

