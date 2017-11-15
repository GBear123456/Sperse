import { FilterItemModel } from '../filter.model';
import { FilterDropDownComponent } from './filter-dropdown.component'


export class FilterDropDownModel extends FilterItemModel {
    displayName: string = "test";
    displayElementExp: any;
    elements: any;
    selectedElement: any;
    filterField: any;

    onElementSelect: (event, element) => void;
    clearSelectedElement: (filter) => void;

    public constructor(init?: Partial<FilterDropDownModel>) {
        super();
        Object.assign(this, init);
    }

    setValue(value: any, filter: FilterDropDownComponent) {
        let element = this.elements.find(x => x.id == value);
        if (element)
            this.onElementSelect(element, filter);
    }
}
