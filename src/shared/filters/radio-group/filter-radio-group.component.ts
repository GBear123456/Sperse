import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import { FilterRadioGroupModel } from './filter-radio-group.model';

@Component({
    templateUrl: './filter-radio-group.component.html',
    styleUrls: ['./filter-radio-group.component.less']
})
export class FilterRadioGroupComponent implements FilterComponent {
    items: {
        element: FilterRadioGroupModel
    };
    apply: (event) => void;
}