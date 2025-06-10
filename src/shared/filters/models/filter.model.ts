/** Third party imports */
import * as _ from 'underscore';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { FilterItemModel } from './filter-item.model';
import { DateHelper } from '@shared/helpers/DateHelper';
import { FilterModelBase } from '@shared/filters/models/filter-model-base';

export class FilterModel extends FilterModelBase<FilterItemModel> {
    public static _wordRegex = /\b(\w|'|@|.|_)+\b/gim;
    public static _removeFromEnd = ['at', 'on', 'and'];
    public static _remove = ['and', 'or', 'no', 'if', 'from', 'to', 'etc', 'for', 'like at'];

    public static getSearchKeyWords(value: string) {
        let words = value.match(this._wordRegex);
        let noisyWords = _.union(this._removeFromEnd, this._remove);
        let keywords = _.difference(words, noisyWords);
        return keywords;
    }

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
                        operator[this.operator as string] = val;
                    if (val && (['string', 'number'].indexOf(typeof (val)) >= 0)) {
                        obj[capitalize(key)] = this.operator ? operator : val;
                    }
                    return obj;
                }, {});
    }

    private processContainsOperator(val: string, key: string) {
        let values = FilterModel.getSearchKeyWords(val);

        let colFilterData: any[] = [];

        values.forEach((val: string) => {
            let el = {};
            el[key] = {
                contains: val
            };
            colFilterData.push(el);
        });
        return {
            and: colFilterData
        };
    }

    private getFilterByDate(params?) {
        let data = {};
        data[this.field] = {};
        _.each(this.items, (item: FilterItemModel, key: string) => {
            if (item && item.value) {
                let clone = new Date(item.value.getTime());
                DateHelper.removeTimezoneOffset(clone, params && params.useUserTimezone, key);
                data[this.field][this.operator[key]] = clone;
            }
        });
        return data;
    }

    private filterByFilterElement() {
        let data = {}, 
            value = this.items.element && this.items.element.value;
        if (value != undefined && value != null) {
            let filterData = _.map(value, x => {
                let el = {};
                el[this.field] = x;
                return el;
            });

            data = {
                or: filterData
            };
        }
        return data;
    }
}
