import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import { FilterRadioGroupModel } from './filter-radio-group.model';

@Component({
    templateUrl: './filter-radio-group.component.html',
    styleUrls: ['./filter-radio-group.component.less']
})
export class FilterRadioGroupComponent implements FilterComponent {
    items: {
        [field: string]: FilterRadioGroupModel
    };
    apply: (event) => void;

    get field(): string {
        return Object.keys(this.items)[0];
    }
}