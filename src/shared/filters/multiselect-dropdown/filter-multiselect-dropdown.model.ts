import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { FilterMultiselectDropDownComponent } from './filter-multiselect-dropdown.component'
import * as _ from 'lodash';

export class FilterMultiselectDropDownModel extends FilterItemModel {
    displayName?: string;
    displayElementExp: any;
    dataSource: any;
    columns: any[];
    filterField: any;

    public constructor(init?: Partial<FilterMultiselectDropDownModel>) {
        super();
        Object.assign(this, init);
    }

    getDisplayElements(key: string): DisplayElement[] {
        return this.value && this.value.length && this.value.map(x => {
            return <DisplayElement>{ item: this, displayValue: x[this.displayElementExp] || this.displayElementExp(x), args: x.id };
        });
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            _.remove(this.value, (val: any, i, arr) => val.id == args);
        else
            this.value = [];
    }
}
