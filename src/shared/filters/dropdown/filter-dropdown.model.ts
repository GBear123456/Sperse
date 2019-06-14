import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';

export class FilterDropDownModel extends FilterItemModel {
    displayElementExp: any;
    valueElementExp: string;
    elements: any;
    filterField: any;
    onElementSelect: (event, element) => void;
    clearSelectedElement: (filter) => void;

    public constructor(init?: Partial<FilterDropDownModel>) {
        super();
        Object.assign(this, init);
    }

    setValue(value: any, filter: FilterModel) {
        let element = this.elements.find(x => x.id == value);
        if (element && this.onElementSelect)
            this.onElementSelect(element, filter);
        else
            super.setValue(value, filter);
    }

    getDisplayElements(): DisplayElement[] {
        let value = this.value
            && (
                typeof this.value === 'object'
                ? this.value[this.displayElementExp] || this.displayElementExp(this.value)
                : this.valueElementExp ? this.elements.find(element => element[this.valueElementExp] === this.value)[this.displayElementExp] : this.value
            );
        return [<DisplayElement>{ item: this, displayValue: value }];
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (this.clearSelectedElement)
            this.clearSelectedElement(filter);
        else
            super.removeFilterItem(filter, args);
    }
}
