import { Type } from '@angular/core';
import { FilterItemModel, DisplayElement } from './filter-item.model';
import { FilterComponent } from './filter-component';

import * as _ from 'underscore';

let capitalize = require('underscore.string/capitalize');

export class FilterModelBase<T extends FilterItemModel> {
    component: Type<FilterComponent>;
    operator: any;
    caption: string;
    field?: any;
    items?: { [item: string]: T; };
    displayElements?: any[];
    options?: any;

    public constructor(init?: Partial<FilterModelBase<T>>) {
        Object.assign(this, init);
    }

    updateCaptions() {
        let displayElements: DisplayElement[] = [];

        _.each(_.values(_.mapObject(
            this.items, (item: FilterItemModel, key: string) => item.getDisplayElements(key)
        )), x => { displayElements = displayElements.concat(x); });
        this.displayElements = displayElements.filter((val, i, arr) =>  val && val.displayValue);
    }

    clearFilterItems() {
        _.each(this.items, i => i.removeFilterItem(this));
    }
}

export class FilterModel extends FilterModelBase<FilterItemModel> { 
    public getODataFilterObject() {
        if (this.options && this.options.method)
            return this[this.options.method].call(this);
        else
            return _.pairs(this.items)
                .reduce((obj, pair) => {
                    let val = pair.pop().value, key = pair.pop(), operator = {};
                    if (this.operator)
                        operator[this.operator] = val;
                    if (val && (['string', 'number'].indexOf(typeof (val)) >= 0)) {
                        obj[capitalize(key)] = this.operator ? operator : val;
                    }
                    return obj;
                }, {});
    }

    private getFilterByDate() {
        let data = {};
        data[this.field] = {};
        _.each(this.items, (item: FilterItemModel, key) => {
            if (item && item.value) {
                Date.prototype.setHours.apply(item.value, 
                    key == 'to' ? [23,59,59,999]: [0,0,0,0]);

                let clone = new Date(item.value.getTime());
                clone.setTime(clone.getTime() - 
                    clone.getTimezoneOffset() * 60 * 1000);

                data[this.field][this.operator[key]] = clone; 
            }
        });
        return data;
    }
}
