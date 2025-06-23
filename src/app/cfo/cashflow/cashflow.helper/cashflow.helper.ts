import * as moment from 'moment';


export class CashflowHelper {

    momentFormats = {
        'year':     'Y',
        'quarter':  'Q',
        'month':    'M',
        'week':     'w',
        'day':      'D'
    };

    /** Format moment js object to the lowest interval */
    public formatToLowest(date, lowestPeriod): string {
        let formatAbbr = '';
        for (let format in this.momentFormats) {
            formatAbbr += `${this.momentFormats[format]}.`;
            if (format === lowestPeriod) {
                break;
            }
        }
        return date.format(formatAbbr);
    }

    public getLowestIntervalFromPath(path, columnFields) {
        let lastOpenedColumnIndex = path.length - 1;
        let lastOpenedField = columnFields[lastOpenedColumnIndex];
        while (lastOpenedField && lastOpenedField.dataField !== 'date') {
            lastOpenedField = columnFields[--lastOpenedColumnIndex];
        }
        return lastOpenedField ? lastOpenedField.groupInterval : null;
    }

    /**
     * Return the date object of type {year: 2015, month: 12, day: 24} for the path using column fields
     * @param path
     * @param columnFields
     * @return {any}
     */
    public getDateByPath(path, columnFields, lowestInterval) {
        lowestInterval = lowestInterval || this.getLowestIntervalFromPath(path, columnFields);
        let date = moment.unix(0);
        let dateFields = [];
        columnFields.every(field => {
            if (field.dataType === 'date') {
                dateFields.push(field);
            }
            if (field.groupInterval === lowestInterval) {
                return false;
            }
            return true;
        });

        dateFields.forEach(dateField => {
            let method = dateField.groupInterval === 'day' ? 'date' : dateField.groupInterval,
                fieldValue = path[columnFields.filter(field => field.groupInterval === dateField.groupInterval)[0].areaIndex];
            fieldValue = dateField.groupInterval === 'month' ? fieldValue - 1 : fieldValue;
            /** set the new interval to the moment */
            date[method](fieldValue);
        });
        return date;
    }

}
