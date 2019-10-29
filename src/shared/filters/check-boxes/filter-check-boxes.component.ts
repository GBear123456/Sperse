import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import { FilterCheckBoxesModel } from './filter-check-boxes.model';

@Component({
    templateUrl: './filter-check-boxes.component.html',
    styleUrls: ['./filter-check-boxes.component.less']
})
export class FilterCheckBoxesComponent implements FilterComponent {
    items: {
        element: FilterCheckBoxesModel
    };
    apply: (event) => void;
}
