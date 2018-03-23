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

    getSelected() {
        return this.value;
    }

    getDisplayElements(key: string): DisplayElement[] {
        let caption = capitalize(key);
        let isBoolValues = typeof (this.value) == 'boolean';
        let value = (typeof (this.value) == 'string') && this.value
            || isBoolValues && this.value && caption
            || this.value && this.value['getDate'] && (caption + ': ' +
            this.value.toLocaleDateString().split('/').map((part) => {
                return part.length >= 2 ? part: '0' + part;
            }).join('/'));

        return [<DisplayElement>{ item: this, displayValue: value }];
    }

    removeFilterItem(filter: FilterModel, args?: any) {
        if ((typeof (this.value) == 'string') || (this.value instanceof Date))
            this.value = '';
        else if (typeof (this.value) == 'boolean')
            this.value = false;
        else
            this.value = undefined;
    }
}

export class DisplayElement {
    item: FilterItemModel;
    displayValue: string;
    parentCode?: any;
    sortField?: any;
    readonly?: boolean;

    args?: any;
}
