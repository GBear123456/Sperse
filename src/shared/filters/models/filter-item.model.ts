import { FilterModel } from './filter.model';
import * as _ from 'underscore.string';

export class FilterItemModel {
    protected _value: any = '';

    public constructor(value?: any) {
        if (value) this.value = value;
    }

    get value(): any {
        return this._value;
    }
    set value(value: any) {
        this._value = value;
    }

    setValue(value: any, filter: FilterModel) {
        this.value = value;
    }

    getDisplayElements(key: string): DisplayElement[] {
        let caption = _.capitalize(key);
        let valueType = typeof (this.value);
        let isBoolValues = valueType == 'boolean';
        let value = valueType == 'string' && this.value
            || valueType == 'number' && (caption ? `${caption}: ${this.value}` : this.value)
            || isBoolValues && this.value && caption
            || this.value && this.value['getDate'] && (caption + ': ' +
            this.value.toLocaleDateString().split('/').map((part) => {
                return part.length >= 2 ? part : '0' + part;
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
