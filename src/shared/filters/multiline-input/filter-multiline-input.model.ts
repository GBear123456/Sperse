import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import uniq from 'lodash/uniq';
import remove from 'lodash/remove';
import capitalize from 'underscore.string/capitalize';

export class FilterMultilineInputModel extends FilterItemModel {
    public name: string;
    public normalize: (value: string) => string;
    private _valuesArray: string[];
    tip: string = '';

    public constructor(init?: Partial<FilterMultilineInputModel>) {
        super(init, true);

        this.tip = this.ls.l('BatchFilterTip', this.ls.l(capitalize(this.name + 's')).toLocaleLowerCase());
    }

    get valuesArray(): string[] {
        return this._valuesArray;
    }

    get value(): any {
        return this._value;
    }

    set value(value: any) {
        let values: string[] = [];
        if (value && typeof value === 'string') {
            let valuesSplitByEnter = value.split('\n');
            for (let i = 0; i < valuesSplitByEnter.length; i++) {
                let valuesSplitByComma = valuesSplitByEnter[i].split(',');
                values = values.concat(valuesSplitByComma);
            }
            for (let i = values.length - 1; i >= 0; i--) {
                values[i] = values[i].trim();
                if (!values[i])
                    values.splice(i, 1);
            }
            values = uniq(values);
        } else if (Array.isArray(value)) {
            values = value;
        }

        value = values.join('\n');
        this._valuesArray = values;
        this._value = value;
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        if (this._valuesArray) {
            this._valuesArray.forEach(v =>
                result.push(<DisplayElement>{
                    item: this,
                    displayValue: v,
                    args: v
                })
            );
        }
        return result;
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args) {
            remove(this._valuesArray, (val: any) => val == args);
            this.value = this._valuesArray;
        }
        else
            this.value = "";
    }
}