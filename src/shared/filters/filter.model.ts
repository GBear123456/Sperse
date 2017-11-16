import { Type } from '@angular/core';
import * as _ from 'underscore';
import capitalize from 'underscore.string/capitalize';
import * as moment from 'moment';

export interface FilterComponent {
    items?: { [item: string]: FilterItemModel; };
    apply: (event) => void;
    localizationSourceName: string;
}

export class FilterModelBase<T extends FilterItemModel> {
    component: Type<FilterComponent>;
    operator: any;
    caption: string;
    field?: any;
    items?: { [item: string]: T; };
    displayElements?: any[];

    public constructor(init?: Partial<FilterModelBase<T>>) {
        Object.assign(this, init);
    }

    updateCaptions() {
        let displayElements = [];

        _.each(_.values(_.mapObject(
            this.items, (item: FilterItemModel, key: string) => item.getDisplayElements(key)
        )), x => { displayElements = displayElements.concat(x); });
        this.displayElements = displayElements;
    }
}

export class FilterModel extends FilterModelBase<FilterItemModel>
{
}

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

    args?: any;
}
