import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import { FilterDropDownModel } from './filter-dropdown.model';

@Component({
    templateUrl: './filter-dropdown.component.html',
    styleUrls: ['./filter-dropdown.component.less']
})
export class FilterDropDownComponent implements FilterComponent {
    items: { [id: string]: FilterDropDownModel; };
    apply: (event) => void;
    value?: string;

    getItems(): string[] {
        return Object.keys(this.items);
    }
}
