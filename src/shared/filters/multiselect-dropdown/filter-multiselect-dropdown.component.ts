import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import { FilterMultiselectDropDownModel } from './filter-multiselect-dropdown.model';

@Component({
    templateUrl: './filter-multiselect-dropdown.component.html',
    styleUrls: ['./filter-multiselect-dropdown.component.less']
})
export class FilterMultiselectDropDownComponent implements FilterComponent {
    items: { [id: string]: FilterMultiselectDropDownModel; };
    apply: (event) => void;
    value?: string;

    getItems(): string[] {
        return Object.keys(this.items);
    }

    valueChanged(event) {
        if (event && !event.value)
            event.component.option('value', []);
    }
}
