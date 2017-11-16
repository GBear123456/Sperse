import { FilterModel, FilterItemModel, DisplayElement } from '../filter.model';
import { FilterDropDownComponent } from './filter-dropdown.component'

export class FilterDropDownModel extends FilterItemModel {
    displayName: string = "test";
    displayElementExp: any;
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
        let value = this.value && (this.value[this.displayElementExp] || this.displayElementExp(this.value));
        return [<DisplayElement>{ item: this, displayValue: value }];
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (this.clearSelectedElement)
            this.clearSelectedElement(filter);
        else
            super.removeFilterItem(filter, args);
    }
}
