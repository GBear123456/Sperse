import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import { FilterMultipleCheckBoxesModel } from './filter-multiple-check-boxes.model';

@Component({
    templateUrl: './filter-multiple-check-boxes.component.html',
    styleUrls: ['./filter-multiple-check-boxes.component.less']
})
export class FilterMultipleCheckBoxesComponent implements FilterComponent {
    items: {
        element: FilterMultipleCheckBoxesModel
    };
    apply: (event) => void;
}
