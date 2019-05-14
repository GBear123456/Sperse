import { Type } from '@angular/core';
import { FilterItemModel, DisplayElement } from './filter-item.model';
import { FilterComponent } from './filter-component';
import { Observable } from 'rxjs';
import * as _ from 'underscore';
import capitalize from 'underscore.string/capitalize';
import { DateHelper } from '@shared/helpers/DateHelper';

export class FilterModelBase<T extends FilterItemModel> {
    component: Type<FilterComponent>;
    operator: any;
    caption: string;
    field?: any;
    items?: { [item: string]: T; };
    items$?: Observable<{ [item: string]: T; }>;
    displayElements?: any[];
    options?: any;
    hidden?: boolean;
    isSelected = false;

    public constructor(init?: Partial<FilterModelBase<T>>) {
        Object.assign(this, init);
        if (this.items$ && this.items$ instanceof Observable) {
            this.items$.subscribe(items => {
                this.items = items;
            });
        }
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
    public static _wordRegex = /\b(\w|'|@|.|_)+\b/gim;
    public static _removeFromEnd = ['at', 'on', 'and'];
    public static _remove = ['and', 'or', 'no', 'if', 'from', 'to', 'etc', 'for', 'like at'];
    public getODataFilterObject() {
        if (this.options && this.options.method)
            return this[this.options.method].call(this, this.options.params);
        else
            return _.pairs(this.items)
                .reduce((obj, pair) => {
                    let val = pair.pop().value, key = pair.pop(), operator = {};
                    if (val && this.operator === 'contains')
                        return this.processContainsOperator(val, key);
                    if (this.operator)
                        operator[this.operator] = val;
                    if (val && (['string', 'number'].indexOf(typeof (val)) >= 0)) {
                        obj[capitalize(key)] = this.operator ? operator : val;
                    }
                    return obj;
                }, {});
    }

    public static getSearchKeyWords(value: string) {
        let words = value.match(this._wordRegex);
        let noisyWords = _.union(this._removeFromEnd, this._remove);
        let keywords = _.difference(words, noisyWords);
        return keywords;
    }

    private processContainsOperator(val: string, key: string) {
        let values = FilterModel.getSearchKeyWords(val);

        let colFilterData: any[] = [];

        values.forEach((val) => {
            let el = {};
            el[key] = {
                contains: val
            };
            colFilterData.push(el);
        });

        let obj = {
            and: colFilterData
        };
        return obj;
    }

    private getFilterByDate(params?) {
        let data = {};
        data[this.field] = {};
        _.each(this.items, (item: FilterItemModel, key) => {
            if (item && item.value) {
                let clone = new Date(item.value.getTime());
                DateHelper.removeTimezoneOffset(clone, true, key);
                data[this.field][this.operator[key]] = clone;
            }
        });
        return data;
    }
}
