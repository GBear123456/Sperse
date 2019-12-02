import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import remove from 'lodash/remove';

export class FilterMultiselectDropDownModel extends FilterItemModel {
    displayName?: string;
    displayElementExp: any;
    columns: any[];

    public constructor(init?: Partial<FilterMultiselectDropDownModel>) {
        super(init, true);
    }

    getDisplayElements(key: string): DisplayElement[] {
        return this.value && this.value.length && this.value.map(x => {
            return <DisplayElement>{ item: this, displayValue: x[this.displayElementExp] || this.displayElementExp(x), args: x.id };
        });
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            remove(this.value, (val: any) => val.id == args);
        else
            this.value = [];
    }
}
