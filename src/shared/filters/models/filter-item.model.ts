import { FilterModel } from './filter.model';
import * as moment from 'moment';

let capitalize = require('underscore.string/capitalize');

export class FilterItemModel {
    value: any = '';

    public constructor(value?: any) {
        if (value) this.value = value;
    }

    setValue(value: any, filter: FilterModel) {
        this.value = value;
    }

    getDisplayElements(key: string): DisplayElement[] {
        let caption = capitalize(key);
        let isBoolValues = typeof (this.value) == 'boolean';
        var value = (typeof (this.value) == 'string') && this.value
            || isBoolValues && this.value && caption
            || this.value && this.value['getDate'] && (caption + ': ' +
                moment(this.value, 'YYYY-MM-DD').format('l'));
        return [<DisplayElement>{ item: this, displayValue: value }];
    }

    removeFilterItem(filter: FilterModel, args?: any) {
        if ((typeof (this.value) == 'string') || (this.value instanceof Date))
            this.value = '';
        else if (typeof (this.value) == 'boolean')
            this.value = false;
        else
            this.value = null;
    }
}

export class DisplayElement {
    item: FilterItemModel;
    displayValue: string;
    
    parent?: any;
    readonly?: boolean;

    args?: any;
}
